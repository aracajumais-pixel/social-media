import React from 'react';
import { ClientProject, UserRole, SocialMediaUser } from '../types';
import { 
  Building2, X, Phone, Mail, MapPin, DollarSign, ExternalLink, 
  HardDrive, Share2, UserCheck, Shield, CheckCircle2, MessageSquare, 
  Calendar, FileText, Sparkles, Edit3, Globe
} from 'lucide-react';
import { openWhatsAppDirect } from '../utils/whatsappHelper';

interface ClientDetailsCardModalProps {
  client: ClientProject | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  socialMedias?: SocialMediaUser[];
  onEditClient?: (client: ClientProject) => void;
}

export const ClientDetailsCardModal: React.FC<ClientDetailsCardModalProps> = ({
  client,
  isOpen,
  onClose,
  currentUserRole,
  socialMedias = [],
  onEditClient
}) => {
  if (!isOpen || !client) return null;

  const assignedSm = socialMedias.find(sm => sm.id === (client.assignedSocialMediaId || (client as any).createdBySocialMediaId));

  const networkColors: Record<string, string> = {
    instagram: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    facebook: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    tiktok: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    linkedin: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    youtube: 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  const handleOpenWhatsApp = () => {
    if (client.whatsappNumber) {
      openWhatsAppDirect(client.whatsappNumber, `Olá ${client.contactName || client.name}! Estamos entrando em contato pelo sistema Social Media 5.0.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 text-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header com Logo e Identificação */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/80 to-purple-950/80 border-b border-slate-800 p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
              {client.logoUrl ? (
                <img src={client.logoUrl} alt={client.name} className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 className="w-8 h-8 text-indigo-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {client.status === 'bloqueado' ? 'Cliente Bloqueado' : 'Cliente Ativo'}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {client.id}</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1 leading-tight">{client.name}</h2>
              {client.companyName && client.companyName !== client.name && (
                <p className="text-xs text-slate-300 font-medium">{client.companyName}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
            title="Fechar card"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Card com Dados Cadastrados */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Seção 1: Dados Fiscais e Cadastrais */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <Building2 className="w-3.5 h-3.5" />
              Dados Empresariais e Fiscais
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">Nome Fantasia:</span>
                <strong className="text-white text-xs">{client.name || 'Não informado'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">Razão Social:</span>
                <strong className="text-white text-xs">{client.companyName || 'Não informada'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">CNPJ / CPF:</span>
                <strong className="text-white font-mono text-xs">{client.cnpj || 'Não informado'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">Valor Contratado por Post:</span>
                <strong className="text-emerald-400 font-bold text-xs">
                  {client.pricePerPost ? `R$ ${Number(client.pricePerPost).toFixed(2)}` : 'R$ 150,00'}
                </strong>
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço Completo */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Endereço Cadastrado
            </h3>
            <div className="text-slate-300 space-y-1">
              <p className="text-xs font-medium text-white">
                {client.address || (
                  [
                    client.street && `${client.street}${client.number ? `, ${client.number}` : ''}`,
                    client.complement,
                    client.neighborhood,
                    client.city && `${client.city}${client.state ? `/${client.state}` : ''}`,
                    client.cep && `CEP: ${client.cep}`
                  ].filter(Boolean).join(' - ') || 'Endereço não cadastrado'
                )}
              </p>
              {client.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline font-semibold mt-1"
                >
                  <Globe className="w-3 h-3" />
                  Ver localização no Google Maps
                </a>
              )}
            </div>
          </div>

          {/* Seção 3: Contato Principal */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Contato Principal & Atendimento
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">Responsável / Contato:</span>
                <strong className="text-white text-xs">{client.contactName || 'Contato Principal'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">E-mail:</span>
                <a 
                  href={`mailto:${client.email}`}
                  className="text-indigo-300 hover:text-indigo-200 underline font-medium"
                >
                  {client.email || 'Não informado'}
                </a>
              </div>
              <div className="sm:col-span-2 flex items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold">WhatsApp para Notificações & Aprovações:</span>
                  <span className="text-white font-mono font-bold text-xs">{client.whatsappNumber || 'Não cadastrado'}</span>
                </div>
                {client.whatsappNumber && (
                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Abrir Conversa WhatsApp
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Seção 4: Social Media Responsável & Redes Sociais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Social Media Responsável */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                <UserCheck className="w-3.5 h-3.5" />
                Social Media Responsável
              </h3>
              {assignedSm ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2.5">
                    {assignedSm.avatarUrl ? (
                      <img src={assignedSm.avatarUrl} alt={assignedSm.name} className="w-9 h-9 rounded-xl object-cover border border-purple-500/30" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
                        {assignedSm.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <strong className="block text-white text-xs">{assignedSm.name}</strong>
                      <span className="text-[11px] text-slate-400">{assignedSm.companyName || 'Social Media Profissional'}</span>
                    </div>
                  </div>
                  {assignedSm.whatsapp && (
                    <div className="text-[11px] text-slate-300 pt-1">
                      <span className="text-slate-500 font-semibold">WhatsApp: </span>
                      <span className="text-emerald-400 font-mono">{assignedSm.whatsapp}</span>
                    </div>
                  )}
                  {assignedSm.email && (
                    <div className="text-[11px] text-slate-300">
                      <span className="text-slate-500 font-semibold">E-mail: </span>
                      <span className="text-slate-300">{assignedSm.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic pt-1">Nenhum social media atribuído especificamente.</p>
              )}
            </div>

            {/* Redes Sociais Ativas */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                <Share2 className="w-3.5 h-3.5" />
                Redes Sociais Ativas
              </h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(client.activeSocialNetworks && client.activeSocialNetworks.length > 0) ? (
                  client.activeSocialNetworks.map(net => (
                    <span 
                      key={net}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border capitalize ${networkColors[net] || 'bg-slate-800 text-slate-300 border-slate-700'}`}
                    >
                      {net}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Nenhuma rede cadastrada</span>
                )}
              </div>

              <div className="pt-2 text-[11px] text-slate-400">
                <span className="text-slate-500 font-semibold">Visibilidade de Métricas: </span>
                <span className="text-indigo-300 font-bold capitalize">{client.metricsAccess || 'Ambos'}</span>
              </div>
            </div>

          </div>

          {/* Seção 5: Google Drive Folder */}
          {client.googleDriveFolderUrl && (
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pasta Oficial de Arquivos (Google Drive):</span>
                  <p className="text-xs text-white font-mono truncate max-w-sm">{client.googleDriveFolderUrl}</p>
                </div>
              </div>
              <a
                href={client.googleDriveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
              >
                <span>Acessar Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Seção 6: Informações Adicionais */}
          {client.additionalInfo && (
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                <FileText className="w-3.5 h-3.5" />
                Informações Adicionais / Orientações do Cliente
              </h3>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed pt-1">
                {client.additionalInfo}
              </p>
            </div>
          )}

        </div>

        {/* Rodapé com Ações */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 px-6 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Social Media 5.0 • Cadastro de Cliente
          </div>

          <div className="flex items-center gap-2">
            {(currentUserRole === 'gestor' || currentUserRole === 'social_media') && onEditClient && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditClient(client);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Dados do Cliente</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
