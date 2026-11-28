import {
  ApprovalRecord,
  BillingReceipt,
  BirthdayAuditLog,
  BirthdayBackground,
  BirthdayGroup,
  BirthdayMessage,
  BirthdayPerson,
  ClientProject,
  ClientTask,
  InspirationFile,
  PostItem,
  SocialMediaUser,
  UserRole,
} from '../types';

export interface SharedServerState {
  clients?: ClientProject[];
  socialMedias?: SocialMediaUser[];
  posts?: PostItem[];
  tasks?: ClientTask[];
  inspirations?: InspirationFile[];
  receipts?: BillingReceipt[];
  approvalRecords?: ApprovalRecord[];
  birthdayBackgrounds?: BirthdayBackground[];
  birthdayGroups?: BirthdayGroup[];
  birthdayMessages?: BirthdayMessage[];
  birthdayPeople?: BirthdayPerson[];
  birthdayAuditLogs?: BirthdayAuditLog[];
}

export interface LocalServerAuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export async function fetchServerAuthStatus(): Promise<{
  available: boolean;
  initialized: boolean;
}> {
  try {
    const res = await fetch('/api/auth/status', { cache: 'no-store' });
    if (!res.ok) return { available: false, initialized: false };
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return { available: false, initialized: false };
    const data = await res.json();
    return {
      available: Boolean(data?.ok),
      initialized: Boolean(data?.initialized),
    };
  } catch {
    return { available: false, initialized: false };
  }
}

export async function setupLocalAdminAccount(params: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; token?: string; user?: LocalServerAuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || 'Falha ao criar acesso inicial.' };
    }
    return { ok: true, token: data.token, user: data.user };
  } catch {
    return { ok: false, error: 'Servidor indisponível no momento.' };
  }
}

export async function loginLocalServerAccount(params: {
  email: string;
  password: string;
}): Promise<{ ok: boolean; token?: string; user?: LocalServerAuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || 'E-mail ou senha inválidos.' };
    }
    return { ok: true, token: data.token, user: data.user };
  } catch {
    return { ok: false, error: 'Servidor indisponível no momento.' };
  }
}

export async function logoutLocalServerAccount(authToken?: string | null): Promise<void> {
  if (!authToken) return;
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
  } catch {
    // ignore
  }
}

export async function fetchSharedServerState(authToken?: string | null): Promise<SharedServerState | null> {
  if (!authToken) return null;
  try {
    const res = await fetch('/api/sync-state', {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    const data = await res.json();
    if (data?.ok && data?.state && typeof data.state === 'object') {
      return data.state as SharedServerState;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveSharedServerStatePatch(
  patch: SharedServerState,
  authToken?: string | null
): Promise<boolean> {
  if (!authToken) return false;
  try {
    const res = await fetch('/api/sync-state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}

export async function fetchLocalPublicPost(token: string): Promise<{
  post: PostItem | null;
  client: ClientProject | null;
  socialMedia: SocialMediaUser | null;
} | null> {
  try {
    const res = await fetch(`/api/public/post/${encodeURIComponent(token)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    const data = await res.json();
    if (!data?.ok) return null;
    return {
      post: data.post || null,
      client: data.client || null,
      socialMedia: data.socialMedia || null,
    };
  } catch {
    return null;
  }
}

export async function submitLocalPublicPostAction(
  token: string,
  payload: { action: 'approve' | 'request_change' | 'comment'; comment?: string; authorName?: string }
): Promise<boolean> {
  try {
    const res = await fetch(`/api/public/post/${encodeURIComponent(token)}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}

export async function fetchLocalPublicMural(clientId: string, smId?: string): Promise<{
  client: ClientProject | null;
  socialMedia: SocialMediaUser | null;
  posts: PostItem[];
  tasks: ClientTask[];
  inspirations: InspirationFile[];
} | null> {
  try {
    const qs = smId ? `?sm=${encodeURIComponent(smId)}` : '';
    const res = await fetch(`/api/public/mural/${encodeURIComponent(clientId)}${qs}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    const data = await res.json();
    if (!data?.ok) return null;
    return {
      client: data.client || null,
      socialMedia: data.socialMedia || null,
      posts: Array.isArray(data.posts) ? data.posts : [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      inspirations: Array.isArray(data.inspirations) ? data.inspirations : [],
    };
  } catch {
    return null;
  }
}
