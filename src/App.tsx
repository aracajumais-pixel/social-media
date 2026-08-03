import React, { useState } from 'react';
import { 
  INITIAL_CLIENTS, INITIAL_POSTS, INITIAL_INSPIRATIONS, 
  INITIAL_RECEIPTS, MOCK_METRICS, MOCK_CHANNELS, INITIAL_SOCIAL_MEDIAS, INITIAL_SAAS_PROOF_PAYMENTS
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

import { Plus, Filter, Clock, CheckCircle2, AlertCircle, Search, Layers } from 'lucide-react';

export default function App() {
  // Global State
  const [clients, setClients] = useState<ClientProject[]>(INITIAL_CLIENTS);
  const [socialMedias, setSocialMedias] = useState<SocialMediaUser[]>(INITIAL_SOCIAL_MEDIAS);
  const [selectedClientId, setSelectedClientId] = useState<string>('client-1');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('gestor');
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  const [posts, setPosts] = useState<PostItem[]>(INITIAL_POSTS);
  const [inspirations, setInspirations] = useState<InspirationFile[]>(INITIAL_INSPIRATIONS);
  const [receipts, setReceipts] = useState<BillingReceipt[]>(INITIAL_RECEIPTS);
  const [feePerPost, setFeePerPost] = useState<number>(0.50);
  const [saasProofs, setSaasProofs] = useState<SaaSPaymentProof[]>(INITIAL_SAAS_PROOF_PAYMENTS);

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
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<WhatsAppNotificationPayload[]>([]);

  // Active Client
  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

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
      currentUserRole === 'social_media' ? 'Ana (Social Media)' : 'Lucas (Gestor)';

    const newCommentObj = {
      id: `c-${Date.now()}`,
      authorRole: currentUserRole,
      authorName,
      text: commentText,
      timestamp: new Date().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

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
          authorName: currentUserRole === 'social_media' ? 'Ana (Social Media)' : 'Lucas (Gestor)',
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
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleChangeMetricsAccess = (clientId: string, access: ClientProject['metricsAccess']) => {
    setClients(clients.map(c => c.id === clientId ? { ...c, metricsAccess: access } : c));
  };

  const handleAddSocialMedia = (newSM: Omit<SocialMediaUser, 'id'>) => {
    const created: SocialMediaUser = {
      ...newSM,
      id: `sm-${Date.now()}`
    };
    setSocialMedias([...socialMedias, created]);
  };

  const handleDeleteSocialMedia = (smId: string) => {
    setSocialMedias(prev => prev.filter(sm => sm.id !== smId));
  };

  const handleToggleBlockSocialMedia = (smId: string) => {
    setSocialMedias(prev => prev.map(sm => {
      if (sm.id === smId) {
        const nextStatus = sm.status === 'bloqueado' ? 'ativo' : 'bloqueado';
        return { ...sm, status: nextStatus };
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

        {/* TAB 5: CONFIGURAÇÕES DO CLIENTE */}
        {activeTab === 'settings' && (currentUserRole === 'gestor' || currentUserRole === 'social_media') && (
          <ClientSettings
            client={selectedClient}
            currentUserRole={currentUserRole}
            onUpdateClient={handleUpdateClient}
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
            onToggleBlockClient={handleToggleBlockClient}
            feePerPost={feePerPost}
            onUpdateFeePerPost={(newFee) => setFeePerPost(newFee)}
            onAddSaasProof={handleAddSaasProof}
            onUpdateSaasProofStatus={handleUpdateSaasProofStatus}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* TAB 7: LIVRO DO PROJETO & HISTÓRICO VIVO DO CHAT */}
        {activeTab === 'book' && (
          <ProjectBookView />
        )}

        {/* TAB 8: ANÁLISE DE MERCADO & EXCEL */}
        {activeTab === 'market' && (
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

