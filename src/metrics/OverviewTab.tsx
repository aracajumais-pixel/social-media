// src/metrics/OverviewTab.tsx
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

export const OverviewTab: React.FC<MetricsTabSharedProps> = (props) => {
  const {
    client, metrics, channels, currentUserRole, onChangeMetricsAccess,
    selectedYear, setSelectedYear, timeRange, setTimeRange,
    simulatedBudget, setSimulatedBudget,
    comp, monthlyReachData, competitorBarData, formatData,
    projectedReach, projectedClicks, projectedLeads, projectedRevenue
  } = props;

  return (
        <div className="space-y-6">
          
          {/* Main Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat 1: Impressões */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-400" /> Impressões Totais
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[11px]">
                  <TrendingUp className="w-3 h-3" /> +{metrics.impressionsGrowth}%
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {metrics.totalImpressions.toLocaleString('pt-BR')}
              </div>
              <p className="text-[10px] text-slate-500">Visualizações de Feed, Stories e Anúncios</p>
            </div>

            {/* Stat 2: Alcance Único */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" /> Alcance Único
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[11px]">
                  <TrendingUp className="w-3 h-3" /> +{metrics.reachGrowth}%
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {metrics.totalReach.toLocaleString('pt-BR')}
              </div>
              <p className="text-[10px] text-slate-500">Pessoas únicas impactadas pela marca</p>
            </div>

            {/* Stat 3: Comentários */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-400" /> Comentários
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[11px]">
                  <TrendingUp className="w-3 h-3" /> +{metrics.commentsGrowth}%
                </span>
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {metrics.commentsCount.toLocaleString('pt-BR')}
              </div>
              <p className="text-[10px] text-slate-500">Engajamento conversacional direto</p>
            </div>

            {/* Stat 4: Cliques no Perfil */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <MousePointer className="w-4 h-4 text-cyan-400" /> Cliques no Perfil
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[11px]">
                  <TrendingUp className="w-3 h-3" /> +{metrics.profileClicksGrowth}%
                </span>
              </div>
              <div className="text-2xl font-black text-cyan-300 font-mono">
                {metrics.profileClicks.toLocaleString('pt-BR')}
              </div>
              <p className="text-[10px] text-slate-500">Visitas ao perfil e link da bio</p>
            </div>

            {/* Stat 5: Salvamentos */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-indigo-400" /> Salvamentos
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[11px]">
                  <TrendingUp className="w-3 h-3" /> +{metrics.savesGrowth}%
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-300 font-mono">
                {metrics.savesCount.toLocaleString('pt-BR')}
              </div>
              <p className="text-[10px] text-slate-500">Conteúdo de alto valor salvo</p>
            </div>

            {/* Stat 6: Compartilhamentos */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-pink-400" /> Compartilhamentos
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[11px]">
                  <TrendingUp className="w-3 h-3" /> +{metrics.sharesGrowth}%
                </span>
              </div>
              <div className="text-2xl font-black text-pink-300 font-mono">
                {metrics.sharesCount.toLocaleString('pt-BR')}
              </div>
              <p className="text-[10px] text-slate-500">Viralidade orgânica no Direct e WhatsApp</p>
            </div>

            {/* Stat 7: Taxa de Retenção de Vídeo */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-teal-400" /> Retenção de Reels
                </span>
                <span className="text-emerald-400 font-bold text-[11px]">Alta Retenção</span>
              </div>
              <div className="text-2xl font-black text-teal-300 font-mono">
                {metrics.videoWatchRate}%
              </div>
              <p className="text-[10px] text-slate-500">Assistiram &gt;50% do vídeo</p>
            </div>

            {/* Stat 8: Conversões e Vendas */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" /> Conversões
                </span>
                <span className="text-emerald-400 font-bold text-[11px]">{metrics.totalClicks} cliques</span>
              </div>
              <div className="text-2xl font-black text-emerald-300 font-mono">
                {metrics.conversions}
              </div>
              <p className="text-[10px] text-slate-500">Vendas / Pedidos via Pixel GA4</p>
            </div>

          </div>

          {/* Gráfico de Evolução de Alcance Orgânico vs Pago */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  Evolução Mensal: Alcance Orgânico vs Alcance Pago (Ads)
                </h3>
                <p className="text-xs text-slate-400">Comparativo mês a mês do crescimento do público</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-3 h-3 rounded bg-blue-500"></span> Orgânico
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-3 rounded bg-emerald-500"></span> Pago (Turbinar)
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyReachData}>
                  <defs>
                    <linearGradient id="colorOrganico" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPago" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="organico" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrganico)" name="Alcance Orgânico" />
                  <Area type="monotone" dataKey="pago" stroke="#10b981" fillOpacity={1} fill="url(#colorPago)" name="Alcance Pago" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channels Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              Desempenho por Canal Conectado (Instagram, Facebook, TikTok, LinkedIn)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {channels.map(chan => (
                <div key={chan.network} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-200 capitalize flex items-center gap-1.5">
                      {chan.network === 'instagram' && <Instagram className="w-4 h-4 text-pink-400" />}
                      {chan.network === 'facebook' && <Facebook className="w-4 h-4 text-blue-400" />}
                      {chan.network === 'linkedin' && <Linkedin className="w-4 h-4 text-sky-400" />}
                      {chan.network === 'tiktok' && <span className="font-black text-emerald-300">TT</span>}
                      {chan.network}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400">+{chan.growth}%</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Seguidores:</span>
                      <span className="font-bold text-slate-200">{chan.followers.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Impressões:</span>
                      <span className="font-bold text-slate-200">{chan.impressions.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Engajamento:</span>
                      <span className="font-bold text-emerald-400">{chan.engagement}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

  );
};
