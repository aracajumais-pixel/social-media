import {
  BirthdayBackground,
  BirthdayCutoutRect,
  BirthdayElementSet,
  BirthdayPerson,
  BirthdayPhotoTransform,
} from '../types';

export const PORTUGUESE_MONTHS_SHORT = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
] as const;

export function formatBirthdayDay(day: number): string {
  const safeDay = Math.max(1, Math.min(31, Math.round(day || 1)));
  return String(safeDay).padStart(2, '0');
}

export function formatBirthdayMonthShort(month: number): string {
  const idx = Math.max(1, Math.min(12, Math.round(month || 1))) - 1;
  return PORTUGUESE_MONTHS_SHORT[idx] || 'JAN';
}

export function formatBirthdayDisplayName(name: string): string {
  const clean = (name || '').trim() || 'Aniversariante';
  return `${clean}!`;
}

export function formatBirthdayGreetingLines(name: string): [string, string] {
  return ['', formatBirthdayDisplayName(name)];
}

export function getDefaultElementSet(cutout: BirthdayCutoutRect): BirthdayElementSet {
  const cutoutBottom = cutout.y + cutout.height;
  const hasBottomRoom = 100 - cutoutBottom >= 24;
  const dateY = hasBottomRoom ? Math.max(12, cutout.y + 8) : 13;
  const nameY = hasBottomRoom ? Math.min(82, cutoutBottom + 9) : 74;
  const msgY = hasBottomRoom ? Math.min(92, cutoutBottom + 21) : 87;

  return {
    date: { xPct: 84, yPct: dateY, widthPct: 16, scale: 1, rotation: 0 },
    name: { xPct: 50, yPct: nameY, widthPct: 70, scale: 1, rotation: 0 },
    message: { xPct: 50, yPct: msgY, widthPct: 78, scale: 1, rotation: 0 },
  };
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Converte arquivo enviado para DataURL otimizado.
 * Quando preserveTransparency = true, gera PNG para manter canal alfa do recorte.
 */
export async function fileToOptimizedDataUrl(
  file: File,
  maxDimension: number = 1400,
  preserveTransparency: boolean = false
): Promise<{ dataUrl: string; width: number; height: number }> {
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await loadImageElement(rawUrl);
  const ratio = Math.min(1, maxDimension / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const targetW = Math.max(1, Math.round((img.naturalWidth || 1080) * ratio));
  const targetH = Math.max(1, Math.round((img.naturalHeight || 1080) * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: rawUrl, width: img.naturalWidth, height: img.naturalHeight };
  }

  ctx.clearRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const outputMime = preserveTransparency ? 'image/png' : 'image/jpeg';
  const quality = preserveTransparency ? undefined : 0.9;
  return {
    dataUrl: canvas.toDataURL(outputMime, quality),
    width: targetW,
    height: targetH,
  };
}

/**
 * Escaneia o canal alfa do PNG para detectar automaticamente o espaço transparente
 * onde o rosto da pessoa será enquadrado.
 */
export async function detectPngTransparentCutout(
  imageUrl: string
): Promise<{ cutoutRect: BirthdayCutoutRect; width: number; height: number }> {
  const fallback: BirthdayCutoutRect = { x: 20, y: 14, width: 60, height: 50 };
  try {
    const img = await loadImageElement(imageUrl);
    const naturalWidth = img.naturalWidth || 1080;
    const naturalHeight = img.naturalHeight || 1080;

    const scanScale = Math.min(1, 320 / Math.max(naturalWidth, naturalHeight));
    const sw = Math.max(24, Math.round(naturalWidth * scanScale));
    const sh = Math.max(24, Math.round(naturalHeight * scanScale));

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { cutoutRect: fallback, width: naturalWidth, height: naturalHeight };

    ctx.drawImage(img, 0, 0, sw, sh);
    const data = ctx.getImageData(0, 0, sw, sh).data;

    const isTransparent = new Uint8Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) {
      if (data[i * 4 + 3] < 45) {
        isTransparent[i] = 1;
      }
    }

    const visited = new Uint8Array(sw * sh);
    let bestArea = 0;
    let bestBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0, touchesBorder: true };
    let bestInteriorArea = 0;
    let bestInteriorBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    const queue = new Int32Array(sw * sh);

    for (let idx = 0; idx < sw * sh; idx++) {
      if (isTransparent[idx] === 1 && visited[idx] === 0) {
        let head = 0;
        let tail = 0;
        queue[tail++] = idx;
        visited[idx] = 1;

        let minX = sw;
        let maxX = 0;
        let minY = sh;
        let maxY = 0;
        let touchesBorder = false;
        let area = 0;

        while (head < tail) {
          const curr = queue[head++];
          const cx = curr % sw;
          const cy = Math.floor(curr / sw);
          area++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
          if (cx === 0 || cy === 0 || cx === sw - 1 || cy === sh - 1) {
            touchesBorder = true;
          }

          const neighbors = [
            cx > 0 ? curr - 1 : -1,
            cx < sw - 1 ? curr + 1 : -1,
            cy > 0 ? curr - sw : -1,
            cy < sh - 1 ? curr + sw : -1,
          ];
          for (const n of neighbors) {
            if (n >= 0 && isTransparent[n] === 1 && visited[n] === 0) {
              visited[n] = 1;
              queue[tail++] = n;
            }
          }
        }

        if (!touchesBorder && area > bestInteriorArea && area > sw * sh * 0.015) {
          bestInteriorArea = area;
          bestInteriorBounds = { minX, minY, maxX, maxY };
        }
        if (area > bestArea && area > sw * sh * 0.015) {
          bestArea = area;
          bestBounds = { minX, minY, maxX, maxY, touchesBorder };
        }
      }
    }

    const chosen = bestInteriorArea > 0 ? bestInteriorBounds : bestArea > 0 ? bestBounds : null;
    if (!chosen) {
      return { cutoutRect: fallback, width: naturalWidth, height: naturalHeight };
    }

    const cutoutRect: BirthdayCutoutRect = {
      x: Math.max(0, (chosen.minX / sw) * 100),
      y: Math.max(0, (chosen.minY / sh) * 100),
      width: Math.min(100, ((chosen.maxX - chosen.minX + 1) / sw) * 100),
      height: Math.min(100, ((chosen.maxY - chosen.minY + 1) / sh) * 100),
    };

    return { cutoutRect, width: naturalWidth, height: naturalHeight };
  } catch {
    return { cutoutRect: fallback, width: 1080, height: 1080 };
  }
}

/**
 * Calcula zoom e deslocamento da foto da pessoa para que o rosto fique
 * centralizado e enquadrado na janela transparente da moldura PNG.
 */
export function computeAutoFaceFraming(
  faceBox: { ymin: number; xmin: number; ymax: number; xmax: number },
  notes?: string
): BirthdayPhotoTransform {
  const faceCenterX = (faceBox.xmin + faceBox.xmax) / 20; // 0..100
  const faceCenterY = (faceBox.ymin + faceBox.ymax) / 20; // 0..100
  const faceHeightRatio = Math.max(0.15, (faceBox.ymax - faceBox.ymin) / 1000);
  const faceWidthRatio = Math.max(0.15, (faceBox.xmax - faceBox.xmin) / 1000);

  // Alvo: rosto ocupa cerca de 56% da altura da janela transparente, deixando cabelo e ombros
  const targetRatio = 0.56;
  const rawScale = targetRatio / Math.max(faceHeightRatio, faceWidthRatio * 0.9);
  const scale = Math.max(1.0, Math.min(2.4, Number(rawScale.toFixed(2))));

  const offsetX = Math.max(-45, Math.min(45, Number(((50 - faceCenterX) * 0.9).toFixed(1))));
  const offsetY = Math.max(-45, Math.min(45, Number(((48 - faceCenterY) * 0.9).toFixed(1))));

  return {
    scale,
    offsetX,
    offsetY,
    faceBox,
    aiFramed: true,
    notes,
  };
}

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    const leadingSpacesMatch = /^(\s+)/.exec(para);
    const leadingSpaces = leadingSpacesMatch ? leadingSpacesMatch[1] : '';
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }

    let current = leadingSpaces + words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${current} ${words[i]}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }
  return lines;
}

/**
 * Renderiza a arte final individual em alta resolução (PNG) combinando:
 * 1) Foto da pessoa enquadrada por trás da área transparente do PNG
 * 2) Plano de fundo PNG com janela transparente
 * 3) Os 3 objetos editáveis (Data, Nome manuscrito "{nome}!", Mensagem) sempre em PRETO (#000000).
 */
export async function renderBirthdayArtToDataUrl(params: {
  background: BirthdayBackground;
  person: BirthdayPerson;
  messageText: string;
}): Promise<string> {
  const { background, person, messageText } = params;

  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // ignora
    }
  }

  const bgImg = await loadImageElement(background.imageUrl);
  const canvasW = background.width || bgImg.naturalWidth || 1080;
  const canvasH = background.height || bgImg.naturalHeight || 1080;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível.');

  // Fundo branco base caso existam bordas suaves
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Camada 1: Foto da pessoa posicionada atrás do recorte transparente
  if (person.photoUrl) {
    try {
      const photoImg = await loadImageElement(person.photoUrl);
      const cutout = background.cutoutRect;
      const holeX = (cutout.x / 100) * canvasW;
      const holeY = (cutout.y / 100) * canvasH;
      const holeW = (cutout.width / 100) * canvasW;
      const holeH = (cutout.height / 100) * canvasH;

      // Margem extra leve para cobrir bordas serrilhadas da máscara transparente do PNG
      const padX = holeW * 0.14;
      const padY = holeH * 0.14;
      const boxX = Math.max(0, holeX - padX);
      const boxY = Math.max(0, holeY - padY);
      const boxW = Math.min(canvasW - boxX, holeW + padX * 2);
      const boxH = Math.min(canvasH - boxY, holeH + padY * 2);

      const pw = photoImg.naturalWidth || 800;
      const ph = photoImg.naturalHeight || 800;
      const baseCoverScale = Math.max(boxW / pw, boxH / ph);
      const userScale = person.photoTransform?.scale || 1;
      const drawW = pw * baseCoverScale * userScale;
      const drawH = ph * baseCoverScale * userScale;

      const offsetX = ((person.photoTransform?.offsetX || 0) / 100) * holeW;
      const offsetY = ((person.photoTransform?.offsetY || 0) / 100) * holeH;

      const drawX = boxX + (boxW - drawW) / 2 + offsetX;
      const drawY = boxY + (boxH - drawH) / 2 + offsetY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(boxX, boxY, boxW, boxH);
      ctx.clip();
      ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch (err) {
      console.warn('Erro ao desenhar foto do aniversariante:', err);
    }
  }

  // Camada 2: Plano de Fundo PNG por cima da foto
  ctx.drawImage(bgImg, 0, 0, canvasW, canvasH);

  // Camada 3: Objetos de Texto SEMPRE PRETOS (#000000)
  const elements = person.elementOverrides || background.defaultElements;
  const baseUnit = Math.min(canvasW, canvasH);

  // 3A: DATA (Número do dia em cima + 3 primeiras letras do mês em MAIÚSCULAS embaixo)
  {
    const el = elements.date;
    const cx = (el.xPct / 100) * canvasW;
    const cy = (el.yPct / 100) * canvasH;
    const dayStr = formatBirthdayDay(person.birthDay);
    const monthStr = formatBirthdayMonthShort(person.birthMonth);

    const dayFontSize = Math.round(baseUnit * 0.068 * el.scale);
    const monthFontSize = Math.round(baseUnit * 0.03 * el.scale);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `800 ${dayFontSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(dayStr, 0, -monthFontSize * 0.65);

    ctx.font = `800 ${monthFontSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(monthStr, 0, dayFontSize * 0.55);
    ctx.restore();
  }

  // 3B: NOME ("{nome}!" em fonte manuscrita)
  {
    const el = elements.name;
    const cx = (el.xPct / 100) * canvasW;
    const cy = (el.yPct / 100) * canvasH;
    const maxW = (el.widthPct / 100) * canvasW;
    const fontSize = Math.round(baseUnit * 0.056 * el.scale);
    const displayName = formatBirthdayDisplayName(person.name);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${fontSize}px "Dancing Script", cursive`;

    const allLines = wrapTextLines(ctx, displayName, maxW);
    const lineHeight = fontSize * 1.12;
    const totalHeight = allLines.length * lineHeight;
    let startY = -totalHeight / 2 + lineHeight / 2;

    for (const ln of allLines) {
      ctx.fillText(ln, 0, startY, maxW);
      startY += lineHeight;
    }
    ctx.restore();
  }

  // 3C: MENSAGEM DE PARABÉNS
  if (messageText.trim()) {
    const el = elements.message;
    const cx = (el.xPct / 100) * canvasW;
    const cy = (el.yPct / 100) * canvasH;
    const maxW = (el.widthPct / 100) * canvasW;
    const fontSize = Math.round(baseUnit * 0.026 * el.scale);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;

    const lines = wrapTextLines(ctx, messageText, maxW);
    const lineHeight = fontSize * 1.32;
    const totalHeight = lines.length * lineHeight;
    let startY = -totalHeight / 2 + lineHeight / 2;

    for (const ln of lines) {
      ctx.fillText(ln, 0, startY);
      startY += lineHeight;
    }
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

/**
 * Gera um modelo de exemplo de PNG com abertura transparente para demonstração inicial,
 * caso o usuário ainda não tenha enviado nenhum plano de fundo próprio.
 */
export function createSampleTransparentFrameDataUrl(): string {
  const size = 900;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fundo bege/marfim suave festivo
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#fdf8f0');
  grad.addColorStop(1, '#f4ead8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Moldura ornamental sutil nas bordas
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, size - 48, size - 48);

  // Recorte transparente central superior (onde aparece o rosto da pessoa)
  const holeX = size * 0.22;
  const holeY = size * 0.11;
  const holeW = size * 0.56;
  const holeH = size * 0.48;
  const radius = 36;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.roundRect(holeX, holeY, holeW, holeH, radius);
  ctx.fill();
  ctx.restore();

  // Contorno dourado ao redor da janela transparente
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(holeX, holeY, holeW, holeH, radius);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}
