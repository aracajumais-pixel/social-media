import React, { useState } from 'react';
import { ClientProject, UserRole, MetricOverview, ChannelPerformance } from '../types';
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

interface MetricsDashboardProps {
  client: ClientProject;
  metrics: MetricOverview;
  channels: ChannelPerformance[];
  currentUserRole: UserRole;
  onChangeMetricsAccess?: (clientId: string, access: ClientProject['metricsAccess']) => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  client,
  metrics,
  channels,
  currentUserRole,
  onChangeMetricsAccess
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(metrics.year || 2026);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ano'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'paid_traffic' | 'competitor' | 'formats' | 'simulator'>('overview');

  // Ad Simulator State
  const [simulatedBudget, setSimulatedBudget] = useState<number>(metrics.paidAdsSpend || 1250);

  const comp = metrics.competitor || {
    competitorName: 'Café & Grão Supremo (Principal Concorrente)',
    clientFollowers: 28400,
    competitorFollowers: 32100,
    clientEngagement: 6.8,
    competitorEngagement: 4.2,
    clientPostFrequency: 5,
    competitorPostFrequency: 3,
    clientEstAdBudget: 1250,
    competitorEstAdBudget: 800,
    clientSavesAvg: 96,
    competitorSavesAvg: 41,
    clientVideoViews: 14500,
    competitorVideoViews: 8200
  };

  // Sample monthly data for AreaChart
  const monthlyReachData = [
    { mes: 'Jan', organico: 8200, pago: 4100 },
    { mes: 'Fev', organico: 9400, pago: 5300 },
    { mes: 'Mar', organico: 11000, pago: 6800 },
    { mes: 'Abr', organico: 10500, pago: 7200 },
    { mes: 'Mai', organico: 12800, pago: 8900 },
    { mes: 'Jun', organico: 14200, pago: 10400 },
    { mes: 'Jul', organico: 16500, pago: 12500 }
  ];

  // Competitor Recharts Data
  const competitorBarData = [
    {
      metric: 'Seguidores (x1.000)',
      Cliente: (comp.clientFollowers / 1000).toFixed(1),
      Concorrente: (comp.competitorFollowers / 1000).toFixed(1)
    },
    {
      metric: 'Engajamento (%)',
      Cliente: comp.clientEngagement,
      Concorrente: comp.competitorEngagement
    },
    {
      metric: 'Posts / Semana',
      Cliente: comp.clientPostFrequency,
      Concorrente: comp.competitorPostFrequency
    },
    {
      metric: 'Ads (R$ 100/mês)',
      Cliente: (comp.clientEstAdBudget / 100).toFixed(1),
      Concorrente: (comp.competitorEstAdBudget / 100).toFixed(1)
    }
  ];

  // Format Performance Data
  const formatData = metrics.formatPerformance || [
    { format: 'Reels', reach: 45200, engagement: 9.4, avgLikes: 680, avgComments: 85, avgSaves: 140 },
    { format: 'Carrossel', reach: 28100, engagement: 7.8, avgLikes: 420, avgComments: 62, avgSaves: 195 },
    { format: 'Imagem Estática', reach: 12400, engagement: 4.2, avgLikes: 210, avgComments: 18, avgSaves: 45 },
    { format: 'Stories', reach: 6600, engagement: 5.1, avgLikes: 95, avgComments: 12, avgSaves: 8 }
  ];

  // Simulator calculations
  const projectedReach = Math.round(simulatedBudget * 73.8); // ~73 pessoas por R$ 1
  const projectedClicks = Math.round(simulatedBudget / (metrics.costPerClick || 0.36));
  const projectedLeads = Math.round(simulatedBudget / (metrics.cpl || 6.80));
  const projectedRevenue = Math.round(simulatedBudget * (metrics.roas || 4.8));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header & Main Controls */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-800/40 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-300 border border-blue-500/30">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Painel Completo de Métricas & Benchmarking
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Análise de Tráfego Pago (Turbinar), Engajamento, Comparativo de Concorrente e Formatos para <strong className="text-cyan-400">{client.name}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Gestor Controls for Visibility */}
          {currentUserRole === 'gestor' && onChangeMetricsAccess && (
            <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 text-xs flex items-center gap-2 shadow-lg">
              <span className="text-slate-300 font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Acesso:
              </span>
              <select
                value={client.metricsAccess}
                onChange={(e) => onChangeMetricsAccess(client.id, e.target.value as any)}
                className="bg-slate-900 text-cyan-300 font-bold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none cursor-pointer text-xs"
              >
                <option value="cliente">Somente o Cliente</option>
                <option value="social_media">Somente o Social Media</option>
                <option value="ambos">Ambos (Cliente & Social Media)</option>
                <option value="gestor_apenas">Apenas o Gestor</option>
              </select>
            </div>
          )}

          {/* Year Filter */}
          <div className="bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800 text-xs flex items-center gap-2 shadow-lg">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400 font-bold">Ano:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-900 text-amber-300 font-bold px-3 py-1 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-xl transition-all ${timeRange === '7d' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-xl transition-all ${timeRange === '30d' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              30D
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-3 py-1.5 rounded-xl transition-all ${timeRange === '90d' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Mês
            </button>
            <button
              onClick={() => setTimeRange('ano')}
              className={`px-3 py-1.5 rounded-xl transition-all ${timeRange === 'ano' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Ano Completo
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span>Visão Geral & Engajamento</span>
        </button>

        <button
          onClick={() => setActiveTab('paid_traffic')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'paid_traffic'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Tráfego Pago & Turbinar (ROAS)</span>
        </button>

        <button
          onClick={() => setActiveTab('competitor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'competitor'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Benchmarking Concorrente</span>
        </button>

        <button
          onClick={() => setActiveTab('formats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'formats'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Desempenho por Formato</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'simulator'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calculator className="w-4 h-4 text-indigo-400" />
          <span>Simulador de Investimento & ROI</span>
        </button>
      </div>

      {/* API Integration Notice */}
      <div className="bg-slate-900/90 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-3 text-xs text-slate-300 shadow-md">
        <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0" />
        <div>
          <strong className="text-white font-bold">[Integração Auditável Meta Business Suite & GA4]</strong>
          <span className="block text-slate-400 text-[11px] mt-0.5">
            Métricas calculadas em tempo real para o ano <strong className="text-white">{selectedYear}</strong>. Os dados incluem alcance orgânico, investimentos em impulsionamento de publicações (turbinar) e estatísticas do principal concorrente.
          </span>
        </div>
      </div>

      {/* TAB 1: VISÃO GERAL & ENGAJAMENTO */}
      {activeTab === 'overview' && (
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
      )}

      {/* TAB 2: TRÁFEGO PAGO & TURBINAR */}
      {activeTab === 'paid_traffic' && (
        <div className="space-y-6">
          
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PERFORMANCE DE ANÚNCIOS</span>
                </div>
                <h3 className="text-xl font-black text-white">Tráfego Pago, Anúncios & Publicações Turbinadas</h3>
                <p className="text-xs text-slate-300">Rastreamento de investimento financeiro, retorno sobre o investimento e eficiência por clique</p>
              </div>

              <div className="bg-emerald-950 p-4 rounded-2xl border border-emerald-500/40 flex items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ROAS do Mês</span>
                  <span className="text-3xl font-black text-emerald-400 font-mono">{metrics.roas}x</span>
                </div>
                <div className="h-8 w-px bg-emerald-800/60" />
                <div className="text-xs text-emerald-300">
                  <span className="font-bold block">Excelente Retorno</span>
                  <span className="text-[11px] text-slate-400">Para cada R$ 1, R$ {metrics.roas} em retorno</span>
                </div>
              </div>
            </div>

            {/* Paid Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Investimento Total Turbinar</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  R$ {metrics.paidAdsSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-slate-500">+12% vs mês anterior</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Custo por Clique (CPC)</span>
                <div className="text-2xl font-black text-cyan-400 font-mono">
                  R$ {metrics.costPerClick.toFixed(2)}
                </div>
                <p className="text-[10px] text-emerald-400 font-semibold">-18% abaixo da média do setor</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Custo por Lead/Mensagem (CPL)</span>
                <div className="text-2xl font-black text-amber-300 font-mono">
                  R$ {metrics.cpl.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-500">Custo por conversa iniciada no WA/Direct</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Custo por Mil Impressões (CPM)</span>
                <div className="text-2xl font-black text-purple-300 font-mono">
                  R$ {metrics.cpm.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-500">Valor para alcançar 1.000 pessoas</p>
              </div>

            </div>

            {/* Dicas Estratégicas de Anúncios */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Recomendações da Agência para a Próxima Campanha de Turbinar:</span>
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                <li className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Priorize Reels de até 30s:</strong> Tiveram o menor CPC (R$ 0,28) e maior retenção de público.</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Botão de Destino Direto pro WhatsApp:</strong> Gerou 3,2x mais conversões de vendas do que o link do site.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: BENCHMARKING CONCORRENTE */}
      {activeTab === 'competitor' && (
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
      )}

      {/* TAB 4: DESEMPENHO POR FORMATO */}
      {activeTab === 'formats' && (
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  <span>Desempenho por Formato de Conteúdo</span>
                </h3>
                <p className="text-xs text-slate-400">Comparativo entre Reels, Carrossel, Imagens Estáticas e Stories</p>
              </div>
            </div>

            {/* Formats Chart */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="format" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="reach" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Alcance Médio" />
                    <Bar dataKey="avgLikes" fill="#ec4899" radius={[6, 6, 0, 0]} name="Curtidas Médias" />
                    <Bar dataKey="avgSaves" fill="#10b981" radius={[6, 6, 0, 0]} name="Salvamentos Médios" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cards Detail by Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {formatData.map((f) => (
                <div key={f.format} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white text-sm">{f.format}</span>
                    <span className="text-purple-400 font-bold">{f.engagement}% Eng.</span>
                  </div>

                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Alcance Médio:</span>
                      <span className="font-mono font-bold">{f.reach.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Curtidas Médias:</span>
                      <span className="font-mono text-pink-300">{f.avgLikes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Comentários Médios:</span>
                      <span className="font-mono text-amber-300">{f.avgComments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Salvamentos Médios:</span>
                      <span className="font-mono text-emerald-400">{f.avgSaves}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* TAB 5: SIMULADOR DE TRÁFEGO PAGO */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl bg-gradient-to-br from-indigo-950/30 to-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-1">
                  <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                  <span>FERRAMENTA DE PLANEJAMENTO</span>
                </div>
                <h3 className="text-xl font-black text-white">Simulador Projetado de Turbinar & Tráfego Pago</h3>
                <p className="text-xs text-slate-300">Simule o alcance, cliques e retorno estimado ao alterar o investimento em anúncios</p>
              </div>
            </div>

            {/* Slider Control */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Simular Orçamento Mensal em Anúncios:</span>
                </label>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  R$ {simulatedBudget.toLocaleString('pt-BR')}
                </div>
              </div>

              <input
                type="range"
                min={200}
                max={10000}
                step={100}
                value={simulatedBudget}
                onChange={(e) => setSimulatedBudget(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>R$ 200/mês</span>
                <span>R$ 2.500/mês</span>
                <span>R$ 5.000/mês</span>
                <span>R$ 10.000/mês</span>
              </div>
            </div>

            {/* Projected Outputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Alcance Adicional Projetado</span>
                <div className="text-2xl font-black text-blue-400 font-mono">
                  +{projectedReach.toLocaleString('pt-BR')}
                </div>
                <p className="text-[10px] text-slate-500">Pessoas atingidas pelos anúncios</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Cliques Estimados no Link</span>
                <div className="text-2xl font-black text-cyan-400 font-mono">
                  +{projectedClicks.toLocaleString('pt-BR')}
                </div>
                <p className="text-[10px] text-slate-500">Baseado no CPC atual de R$ {metrics.costPerClick.toFixed(2)}</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Leads / Mensagens WA</span>
                <div className="text-2xl font-black text-amber-300 font-mono">
                  +{projectedLeads.toLocaleString('pt-BR')}
                </div>
                <p className="text-[10px] text-slate-500">Baseado no CPL atual de R$ {metrics.cpl.toFixed(2)}</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 space-y-2 bg-emerald-950/20">
                <span className="text-xs font-bold text-emerald-300 block">Faturamento Retorno ROAS (4.8x)</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  R$ {projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-emerald-300 font-semibold">Estimativa de receita direta gerada</p>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
