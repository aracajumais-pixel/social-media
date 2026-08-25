// src/admin/WhatsAppTab.tsx
import React from 'react';
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

export const WhatsAppTab: React.FC<AdminTabSharedProps> = (props) => {
  const {
    clients, posts, receipts, socialMedias, saasProofs,
    onAddSocialMedia, onDeleteSocialMedia, onToggleBlockSocialMedia, onUpdateSocialMediaFee,
    onToggleBlockClient, onAddClient, feePerPost, onUpdateFeePerPost, onAddSaasProof, onUpdateSaasProofStatus, onNavigateTab
  } = props;

  return (
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
  );
};
