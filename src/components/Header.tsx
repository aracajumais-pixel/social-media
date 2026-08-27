import React from 'react';
import { ClientProject, UserRole } from '../types';
import { UserCheck, Shield, Sparkles, Building, HardDrive, Plus } from 'lucide-react';

interface HeaderProps {
  clients: ClientProject[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  currentUserRole: UserRole;
  onChangeUserRole: (role: UserRole) => void;
  onOpenDriveModal: () => void;
  onOpenAddClientModal?: () => void;
  unreadNotificationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  currentUserRole,
  onChangeUserRole,
  onOpenDriveModal,
  onOpenAddClientModal,
  unreadNotificationsCount
}) => {
  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
                Social Media 5.0
              </h1>
              <p className="text-xs text-slate-400 font-medium">Gestão & Aprovação Inteligente</p>
            </div>
          </div>

          {/* Client Selector Dropdown */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5">
            <Building className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-400 font-medium">Cliente:</span>
            <select
              value={selectedClientId}
              onChange={(e) => onSelectClient(e.target.value)}
              className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-2"
            >
              {clients.map(client => (
                <option key={client.id} value={client.id} className="bg-slate-900 text-slate-200">
                  {client.name}
                </option>
              ))}
            </select>
            {onOpenAddClientModal && (currentUserRole === 'gestor' || currentUserRole === 'social_media') && (
              <button
                onClick={onOpenAddClientModal}
                className="ml-1 p-1 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-indigo-500/30 px-2 py-0.5"
                title="Cadastrar Novo Cliente"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px]">+ Novo</span>
              </button>
            )}
          </div>

          {/* User Role Switcher & Action Buttons */}
          <div className="flex items-center gap-3">
            
            {/* Google Drive Link */}
            <button
              onClick={onOpenDriveModal}
              title="Central do Google Drive"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors"
            >
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Drive do Cliente</span>
            </button>

            {/* WhatsApp button removido daqui — agora fica dentro do PostDetailModal, já contextualizado com o post */}

            {/* Role Switcher */}
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

          </div>

        </div>

        {/* Mobile Client Select Bar */}
        <div className="md:hidden py-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Cliente ativo:</span>
          <select
            value={selectedClientId}
            onChange={(e) => onSelectClient(e.target.value)}
            className="bg-slate-800 text-xs font-semibold text-white rounded-lg px-2 py-1 focus:outline-none"
          >
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

      </div>
    </header>
  );
};
