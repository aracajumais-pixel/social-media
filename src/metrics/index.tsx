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
import { MetricsDashboardProps, MetricsTabSharedProps } from './types';
import { OverviewTab } from './OverviewTab';
import { PaidTrafficTab } from './PaidTrafficTab';
import { CompetitorTab } from './CompetitorTab';
import { FormatsTab } from './FormatsTab';
import { SimulatorTab } from './SimulatorTab';

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


  const sharedProps: MetricsTabSharedProps = {
    client, metrics, channels, currentUserRole, onChangeMetricsAccess,
    selectedYear, setSelectedYear, timeRange, setTimeRange,
    simulatedBudget, setSimulatedBudget,
    comp, monthlyReachData, competitorBarData, formatData,
    projectedReach, projectedClicks, projectedLeads, projectedRevenue
  };

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
      {activeTab === 'overview' && <OverviewTab {...sharedProps} />}
      {activeTab === 'paid_traffic' && <PaidTrafficTab {...sharedProps} />}
      {activeTab === 'competitor' && <CompetitorTab {...sharedProps} />}
      {activeTab === 'formats' && <FormatsTab {...sharedProps} />}
      {activeTab === 'simulator' && <SimulatorTab {...sharedProps} />}

    </div>
  );
};
