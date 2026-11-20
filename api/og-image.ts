import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

type VercelReq = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
  url?: string;
};

function getParam(req: VercelReq, key: string): string {
  const val = req.query?.[key];
  if (Array.isArray(val)) return String(val[0] || '').trim();
  if (typeof val === 'string') return val.trim();
  return '';
}

function getRequestOrigin(req: VercelReq): string {
  const protoHeader = req.headers['x-forwarded-proto'];
  const rawProto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader)?.split(',')[0]?.trim();
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
  const host = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader)?.split(',')[0]?.trim() || '';
  if (host) {
    const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
    return `${rawProto || (isLocal ? 'http' : 'https')}://${host}`;
  }
  const vercelUrl = (process.env.VERCEL_URL || '').trim();
  if (vercelUrl) {
    return vercelUrl.startsWith('http') ? vercelUrl.replace(/\/+$/, '') : `https://${vercelUrl.replace(/\/+$/, '')}`;
  }
  return '';
}

function getSupabaseEnv() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  return { url, key };
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

async function sendFallbackImage(req: VercelReq, res: ServerResponse) {
  const candidates = [
    path.join(process.cwd(), 'public', 'og-default.jpg'),
    path.join(process.cwd(), 'dist', 'og-default.jpg'),
    path.join(process.cwd(), 'public', 'favicon.jpg'),
    path.join(process.cwd(), 'dist', 'favicon.jpg'),
  ];
  for (const filePath of candidates) {
    try {
      const buf = await fs.readFile(filePath);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', String(buf.length));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.end(buf);
    } catch {
      // try next
    }
  }

  const origin = getRequestOrigin(req);
  if (origin) {
    const fetched = await fetchImageBuffer(`${origin}/og-default.jpg`);
    if (fetched) {
      res.statusCode = 200;
      res.setHeader('Content-Type', fetched.contentType);
      res.setHeader('Content-Length', String(fetched.buffer.length));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.end(fetched.buffer);
    }
  }

  res.statusCode = 404;
  return res.end();
}

async function lookupMediaUrl(req: VercelReq): Promise<string> {
  const { url: sbUrl, key: sbKey } = getSupabaseEnv();
  if (!sbUrl || !sbKey) return '';

  const rawUrl = req.url || '';
  const pathToken = rawUrl.match(/\/api\/og-image\/([^/?#]+)/i)?.[1];
  const pathClient = rawUrl.match(/\/api\/og-client-image\/([^/?#]+)/i)?.[1];

  const rawToken = (getParam(req, 'token') || (pathToken ? decodeURIComponent(pathToken) : '')).replace(/\.(jpg|jpeg|png|webp)$/i, '').trim();
  const rawClientId = (getParam(req, 'clientId') || (pathClient ? decodeURIComponent(pathClient) : '')).replace(/\.(jpg|jpeg|png|webp)$/i, '').trim();

  try {
    if (rawToken) {
      const resp = await fetch(
        `${sbUrl}/rest/v1/posts?approval_token=eq.${encodeURIComponent(rawToken)}&select=media_url&limit=1`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
      );
      if (resp.ok) {
        const rows = (await resp.json()) as any[];
        if (rows?.[0]?.media_url) return String(rows[0].media_url);
      }
    }

    if (rawClientId) {
      const pResp = await fetch(
        `${sbUrl}/rest/v1/posts?client_project_id=eq.${encodeURIComponent(rawClientId)}&select=media_url&order=created_at.desc&limit=5`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
      );
      if (pResp.ok) {
        const pRows = (await pResp.json()) as any[];
        const found = pRows.find((r) => r?.media_url);
        if (found?.media_url) return String(found.media_url);
      }
      const cResp = await fetch(
        `${sbUrl}/rest/v1/clients?id=eq.${encodeURIComponent(rawClientId)}&select=logo_url&limit=1`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
      );
      if (cResp.ok) {
        const cRows = (await cResp.json()) as any[];
        if (cRows?.[0]?.logo_url) return String(cRows[0].logo_url);
      }
    }
  } catch {
    // fallback below
  }

  return '';
}

export default async function handler(req: VercelReq, res: ServerResponse) {
  const mediaUrl = (await lookupMediaUrl(req)).trim();
  if (!mediaUrl) {
    return sendFallbackImage(req, res);
  }

  // 1. Base64 data URI
  if (mediaUrl.startsWith('data:image/')) {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(mediaUrl);
    if (match && match[1].toLowerCase() !== 'image/svg+xml') {
      const buf = Buffer.from(match[2], 'base64');
      res.statusCode = 200;
      res.setHeader('Content-Type', match[1]);
      res.setHeader('Content-Length', String(buf.length));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.end(buf);
    }
    return sendFallbackImage(req, res);
  }

  // 2. Relative path on same origin
  if (mediaUrl.startsWith('/') && !mediaUrl.startsWith('//')) {
    const origin = getRequestOrigin(req);
    if (origin) {
      const fetched = await fetchImageBuffer(`${origin}${mediaUrl}`);
      if (fetched) {
        res.statusCode = 200;
        res.setHeader('Content-Type', fetched.contentType);
        res.setHeader('Content-Length', String(fetched.buffer.length));
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.end(fetched.buffer);
      }
    }
    return sendFallbackImage(req, res);
  }

  // 3. Google Drive link
  if (mediaUrl.includes('drive.google.com') || mediaUrl.includes('googleusercontent.com')) {
    const driveId = extractDriveFileId(mediaUrl);
    if (driveId) {
      const candidates = [
        `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`,
        `https://lh3.googleusercontent.com/d/${driveId}=w1200`,
        `https://drive.google.com/uc?export=view&id=${driveId}`,
      ];
      for (const candidate of candidates) {
        const fetched = await fetchImageBuffer(candidate);
        if (fetched) {
          res.statusCode = 200;
          res.setHeader('Content-Type', fetched.contentType);
          res.setHeader('Content-Length', String(fetched.buffer.length));
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.end(fetched.buffer);
        }
      }
    }
    return sendFallbackImage(req, res);
  }

  // 4. Remote HTTP(S) image (Supabase Storage, Unsplash, etc.)
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    const fetched = await fetchImageBuffer(mediaUrl);
    if (fetched) {
      res.statusCode = 200;
      res.setHeader('Content-Type', fetched.contentType);
      res.setHeader('Content-Length', String(fetched.buffer.length));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.end(fetched.buffer);
    }
  }

  return sendFallbackImage(req, res);
}
