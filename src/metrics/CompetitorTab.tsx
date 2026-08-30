// src/metrics/CompetitorTab.tsx
import React from 'react';
import {
  BarChart3, TrendingUp, Users, Eye, MousePointer,
  ShoppingBag, Instagram, Facebook, Linkedin, Filter, ShieldCheck,
  MessageSquare, DollarSign, Target, Calendar, HelpCircle, Flame, ArrowUpRight, Zap,
  Bookmark, Share2, Video, Award, Calculator, Layers, Sparkles, PieChart as PieChartIcon,
  CheckCircle2, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import { MetricsTabSharedProps } from './types';

export const CompetitorTab: React.FC<MetricsTabSharedProps> = (props) => {
  const {
    client, metrics, channels, currentUserRole, onChangeMetricsAccess,
    selectedYear, setSelectedYear, timeRange, setTimeRange,
    simulatedBudget, setSimulatedBudget,
    comp, monthlyReachData, competitorBarData, formatData,
    projectedReach, projectedClicks, projectedLeads, projectedRevenue
  } = props;

  return (
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>ANÁLISE DE MERCADO & CONCORRÊNCIA</span>
                </div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Benchmarking Direto: Nosso Cliente vs. Concorrente</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Análise comparativa detalhada contra <strong className="text-amber-300">{comp.competitorName}</strong>
                </p>
              </div>

              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3.5 py-2 rounded-xl font-bold self-start sm:self-auto flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Vantagem Competitiva: +{((comp.clientEngagement / comp.competitorEngagement - 1) * 100).toFixed(0)}% Engajamento Superior
              </span>
            </div>

            {/* Benchmark Recharts BarChart */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Comparativo Visual em Indicadores Chave</span>
              </h4>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={competitorBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Cliente" fill="#3b82f6" radius={[6, 6, 0, 0]} name={`Nosso Cliente (${client.name})`} />
                    <Bar dataKey="Concorrente" fill="#f59e0b" radius={[6, 6, 0, 0]} name={comp.competitorName} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Metric Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Base de Seguidores</span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-white font-bold p-2 bg-slate-900 rounded-xl border border-indigo-500/30">
                    <span>Nosso Cliente:</span>
                    <span className="text-indigo-300 font-mono">{comp.clientFollowers.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 p-2 bg-slate-900/50 rounded-xl">
                    <span>Concorrente:</span>
                    <span className="font-mono">{comp.competitorFollowers.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Taxa de Engajamento %</span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-emerald-400 font-bold p-2 bg-emerald-950/40 rounded-xl border border-emerald-500/40">
                    <span>Nosso Cliente:</span>
                    <span className="font-mono">{comp.clientEngagement}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 p-2 bg-slate-900/50 rounded-xl">
                    <span>Concorrente:</span>
                    <span className="font-mono">{comp.competitorEngagement}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Frequência (Posts / Sem)</span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-amber-300 font-bold p-2 bg-slate-900 rounded-xl border border-amber-500/30">
                    <span>Nosso Cliente:</span>
                    <span className="font-mono">{comp.clientPostFrequency} posts/sem</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 p-2 bg-slate-900/50 rounded-xl">
                    <span>Concorrente:</span>
                    <span className="font-mono">{comp.competitorPostFrequency} posts/sem</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Investimento Estimado Ads</span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-emerald-400 font-bold p-2 bg-slate-900 rounded-xl border border-emerald-500/30">
                    <span>Nosso Cliente:</span>
                    <span className="font-mono">R$ {comp.clientEstAdBudget}/mês</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 p-2 bg-slate-900/50 rounded-xl">
                    <span>Concorrente:</span>
                    <span className="font-mono">R$ {comp.competitorEstAdBudget}/mês</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

  );
};
