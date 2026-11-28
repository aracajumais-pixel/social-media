import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { formatOgImageTo3x4Jpeg, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from './api/_ogFormatter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';
const DATA_DIR = path.join(__dirname, '.data');
const STATE_FILE = path.join(DATA_DIR, 'app-state.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const SESSION_SIGNING_SECRET = (process.env.SESSION_SECRET || '').trim() || crypto.randomBytes(32).toString('hex');
const REVOKED_TOKENS = new Set<string>();

interface StoredAuthRecord {
  id: string;
  name: string;
  email: string;
  role: 'gestor' | 'social_media' | 'cliente';
  passwordHash: string;
  createdAt: string;
}

function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPasswordScrypt(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function signSessionToken(user: { id: string; email: string; name: string; role: string }): string {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    jti: crypto.randomBytes(12).toString('hex'),
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SIGNING_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string | undefined | null): { sub: string; email: string; name: string; role: string; jti: string } | null {
  if (!token) return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expectedSig = crypto.createHmac('sha256', SESSION_SIGNING_SECRET).update(encoded).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return null;
    if (parsed.jti && REVOKED_TOKENS.has(String(parsed.jti))) return null;
    return parsed;
  } catch {
    return null;
  }
}

function extractBearerToken(req: express.Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

async function readAuthUsers(): Promise<StoredAuthRecord[]> {
  try {
    const raw = await fs.readFile(AUTH_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.users) ? parsed.users : [];
  } catch {
    return [];
  }
}

async function writeAuthUsers(users: StoredAuthRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmpFile = `${AUTH_FILE}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify({ users }, null, 2), 'utf8');
  await fs.rename(tmpFile, AUTH_FILE);
}

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
    if (!arrBuf || arrBuf.byteLength === 0 || arrBuf.byteLength > 12 * 1024 * 1024) return null;
    return { buffer: Buffer.from(arrBuf), contentType: ct };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function sendFormattedOgResponse(
  res: express.Response,
  rawBuffer: Buffer,
  fallbackContentType = 'image/jpeg'
) {
  const formatted = await formatOgImageTo3x4Jpeg(rawBuffer, fallbackContentType);
  res.setHeader('Content-Type', formatted.contentType);
  res.setHeader('Content-Length', String(formatted.buffer.length));
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(formatted.buffer);
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
      return await sendFormattedOgResponse(res, buf, 'image/jpeg');
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
      return sendFormattedOgResponse(res, buf, match[1]);
    }
    return sendFallbackOgImage(res);
  }

  // 2. Caminho local estático (/assets/..., /og-default.jpg, etc.)
  if (url.startsWith('/') && !url.startsWith('//')) {
    const cleanRel = url.split('?')[0].replace(/^\/+/, '');
    const publicRoot = path.resolve(__dirname, 'public');
    const distRoot = path.resolve(__dirname, 'dist');
    const localCandidates = [
      { root: publicRoot, file: path.resolve(publicRoot, cleanRel) },
      { root: distRoot, file: path.resolve(distRoot, cleanRel) },
    ].filter(({ root, file }) => file.startsWith(root + path.sep));
    for (const { file: filePath } of localCandidates) {
      try {
        const buf = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const ct = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        return await sendFormattedOgResponse(res, buf, ct);
      } catch {
        // continue
      }
    }
    return sendFallbackOgImage(res);
  }

  // 3. Links do Google Drive (tenta thumbnail de alta resolução primeiro — funciona para imagem e vídeo!)
  let parsedHostname = '';
  try {
    parsedHostname = new URL(url).hostname.toLowerCase();
  } catch {
    parsedHostname = '';
  }
  if (parsedHostname === 'drive.google.com' || parsedHostname.endsWith('.googleusercontent.com')) {
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
          return sendFormattedOgResponse(res, fetched.buffer, fetched.contentType);
        }
      }
    }
    return sendFallbackOgImage(res);
  }

  // 4. Outras URLs HTTPS/HTTP (Supabase Storage, Unsplash, CDNs)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const fetched = await fetchImageBuffer(url);
    if (fetched) {
      return sendFormattedOgResponse(res, fetched.buffer, fetched.contentType);
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
      const rpcResp = await fetch(`${sbUrl}/rest/v1/rpc/get_og_preview_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
        body: JSON.stringify({ p_token: token }),
      });
      if (rpcResp.ok) {
        const rpcData: any = await rpcResp.json();
        if (rpcData && (rpcData.title || rpcData.media_url)) {
          return {
            post: {
              id: token,
              title: rpcData.title || 'Publicação para Aprovação',
              caption: rpcData.caption || '',
              mediaUrl: rpcData.media_url || '',
              approvalToken: token,
            },
            clientName: rpcData.client_name || undefined,
          };
        }
      }
    } catch {
      // continua para consulta direta
    }
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
      const rpcResp = await fetch(`${sbUrl}/rest/v1/rpc/get_og_preview_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
        body: JSON.stringify({ p_client_id: clientId }),
      });
      if (rpcResp.ok) {
        const rpcData: any = await rpcResp.json();
        if (rpcData && rpcData.client_name) {
          return {
            name: rpcData.client_name,
            previewImageUrl: rpcData.media_url || rpcData.logo_url || '',
            postsCount: 1,
          };
        }
      }
    } catch {
      // continua para consulta direta
    }
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
    imageWidth?: number;
    imageHeight?: number;
    imageType?: string;
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
    ...(meta.imageType ? [`<meta property="og:image:type" content="${escapeHtmlAttr(meta.imageType)}" />`] : []),
    ...(meta.imageWidth ? [`<meta property="og:image:width" content="${meta.imageWidth}" />`] : []),
    ...(meta.imageHeight ? [`<meta property="og:image:height" content="${meta.imageHeight}" />`] : []),
    `<meta property="og:image:alt" content="${safeTitle}" />`,
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
      ? `${origin}/api/og-image/${encodeURIComponent(token)}.jpg?v=3x4s`
      : `/api/og-image/${encodeURIComponent(token)}.jpg?v=3x4s`;

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
        imageWidth: OG_IMAGE_WIDTH,
        imageHeight: OG_IMAGE_HEIGHT,
        imageType: 'image/jpeg',
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
      ? `${origin}/api/og-client-image/${encodeURIComponent(clientParam)}.jpg?v=3x4s`
      : `/api/og-client-image/${encodeURIComponent(clientParam)}.jpg?v=3x4s`;

    return injectOpenGraphMetaTags(baseHtml, {
      title: mural ? `Mural de Aprovações — ${mural.name}` : 'Mural Exclusivo de Aprovações — Social Media 5.0',
      description: mural
        ? `Acesse o Mural Exclusivo de ${mural.name} para visualizar publicações, conferir legendas e aprovar conteúdos online.`
        : 'Acesse seu Mural Exclusivo de Posts & Aprovações online no Social Media 5.0.',
      url: shareUrl,
      imageUrl: ogImage,
      siteName: mural ? `${mural.name} • Social Media 5.0` : 'Social Media 5.0',
      origin,
      imageWidth: OG_IMAGE_WIDTH,
      imageHeight: OG_IMAGE_HEIGHT,
      imageType: 'image/jpeg',
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
   * Autenticação do servidor local (quando Supabase não está configurado no preview)
   */
  app.get('/api/auth/status', async (_req, res) => {
    const users = await readAuthUsers();
    res.json({ ok: true, initialized: users.length > 0 });
  });

  app.post('/api/auth/setup', async (req, res) => {
    try {
      const name = String(req.body?.name || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (name.length < 2 || !email.includes('@') || password.length < 6) {
        return res.status(400).json({ ok: false, error: 'Informe nome, e-mail válido e senha com ao menos 6 caracteres.' });
      }
      const existing = await readAuthUsers();
      if (existing.some((u) => u.email === email)) {
        return res.status(409).json({ ok: false, error: 'E-mail já cadastrado. Faça login.' });
      }
      const userRecord: StoredAuthRecord = {
        id: `local-sm-${Date.now()}`,
        name,
        email,
        role: 'social_media',
        passwordHash: hashPasswordScrypt(password),
        createdAt: new Date().toISOString(),
      };
      await writeAuthUsers([...existing, userRecord]);
      const token = signSessionToken(userRecord);
      return res.json({
        ok: true,
        token,
        user: { id: userRecord.id, email: userRecord.email, name: userRecord.name, role: userRecord.role },
      });
    } catch (err) {
      console.error('Error in /api/auth/setup:', err);
      return res.status(500).json({ ok: false, error: 'Falha ao configurar acesso inicial.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (!email.includes('@') || password.length < 6) {
        return res.status(400).json({ ok: false, error: 'Informe um e-mail válido e senha com ao menos 6 caracteres.' });
      }
      const users = await readAuthUsers();
      const matched = users.find((u) => u.email === email);
      if (matched) {
        if (!verifyPasswordScrypt(password, matched.passwordHash)) {
          return res.status(401).json({ ok: false, error: 'E-mail ou senha incorretos.' });
        }
        const token = signSessionToken(matched);
        return res.json({
          ok: true,
          token,
          user: { id: matched.id, email: matched.email, name: matched.name, role: matched.role },
        });
      }

      // Primeiro acesso automático: registra conta e senha como social_media (ou cliente se o e-mail estiver apenas em clientes)
      const state = await readSharedState();
      const smsArr: any[] = Array.isArray(state?.socialMedias) ? state.socialMedias : [];
      const clientsArr: any[] = Array.isArray(state?.clients) ? state.clients : [];
      const matchedSm = smsArr.find((s) => String(s?.email || '').trim().toLowerCase() === email);
      const matchedClient = clientsArr.find((c) => String(c?.email || '').trim().toLowerCase() === email);
      const resolvedRole: StoredAuthRecord['role'] = !matchedSm && matchedClient ? 'cliente' : 'social_media';
      const resolvedName =
        (matchedSm?.name && String(matchedSm.name).trim()) ||
        (matchedClient?.contactName && String(matchedClient.contactName).trim()) ||
        email.split('@')[0] ||
        'Social Media';

      const newUser: StoredAuthRecord = {
        id: matchedSm?.id ? String(matchedSm.id) : `local-sm-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        name: resolvedName,
        email,
        role: resolvedRole,
        passwordHash: hashPasswordScrypt(password),
        createdAt: new Date().toISOString(),
      };
      await writeAuthUsers([...users, newUser]);
      const token = signSessionToken(newUser);
      return res.json({
        ok: true,
        token,
        user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      });
    } catch (err) {
      console.error('Error in /api/auth/login:', err);
      return res.status(500).json({ ok: false, error: 'Falha ao autenticar.' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = extractBearerToken(req);
    const verified = verifySessionToken(token);
    if (verified?.jti) {
      REVOKED_TOKENS.add(verified.jti);
    }
    res.json({ ok: true });
  });

  /**
   * Endpoints públicos estritamente delimitados por token/ID para links compartilhados (/p/:token e /mural/:clientId)
   */
  app.get('/api/public/post/:token', async (req, res) => {
    try {
      const token = String(req.params.token || '').trim();
      const state = await readSharedState();
      const postsArr: any[] = Array.isArray(state?.posts) ? state.posts : [];
      const clientsArr: any[] = Array.isArray(state?.clients) ? state.clients : [];
      const smArr: any[] = Array.isArray(state?.socialMedias) ? state.socialMedias : [];
      const post = postsArr.find((p) => p?.approvalToken === token);
      if (!post) return res.json({ ok: true, post: null, client: null, socialMedia: null });
      const client = clientsArr.find((c) => c?.id === post.clientProjectId) || null;
      const sm = smArr.find((s) => s?.id === (post.socialMediaAuthorId || client?.assignedSocialMediaId)) || null;
      return res.json({
        ok: true,
        post,
        client: client
          ? {
              id: client.id,
              name: client.name,
              contactName: client.contactName,
              logoUrl: client.logoUrl,
              activeSocialNetworks: client.activeSocialNetworks || ['instagram', 'facebook'],
              assignedSocialMediaId: client.assignedSocialMediaId,
              assignedSocialMediaIds: Array.isArray(client.assignedSocialMediaIds) ? client.assignedSocialMediaIds : undefined,
              metricsAccess: client.metricsAccess || 'cliente',
            }
          : null,
        socialMedia: sm ? { id: sm.id, name: sm.name, socialProfile: sm.socialProfile } : null,
      });
    } catch {
      return res.json({ ok: false });
    }
  });

  app.post('/api/public/post/:token/action', async (req, res) => {
    try {
      const token = String(req.params.token || '').trim();
      const { action, comment, authorName } = req.body || {};
      const state = await readSharedState();
      const postsArr: any[] = Array.isArray(state?.posts) ? state.posts : [];
      const idx = postsArr.findIndex((p) => p?.approvalToken === token);
      if (idx < 0) return res.status(404).json({ ok: false, error: 'Post não encontrado' });
      const target = { ...postsArr[idx] };
      if (target.tokenExpiresAt && new Date(target.tokenExpiresAt).getTime() < Date.now()) {
        return res.status(410).json({ ok: false, error: 'Link expirado' });
      }
      const nowIso = new Date().toISOString();
      const ts = new Date().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const comments = Array.isArray(target.comments) ? [...target.comments] : [];
      if (action === 'approve') {
        target.status = 'aprovado';
        target.approvedAt = target.approvedAt || nowIso;
        comments.push({
          id: `c-appr-${Date.now()}`,
          authorRole: 'cliente',
          authorName: String(authorName || 'Cliente'),
          text: '🎉 Post aprovado com sucesso! Este conteúdo será programado para postagem.',
          timestamp: ts,
        });
      } else if (action === 'request_change' && String(comment || '').trim()) {
        target.status = 'alterar';
        comments.push({
          id: `c-${Date.now()}`,
          authorRole: 'cliente',
          authorName: String(authorName || 'Cliente'),
          text: `[Instrução de Ajuste]: ${String(comment).trim()}`,
          timestamp: ts,
        });
      } else if (action === 'comment' && String(comment || '').trim()) {
        comments.push({
          id: `c-${Date.now()}`,
          authorRole: 'cliente',
          authorName: String(authorName || 'Cliente'),
          text: String(comment).trim(),
          timestamp: ts,
        });
      }
      target.comments = comments;
      target.updatedAt = nowIso;
      postsArr[idx] = target;
      await writeSharedStatePatch({ posts: postsArr });
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ ok: false });
    }
  });

  app.get('/api/public/mural/:clientId', async (req, res) => {
    try {
      const clientId = String(req.params.clientId || '').trim();
      const smId = String(req.query?.sm || '').trim();
      const state = await readSharedState();
      const clientsArr: any[] = Array.isArray(state?.clients) ? state.clients : [];
      const client = clientsArr.find((c) => c?.id === clientId);
      if (!client) return res.json({ ok: true, client: null, socialMedia: null, posts: [], tasks: [], inspirations: [] });
      const targetSmId = smId || client.assignedSocialMediaId;
      const smArr: any[] = Array.isArray(state?.socialMedias) ? state.socialMedias : [];
      const sm = smArr.find((s) => s?.id === targetSmId) || null;
      const posts = (Array.isArray(state?.posts) ? state.posts : []).filter(
        (p: any) => p?.clientProjectId === clientId && (!targetSmId || !p.socialMediaAuthorId || p.socialMediaAuthorId === targetSmId)
      );
      const tasks = (Array.isArray(state?.tasks) ? state.tasks : []).filter((t: any) => t?.clientProjectId === clientId);
      const inspirations = (Array.isArray(state?.inspirations) ? state.inspirations : []).filter((i: any) => i?.clientProjectId === clientId);
      return res.json({
        ok: true,
        client: {
          id: client.id,
          name: client.name,
          contactName: client.contactName,
          logoUrl: client.logoUrl,
          activeSocialNetworks: client.activeSocialNetworks || ['instagram', 'facebook'],
          assignedSocialMediaId: client.assignedSocialMediaId,
          assignedSocialMediaIds: Array.isArray(client.assignedSocialMediaIds) ? client.assignedSocialMediaIds : undefined,
          metricsAccess: client.metricsAccess || 'cliente',
        },
        socialMedia: sm ? { id: sm.id, name: sm.name, socialProfile: sm.socialProfile } : null,
        posts,
        tasks,
        inspirations,
      });
    } catch {
      return res.json({ ok: false });
    }
  });

  function resolveCallerSmIds(state: Record<string, any>, verified: { sub: string; email: string }): Set<string> {
    const ids = new Set<string>([verified.sub]);
    const cleanEmail = verified.email.trim().toLowerCase();
    const smArr: any[] = Array.isArray(state?.socialMedias) ? state.socialMedias : [];
    for (const sm of smArr) {
      if (sm?.id === verified.sub || (cleanEmail && String(sm?.email || '').trim().toLowerCase() === cleanEmail)) {
        if (sm?.id) ids.add(String(sm.id));
      }
    }
    return ids;
  }

  function isClientLinkedToSmSet(client: any, smIds: Set<string>, smsArr: any[]): boolean {
    if (!client) return false;
    if (client.assignedSocialMediaId && smIds.has(String(client.assignedSocialMediaId))) return true;
    if (client.createdBySocialMediaId && smIds.has(String(client.createdBySocialMediaId))) return true;
    if (Array.isArray(client.assignedSocialMediaIds) && client.assignedSocialMediaIds.some((id: any) => smIds.has(String(id)))) {
      return true;
    }
    for (const sm of smsArr) {
      if (smIds.has(String(sm?.id)) && Array.isArray(sm?.assignedClientIds) && sm.assignedClientIds.includes(client.id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Persistência compartilhada protegida por autenticação Bearer Token (com isolamento por Social Media)
   */
  app.get('/api/sync-state', async (req, res) => {
    const verified = verifySessionToken(extractBearerToken(req));
    if (!verified) {
      return res.status(401).json({ ok: false, error: 'Autenticação necessária' });
    }
    try {
      const state = await readSharedState();
      if (verified.role === 'gestor') {
        return res.json({ ok: true, state });
      }

      const smsArr: any[] = Array.isArray(state?.socialMedias) ? state.socialMedias : [];
      const clientsArr: any[] = Array.isArray(state?.clients) ? state.clients : [];

      if (verified.role === 'cliente') {
        const cleanEmail = verified.email.trim().toLowerCase();
        const myClients = clientsArr.filter(
          (c) => c?.id === verified.sub || (cleanEmail && String(c?.email || '').trim().toLowerCase() === cleanEmail)
        );
        const allowedClientIds = new Set(myClients.map((c) => c.id));
        const byClient = (arr: any) => (Array.isArray(arr) ? arr.filter((x) => allowedClientIds.has(x?.clientProjectId)) : []);
        return res.json({
          ok: true,
          state: {
            clients: myClients,
            socialMedias: smsArr
              .filter((sm) => myClients.some((c) => isClientLinkedToSmSet(c, new Set([String(sm.id)]), [sm])))
              .map((sm) => ({ id: sm.id, name: sm.name, socialProfile: sm.socialProfile })),
            posts: byClient(state?.posts),
            tasks: byClient(state?.tasks),
            inspirations: byClient(state?.inspirations),
            receipts: [],
            approvalRecords: [],
            birthdayBackgrounds: byClient(state?.birthdayBackgrounds),
            birthdayGroups: byClient(state?.birthdayGroups),
            birthdayMessages: byClient(state?.birthdayMessages),
            birthdayPeople: byClient(state?.birthdayPeople),
            birthdayAuditLogs: byClient(state?.birthdayAuditLogs),
          },
        });
      }

      // Social Media: recebe apenas seus próprios clientes e dados associados (suporta N:N)
      const callerSmIds = resolveCallerSmIds(state, verified);
      const myClients = clientsArr.filter((c) => isClientLinkedToSmSet(c, callerSmIds, smsArr));
      const allowedClientIds = new Set(myClients.map((c) => c.id));
      const byClient = (arr: any) => (Array.isArray(arr) ? arr.filter((x) => allowedClientIds.has(x?.clientProjectId)) : []);
      const scopedPosts = byClient(state?.posts).filter(
        (p: any) => !p?.socialMediaAuthorId || callerSmIds.has(String(p.socialMediaAuthorId))
      );

      // Para diretório de co-atribuição, expõe dados sensíveis apenas do próprio SM
      const scopedSocialMedias = smsArr.map((sm) => {
        if (callerSmIds.has(String(sm?.id))) return sm;
        return {
          id: sm.id,
          name: sm.name,
          email: sm.email,
          socialProfile: sm.socialProfile,
          assignedClientIds: (Array.isArray(sm.assignedClientIds) ? sm.assignedClientIds : []).filter((cid: string) =>
            allowedClientIds.has(cid)
          ),
          totalPostsCreated: 0,
          status: sm.status || 'ativo',
        };
      });

      return res.json({
        ok: true,
        state: {
          clients: myClients,
          socialMedias: scopedSocialMedias,
          posts: scopedPosts,
          tasks: byClient(state?.tasks),
          inspirations: byClient(state?.inspirations),
          receipts: byClient(state?.receipts),
          approvalRecords: byClient(state?.approvalRecords),
          birthdayBackgrounds: byClient(state?.birthdayBackgrounds),
          birthdayGroups: byClient(state?.birthdayGroups),
          birthdayMessages: byClient(state?.birthdayMessages),
          birthdayPeople: byClient(state?.birthdayPeople),
          birthdayAuditLogs: byClient(state?.birthdayAuditLogs),
        },
      });
    } catch (err) {
      console.error('Error reading shared state:', err);
      res.json({ ok: false, state: {} });
    }
  });

  app.post('/api/sync-state', async (req, res) => {
    const verified = verifySessionToken(extractBearerToken(req));
    if (!verified) {
      return res.status(401).json({ ok: false, error: 'Autenticação necessária' });
    }
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

      if (verified.role === 'gestor') {
        const filtered: Record<string, any> = {};
        for (const [k, v] of Object.entries(patch)) {
          if (allowedKeys.has(k)) {
            filtered[k] = v;
          }
        }
        await writeSharedStatePatch(filtered);
        return res.json({ ok: true });
      }

      // Social Media (ou Cliente): mescla mantendo intactos dados de outros Social Medias / clientes
      stateWriteQueue = stateWriteQueue.then(async () => {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const current = await readSharedState();
        const curSms: any[] = Array.isArray(current?.socialMedias) ? current.socialMedias : [];
        const curClients: any[] = Array.isArray(current?.clients) ? current.clients : [];
        const callerSmIds = resolveCallerSmIds(current, verified);
        const primaryCallerSmId = Array.from(callerSmIds).find((id) => id !== verified.sub) || verified.sub;

        const existingMyClientIds = new Set(
          curClients.filter((c) => isClientLinkedToSmSet(c, callerSmIds, curSms)).map((c) => c.id)
        );
        const foreignClientIds = new Set(
          curClients.filter((c) => !existingMyClientIds.has(c.id)).map((c) => c.id)
        );

        const nextState: Record<string, any> = { ...current };

        if (Array.isArray(patch.clients) && verified.role === 'social_media') {
          const foreignClients = curClients.filter((c) => !existingMyClientIds.has(c.id));
          const incomingMyClients = patch.clients
            .filter((c: any) => c && c.id && !foreignClientIds.has(c.id))
            .map((c: any) => {
              const smIdsSet = new Set<string>(Array.isArray(c.assignedSocialMediaIds) ? c.assignedSocialMediaIds.filter(Boolean) : []);
              if (c.assignedSocialMediaId) smIdsSet.add(String(c.assignedSocialMediaId));
              if (!Array.from(smIdsSet).some((id) => callerSmIds.has(id))) {
                smIdsSet.add(primaryCallerSmId);
              }
              const smIdsArr = Array.from(smIdsSet);
              return {
                ...c,
                assignedSocialMediaId: c.assignedSocialMediaId || smIdsArr[0],
                assignedSocialMediaIds: smIdsArr,
                createdBySocialMediaId: c.createdBySocialMediaId || primaryCallerSmId,
              };
            });
          nextState.clients = [...foreignClients, ...incomingMyClients];
        }

        const effectiveMyClientIds = new Set(
          (Array.isArray(nextState.clients) ? nextState.clients : curClients)
            .filter((c: any) => isClientLinkedToSmSet(c, callerSmIds, curSms))
            .map((c: any) => c.id)
        );

        if (Array.isArray(patch.socialMedias) && verified.role === 'social_media') {
          const incomingById = new Map<string, any>(
            patch.socialMedias.filter((s: any) => s?.id).map((s: any) => [String(s.id), s])
          );
          const updatedSms = curSms.map((existingSm) => {
            const smId = String(existingSm.id);
            const inc = incomingById.get(smId);
            if (callerSmIds.has(smId)) {
              return inc ? { ...existingSm, ...inc } : existingSm;
            }
            // Para outros Social Medias: preserva todos os campos privados e sincroniza apenas vínculos de clientes do chamador (M:N)
            if (!inc) return existingSm;
            const prevForeignLinks = (Array.isArray(existingSm.assignedClientIds) ? existingSm.assignedClientIds : []).filter(
              (cid: string) => !effectiveMyClientIds.has(cid)
            );
            const nextSharedLinks = (Array.isArray(inc.assignedClientIds) ? inc.assignedClientIds : []).filter((cid: string) =>
              effectiveMyClientIds.has(cid)
            );
            return {
              ...existingSm,
              assignedClientIds: Array.from(new Set([...prevForeignLinks, ...nextSharedLinks])),
            };
          });
          // Adiciona registro do próprio SM se ainda não existia no servidor
          for (const inc of patch.socialMedias) {
            const incEmail = String(inc?.email || '').trim().toLowerCase();
            if (
              inc?.id &&
              !updatedSms.some((s) => String(s.id) === String(inc.id)) &&
              (callerSmIds.has(String(inc.id)) || (incEmail && incEmail === verified.email.toLowerCase()))
            ) {
              updatedSms.push(inc);
            }
          }
          nextState.socialMedias = updatedSms;
        }

        const mergeClientScopedArray = (key: string, preserveOtherSmPosts = false) => {
          if (!Array.isArray(patch[key])) return;
          const curArr: any[] = Array.isArray(current[key]) ? current[key] : [];
          const preserved = curArr.filter((item) => {
            if (!effectiveMyClientIds.has(item?.clientProjectId)) return true;
            if (preserveOtherSmPosts && item?.socialMediaAuthorId && !callerSmIds.has(String(item.socialMediaAuthorId))) {
              return true;
            }
            return false;
          });
          const incoming = patch[key].filter((item: any) => effectiveMyClientIds.has(item?.clientProjectId));
          nextState[key] = [...preserved, ...incoming];
        };

        mergeClientScopedArray('posts', verified.role === 'social_media');
        mergeClientScopedArray('tasks');
        mergeClientScopedArray('inspirations');
        if (verified.role === 'social_media') {
          mergeClientScopedArray('receipts');
          mergeClientScopedArray('approvalRecords');
        }
        mergeClientScopedArray('birthdayBackgrounds');
        mergeClientScopedArray('birthdayGroups');
        mergeClientScopedArray('birthdayMessages');
        mergeClientScopedArray('birthdayPeople');
        mergeClientScopedArray('birthdayAuditLogs');

        nextState._updatedAt = new Date().toISOString();
        const tmpFile = `${STATE_FILE}.tmp`;
        await fs.writeFile(tmpFile, JSON.stringify(nextState), 'utf8');
        await fs.rename(tmpFile, STATE_FILE);
      });
      await stateWriteQueue;
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
