import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';
const DATA_DIR = path.join(__dirname, '.data');
const STATE_FILE = path.join(DATA_DIR, 'app-state.json');

let stateWriteQueue: Promise<void> = Promise.resolve();

async function readSharedState(): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeSharedStatePatch(patch: Record<string, any>): Promise<Record<string, any>> {
  let result: Record<string, any> = {};
  stateWriteQueue = stateWriteQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const current = await readSharedState();
    result = {
      ...current,
      ...patch,
      _updatedAt: new Date().toISOString(),
    };
    const tmpFile = `${STATE_FILE}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(result), 'utf8');
    await fs.rename(tmpFile, STATE_FILE);
  });
  await stateWriteQueue;
  return result;
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function stripDataUrlPrefix(input: string): { mimeType: string; data: string } {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(input.trim());
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/png', data: input.trim() };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '30mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, geminiConfigured: !!getGenAIClient() });
  });

  /**
   * Persistência compartilhada no servidor para sincronização entre computadores
   * (complementa o Supabase quando offline ou antes de criar tabelas opcionais).
   */
  app.get('/api/sync-state', async (_req, res) => {
    try {
      const state = await readSharedState();
      res.json({ ok: true, state });
    } catch (err) {
      console.error('Error reading shared state:', err);
      res.json({ ok: false, state: {} });
    }
  });

  app.post('/api/sync-state', async (req, res) => {
    try {
      const patch = req.body || {};
      if (typeof patch !== 'object' || Array.isArray(patch)) {
        return res.status(400).json({ ok: false, error: 'Invalid state payload' });
      }
      const allowedKeys = new Set([
        'clients',
        'socialMedias',
        'posts',
        'tasks',
        'inspirations',
        'receipts',
        'approvalRecords',
        'birthdayBackgrounds',
        'birthdayGroups',
        'birthdayMessages',
        'birthdayPeople',
        'birthdayAuditLogs',
      ]);
      const filtered: Record<string, any> = {};
      for (const [k, v] of Object.entries(patch)) {
        if (allowedKeys.has(k)) {
          filtered[k] = v;
        }
      }
      await writeSharedStatePatch(filtered);
      res.json({ ok: true });
    } catch (err) {
      console.error('Error writing shared state:', err);
      res.status(500).json({ ok: false, error: 'Failed to persist state' });
    }
  });

  /**
   * Analisa a foto da pessoa enviada e calcula o enquadramento ideal do rosto
   * dentro da área transparente (cutoutRect) do plano de fundo PNG.
   */
  app.post('/api/birthdays/analyze-framing', async (req, res) => {
    try {
      const { personPhotoBase64, personPhotoMimeType, cutoutRect } = req.body || {};

      if (!personPhotoBase64) {
        return res.status(400).json({ error: 'personPhotoBase64 is required' });
      }

      const ai = getGenAIClient();
      if (!ai) {
        return res.json({
          ok: true,
          source: 'fallback',
          faceBox: { ymin: 120, xmin: 280, ymax: 620, xmax: 720 },
          centerX: 50,
          centerY: 37,
          confidence: 0.5,
          notes: 'Centralização automática aplicada.',
        });
      }

      const parsed = stripDataUrlPrefix(personPhotoBase64);
      const mimeType = personPhotoMimeType || parsed.mimeType || 'image/jpeg';

      const cutoutInfo = cutoutRect
        ? `Transparent frame opening (percentage of frame): x=${cutoutRect.x.toFixed(1)}%, y=${cutoutRect.y.toFixed(1)}%, width=${cutoutRect.width.toFixed(1)}%, height=${cutoutRect.height.toFixed(1)}%.`
        : 'Standard centered portrait opening.';

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          {
            inlineData: {
              mimeType,
              data: parsed.data,
            },
          },
          `Analyze this portrait photo for a birthday frame composite.
${cutoutInfo}
Locate the primary person's head/face (from top of hair/head down to chin/upper shoulders) in normalized 0..1000 coordinates [ymin, xmin, ymax, xmax].
If there are multiple people, find the bounding box that keeps the main person's face centered and well framed without cropping the forehead or chin.
Also provide centerX (0-100 percentage of photo width) and centerY (0-100 percentage of photo height) representing the ideal focal center between the eyes/nose bridge.`,
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ymin: { type: Type.NUMBER, description: 'Top of head in 0..1000' },
              xmin: { type: Type.NUMBER, description: 'Left of face in 0..1000' },
              ymax: { type: Type.NUMBER, description: 'Chin/neck bottom in 0..1000' },
              xmax: { type: Type.NUMBER, description: 'Right of face in 0..1000' },
              centerX: { type: Type.NUMBER, description: 'Focal center X in 0..100 percent' },
              centerY: { type: Type.NUMBER, description: 'Focal center Y in 0..100 percent' },
              notes: { type: Type.STRING, description: 'Brief Portuguese framing observation' },
            },
            required: ['ymin', 'xmin', 'ymax', 'xmax', 'centerX', 'centerY'],
          },
        },
      });

      const raw = response.text || '{}';
      const parsedJson = JSON.parse(raw);

      const ymin = clamp(Number(parsedJson.ymin ?? 120), 0, 950);
      const xmin = clamp(Number(parsedJson.xmin ?? 250), 0, 950);
      const ymax = clamp(Number(parsedJson.ymax ?? 650), ymin + 50, 1000);
      const xmax = clamp(Number(parsedJson.xmax ?? 750), xmin + 50, 1000);

      const centerX = clamp(Number(parsedJson.centerX ?? ((xmin + xmax) / 20)), 5, 95);
      const centerY = clamp(Number(parsedJson.centerY ?? ((ymin + ymax) / 20)), 5, 95);

      return res.json({
        ok: true,
        source: 'gemini',
        faceBox: { ymin, xmin, ymax, xmax },
        centerX,
        centerY,
        notes: parsedJson.notes || 'Rosto detectado e enquadrado pela IA.',
      });
    } catch (error) {
      console.error('Error in /api/birthdays/analyze-framing:', error);
      return res.json({
        ok: true,
        source: 'fallback',
        faceBox: { ymin: 120, xmin: 280, ymax: 620, xmax: 720 },
        centerX: 50,
        centerY: 37,
        notes: 'Centralização padrão aplicada após contingência.',
      });
    }
  });

  /**
   * Analisa o plano de fundo PNG com janela transparente para evitar colocar
   * Data, Nome ("Parabéns, {nome}!") ou Mensagem em cima de elementos gráficos do fundo
   * ou dentro do recorte transparente da foto.
   */
  app.post('/api/birthdays/analyze-background', async (req, res) => {
    try {
      const { backgroundBase64, backgroundMimeType, cutoutRect } = req.body || {};

      if (!backgroundBase64) {
        return res.status(400).json({ error: 'backgroundBase64 is required' });
      }

      const safeCutout = cutoutRect || { x: 20, y: 15, width: 60, height: 50 };
      const fallbackLayout = buildSmartFallbackLayout(safeCutout);

      const ai = getGenAIClient();
      if (!ai) {
        return res.json({
          ok: true,
          source: 'fallback',
          elements: fallbackLayout,
          notes: 'Posicionamento seguro calculado ao redor da área da foto.',
        });
      }

      const parsed = stripDataUrlPrefix(backgroundBase64);
      const mimeType = backgroundMimeType || parsed.mimeType || 'image/png';

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          {
            inlineData: {
              mimeType,
              data: parsed.data,
            },
          },
          `You are a graphic design layout expert analyzing a PNG birthday frame template.
Notice the image has a transparent cutout window where the birthday person's portrait photo will sit:
Cutout box (in % of width/height): x=${safeCutout.x.toFixed(1)}%, y=${safeCutout.y.toFixed(1)}%, width=${safeCutout.width.toFixed(1)}%, height=${safeCutout.height.toFixed(1)}%.
Visual elements (decorations, borders, logos, parish emblems, balloons, confetti, ribbons, pre-printed titles) already exist on the opaque parts of this PNG.

We need to place 3 BLACK-text elements cleanly on open, uncluttered areas of this template WITHOUT overlapping:
1) any pre-existing graphic/text/decoration/logo on the PNG background,
2) the transparent photo cutout window, or
3) each other.

The 3 elements (coordinates are CENTER X% and CENTER Y% from 0 to 100 of the canvas, plus recommended widthPct and scale 0.6..1.5):
1. "date": A compact stacked date badge (e.g., "14" on top and "NOV" below). Needs ~12-18% widthPct.
2. "name": Handwritten greeting "Parabéns, {Nome}!". Needs ~45-70% widthPct.
3. "message": Congratulatory paragraph (~12-20 words). Needs ~55-78% widthPct.

Inspect the PNG carefully and return the safest open coordinates (xPct, yPct, widthPct, scale, rotation=0) for each of the 3 objects so all text stays legible, black (#000000), and never covers decorations or the photo opening.`,
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: {
                type: Type.OBJECT,
                properties: {
                  xPct: { type: Type.NUMBER },
                  yPct: { type: Type.NUMBER },
                  widthPct: { type: Type.NUMBER },
                  scale: { type: Type.NUMBER },
                  rotation: { type: Type.NUMBER },
                },
                required: ['xPct', 'yPct', 'widthPct', 'scale', 'rotation'],
              },
              name: {
                type: Type.OBJECT,
                properties: {
                  xPct: { type: Type.NUMBER },
                  yPct: { type: Type.NUMBER },
                  widthPct: { type: Type.NUMBER },
                  scale: { type: Type.NUMBER },
                  rotation: { type: Type.NUMBER },
                },
                required: ['xPct', 'yPct', 'widthPct', 'scale', 'rotation'],
              },
              message: {
                type: Type.OBJECT,
                properties: {
                  xPct: { type: Type.NUMBER },
                  yPct: { type: Type.NUMBER },
                  widthPct: { type: Type.NUMBER },
                  scale: { type: Type.NUMBER },
                  rotation: { type: Type.NUMBER },
                },
                required: ['xPct', 'yPct', 'widthPct', 'scale', 'rotation'],
              },
              notes: { type: Type.STRING, description: 'Resumo curto em português das áreas livres identificadas' },
            },
            required: ['date', 'name', 'message'],
          },
        },
      });

      const raw = response.text || '{}';
      const json = JSON.parse(raw);

      const sanitizeObj = (item: any, def: any) => ({
        xPct: clamp(Number(item?.xPct ?? def.xPct), 8, 92),
        yPct: clamp(Number(item?.yPct ?? def.yPct), 6, 94),
        widthPct: clamp(Number(item?.widthPct ?? def.widthPct), 12, 88),
        scale: clamp(Number(item?.scale ?? def.scale), 0.55, 1.8),
        rotation: clamp(Number(item?.rotation ?? 0), -45, 45),
      });

      return res.json({
        ok: true,
        source: 'gemini',
        elements: {
          date: sanitizeObj(json.date, fallbackLayout.date),
          name: sanitizeObj(json.name, fallbackLayout.name),
          message: sanitizeObj(json.message, fallbackLayout.message),
        },
        notes: json.notes || 'Áreas livres do plano de fundo analisadas pela IA sem sobreposição.',
      });
    } catch (error) {
      console.error('Error in /api/birthdays/analyze-background:', error);
      const safeCutout = req.body?.cutoutRect || { x: 20, y: 15, width: 60, height: 50 };
      return res.json({
        ok: true,
        source: 'fallback',
        elements: buildSmartFallbackLayout(safeCutout),
        notes: 'Posicionamento seguro aplicado ao redor do recorte da foto.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

function buildSmartFallbackLayout(cutout: { x: number; y: number; width: number; height: number }) {
  const cutoutTop = cutout.y;
  const cutoutBottom = cutout.y + cutout.height;
  const spaceBelow = 100 - cutoutBottom;
  const spaceAbove = cutoutTop;

  if (spaceBelow >= 28) {
    return {
      date: { xPct: 84, yPct: Math.max(12, cutoutTop + 8), widthPct: 16, scale: 1, rotation: 0 },
      name: { xPct: 50, yPct: Math.min(82, cutoutBottom + 10), widthPct: 68, scale: 1, rotation: 0 },
      message: { xPct: 50, yPct: Math.min(92, cutoutBottom + 23), widthPct: 76, scale: 1, rotation: 0 },
    };
  }

  if (spaceAbove >= 28) {
    return {
      date: { xPct: 84, yPct: Math.max(12, spaceAbove * 0.45), widthPct: 16, scale: 1, rotation: 0 },
      name: { xPct: 45, yPct: Math.max(12, spaceAbove * 0.45), widthPct: 58, scale: 1, rotation: 0 },
      message: { xPct: 50, yPct: Math.min(92, cutoutBottom + 8), widthPct: 76, scale: 1, rotation: 0 },
    };
  }

  return {
    date: { xPct: 84, yPct: 14, widthPct: 16, scale: 1, rotation: 0 },
    name: { xPct: 50, yPct: 74, widthPct: 66, scale: 1, rotation: 0 },
    message: { xPct: 50, yPct: 88, widthPct: 76, scale: 1, rotation: 0 },
  };
}

startServer();
