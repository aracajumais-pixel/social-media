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

export async function fetchSharedServerState(): Promise<SharedServerState | null> {
  try {
    const res = await fetch('/api/sync-state', { cache: 'no-store' });
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

export async function saveSharedServerStatePatch(patch: SharedServerState): Promise<boolean> {
  try {
    const res = await fetch('/api/sync-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}
