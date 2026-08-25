// src/admin/types.ts
import { ClientProject, PostItem, BillingReceipt, SocialMediaUser, SaaSPaymentProof } from '../types';

export interface AdminSaaSDashboardProps {
  clients: ClientProject[];
  posts: PostItem[];
  receipts: BillingReceipt[];
  socialMedias: SocialMediaUser[];
  saasProofs?: SaaSPaymentProof[];
  onAddSocialMedia: (newSm: Omit<SocialMediaUser, 'id' | 'totalPostsCreated'>) => void;
  onDeleteSocialMedia: (id: string) => void;
  onToggleBlockSocialMedia: (smId: string) => void;
  onUpdateSocialMediaFee?: (smId: string, customFeePerPost?: number) => void;
  onToggleBlockClient: (clientId: string) => void;
  onAddClient?: (newClient: ClientProject) => void;
  feePerPost: number;
  onUpdateFeePerPost: (newFee: number) => void;
  onAddSaasProof?: (newProof: Omit<SaaSPaymentProof, 'id' | 'submittedAt' | 'status'>) => void;
  onUpdateSaasProofStatus?: (proofId: string, status: 'aprovado' | 'rejeitado') => void;
  onNavigateTab?: (tab: 'book' | 'market') => void;
}

// Cada aba recebe exatamente esses dados/callbacks vindos do App.tsx (via index.tsx).
// Todo o resto (modais, formulários, estado de UI) agora é local de cada aba.
export type AdminTabSharedProps = AdminSaaSDashboardProps;
