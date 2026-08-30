// src/metrics/PaidTrafficTab.tsx
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

export const PaidTrafficTab: React.FC<MetricsTabSharedProps> = (props) => {
  const {
    client, metrics, channels, currentUserRole, onChangeMetricsAccess,
    selectedYear, setSelectedYear, timeRange, setTimeRange,
    simulatedBudget, setSimulatedBudget,
    comp, monthlyReachData, competitorBarData, formatData,
    projectedReach, projectedClicks, projectedLeads, projectedRevenue
  } = props;

  return (
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

  );
};
