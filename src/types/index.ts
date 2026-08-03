export type PostStatus = 'rascunho' | 'aprovado' | 'alterar';

export type UserRole = 'gestor' | 'social_media' | 'cliente';

export type SocialNetwork = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'youtube';

export type MetricsVisibility = 'cliente' | 'social_media' | 'ambos' | 'gestor_apenas';

export interface SocialMediaUser {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  socialProfile: string; // OBRIGATÓRIO (Ex: instagram.com/usuario ou linkedin.com/in/usuario)
  pixKey: string;
  assignedClientIds: string[];
  totalPostsCreated: number;
  avatarUrl?: string;
  status?: 'ativo' | 'bloqueado';
}

export interface Comment {
  id: string;
  authorRole: UserRole;
  authorName: string;
  avatarUrl?: string;
  text: string;
  timestamp: string;
  isInternalDebate?: boolean; // Debate entre gestor e social media
}

export interface InspirationFile {
  id: string;
  clientProjectId: string;
  title: string;
  description?: string;
  url: string;
  type: 'image' | 'link' | 'doc';
  uploadedByRole: UserRole;
  uploadedByName: string;
  createdAt: string;
  isUsed?: boolean;
  usedAt?: string;
  retentionOption?: 'keep_90_days' | 'delete_now';
  expiresAt?: string;
}

export interface PostItem {
  id: string;
  clientProjectId: string;
  title: string;
  caption: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'carousel';
  socialNetworks: SocialNetwork[];
  scheduledDate: string;
  status: PostStatus;
  comments: Comment[];
  inspirationReferenceIds?: string[];
  isPublished?: boolean; // Acompanhar se já foi publicado
  publishedAt?: string;
  previewCleanedUp?: boolean; // Confirmação do social media para apagar preview
  socialMediaAuthorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProject {
  id: string;
  name: string;
  companyName: string;
  cnpj: string;
  address: string;
  contactName: string;
  whatsappNumber: string;
  email: string;
  pricePerPost: number;
  metricsAccess: MetricsVisibility; // Quem pode ver o painel de métricas
  googleDriveFolderUrl?: string;
  logoUrl?: string; // Logomarca para recibo PDF e perfil
  activeSocialNetworks: SocialNetwork[]; // Redes sociais que o cliente utiliza
  assignedSocialMediaId?: string;
  status?: 'ativo' | 'bloqueado';
  driveStorageUsedGB?: number;
  driveStorageLimitGB?: number;
}

export interface SaaSPaymentProof {
  id: string;
  socialMediaId: string;
  socialMediaName: string;
  clientProjectId?: string;
  clientName?: string;
  period: string; // Ex: "Julho/2026"
  postsCount: number;
  feePerPost: number;
  totalAmount: number;
  proofUrl: string; // Link/Imagem do comprovante Pix de pagamento do SaaS
  notes?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  submittedAt: string;
}

export interface ReceiptLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BillingReceipt {
  id: string;
  receiptNumber: string;
  clientProjectId: string;
  period: string; // Ex: "Julho / 2026"
  issueDate: string;
  dueDate: string;
  items: ReceiptLineItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  platformFeeTotal: number; // R$ 0,50 x total de posts
  paymentMethod: string;
  notes: string;
  status: 'rascunho' | 'enviado' | 'pago';
  // Campos customizados do recibo conforme print oficial
  cityState?: string; // Ex: "Aracaju-SE"
  serviceSummaryText?: string; // Ex: "criação e postagens de stories, 22 artes para o feed e 3 vídeos editados"
  socialMediaName?: string;
  socialMediaPix?: string;
  socialMediaBank?: string;
  socialMediaCpfCnpj?: string;
  socialMediaSignatureUrl?: string;
}

export interface CompetitorComparison {
  competitorName: string;
  clientFollowers: number;
  competitorFollowers: number;
  clientEngagement: number;
  competitorEngagement: number;
  clientPostFrequency: number; // posts por semana
  competitorPostFrequency: number;
  clientEstAdBudget: number; // R$ investido em tráfego
  competitorEstAdBudget: number;
  clientSavesAvg?: number; // média de salvamentos por post
  competitorSavesAvg?: number;
  clientVideoViews?: number; // média de visualizações de vídeo
  competitorVideoViews?: number;
}

export interface FormatPerformance {
  format: 'Reels' | 'Carrossel' | 'Imagem Estática' | 'Stories';
  reach: number;
  engagement: number;
  avgLikes: number;
  avgComments: number;
  avgSaves: number;
}

export interface MetricOverview {
  year: number;
  totalImpressions: number;
  impressionsGrowth: number;
  totalReach: number;
  reachGrowth: number;
  engagementRate: number;
  engagementGrowth: number;
  totalClicks: number;
  conversions: number;
  // Métricas solicitadas pelo usuário:
  commentsCount: number;
  commentsGrowth: number;
  profileClicks: number;
  profileClicksGrowth: number;
  paidAdsSpend: number; // Valor gasto no tráfego pago (turbinar)
  paidAdsGrowth: number;
  // Sugestões avançadas adicionais:
  costPerClick: number; // CPC R$
  paidReachRatio: number; // % de alcance vindo de tráfego pago
  videoWatchRate: number; // % retenção de Reels/vídeos
  savesCount: number; // Salvamentos totais de posts
  savesGrowth: number;
  sharesCount: number; // Compartilhamentos totais
  sharesGrowth: number;
  roas: number; // Retorno sobre Investimento em Anúncios (ex: 4.8x)
  cpl: number; // Custo por Lead / Mensagem no WhatsApp/Direct (ex: R$ 6.80)
  cpm: number; // Custo por Mil Impressões (ex: R$ 8.45)
  formatPerformance?: FormatPerformance[];
  competitor: CompetitorComparison;
}

export interface ChannelPerformance {
  network: SocialNetwork;
  followers: number;
  growth: number;
  impressions: number;
  engagement: number;
}

export interface WhatsAppNotificationPayload {
  recipientPhone: string;
  recipientName: string;
  type: 'novo_rascunho' | 'pedido_alteracao' | 'aprovacao' | 'novo_recibo';
  postTitle?: string;
  postStatus?: PostStatus;
  customMessage?: string;
  receiptUrl?: string;
}
