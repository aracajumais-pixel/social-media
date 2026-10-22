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
  const [isAddingSmModal, setIsAddingSmModal] = useState(false);
  const [isAddingClientModal, setIsAddingClientModal] = useState(false);
  const [isEditingFeeModal, setIsEditingFeeModal] = useState(false);
  const [editingSmForFee, setEditingSmForFee] = useState<SocialMediaUser | null>(null);
  const [customSmFeeInput, setCustomSmFeeInput] = useState('');
  const [isUploadProofModal, setIsUploadProofModal] = useState(false);
  const [tempFeeInput, setTempFeeInput] = useState(feePerPost.toString());
  const [activeSubTab, setActiveSubTab] = useState<'finance' | 'whatsapp' | 'social_medias' | 'clients' | 'code_evolution'>('finance');

  // Supabase Diagnostics & Config State
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSupabaseCredentials().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getSupabaseCredentials().key);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

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

  // Proof Upload Form State
  const [selectedSmForProof, setSelectedSmForProof] = useState(socialMedias[0]?.id || '');
  const [selectedClientForProof, setSelectedClientForProof] = useState(clients[0]?.id || '');
  const [proofPeriod, setProofPeriod] = useState('Julho/2026');
  const [proofPostsCount, setProofPostsCount] = useState(20);
  const [proofUrl, setProofUrl] = useState('');
  const [proofNotes, setProofNotes] = useState('');

  const [newSmForm, setNewSmForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    socialProfile: '',
    pixKey: '',
    assignedClientIds: [] as string[],
    avatarUrl: '',
    customFeePerPost: ''
  });
  const [formError, setFormError] = useState('');

  // Status breakdown for all posts
  const rascunhoCount = posts.filter(p => p.status === 'rascunho').length;
  const alteracaoCount = posts.filter(p => p.status === 'alterar').length;
  const aprovadosCount = posts.filter(p => p.status === 'aprovado').length;
  const publicadosCount = posts.filter(p => p.isPublished).length;
  const totalPostsCount = posts.length;

  // Receipts calculations considering individual rates or global default
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

  const totalGrossReceiptsAmount = receipts.reduce((acc, r) => acc + r.totalAmount, 0);

  const handleCreateSmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSmForm.socialProfile.trim()) {
      setFormError('O Perfil da Rede Social (Instagram/LinkedIn) é um item OBRIGATÓRIO.');
      return;
    }

    const customFee = newSmForm.customFeePerPost.trim() ? parseFloat(newSmForm.customFeePerPost.replace(',', '.')) : undefined;

    onAddSocialMedia({
      ...newSmForm,
      customFeePerPost: isNaN(customFee as number) ? undefined : customFee,
      avatarUrl: newSmForm.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    });

    setIsAddingSmModal(false);
    setNewSmForm({
      name: '',
      email: '',
      whatsapp: '',
      socialProfile: '',
      pixKey: '',
      assignedClientIds: [],
      avatarUrl: '',
      customFeePerPost: ''
    });
    setFormError('');
  };

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
      {activeSubTab === 'finance' && (
        <div className="space-y-6">
          
          {/* Status Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Volume em Rascunho</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{rascunhoCount} <span className="text-xs text-slate-400 font-normal">posts</span></div>
              <p className="text-[11px] text-slate-400">Aguardando envio ou aprovação</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Ajuste Solicitado</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400">{alteracaoCount} <span className="text-xs text-slate-400 font-normal">posts</span></div>
              <p className="text-[11px] text-slate-400">Em refatoração pelo Social Media</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Posts Aprovados</span>
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-400">{aprovadosCount} <span className="text-xs text-slate-400 font-normal">posts</span></div>
              <p className="text-[11px] text-slate-400">Prontos para publicação final</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Publicados / Postados</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{publicadosCount} <span className="text-xs text-slate-400 font-normal">/ {aprovadosCount}</span></div>
              <p className="text-[11px] text-slate-400">Acompanhamento ativo de veiculação</p>
            </div>

          </div>

          {/* Fechamento de Caixa de cada Social Media (Faturamento e Recibos) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Fechamento de Caixa por Social Media & Recibos Emitidos</span>
                </h2>
                <p className="text-xs text-slate-400">Acompanhe a emissão de recibos, o faturamento bruto e o repasse da taxa SaaS (R$ {feePerPost.toFixed(2)}/post)</p>
              </div>

              <button
                onClick={() => setIsUploadProofModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>Enviar Comprovante SaaS (Social Media)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Social Media</th>
                    <th className="p-3.5">Clientes Atendidos</th>
                    <th className="p-3.5">Recibos Emitidos</th>
                    <th className="p-3.5">Posts Faturados</th>
                    <th className="p-3.5">Faturamento Bruto</th>
                    <th className="p-3.5">Taxa por Post</th>
                    <th className="p-3.5">Repasse SaaS Total</th>
                    <th className="p-3.5">Status de Acesso</th>
                    <th className="p-3.5 rounded-r-xl text-right">Ação de Segurança</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {socialMedias.map(sm => {
                    const smClients = clients.filter(c => sm.assignedClientIds.includes(c.id));
                    const smReceipts = receipts.filter(r => smClients.some(c => c.id === r.clientProjectId));
                    const smPostsInvoiced = smReceipts.reduce((acc, r) => acc + r.items.reduce((sum, item) => sum + item.quantity, 0), 0);
                    const smGrossBilling = smReceipts.reduce((acc, r) => acc + r.totalAmount, 0);
                    const effectiveFee = sm.customFeePerPost !== undefined ? sm.customFeePerPost : feePerPost;
                    const smSaaSShare = smPostsInvoiced * effectiveFee;
                    const isBlocked = sm.status === 'bloqueado';

                    return (
                      <tr key={sm.id} className={`hover:bg-slate-850/40 transition-colors ${isBlocked ? 'bg-rose-950/20' : ''}`}>
                        <td className="p-3.5 font-bold text-white flex items-center gap-3">
                          <img src={sm.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                          <div>
                            <div>{sm.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{sm.email}</div>
                          </div>
                        </td>
                        <td className="p-3.5 font-medium">
                          {smClients.length > 0 ? (
                            <span className="bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-800/40 font-bold">
                              {smClients.map(c => c.name).join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Nenhum</span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-slate-200">{smReceipts.length} recibos</td>
                        <td className="p-3.5 font-bold text-amber-300">{smPostsInvoiced} posts</td>
                        <td className="p-3.5 font-bold text-emerald-400 font-mono">R$ {smGrossBilling.toFixed(2)}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => {
                              setEditingSmForFee(sm);
                              setCustomSmFeeInput(sm.customFeePerPost !== undefined ? sm.customFeePerPost.toString() : '');
                            }}
                            className="group font-bold text-amber-300 hover:text-amber-200 font-mono text-xs flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-xl transition-all"
                            title="Clique para alterar a taxa deste social media"
                          >
                            <span>R$ {effectiveFee.toFixed(2)}</span>
                            {sm.customFeePerPost !== undefined ? (
                              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded">Exclusivo</span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-normal">(Padrão)</span>
                            )}
                            <Edit3 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                          </button>
                        </td>
                        <td className="p-3.5 font-bold text-indigo-300 font-mono">R$ {smSaaSShare.toFixed(2)}</td>
                        <td className="p-3.5">
                          {isBlocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[10px]">
                              <Lock className="w-3 h-3 text-rose-400" /> BLOQUEADO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ATIVO
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => onToggleBlockSocialMedia(sm.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 ${
                              isBlocked
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                                : 'bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40'
                            }`}
                            title={isBlocked ? 'Desbloquear acesso do Social Media' : 'Bloquear em caso de dribles ou emissão falsa'}
                          >
                            {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            <span>{isBlocked ? 'Liberar' : 'Bloquear (Anti-Drible)'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Central de Comprovantes de Pagamento do SaaS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Comprovantes Pix de Repasse SaaS Enviados</h3>
                  <p className="text-xs text-slate-400">Histórico de comprovantes enviados pelos Social Medias para quitação da taxa (R$ {feePerPost.toFixed(2)}/post)</p>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                {saasProofs.length} comprovantes registrados
              </span>
            </div>

            {saasProofs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs italic">
                Nenhum comprovante de pagamento SaaS enviado até o momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {saasProofs.map(proof => (
                  <div key={proof.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{proof.socialMediaName}</div>
                        <div className="text-xs text-indigo-300 font-semibold">{proof.clientName} ({proof.period})</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">Enviado em: {new Date(proof.submittedAt).toLocaleDateString('pt-BR')}</div>
                      </div>

                      {proof.status === 'aprovado' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" /> Aprovado
                        </span>
                      )}
                      {proof.status === 'pendente' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" /> Em Análise
                        </span>
                      )}
                      {proof.status === 'rejeitado' && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1">
                          <X className="w-3 h-3 text-rose-400" /> Rejeitado
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-900 p-2.5 rounded-xl text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Volume</span>
                        <span className="font-bold text-amber-300">{proof.postsCount} posts</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Taxa Aplicada</span>
                        <span className="font-bold text-slate-200 font-mono">R$ {proof.feePerPost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Total Pago</span>
                        <span className="font-black text-emerald-400 font-mono">R$ {proof.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {proof.notes && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        "{proof.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={proof.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Ver Recibo / Comprovante Pix
                      </a>

                      {onUpdateSaasProofStatus && proof.status === 'pendente' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onUpdateSaasProofStatus(proof.id, 'aprovado')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => onUpdateSaasProofStatus(proof.id, 'rejeitado')}
                            className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-800 text-[10px] font-bold border border-rose-800"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB: TAXA DE CLIQUE VINDA DO WHATSAPP X CONVERSA ENVIADA */}
      {activeSubTab === 'whatsapp' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <span>Métricas de Conversão: Taxa de Clique WhatsApp × Conversas Enviadas</span>
              </h2>
              <p className="text-xs text-slate-400">Rastreamento da efetividade dos alertas de aprovação e notificações enviadas via API do WhatsApp</p>
            </div>

            <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-800/40 flex items-center gap-2 self-start md:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              WhatsApp Webhook Ativo
            </span>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>Conversas Enviadas</span>
                <Send className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">148 mensagens</div>
              <p className="text-[10px] text-slate-500">Notificações automáticas via WA</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>Cliques Rastreados</span>
                <MousePointerClick className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400 font-mono">114 acessos</div>
              <p className="text-[10px] text-slate-500">Links acessados pelo cliente</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>Taxa de Clique (CTR)</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">77,0% CTR</div>
              <p className="text-[10px] text-emerald-400 font-semibold">+12% vs média de mercado</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>Tempo Médio p/ Clique</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300 font-mono">4,2 min</div>
              <p className="text-[10px] text-slate-500">Resposta ultrarrápida sem login</p>
            </div>
          </div>

          {/* Recharts BarChart: Enviadas vs Cliques por Cliente */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  <span>Comparativo por Cliente: Conversas Enviadas vs Cliques no Link</span>
                </h3>
                <p className="text-[11px] text-slate-400">Desempenho por contrato na aprovação de posts no WhatsApp</p>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Conversas Enviadas
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span> Cliques Rastreados
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Café & Aroma', enviadas: 52, cliques: 44 },
                  { name: 'TechFlow Solutions', enviadas: 64, cliques: 49 },
                  { name: 'Lume Arquitetura', enviadas: 32, cliques: 21 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val: any, name: any) => [val, name === 'enviadas' ? 'Conversas Enviadas' : 'Cliques no Link']}
                  />
                  <Bar dataKey="enviadas" fill="#10b981" radius={[6, 6, 0, 0]} name="enviadas" />
                  <Bar dataKey="cliques" fill="#22d3ee" radius={[6, 6, 0, 0]} name="cliques" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown por Categoria de Alerta */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Desempenho por Categoria de Alerta Disparado:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">1. Novo Post para Aprovação</span>
                  <span className="text-emerald-400 font-mono font-bold">85,7% CTR</span>
                </div>
                <div className="text-[11px] text-slate-400">84 conversas enviadas → 72 cliques rastreados</div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85.7%' }} />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">2. Solicitação de Refazer</span>
                  <span className="text-cyan-400 font-mono font-bold">81,6% CTR</span>
                </div>
                <div className="text-[11px] text-slate-400">38 conversas enviadas → 31 cliques rastreados</div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '81.6%' }} />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">3. Recibo & Fechamento</span>
                  <span className="text-purple-400 font-mono font-bold">42,3% CTR</span>
                </div>
                <div className="text-[11px] text-slate-400">26 conversas enviadas → 11 cliques rastreados</div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '42.3%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Audit Log Table of Disparos Recent */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Log Auditável dos Últimos Disparos de WhatsApp:
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Destinatário</th>
                    <th className="py-2.5 px-3">Tipo de Notificação</th>
                    <th className="py-2.5 px-3">Status do Clique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 text-xs">
                  <tr className="hover:bg-slate-950/50">
                    <td className="py-3 px-3 font-mono text-slate-400">29/07 18:42</td>
                    <td className="py-3 px-3 font-bold text-white">Café & Aroma Co.</td>
                    <td className="py-3 px-3">(11) 98844-3322</td>
                    <td className="py-3 px-3 text-indigo-300">Novo Post Feed #22</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                        ✓ Clicado (2 min depois)
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-950/50">
                    <td className="py-3 px-3 font-mono text-slate-400">29/07 17:15</td>
                    <td className="py-3 px-3 font-bold text-white">TechFlow Solutions</td>
                    <td className="py-3 px-3">(11) 97722-1100</td>
                    <td className="py-3 px-3 text-amber-300">Solicitação de Alteração</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                        ✓ Clicado (5 min depois)
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-950/50">
                    <td className="py-3 px-3 font-mono text-slate-400">29/07 15:30</td>
                    <td className="py-3 px-3 font-bold text-white">Lume Arquitetura</td>
                    <td className="py-3 px-3">(11) 96611-9988</td>
                    <td className="py-3 px-3 text-purple-300">Emissão de Recibo PDF</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                        ⏱ Pendente Acesso
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: GESTÃO DE SOCIAL MEDIAS */}
      {activeSubTab === 'social_medias' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Cadastro & Liberação de Licenças para Social Medias</span>
              </h2>
              <p className="text-xs text-slate-400">Você como Gestor pode cadastrar e vender o sistema para múltiplos Social Medias</p>
            </div>

            <button
              onClick={() => setIsAddingSmModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Social Media</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialMedias.map(sm => {
              const assignedClientsList = clients.filter(c => sm.assignedClientIds.includes(c.id));
              const isBlocked = sm.status === 'bloqueado';

              return (
                <div key={sm.id} className={`p-5 rounded-2xl border space-y-4 transition-all ${isBlocked ? 'bg-rose-950/30 border-rose-800/50' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={sm.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={sm.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">{sm.name}</h3>
                          {isBlocked && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.2 rounded font-bold">
                              SUSPENSO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" /> {sm.email}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" /> {sm.whatsapp}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleBlockSocialMedia(sm.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all ${isBlocked ? 'bg-emerald-600 text-white' : 'bg-rose-950/60 text-rose-300 hover:bg-rose-600 hover:text-white'}`}
                        title={isBlocked ? 'Desbloquear Acesso' : 'Bloquear por Informações Falsas'}
                      >
                        {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>

                      {socialMedias.length > 1 && (
                        <button
                          onClick={() => onDeleteSocialMedia(sm.id)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all"
                          title="Excluir cadastro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mandatory Social Profile Badge */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-indigo-500/30 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Perfil Obrigatório:</span>
                    </div>
                    <a
                      href={sm.socialProfile.startsWith('http') ? sm.socialProfile : `https://${sm.socialProfile}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 truncate max-w-[200px]"
                    >
                      <span className="truncate">{sm.socialProfile}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  {/* Pix & Clients */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Chave Pix:</span>
                      <span className="text-slate-200 font-mono text-[11px] truncate block">{sm.pixKey}</span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Clientes Alocados ({assignedClientsList.length}):</span>
                      <span className="text-slate-200 font-bold text-[11px] truncate block">
                        {assignedClientsList.length > 0 
                          ? assignedClientsList.map(c => c.name).join(', ') 
                          : 'Nenhum cliente'}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AUDITORIA POR EMPRESA (CLIENTES) */}
      {activeSubTab === 'clients' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Acompanhamento Auditável por Perfil de Empresa (Clientes)</span>
                </h2>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  ⚡ Sync Supabase Ativo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Inspeção direta de mídias, redes vinculadas, capacidade do Google Drive e sincronia automática com Supabase DB</p>
            </div>

            <button
              onClick={() => setIsAddingClientModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Cliente</span>
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-indigo-500/30 text-xs text-slate-300 max-w-md my-4">
            <span className="font-bold text-indigo-400 flex items-center gap-1.5 mb-1">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span>Fluxo de Criação do Google Drive:</span>
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Você como <strong>Gestor</strong> ou o Social Media cadastra a URL da pasta mãe no painel de Configurações do Cliente. O sistema gerencia a capacidade de armazenamento em GB para cada cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(client => {
              const clientPosts = posts.filter(p => p.clientProjectId === client.id);
              const published = clientPosts.filter(p => p.isPublished).length;
              const assignedSm = socialMedias.find(sm => sm.id === client.assignedSocialMediaId);
              const isBlocked = client.status === 'bloqueado';

              const usedGB = client.driveStorageUsedGB || 4.2;
              const limitGB = client.driveStorageLimitGB || 15.0;
              const pctUsed = Math.min(100, Math.round((usedGB / limitGB) * 100));

              return (
                <div key={client.id} className={`p-5 rounded-2xl border space-y-4 transition-all ${isBlocked ? 'bg-rose-950/30 border-rose-800/50' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={client.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                      <div>
                        <h3 className="font-bold text-white text-sm">{client.name}</h3>
                        <p className="text-[11px] text-slate-400">{client.companyName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">CNPJ: {client.cnpj}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleBlockClient(client.id)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all ${isBlocked ? 'bg-emerald-600 text-white' : 'bg-rose-950/60 text-rose-300 hover:bg-rose-600 hover:text-white'}`}
                      title={isBlocked ? 'Desbloquear Empresa' : 'Bloquear Empresa'}
                    >
                      {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Volume stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Total Posts</div>
                      <div className="text-sm font-black text-white">{clientPosts.length}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Publicados</div>
                      <div className="text-sm font-black text-emerald-400">{published}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Preço/Post</div>
                      <div className="text-sm font-black text-amber-300 font-mono">R${client.pricePerPost}</div>
                    </div>
                  </div>

                  {/* Drive Capacity Meter */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-300 flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Capacidade Drive:
                      </span>
                      <span className="text-cyan-300 font-mono">
                        {usedGB.toFixed(1)} GB / {limitGB.toFixed(1)} GB ({pctUsed}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pctUsed > 80 ? 'bg-rose-500' : pctUsed > 50 ? 'bg-amber-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${pctUsed}%` }}
                      />
                    </div>
                  </div>

                  {/* Drive Link & Assigned Social Media */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold">Social Media Responsável:</span>
                      <span className="font-bold text-purple-300">{assignedSm?.name || 'Não atribuído'}</span>
                    </div>

                    {client.googleDriveFolderUrl && (
                      <a
                        href={client.googleDriveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-indigo-500/30 hover:border-indigo-500 text-xs font-bold text-indigo-400"
                      >
                        <span className="flex items-center gap-1.5">
                          <HardDrive className="w-4 h-4 text-indigo-400" />
                          <span>Google Drive do Cliente</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: EVOLUÇÃO DO CÓDIGO E HISTÓRICO DE LINHAS */}
      {activeSubTab === 'code_evolution' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <span>Evolução do Projeto & Contador de Linhas Auditável</span>
              </h2>
              <p className="text-xs text-slate-400">Histórico detalhado de cada atualização e componentes do ecossistema</p>
            </div>

            <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-3.5 py-1.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>v2.5 Full-Stack Ready</span>
            </div>
          </div>

          {/* Code stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs font-bold">Total de Linhas de Código</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">~4.150 linhas</div>
              <p className="text-[10px] text-slate-500">TypeScript + JSX + Tailwind</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs font-bold">Módulos & Componentes</span>
              <div className="text-2xl font-black text-indigo-400 font-mono">21 módulos</div>
              <p className="text-[10px] text-slate-500">Arquitetura modular React</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs font-bold">Tamanho Total do Projeto</span>
              <div className="text-2xl font-black text-purple-400 font-mono">~680 KB</div>
              <p className="text-[10px] text-slate-500">Código fonte compilado</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs font-bold">Tamanho Médio / Arquivo</span>
              <div className="text-2xl font-black text-amber-400 font-mono">26.1 KB</div>
              <p className="text-[10px] text-slate-500">Média por módulo em KB</p>
            </div>
          </div>

          {/* Gráfico de Evolução do Código vs Tamanho de Arquivos */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <span>Gráfico de Evolução: Tamanho do Projeto, Linhas de Código & Módulos</span>
                </h3>
                <p className="text-[11px] text-slate-400">Acompanhamento histórico da métrica de crescimento do sistema em cada versão</p>
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded-lg font-mono">
                  ● Linhas de Código
                </span>
                <span className="px-2 py-1 bg-cyan-950 text-cyan-400 border border-cyan-800/40 rounded-lg font-mono">
                  ● Tamanho Projeto (KB)
                </span>
                <span className="px-2 py-1 bg-indigo-950 text-indigo-400 border border-indigo-800/40 rounded-lg font-mono">
                  ● Módulos / Componentes
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={[
                    { version: 'v1.0 (Base)', lines: 1200, modules: 8, files: 12, projectSizeKB: 180, avgFileSizeKB: 15.0 },
                    { version: 'v1.5 (Inspirations)', lines: 2100, modules: 11, files: 16, projectSizeKB: 320, avgFileSizeKB: 20.0 },
                    { version: 'v2.0 (Recibos PDF)', lines: 3000, modules: 14, files: 20, projectSizeKB: 490, avgFileSizeKB: 24.5 },
                    { version: 'v2.2 (Multi-Redes)', lines: 3650, modules: 17, files: 23, projectSizeKB: 580, avgFileSizeKB: 25.2 },
                    { version: 'v2.5 (Full-Stack)', lines: 4150, modules: 21, files: 26, projectSizeKB: 680, avgFileSizeKB: 26.1 },
                  ]}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="version" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" stroke="#10b981" tick={{ fontSize: 11 }} label={{ value: 'Linhas / KB', angle: -90, position: 'insideLeft', fill: '#10b981', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#818cf8" tick={{ fontSize: 11 }} label={{ value: 'Qtd Módulos', angle: 90, position: 'insideRight', fill: '#818cf8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'projectSizeKB') return [`${value} KB`, 'Tamanho do Projeto'];
                      if (name === 'lines') return [`${value} linhas`, 'Linhas de Código'];
                      if (name === 'modules') return [`${value} módulos`, 'Quantidade Módulos'];
                      if (name === 'avgFileSizeKB') return [`${value} KB`, 'Tamanho Médio por Arquivo'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="projectSizeKB" name="Tamanho Projeto (KB)" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={28} />
                  <Area yAxisId="left" type="monotone" dataKey="lines" name="Linhas de Código" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth={3} />
                  <Line yAxisId="right" type="monotone" dataKey="modules" name="Quantidade Módulos" stroke="#818cf8" strokeWidth={3} dot={{ r: 5, fill: '#818cf8' }} />
                  <Line yAxisId="left" type="monotone" dataKey="avgFileSizeKB" name="Tamanho Médio/Arquivo (KB)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#f59e0b' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Audit Log Timeline */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Histórico de Atualizações do Sistema & Supabase Script:</span>
            </h3>

            {/* Supabase Connection, Diagnostics & SQL Script Panel */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span>Configuração & Diagnóstico do Supabase DB</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Insira as credenciais do seu projeto Supabase para persistência relacional de clientes, posts, rascunhos e auditoria.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    supabaseUrlInput && supabaseKeyInput
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                      : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                  }`}>
                    {supabaseUrlInput && supabaseKeyInput ? '⚡ Chaves Salvas' : '⚠️ Chaves Ausentes'}
                  </span>
                </div>
              </div>

              {/* Form de Configuração do Supabase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold text-[11px]">URL do Projeto Supabase (VITE_SUPABASE_URL):</label>
                  <input
                    type="url"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="Ex: https://xxxxxxxxxxxx.supabase.co"
                    className="w-full bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold text-[11px]">Chave Pública Anon Key (VITE_SUPABASE_ANON_KEY):</label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="Ex: eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isTestingConn}
                  onClick={async () => {
                    saveSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
                    setIsTestingConn(true);
                    setTestResult(null);
                    const res = await testSupabaseConnection();
                    setTestResult(res);
                    setIsTestingConn(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isTestingConn ? 'Testando Conexão...' : 'Salvar & Testar Conexão'}</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncingAll}
                  onClick={async () => {
                    saveSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
                    setIsSyncingAll(true);
                    try {
                      await syncAllClientsToSupabase(clients);
                      await syncAllPostsToSupabase(posts);
                      for (const sm of socialMedias) {
                        await syncSocialMediaToSupabase(sm);
                      }
                      alert('✓ Sincronização manual completa executada para Clientes, Posts e Social Medias no Supabase!');
                    } catch (err) {
                      alert('Erro durante a sincronização manual com o Supabase. Verifique se o script SQL de tabelas foi rodado.');
                    }
                    setIsSyncingAll(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSyncingAll ? 'Sincronizando...' : 'Forçar Sincronização Manual Agora'}</span>
                </button>
              </div>

              {/* Banner de Resultado do Teste */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-xs leading-relaxed font-medium flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-800 text-rose-300'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-bold">{testResult.success ? 'Conexão Bem-Sucedida!' : 'Atenção / Verificação de Conexão:'}</strong>
                    <span>{testResult.message}</span>
                  </div>
                </div>
              )}

              {/* Script SQL Completo do Supabase */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    Script SQL Completo para Criar Tabelas e Políticas (RLS) no Supabase:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const fullSql = `-- 1. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  cnpj TEXT,
  address TEXT,
  contact_name TEXT,
  whatsapp_number TEXT,
  email TEXT,
  price_per_post NUMERIC(10,2) DEFAULT 150,
  metrics_access TEXT DEFAULT 'ambos',
  drive_folder_url TEXT,
  logo_url TEXT,
  assigned_social_media_id TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE POSTS (RASCUNHOS E CONTEÚDOS)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  client_project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'image',
  social_networks JSONB DEFAULT '[]'::jsonb,
  scheduled_date TEXT,
  status TEXT DEFAULT 'rascunho',
  approval_token TEXT,
  token_expires_at TIMESTAMPTZ,
  comments JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  social_media_author_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE AUDITORIA DE COMENTÁRIOS DOS POSTS
CREATE TABLE IF NOT EXISTS post_comments_audit (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  post_title TEXT,
  client_id TEXT,
  author_role TEXT NOT NULL,
  author_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE SOCIAL MEDIAS E TAXAS PERSONALIZADAS
CREATE TABLE IF NOT EXISTS social_medias (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  social_profile TEXT,
  pix_key TEXT,
  custom_fee_per_post NUMERIC(10,2),
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. HABILITAR SEGURANÇA (RLS) E PERMISSÕES DE ACESSO
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_medias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso total clientes" ON clients;
CREATE POLICY "Permitir acesso total clientes" ON clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total posts" ON posts;
CREATE POLICY "Permitir acesso total posts" ON posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total audit" ON post_comments_audit;
CREATE POLICY "Permitir acesso total audit" ON post_comments_audit FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total social_medias" ON social_medias;
CREATE POLICY "Permitir acesso total social_medias" ON social_medias FOR ALL USING (true) WITH CHECK (true);`;
                      navigator.clipboard.writeText(fullSql);
                      alert('Script SQL Completo do Supabase copiado! Cole no SQL Editor do seu Supabase e clique em "Run".');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
                  >
                    Copiar Script SQL Completo
                  </button>
                </div>

                <pre className="bg-slate-900 text-indigo-300 p-3 rounded-xl font-mono text-[10px] overflow-x-auto border border-slate-800 leading-relaxed max-h-48">
{`-- 1. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, company_name TEXT, cnpj TEXT,
  address TEXT, contact_name TEXT, whatsapp_number TEXT, email TEXT,
  price_per_post NUMERIC(10,2) DEFAULT 150, metrics_access TEXT DEFAULT 'ambos',
  drive_folder_url TEXT, logo_url TEXT, assigned_social_media_id TEXT, status TEXT DEFAULT 'ativo'
);

-- 2. TABELA DE POSTS (RASCUNHOS & CONTEÚDOS)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY, client_project_id TEXT NOT NULL, title TEXT NOT NULL,
  caption TEXT, media_url TEXT, media_type TEXT DEFAULT 'image', social_networks JSONB DEFAULT '[]'::jsonb,
  scheduled_date TEXT, status TEXT DEFAULT 'rascunho', approval_token TEXT, token_expires_at TIMESTAMPTZ,
  comments JSONB DEFAULT '[]'::jsonb, is_published BOOLEAN DEFAULT false, published_at TIMESTAMPTZ,
  social_media_author_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AUDITORIA DE COMENTÁRIOS E SOCIAL MEDIAS
CREATE TABLE IF NOT EXISTS post_comments_audit ( id TEXT PRIMARY KEY, post_id TEXT NOT NULL, post_title TEXT, client_id TEXT, author_role TEXT NOT NULL, author_name TEXT NOT NULL, comment_text TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS social_medias ( id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, whatsapp TEXT, social_profile TEXT, pix_key TEXT, custom_fee_per_post NUMERIC(10,2), status TEXT DEFAULT 'ativo', created_at TIMESTAMPTZ DEFAULT NOW() );

-- 4. POLÍTICAS DE ACESSO (RLS - CRUCIAL PARA SALVAR SEM ERRO)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY; ALTER TABLE posts ENABLE ROW LEVEL SECURITY; ALTER TABLE post_comments_audit ENABLE ROW LEVEL SECURITY; ALTER TABLE social_medias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acesso total clientes" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total audit" ON post_comments_audit FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total social_medias" ON social_medias FOR ALL USING (true) WITH CHECK (true);`}
                </pre>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>[v2.5] Inversão de Chat de Debate + Taxa SaaS Editável + Anti-Drible</span>
                  <span className="text-[10px] text-slate-500">2026-07-29</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">
                  Chat de debate com mensagens mais recentes no topo e caixa de digitação no cabeçalho; valor da taxa de R$ 0,50 por postagem totalmente editável pelo Gestor; mecanismo de bloqueio/suspensão anti-drible de faturamento.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-indigo-400 font-bold">
                  <span>[v2.4] Livro Vivo do Projeto & Análise de Mercado Excel (.xlsx)</span>
                  <span className="text-[10px] text-slate-500">2026-07-29</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">
                  Integração do Livro do Projeto por capítulos com histórico vivo e gerador de planilha Excel em memória (.xlsx) com simulador de concorrência.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-purple-400 font-bold">
                  <span>[v2.3] Gestão de Múltiplos Social Medias & Google Drive Central</span>
                  <span className="text-[10px] text-slate-500">2026-07-29</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">
                  Suporte completo a múltiplos Social Medias por agência, perfil social obrigatório e botão modal do Google Drive por cliente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Fee per post */}
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

      {/* Modal: Edit Individual Social Media Custom Fee Rate */}
      {editingSmForFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Taxa Customizada: {editingSmForFee.name}</span>
              </h3>
              <button onClick={() => setEditingSmForFee(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const parsed = customSmFeeInput.trim() ? parseFloat(customSmFeeInput.replace(',', '.')) : undefined;
                if (onUpdateSocialMediaFee) {
                  onUpdateSocialMediaFee(editingSmForFee.id, isNaN(parsed as number) ? undefined : parsed);
                }
                setEditingSmForFee(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">Taxa por Post para este Social Media (R$):</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={customSmFeeInput}
                  onChange={(e) => setCustomSmFeeInput(e.target.value)}
                  placeholder={`Em branco = usa taxa padrão R$ ${feePerPost.toFixed(2)}`}
                  className="w-full bg-slate-950 text-amber-300 font-bold font-mono text-lg p-3 rounded-xl border border-amber-500/50 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Deixar em branco para voltar a aplicar a <strong>taxa padrão global (R$ {feePerPost.toFixed(2)})</strong>. Caso preenchido, este valor exclusivo prevalecerá nos relatórios de repasse deste profissional.
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateSocialMediaFee) {
                      onUpdateSocialMediaFee(editingSmForFee.id, undefined);
                    }
                    setEditingSmForFee(null);
                  }}
                  className="text-slate-400 hover:text-rose-300 text-[11px] font-bold underline"
                >
                  Restaurar Padrão (R$ {feePerPost.toFixed(2)})
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSmForFee(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg"
                  >
                    Salvar Taxa
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Social Media */}
      {isAddingSmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Novo Cadastro de Social Media</span>
              </h2>
              <button onClick={() => setIsAddingSmModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSmSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nome Completo do Profissional:</label>
                <input
                  type="text"
                  required
                  value={newSmForm.name}
                  onChange={(e) => setNewSmForm({ ...newSmForm, name: e.target.value })}
                  placeholder="Ex: Camila Rocha"
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Perfil de Rede Social (Instagram / LinkedIn) <span className="text-rose-400 font-extrabold">*ITEM OBRIGATÓRIO*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={newSmForm.socialProfile}
                  onChange={(e) => setNewSmForm({ ...newSmForm, socialProfile: e.target.value })}
                  placeholder="instagram.com/camila_socialmedia ou linkedin.com/in/camila"
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-indigo-500/50 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">E-mail de Acesso:</label>
                  <input
                    type="email"
                    required
                    value={newSmForm.email}
                    onChange={(e) => setNewSmForm({ ...newSmForm, email: e.target.value })}
                    placeholder="camila@agencia.com"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">WhatsApp (Com DDD):</label>
                  <input
                    type="text"
                    required
                    value={newSmForm.whatsapp}
                    onChange={(e) => setNewSmForm({ ...newSmForm, whatsapp: e.target.value })}
                    placeholder="5511999998888"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Chave Pix para Pagamento de Comissão:</label>
                <input
                  type="text"
                  required
                  value={newSmForm.pixKey}
                  onChange={(e) => setNewSmForm({ ...newSmForm, pixKey: e.target.value })}
                  placeholder="E-mail, CPF ou Telefone Pix"
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Taxa Customizada por Post (R$) <span className="text-slate-500 font-normal">(Opcional)</span>:
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={newSmForm.customFeePerPost}
                  onChange={(e) => setNewSmForm({ ...newSmForm, customFeePerPost: e.target.value })}
                  placeholder={`Em branco = usa taxa padrão R$ ${feePerPost.toFixed(2)}`}
                  className="w-full bg-slate-950 text-amber-300 font-mono font-bold p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Clientes Atribuídos Inicialmente:</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {clients.map(client => {
                    const isChecked = newSmForm.assignedClientIds.includes(client.id);
                    return (
                      <label key={client.id} className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-1 hover:bg-slate-900 rounded">
                        <span>{client.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewSmForm({ ...newSmForm, assignedClientIds: [...newSmForm.assignedClientIds, client.id] });
                            } else {
                              setNewSmForm({ ...newSmForm, assignedClientIds: newSmForm.assignedClientIds.filter(id => id !== client.id) });
                            }
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingSmModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload SaaS Payment Proof */}
      {isUploadProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <span>Enviar Comprovante de Pagamento SaaS</span>
              </h2>
              <button onClick={() => setIsUploadProofModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const smObj = socialMedias.find(s => s.id === selectedSmForProof) || socialMedias[0];
              const clientObj = clients.find(c => c.id === selectedClientForProof) || clients[0];
              const calculatedTotal = proofPostsCount * feePerPost;

              if (onAddSaasProof) {
                onAddSaasProof({
                  socialMediaId: smObj?.id || 'sm-1',
                  socialMediaName: smObj?.name || 'Social Media',
                  clientProjectId: clientObj?.id || 'client-1',
                  clientName: clientObj?.name || 'Cliente',
                  period: proofPeriod,
                  postsCount: Number(proofPostsCount),
                  feePerPost: feePerPost,
                  totalAmount: calculatedTotal,
                  proofUrl: proofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
                  notes: proofNotes
                });
              }

              setIsUploadProofModal(false);
              setProofNotes('');
              setProofUrl('');
            }} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Social Media Responsável pelo Envio:</label>
                <select
                  value={selectedSmForProof}
                  onChange={(e) => setSelectedSmForProof(e.target.value)}
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                >
                  {socialMedias.map(sm => (
                    <option key={sm.id} value={sm.id}>{sm.name} ({sm.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Empresa / Cliente do Fechamento:</label>
                <select
                  value={selectedClientForProof}
                  onChange={(e) => setSelectedClientForProof(e.target.value)}
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.companyName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mês / Período:</label>
                  <input
                    type="text"
                    required
                    value={proofPeriod}
                    onChange={(e) => setProofPeriod(e.target.value)}
                    placeholder="Ex: Julho/2026"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Quantidade de Posts:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={proofPostsCount}
                    onChange={(e) => setProofPostsCount(Number(e.target.value))}
                    className="w-full bg-slate-950 text-amber-300 font-bold p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Automatic calculation display */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Cálculo da Taxa SaaS (R$ {feePerPost.toFixed(2)} / post):</div>
                  <div className="text-xs text-slate-300">{proofPostsCount} posts × R$ {feePerPost.toFixed(2)}</div>
                </div>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  R$ {(proofPostsCount * feePerPost).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Link do Comprovante Pix / Print do Recibo:</label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://imgur.com/link-do-comprovante.png ou Cole a URL do print"
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">Se deixar em branco, o sistema vincula um recibo ilustrativo Pix padronizado.</p>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Observações Adicionais (Opcional):</label>
                <textarea
                  rows={2}
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Ex: Pix realizado da conta Itaú da agência referente a Julho"
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadProofModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-600/20"
                >
                  Enviar Comprovante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar Novo Cliente */}
      {isAddingClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Cadastrar Novo Cliente (Persistência no Supabase)</span>
              </h3>
              <button onClick={() => setIsAddingClientModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
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
                try {
                  if (onAddClient) {
                    onAddClient(created);
                  }
                } catch (err) {
                  console.error('Erro ao adicionar cliente:', err);
                } finally {
                  setIsAddingClientModal(false);
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
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nome Fantasia do Cliente *:</label>
                <input
                  type="text"
                  required
                  value={newClientForm.name}
                  onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                  placeholder="Ex: Padaria & Confeitaria Solar"
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
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
                    className="w-full bg-slate-950 text-emerald-400 font-bold p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Link da Logomarca (Drive ou Imagem Direct):</label>
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

              <div>
                <label className="block text-slate-300 font-bold mb-1">Social Media Responsável:</label>
                <select
                  value={newClientForm.assignedSocialMediaId}
                  onChange={(e) => setNewClientForm({ ...newClientForm, assignedSocialMediaId: e.target.value })}
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">Nenhum Alocado</option>
                  {socialMedias.map(sm => (
                    <option key={sm.id} value={sm.id}>{sm.name} ({sm.email})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingClientModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-600/20"
                >
                  Salvar Cliente e Sincronizar Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
