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
import { Footer } from './components/Footer';
import { generateApprovalToken, calculateTokenExpirationDays, buildApprovalUrl } from './utils/token';
import { auditPostCommentToSupabase, syncSocialMediaToSupabase, syncClientToSupabase, syncAllClientsToSupabase, syncPostToSupabase, syncAllPostsToSupabase, isSupabaseConfigured, fetchClientsFromSupabase, fetchPostsFromSupabase, deleteClientFromSupabase, deletePostFromSupabase, syncReceiptToSupabase, getSupabaseClient } from './lib/supabase';
import { openWhatsAppDirect } from './utils/whatsappHelper';

import { Plus, Filter, Clock, CheckCircle2, AlertCircle, Search, Layers, Sparkles, Building2, MessageCircle } from 'lucide-react';

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

  // Initial data fetch from Supabase (with fallback to LocalStorage/Mock)
  React.useEffect(() => {
    async function loadDataFromSupabase() {
      if (!isSupabaseConfigured) return;
      try {
        const [fetchedClients, fetchedPosts] = await Promise.all([
          fetchClientsFromSupabase(),
          fetchPostsFromSupabase()
        ]);
        if (fetchedClients && fetchedClients.length > 0) {
          setClients(fetchedClients);
        }
        if (fetchedPosts && fetchedPosts.length > 0) {
          setPosts(fetchedPosts);
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do Supabase na inicialização:', err);
      }
    }
    loadDataFromSupabase();
  }, []);

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

  // Detect ?client=..., ?sm=..., ?token=... in URL for direct mural or public token link approval
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const clientParam = params.get('client');
    const smParam = params.get('sm');
    const token = params.get('token');

    if (clientParam) {
      const matched = clients.find(c => c.id === clientParam);
      if (matched) {
        setSelectedClientId(matched.id);
        setCurrentUserRole('cliente');
        if (smParam) {
          setActiveSocialMediaId(smParam);
        } else if (matched.assignedSocialMediaId) {
          setActiveSocialMediaId(matched.assignedSocialMediaId);
        }
      }
    }

    if (token && posts.length > 0) {
      const matched = posts.find(p => p.approvalToken === token);
      if (matched) {
        setPublicApprovalPost(matched);
        if (matched.clientProjectId) {
          setSelectedClientId(matched.clientProjectId);
          setCurrentUserRole('cliente');
        }
      }
    }
  }, [clients, posts]);

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

  // Identidade do Social Media Ativo (para separar visualização de clientes por profissional)
  const [activeSocialMediaId, setActiveSocialMediaId] = useState<string>(() => {
    return localStorage.getItem('social_saas_active_sm_id') || (socialMedias[0]?.id || 'sm-1');
  });

  const [approvalToastMessage, setApprovalToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (activeSocialMediaId) {
      try { localStorage.setItem('social_saas_active_sm_id', activeSocialMediaId); } catch {}
    }
  }, [activeSocialMediaId]);

  // Clientes acessíveis conforme o perfil atual:
  // Se for Social Media, só visualiza a lista dos clientes que ele próprio cadastrou ou atrelou a ele!
  // Se for Cliente, fica restrito estritamente ao seu próprio espaço de cliente!
  // Se for Gestor, tem visão geral de todos os clientes.
  const userAccessibleClients = currentUserRole === 'social_media'
    ? clients.filter(c => c.assignedSocialMediaId === activeSocialMediaId || (c as any).createdBySocialMediaId === activeSocialMediaId)
    : currentUserRole === 'cliente'
      ? clients.filter(c => c.id === selectedClientId)
      : clients;

  // Sincroniza selectedClientId caso o cliente selecionado não pertença ao social media logado
  React.useEffect(() => {
    if (currentUserRole === 'social_media') {
      const isCurrentValid = userAccessibleClients.some(c => c.id === selectedClientId);
      if (!isCurrentValid && userAccessibleClients.length > 0) {
        setSelectedClientId(userAccessibleClients[0].id);
      }
    }
  }, [currentUserRole, activeSocialMediaId, userAccessibleClients, selectedClientId]);

  // Active Client
  const selectedClient = clients.find(c => c.id === selectedClientId) || userAccessibleClients[0] || clients[0] || defaultEmptyClient;

  // Social media responsável pelo cliente ativo
  const responsibleSm = socialMedias.find(sm => sm.id === (selectedClient.assignedSocialMediaId || (selectedClient as any).createdBySocialMediaId || activeSocialMediaId));

  // Filtered Posts for Active Client:
  // O cliente só vai enxergar os rascunhos do social media que enviou o link.
  // Se houver múltiplos social medias atendendo clientes com o mesmo nome, os rascunhos ficam 100% isolados por clientProjectId e authorId.
  const clientPosts = posts.filter(p => {
    if (p.clientProjectId !== selectedClientId) return false;
    if (selectedClient?.assignedSocialMediaId && p.socialMediaAuthorId && p.socialMediaAuthorId !== selectedClient.assignedSocialMediaId) {
      return false;
    }
    return true;
  });
  
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
        const now = new Date();
        const formattedTimestamp = now.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const approverName = currentUserRole === 'cliente' 
          ? `${selectedClient.contactName || 'Cliente'} (Cliente)` 
          : currentUserRole === 'social_media' ? 'Social Media' : 'Gestor';

        let updatedComments = p.comments;

        // Se for aprovação, registra comentário oficial de aprovação com data e hora
        if (newStatus === 'aprovado') {
          const approvalComment = {
            id: `c-appr-${Date.now()}`,
            authorRole: currentUserRole,
            authorName: approverName,
            text: '🎉 Post aprovado com sucesso! Este conteúdo será programado para postagem.',
            timestamp: formattedTimestamp
          };
          updatedComments = [...p.comments, approvalComment];

          // Auditoria no Supabase se configurado
          auditPostCommentToSupabase({
            id: approvalComment.id,
            postId: p.id,
            postTitle: p.title,
            clientId: p.clientProjectId,
            authorRole: currentUserRole,
            authorName: approverName,
            text: approvalComment.text
          });

          // Mensagem de agradecimento e confirmação de agendamento
          setApprovalToastMessage('🎉 Muito obrigado! O post foi aprovado com sucesso e será programado para postagem.');
          setTimeout(() => setApprovalToastMessage(null), 8000);
        }

        const updated = { 
          ...p, 
          status: newStatus, 
          comments: updatedComments,
          updatedAt: now.toISOString() 
        };

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
    const authorSmId = currentUserRole === 'social_media' 
      ? activeSocialMediaId 
      : (selectedClient.assignedSocialMediaId || activeSocialMediaId);

    const newPost: PostItem = {
      ...newPostData,
      id: `post-${Date.now()}`,
      clientProjectId: selectedClientId,
      socialMediaAuthorId: authorSmId,
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
    // Sincroniza o recibo com o Supabase (incluindo URL da assinatura digitalizada)
    syncReceiptToSupabase(savedReceipt);
  };

  // Envio direto do alerta via WhatsApp (sem histórico desnecessário)
  const handleSendWhatsAppAlert = (postId: string, messageText: string) => {
    const targetPost = posts.find(p => p.id === postId);
    const tokenUrl = targetPost ? buildApprovalUrl(targetPost.approvalToken || 'token') : '';
    const textToSend = messageText.trim() || `Olá! Temos um rascunho de post ("${targetPost?.title || 'Novo Post'}") da ${selectedClient.name} pronto para sua aprovação:\n\n🔗 Acesse para aprovar: ${tokenUrl}`;
    openWhatsAppDirect(selectedClient.whatsappNumber, textToSend);
  };

  // Envio direto do recibo via WhatsApp
  const handleSendWhatsAppReceipt = (receipt: BillingReceipt) => {
    const text = `Olá ${selectedClient.contactName || selectedClient.name}!\n\nSegue o Recibo de Prestação de Serviços ${receipt.receiptNumber} (${receipt.period}) no valor total de R$ ${receipt.totalAmount.toFixed(2)} emitido com sucesso.\n\nAgradecemos a parceria!`;
    openWhatsAppDirect(selectedClient.whatsappNumber, text);
  };

  // Envio da tela completa do Mural de Posts e Aprovações para o WhatsApp com isolamento de rascunhos
  const handleSendEntireMuralWhatsApp = () => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const authorSmId = selectedClient.assignedSocialMediaId || activeSocialMediaId;
    const authorSm = socialMedias.find(sm => sm.id === authorSmId);
    const muralUrl = `${currentOrigin}/?client=${selectedClient.id}&sm=${authorSmId}`;
    const smName = authorSm?.name ? ` com ${authorSm.name}` : '';
    const text = `Olá ${selectedClient.contactName || selectedClient.name}!\n\nSegue o link do seu Mural Exclusivo de Posts & Aprovações da ${selectedClient.name}${smName}:\n\n🔗 ${muralUrl}\n\nAcesse pelo link acima para visualizar todas as publicações, conferir legendas e realizar aprovações online com facilidade!`;
    openWhatsAppDirect(selectedClient.whatsappNumber, text);
  };

  const handleUpdateClient = (updatedClient: ClientProject) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    syncClientToSupabase(updatedClient);
  };

  const handleAddClient = (newClient: ClientProject) => {
    const clientWithAuthor: ClientProject = {
      ...newClient,
      assignedSocialMediaId: currentUserRole === 'social_media' ? activeSocialMediaId : (newClient.assignedSocialMediaId || activeSocialMediaId),
      createdBySocialMediaId: currentUserRole === 'social_media' ? activeSocialMediaId : (newClient.createdBySocialMediaId || activeSocialMediaId)
    };
    setClients(prev => {
      const exists = prev.some(c => c.id === clientWithAuthor.id);
      if (exists) return prev.map(c => c.id === clientWithAuthor.id ? clientWithAuthor : c);
      return [...prev, clientWithAuthor];
    });
    setSelectedClientId(clientWithAuthor.id);
    syncClientToSupabase(clientWithAuthor);
  };

  const handleDeleteClient = async (clientId: string) => {
    // Remover da lista de clientes
    setClients(prev => prev.filter(c => c.id !== clientId));

    // Se o cliente deletado for o cliente selecionado atualmente, trocar para outro cliente
    if (selectedClientId === clientId) {
      const remaining = clients.filter(c => c.id !== clientId);
      setSelectedClientId(remaining[0]?.id || 'novo-cliente');
    }

    // Remover posts vinculados a esse cliente
    setPosts(prev => prev.filter(p => p.clientProjectId !== clientId));

    // Deletar no Supabase se configurado
    if (isSupabaseConfigured) {
      try {
        await deleteClientFromSupabase(clientId);
      } catch (err) {
        console.warn('Erro ao deletar cliente no Supabase:', err);
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    // Remover do estado de posts
    setPosts(prev => prev.filter(p => p.id !== postId));

    if (selectedPostForDetails?.id === postId) {
      setSelectedPostForDetails(null);
    }
    if (publicApprovalPost?.id === postId) {
      setPublicApprovalPost(null);
    }

    // Deletar no Supabase se configurado
    if (isSupabaseConfigured) {
      try {
        await deletePostFromSupabase(postId);
      } catch (err) {
        console.warn('Erro ao deletar post no Supabase:', err);
      }
    }
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

  const handleUpdateSocialMedia = (updatedSm: SocialMediaUser) => {
    setSocialMedias(prev => prev.map(sm => sm.id === updatedSm.id ? updatedSm : sm));
    syncSocialMediaToSupabase(updatedSm);
  };

  const handleDeleteSocialMedia = async (smId: string) => {
    setSocialMedias(prev => prev.filter(sm => sm.id !== smId));
    if (isSupabaseConfigured) {
      try {
        const clientDb = getSupabaseClient();
        if (clientDb) {
          await clientDb.from('social_medias').delete().eq('id', smId);
        }
      } catch (err) {
        console.warn('Erro ao deletar social media no Supabase:', err);
      }
    }
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Header with Role & Client Selector */}
      <Header
        clients={userAccessibleClients}
        selectedClientId={selectedClientId}
        onSelectClient={setSelectedClientId}
        currentUserRole={currentUserRole}
        onChangeUserRole={setCurrentUserRole}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenAddClientModal={() => setActiveTab('settings')}
        unreadNotificationsCount={draftsCount + changesRequestedCount}
        socialMedias={socialMedias}
        activeSocialMediaId={activeSocialMediaId}
        onSelectSocialMedia={setActiveSocialMediaId}
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">

        {/* Notificação Toast de Agradecimento e Programação de Postagem */}
        {approvalToastMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/60 shadow-2xl flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <strong className="block text-white font-bold text-sm">Post Aprovado com Sucesso!</strong>
                <span className="text-emerald-300">
                  {approvalToastMessage}
                </span>
              </div>
            </div>
            <button
              onClick={() => setApprovalToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* TAB 1: POSTS & APROVAÇÕES */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            
            {/* Banner de Identificação Exclusiva do Espaço e Isolamento de Rascunhos */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-purple-950/70 border border-indigo-500/30 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedClient.logoUrl ? (
                    <img src={selectedClient.logoUrl} alt={selectedClient.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="w-6 h-6 text-indigo-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      {currentUserRole === 'cliente' ? 'Mural Exclusivo do Cliente' : 'Espaço Exclusivo de Atendimento'}
                    </span>
                    <span className="text-xs text-slate-400">• Espaço Isolado</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">{selectedClient.name}</h2>
                  <p className="text-xs text-slate-300">
                    Atendimento exclusivo por: <strong className="text-purple-300 font-bold">{responsibleSm?.name || 'Social Media Responsável'}</strong>
                    {responsibleSm?.companyName ? ` (${responsibleSm.companyName})` : ''}
                    {responsibleSm?.whatsapp && (
                      <span className="ml-2 text-emerald-400 font-medium"> • WhatsApp: {responsibleSm.whatsapp}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs shrink-0 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Isolamento Seguro de Rascunhos</div>
                  <div className="font-bold text-slate-200">
                    Exibindo apenas rascunhos de <span className="text-indigo-300">{responsibleSm?.name || 'Social Media'}</span>
                  </div>
                </div>
              </div>
            </div>

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

              <div className="flex flex-wrap items-center gap-2">
                {/* Botão de Enviar Tela Completa do Mural via WhatsApp */}
                <button
                  type="button"
                  onClick={handleSendEntireMuralWhatsApp}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02]"
                  title="Enviar link completo do Mural de Posts para o WhatsApp do cliente"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Enviar Mural via WhatsApp</span>
                </button>

                {/* Create Post Button (Gestor or Social Media) */}
                {(currentUserRole === 'social_media' || currentUserRole === 'gestor') && (
                  <button
                    onClick={() => setIsNewPostModalOpen(true)}
                    className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0 hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Rascunho</span>
                  </button>
                )}
              </div>

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
                    onDeletePost={handleDeletePost}
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
            socialMedias={socialMedias}
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
            posts={posts}
          />
        )}

        {/* TAB 5: CLIENTES & EQUIPE */}
        {activeTab === 'settings' && (currentUserRole === 'gestor' || currentUserRole === 'social_media') && (
          <ClientSettings
            client={selectedClient}
            clients={userAccessibleClients}
            onSelectClient={setSelectedClientId}
            currentUserRole={currentUserRole}
            onUpdateClient={handleUpdateClient}
            onAddClient={handleAddClient}
            onDeleteClient={handleDeleteClient}
            socialMedias={socialMedias}
            onAddSocialMedia={handleAddSocialMedia}
            onUpdateSocialMedia={handleUpdateSocialMedia}
            onDeleteSocialMedia={handleDeleteSocialMedia}
            activeSocialMediaId={activeSocialMediaId}
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
            onUpdateSocialMedia={handleUpdateSocialMedia}
            onDeleteSocialMedia={handleDeleteSocialMedia}
            onToggleBlockSocialMedia={handleToggleBlockSocialMedia}
            onUpdateSocialMediaFee={handleUpdateSocialMediaFee}
            onToggleBlockClient={handleToggleBlockClient}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
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

      {/* FOOTER */}
      <Footer />

      {/* MODALS */}
      <PostDetailModal
        post={selectedPostForDetails}
        isOpen={!!selectedPostForDetails}
        onClose={() => setSelectedPostForDetails(null)}
        currentUserRole={currentUserRole}
        inspirations={clientInspirations}
        clientWhatsapp={selectedClient.whatsappNumber}
        clientName={selectedClient.name}
        onUpdateStatus={handleUpdatePostStatus}
        onUpdateSocialNetworks={handleUpdatePostSocialNetworks}
        onTogglePublished={handleTogglePublished}
        onConfirmPreviewCleanup={handleConfirmPreviewCleanup}
        onAddComment={handleAddComment}
        onSendWhatsAppAlert={handleSendWhatsAppAlert}
        onOpenPublicApprovalLink={(p) => setPublicApprovalPost(p)}
        onRenewToken={handleRenewToken}
        onUpdatePostFields={handleUpdatePostFields}
        onDeletePost={handleDeletePost}
      />

      <ApprovalPublicModal
        post={publicApprovalPost}
        client={selectedClient}
        authorSocialMedia={socialMedias.find(sm => sm.id === (publicApprovalPost?.socialMediaAuthorId || selectedClient.assignedSocialMediaId))}
        isOpen={!!publicApprovalPost}
        onClose={() => setPublicApprovalPost(null)}
        onApprove={(postId) => handleUpdatePostStatus(postId, 'aprovado')}
        onRequestChange={(postId, text) => {
          handleUpdatePostStatus(postId, 'alterar');
          handleAddComment(postId, `[Instrução de Ajuste]: ${text}`);
        }}
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
        approvalToken={(clientPosts.find(p => p.status === 'rascunho') || clientPosts[0])?.approvalToken}
        defaultPostTitle={(clientPosts.find(p => p.status === 'rascunho') || clientPosts[0])?.title}
      />

      <StorageDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        client={selectedClient}
        onUpdateClient={handleUpdateClient}
      />

    </div>
  );
}

