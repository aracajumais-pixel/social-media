import React, { useState, useEffect } from 'react';
import { ClientProject, UserRole, SocialNetwork, SocialMediaUser } from '../types';
import { Building, ShieldCheck, DollarSign, Save, Phone, Mail, HardDrive, Image as ImageIcon, Share2, Search, Plus, Edit3, X, Check, Users } from 'lucide-react';
import { DriveImage } from './DriveImage';
import { getEmbeddableMediaUrl } from '../utils/driveHelper';

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
  const [formData, setFormData] = useState<ClientProject>(client);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Client Modal State
  const [isAddingClientModal, setIsAddingClientModal] = useState(false);
  const [newClientSavedSuccess, setNewClientSavedSuccess] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
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
    assignedSocialMediaId: socialMedias[0]?.id || ''
  });

  // Keep formData in sync if active client prop changes
  useEffect(() => {
    setFormData(client);
  }, [client]);

  const handleCorrectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClient(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleToggleNetwork = (network: SocialNetwork) => {
    const current = formData.activeSocialNetworks || [];
    if (current.includes(network)) {
      if (current.length === 1) return; // manter ao menos 1
      setFormData({ ...formData, activeSocialNetworks: current.filter(n => n !== network) });
    } else {
      setFormData({ ...formData, activeSocialNetworks: [...current, network] });
    }
  };

  const handleCreateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.name.trim()) return;

    const created: ClientProject = {
      id: `client-${Date.now()}`,
      name: newClientForm.name.trim(),
      companyName: newClientForm.companyName.trim() || newClientForm.name.trim(),
      cnpj: newClientForm.cnpj.trim() || '00.000.000/0001-00',
      address: newClientForm.address.trim() || 'Endereço Comercial',
      contactName: newClientForm.contactName.trim() || 'Contato Principal',
      whatsappNumber: newClientForm.whatsappNumber.trim() || '5511999998888',
      email: newClientForm.email.trim() || 'contato@cliente.com',
      pricePerPost: Number(newClientForm.pricePerPost) || 150,
      metricsAccess: 'ambos',
      googleDriveFolderUrl: newClientForm.googleDriveFolderUrl.trim(),
      logoUrl: newClientForm.logoUrl.trim(),
      activeSocialNetworks: ['instagram', 'facebook'],
      assignedSocialMediaId: newClientForm.assignedSocialMediaId || undefined,
      status: 'ativo',
      driveStorageUsedGB: 0.5,
      driveStorageLimitGB: 15.0
    };

    if (onAddClient) {
      onAddClient(created);
    }

    setNewClientSavedSuccess(true);
  };

  const handleCloseNewClientModal = () => {
    setIsAddingClientModal(false);
    setNewClientSavedSuccess(false);
    setNewClientForm({
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
      assignedSocialMediaId: socialMedias[0]?.id || ''
    });
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.contactName && c.contactName.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.cnpj && c.cnpj.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* SEÇÃO SUPERIOR: TÍTULO, BARRA DE BUSCA DE CLIENTES E BOTÃO NOVO CLIENTE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        
        {/* Header do Módulo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Building className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Clientes</h2>
              <p className="text-xs text-slate-400">Gerenciamento, busca, cadastro e correção de informações de clientes</p>
            </div>
          </div>

          <button
            onClick={() => {
              setNewClientSavedSuccess(false);
              setIsAddingClientModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Cliente</span>
          </button>
        </div>

        {/* 3. CAMPO DE BUSCA DE CLIENTES NO TOPO */}
        <div className="space-y-3 pt-1">
          <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Search className="w-4 h-4 text-indigo-400" /> Buscar Cliente:
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              Exibindo {filteredClients.length} de {clients.length} cliente(s)
            </span>
          </label>

          <div className="relative">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Digite o nome do cliente, razão social, e-mail, contato ou CNPJ para buscar..."
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

          {/* Resultado da Busca / Lista Rápida de Clientes */}
          {filteredClients.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2 max-h-40 overflow-y-auto no-scrollbar">
              {filteredClients.map(c => {
                const isSelected = c.id === formData.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (onSelectClient) onSelectClient(c.id);
                      setFormData(c);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <Building className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                    <span>{c.name}</span>
                    <Edit3 className={`w-3 h-3 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 text-center">
              Nenhum cliente encontrado com "{searchQuery}".
            </div>
          )}
        </div>

      </div>

      {/* PAINEL DE CORREÇÃO DE INFORMAÇÕES DO CLIENTE SELECIONADO */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <span>Dados do Cliente: <span className="text-indigo-300 font-extrabold">{formData.name}</span></span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Altere os campos abaixo e clique no botão para corrigir e salvar as informações</p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3.5 py-2 rounded-xl border border-emerald-800/60 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Informações Corrigidas e Salvas!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleCorrectSubmit} className="space-y-5 text-xs">
          
          {/* Logomarca */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-slate-300 font-bold flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-400" /> Logomarca da Empresa Cliente (Para Recibos PDF):
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {formData.logoUrl ? (
                <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-800 shrink-0 overflow-hidden relative">
                  <DriveImage
                    src={formData.logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-900 border border-dashed border-slate-800 flex items-center justify-center text-slate-600 shrink-0 text-[10px] font-bold">
                  Sem Logo
                </div>
              )}
              <div className="flex-1 w-full space-y-2">
                <input
                  type="url"
                  value={formData.logoUrl || ''}
                  onChange={(e) => {
                    const rawUrl = e.target.value;
                    const converted = rawUrl.trim() ? getEmbeddableMediaUrl(rawUrl) : rawUrl;
                    setFormData({ ...formData, logoUrl: converted });
                  }}
                  className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                  placeholder="https://drive.google.com/file/d/... ou https://lh3.googleusercontent.com/d/..."
                />
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>✨ <strong>Tratamento Automático:</strong> Links do Google Drive são convertidos na URL direta de alta resolução para recibos e prévias.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Dados Principais do Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Nome Fantasia do Cliente *:</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Razão Social (Para Recibo PDF) *:</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">CNPJ / CPF do Cliente *:</label>
              <input
                type="text"
                required
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Endereço Comercial Completo:</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Seleção de Redes Sociais Ativas */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-slate-300 font-bold flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-purple-400" /> Redes Sociais Ativas do Cliente:
            </label>
            <p className="text-[11px] text-slate-400">Marque apenas as redes sociais ativas no contrato de gestão:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {ALL_NETWORKS.map(net => {
                const isActive = (formData.activeSocialNetworks || []).includes(net.id);
                return (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => handleToggleNetwork(net.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      isActive 
                        ? 'bg-purple-600 text-white border border-purple-400 shadow-md shadow-purple-600/20' 
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span>{net.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contatos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Nome do Contato Principal *:</label>
              <input
                type="text"
                required
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp (Com DDD) *:
              </label>
              <input
                type="text"
                required
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-400" /> E-mail do Cliente:
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Valor por Post & Permissões */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Valor Base por Post (R$):
              </label>
              <input
                type="number"
                value={formData.pricePerPost}
                onChange={(e) => setFormData({ ...formData, pricePerPost: Number(e.target.value) })}
                className="w-full bg-slate-950 text-amber-300 font-bold p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Permissão de Acesso às Métricas:
              </label>
              <select
                value={formData.metricsAccess}
                onChange={(e) => setFormData({ ...formData, metricsAccess: e.target.value as any })}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="cliente">Somente o Cliente visualiza as métricas</option>
                <option value="social_media">Somente o Social Media visualiza as métricas</option>
                <option value="ambos">Ambos (Cliente & Social Media visualizam)</option>
                <option value="gestor_apenas">Apenas o Gestor de Contas visualiza</option>
              </select>
            </div>
          </div>

          {/* Pasta Google Drive */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> URL da Pasta do Cliente no Google Drive:
            </label>
            <input
              type="url"
              value={formData.googleDriveFolderUrl || ''}
              onChange={(e) => setFormData({ ...formData, googleDriveFolderUrl: e.target.value })}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono text-xs"
              placeholder="https://drive.google.com/drive/folders/..."
            />
          </div>

          {/* 1. BOTÃO PARA CORRIGIR INFORMAÇÕES DO CLIENTE */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              * Atualização em tempo real para recibos e acompanhamento do projeto
            </span>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Edit3 className="w-4 h-4 text-white" />
              <span>Corrigir Informações do Cliente</span>
            </button>
          </div>

        </form>

      </div>

      {/* MODAL: CADASTRO DE CLIENTE (FEITO PELO SOCIAL MEDIA OU GESTOR) COM OPÇÃO DE FECHAR */}
      {isAddingClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl my-8 relative">
            
            {/* Header com Botão Fechar ✕ */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cadastrar Novo Cliente</h3>
                  <p className="text-xs text-slate-400">Cadastro realizado diretamente pelo Social Media ou Gestor</p>
                </div>
              </div>

              {/* Botão de Fechar no Canto Superior */}
              <button
                type="button"
                onClick={handleCloseNewClientModal}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. CONFIRMAÇÃO COM BOTÃO DE FECHAR APÓS SALVAR */}
            {newClientSavedSuccess ? (
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/40">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Cliente Cadastrado com Sucesso!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    O novo cliente <strong className="text-emerald-400">{newClientForm.name}</strong> já está disponível para criação de posts e recibos.
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseNewClientModal}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    Fechar Janela
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateClientSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nome Fantasia do Cliente *:</label>
                  <input
                    type="text"
                    required
                    value={newClientForm.name}
                    onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                    placeholder="Ex: Padaria Solar"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Razão Social:</label>
                    <input
                      type="text"
                      value={newClientForm.companyName}
                      onChange={(e) => setNewClientForm({ ...newClientForm, companyName: e.target.value })}
                      placeholder="Ex: Solar Alimentos LTDA"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">CNPJ / CPF:</label>
                    <input
                      type="text"
                      value={newClientForm.cnpj}
                      onChange={(e) => setNewClientForm({ ...newClientForm, cnpj: e.target.value })}
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
                      value={newClientForm.contactName}
                      onChange={(e) => setNewClientForm({ ...newClientForm, contactName: e.target.value })}
                      placeholder="Ex: Carlos Silva"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">WhatsApp (com DDD):</label>
                    <input
                      type="text"
                      value={newClientForm.whatsappNumber}
                      onChange={(e) => setNewClientForm({ ...newClientForm, whatsappNumber: e.target.value })}
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
                      value={newClientForm.email}
                      onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                      placeholder="contato@cliente.com"
                      className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Valor/Post (R$):</label>
                    <input
                      type="number"
                      value={newClientForm.pricePerPost}
                      onChange={(e) => setNewClientForm({ ...newClientForm, pricePerPost: Number(e.target.value) })}
                      className="w-full bg-slate-950 text-amber-300 font-bold p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Link da Logomarca (Drive ou URL):</label>
                  <input
                    type="url"
                    value={newClientForm.logoUrl}
                    onChange={(e) => setNewClientForm({ ...newClientForm, logoUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/d/... ou https://..."
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">URL Pasta Google Drive:</label>
                  <input
                    type="url"
                    value={newClientForm.googleDriveFolderUrl}
                    onChange={(e) => setNewClientForm({ ...newClientForm, googleDriveFolderUrl: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono text-[11px]"
                  />
                </div>

                {/* BOTÕES DO FORMULÁRIO COM A OPÇÃO DE FECHAR */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseNewClientModal}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-bold text-xs transition-all"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    Salvar Novo Cliente
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
