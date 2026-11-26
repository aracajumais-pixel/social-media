import sharp from 'sharp';

export const OG_IMAGE_WIDTH = 600;
export const OG_IMAGE_HEIGHT = 800;
const MAX_WHATSAPP_OG_BYTES = 180 * 1024;

/**
 * Converte qualquer imagem (1:1, 16:9, 4:5, 9:16, PNG, WebP, JPG) para o padrão
 * vertical 3:4 em menor resolução (600x800) JPEG leve (< 180 KB), garantindo que o
 * WhatsApp exiba o cartão grande com a foto em destaque no topo (estilo Instagram).
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
      composed = sharp(inputBuffer, { failOn: 'none' })
        .rotate()
        .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
          fit: 'cover',
          position: 'attention',
        });
    } else {
      const blurredBackdrop = await sharp(inputBuffer, { failOn: 'none' })
        .rotate()
        .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
          fit: 'cover',
          position: 'centre',
        })
        .blur(20)
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
      .jpeg({ quality: 78, progressive: true, mozjpeg: true })
      .toBuffer();

    if (outBuffer.length > MAX_WHATSAPP_OG_BYTES) {
      outBuffer = await flattened
        .clone()
        .jpeg({ quality: 66, progressive: true, mozjpeg: true })
        .toBuffer();
    }

    if (outBuffer.length > MAX_WHATSAPP_OG_BYTES) {
      outBuffer = await flattened
        .clone()
        .jpeg({ quality: 54, progressive: true, mozjpeg: true })
        .toBuffer();
    }

    return { buffer: outBuffer, contentType: 'image/jpeg' };
  } catch {
    return { buffer: inputBuffer, contentType: fallbackContentType };
  }
}
