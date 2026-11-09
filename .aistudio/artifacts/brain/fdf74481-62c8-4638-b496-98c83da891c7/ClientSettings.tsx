import React, { useState, useEffect } from 'react';
import { ClientProject, UserRole, SocialNetwork, SocialMediaUser } from '../types';
import { Building, Phone, Mail, HardDrive, Image as ImageIcon, Share2, Search, Plus, Edit3, X, Check, Sparkles, Loader2, AlertCircle, Trash2, AlertTriangle, UserPlus, UserCheck, Users } from 'lucide-react';
import { DriveImage } from './DriveImage';
import { getEmbeddableMediaUrl } from '../utils/driveHelper';
import { searchClientsInSupabase } from '../lib/supabase';
import { createDriveFolderForClient, getSavedDriveWebhookUrl } from '../utils/driveAutomation';
import { SupabaseMediaUploader } from './SupabaseMediaUploader';

interface ClientSettingsProps {
  client: ClientProject;
  clients?: ClientProject[];
  onSelectClient?: (clientId: string) => void;
  currentUserRole: UserRole;
  onUpdateClient: (updated: ClientProject) => void;
  onAddClient?: (newClient: ClientProject) => void;
  onDeleteClient?: (clientId: string) => void | Promise<void>;
  socialMedias?: SocialMediaUser[];
  onAddSocialMedia?: (newSm: Omit<SocialMediaUser, 'id'>) => void;
}

const ALL_NETWORKS: { id: SocialNetwork; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' }
];

export const ClientSettings: React.FC<ClientSettingsProps> = ({
  client,
  clients = [],
  onSelectClient,
  currentUserRole,
  onUpdateClient,
  onAddClient,
  onDeleteClient,
  socialMedias = [],
  onAddSocialMedia
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [supabaseSearchResults, setSupabaseSearchResults] = useState<ClientProject[] | null>(null);
  const [isSearchingSupabase, setIsSearchingSupabase] = useState(false);
  const [lastEditedClientId, setLastEditedClientId] = useState<string>(() => {
    return localStorage.getItem('last_edited_client_id') || client.id || '';
  });

  // State para confirmação de exclusão de cliente (gestor e social media)
  const [clientToDelete, setClientToDelete] = useState<ClientProject | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  // Modal state (used for BOTH adding new client AND editing an existing client)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProject | null>(null); // null = new mode, ClientProject = edit mode
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isGeneratingDriveFolder, setIsGeneratingDriveFolder] = useState(false);
  const [driveGenError, setDriveGenError] = useState<string | null>(null);
  const [driveGenSuccess, setDriveGenSuccess] = useState(false);

  const [modalForm, setModalForm] = useState({
    id: '',
    name: '',
    companyName: '',
    cnpj: '',
    address: '',
    contactName: '',
    whatsappNumber: '',
    email: '',
    pricePerPost: '' as string | number,
    googleDriveFolderUrl: '',
    logoUrl: '',
    activeSocialNetworks: ['instagram', 'facebook'] as SocialNetwork[],
    assignedSocialMediaId: socialMedias[0]?.id || ''
  });

  // Modal de Cadastro de Social Media (Exclusivo Gestor)
  const [isSmModalOpen, setIsSmModalOpen] = useState(false);
  const [smSavedSuccess, setSmSavedSuccess] = useState(false);
  const [isGeneratingSmDriveFolder, setIsGeneratingSmDriveFolder] = useState(false);
  const [smDriveGenError, setSmDriveGenError] = useState<string | null>(null);
  const [smDriveGenSuccess, setSmDriveGenSuccess] = useState(false);
  const [smFormError, setSmFormError] = useState<string | null>(null);

  const [smForm, setSmForm] = useState({
    name: '',
    companyName: '',
    cnpj: '',
    address: '',
    contactName: '',
    whatsappNumber: '',
    email: '',
    pricePerPost: '' as string | number,
    googleDriveFolderUrl: '',
    logoUrl: '',
    activeSocialNetworks: ['instagram', 'facebook'] as SocialNetwork[],
    pixKey: '',
    socialProfile: '',
    assignedClientIds: [] as string[]
  });

  // Query Supabase directly when searchQuery changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSupabaseSearchResults(null);
      setIsSearchingSupabase(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSupabase(true);
      const results = await searchClientsInSupabase(searchQuery);
      setSupabaseSearchResults(results);
      setIsSearchingSupabase(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Open modal in CREATE mode
  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setSavedSuccess(false);
    setDriveGenError(null);
    setDriveGenSuccess(false);
    setModalForm({
      id: '',
      name: '',
      companyName: '',
      cnpj: '',
      address: '',
      contactName: '',
      whatsappNumber: '',
      email: '',
      pricePerPost: 150,
      googleDriveFolderUrl: '',
      logoUrl: '',
      activeSocialNetworks: ['instagram', 'facebook'],
      assignedSocialMediaId: socialMedias[0]?.id || ''
    });
    setIsClientModalOpen(true);
  };

  // Open modal in EDIT mode
  const handleOpenEditModal = (targetClient: ClientProject) => {
    setEditingClient(targetClient);
    setSavedSuccess(false);
    setDriveGenError(null);
    setDriveGenSuccess(false);
    setModalForm({
      id: targetClient.id,
      name: targetClient.name || '',
      companyName: targetClient.companyName || '',
      cnpj: targetClient.cnpj || '',
      address: targetClient.address || '',
      contactName: targetClient.contactName || '',
      whatsappNumber: targetClient.whatsappNumber || '',
      email: targetClient.email || '',
      pricePerPost: targetClient.pricePerPost ?? 150,
      googleDriveFolderUrl: targetClient.googleDriveFolderUrl || '',
      logoUrl: targetClient.logoUrl || '',
      activeSocialNetworks: targetClient.activeSocialNetworks || ['instagram', 'facebook'],
      assignedSocialMediaId: targetClient.assignedSocialMediaId || socialMedias[0]?.id || ''
    });
    setIsClientModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsClientModalOpen(false);
    setEditingClient(null);
    setSavedSuccess(false);
    setDriveGenError(null);
    setDriveGenSuccess(false);
  };

  const handleQuickGenerateDriveFolder = async () => {
    if (!modalForm.name.trim()) {
      setDriveGenError('Digite o nome do cliente antes de gerar a pasta.');
      return;
    }
    const webhook = getSavedDriveWebhookUrl();
    if (!webhook) {
      setDriveGenError('URL do Webhook não configurada. Configure na Central do Drive.');
      return;
    }

    setIsGeneratingDriveFolder(true);
    setDriveGenError(null);
    setDriveGenSuccess(false);

    try {
      const result = await createDriveFolderForClient(modalForm.name.trim(), webhook);
      if (result.status === 'success' && result.folderUrl) {
        setModalForm(prev => ({ ...prev, googleDriveFolderUrl: result.folderUrl || '' }));
        setDriveGenSuccess(true);
      } else {
        setDriveGenError(result.message || 'Erro ao gerar pastas no Drive.');
      }
    } catch (err: any) {
      setDriveGenError(err.message || 'Falha ao conectar com o Google Apps Script.');
    } finally {
      setIsGeneratingDriveFolder(false);
    }
  };

  const handleSaveClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.name.trim()) return;

    if (editingClient) {
      // Edit Existing Client
      const updated: ClientProject = {
        ...editingClient,
        name: modalForm.name.trim(),
        companyName: modalForm.companyName.trim() || modalForm.name.trim(),
        cnpj: modalForm.cnpj.trim(),
        address: modalForm.address.trim(),
        contactName: modalForm.contactName.trim(),
        whatsappNumber: modalForm.whatsappNumber.trim(),
        email: modalForm.email.trim(),
        pricePerPost: Number(modalForm.pricePerPost) || 150,
        googleDriveFolderUrl: modalForm.googleDriveFolderUrl.trim(),
        logoUrl: modalForm.logoUrl.trim(),
        activeSocialNetworks: modalForm.activeSocialNetworks,
        assignedSocialMediaId: modalForm.assignedSocialMediaId || undefined
      };

      onUpdateClient(updated);
      setLastEditedClientId(updated.id);
      localStorage.setItem('last_edited_client_id', updated.id);
      if (onSelectClient) onSelectClient(updated.id);
    } else {
      // Create New Client
      const newId = `client-${Date.now()}`;
      const created: ClientProject = {
        id: newId,
        name: modalForm.name.trim(),
        companyName: modalForm.companyName.trim() || modalForm.name.trim(),
        cnpj: modalForm.cnpj.trim() || '00.000.000/0001-00',
        address: modalForm.address.trim() || 'Endereço Comercial',
        contactName: modalForm.contactName.trim() || 'Contato Principal',
        whatsappNumber: modalForm.whatsappNumber.trim() || '5511999998888',
        email: modalForm.email.trim() || 'contato@cliente.com',
        pricePerPost: Number(modalForm.pricePerPost) || 150,
        metricsAccess: 'ambos',
        googleDriveFolderUrl: modalForm.googleDriveFolderUrl.trim(),
        logoUrl: modalForm.logoUrl.trim(),
        activeSocialNetworks: modalForm.activeSocialNetworks,
        assignedSocialMediaId: modalForm.assignedSocialMediaId || undefined,
        status: 'ativo',
        driveStorageUsedGB: 0.5,
        driveStorageLimitGB: 15.0
      };

      if (onAddClient) onAddClient(created);
      setLastEditedClientId(newId);
      localStorage.setItem('last_edited_client_id', newId);
      if (onSelectClient) onSelectClient(newId);
    }

    setSavedSuccess(true);
  };

  // Open modal in Social Media CREATE mode
  const handleOpenCreateSmModal = () => {
    setSmSavedSuccess(false);
    setSmDriveGenError(null);
    setSmDriveGenSuccess(false);
    setSmFormError(null);
    setSmForm({
      name: '',
      companyName: '',
      cnpj: '',
      address: '',
      contactName: '',
      whatsappNumber: '',
      email: '',
      pricePerPost: 150,
      googleDriveFolderUrl: '',
      logoUrl: '',
      activeSocialNetworks: ['instagram', 'facebook'],
      pixKey: '',
      socialProfile: '',
      assignedClientIds: []
    });
    setIsSmModalOpen(true);
  };

  const handleCloseSmModal = () => {
    setIsSmModalOpen(false);
    setSmSavedSuccess(false);
    setSmDriveGenError(null);
    setSmDriveGenSuccess(false);
    setSmFormError(null);
  };

  const handleToggleSmNetwork = (network: SocialNetwork) => {
    const current = smForm.activeSocialNetworks || [];
    if (current.includes(network)) {
      if (current.length === 1) return;
      setSmForm({ ...smForm, activeSocialNetworks: current.filter(n => n !== network) });
    } else {
      setSmForm({ ...smForm, activeSocialNetworks: [...current, network] });
    }
  };

  const handleQuickGenerateSmDriveFolder = async () => {
    if (!smForm.name.trim()) {
      setSmDriveGenError('Digite o nome do social media antes de gerar a pasta.');
      return;
    }
    const webhook = getSavedDriveWebhookUrl();
    if (!webhook) {
      setSmDriveGenError('URL do Webhook não configurada. Configure na Central do Drive.');
      return;
    }

    setIsGeneratingSmDriveFolder(true);
    setSmDriveGenError(null);
    setSmDriveGenSuccess(false);

    try {
      const result = await createDriveFolderForClient(`Social Media - ${smForm.name.trim()}`, webhook);
      if (result.status === 'success' && result.folderUrl) {
        setSmForm(prev => ({ ...prev, googleDriveFolderUrl: result.folderUrl || '' }));
        setSmDriveGenSuccess(true);
      } else {
        setSmDriveGenError(result.message || 'Erro ao gerar pastas no Drive.');
      }
    } catch (err: any) {
      setSmDriveGenError(err.message || 'Falha ao conectar com o Google Apps Script.');
    } finally {
      setIsGeneratingSmDriveFolder(false);
    }
  };

  const handleSaveSmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smForm.name.trim()) {
      setSmFormError('O nome do profissional é obrigatório.');
      return;
    }

    const priceNum = Number(smForm.pricePerPost) || 150;
    const newSm: Omit<SocialMediaUser, 'id'> = {
      name: smForm.name.trim(),
      companyName: smForm.companyName.trim() || smForm.name.trim(),
      cnpj: smForm.cnpj.trim() || '00.000.000/0001-00',
      address: smForm.address.trim() || 'Endereço Comercial',
      contactName: smForm.contactName.trim() || smForm.name.trim(),
      whatsappNumber: smForm.whatsappNumber.trim() || '5511999998888',
      whatsapp: smForm.whatsappNumber.trim() || '5511999998888',
      email: smForm.email.trim() || 'socialmedia@agencia.com',
      pricePerPost: priceNum,
      customFeePerPost: priceNum,
      googleDriveFolderUrl: smForm.googleDriveFolderUrl.trim(),
      logoUrl: smForm.logoUrl.trim(),
      avatarUrl: smForm.logoUrl.trim(),
      activeSocialNetworks: smForm.activeSocialNetworks,
      pixKey: smForm.pixKey.trim() || smForm.email.trim() || 'chave-pix-pendente',
      socialProfile: smForm.socialProfile.trim() || 'instagram.com',
      assignedClientIds: smForm.assignedClientIds,
      totalPostsCreated: 0,
      status: 'ativo'
    };

    if (onAddSocialMedia) {
      onAddSocialMedia(newSm);
    }
    setSmSavedSuccess(true);
  };

  const handleToggleNetwork = (network: SocialNetwork) => {
    const current = modalForm.activeSocialNetworks || [];
    if (current.includes(network)) {
      if (current.length === 1) return;
      setModalForm({ ...modalForm, activeSocialNetworks: current.filter(n => n !== network) });
    } else {
      setModalForm({ ...modalForm, activeSocialNetworks: [...current, network] });
    }
  };

  // Determine list of displayed clients
  const displayedClients = searchQuery.trim()
    ? (supabaseSearchResults !== null
        ? supabaseSearchResults
        : clients.filter(c => {
            const q = searchQuery.toLowerCase();
            return (
              c.name.toLowerCase().includes(q) ||
              (c.companyName && c.companyName.toLowerCase().includes(q)) ||
              (c.contactName && c.contactName.toLowerCase().includes(q)) ||
              (c.email && c.email.toLowerCase().includes(q)) ||
              (c.cnpj && c.cnpj.toLowerCase().includes(q))
            );
          }))
    : clients;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* SEÇÃO PRINCIPAL DE GERENCIAMENTO E BUSCA */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        
        {/* Header do Módulo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Building className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Clientes</h2>
              <p className="text-xs text-slate-400">Busca direto no Supabase, gestão simplificada e edição de clientes</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentUserRole === 'gestor' && (
              <button
                type="button"
                onClick={handleOpenCreateSmModal}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0 hover:scale-[1.02]"
                title="Cadastrar Social Media com os mesmos campos do cadastro de cliente"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>Cadastrar Social Media</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all shrink-0 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Cliente</span>
            </button>
          </div>
        </div>

        {/* CAMPO DE BUSCA DE CLIENTES NO SUPABASE */}
        <div className="space-y-3 pt-1">
          <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Search className="w-4 h-4 text-indigo-400" /> Buscar Cliente no Supabase:
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              {isSearchingSupabase ? (
                <span className="text-indigo-400 animate-pulse">Pesquisando no banco de dados Supabase...</span>
              ) : (
                <span>Exibindo {displayedClients.length} de {clients.length} cliente(s)</span>
              )}
            </span>
          </label>

          <div className="relative">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Digite o nome do cliente, razão social, e-mail, contato ou CNPJ para buscar no Supabase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-white pl-10 pr-10 py-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* LISTA DE CLIENTES COM BOTÃO EDITAR */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Lista de Clientes Cadastrados:</span>
            {lastEditedClientId && (
              <span className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-amber-400" /> Destacado: Último Cliente Editado
              </span>
            )}
          </div>

          {displayedClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedClients.map(c => {
                const isSelected = c.id === client.id;
                const isLastEdited = c.id === lastEditedClientId;

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-950/90 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : isLastEdited
                        ? 'bg-slate-950/70 border-amber-500/50'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                        {c.logoUrl ? (
                          <DriveImage src={c.logoUrl} alt={c.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{c.name}</h4>
                          {isLastEdited && (
                            <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-md shrink-0">
                              Último Editado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{c.companyName || c.email || 'Sem dados adicionais'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectClient) onSelectClient(c.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Ativo' : 'Selecionar'}
                      </button>

                      {/* BOTÃO EDITAR NO FORMULÁRIO DO CLIENTE */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(c)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                        title="Editar Informações deste Cliente"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Editar</span>
                      </button>

                      {/* BOTÃO EXCLUIR CLIENTE (DISPONÍVEL PARA GESTOR E SOCIAL MEDIA) */}
                      {(currentUserRole === 'gestor' || currentUserRole === 'social_media') && onDeleteClient && (
                        <button
                          type="button"
                          onClick={() => setClientToDelete(c)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                          title={`Excluir cliente ${c.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span className="hidden sm:inline">Excluir</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs text-slate-400 text-center space-y-2">
              <p>Nenhum cliente encontrado para "{searchQuery}".</p>
              <button
                onClick={handleOpenCreateModal}
                className="text-indigo-400 font-bold hover:underline"
              >
                + Cadastrar "{searchQuery}" como Novo Cliente
              </button>
            </div>
          )}
        </div>

      </div>

      {/* UNIFIED MODAL DE CADASTRO / EDIÇÃO DE CLIENTE COM OPÇÃO DE FECHAR */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl my-8 relative">
            
            {/* Header do Modal com Botão Fechar ✕ */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  {editingClient ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingClient ? `Editar Cliente: ${editingClient.name}` : 'Cadastrar Novo Cliente'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingClient ? 'Atualize as informações do cliente cadastrado' : 'Preencha os dados do novo cliente para salvar no Supabase'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tela de Sucesso ou Formulário */}
            {savedSuccess ? (
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/40">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {editingClient ? 'Cliente Atualizado com Sucesso!' : 'Cliente Cadastrado com Sucesso!'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    As informações do cliente <strong className="text-emerald-400">{modalForm.name}</strong> foram salvas e sincronizadas com sucesso.
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    Concluir e Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveClientSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nome Fantasia do Cliente *:</label>
                  <input
                    type="text"
                    required
                    value={modalForm.name}
                    onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                    placeholder="Ex: Padaria Solar"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Razão Social:</label>
                    <input
                      type="text"
                      value={modalForm.companyName}
                      onChange={(e) => setModalForm({ ...modalForm, companyName: e.target.value })}
                      placeholder="Ex: Solar Alimentos LTDA"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">CNPJ / CPF:</label>
                    <input
                      type="text"
                      value={modalForm.cnpj}
                      onChange={(e) => setModalForm({ ...modalForm, cnpj: e.target.value })}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Contato Principal:</label>
                    <input
                      type="text"
                      value={modalForm.contactName}
                      onChange={(e) => setModalForm({ ...modalForm, contactName: e.target.value })}
                      placeholder="Ex: Carlos Silva"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">WhatsApp (com DDD):</label>
                    <input
                      type="text"
                      value={modalForm.whatsappNumber}
                      onChange={(e) => setModalForm({ ...modalForm, whatsappNumber: e.target.value })}
                      placeholder="5511999998888"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">E-mail do Cliente:</label>
                    <input
                      type="email"
                      value={modalForm.email}
                      onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                      placeholder="contato@cliente.com"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Valor por Post (R$):</label>
                    <input
                      type="number"
                      value={modalForm.pricePerPost}
                      onChange={(e) => setModalForm({ ...modalForm, pricePerPost: e.target.value })}
                      placeholder="Ex: 150.00"
                      className="w-full bg-slate-950 text-amber-300 font-bold p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Logomarca do Cliente: Upload ou Link */}
                <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold text-xs">Logomarca do Cliente:</label>
                    <span className="text-[10px] text-indigo-400 font-medium">Upload no Supabase</span>
                  </div>

                  <SupabaseMediaUploader
                    compact={true}
                    currentUrl={modalForm.logoUrl}
                    folder="logos"
                    onUploadSuccess={(url) => {
                      setModalForm(prev => ({ ...prev, logoUrl: url }));
                    }}
                  />

                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold mb-1">Ou informe o link da imagem (Drive ou URL externa):</label>
                    <input
                      type="url"
                      value={modalForm.logoUrl}
                      onChange={(e) => {
                        const converted = e.target.value.trim() ? getEmbeddableMediaUrl(e.target.value) : e.target.value;
                        setModalForm({ ...modalForm, logoUrl: converted });
                      }}
                      placeholder="https://... ou link do Supabase / Drive"
                      className="w-full bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">URL Pasta Google Drive:</label>
                    <button
                      type="button"
                      onClick={handleQuickGenerateDriveFolder}
                      disabled={isGeneratingDriveFolder}
                      className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Criar pastas no Google Drive automaticamente usando o Webhook"
                    >
                      {isGeneratingDriveFolder ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Gerando pastas...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>⚡ Gerar Pastas no Drive</span>
                        </>
                      )}
                    </button>
                  </div>

                  <input
                    type="url"
                    value={modalForm.googleDriveFolderUrl}
                    onChange={(e) => setModalForm({ ...modalForm, googleDriveFolderUrl: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono text-[11px]"
                  />

                  {driveGenError && (
                    <div className="mt-1.5 p-2 bg-red-950/60 border border-red-800/60 rounded-lg text-red-300 flex items-start gap-1.5 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400 mt-0.5" />
                      <span>{driveGenError}</span>
                    </div>
                  )}

                  {driveGenSuccess && (
                    <div className="mt-1.5 p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-300 flex items-center gap-1.5 text-[11px]">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pastas criadas e vinculadas com sucesso no Google Drive!</span>
                    </div>
                  )}
                </div>

                {/* Seleção de Redes Sociais */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-bold">Redes Sociais Ativas:</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_NETWORKS.map(net => {
                      const isActive = (modalForm.activeSocialNetworks || []).includes(net.id);
                      return (
                        <button
                          key={net.id}
                          type="button"
                          onClick={() => handleToggleNetwork(net.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-purple-600 text-white border border-purple-400'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {net.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Botões do Formulário */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    {editingClient && (currentUserRole === 'gestor' || currentUserRole === 'social_media') && onDeleteClient && (
                      <button
                        type="button"
                        onClick={() => setClientToDelete(editingClient)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Excluir Cliente</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-bold text-xs transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                    >
                      {editingClient ? 'Salvar Alterações' : 'Salvar Novo Cliente'}
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Modal: Cadastrar Novo Social Media (Exclusivo Gestor com os mesmos campos de cliente) */}
      {isSmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-xl p-6 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
                  <UserPlus className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Cadastrar Social Media</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Equipe</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cadastre o colaborador com os mesmos dados completos do formulário de cliente
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseSmModal}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tela de Sucesso ou Formulário */}
            {smSavedSuccess ? (
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/40">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    Social Media Cadastrado com Sucesso!
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    As informações do profissional <strong className="text-emerald-400">{smForm.name}</strong> foram salvas e sincronizadas com sucesso.
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseSmModal}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    Concluir e Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveSmSubmit} className="space-y-4 text-xs">
                {smFormError && (
                  <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{smFormError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nome Completo do Social Media *:</label>
                  <input
                    type="text"
                    required
                    value={smForm.name}
                    onChange={(e) => setSmForm({ ...smForm, name: e.target.value })}
                    placeholder="Ex: Carlos Oliveira"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Razão Social / Agência:</label>
                    <input
                      type="text"
                      value={smForm.companyName}
                      onChange={(e) => setSmForm({ ...smForm, companyName: e.target.value })}
                      placeholder="Ex: Oliveira Conteúdo Digital ME"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">CNPJ / CPF:</label>
                    <input
                      type="text"
                      value={smForm.cnpj}
                      onChange={(e) => setSmForm({ ...smForm, cnpj: e.target.value })}
                      placeholder="00.000.000/0001-00 ou CPF"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Contato / Responsável:</label>
                    <input
                      type="text"
                      value={smForm.contactName}
                      onChange={(e) => setSmForm({ ...smForm, contactName: e.target.value })}
                      placeholder="Ex: Carlos (Responsável)"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">WhatsApp (com DDD):</label>
                    <input
                      type="text"
                      value={smForm.whatsappNumber}
                      onChange={(e) => setSmForm({ ...smForm, whatsappNumber: e.target.value })}
                      placeholder="5511999998888"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">E-mail de Acesso:</label>
                    <input
                      type="email"
                      value={smForm.email}
                      onChange={(e) => setSmForm({ ...smForm, email: e.target.value })}
                      placeholder="carlos@agencia.com"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Valor por Post / Taxa (R$):</label>
                    <input
                      type="number"
                      value={smForm.pricePerPost}
                      onChange={(e) => setSmForm({ ...smForm, pricePerPost: e.target.value })}
                      placeholder="Ex: 150.00"
                      className="w-full bg-slate-950 text-emerald-400 font-bold p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Chave Pix (Para Pagamento):</label>
                    <input
                      type="text"
                      value={smForm.pixKey}
                      onChange={(e) => setSmForm({ ...smForm, pixKey: e.target.value })}
                      placeholder="Chave Pix (CPF, CNPJ, Telefone ou E-mail)"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Perfil de Rede Social (Instagram/LinkedIn):</label>
                    <input
                      type="text"
                      value={smForm.socialProfile}
                      onChange={(e) => setSmForm({ ...smForm, socialProfile: e.target.value })}
                      placeholder="instagram.com/carlos_socialmedia"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Endereço Comercial / Localização:</label>
                  <input
                    type="text"
                    value={smForm.address}
                    onChange={(e) => setSmForm({ ...smForm, address: e.target.value })}
                    placeholder="Ex: Av. Paulista, 1000 - São Paulo/SP"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>

                {/* Foto / Logomarca do Social Media: Upload ou Link */}
                <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold text-xs">Foto de Perfil / Logomarca:</label>
                    <span className="text-[10px] text-emerald-400 font-medium">Upload no Supabase</span>
                  </div>

                  <SupabaseMediaUploader
                    compact={true}
                    currentUrl={smForm.logoUrl}
                    folder="social_medias"
                    onUploadSuccess={(url) => {
                      setSmForm(prev => ({ ...prev, logoUrl: url }));
                    }}
                  />

                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold mb-1">Ou informe o link da imagem (Drive ou URL externa):</label>
                    <input
                      type="url"
                      value={smForm.logoUrl}
                      onChange={(e) => {
                        const converted = e.target.value.trim() ? getEmbeddableMediaUrl(e.target.value) : e.target.value;
                        setSmForm({ ...smForm, logoUrl: converted });
                      }}
                      placeholder="https://... ou link do Supabase / Drive"
                      className="w-full bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">URL Pasta Google Drive:</label>
                    <button
                      type="button"
                      onClick={handleQuickGenerateSmDriveFolder}
                      disabled={isGeneratingSmDriveFolder}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Criar pastas no Google Drive automaticamente usando o Webhook"
                    >
                      {isGeneratingSmDriveFolder ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Gerando pastas...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>⚡ Gerar Pastas no Drive</span>
                        </>
                      )}
                    </button>
                  </div>

                  <input
                    type="url"
                    value={smForm.googleDriveFolderUrl}
                    onChange={(e) => setSmForm({ ...smForm, googleDriveFolderUrl: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono text-[11px]"
                  />

                  {smDriveGenError && (
                    <div className="mt-1.5 p-2 bg-red-950/60 border border-red-800/60 rounded-lg text-red-300 flex items-start gap-1.5 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400 mt-0.5" />
                      <span>{smDriveGenError}</span>
                    </div>
                  )}

                  {smDriveGenSuccess && (
                    <div className="mt-1.5 p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-300 flex items-center gap-1.5 text-[11px]">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pastas criadas e vinculadas com sucesso no Google Drive!</span>
                    </div>
                  )}
                </div>

                {/* Seleção de Redes Sociais */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-bold">Redes Sociais Atendidas / Especialidades:</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_NETWORKS.map(net => {
                      const isActive = (smForm.activeSocialNetworks || []).includes(net.id);
                      return (
                        <button
                          key={net.id}
                          type="button"
                          onClick={() => handleToggleSmNetwork(net.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-emerald-600 text-slate-950 font-black border border-emerald-400'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {net.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Clientes Vinculados Inicialmente */}
                {clients.length > 0 && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <label className="block text-slate-300 font-bold">Clientes Atribuídos Inicialmente (Opcional):</label>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {clients.map(c => {
                        const isChecked = smForm.assignedClientIds.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-1.5 hover:bg-slate-900 rounded-lg">
                            <span>{c.name} ({c.companyName || 'Empresa'})</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSmForm({ ...smForm, assignedClientIds: [...smForm.assignedClientIds, c.id] });
                                } else {
                                  setSmForm({ ...smForm, assignedClientIds: smForm.assignedClientIds.filter(id => id !== c.id) });
                                }
                              }}
                              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botões do Formulário */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseSmModal}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-bold text-xs transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Salvar Social Media</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Cliente (Gestor & Social Media) */}
      {clientToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Cliente</h3>
                <p className="text-xs text-slate-400">Esta ação é irreversível</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p>
                Tem certeza de que deseja apagar o cliente <strong className="text-white">"{clientToDelete.name}"</strong>?
              </p>
              <p className="text-slate-400 text-[11px]">
                O cadastro e os dados vinculados a este cliente serão excluídos permanentemente da aplicação e do banco Supabase.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingClient}
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingClient}
                onClick={async () => {
                  if (!onDeleteClient || !clientToDelete) return;
                  setIsDeletingClient(true);
                  try {
                    await onDeleteClient(clientToDelete.id);
                    if (editingClient?.id === clientToDelete.id) {
                      handleCloseModal();
                    }
                    setClientToDelete(null);
                  } finally {
                    setIsDeletingClient(false);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingClient ? 'Excluindo...' : 'Sim, Excluir Cliente'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
