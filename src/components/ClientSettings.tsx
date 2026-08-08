import React, { useState, useEffect } from 'react';
import { ClientProject, UserRole, SocialNetwork, SocialMediaUser } from '../types';
import { Building, Phone, Mail, HardDrive, Image as ImageIcon, Share2, Search, Plus, Edit3, X, Check, Sparkles } from 'lucide-react';
import { DriveImage } from './DriveImage';
import { getEmbeddableMediaUrl } from '../utils/driveHelper';
import { searchClientsInSupabase } from '../lib/supabase';

interface ClientSettingsProps {
  client: ClientProject;
  clients?: ClientProject[];
  onSelectClient?: (clientId: string) => void;
  currentUserRole: UserRole;
  onUpdateClient: (updated: ClientProject) => void;
  onAddClient?: (newClient: ClientProject) => void;
  socialMedias?: SocialMediaUser[];
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
  socialMedias = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [supabaseSearchResults, setSupabaseSearchResults] = useState<ClientProject[] | null>(null);
  const [isSearchingSupabase, setIsSearchingSupabase] = useState(false);
  const [lastEditedClientId, setLastEditedClientId] = useState<string>(() => {
    return localStorage.getItem('last_edited_client_id') || client.id || '';
  });

  // Modal state (used for BOTH adding new client AND editing an existing client)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProject | null>(null); // null = new mode, ClientProject = edit mode
  const [savedSuccess, setSavedSuccess] = useState(false);

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

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all shrink-0 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Cliente</span>
          </button>
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

                    <div className="flex items-center gap-2 shrink-0">
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

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Link da Logomarca (Drive ou URL):</label>
                  <input
                    type="url"
                    value={modalForm.logoUrl}
                    onChange={(e) => {
                      const converted = e.target.value.trim() ? getEmbeddableMediaUrl(e.target.value) : e.target.value;
                      setModalForm({ ...modalForm, logoUrl: converted });
                    }}
                    placeholder="https://drive.google.com/file/d/... ou https://..."
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">URL Pasta Google Drive:</label>
                  <input
                    type="url"
                    value={modalForm.googleDriveFolderUrl}
                    onChange={(e) => setModalForm({ ...modalForm, googleDriveFolderUrl: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono text-[11px]"
                  />
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
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
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
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
