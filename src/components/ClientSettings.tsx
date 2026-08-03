import React, { useState } from 'react';
import { ClientProject, UserRole, SocialNetwork } from '../types';
import { Building, ShieldCheck, DollarSign, Save, Phone, Mail, HardDrive, Image as ImageIcon, Share2 } from 'lucide-react';

interface ClientSettingsProps {
  client: ClientProject;
  currentUserRole: UserRole;
  onUpdateClient: (updated: ClientProject) => void;
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
  currentUserRole,
  onUpdateClient
}) => {
  const [formData, setFormData] = useState<ClientProject>(client);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClient(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl max-w-4xl mx-auto">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <Building className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Configurações e Cadastro do Cliente</h2>
            <p className="text-xs text-slate-400">Logomarca para recibos PDF, contatos, redes sociais ativas e permissões</p>
          </div>
        </div>

        {savedSuccess && (
          <span className="text-xs text-emerald-400 font-bold bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800/40">
            Configurações Salvas!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        
        {/* Logo URL & Preview */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <label className="block text-slate-300 font-bold flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-indigo-400" /> Logomarca da Empresa Cliente (Para Inserir no Recibo PDF):
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt="Logo preview"
                className="w-20 h-20 rounded-xl object-contain bg-slate-900 p-2 border border-slate-800 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-900 border border-dashed border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                Sem Logo
              </div>
            )}
            <div className="flex-1 w-full space-y-2">
              <input
                type="url"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
                placeholder="https://exemplo.com/logo-empresa.png"
              />
              <p className="text-[10px] text-slate-400">
                A imagem da logomarca será estampará o cabeçalho oficial do Recibo de Pagamento em PDF.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Client Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Nome Fantasia do Cliente:</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Razão Social (Para Recibo PDF):</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">CNPJ da Empresa Cliente:</label>
            <input
              type="text"
              required
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Endereço Completo:</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Selection of Active Social Networks */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <label className="block text-slate-300 font-bold flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-purple-400" /> Redes Sociais Ativas que o Cliente Utiliza:
          </label>
          <p className="text-[11px] text-slate-400">Nem todos os clientes utilizam todas as redes. Marque apenas as redes ativas do contrato:</p>
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

        {/* Contacts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Nome do Contato Principal:</label>
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
              <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp (Com DDD):
            </label>
            <input
              type="text"
              required
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
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

        {/* Pricing & Permissions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Valor Base por Post (R$):
            </label>
            <input
              type="number"
              value={formData.pricePerPost}
              onChange={(e) => setFormData({ ...formData, pricePerPost: Number(e.target.value) })}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Permissão das Métricas:
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

        {/* Google Drive Link */}
        <div>
          <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> URL da Pasta Principal no Google Drive:
          </label>
          <input
            type="url"
            value={formData.googleDriveFolderUrl || ''}
            onChange={(e) => setFormData({ ...formData, googleDriveFolderUrl: e.target.value })}
            className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
            placeholder="https://drive.google.com/drive/folders/..."
          />
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>

      </form>

    </div>
  );
};

