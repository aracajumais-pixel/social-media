import React from 'react';
import { ClientProject, UserRole } from '../types';
import { UserCheck, Shield, Sparkles, Building, MessageSquare, HardDrive, Eye, Search, X } from 'lucide-react';

interface HeaderProps {
  clients: ClientProject[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  currentUserRole: UserRole;
  onChangeUserRole: (role: UserRole) => void;
  onOpenWhatsAppModal: () => void;
  onOpenDriveModal: () => void;
  onOpenAddClientModal?: () => void;
  onOpenClientCard?: () => void;
  unreadNotificationsCount: number;
  socialMedias?: import('../types').SocialMediaUser[];
  activeSocialMediaId?: string;
  onSelectSocialMedia?: (smId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  currentUserRole,
  onChangeUserRole,
  onOpenWhatsAppModal,
  onOpenDriveModal,
  onOpenAddClientModal,
  onOpenClientCard,
  unreadNotificationsCount,
  socialMedias = [],
  activeSocialMediaId,
  onSelectSocialMedia,
  searchQuery = '',
  onSearchChange
}) => {
  const urlSmParam =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('sm')
      : null;

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const validSelectedClientId = selectedClient ? selectedClient.id : '';
  const targetSmId =
    currentUserRole === 'social_media'
      ? activeSocialMediaId
      : (urlSmParam || selectedClient?.assignedSocialMediaId || (selectedClient as any)?.createdBySocialMediaId);
  const linkedSm = targetSmId ? socialMedias.find(sm => sm.id === targetSmId) : undefined;

  const isClientLinkAccess =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).has('client') ||
      new URLSearchParams(window.location.search).has('token') ||
      new URLSearchParams(window.location.search).has('approvalToken') ||
      /^\/(p|mural)\/[^/]+/i.test(window.location.pathname));

  const isClientView = currentUserRole === 'cliente';

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2.5 lg:gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="shrink-0">
              <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight whitespace-nowrap">
                Social Media 5.0
              </h1>
              {!isClientView && (
                <p className="text-[11px] text-slate-400 font-medium whitespace-nowrap hidden xl:block">
                  Gestão & Aprovação Inteligente
                </p>
              )}
            </div>

            {/* Na visão do Cliente: exibe Cliente E Social Media vinculados no topo */}
            {isClientView && (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-xs shrink-0">
                  <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300/80 hidden lg:inline">Cliente:</span>
                  <span className="font-bold text-white truncate max-w-[140px] lg:max-w-[200px]">
                    {selectedClient?.name || 'Não identificado'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-purple-950/60 border border-purple-500/40 rounded-xl px-2.5 py-1.5 text-xs shrink-0">
                  <UserCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-purple-300/80 hidden lg:inline">Social Media:</span>
                  <span className="font-bold text-white truncate max-w-[130px] lg:max-w-[180px]">
                    {linkedSm?.name || 'Não vinculado'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Campo de Busca no topo (na visão do Cliente, entre Social Media 5.0 e o ícone de Cliente) */}
          {isClientView && onSearchChange && (
            <div className="hidden md:flex flex-1 max-w-sm mx-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por título ou legenda..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-950/90 text-xs text-white pl-9 pr-8 py-2 rounded-full border border-slate-700/80 focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  title="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Client Selector Dropdown (apenas para Gestor e Social Media) */}
          {!isClientView && (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5 min-w-0">
              <Building className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs text-slate-400 font-medium shrink-0">Cliente:</span>
              <select
                value={validSelectedClientId}
                onChange={(e) => onSelectClient(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none cursor-pointer pr-1 max-w-[190px] lg:max-w-[230px] truncate"
              >
                {clients.length === 0 ? (
                  <option value="" disabled className="bg-slate-900 text-slate-400">
                    Nenhum cliente vinculado
                  </option>
                ) : (
                  clients.map(client => {
                    const assignedSm = socialMedias.find(sm => sm.id === (client.assignedSocialMediaId || (client as any).createdBySocialMediaId));
                    return (
                      <option key={client.id} value={client.id} className="bg-slate-900 text-slate-200">
                        {client.name} {assignedSm ? `• (SM: ${assignedSm.name})` : ''}
                      </option>
                    );
                  })
                )}
              </select>

              {clients.length === 0 && onOpenAddClientModal && (
                <button
                  type="button"
                  onClick={onOpenAddClientModal}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-all shrink-0"
                  title="Cadastrar ou vincular um cliente a este Social Media"
                >
                  + Cadastrar
                </button>
              )}

              {/* Botão de Abrir Card de Dados Cadastrados do Cliente */}
              {onOpenClientCard && selectedClient && (
                <button
                  type="button"
                  onClick={onOpenClientCard}
                  className="p-1 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-indigo-500/30 px-2 py-0.5 shrink-0"
                  title="Abrir Card com Dados Cadastrados do Cliente"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] hidden xl:inline">Dados</span>
                </button>
              )}
            </div>
          )}

          {/* User Role Switcher & Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Google Drive Link (Oculto para Cliente) */}
            {!isClientView && (
              <button
                onClick={onOpenDriveModal}
                title="Central do Google Drive"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors"
              >
                <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden xl:inline">Drive do Cliente</span>
              </button>
            )}

            {/* WhatsApp Notification Trigger (Oculto para Cliente) */}
            {!isClientView && (
              <button
                onClick={onOpenWhatsAppModal}
                title="Notificações WhatsApp"
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden lg:inline">WhatsApp</span>
                {unreadNotificationsCount > 0 && (
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Role Switcher (Sempre oculto quando acessado por link direto de cliente) */}
            {!isClientLinkAccess && (
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => onChangeUserRole('gestor')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    currentUserRole === 'gestor'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Visão do Interlocutor / Gestor de Contas"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Gestor</span>
                </button>

                <button
                  onClick={() => onChangeUserRole('social_media')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    currentUserRole === 'social_media'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Visão do Criador de Conteúdo"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Social Media</span>
                </button>

                <button
                  onClick={() => onChangeUserRole('cliente')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    currentUserRole === 'cliente'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Visão Simplificada do Cliente"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Cliente</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Mobile Identity + Search Bar (apenas para Cliente) */}
        {isClientView && (
          <div className="md:hidden py-2 border-t border-slate-800/80 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <div className="flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/40 rounded-lg px-2 py-1">
                <Building className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-emerald-300/80">Cliente:</span>
                <strong className="text-white truncate max-w-[140px]">
                  {selectedClient?.name || 'Não identificado'}
                </strong>
              </div>
              <div className="flex items-center gap-1 bg-purple-950/60 border border-purple-500/40 rounded-lg px-2 py-1">
                <UserCheck className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="text-purple-300/80">SM:</span>
                <strong className="text-white truncate max-w-[130px]">
                  {linkedSm?.name || 'Não vinculado'}
                </strong>
              </div>
            </div>

            {onSearchChange && (
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por título ou palavra-chave da legenda..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white pl-9 pr-8 py-1.5 rounded-full border border-slate-700/80 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    title="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Client Select Bar (apenas para Gestor e Social Media) */}
        {!isClientView && (
          <div className="md:hidden py-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-slate-400">Cliente:</span>
              <select
                value={validSelectedClientId}
                onChange={(e) => onSelectClient(e.target.value)}
                className="bg-slate-800 text-xs font-semibold text-white rounded-lg px-2 py-1 focus:outline-none max-w-[180px]"
              >
                {clients.length === 0 ? (
                  <option value="" disabled>
                    Nenhum cliente vinculado
                  </option>
                ) : (
                  clients.map(client => {
                    const assignedSm = socialMedias.find(sm => sm.id === (client.assignedSocialMediaId || (client as any).createdBySocialMediaId));
                    return (
                      <option key={client.id} value={client.id}>
                        {client.name} {assignedSm ? `• (${assignedSm.name})` : ''}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
