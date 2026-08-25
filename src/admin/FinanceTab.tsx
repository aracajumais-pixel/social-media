// src/admin/FinanceTab.tsx
import React, { useState } from 'react';
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
import { AdminTabSharedProps } from './types';
import type { SocialMediaUser } from '../types';

export const FinanceTab: React.FC<AdminTabSharedProps> = (props) => {
  const {
    clients, posts, receipts, socialMedias, saasProofs,
    onToggleBlockSocialMedia, onUpdateSocialMediaFee, feePerPost, onUpdateFeePerPost,
    onAddSaasProof, onUpdateSaasProofStatus
  } = props;

  // Estado local desta aba (antes vivia centralizado no index.tsx)
  const [editingSmForFee, setEditingSmForFee] = useState<SocialMediaUser | null>(null);
  const [customSmFeeInput, setCustomSmFeeInput] = useState('');
  const [isUploadProofModal, setIsUploadProofModal] = useState(false);
  const [selectedSmForProof, setSelectedSmForProof] = useState(socialMedias[0]?.id || '');
  const [selectedClientForProof, setSelectedClientForProof] = useState(clients[0]?.id || '');
  const [proofPeriod, setProofPeriod] = useState('Julho/2026');
  const [proofPostsCount, setProofPostsCount] = useState(20);
  const [proofUrl, setProofUrl] = useState('');
  const [proofNotes, setProofNotes] = useState('');

  // Valores calculados localmente (antes vinham prontos via props)
  const rascunhoCount = posts.filter(p => p.status === 'rascunho').length;
  const alteracaoCount = posts.filter(p => p.status === 'alterar').length;
  const aprovadosCount = posts.filter(p => p.status === 'aprovado').length;
  const publicadosCount = posts.filter(p => p.isPublished).length;
  const totalPostsCount = posts.length;
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

  return (
    <>
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

    </>
  );
};
