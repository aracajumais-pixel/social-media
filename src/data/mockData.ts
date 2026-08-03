import { ClientProject, PostItem, InspirationFile, BillingReceipt, MetricOverview, ChannelPerformance, SocialMediaUser } from '../types';

export const INITIAL_SOCIAL_MEDIAS: SocialMediaUser[] = [
  {
    id: 'sm-1',
    name: 'Ana Cláudia Martins',
    email: 'ana.martins@agency.com',
    whatsapp: '5511988776655',
    socialProfile: 'https://instagram.com/anamartins_design', // OBRIGATÓRIO
    pixKey: 'ana.martins@agency.com',
    assignedClientIds: ['client-1', 'client-3'],
    totalPostsCreated: 28,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'sm-2',
    name: 'Bruno Ramos',
    email: 'bruno.ramos@agency.com',
    whatsapp: '5511977665544',
    socialProfile: 'https://linkedin.com/in/brunoramos-copywriter', // OBRIGATÓRIO
    pixKey: '11977665544',
    assignedClientIds: ['client-2'],
    totalPostsCreated: 19,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  }
];

export const INITIAL_CLIENTS: ClientProject[] = [
  {
    id: 'client-1',
    name: 'Café & Aroma Co.',
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
  },
  {
    id: 'client-2',
    name: 'TechFlow Solutions',
    companyName: 'TechFlow Inovação Digital S.A.',
    cnpj: '98.765.432/0001-10',
    address: 'Rua da Inovação, 400 - Florianópolis/SC',
    contactName: 'Carlos Eduardo (CMO)',
    whatsappNumber: '5548988223344',
    email: 'carlos@techflow.io',
    pricePerPost: 220.00,
    metricsAccess: 'social_media',
    googleDriveFolderUrl: 'https://drive.google.com/drive/folders/sample-techflow',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    activeSocialNetworks: ['linkedin', 'instagram', 'youtube'],
    assignedSocialMediaId: 'sm-2',
    driveStorageUsedGB: 8.4,
    driveStorageLimitGB: 20.0
  },
  {
    id: 'client-3',
    name: 'Clínica Lume Estética',
    companyName: 'Lume Serviços Médicos LTDA',
    cnpj: '45.112.334/0001-88',
    address: 'Alameda Santos, 800 - São Paulo/SP',
    contactName: 'Dra. Beatriz Mendes',
    whatsappNumber: '5511977112233',
    email: 'beatriz@clinicalume.com.br',
    pricePerPost: 180.00,
    metricsAccess: 'ambos',
    googleDriveFolderUrl: 'https://drive.google.com/drive/folders/sample-lume',
    logoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80',
    activeSocialNetworks: ['instagram', 'tiktok'],
    assignedSocialMediaId: 'sm-1',
    driveStorageUsedGB: 2.1,
    driveStorageLimitGB: 15.0
  }
];

export const INITIAL_SAAS_PROOF_PAYMENTS: import('../types').SaaSPaymentProof[] = [
  {
    id: 'proof-1',
    socialMediaId: 'sm-1',
    socialMediaName: 'Ana Cláudia Martins',
    clientProjectId: 'client-1',
    clientName: 'Café & Aroma Co.',
    period: 'Julho/2026',
    postsCount: 22,
    feePerPost: 0.50,
    totalAmount: 11.00,
    proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    notes: 'Comprovante Pix referente a 22 posts do Café & Aroma',
    status: 'aprovado',
    submittedAt: '2026-07-28T16:00:00'
  },
  {
    id: 'proof-2',
    socialMediaId: 'sm-2',
    socialMediaName: 'Bruno Ramos',
    clientProjectId: 'client-2',
    clientName: 'TechFlow Solutions',
    period: 'Julho/2026',
    postsCount: 19,
    feePerPost: 0.50,
    totalAmount: 9.50,
    proofUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
    notes: 'Pagamento Pix da taxa de R$ 0,50 por post da TechFlow',
    status: 'pendente',
    submittedAt: '2026-07-29T10:30:00'
  }
];

export const INITIAL_POSTS: PostItem[] = [
  {
    id: 'post-101',
    clientProjectId: 'client-1',
    title: 'Lançamento do Grão Especial da Moka',
    caption: '☕ Descubra o aroma inconfundível do nosso novo Lote Reserva Moka! Notas florais com toque de caramelo silvestre. Disponível a partir deste sábado em todas as nossas unidades ou pelo app. Marque aquele amigo louco por café! #CafeEspecial #MokaCoffee #CafeAroma',
    mediaUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    mediaType: 'image',
    socialNetworks: ['instagram', 'facebook'],
    scheduledDate: '2026-08-02T10:00:00',
    status: 'rascunho',
    isPublished: false,
    previewCleanedUp: false,
    socialMediaAuthorId: 'sm-1',
    createdAt: '2026-07-28T14:20:00',
    updatedAt: '2026-07-28T14:20:00',
    inspirationReferenceIds: ['insp-1'],
    comments: [
      {
        id: 'c-1',
        authorRole: 'social_media',
        authorName: 'Ana (Social Media)',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        text: 'Enviei o rascunho com a foto do grão torrado com luz natural. O que achou do tom da legenda?',
        timestamp: '2026-07-28 14:22'
      },
      {
        id: 'c-2',
        authorRole: 'gestor',
        authorName: 'Lucas (Gestor de Conta)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        text: 'Excelente ângulo. Ajustei o agendamento para 10h do sábado que tem maior taxa de abertura.',
        timestamp: '2026-07-28 15:05'
      }
    ]
  },
  {
    id: 'post-102',
    clientProjectId: 'client-1',
    title: 'Reels: Bastidores da Torra do Café',
    caption: '🎥 Você sabe o que acontece antes do seu café chegar na xícara? Assista ao nosso processo artesanal de torra controlada por grau de temperatura! Dê o play e sinta o aroma daí! 🍂✨',
    mediaUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
    mediaType: 'video',
    socialNetworks: ['instagram', 'tiktok'],
    scheduledDate: '2026-08-04T18:30:00',
    status: 'alterar',
    isPublished: false,
    previewCleanedUp: false,
    socialMediaAuthorId: 'sm-1',
    createdAt: '2026-07-27T11:00:00',
    updatedAt: '2026-07-29T09:15:00',
    comments: [
      {
        id: 'c-3',
        authorRole: 'cliente',
        authorName: 'Mariana Silva (Cliente)',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
        text: 'Achei o vídeo ótimo, mas por favor troquem a música de fundo por um jazz instrumental mais suave, sem vocais. E enfatizem o endereço no final.',
        timestamp: '2026-07-29 09:15'
      }
    ]
  },
  {
    id: 'post-103',
    clientProjectId: 'client-1',
    title: 'Carrossel Dicas: Como Guardar Café em Casa',
    caption: '💡 Guia Prático: 4 erros comuns ao armazenar seus grãos ou pó de café. Deslize para o lado e garanta o frescor por semanas! 🧊❌ Pote transparente na luz direta nunca mais!',
    mediaUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    mediaType: 'carousel',
    socialNetworks: ['instagram', 'facebook'],
    scheduledDate: '2026-08-06T12:00:00',
    status: 'aprovado',
    isPublished: true,
    publishedAt: '2026-07-29T10:00:00',
    previewCleanedUp: true,
    socialMediaAuthorId: 'sm-1',
    createdAt: '2026-07-25T16:00:00',
    updatedAt: '2026-07-28T11:30:00',
    comments: [
      {
        id: 'c-4',
        authorRole: 'cliente',
        authorName: 'Mariana Silva (Cliente)',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
        text: 'Aprovado sem ressalvas! O design das lâminas ficou perfeito com a identidade visual.',
        timestamp: '2026-07-28 11:30'
      }
    ]
  },
  {
    id: 'post-201',
    clientProjectId: 'client-2',
    title: 'Infográfico: IA na Automação de Processos',
    caption: '🚀 Como empresas de alto crescimento reduziram em até 40% o tempo operacional integrando soluções baseadas em LLM. Confira os dados do relatório Q2 TechFlow.',
    mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    mediaType: 'image',
    socialNetworks: ['linkedin', 'instagram'],
    scheduledDate: '2026-08-03T09:00:00',
    status: 'aprovado',
    isPublished: false,
    previewCleanedUp: false,
    socialMediaAuthorId: 'sm-2',
    createdAt: '2026-07-26T10:00:00',
    updatedAt: '2026-07-27T16:00:00',
    comments: [
      {
        id: 'c-5',
        authorRole: 'cliente',
        authorName: 'Carlos Eduardo (Cliente)',
        text: 'Aprovado! Vamos impulsionar esta publicação no LinkedIn.',
        timestamp: '2026-07-27 16:00'
      }
    ]
  }
];

export const INITIAL_INSPIRATIONS: InspirationFile[] = [
  {
    id: 'insp-1',
    clientProjectId: 'client-1',
    title: 'Referência de Iluminação para Fotos de Produto',
    description: 'Estilo de iluminação suave e tons amadeirados da marca internacional Blue Bottle Coffee.',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    uploadedByRole: 'cliente',
    uploadedByName: 'Mariana Silva (Cliente)',
    createdAt: '2026-07-26T15:30:00'
  },
  {
    id: 'insp-2',
    clientProjectId: 'client-1',
    title: 'Exemplo de Transição de Vídeo Reels Cortado',
    description: 'Gostei do ritmo deste vídeo do TikTok para usarmos no vídeo da torra.',
    url: 'https://vimeo.com/sample-inspiration-link',
    type: 'link',
    uploadedByRole: 'cliente',
    uploadedByName: 'Mariana Silva (Cliente)',
    createdAt: '2026-07-27T08:10:00'
  },
  {
    id: 'insp-3',
    clientProjectId: 'client-2',
    title: 'Manual de Paleta de Cores & Fontes Q3',
    description: 'Documento em PDF com novas diretrizes da marca para o semestre.',
    url: 'https://drive.google.com/sample-brandbook.pdf',
    type: 'doc',
    uploadedByRole: 'cliente',
    uploadedByName: 'Carlos Eduardo (Cliente)',
    createdAt: '2026-07-20T10:00:00'
  }
];

export const INITIAL_RECEIPTS: BillingReceipt[] = [
  {
    id: 'rec-1',
    receiptNumber: 'REC-2026-007',
    clientProjectId: 'client-1',
    period: 'Julho / 2026',
    issueDate: '2026-07-29',
    dueDate: '2026-08-05',
    items: [
      {
        id: 'item-1',
        description: 'Produção e Gestão de Posts no Instagram & Facebook',
        quantity: 12,
        unitPrice: 150.00,
        total: 1800.00
      },
      {
        id: 'item-2',
        description: 'Captação e Edição de Vídeos Reels em Alta Definição',
        quantity: 4,
        unitPrice: 250.00,
        total: 1000.00
      },
      {
        id: 'item-3',
        description: 'Monitoramento & Relatório Mensal de Performance',
        quantity: 1,
        unitPrice: 300.00,
        total: 300.00
      }
    ],
    subtotal: 3100.00,
    discount: 100.00,
    totalAmount: 3000.00,
    platformFeeTotal: 8.00, // 16 posts x R$ 0,50
    paymentMethod: 'Pix / Transferência Bancária',
    notes: 'Agradecemos a parceria! O pagamento pode ser feito via Chave Pix CNPJ: 12.345.678/0001-90.',
    status: 'enviado'
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
