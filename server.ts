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

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getRequestOrigin(req: express.Request): string {
  const protoHeader = req.headers['x-forwarded-proto'];
  const rawProto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader)?.split(',')[0]?.trim();
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
  const host = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader)?.split(',')[0]?.trim() || '';
  const isLocal = !host || /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(host);

  if (!isLocal && host) {
    const proto = rawProto || 'https';
    return `${proto}://${host}`;
  }

  const envUrl = (process.env.APP_URL || '').trim();
  if (envUrl && envUrl !== 'MY_APP_URL' && /^https?:\/\//i.test(envUrl)) {
    return envUrl.replace(/\/+$/, '');
  }

  return host ? `${rawProto || req.protocol || 'http'}://${host}` : '';
}

function extractDriveFileId(url: string): string | null {
  const match = url.match(/(?:\/file\/d\/|\/d\/|[?&]id=)([a-zA-Z0-9_-]{20,})/);
  return match?.[1] || null;
}

async function fetchImageBuffer(url: string, timeoutMs = 5000): Promise<{ buffer: Buffer; contentType: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SocialMedia5Preview/1.0)',
        Accept: 'image/jpeg,image/png,image/webp,image/*,*/*;q=0.8',
      },
    });
    if (!resp.ok) return null;
    const ct = (resp.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!ct.startsWith('image/') || ct === 'image/svg+xml') return null;
    const arrBuf = await resp.arrayBuffer();
    if (!arrBuf || arrBuf.byteLength === 0 || arrBuf.byteLength > 5 * 1024 * 1024) return null;
    return { buffer: Buffer.from(arrBuf), contentType: ct };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function sendFallbackOgImage(res: express.Response) {
  const candidates = [
    path.join(__dirname, 'public', 'og-default.jpg'),
    path.join(__dirname, 'dist', 'og-default.jpg'),
    path.join(__dirname, 'public', 'favicon.jpg'),
    path.join(__dirname, 'dist', 'favicon.jpg'),
  ];
  for (const filePath of candidates) {
    try {
      const buf = await fs.readFile(filePath);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', String(buf.length));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(buf);
    } catch {
      // try next candidate
    }
  }
  return res.status(404).end();
}

async function serveOgImageFromMediaUrl(mediaUrl: string | undefined, res: express.Response) {
  const url = (mediaUrl || '').trim();
  if (!url) {
    return sendFallbackOgImage(res);
  }

  // 1. Data URI base64 (ex.: artes de aniversariantes ou uploads inline)
  if (url.startsWith('data:image/')) {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(url);
    if (match && match[1].toLowerCase() !== 'image/svg+xml') {
      const buf = Buffer.from(match[2], 'base64');
      res.setHeader('Content-Type', match[1]);
      res.setHeader('Content-Length', String(buf.length));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(buf);
    }
    return sendFallbackOgImage(res);
  }

  // 2. Caminho local estático (/assets/..., /og-default.jpg, etc.)
  if (url.startsWith('/') && !url.startsWith('//')) {
    const cleanRel = url.split('?')[0].replace(/^\/+/, '');
    const localCandidates = [
      path.join(__dirname, 'public', cleanRel),
      path.join(__dirname, 'dist', cleanRel),
    ];
    for (const filePath of localCandidates) {
      try {
        const buf = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const ct = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        res.setHeader('Content-Type', ct);
        res.setHeader('Content-Length', String(buf.length));
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(buf);
      } catch {
        // continue
      }
    }
    return sendFallbackOgImage(res);
  }

  // 3. Links do Google Drive (tenta thumbnail de alta resolução primeiro — funciona para imagem e vídeo!)
  if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
    const driveId = extractDriveFileId(url);
    if (driveId) {
      const driveCandidates = [
        `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`,
        `https://lh3.googleusercontent.com/d/${driveId}=w1200`,
        `https://drive.google.com/uc?export=view&id=${driveId}`,
      ];
      for (const candidate of driveCandidates) {
        const fetched = await fetchImageBuffer(candidate);
        if (fetched) {
          res.setHeader('Content-Type', fetched.contentType);
          res.setHeader('Content-Length', String(fetched.buffer.length));
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.status(200).send(fetched.buffer);
        }
      }
    }
    return sendFallbackOgImage(res);
  }

  // 4. Outras URLs HTTPS/HTTP (Supabase Storage, Unsplash, CDNs)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const fetched = await fetchImageBuffer(url);
    if (fetched) {
      res.setHeader('Content-Type', fetched.contentType);
      res.setHeader('Content-Length', String(fetched.buffer.length));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(fetched.buffer);
    }
  }

  return sendFallbackOgImage(res);
}

async function findPostAndClientByToken(token: string): Promise<{
  post: { id: string; title: string; caption: string; mediaUrl: string; clientProjectId?: string; approvalToken?: string } | null;
  clientName?: string;
}> {
  // 1. Busca no estado compartilhado local (.data/app-state.json)
  const state = await readSharedState();
  const postsArr: any[] = Array.isArray(state?.posts) ? state.posts : [];
  const clientsArr: any[] = Array.isArray(state?.clients) ? state.clients : [];
  const matched = postsArr.find((p) => p?.approvalToken === token);
  if (matched) {
    const clientObj = clientsArr.find((c) => c?.id === matched.clientProjectId);
    return {
      post: {
        id: matched.id,
        title: matched.title || 'Publicação para Aprovação',
        caption: matched.caption || '',
        mediaUrl: matched.mediaUrl || '',
        clientProjectId: matched.clientProjectId,
        approvalToken: matched.approvalToken,
      },
      clientName: clientObj?.name,
    };
  }

  // 2. Fallback: busca no Supabase REST API se variáveis estiverem configuradas no ambiente
  const sbUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const sbKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (sbUrl && sbKey) {
    try {
      const resp = await fetch(
        `${sbUrl}/rest/v1/posts?approval_token=eq.${encodeURIComponent(token)}&select=id,title,caption,media_url,client_project_id,approval_token&limit=1`,
        {
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
          },
        }
      );
      if (resp.ok) {
        const rows: any[] = await resp.json();
        if (rows && rows[0]) {
          const row = rows[0];
          let clientName: string | undefined;
          if (row.client_project_id) {
            const cResp = await fetch(
              `${sbUrl}/rest/v1/clients?id=eq.${encodeURIComponent(row.client_project_id)}&select=name&limit=1`,
              {
                headers: {
                  apikey: sbKey,
                  Authorization: `Bearer ${sbKey}`,
                },
              }
            );
            if (cResp.ok) {
              const cRows: any[] = await cResp.json();
              clientName = cRows?.[0]?.name;
            }
          }
          return {
            post: {
              id: row.id,
              title: row.title || 'Publicação para Aprovação',
              caption: row.caption || '',
              mediaUrl: row.media_url || '',
              clientProjectId: row.client_project_id,
              approvalToken: row.approval_token,
            },
            clientName,
          };
        }
      }
    } catch (err) {
      console.warn('Supabase OG lookup warning:', err);
    }
  }

  return { post: null };
}

async function findClientMuralById(clientId: string): Promise<{
  name: string;
  previewImageUrl: string;
  postsCount: number;
} | null> {
  const state = await readSharedState();
  const clientsArr: any[] = Array.isArray(state?.clients) ? state.clients : [];
  const postsArr: any[] = Array.isArray(state?.posts) ? state.posts : [];
  const client = clientsArr.find((c) => c?.id === clientId);
  if (client) {
    const clientPosts = postsArr.filter((p) => p?.clientProjectId === clientId);
    const firstWithImage = clientPosts.find((p) => p?.mediaUrl);
    return {
      name: client.name || 'Cliente',
      previewImageUrl: firstWithImage?.mediaUrl || client.logoUrl || '',
      postsCount: clientPosts.length,
    };
  }

  const sbUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const sbKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (sbUrl && sbKey) {
    try {
      const cResp = await fetch(
        `${sbUrl}/rest/v1/clients?id=eq.${encodeURIComponent(clientId)}&select=id,name,logo_url&limit=1`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
      );
      if (cResp.ok) {
        const cRows: any[] = await cResp.json();
        if (cRows?.[0]) {
          const pResp = await fetch(
            `${sbUrl}/rest/v1/posts?client_project_id=eq.${encodeURIComponent(clientId)}&select=media_url&order=created_at.desc&limit=5`,
            { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
          );
          let postImg = '';
          let postsCount = 0;
          if (pResp.ok) {
            const pRows: any[] = await pResp.json();
            postsCount = pRows.length;
            postImg = pRows.find((p) => p?.media_url)?.media_url || '';
          }
          return {
            name: cRows[0].name || 'Cliente',
            previewImageUrl: postImg || cRows[0].logo_url || '',
            postsCount,
          };
        }
      }
    } catch (err) {
      console.warn('Supabase client OG lookup warning:', err);
    }
  }

  return null;
}

function injectOpenGraphMetaTags(
  html: string,
  meta: {
    title: string;
    description: string;
    url: string;
    imageUrl: string;
    siteName?: string;
    origin?: string;
  }
): string {
  const safeTitle = escapeHtmlAttr(meta.title);
  const safeDesc = escapeHtmlAttr(meta.description);
  const safeUrl = escapeHtmlAttr(meta.url);
  const safeImage = escapeHtmlAttr(meta.imageUrl);
  const safeSiteName = escapeHtmlAttr(meta.siteName || 'Social Media 5.0');
  const iconUrl = escapeHtmlAttr(meta.origin ? `${meta.origin}/favicon.jpg` : '/favicon.jpg');

  // Remove tags antigas para evitar duplicidade ao injetar no topo do <head>
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+[^>]*name=["']description["'][^>]*\/?>/gi, '')
    .replace(/<meta\s+[^>]*property=["']og:[^"']+["'][^>]*\/?>/gi, '')
    .replace(/<meta\s+[^>]*name=["']twitter:[^"']+["'][^>]*\/?>/gi, '')
    .replace(/<link\s+[^>]*rel=["']canonical["'][^>]*\/?>/gi, '');

  // Garante URLs absolutas nos ícones para que WhatsApp mostre o ícone do site na barra inferior do card
  if (meta.origin) {
    out = out
      .replace(/href=["']\/favicon\.jpg["']/gi, `href="${iconUrl}"`)
      .replace(/href=["']\/favicon\.svg["']/gi, `href="${escapeHtmlAttr(`${meta.origin}/favicon.svg`)}"`);
  }

  const block = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDesc}" />`,
    `<link rel="canonical" href="${safeUrl}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${safeSiteName}" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDesc}" />`,
    `<meta property="og:url" content="${safeUrl}" />`,
    `<meta property="og:image" content="${safeImage}" />`,
    `<meta property="og:image:secure_url" content="${safeImage}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
    `<meta name="twitter:image" content="${safeImage}" />`,
  ].join('\n    ');

  if (/<meta\s+name=["']viewport["'][^>]*>/i.test(out)) {
    return out.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i, `$1\n    ${block}`);
  }
  return out.replace(/<head>/i, `<head>\n    ${block}`);
}

async function buildEnrichedHtmlForRequest(
  baseHtml: string,
  req: express.Request,
  explicitToken?: string,
  explicitClientId?: string
): Promise<string> {
  const origin = getRequestOrigin(req);
  const queryToken =
    typeof req.query.token === 'string'
      ? req.query.token.trim()
      : typeof req.query.approvalToken === 'string'
        ? req.query.approvalToken.trim()
        : '';
  const token = (explicitToken || queryToken || '').trim();

  if (token) {
    const { post, clientName } = await findPostAndClientByToken(token);
    const canonicalPath = `/p/${encodeURIComponent(token)}`;
    const shareUrl = origin ? `${origin}${canonicalPath}` : canonicalPath;
    const ogImage = origin
      ? `${origin}/api/og-image/${encodeURIComponent(token)}.jpg`
      : `/api/og-image/${encodeURIComponent(token)}.jpg`;

    if (post) {
      const titleText = clientName
        ? `${clientName}: "${post.title}"`
        : `${post.title} — Social Media 5.0`;
      const rawDesc = (post.caption || 'Clique no cartão para visualizar a arte, comentar ou aprovar esta publicação.')
        .replace(/\s+/g, ' ')
        .trim();
      const descText = rawDesc.length > 220 ? `${rawDesc.slice(0, 217)}...` : rawDesc;

      return injectOpenGraphMetaTags(baseHtml, {
        title: titleText,
        description: descText,
        url: shareUrl,
        imageUrl: ogImage,
        siteName: clientName ? `${clientName} • Social Media 5.0` : 'Social Media 5.0',
        origin,
      });
    }

    return injectOpenGraphMetaTags(baseHtml, {
      title: 'Aprovação de Publicação — Social Media 5.0',
      description: 'Clique para visualizar a arte, conferir a legenda e aprovar ou solicitar ajustes.',
      url: shareUrl,
      imageUrl: origin ? `${origin}/og-default.jpg` : '/og-default.jpg',
      siteName: 'Social Media 5.0',
      origin,
    });
  }

  const queryClientParam = typeof req.query.client === 'string' ? req.query.client.trim() : '';
  const clientParam = (explicitClientId || queryClientParam || '').trim();
  if (clientParam) {
    const mural = await findClientMuralById(clientParam);
    const smParam = typeof req.query.sm === 'string' ? req.query.sm.trim() : '';
    const querySuffix = smParam
      ? `/mural/${encodeURIComponent(clientParam)}?sm=${encodeURIComponent(smParam)}`
      : `/mural/${encodeURIComponent(clientParam)}`;
    const shareUrl = origin ? `${origin}${querySuffix}` : querySuffix;
    const ogImage = origin
      ? `${origin}/api/og-client-image/${encodeURIComponent(clientParam)}.jpg`
      : `/api/og-client-image/${encodeURIComponent(clientParam)}.jpg`;

    return injectOpenGraphMetaTags(baseHtml, {
      title: mural ? `Mural de Aprovações — ${mural.name}` : 'Mural Exclusivo de Aprovações — Social Media 5.0',
      description: mural
        ? `Acesse o Mural Exclusivo de ${mural.name} para visualizar publicações, conferir legendas e aprovar conteúdos online.`
        : 'Acesse seu Mural Exclusivo de Posts & Aprovações online no Social Media 5.0.',
      url: shareUrl,
      imageUrl: ogImage,
      siteName: mural ? `${mural.name} • Social Media 5.0` : 'Social Media 5.0',
      origin,
    });
  }

  const defaultUrl = origin ? `${origin}/` : '/';
  const defaultImage = origin ? `${origin}/og-default.jpg` : '/og-default.jpg';
  return injectOpenGraphMetaTags(baseHtml, {
    title: 'Social Media 5.0 — Gestão & Aprovação de Conteúdo',
    description: 'Plataforma centralizada Social Media 5.0 para aprovação de posts, comentários em debate, inspirações, recibos em PDF e gestão de aniversariantes.',
    url: defaultUrl,
    imageUrl: defaultImage,
    siteName: 'Social Media 5.0',
    origin,
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '30mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, geminiConfigured: !!getGenAIClient() });
  });

  /**
   * Serve a imagem de preview (og:image) para links de aprovação (/p/:token e /?token=...)
   * convertendo base64, links do Google Drive ou URLs remotas diretamente para HTTP image/*
   * com fallback garantido para que o WhatsApp sempre renderize o card completo.
   */
  app.get('/api/og-image/:token', async (req, res) => {
    try {
      const rawToken = String(req.params.token || '').trim();
      const token = rawToken.replace(/\.(jpg|jpeg|png|webp)$/i, '');
      if (!token) return sendFallbackOgImage(res);
      const { post } = await findPostAndClientByToken(token);
      return await serveOgImageFromMediaUrl(post?.mediaUrl, res);
    } catch (err) {
      console.error('Error serving /api/og-image:', err);
      return sendFallbackOgImage(res);
    }
  });

  app.get('/api/og-client-image/:clientId', async (req, res) => {
    try {
      const rawId = String(req.params.clientId || '').trim();
      const clientId = rawId.replace(/\.(jpg|jpeg|png|webp)$/i, '');
      if (!clientId) return sendFallbackOgImage(res);
      const mural = await findClientMuralById(clientId);
      return await serveOgImageFromMediaUrl(mural?.previewImageUrl, res);
    } catch (err) {
      console.error('Error serving /api/og-client-image:', err);
      return sendFallbackOgImage(res);
    }
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

    const serveDevWithOg = async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
      explicitToken?: string,
      explicitClientId?: string
    ) => {
      try {
        const baseHtml = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');
        const transformed = await vite.transformIndexHtml('/', baseHtml);
        const enriched = await buildEnrichedHtmlForRequest(transformed, req, explicitToken, explicitClientId);
        return res.status(200).set({ 'Content-Type': 'text/html' }).end(enriched);
      } catch (err) {
        console.error('Error injecting dev OG tags:', err);
        return next();
      }
    };

    app.get('/p/:token', (req, res, next) => serveDevWithOg(req, res, next, String(req.params.token || '').trim()));
    app.get('/mural/:clientId', (req, res, next) => serveDevWithOg(req, res, next, undefined, String(req.params.clientId || '').trim()));
    app.get('/', (req, res, next) => serveDevWithOg(req, res, next));
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');

    const serveProdWithOg = async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
      explicitToken?: string,
      explicitClientId?: string
    ) => {
      try {
        const baseHtml = await fs.readFile(path.join(distPath, 'index.html'), 'utf8');
        const enriched = await buildEnrichedHtmlForRequest(baseHtml, req, explicitToken, explicitClientId);
        return res.status(200).set({ 'Content-Type': 'text/html' }).end(enriched);
      } catch (err) {
        console.error('Error injecting prod OG tags:', err);
        return next();
      }
    };

    app.get('/p/:token', (req, res, next) => serveProdWithOg(req, res, next, String(req.params.token || '').trim()));
    app.get('/mural/:clientId', (req, res, next) => serveProdWithOg(req, res, next, undefined, String(req.params.clientId || '').trim()));
    app.get('/', (req, res, next) => serveProdWithOg(req, res, next));
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => serveProdWithOg(req, res, next));
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
