/**
 * Utilitário para conversão e tratamento de links do Google Drive
 * Transforma links de visualização em URLs diretas de imagem embeddável
 */

export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // Padrão 0: se já for lh3.googleusercontent.com/d/FILE_ID
  const lh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match && lh3Match[1]) return lh3Match[1];

  // Padrão 1: /file/d/FILE_ID/ ou /file/u/0/d/FILE_ID/
  const fileDPattern = /\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/;
  const matchD = trimmed.match(fileDPattern);
  if (matchD && matchD[1]) return matchD[1];

  // Padrão 2: ?id=FILE_ID ou &id=FILE_ID (ex: drive.google.com/open?id=... ou /uc?id=...)
  const idParamPattern = /[?&]id=([a-zA-Z0-9_-]+)/;
  const matchId = trimmed.match(idParamPattern);
  if (matchId && matchId[1]) return matchId[1];

  // Padrão 3: /presentation/d/FILE_ID ou /document/d/FILE_ID ou /spreadsheets/d/FILE_ID ou /d/FILE_ID
  const docsPattern = /\/d\/([a-zA-Z0-9_-]+)/;
  const matchDocs = trimmed.match(docsPattern);
  if (matchDocs && matchDocs[1]) return matchDocs[1];

  return null;
}

export function isGoogleDriveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('drive.google.com') ||
    lower.includes('docs.google.com') ||
    lower.includes('googleusercontent.com') ||
    Boolean(extractGoogleDriveFileId(url))
  );
}

/**
 * Retorna uma URL otimizada para ser inserida em tags <img src="..." />
 * Se for link do Google Drive, extrai o ID e gera a URL de imagem direta em alta resolução
 */
export function getEmbeddableMediaUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  }

  const trimmed = url.trim();

  if (isGoogleDriveUrl(trimmed)) {
    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId) {
      // URL direta de imagem de alta resolução do servidor CDN da Google
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return trimmed;
}

/**
 * URL alternativa 1 para fallback caso o lh3.googleusercontent falhe
 */
export function getFallbackDriveUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }
  return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
}

/**
 * URL alternativa 2 para fallback via uc?export=view
 */
export function getDirectExportDriveUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return url;
}
