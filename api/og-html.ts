import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

type VercelReq = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
  url?: string;
};

type VercelRes = ServerResponse & {
  status?: (code: number) => VercelRes;
  send?: (body: string | Buffer) => void;
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

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getSupabaseEnv() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  return { url, key };
}

async function fetchPostAndClientByToken(token: string): Promise<{
  post: { title: string; caption: string; mediaUrl: string; clientProjectId?: string } | null;
  clientName?: string;
}> {
  const { url: sbUrl, key: sbKey } = getSupabaseEnv();
  if (!sbUrl || !sbKey || !token) return { post: null };

  try {
    const resp = await fetch(
      `${sbUrl}/rest/v1/posts?approval_token=eq.${encodeURIComponent(token)}&select=id,title,caption,media_url,client_project_id&limit=1`,
      {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      }
    );
    if (!resp.ok) return { post: null };
    const rows = (await resp.json()) as any[];
    const row = rows?.[0];
    if (!row) return { post: null };

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
        const cRows = (await cResp.json()) as any[];
        clientName = cRows?.[0]?.name || undefined;
      }
    }

    return {
      post: {
        title: row.title || 'Publicação para Aprovação',
        caption: row.caption || '',
        mediaUrl: row.media_url || '',
        clientProjectId: row.client_project_id,
      },
      clientName,
    };
  } catch {
    return { post: null };
  }
}

async function fetchClientMuralById(clientId: string): Promise<{ name: string } | null> {
  const { url: sbUrl, key: sbKey } = getSupabaseEnv();
  if (!sbUrl || !sbKey || !clientId) return null;

  try {
    const resp = await fetch(
      `${sbUrl}/rest/v1/clients?id=eq.${encodeURIComponent(clientId)}&select=id,name&limit=1`,
      {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      }
    );
    if (!resp.ok) return null;
    const rows = (await resp.json()) as any[];
    if (!rows?.[0]) return null;
    return { name: rows[0].name || 'Cliente' };
  } catch {
    return null;
  }
}

async function loadBaseIndexHtml(origin: string): Promise<string> {
  const candidates = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
  ];
  for (const filePath of candidates) {
    try {
      const html = await fs.readFile(filePath, 'utf8');
      if (html && html.includes('<head')) return html;
    } catch {
      // try next
    }
  }

  if (origin) {
    try {
      const resp = await fetch(`${origin}/index.html`);
      if (resp.ok) {
        const html = await resp.text();
        if (html && html.includes('<head')) return html;
      }
    } catch {
      // fallback below
    }
  }

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Social Media 5.0</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
}

function injectOpenGraphMetaTags(
  html: string,
  meta: {
    title: string;
    description: string;
    url: string;
    imageUrl: string;
    siteName: string;
    origin: string;
  }
): string {
  const safeTitle = escapeHtmlAttr(meta.title);
  const safeDesc = escapeHtmlAttr(meta.description);
  const safeUrl = escapeHtmlAttr(meta.url);
  const safeImage = escapeHtmlAttr(meta.imageUrl);
  const safeSiteName = escapeHtmlAttr(meta.siteName);
  const iconUrl = escapeHtmlAttr(meta.origin ? `${meta.origin}/favicon.jpg` : '/favicon.jpg');

  let out = html
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+[^>]*name=["']description["'][^>]*\/?>/gi, '')
    .replace(/<meta\s+[^>]*property=["']og:[^"']+["'][^>]*\/?>/gi, '')
    .replace(/<meta\s+[^>]*name=["']twitter:[^"']+["'][^>]*\/?>/gi, '')
    .replace(/<link\s+[^>]*rel=["']canonical["'][^>]*\/?>/gi, '');

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

export default async function handler(req: VercelReq, res: VercelRes) {
  const origin = getRequestOrigin(req);
  const rawUrl = req.url || '';
  const pathTokenMatch = rawUrl.match(/\/p\/([^/?#]+)/i);
  const pathMuralMatch = rawUrl.match(/\/mural\/([^/?#]+)/i);

  const token =
    getParam(req, 'token') ||
    getParam(req, 'approvalToken') ||
    (pathTokenMatch?.[1] ? decodeURIComponent(pathTokenMatch[1]).trim() : '');

  const clientId =
    getParam(req, 'client') ||
    (pathMuralMatch?.[1] ? decodeURIComponent(pathMuralMatch[1]).trim() : '');

  const baseHtml = await loadBaseIndexHtml(origin);
  let enrichedHtml = baseHtml;

  if (token) {
    const { post, clientName } = await fetchPostAndClientByToken(token);
    const shareUrl = origin ? `${origin}/p/${encodeURIComponent(token)}` : `/p/${encodeURIComponent(token)}`;
    const ogImage = origin
      ? `${origin}/api/og-image/${encodeURIComponent(token)}.jpg`
      : `/api/og-image/${encodeURIComponent(token)}.jpg`;

    if (post) {
      const titleText = clientName ? `${clientName}: "${post.title}"` : `${post.title} — Social Media 5.0`;
      const rawDesc = (post.caption || 'Clique no cartão para visualizar a arte, comentar ou aprovar esta publicação.')
        .replace(/\s+/g, ' ')
        .trim();
      const descText = rawDesc.length > 220 ? `${rawDesc.slice(0, 217)}...` : rawDesc;

      enrichedHtml = injectOpenGraphMetaTags(baseHtml, {
        title: titleText,
        description: descText,
        url: shareUrl,
        imageUrl: ogImage,
        siteName: clientName ? `${clientName} • Social Media 5.0` : 'Social Media 5.0',
        origin,
      });
    } else {
      enrichedHtml = injectOpenGraphMetaTags(baseHtml, {
        title: 'Aprovação de Publicação — Social Media 5.0',
        description: 'Clique para visualizar a arte, conferir a legenda e aprovar ou solicitar ajustes.',
        url: shareUrl,
        imageUrl: origin ? `${origin}/og-default.jpg` : '/og-default.jpg',
        siteName: 'Social Media 5.0',
        origin,
      });
    }
  } else if (clientId) {
    const mural = await fetchClientMuralById(clientId);
    const smParam = getParam(req, 'sm');
    const pathUrl = smParam
      ? `/mural/${encodeURIComponent(clientId)}?sm=${encodeURIComponent(smParam)}`
      : `/mural/${encodeURIComponent(clientId)}`;
    const shareUrl = origin ? `${origin}${pathUrl}` : pathUrl;
    const ogImage = origin
      ? `${origin}/api/og-client-image/${encodeURIComponent(clientId)}.jpg`
      : `/api/og-client-image/${encodeURIComponent(clientId)}.jpg`;

    enrichedHtml = injectOpenGraphMetaTags(baseHtml, {
      title: mural ? `Mural de Aprovações — ${mural.name}` : 'Mural Exclusivo de Aprovações — Social Media 5.0',
      description: mural
        ? `Acesse o Mural Exclusivo de ${mural.name} para visualizar publicações, conferir legendas e aprovar conteúdos online.`
        : 'Acesse seu Mural Exclusivo de Posts & Aprovações online no Social Media 5.0.',
      url: shareUrl,
      imageUrl: ogImage,
      siteName: mural ? `${mural.name} • Social Media 5.0` : 'Social Media 5.0',
      origin,
    });
  } else {
    enrichedHtml = injectOpenGraphMetaTags(baseHtml, {
      title: 'Social Media 5.0 — Gestão & Aprovação de Conteúdo',
      description: 'Plataforma centralizada Social Media 5.0 para aprovação de posts, comentários em debate, inspirações, recibos em PDF e gestão de aniversariantes.',
      url: origin ? `${origin}/` : '/',
      imageUrl: origin ? `${origin}/og-default.jpg` : '/og-default.jpg',
      siteName: 'Social Media 5.0',
      origin,
    });
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.end(enrichedHtml);
}
