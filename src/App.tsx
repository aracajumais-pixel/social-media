import React, { useState } from 'react';
import { 
  INITIAL_CLIENTS, INITIAL_POSTS, INITIAL_INSPIRATIONS, 
  INITIAL_RECEIPTS, MOCK_METRICS, MOCK_CHANNELS, INITIAL_SOCIAL_MEDIAS, INITIAL_SAAS_PROOF_PAYMENTS,
  DEMO_CLIENTS, DEMO_SOCIAL_MEDIAS
} from './data/mockData';
import { 
  ClientProject, PostItem, InspirationFile, BillingReceipt, 
  UserRole, PostStatus, WhatsAppNotificationPayload, SocialMediaUser, SaaSPaymentProof, SocialNetwork
} from './types';

import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { PostCard } from './components/PostCard';
import { PostDetailModal } from './components/PostDetailModal';
import { NewPostModal } from './components/NewPostModal';
import { InspirationSection } from './components/InspirationSection';
import { ReceiptGenerator } from './components/ReceiptGenerator';
import { MetricsDashboard } from './components/MetricsDashboard';
import { WhatsAppNotificationModal } from './components/WhatsAppNotificationModal';
import { StorageDriveModal } from './components/StorageDriveModal';
import { ClientSettings } from './components/ClientSettings';
import { AdminSaaSDashboard } from './components/AdminSaaSDashboard';
import { ProjectBookView } from './components/ProjectBookView';
import { MarketAnalysisView } from './components/MarketAnalysisView';
import { ApprovalPublicModal } from './components/ApprovalPublicModal';
import { generateApprovalToken, calculateTokenExpirationDays } from './utils/token';
import { auditPostCommentToSupabase, syncSocialMediaToSupabase, syncClientToSupabase, syncAllClientsToSupabase, syncPostToSupabase, syncAllPostsToSupabase, isSupabaseConfigured } from './lib/supabase';

import { Plus, Filter, Clock, CheckCircle2, AlertCircle, Search, Layers, Sparkles, Building2 } from 'lucide-react';

const defaultEmptyClient: ClientProject = {
  id: 'novo-cliente',
  name: 'Empresa Exemplo (Cadastre seu Cliente)',
  companyName: 'Sua Empresa LTDA',
  cnpj: '00.000.000/0001-00',
  address: 'Cadastre o endereço nas configurações do cliente',
  contactName: 'Contato Principal',
  whatsappNumber: '5511999998888',
  email: 'contato@cliente.com.br',
  pricePerPost: 150.00,
  metricsAccess: 'ambos',
  googleDriveFolderUrl: '',
  activeSocialNetworks: ['instagram', 'facebook'],
  driveStorageUsedGB: 0,
  driveStorageLimitGB: 15.0
};

export default function App() {
  // Global State with LocalStorage Persistence (Opção B - Funciona 100% Grátis sem Cartão)
  const [clients, setClients] = useState<ClientProject[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_clients');
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });
  const [socialMedias, setSocialMedias] = useState<SocialMediaUser[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_social_medias');
      return saved ? JSON.parse(saved) : INITIAL_SOCIAL_MEDIAS;
    } catch {
      return INITIAL_SOCIAL_MEDIAS;
    }
  });
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return localStorage.getItem('social_saas_selected_client_id') || 'client-1';
  });
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('social_saas_user_role') as UserRole) || 'gestor';
  });
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  const [posts, setPosts] = useState<PostItem[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_posts');
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });
  const [inspirations, setInspirations] = useState<InspirationFile[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_inspirations');
      return saved ? JSON.parse(saved) : INITIAL_INSPIRATIONS;
    } catch {
      return INITIAL_INSPIRATIONS;
    }
  });
  const [receipts, setReceipts] = useState<BillingReceipt[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_receipts');
      return saved ? JSON.parse(saved) : INITIAL_RECEIPTS;
    } catch {
      return INITIAL_RECEIPTS;
    }
  });
  const [feePerPost, setFeePerPost] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('social_saas_fee_per_post');
      return saved ? Number(saved) : 0.50;
    } catch {
      return 0.50;
    }
  });
  const [saasProofs, setSaasProofs] = useState<SaaSPaymentProof[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_saas_proofs');
      return saved ? JSON.parse(saved) : INITIAL_SAAS_PROOF_PAYMENTS;
    } catch {
      return INITIAL_SAAS_PROOF_PAYMENTS;
    }
  });

  // Auto-save state to localStorage and sync to Supabase
  React.useEffect(() => {
    try { localStorage.setItem('social_saas_clients', JSON.stringify(clients)); } catch {}
    if (isSupabaseConfigured) {
      syncAllClientsToSupabase(clients);
    }
  }, [clients]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_social_medias', JSON.stringify(socialMedias)); } catch {}
  }, [socialMedias]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_selected_client_id', selectedClientId); } catch {}
  }, [selectedClientId]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_user_role', currentUserRole); } catch {}
    if (currentUserRole !== 'gestor' && (activeTab === 'book' || activeTab === 'market' || activeTab === 'admin')) {
      setActiveTab('posts');
    }
  }, [currentUserRole, activeTab]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_posts', JSON.stringify(posts)); } catch {}
    if (isSupabaseConfigured) {
      syncAllPostsToSupabase(posts);
    }
  }, [posts]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_inspirations', JSON.stringify(inspirations)); } catch {}
  }, [inspirations]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_receipts', JSON.stringify(receipts)); } catch {}
  }, [receipts]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_fee_per_post', String(feePerPost)); } catch {}
  }, [feePerPost]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_saas_proofs', JSON.stringify(saasProofs)); } catch {}
  }, [saasProofs]);

  const handleAddSaasProof = (newProof: Omit<SaaSPaymentProof, 'id' | 'submittedAt' | 'status'>) => {
    const proofItem: SaaSPaymentProof = {
      ...newProof,
      id: `proof-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pendente'
    };
    setSaasProofs(prev => [proofItem, ...prev]);
  };

  const handleUpdateSaasProofStatus = (proofId: string, status: 'aprovado' | 'rejeitado') => {
    setSaasProofs(prev => prev.map(p => p.id === proofId ? { ...p, status } : p));
  };

  // Filters
  const [statusFilter, setStatusFilter] = useState<'todos' | PostStatus>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedPostForDetails, setSelectedPostForDetails] = useState<PostItem | null>(null);
  const [publicApprovalPost, setPublicApprovalPost] = useState<PostItem | null>(null);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<WhatsAppNotificationPayload[]>([]);

  // Detect ?token=... in URL for direct public token link approval
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && posts.length > 0) {
      const matched = posts.find(p => p.approvalToken === token);
      if (matched) {
        setPublicApprovalPost(matched);
      }
    }
  }, [posts]);

  // Handler para renovar token de 5 dias
  const handleRenewToken = (postId: string) => {
    const newTok = generateApprovalToken();
    const newExp = calculateTokenExpirationDays(5);
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated = {
          ...p,
          approvalToken: newTok,
          tokenExpiresAt: newExp,
          updatedAt: new Date().toISOString()
        };
        if (selectedPostForDetails?.id === postId) setSelectedPostForDetails(updated);
        if (publicApprovalPost?.id === postId) setPublicApprovalPost(updated);
        return updated;
      }
      return p;
    }));
  };

  // Active Client
  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0] || defaultEmptyClient;

  // Filtered Posts for Active Client
  const clientPosts = posts.filter(p => p.clientProjectId === selectedClientId);
  
  const filteredPosts = clientPosts.filter(p => {
    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.caption.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered Inspirations for Active Client
  const clientInspirations = inspirations.filter(i => i.clientProjectId === selectedClientId);

  // Counts for Badges
  const draftsCount = clientPosts.filter(p => p.status === 'rascunho').length;
  const changesRequestedCount = clientPosts.filter(p => p.status === 'alterar').length;
  const approvedCount = clientPosts.filter(p => p.status === 'aprovado').length;

  // Handlers
  const handleUpdatePostStatus = (postId: string, newStatus: PostStatus) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated = { ...p, status: newStatus, updatedAt: new Date().toISOString() };
        
        // Registrar Notificação no Histórico do WhatsApp
        setNotificationHistory(prevNotifs => [
          {
            recipientPhone: selectedClient.whatsappNumber,
            recipientName: selectedClient.contactName,
            type: newStatus === 'aprovado' ? 'aprovacao' : newStatus === 'alterar' ? 'pedido_alteracao' : 'novo_rascunho',
            postTitle: p.title,
            postStatus: newStatus,
            customMessage: `Status do post "${p.title}" alterado para ${newStatus.toUpperCase()} por ${currentUserRole}.`
          },
          ...prevNotifs
        ]);

        if (selectedPostForDetails?.id === postId) {
          setSelectedPostForDetails(updated);
        }
        return updated;
      }
      return p;
    }));
  };

  const handleTogglePublished = (postId: string, isPublished: boolean) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated = { ...p, isPublished, updatedAt: new Date().toISOString() };
        if (selectedPostForDetails?.id === postId) {
          setSelectedPostForDetails(updated);
        }
        return updated;
      }
      return p;
    }));
  };

  const handleConfirmPreviewCleanup = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated = { ...p, previewCleanedUp: true, updatedAt: new Date().toISOString() };
        if (selectedPostForDetails?.id === postId) {
          setSelectedPostForDetails(updated);
        }
        return updated;
      }
      return p;
    }));
  };

  const handleUpdatePostSocialNetworks = (postId: string, socialNetworks: SocialNetwork[]) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated = { ...p, socialNetworks, updatedAt: new Date().toISOString() };
        if (selectedPostForDetails?.id === postId) {
          setSelectedPostForDetails(updated);
        }
        return updated;
      }
      return p;
    }));
  };

  const handleAddComment = (postId: string, commentText: string) => {
    const authorName = 
      currentUserRole === 'cliente' ? `${selectedClient.contactName} (Cliente)` :
      currentUserRole === 'social_media' ? 'Social Media' : 'Gestor';

    const newCommentObj = {
      id: `c-${Date.now()}`,
      authorRole: currentUserRole,
      authorName,
      text: commentText,
      timestamp: new Date().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const targetPost = posts.find(p => p.id === postId);

    // Auditoria de Comentários no Supabase (se configurado)
    auditPostCommentToSupabase({
      id: newCommentObj.id,
      postId,
      postTitle: targetPost?.title,
      clientId: selectedClientId,
      authorRole: currentUserRole,
      authorName,
      text: commentText
    });

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated = {
          ...p,
          comments: [...p.comments, newCommentObj]
        };
        if (selectedPostForDetails?.id === postId) {
          setSelectedPostForDetails(updated);
        }
        return updated;
      }
      return p;
    }));
  };

  const handleUpdatePostFields = (postId: string, fields: Partial<PostItem>) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated = {
          ...p,
          ...fields,
          updatedAt: new Date().toISOString()
        };
        if (selectedPostForDetails?.id === postId) setSelectedPostForDetails(updated);
        if (publicApprovalPost?.id === postId) setPublicApprovalPost(updated);
        return updated;
      }
      return p;
    }));
  };

  const handleCreatePost = (newPostData: Omit<PostItem, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => {
    const newPost: PostItem = {
      ...newPostData,
      id: `post-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [
        {
          id: `c-${Date.now()}`,
          authorRole: currentUserRole,
          authorName: currentUserRole === 'social_media' ? 'Social Media' : 'Gestor',
          text: 'Rascunho criado para aprovação do cliente.',
          timestamp: new Date().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setPosts([newPost, ...posts]);
    
    // Auto add whatsapp notification
    setNotificationHistory(prev => [
      {
        recipientPhone: selectedClient.whatsappNumber,
        recipientName: selectedClient.contactName,
        type: 'novo_rascunho',
        postTitle: newPost.title,
        customMessage: `Novo rascunho de post "${newPost.title}" enviado para aprovação.`
      },
      ...prev
    ]);
  };

  const handleAddInspiration = (newInsp: Omit<InspirationFile, 'id' | 'createdAt'>) => {
    const created: InspirationFile = {
      ...newInsp,
      id: `insp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setInspirations([created, ...inspirations]);
  };

  const handleDeleteInspiration = (id: string) => {
    setInspirations(inspirations.filter(i => i.id !== id));
  };

  const handleUpdateInspiration = (updatedInspiration: InspirationFile) => {
    setInspirations(prev => prev.map(i => i.id === updatedInspiration.id ? updatedInspiration : i));
  };

  const handleSaveReceipt = (savedReceipt: BillingReceipt) => {
    const existingIdx = receipts.findIndex(r => r.id === savedReceipt.id);
    if (existingIdx >= 0) {
      const updatedArr = [...receipts];
      updatedArr[existingIdx] = savedReceipt;
      setReceipts(updatedArr);
    } else {
      setReceipts([...receipts, savedReceipt]);
    }
  };

  const handleSendWhatsAppAlert = (postId: string, messageText: string) => {
    const targetPost = posts.find(p => p.id === postId);
    setNotificationHistory(prev => [
      {
        recipientPhone: selectedClient.whatsappNumber,
        recipientName: selectedClient.contactName,
        type: 'pedido_alteracao',
        postTitle: targetPost?.title,
        customMessage: messageText
      },
      ...prev
    ]);
    setIsWhatsAppModalOpen(true);
  };

  const handleSendWhatsAppReceipt = (receipt: BillingReceipt) => {
    setNotificationHistory(prev => [
      {
        recipientPhone: selectedClient.whatsappNumber,
        recipientName: selectedClient.contactName,
        type: 'novo_recibo',
        customMessage: `Recibo ${receipt.receiptNumber} de ${receipt.period} no valor de R$ ${receipt.totalAmount.toFixed(2)} foi gerado!`
      },
      ...prev
    ]);
    setIsWhatsAppModalOpen(true);
  };

  const handleUpdateClient = (updatedClient: ClientProject) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    syncClientToSupabase(updatedClient);
  };

  const handleAddClient = (newClient: ClientProject) => {
    setClients(prev => {
      const exists = prev.some(c => c.id === newClient.id);
      if (exists) return prev.map(c => c.id === newClient.id ? newClient : c);
      return [...prev, newClient];
    });
    setSelectedClientId(newClient.id);
    syncClientToSupabase(newClient);
  };

  const handleChangeMetricsAccess = (clientId: string, access: ClientProject['metricsAccess']) => {
    setClients(clients.map(c => c.id === clientId ? { ...c, metricsAccess: access } : c));
  };

  const handleAddSocialMedia = (newSM: Omit<SocialMediaUser, 'id'>) => {
    const created: SocialMediaUser = {
      ...newSM,
      id: `sm-${Date.now()}`
    };
    setSocialMedias(prev => [...prev, created]);
    syncSocialMediaToSupabase(created);
  };

  const handleDeleteSocialMedia = (smId: string) => {
    setSocialMedias(prev => prev.filter(sm => sm.id !== smId));
  };

  const handleToggleBlockSocialMedia = (smId: string) => {
    setSocialMedias(prev => prev.map(sm => {
      if (sm.id === smId) {
        const nextStatus = sm.status === 'bloqueado' ? 'ativo' : 'bloqueado';
        const updated = { ...sm, status: nextStatus };
        syncSocialMediaToSupabase(updated);
        return updated;
      }
      return sm;
    }));
  };

  const handleUpdateSocialMediaFee = (smId: string, customFeePerPost?: number) => {
    setSocialMedias(prev => prev.map(sm => {
      if (sm.id === smId) {
        const updated = { ...sm, customFeePerPost };
        syncSocialMediaToSupabase(updated);
        return updated;
      }
      return sm;
    }));
  };

  const handleToggleBlockClient = (clientId: string) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const nextStatus = c.status === 'bloqueado' ? 'ativo' : 'bloqueado';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white pb-20">
      
      {/* Header with Role & Client Selector */}
      <Header
        clients={clients}
        selectedClientId={selectedClientId}
        onSelectClient={setSelectedClientId}
        currentUserRole={currentUserRole}
        onChangeUserRole={setCurrentUserRole}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenAddClientModal={() => setActiveTab('admin')}
        unreadNotificationsCount={draftsCount + changesRequestedCount}
      />

      {/* Navigation Tab Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUserRole={currentUserRole}
        metricsAccess={selectedClient.metricsAccess}
        draftsCount={draftsCount}
        changesRequestedCount={changesRequestedCount}
        inspirationsCount={clientInspirations.length}
      />

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Banner de Boas-Vindas sem Exemplos Hardcoded */}
        {clients.length === 0 && (
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600/30 text-indigo-300 rounded-2xl border border-indigo-500/40 shrink-0">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">Social Media 5.0 - Ambiente Limpo e Pronto para Uso</h2>
                  <p className="text-xs text-slate-300">Nenhum dado fictício pré-carregado. Cadastre o seu primeiro cliente com o apoio de Placeholders explicativos em cada campo.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab('admin')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Primeiro Cliente</span>
                </button>
                <button
                  onClick={() => {
                    setClients(DEMO_CLIENTS);
                    setSocialMedias(DEMO_SOCIAL_MEDIAS);
                    setSelectedClientId('client-1');
                  }}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition-all"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Carregar Testes (Opcional)</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                💡 Guia de Orientação para Uso do Sistema (Placeholders em Todos os Formulários):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] text-slate-400">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <strong className="text-indigo-300 block mb-1">1. Painel Admin / Clientes</strong>
                  Preencha Razão Social, CNPJ, WhatsApp e preço por post no cadastro com orientações em cada campo.
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <strong className="text-purple-300 block mb-1">2. Rascunhos de Posts</strong>
                  Adicione títulos, legendas e links de imagem/vídeo. Os rascunhos ficam organizados para aprovação.
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <strong className="text-emerald-300 block mb-1">3. Fechamento e PDF</strong>
                  Gere recibos de prestação de serviço com cálculo de taxa de R$0,50 por post e exportação imediata.
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* TAB 1: POSTS & APROVAÇÕES */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            
            {/* Top Toolbar: Search, Status Filter & Create Post */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
              
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por título ou palavras-chave da legenda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setStatusFilter('todos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === 'todos' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Todos ({clientPosts.length})
                </button>

                <button
                  onClick={() => setStatusFilter('rascunho')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                    statusFilter === 'rascunho' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-amber-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Rascunho ({draftsCount})
                </button>

                <button
                  onClick={() => setStatusFilter('alterar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                    statusFilter === 'alterar' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-rose-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" /> Alterar ({changesRequestedCount})
                </button>

                <button
                  onClick={() => setStatusFilter('aprovado')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                    statusFilter === 'aprovado' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-emerald-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado ({approvedCount})
                </button>
              </div>

              {/* Create Post Button (Gestor or Social Media) */}
              {(currentUserRole === 'social_media' || currentUserRole === 'gestor') && (
                <button
                  onClick={() => setIsNewPostModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Rascunho</span>
                </button>
              )}

            </div>

            {/* Posts Grid */}
            {filteredPosts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <Layers className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-slate-300 font-bold text-sm">Nenhum post encontrado para este filtro</h3>
                <p className="text-xs text-slate-500">Tente alterar o filtro de status ou criar uma nova publicação.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserRole={currentUserRole}
                    onOpenDetails={(p) => setSelectedPostForDetails(p)}
                    onQuickApprove={(id) => handleUpdatePostStatus(id, 'aprovado')}
                    onQuickRequestChange={(id) => handleUpdatePostStatus(id, 'alterar')}
                    onOpenPublicApprovalLink={(p) => setPublicApprovalPost(p)}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: INSPIRAÇÕES & MODELOS */}
        {activeTab === 'inspirations' && (
          <InspirationSection
            inspirations={clientInspirations}
            currentUserRole={currentUserRole}
            clientProjectId={selectedClientId}
            onAddInspiration={handleAddInspiration}
            onDeleteInspiration={handleDeleteInspiration}
            onUpdateInspiration={handleUpdateInspiration}
          />
        )}

        {/* TAB 3: FECHAMENTO & RECIBO PDF (GESTOR & SOCIAL MEDIA) */}
        {activeTab === 'billing' && (currentUserRole === 'gestor' || currentUserRole === 'social_media') && (
          <ReceiptGenerator
            receipts={receipts}
            selectedClient={selectedClient}
            currentUserRole={currentUserRole}
            feePerPost={feePerPost}
            onSaveReceipt={handleSaveReceipt}
            onSendWhatsAppReceipt={handleSendWhatsAppReceipt}
          />
        )}

        {/* TAB 4: MÉTRICAS META / GOOGLE ANALYTICS */}
        {activeTab === 'metrics' && (
          <MetricsDashboard
            client={selectedClient}
            metrics={MOCK_METRICS}
            channels={MOCK_CHANNELS}
            currentUserRole={currentUserRole}
            onChangeMetricsAccess={handleChangeMetricsAccess}
          />
        )}

        {/* TAB 5: CLIENTES */}
        {activeTab === 'settings' && (currentUserRole === 'gestor' || currentUserRole === 'social_media') && (
          <ClientSettings
            client={selectedClient}
            clients={clients}
            onSelectClient={setSelectedClientId}
            currentUserRole={currentUserRole}
            onUpdateClient={handleUpdateClient}
            onAddClient={handleAddClient}
            socialMedias={socialMedias}
          />
        )}

        {/* TAB 6: PAINEL ADMIN SAAS (R$ 0,50/POST EDITÁVEL) - SIGILOSO EXCLUSIVO GESTOR */}
        {activeTab === 'admin' && currentUserRole === 'gestor' && (
          <AdminSaaSDashboard
            clients={clients}
            posts={posts}
            receipts={receipts}
            socialMedias={socialMedias}
            saasProofs={saasProofs}
            onAddSocialMedia={handleAddSocialMedia}
            onDeleteSocialMedia={handleDeleteSocialMedia}
            onToggleBlockSocialMedia={handleToggleBlockSocialMedia}
            onUpdateSocialMediaFee={handleUpdateSocialMediaFee}
            onToggleBlockClient={handleToggleBlockClient}
            onAddClient={handleAddClient}
            feePerPost={feePerPost}
            onUpdateFeePerPost={(newFee) => setFeePerPost(newFee)}
            onAddSaasProof={handleAddSaasProof}
            onUpdateSaasProofStatus={handleUpdateSaasProofStatus}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* TAB 7: LIVRO DO PROJETO & HISTÓRICO VIVO DO CHAT (EXCLUSIVO GESTOR) */}
        {activeTab === 'book' && currentUserRole === 'gestor' && (
          <ProjectBookView />
        )}

        {/* TAB 8: ANÁLISE DE MERCADO & EXCEL (EXCLUSIVO GESTOR) */}
        {activeTab === 'market' && currentUserRole === 'gestor' && (
          <MarketAnalysisView />
        )}

      </main>

      {/* MODALS */}
      <PostDetailModal
        post={selectedPostForDetails}
        isOpen={!!selectedPostForDetails}
        onClose={() => setSelectedPostForDetails(null)}
        currentUserRole={currentUserRole}
        inspirations={clientInspirations}
        onUpdateStatus={handleUpdatePostStatus}
        onUpdateSocialNetworks={handleUpdatePostSocialNetworks}
        onTogglePublished={handleTogglePublished}
        onConfirmPreviewCleanup={handleConfirmPreviewCleanup}
        onAddComment={handleAddComment}
        onSendWhatsAppAlert={handleSendWhatsAppAlert}
        onOpenPublicApprovalLink={(p) => setPublicApprovalPost(p)}
        onRenewToken={handleRenewToken}
        onUpdatePostFields={handleUpdatePostFields}
      />

      <ApprovalPublicModal
        post={publicApprovalPost}
        isOpen={!!publicApprovalPost}
        onClose={() => setPublicApprovalPost(null)}
        onUpdateStatus={handleUpdatePostStatus}
        onAddComment={handleAddComment}
        onRenewToken={handleRenewToken}
      />

      <NewPostModal
        isOpen={isNewPostModalOpen}
        onClose={() => setIsNewPostModalOpen(false)}
        clientProjectId={selectedClientId}
        inspirations={clientInspirations}
        onCreatePost={handleCreatePost}
      />

      <WhatsAppNotificationModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        selectedClient={selectedClient}
        notificationHistory={notificationHistory}
        onTriggerNotification={(payload) => setNotificationHistory([payload, ...notificationHistory])}
      />

      <StorageDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        client={selectedClient}
      />

    </div>
  );
}

