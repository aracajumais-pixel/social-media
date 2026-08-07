/**
 * Utilitários para gestão de Token Único de Aprovação com Expiração de 5 dias
 * Compatível com a estrutura de tabela Supabase (posts):
 * - id (uuid)
 * - approval_token (uuid)
 * - token_expires_at (timestamp)
 * - status (pending | approved | rejected)
 */

export function generateApprovalToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback caso crypto.randomUUID não esteja disponível no browser
  return 'tok_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function calculateTokenExpirationDays(days = 5): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function isTokenExpired(tokenExpiresAt?: string): boolean {
  if (!tokenExpiresAt) return false;
  const expDate = new Date(tokenExpiresAt);
  return new Date() > expDate;
}

export function getTimeRemainingText(tokenExpiresAt?: string): { text: string; isExpired: boolean } {
  if (!tokenExpiresAt) {
    return { text: 'Sem expiração definida', isExpired: false };
  }

  const now = new Date().getTime();
  const exp = new Date(tokenExpiresAt).getTime();
  const diffMs = exp - now;

  if (diffMs <= 0) {
    return { text: 'Link Expirado (5 dias vencidos)', isExpired: true };
  }

  const hoursTotal = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hoursTotal / 24);
  const hours = hoursTotal % 24;

  if (days > 0) {
    return { text: `${days}d e ${hours}h restantes`, isExpired: false };
  }
  return { text: `${hours}h restantes`, isExpired: false };
}

export function buildApprovalUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  return `${origin}${pathname}?token=${token}#approval`;
}
