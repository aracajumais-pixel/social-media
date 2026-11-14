import React, { useState } from 'react';
import { 
  INITIAL_CLIENTS, INITIAL_POSTS, INITIAL_INSPIRATIONS, 
  INITIAL_RECEIPTS, MOCK_METRICS, MOCK_CHANNELS, INITIAL_SOCIAL_MEDIAS, INITIAL_SAAS_PROOF_PAYMENTS,
  DEMO_CLIENTS, DEMO_SOCIAL_MEDIAS
} from './data/mockData';
import { 
  ClientProject, PostItem, InspirationFile, BillingReceipt, 
  UserRole, PostStatus, WhatsAppNotificationPayload, SocialMediaUser, SaaSPaymentProof, SocialNetwork,
  ClientTask, TaskStatus, Comment, ApprovalRecord,
  BirthdayBackground, BirthdayGroup, BirthdayMessage, BirthdayPerson, BirthdayAuditLog, BirthdayClientAuthSession
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
import { ClientTasksSection } from './components/ClientTasksSection';
import { ClientDetailsCardModal } from './components/ClientDetailsCardModal';
import { BirthdaysSection } from './components/BirthdaysSection';
import { Footer } from './components/Footer';
import { createSampleTransparentFrameDataUrl, getDefaultElementSet } from './utils/birthdayCanvas';
import { generateApprovalToken, calculateTokenExpirationDays, buildApprovalUrl } from './utils/token';
import {
  auditPostCommentToSupabase, syncSocialMediaToSupabase, syncClientToSupabase, syncAllClientsToSupabase,
  syncPostToSupabase, syncAllPostsToSupabase, isSupabaseConfigured, hasSupabaseCredentials,
  fetchClientsFromSupabase, fetchPostsFromSupabase, deleteClientFromSupabase, deletePostFromSupabase,
  syncReceiptToSupabase, syncApprovalRecordToSupabase, fetchApprovalRecordsFromSupabase, getSupabaseClient,
  fetchSocialMediasFromSupabase, syncTaskToSupabase, fetchTasksFromSupabase, deleteTaskFromSupabase,
  syncInspirationToSupabase, fetchInspirationsFromSupabase, deleteInspirationFromSupabase, fetchReceiptsFromSupabase
} from './lib/supabase';
import { fetchSharedServerState, saveSharedServerStatePatch } from './lib/serverSync';
import { openWhatsAppDirect } from './utils/whatsappHelper';

import { Plus, Filter, Clock, CheckCircle2, AlertCircle, Search, Layers, Sparkles, Building2, MessageCircle, ClipboardList, ArrowRight, Eye, Bell, ChevronRight, ClipboardCheck } from 'lucide-react';

const INITIAL_DEMO_TASKS: ClientTask[] = [
  {
    id: 'task-1',
    clientProjectId: 'client-1',
    title: 'Post Promocional: Festival de Cafés Especiais de Outono',
    description: 'Solicito a criação de um carrossel ou post de destaque para divulgar o novo blend de café bourbon amarelo e a promoção especial de 20% para a semana do festival. Incluir chamada para o link da bio.',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'novo',
    createdAt: new Date().toISOString(),
    createdByRole: 'cliente',
    createdByName: 'Mariana Silva (Diretora)'
  }
];

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
  const [tasks, setTasks] = useState<ClientTask[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_tasks');
      return saved ? JSON.parse(saved) : INITIAL_DEMO_TASKS;
    } catch {
      return INITIAL_DEMO_TASKS;
    }
  });
  const [convertingTask, setConvertingTask] = useState<ClientTask | null>(null);
  const [approvalRecords, setApprovalRecords] = useState<ApprovalRecord[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_approval_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Estado do módulo Aniversariantes
  const [birthdayBackgrounds, setBirthdayBackgrounds] = useState<BirthdayBackground[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_bday_backgrounds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [birthdayGroups, setBirthdayGroups] = useState<BirthdayGroup[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_bday_groups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [birthdayMessages, setBirthdayMessages] = useState<BirthdayMessage[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_bday_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [birthdayPeople, setBirthdayPeople] = useState<BirthdayPerson[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_bday_people');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [birthdayAuditLogs, setBirthdayAuditLogs] = useState<BirthdayAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('social_saas_bday_audit');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [birthdayClientSessions, setBirthdayClientSessions] = useState<Record<string, BirthdayClientAuthSession>>(() => {
    try {
      const saved = sessionStorage.getItem('social_saas_bday_client_sessions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const isRemoteHydratedRef = React.useRef(false);
  const [tasksTableMissingInSupabase, setTasksTableMissingInSupabase] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Carrega dados remotos (Supabase + Servidor compartilhado /api/sync-state) na inicialização e ao voltar foco
  const loadRemoteData = React.useCallback(async () => {
    setIsManualSyncing(true);
    try {
      const sbReady = hasSupabaseCredentials();
      const [
        serverState,
        fetchedClients,
        fetchedPosts,
        fetchedSocialMedias,
        fetchedTasksRes,
        fetchedApprovals,
        fetchedInspirations,
        fetchedReceipts
      ] = await Promise.all([
        fetchSharedServerState(),
        sbReady ? fetchClientsFromSupabase() : Promise.resolve(null),
        sbReady ? fetchPostsFromSupabase() : Promise.resolve(null),
        sbReady ? fetchSocialMediasFromSupabase() : Promise.resolve(null),
        sbReady ? fetchTasksFromSupabase() : Promise.resolve({ tasks: null, missingTable: false }),
        sbReady ? fetchApprovalRecordsFromSupabase() : Promise.resolve(null),
        sbReady ? fetchInspirationsFromSupabase() : Promise.resolve(null),
        sbReady ? fetchReceiptsFromSupabase() : Promise.resolve(null)
      ]);

      if (fetchedTasksRes?.missingTable) {
        setTasksTableMissingInSupabase(true);
      } else if (sbReady && fetchedTasksRes?.tasks !== null) {
        setTasksTableMissingInSupabase(false);
      }

      if (fetchedClients && fetchedClients.length > 0) {
        setClients(fetchedClients);
      } else if (serverState?.clients && serverState.clients.length > 0) {
        setClients(serverState.clients);
      }

      if (fetchedSocialMedias && fetchedSocialMedias.length > 0) {
        setSocialMedias(fetchedSocialMedias);
      } else if (serverState?.socialMedias && serverState.socialMedias.length > 0) {
        setSocialMedias(serverState.socialMedias);
      }

      if (fetchedPosts && fetchedPosts.length > 0) {
        setPosts(fetchedPosts);
      } else if (serverState?.posts && serverState.posts.length > 0) {
        setPosts(serverState.posts);
      }

      // Tarefas: prioriza tabela client_tasks do Supabase; se ausente/vazia e servidor tiver, usa servidor
      if (fetchedTasksRes?.tasks && !fetchedTasksRes.missingTable) {
        if (fetchedTasksRes.tasks.length > 0) {
          setTasks(fetchedTasksRes.tasks);
        } else if (serverState?.tasks && serverState.tasks.length > 0) {
          setTasks(serverState.tasks);
        }
      } else if (serverState?.tasks && Array.isArray(serverState.tasks)) {
        setTasks(serverState.tasks);
      }

      if (fetchedApprovals && fetchedApprovals.length > 0) {
        setApprovalRecords(prev => {
          const byPostId = new Map<string, ApprovalRecord>();
          prev.forEach(r => byPostId.set(r.postId, r));
          fetchedApprovals.forEach(r => byPostId.set(r.postId, r));
          return Array.from(byPostId.values());
        });
      } else if (serverState?.approvalRecords && serverState.approvalRecords.length > 0) {
        setApprovalRecords(serverState.approvalRecords);
      }

      if (fetchedInspirations && fetchedInspirations.length > 0) {
        setInspirations(fetchedInspirations);
      } else if (serverState?.inspirations && serverState.inspirations.length > 0) {
        setInspirations(serverState.inspirations);
      }

      if (fetchedReceipts && fetchedReceipts.length > 0) {
        setReceipts(fetchedReceipts);
      } else if (serverState?.receipts && serverState.receipts.length > 0) {
        setReceipts(serverState.receipts);
      }

      if (serverState?.birthdayBackgrounds && serverState.birthdayBackgrounds.length > 0) {
        setBirthdayBackgrounds(serverState.birthdayBackgrounds);
      }
      if (serverState?.birthdayGroups && serverState.birthdayGroups.length > 0) {
        setBirthdayGroups(serverState.birthdayGroups);
      }
      if (serverState?.birthdayMessages && serverState.birthdayMessages.length > 0) {
        setBirthdayMessages(serverState.birthdayMessages);
      }
      if (serverState?.birthdayPeople && serverState.birthdayPeople.length > 0) {
        setBirthdayPeople(serverState.birthdayPeople);
      }
      if (serverState?.birthdayAuditLogs && serverState.birthdayAuditLogs.length > 0) {
        setBirthdayAuditLogs(serverState.birthdayAuditLogs);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados remotos na inicialização:', err);
    } finally {
      isRemoteHydratedRef.current = true;
      setIsManualSyncing(false);
    }
  }, []);

  React.useEffect(() => {
    loadRemoteData();
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadRemoteData();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadRemoteData]);

  // Auto-save state to localStorage + Servidor compartilhado (/api/sync-state) + Supabase (somente após hidratação inicial)
  React.useEffect(() => {
    try { localStorage.setItem('social_saas_clients', JSON.stringify(clients)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    if (hasSupabaseCredentials()) {
      syncAllClientsToSupabase(clients);
    }
    saveSharedServerStatePatch({ clients });
  }, [clients]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_social_medias', JSON.stringify(socialMedias)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    saveSharedServerStatePatch({ socialMedias });
  }, [socialMedias]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_selected_client_id', selectedClientId); } catch {}
  }, [selectedClientId]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_user_role', currentUserRole); } catch {}
    if (currentUserRole !== 'gestor' && (activeTab === 'book' || activeTab === 'market' || activeTab === 'admin')) {
      setActiveTab('posts');
    }
    if (currentUserRole === 'cliente' && (activeTab === 'metrics' || activeTab === 'billing' || activeTab === 'settings')) {
      setActiveTab('posts');
    }
  }, [currentUserRole, activeTab]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_posts', JSON.stringify(posts)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    if (hasSupabaseCredentials()) {
      syncAllPostsToSupabase(posts);
    }
    saveSharedServerStatePatch({ posts });
  }, [posts]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_inspirations', JSON.stringify(inspirations)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    saveSharedServerStatePatch({ inspirations });
  }, [inspirations]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_receipts', JSON.stringify(receipts)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    saveSharedServerStatePatch({ receipts });
  }, [receipts]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_fee_per_post', String(feePerPost)); } catch {}
  }, [feePerPost]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_saas_proofs', JSON.stringify(saasProofs)); } catch {}
  }, [saasProofs]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_tasks', JSON.stringify(tasks)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    saveSharedServerStatePatch({ tasks });
  }, [tasks]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_approval_records', JSON.stringify(approvalRecords)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    saveSharedServerStatePatch({ approvalRecords });
  }, [approvalRecords]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_bday_backgrounds', JSON.stringify(birthdayBackgrounds)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    saveSharedServerStatePatch({ birthdayBackgrounds });
  }, [birthdayBackgrounds]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_bday_groups', JSON.stringify(birthdayGroups)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    saveSharedServerStatePatch({ birthdayGroups });
  }, [birthdayGroups]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_bday_messages', JSON.stringify(birthdayMessages)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    saveSharedServerStatePatch({ birthdayMessages });
  }, [birthdayMessages]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_bday_people', JSON.stringify(birthdayPeople)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    saveSharedServerStatePatch({ birthdayPeople });
  }, [birthdayPeople]);

  React.useEffect(() => {
    try { localStorage.setItem('social_saas_bday_audit', JSON.stringify(birthdayAuditLogs)); } catch {}
    if (!isRemoteHydratedRef.current) return;
    saveSharedServerStatePatch({ birthdayAuditLogs });
  }, [birthdayAuditLogs]);

  React.useEffect(() => {
    try { sessionStorage.setItem('social_saas_bday_client_sessions', JSON.stringify(birthdayClientSessions)); } catch {}
  }, [birthdayClientSessions]);

  // Inicializa modelo de exemplo, grupos padrão (Adultos, Adolescentes, Crianças) e mensagens base por cliente se vazio
  React.useEffect(() => {
    if (!selectedClientId) return;
    const hasBg = birthdayBackgrounds.some(b => b.clientProjectId === selectedClientId);
    const hasGrp = birthdayGroups.some(g => g.clientProjectId === selectedClientId);
    const hasMsg = birthdayMessages.some(m => m.clientProjectId === selectedClientId);

    let defaultBgId = birthdayBackgrounds.find(b => b.clientProjectId === selectedClientId)?.id;
    if (!hasBg) {
      defaultBgId = `bg-init-${selectedClientId}`;
      const cutout = { x: 22, y: 11, width: 56, height: 48 };
      const sampleUrl = typeof document !== 'undefined' ? createSampleTransparentFrameDataUrl() : '';
      if (sampleUrl) {
        setBirthdayBackgrounds(prev => [
          ...prev,
          {
            id: defaultBgId!,
            clientProjectId: selectedClientId,
            name: 'Moldura Modelo Padrão',
            imageUrl: sampleUrl,
            width: 900,
            height: 900,
            cutoutRect: cutout,
            defaultElements: getDefaultElementSet(cutout),
            aiAnalysisNotes: 'Moldura inicial transparente pronta para envio de fotos.',
            createdAt: new Date().toISOString(),
            createdByName: 'Sistema'
          }
        ]);
      }
    }

    if (!hasMsg) {
      setBirthdayMessages(prev => [
        ...prev,
        {
          id: `msg-init-1-${selectedClientId}`,
          clientProjectId: selectedClientId,
          title: 'Bênçãos & Alegria',
          text: 'Que Deus abençoe grandemente sua vida com muita saúde, paz, fé e alegrias todos os dias!',
          createdAt: new Date().toISOString()
        },
        {
          id: `msg-init-2-${selectedClientId}`,
          clientProjectId: selectedClientId,
          title: 'Gratidão & Luz',
          text: 'Celebramos hoje o dom da sua vida! Desejamos um novo ciclo repleto de realizações e felicidade.',
          createdAt: new Date().toISOString()
        }
      ]);
    }

    if (!hasGrp && defaultBgId) {
      setBirthdayGroups(prev => [
        ...prev,
        { id: `grp-adultos-${selectedClientId}`, clientProjectId: selectedClientId, name: 'Adultos', backgroundId: defaultBgId!, createdAt: new Date().toISOString() },
        { id: `grp-adolescentes-${selectedClientId}`, clientProjectId: selectedClientId, name: 'Adolescentes', backgroundId: defaultBgId!, createdAt: new Date().toISOString() },
        { id: `grp-criancas-${selectedClientId}`, clientProjectId: selectedClientId, name: 'Crianças', backgroundId: defaultBgId!, createdAt: new Date().toISOString() }
      ]);
    }
  }, [selectedClientId, birthdayBackgrounds, birthdayGroups, birthdayMessages]);

  // Reconcilia posts já aprovados para garantir que tenham Registro Oficial de Aprovação para faturamento
  React.useEffect(() => {
    const approvedPosts = posts.filter(p => p.status === 'aprovado');
    if (approvedPosts.length === 0) return;

    setApprovalRecords(prev => {
      const existingPostIds = new Set(prev.map(r => r.postId));
      const missing = approvedPosts.filter(p => !existingPostIds.has(p.id));
      if (missing.length === 0) return prev;

      const newRecords: ApprovalRecord[] = missing.map(p => {
        const clientObj = clients.find(c => c.id === p.clientProjectId);
        const smObj = socialMedias.find(sm => sm.id === (p.socialMediaAuthorId || clientObj?.assignedSocialMediaId));
        const approvalComment = [...(p.comments || [])].reverse().find(c => c.text?.toLowerCase().includes('aprovad'));
        const rate = smObj?.customFeePerPost !== undefined ? smObj.customFeePerPost : feePerPost;

        return {
          id: `appr-${p.id}`,
          postId: p.id,
          postTitle: p.title,
          clientProjectId: p.clientProjectId,
          clientName: clientObj?.name || 'Cliente',
          socialMediaId: smObj?.id || p.socialMediaAuthorId,
          socialMediaName: smObj?.name || 'Social Media',
          approvedAt: p.approvedAt || p.updatedAt || p.createdAt || new Date().toISOString(),
          approvedByRole: approvalComment?.authorRole || 'cliente',
          approvedByName: p.approvedBy || approvalComment?.authorName || `${clientObj?.contactName || 'Cliente'} (Cliente)`,
          approvedByPhone: approvalComment?.authorPhone || clientObj?.whatsappNumber,
          approvedByEmail: approvalComment?.authorEmail || clientObj?.email,
          pricePerPostSnapshot: clientObj?.pricePerPost ?? 150,
          feePerPostSnapshot: rate,
          billingStatus: 'computado'
        };
      });

      return [...newRecords, ...prev];
    });
  }, [posts, clients, socialMedias, feePerPost]);

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
  const [isClientCardOpen, setIsClientCardOpen] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<WhatsAppNotificationPayload[]>([]);

  // Detect ?client=..., ?sm=..., ?token=... in URL for direct mural or public token link approval
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const clientParam = params.get('client');
    const smParam = params.get('sm');
    const token = params.get('token');
    const savedRole = localStorage.getItem('social_saas_user_role') as UserRole | null;
    const isTeamSession = savedRole === 'social_media' || savedRole === 'gestor';

    if (clientParam) {
      const matched = clients.find(c => c.id === clientParam);
      if (matched) {
        setSelectedClientId(matched.id);
        if (!isTeamSession) {
          setCurrentUserRole('cliente');
        }
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
          if (!isTeamSession) {
            setCurrentUserRole('cliente');
          }
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
    const matchesStatus = currentUserRole === 'cliente' || statusFilter === 'todos' || p.status === statusFilter;
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
  const clientTasks = tasks.filter(t => t.clientProjectId === selectedClientId);
  const pendingTasksCount = clientTasks.filter(t => t.status === 'novo' || t.status === 'em_andamento').length;

  // Dados filtrados do módulo Aniversariantes para o cliente ativo
  const clientBdayBackgrounds = birthdayBackgrounds.filter(b => b.clientProjectId === selectedClientId);
  const clientBdayGroups = birthdayGroups.filter(g => g.clientProjectId === selectedClientId);
  const clientBdayMessages = birthdayMessages.filter(m => m.clientProjectId === selectedClientId);
  const clientBdayPeople = birthdayPeople.filter(p => p.clientProjectId === selectedClientId);
  const clientBdayAuditLogs = birthdayAuditLogs.filter(a => a.clientProjectId === selectedClientId);

  // Handlers
  const handleUpdatePostStatus = (postId: string, newStatus: PostStatus) => {
    const targetPost = posts.find(p => p.id === postId);
    const now = new Date();
    const nowIso = now.toISOString();
    const approverName = currentUserRole === 'cliente' 
      ? (selectedClient.contactName || selectedClient.name || 'Cliente') 
      : currentUserRole === 'social_media' ? (responsibleSm?.name || 'Social Media') : 'Gestor';

    if (newStatus === 'aprovado' && targetPost) {
      const postClient = clients.find(c => c.id === targetPost.clientProjectId) || selectedClient;
      const postSm = socialMedias.find(sm => sm.id === (targetPost.socialMediaAuthorId || postClient?.assignedSocialMediaId));
      const effectiveRate = postSm?.customFeePerPost !== undefined ? postSm.customFeePerPost : feePerPost;

      const alreadyRecorded = approvalRecords.some(r => r.postId === postId);
      if (!alreadyRecorded) {
        const record: ApprovalRecord = {
          id: `appr-${Date.now()}-${postId}`,
          postId: targetPost.id,
          postTitle: targetPost.title,
          clientProjectId: targetPost.clientProjectId,
          clientName: postClient?.name || 'Cliente',
          socialMediaId: postSm?.id || targetPost.socialMediaAuthorId,
          socialMediaName: postSm?.name || 'Social Media',
          approvedAt: nowIso,
          approvedByRole: currentUserRole,
          approvedByName: approverName,
          approvedByPhone: currentUserRole === 'cliente' ? postClient?.whatsappNumber : postSm?.whatsapp,
          approvedByEmail: currentUserRole === 'cliente' ? postClient?.email : postSm?.email,
          pricePerPostSnapshot: postClient?.pricePerPost ?? 150,
          feePerPostSnapshot: effectiveRate,
          billingStatus: 'computado'
        };
        setApprovalRecords(prev => [record, ...prev]);
        syncApprovalRecordToSupabase(record);
      }
    }

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const formattedTimestamp = now.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        let updatedComments = p.comments;

        // Se for aprovação, registra comentário oficial de aprovação com data e hora (sem duplicar)
        if (newStatus === 'aprovado') {
          const alreadyHasApprovalComment = p.comments.some(c =>
            c.text.toLowerCase().includes('post aprovado com sucesso') ||
            c.text.toLowerCase().includes('projeto aprovado')
          );

          if (!alreadyHasApprovalComment) {
            const approvalComment: Comment = {
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
          }

          // Mensagem de agradecimento e confirmação de agendamento
          setApprovalToastMessage('🎉 Muito obrigado! O post foi aprovado com sucesso e registrado para faturamento.');
          setTimeout(() => setApprovalToastMessage(null), 8000);
        }

        const updated = { 
          ...p, 
          status: newStatus, 
          comments: updatedComments,
          approvedAt: newStatus === 'aprovado' ? (p.approvedAt || nowIso) : p.approvedAt,
          approvedBy: newStatus === 'aprovado' ? (p.approvedBy || approverName) : p.approvedBy,
          updatedAt: nowIso 
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

    // Quando o social media postar (isPublished === true), a tarefa atrelada muda automaticamente para 'concluido'
    if (isPublished) {
      const targetPost = posts.find(p => p.id === postId);
      setTasks(prev => prev.map(t => {
        if (t.linkedPostId === postId || (targetPost?.linkedTaskId && t.id === targetPost.linkedTaskId)) {
          const updatedTask: ClientTask = { ...t, status: 'concluido', updatedAt: new Date().toISOString() };
          if (hasSupabaseCredentials()) {
            syncTaskToSupabase(updatedTask);
          }
          return updatedTask;
        }
        return t;
      }));
    }
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

  const handleAddComment = (
    postId: string, 
    commentText: string,
    metadata?: { authorPhone?: string; authorEmail?: string; authorName?: string; authorRole?: UserRole }
  ) => {
    const role = metadata?.authorRole || currentUserRole;
    const authorName = metadata?.authorName?.trim() || (
      role === 'cliente' ? (selectedClient.contactName || selectedClient.name || 'Cliente') :
      role === 'social_media' ? (responsibleSm?.name || 'Social Media') : 'Gestor'
    );

    const newCommentObj: Comment = {
      id: `c-${Date.now()}`,
      authorRole: role,
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
      authorRole: role,
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
        if (publicApprovalPost?.id === postId) {
          setPublicApprovalPost(updated);
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
          authorName: currentUserRole === 'social_media' ? (responsibleSm?.name || 'Social Media') : 'Gestor',
          text: newPostData.linkedTaskId 
            ? 'Projeto criado a partir de tarefa solicitada pelo cliente.'
            : 'Projeto criado para aprovação do cliente.',
          timestamp: new Date().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setPosts([newPost, ...posts]);
    
    // Se o post foi gerado a partir de uma tarefa solicitada pelo cliente, vincula o ID do post à tarefa e atualiza para 'em_andamento'
    if (newPostData.linkedTaskId) {
      setTasks(prev => prev.map(t => {
        if (t.id === newPostData.linkedTaskId) {
          const updatedTask: ClientTask = {
            ...t,
            status: 'em_andamento',
            linkedPostId: newPost.id,
            updatedAt: new Date().toISOString()
          };
          syncTaskToSupabase(updatedTask);
          return updatedTask;
        }
        return t;
      }));
    }

    // Auto add whatsapp notification
    setNotificationHistory(prev => [
      {
        recipientPhone: selectedClient.whatsappNumber,
        recipientName: selectedClient.contactName,
        type: 'novo_rascunho',
        postTitle: newPost.title,
        customMessage: `Novo projeto de post "${newPost.title}" enviado para aprovação.`
      },
      ...prev
    ]);
  };

  // Handlers para Tarefas Solicitadas pelo Cliente (gravando imediatamente no Supabase + Servidor)
  const handleAddTask = async (newTaskData: Omit<ClientTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: ClientTask = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const nextTasks = [newTask, ...tasks];
    setTasks(nextTasks);
    saveSharedServerStatePatch({ tasks: nextTasks });
    if (hasSupabaseCredentials()) {
      const res = await syncTaskToSupabase(newTask);
      if (res.missingTable) setTasksTableMissingInSupabase(true);
      else if (res.success) setTasksTableMissingInSupabase(false);
    }
  };

  const handleUpdateTask = async (updatedTask: ClientTask) => {
    const timestampedTask: ClientTask = { ...updatedTask, updatedAt: new Date().toISOString() };
    const nextTasks = tasks.map(t => t.id === updatedTask.id ? timestampedTask : t);
    setTasks(nextTasks);
    saveSharedServerStatePatch({ tasks: nextTasks });
    if (hasSupabaseCredentials()) {
      const res = await syncTaskToSupabase(timestampedTask);
      if (res.missingTable) setTasksTableMissingInSupabase(true);
      else if (res.success) setTasksTableMissingInSupabase(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const nextTasks = tasks.filter(t => t.id !== taskId);
    setTasks(nextTasks);
    saveSharedServerStatePatch({ tasks: nextTasks });
    if (hasSupabaseCredentials()) {
      await deleteTaskFromSupabase(taskId);
    }
  };

  const handleConvertTaskToPost = async (task: ClientTask) => {
    // Ao transformar em rascunho, o status já muda para 'em_andamento'
    const updatedTask: ClientTask = { ...task, status: 'em_andamento' as TaskStatus, updatedAt: new Date().toISOString() };
    const nextTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
    setTasks(nextTasks);
    saveSharedServerStatePatch({ tasks: nextTasks });
    if (hasSupabaseCredentials()) {
      syncTaskToSupabase(updatedTask);
    }
    setConvertingTask(task);
    setIsNewPostModalOpen(true);
  };

  const handleAddInspiration = (newInsp: Omit<InspirationFile, 'id' | 'createdAt'>) => {
    const created: InspirationFile = {
      ...newInsp,
      id: `insp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setInspirations([created, ...inspirations]);
    if (hasSupabaseCredentials()) {
      syncInspirationToSupabase(created);
    }
  };

  const handleDeleteInspiration = (id: string) => {
    setInspirations(inspirations.filter(i => i.id !== id));
    if (hasSupabaseCredentials()) {
      deleteInspirationFromSupabase(id);
    }
  };

  const handleUpdateInspiration = (updatedInspiration: InspirationFile) => {
    setInspirations(prev => prev.map(i => i.id === updatedInspiration.id ? updatedInspiration : i));
    if (hasSupabaseCredentials()) {
      syncInspirationToSupabase(updatedInspiration);
    }
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
    // Marca os registros de aprovação desse cliente como faturados quando o recibo é salvo
    setApprovalRecords(prev => prev.map(rec => {
      if (rec.clientProjectId === savedReceipt.clientProjectId && rec.billingStatus === 'computado') {
        const updatedRec: ApprovalRecord = { ...rec, billingStatus: 'faturado' };
        syncApprovalRecordToSupabase(updatedRec);
        return updatedRec;
      }
      return rec;
    }));

    // Sincroniza o recibo com o Supabase (incluindo URL da assinatura digitalizada)
    syncReceiptToSupabase(savedReceipt);
  };

  // Envio direto do alerta via WhatsApp (sem histórico desnecessário)
  const handleSendWhatsAppAlert = (postId: string, messageText: string) => {
    const targetPost = posts.find(p => p.id === postId);
    const tokenUrl = targetPost ? buildApprovalUrl(targetPost.approvalToken || 'token') : '';
    const textToSend = messageText.trim() || `Olá! Temos um projeto de post ("${targetPost?.title || 'Novo Post'}") da ${selectedClient.name} pronto para sua aprovação:\n\n🔗 Acesse para ver a prévia, aprovar ou solicitar ajustes:\n${tokenUrl}`;
    openWhatsAppDirect(selectedClient.whatsappNumber, textToSend);
  };

  // Envio direto do recibo via WhatsApp
  const handleSendWhatsAppReceipt = (receipt: BillingReceipt) => {
    const text = `Olá ${selectedClient.contactName || selectedClient.name}!\n\nSegue o Recibo de Prestação de Serviços ${receipt.receiptNumber} (${receipt.period}) no valor total de R$ ${receipt.totalAmount.toFixed(2)} emitido com sucesso.\n\nAgradecemos a parceria!`;
    openWhatsAppDirect(selectedClient.whatsappNumber, text);
  };

  // Envio da tela completa do Mural de Posts e Aprovações para o WhatsApp com isolamento de projetos
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

    // Remover tarefas vinculadas a esse cliente
    setTasks(prev => prev.filter(t => t.clientProjectId !== clientId));

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
    const deletedAt = new Date().toISOString();

    // Preserva o Registro Oficial de Aprovação (caso o post já estivesse aprovado) para computação de faturamento
    setApprovalRecords(prev => prev.map(rec => {
      if (rec.postId === postId && !rec.postDeletedAt) {
        const updatedRec: ApprovalRecord = { ...rec, postDeletedAt: deletedAt };
        syncApprovalRecordToSupabase(updatedRec);
        return updatedRec;
      }
      return rec;
    }));

    // Remover do estado de posts
    setPosts(prev => prev.filter(p => p.id !== postId));

    // Desvincular post de tarefas se estiver vinculado
    setTasks(prev => prev.map(t => {
      if (t.linkedPostId === postId) {
        const updatedTask: ClientTask = { ...t, linkedPostId: undefined, updatedAt: new Date().toISOString() };
        if (hasSupabaseCredentials()) {
          syncTaskToSupabase(updatedTask);
        }
        return updatedTask;
      }
      return t;
    }));

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
        onOpenClientCard={() => setIsClientCardOpen(true)}
        unreadNotificationsCount={draftsCount + changesRequestedCount}
        socialMedias={socialMedias}
        activeSocialMediaId={activeSocialMediaId}
        onSelectSocialMedia={setActiveSocialMediaId}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && activeTab !== 'posts') {
            setActiveTab('posts');
          }
        }}
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
        pendingTasksCount={pendingTasksCount}
        birthdaysCount={clientBdayPeople.length}
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
            
            {/* ============================================================ */}
            {/* FORMATO ENXUTO: CARD 1 - CABEÇALHO DO CLIENTE & SOCIAL MEDIA (Oculto na visualização do cliente) */}
            {/* ============================================================ */}
            {currentUserRole !== 'cliente' && (
              <div className="bg-gradient-to-r from-[#0c1024] via-[#0f142d] to-[#14102d] border border-indigo-900/60 rounded-3xl p-3 sm:p-4 shadow-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    onClick={() => setIsClientCardOpen(true)}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#141b38] hover:bg-[#1a234a] border border-indigo-500/40 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer transition-all hover:scale-105 shadow-md group"
                    title="Clique para visualizar o card de dados cadastrados do cliente"
                  >
                    {selectedClient.logoUrl ? (
                      <img src={selectedClient.logoUrl} alt={selectedClient.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ESPAÇO EXCLUSIVO DE ATENDIMENTO
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <h2 
                        onClick={() => setIsClientCardOpen(true)}
                        className="text-sm sm:text-base font-bold text-white cursor-pointer hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                        title="Clique para visualizar os dados cadastrados deste cliente"
                      >
                        <span>{selectedClient.name}</span>
                      </h2>
                      <span className="text-slate-500 text-xs hidden sm:inline">•</span>
                      <span className="text-xs sm:text-sm text-slate-200 font-medium">
                        Social Media: <strong className="text-white font-bold">{responsibleSm?.name || 'Social Media'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botão de Atalho para Tarefas */}
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className="border border-amber-500/70 hover:border-amber-400 bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 hover:text-amber-300 font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-md shrink-0 hover:scale-[1.02] group"
                  title="Acessar tarefas solicitadas pelo cliente"
                >
                  <ClipboardCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {clientTasks.length} {clientTasks.length === 1 ? 'Tarefa' : 'Tarefas'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            )}

            {/* ============================================================ */}
            {/* FORMATO ENXUTO: CARD 2 - BARRA DE BUSCA, FILTROS & AÇÕES (Oculto para Cliente, pois a busca fica no topo) */}
            {/* ============================================================ */}
            {currentUserRole !== 'cliente' && (
            <div className="bg-[#0c1024] border border-indigo-900/60 rounded-3xl p-2.5 sm:p-3 shadow-xl flex flex-wrap items-center justify-between gap-2.5">
              
              {/* Campo de Pesquisa em Pill */}
              <div className="relative flex-1 min-w-[200px] max-w-xs sm:max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por título ou palavra-chave da legenda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#070b16] text-xs text-white pl-9 pr-4 py-2 rounded-full border border-slate-800/80 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>

              {/* Filtros em Pill e Botões de Ação (Exclusivos para Social Media e Gestor) */}
              {(currentUserRole === 'social_media' || currentUserRole === 'gestor') && (
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  
                  {/* Todos */}
                  <button
                    type="button"
                    onClick={() => setStatusFilter('todos')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                      statusFilter === 'todos' 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                        : 'bg-[#0a0f21] text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    Todos ({clientPosts.length})
                  </button>

                  {/* Projeto */}
                  <button
                    type="button"
                    onClick={() => setStatusFilter('rascunho')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                      statusFilter === 'rascunho' 
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30' 
                        : 'border-amber-500/70 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-amber-400 text-amber-400 text-[10px] font-black flex items-center justify-center leading-none">!</span>
                    <span>Projeto ({draftsCount})</span>
                  </button>

                  {/* Alterar */}
                  <button
                    type="button"
                    onClick={() => setStatusFilter('alterar')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                      statusFilter === 'alterar' 
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30' 
                        : 'border-rose-500/70 text-rose-400 bg-rose-950/20 hover:bg-rose-950/40'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-rose-400 text-rose-400 text-[10px] font-black flex items-center justify-center leading-none">!</span>
                    <span>Alterar ({changesRequestedCount})</span>
                  </button>

                  {/* Aprovado */}
                  <button
                    type="button"
                    onClick={() => setStatusFilter('aprovado')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                      statusFilter === 'aprovado' 
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30' 
                        : 'border-emerald-500/70 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Aprovado ({approvedCount})</span>
                  </button>

                  {/* Enviar Mural via WhatsApp */}
                  <button
                    type="button"
                    onClick={handleSendEntireMuralWhatsApp}
                    className="px-3.5 py-1.5 rounded-full border border-emerald-500/60 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02]"
                    title="Enviar link completo do Mural para o WhatsApp do cliente"
                  >
                    <Bell className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Enviar Mural via WhatsApp</span>
                  </button>

                  {/* + Novo Projeto */}
                  <button
                    type="button"
                    onClick={() => setIsNewPostModalOpen(true)}
                    className="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all shrink-0 hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Projeto</span>
                  </button>
                </div>
              )}

            </div>
            )}

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
                    onPublishPost={(id) => handleTogglePublished(id, true)}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB: TAREFAS DO CLIENTE */}
        {activeTab === 'tasks' && (
          <ClientTasksSection
            tasks={tasks}
            client={selectedClient}
            currentUserRole={currentUserRole}
            posts={clientPosts}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onConvertTaskToPost={handleConvertTaskToPost}
            tasksDbWarning={tasksTableMissingInSupabase}
            onManualSync={loadRemoteData}
            isSyncing={isManualSyncing}
            onOpenPostDetails={(postId) => {
              const target = posts.find(p => p.id === postId);
              if (target) setSelectedPostForDetails(target);
            }}
          />
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

        {/* TAB: ANIVERSARIANTES */}
        {activeTab === 'birthdays' && (
          <BirthdaysSection
            client={selectedClient}
            currentUserRole={currentUserRole}
            responsibleSm={responsibleSm}
            backgrounds={clientBdayBackgrounds}
            groups={clientBdayGroups}
            messages={clientBdayMessages}
            people={clientBdayPeople}
            auditLogs={clientBdayAuditLogs}
            clientSession={birthdayClientSessions[selectedClient.id] || null}
            onClientLogin={(session) =>
              setBirthdayClientSessions(prev => ({ ...prev, [selectedClient.id]: session }))
            }
            onClientLogout={() =>
              setBirthdayClientSessions(prev => {
                const copy = { ...prev };
                delete copy[selectedClient.id];
                return copy;
              })
            }
            onSaveBackground={(bg) => setBirthdayBackgrounds(prev => [bg, ...prev])}
            onUpdateBackground={(bg) =>
              setBirthdayBackgrounds(prev => prev.map(item => (item.id === bg.id ? bg : item)))
            }
            onDeleteBackground={(bgId) =>
              setBirthdayBackgrounds(prev => prev.filter(item => item.id !== bgId))
            }
            onSaveGroup={(grp) => setBirthdayGroups(prev => [...prev, grp])}
            onUpdateGroup={(grp) =>
              setBirthdayGroups(prev => prev.map(item => (item.id === grp.id ? grp : item)))
            }
            onDeleteGroup={(grpId) =>
              setBirthdayGroups(prev => prev.filter(item => item.id !== grpId))
            }
            onSaveMessage={(msg) => setBirthdayMessages(prev => [...prev, msg])}
            onUpdateMessage={(msg) =>
              setBirthdayMessages(prev => prev.map(item => (item.id === msg.id ? msg : item)))
            }
            onDeleteMessage={(msgId) =>
              setBirthdayMessages(prev => prev.filter(item => item.id !== msgId))
            }
            onSavePerson={(person) => setBirthdayPeople(prev => [person, ...prev])}
            onUpdatePerson={(person) =>
              setBirthdayPeople(prev => prev.map(item => (item.id === person.id ? person : item)))
            }
            onDeletePerson={(personId) =>
              setBirthdayPeople(prev => prev.filter(item => item.id !== personId))
            }
            onRecordAudit={(entry) =>
              setBirthdayAuditLogs(prev => [
                {
                  ...entry,
                  id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  clientProjectId: selectedClient.id,
                  timestamp: new Date().toISOString()
                },
                ...prev
              ])
            }
            onSendArtToMural={(postData) => {
              handleCreatePost(postData);
              setActiveTab('posts');
            }}
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
            posts={posts}
            approvalRecords={approvalRecords}
            onSaveReceipt={handleSaveReceipt}
            onSendWhatsAppReceipt={handleSendWhatsAppReceipt}
            onAddSaasProof={handleAddSaasProof}
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
            approvalRecords={approvalRecords}
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
        clientName={selectedClient.name}
        clientContactName={selectedClient.contactName}
        socialMediaName={responsibleSm?.name}
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
        onRequestChange={(postId, text, metadata) => {
          handleUpdatePostStatus(postId, 'alterar');
          handleAddComment(postId, `[Instrução de Ajuste]: ${text}`, metadata);
        }}
        onAddComment={handleAddComment}
        onRenewToken={handleRenewToken}
      />

      <NewPostModal
        isOpen={isNewPostModalOpen}
        onClose={() => {
          setIsNewPostModalOpen(false);
          setConvertingTask(null);
        }}
        clientProjectId={selectedClientId}
        inspirations={clientInspirations}
        onCreatePost={handleCreatePost}
        initialTitle={convertingTask?.title || ''}
        initialCaption={convertingTask?.description ? `Briefing da Solicitação do Cliente: ${convertingTask.description}\n\n` : ''}
        initialLinkedTaskId={convertingTask?.id}
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

      {/* Modal com Card de Dados Cadastrados do Cliente */}
      <ClientDetailsCardModal
        client={selectedClient}
        isOpen={isClientCardOpen}
        onClose={() => setIsClientCardOpen(false)}
        currentUserRole={currentUserRole}
        socialMedias={socialMedias}
        onEditClient={(c) => {
          setSelectedClientId(c.id);
          setActiveTab('settings');
        }}
      />

    </div>
  );
}

