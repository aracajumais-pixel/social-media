import { ClientProject, SocialMediaUser } from '../types';

/**
 * Retorna todos os IDs de Social Media vinculados a um cliente (suporta vínculo N:N e legado 1:1).
 */
export function getClientSocialMediaIds(
  client?: Partial<ClientProject> | null,
  socialMedias?: SocialMediaUser[]
): string[] {
  if (!client) return [];
  const ids = new Set<string>();

  if (Array.isArray(client.assignedSocialMediaIds)) {
    for (const id of client.assignedSocialMediaIds) {
      const clean = String(id || '').trim();
      if (clean) ids.add(clean);
    }
  }

  if (client.assignedSocialMediaId) {
    const clean = String(client.assignedSocialMediaId).trim();
    if (clean) ids.add(clean);
  }

  if (client.createdBySocialMediaId) {
    const clean = String(client.createdBySocialMediaId).trim();
    if (clean) ids.add(clean);
  }

  if (client.id && Array.isArray(socialMedias)) {
    for (const sm of socialMedias) {
      if (Array.isArray(sm.assignedClientIds) && sm.assignedClientIds.includes(client.id)) {
        ids.add(sm.id);
      }
    }
  }

  return Array.from(ids);
}

/**
 * Verifica se um cliente está vinculado ao Social Media especificado.
 */
export function isClientLinkedToSocialMedia(
  client?: Partial<ClientProject> | null,
  smId?: string | null,
  smObj?: SocialMediaUser | null
): boolean {
  const cleanSmId = String(smId || '').trim();
  if (!client || !cleanSmId) return false;
  return getClientSocialMediaIds(client, smObj ? [smObj] : undefined).includes(cleanSmId);
}

/**
 * Retorna a lista completa de profissionais Social Media vinculados a um cliente.
 */
export function getClientAssignedSocialMedias(
  client: Partial<ClientProject> | null | undefined,
  socialMedias: SocialMediaUser[]
): SocialMediaUser[] {
  const ids = getClientSocialMediaIds(client, socialMedias);
  if (ids.length === 0) return [];
  const smById = new Map(socialMedias.map((sm) => [sm.id, sm]));
  return ids.map((id) => smById.get(id)).filter((sm): sm is SocialMediaUser => Boolean(sm));
}
