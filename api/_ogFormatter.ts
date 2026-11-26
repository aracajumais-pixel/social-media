import sharp from 'sharp';

export const OG_IMAGE_WIDTH = 900;
export const OG_IMAGE_HEIGHT = 1200;
const MAX_WHATSAPP_OG_BYTES = 280 * 1024;

/**
 * Converte qualquer imagem (1:1, 16:9, 4:5, 9:16, PNG, WebP, JPG) para o padrão
 * vertical 3:4 (900x1200) JPEG leve (< 280 KB), garantindo que o WhatsApp exiba
 * o cartão grande com a foto em destaque no topo (estilo Instagram) em vez da
 * miniatura quadrada compacta na lateral.
 */
export async function formatOgImageTo3x4Jpeg(
  inputBuffer: Buffer,
  fallbackContentType = 'image/jpeg'
): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    const base = sharp(inputBuffer, { failOn: 'none' }).rotate();
    const meta = await base.metadata();
    const srcW = meta.width || OG_IMAGE_WIDTH;
    const srcH = meta.height || OG_IMAGE_HEIGHT;
    const srcAspect = srcW / Math.max(1, srcH);

    let composed: ReturnType<typeof sharp>;

    if (srcAspect <= 0.9) {
      // Mídia já vertical (3:4, 4:5, 9:16): preenche 900x1200 em tela cheia com foco inteligente
      composed = sharp(inputBuffer, { failOn: 'none' })
        .rotate()
        .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
          fit: 'cover',
          position: 'attention',
        });
    } else {
      // Mídia quadrada (1:1) ou horizontal (16:9): fundo ambiente desfocado + arte inteira preservada no centro
      const blurredBackdrop = await sharp(inputBuffer, { failOn: 'none' })
        .rotate()
        .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
          fit: 'cover',
          position: 'centre',
        })
        .blur(26)
        .modulate({ brightness: 0.72, saturation: 1.05 })
        .toBuffer();

      const foreground = await sharp(inputBuffer, { failOn: 'none' })
        .rotate()
        .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: false,
        })
        .toBuffer();

      composed = sharp(blurredBackdrop).composite([
        {
          input: foreground,
          gravity: 'centre',
        },
      ]);
    }

    const flattened = composed.flatten({ background: '#111b21' });
    let outBuffer = await flattened
      .clone()
      .jpeg({ quality: 84, progressive: true, mozjpeg: true })
      .toBuffer();

    if (outBuffer.length > MAX_WHATSAPP_OG_BYTES) {
      outBuffer = await flattened
        .clone()
        .jpeg({ quality: 72, progressive: true, mozjpeg: true })
        .toBuffer();
    }

    if (outBuffer.length > MAX_WHATSAPP_OG_BYTES) {
      outBuffer = await flattened
        .clone()
        .jpeg({ quality: 60, progressive: true, mozjpeg: true })
        .toBuffer();
    }

    return { buffer: outBuffer, contentType: 'image/jpeg' };
  } catch {
    return { buffer: inputBuffer, contentType: fallbackContentType };
  }
}
