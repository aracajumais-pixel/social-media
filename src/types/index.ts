export type PostStatus = 'rascunho' | 'aprovado' | 'alterar';

export type UserRole = 'gestor' | 'social_media' | 'cliente';

export type SupabaseUserRole = 'DEVWEBAPP' | 'social_media' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  supabaseRole: SupabaseUserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type SocialNetwork = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'youtube';

export type MetricsVisibility = 'cliente' | 'social_media' | 'ambos' | 'gestor_apenas';

export interface SocialMediaUser {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  socialProfile: string; // (Ex: instagram.com/usuario ou linkedin.com/in/usuario)
  pixKey: string;
  assignedClientIds: string[];
  totalPostsCreated: number;
  avatarUrl?: string;
  status?: 'ativo' | 'bloqueado';
  customFeePerPost?: number; // Taxa específica por post para este social media (substitui o valor global se preenchido)
  companyName?: string;
  cnpj?: string;
  address?: string;
  contactName?: string;
  whatsappNumber?: string;
  pricePerPost?: number;
  googleDriveFolderUrl?: string;
  logoUrl?: string;
  activeSocialNetworks?: SocialNetwork[];
  signatureUrl?: string;
  bankInfo?: string;
  additionalInfo?: string;
}

export interface Comment {
  id: string;
  authorRole: UserRole;
  authorName: string;
  avatarUrl?: string;
  authorPhone?: string; // Número do WhatsApp de quem respondeu / comentou
  authorEmail?: string; // E-mail de quem comentou
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
  approvalToken?: string; // Token secreto UUID para URL pública de aprovação
  tokenExpiresAt?: string; // Data e hora limite de acesso (expira em 5 dias)
  comments: Comment[];
  inspirationReferenceIds?: string[];
  isPublished?: boolean; // Acompanhar se já foi publicado
  publishedAt?: string;
  previewCleanedUp?: boolean; // Confirmação do social media para apagar preview
  socialMediaAuthorId?: string;
  linkedTaskId?: string; // ID da tarefa solicitada pelo cliente que originou este post
  approvedAt?: string; // Data/hora oficial da aprovação para auditoria e faturamento
  approvedBy?: string; // Nome/identificação de quem aprovou
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRecord {
  id: string;
  postId: string;
  postTitle: string;
  clientProjectId: string;
  clientName: string;
  socialMediaId?: string;
  socialMediaName?: string;
  approvedAt: string; // ISO string da aprovação oficial
  approvedByRole: UserRole;
  approvedByName: string;
  approvedByPhone?: string;
  approvedByEmail?: string;
  pricePerPostSnapshot: number;
  feePerPostSnapshot: number;
  billingStatus: 'computado' | 'faturado';
  postDeletedAt?: string; // Preenchido se o card do post for excluído após a aprovação
}

export type TaskStatus = 'novo' | 'em_andamento' | 'atendido' | 'concluido';

export interface ClientTask {
  id: string;
  clientProjectId: string;
  title: string;
  description: string;
  deadline: string; // Data e prazo limite de entrega
  status: TaskStatus; // 'novo', 'em_andamento', 'atendido' ou 'concluido'
  linkedPostId?: string; // ID do rascunho de post atrelado a esta tarefa
  createdAt: string;
  updatedAt?: string;
  createdByRole: UserRole;
  createdByName?: string;
}

export interface ClientProject {
  id: string;
  name: string;
  companyName: string;
  cnpj: string;
  address: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  contactName: string;
  whatsappNumber: string;
  email: string;
  pricePerPost: number;
  metricsAccess: MetricsVisibility; // Quem pode ver o painel de métricas
  googleDriveFolderUrl?: string;
  logoUrl?: string; // Logomarca para recibo PDF e perfil
  activeSocialNetworks: SocialNetwork[]; // Redes sociais que o cliente utiliza
  assignedSocialMediaId?: string;
  createdBySocialMediaId?: string;
  status?: 'ativo' | 'bloqueado';
  additionalInfo?: string; // Informações adicionais, orientações ou regras específicas
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
  customReceiptText?: string; // Texto/declaração customizada do recibo (permite edição livre do texto completo)
  socialMediaName?: string;
  socialMediaPix?: string;
  socialMediaBank?: string;
  socialMediaCpfCnpj?: string;
  socialMediaSignatureUrl?: string;
  socialMediaLogoUrl?: string;
  socialMediaId?: string;
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

// ============================================================
// MÓDULO ANIVERSARIANTES (Enquadramento IA, Grupos, Molduras PNG & Auditoria)
// ============================================================

export interface BirthdayCutoutRect {
  x: number; // % da largura (0..100)
  y: number; // % da altura (0..100)
  width: number; // % da largura (0..100)
  height: number; // % da altura (0..100)
}

export interface BirthdayElementTransform {
  xPct: number; // Centro X em % do canvas (0..100)
  yPct: number; // Centro Y em % do canvas (0..100)
  widthPct: number; // Largura da caixa em % (10..95)
  scale: number; // Escala de tamanho do objeto (0.4..2.5)
  rotation: number; // Rotação em graus (-180..180)
}

export interface BirthdayElementSet {
  date: BirthdayElementTransform;
  name: BirthdayElementTransform;
  message: BirthdayElementTransform;
}

export interface BirthdayBackground {
  id: string;
  clientProjectId: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  cutoutRect: BirthdayCutoutRect;
  defaultElements: BirthdayElementSet;
  aiAnalysisNotes?: string;
  createdAt: string;
  createdByName?: string;
}

export interface BirthdayGroup {
  id: string;
  clientProjectId: string;
  name: string; // Ex: Adultos, Adolescentes, Crianças
  backgroundId: string;
  defaultMessageId?: string;
  createdAt: string;
}

export interface BirthdayMessage {
  id: string;
  clientProjectId: string;
  title: string;
  text: string;
  createdAt: string;
}

export interface BirthdayPhotoTransform {
  scale: number; // Zoom relativo ao recorte (1 = ajuste base)
  offsetX: number; // Deslocamento X em % do recorte (-50..50)
  offsetY: number; // Deslocamento Y em % do recorte (-50..50)
  faceBox?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
  aiFramed?: boolean;
  notes?: string;
}

export interface BirthdayPerson {
  id: string;
  clientProjectId: string;
  name: string;
  birthDay: number; // 1..31
  birthMonth: number; // 1..12
  groupId: string;
  messageId: string;
  photoUrl: string;
  photoTransform: BirthdayPhotoTransform;
  elementOverrides?: BirthdayElementSet;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  createdByRole?: UserRole;
}

export interface BirthdayAuditLog {
  id: string;
  clientProjectId: string;
  actorName: string;
  actorEmail?: string;
  actorRole: UserRole;
  action: string;
  targetType: 'aniversariante' | 'plano_de_fundo' | 'grupo' | 'mensagem' | 'arte_exportada' | 'login_cliente';
  targetLabel: string;
  timestamp: string;
  details?: string;
}

export interface BirthdayClientAuthSession {
  clientId: string;
  name: string;
  email: string;
  authenticatedAt: string;
  method: 'supabase' | 'audit_login';
}

