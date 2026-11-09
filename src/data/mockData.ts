import { ClientProject, PostItem, InspirationFile, BillingReceipt, MetricOverview, ChannelPerformance, SocialMediaUser } from '../types';

export const INITIAL_SOCIAL_MEDIAS: SocialMediaUser[] = [];

export const INITIAL_CLIENTS: ClientProject[] = [];

export const INITIAL_SAAS_PROOF_PAYMENTS: import('../types').SaaSPaymentProof[] = [];

export const INITIAL_POSTS: PostItem[] = [];

export const INITIAL_INSPIRATIONS: InspirationFile[] = [];

export const INITIAL_RECEIPTS: BillingReceipt[] = [];

// Dados de Demonstração Opcionais (Caso o usuário clique em 'Carregar Exemplos de Teste')
export const DEMO_SOCIAL_MEDIAS: SocialMediaUser[] = [
  {
    id: 'sm-1',
    name: 'Ana Cláudia Martins',
    email: 'ana.martins@agency.com',
    whatsapp: '5511988776655',
    socialProfile: 'https://instagram.com/anamartins_design',
    pixKey: 'ana.martins@agency.com',
    assignedClientIds: ['client-1'],
    totalPostsCreated: 12,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  }
];

export const DEMO_CLIENTS: ClientProject[] = [
  {
    id: 'client-1',
    name: 'Exemplo: Café & Aroma Co.',
    companyName: 'Café & Aroma LTDA',
    cnpj: '12.345.678/0001-90',
    address: 'Av. Paulista, 1500 - São Paulo/SP',
    contactName: 'Mariana Silva (Diretora)',
    whatsappNumber: '5511998765432',
    email: 'marianasilva@cafearoma.com.br',
    pricePerPost: 150.00,
    metricsAccess: 'cliente',
    googleDriveFolderUrl: 'https://drive.google.com/drive/folders/sample-cafe-aroma',
    logoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80',
    activeSocialNetworks: ['instagram', 'facebook', 'tiktok'],
    assignedSocialMediaId: 'sm-1',
    driveStorageUsedGB: 4.8,
    driveStorageLimitGB: 15.0
  }
];

export const MOCK_METRICS: MetricOverview = {
  year: 2026,
  totalImpressions: 148500,
  impressionsGrowth: 24.5,
  totalReach: 92300,
  reachGrowth: 18.2,
  engagementRate: 6.8,
  engagementGrowth: 1.4,
  totalClicks: 3420,
  conversions: 184,
  // Métricas solicitadas:
  commentsCount: 1420,
  commentsGrowth: 15.8,
  profileClicks: 4890,
  profileClicksGrowth: 22.4,
  paidAdsSpend: 1250.00, // R$ 1.250,00 investidos em anúncios/turbinar
  paidAdsGrowth: 12.0,
  // Sugestões adicionais:
  costPerClick: 0.36, // R$ 0,36 por clique no link
  paidReachRatio: 42.0, // 42% do alcance gerado via tráfego pago
  videoWatchRate: 68.5, // 68.5% de retenção média nos Reels
  savesCount: 840,
  savesGrowth: 31.2,
  sharesCount: 1150,
  sharesGrowth: 27.4,
  roas: 4.8, // 4.8x retorno financeiro por R$ 1 de anúncio
  cpl: 6.80, // R$ 6,80 por lead no Direct / WhatsApp
  cpm: 8.42, // R$ 8,42 custo por mil impressões
  formatPerformance: [
    { format: 'Reels', reach: 45200, engagement: 9.4, avgLikes: 680, avgComments: 85, avgSaves: 140 },
    { format: 'Carrossel', reach: 28100, engagement: 7.8, avgLikes: 420, avgComments: 62, avgSaves: 195 },
    { format: 'Imagem Estática', reach: 12400, engagement: 4.2, avgLikes: 210, avgComments: 18, avgSaves: 45 },
    { format: 'Stories', reach: 6600, engagement: 5.1, avgLikes: 95, avgComments: 12, avgSaves: 8 }
  ],
  competitor: {
    competitorName: 'Café & Grão Supremo (Principal Concorrente)',
    clientFollowers: 28400,
    competitorFollowers: 32100,
    clientEngagement: 6.8,
    competitorEngagement: 4.2,
    clientPostFrequency: 5, // 5 posts/semana
    competitorPostFrequency: 3, // 3 posts/semana
    clientEstAdBudget: 1250, // R$ 1.250/mês
    competitorEstAdBudget: 800, // R$ 800/mês
    clientSavesAvg: 96,
    competitorSavesAvg: 41,
    clientVideoViews: 14500,
    competitorVideoViews: 8200
  }
};

export const MOCK_CHANNELS: ChannelPerformance[] = [
  { network: 'instagram', followers: 28400, growth: 5.2, impressions: 84000, engagement: 7.4 },
  { network: 'facebook', followers: 14200, growth: 1.1, impressions: 32000, engagement: 4.2 },
  { network: 'tiktok', followers: 39100, growth: 12.8, impressions: 28500, engagement: 9.1 },
  { network: 'linkedin', followers: 8900, growth: 8.4, impressions: 14000, engagement: 5.8 }
];
