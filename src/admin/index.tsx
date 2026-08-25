import React, { useState } from 'react';
import { ClientProject, PostItem, BillingReceipt, SocialMediaUser, SaaSPaymentProof } from '../types';
import { 
  ShieldAlert, DollarSign, TrendingUp, Users, HardDrive, 
  CheckCircle2, Plus, Sparkles, ExternalLink, Trash2, Mail, Phone, AlertTriangle, Layers,
  Lock, Unlock, Edit3, Code2, History, BookOpen, FileSpreadsheet, BarChart2, CheckSquare, Clock, Upload, Check, X,
  MessageSquare, Send, MousePointerClick, Database
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart, Line, Area 
} from 'recharts';
import { 
  getSupabaseCredentials, saveSupabaseCredentials, testSupabaseConnection, 
  syncAllClientsToSupabase, syncAllPostsToSupabase, syncSocialMediaToSupabase 
} from '../lib/supabase';

import { AdminTabSharedProps } from '../admin/types';
import { FinanceTab } from '../admin/FinanceTab';
import { WhatsAppTab } from '../admin/WhatsAppTab';
import { SocialMediasTab } from '../admin/SocialMediasTab';
import { ClientsTab } from '../admin/ClientsTab';
import { CodeEvolutionTab } from '../admin/CodeEvolutionTab';
interface AdminSaaSDashboardProps {
  clients: ClientProject[];
  posts: PostItem[];
  receipts: BillingReceipt[];
  socialMedias: SocialMediaUser[];
  saasProofs?: SaaSPaymentProof[];
  onAddSocialMedia: (newSm: Omit<SocialMediaUser, 'id' | 'totalPostsCreated'>) => void;
  onDeleteSocialMedia: (id: string) => void;
  onToggleBlockSocialMedia: (smId: string) => void;
  onUpdateSocialMediaFee?: (smId: string, customFeePerPost?: number) => void;
  onToggleBlockClient: (clientId: string) => void;
  onAddClient?: (newClient: ClientProject) => void;
  feePerPost: number;
  onUpdateFeePerPost: (newFee: number) => void;
  onAddSaasProof?: (newProof: Omit<SaaSPaymentProof, 'id' | 'submittedAt' | 'status'>) => void;
  onUpdateSaasProofStatus?: (proofId: string, status: 'aprovado' | 'rejeitado') => void;
  onNavigateTab?: (tab: 'book' | 'market') => void;
}

export const AdminSaaSDashboard: React.FC<AdminSaaSDashboardProps> = ({
  clients,
  posts,
  receipts,
  socialMedias,
  saasProofs = [],
  onAddSocialMedia,
  onDeleteSocialMedia,
  onToggleBlockSocialMedia,
  onUpdateSocialMediaFee,
  onToggleBlockClient,
  onAddClient,
  feePerPost,
  onUpdateFeePerPost,
  onAddSaasProof,
  onUpdateSaasProofStatus,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'finance' | 'whatsapp' | 'social_medias' | 'clients' | 'code_evolution'>('finance');
  const [isEditingFeeModal, setIsEditingFeeModal] = useState(false);
  const [tempFeeInput, setTempFeeInput] = useState(feePerPost.toString());

  // Usados no cabeçalho fixo (fora das abas)
  const totalReceiptItemsPostsCount = receipts.reduce((acc, r) => {
    const postCount = r.items.reduce((sum, item) => sum + item.quantity, 0);
    return acc + postCount;
  }, 0);
  const totalSaaSRevenue = receipts.reduce((acc, r) => {
    const client = clients.find(c => c.id === r.clientProjectId);
    const sm = socialMedias.find(s => s.assignedClientIds.includes(r.clientProjectId) || s.id === client?.assignedSocialMediaId);
    const rate = sm?.customFeePerPost !== undefined ? sm.customFeePerPost : feePerPost;
    const postCount = r.items.reduce((sum, item) => sum + item.quantity, 0);
    return acc + (postCount * rate);
  }, 0);

  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(tempFeeInput.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateFeePerPost(parsed);
      setIsEditingFeeModal(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Confidential SaaS Founder Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>PAINEL SIGILOSO DO GESTOR SAAS (Acesso Restrito)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gestão de Licenciamento & Auditoria de Postagens
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monetização da Infraestrutura: Taxa de <span className="text-emerald-400 font-extrabold font-mono">R$ {feePerPost.toFixed(2)} por postagem</span> em cada recibo emitido. Restrito exclusivamente ao perfil do Gestor.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Value Config Box */}
            <div className="bg-slate-950/90 border border-emerald-500/40 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between gap-2">
                  <span>Taxa por Post (Editável)</span>
                  <button
                    onClick={() => {
                      setTempFeeInput(feePerPost.toString());
                      setIsEditingFeeModal(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5 text-[10px] underline font-bold"
                  >
                    <Edit3 className="w-3 h-3" /> Editar
                  </button>
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">R$ {feePerPost.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400">Total SaaS: <strong className="text-emerald-300 font-mono">R$ {totalSaaSRevenue.toFixed(2)}</strong> ({totalReceiptItemsPostsCount} posts)</div>
              </div>
            </div>

            {/* Sub Quick Navigation */}
            {onNavigateTab && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onNavigateTab('book')}
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Livro do Projeto</span>
                </button>
                <button
                  onClick={() => onNavigateTab('market')}
                  className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                  <span>Análise de Mercado</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Internal SaaS Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('finance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'finance'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Fechamento & Status de Posts</span>
        </button>

        <button
          onClick={() => setActiveSubTab('whatsapp')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>Conversão WhatsApp x Cliques</span>
        </button>

        <button
          onClick={() => setActiveSubTab('social_medias')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'social_medias'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Social Medias ({socialMedias.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('clients')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'clients'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Auditoria por Empresa ({clients.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('code_evolution')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'code_evolution'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Evolução do Código (~5.920 Linhas)</span>
        </button>
      </div>

      {/* SUB-TAB 1: FECHAMENTO & STATUS DE POSTS */}

      {(() => {
        const sharedProps: AdminTabSharedProps = {
          clients, posts, receipts, socialMedias, saasProofs,
          onAddSocialMedia, onDeleteSocialMedia, onToggleBlockSocialMedia, onUpdateSocialMediaFee,
          onToggleBlockClient, onAddClient, feePerPost, onUpdateFeePerPost, onAddSaasProof, onUpdateSaasProofStatus, onNavigateTab
        };
        return (
          <>
            {activeSubTab === 'finance' && <FinanceTab {...sharedProps} />}
            {activeSubTab === 'whatsapp' && <WhatsAppTab {...sharedProps} />}
            {activeSubTab === 'social_medias' && <SocialMediasTab {...sharedProps} />}
            {activeSubTab === 'clients' && <ClientsTab {...sharedProps} />}
            {activeSubTab === 'code_evolution' && <CodeEvolutionTab {...sharedProps} />}
          </>
        );
      })()}

      {isEditingFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <span>Editar Taxa de Infraestrutura por Post</span>
              </h3>
              <button onClick={() => setIsEditingFeeModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveFee} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Valor da Taxa por Postagem (R$):</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  required
                  value={tempFeeInput}
                  onChange={(e) => setTempFeeInput(e.target.value)}
                  className="w-full bg-slate-950 text-emerald-400 font-bold font-mono text-lg p-3 rounded-xl border border-emerald-500/50 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Este valor será aplicado automaticamente em todos os cálculos de recibo e fechamentos de caixa de todos os Social Medias.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingFeeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg"
                >
                  Salvar Valor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
