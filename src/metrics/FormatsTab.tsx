// src/metrics/FormatsTab.tsx
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

export const FormatsTab: React.FC<MetricsTabSharedProps> = (props) => {
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

  );
};
