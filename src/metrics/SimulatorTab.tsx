// src/metrics/SimulatorTab.tsx
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

export const SimulatorTab: React.FC<MetricsTabSharedProps> = (props) => {
  const {
    client, metrics, channels, currentUserRole, onChangeMetricsAccess,
    selectedYear, setSelectedYear, timeRange, setTimeRange,
    simulatedBudget, setSimulatedBudget,
    comp, monthlyReachData, competitorBarData, formatData,
    projectedReach, projectedClicks, projectedLeads, projectedRevenue
  } = props;

  return (
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
  );
};
