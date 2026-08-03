import React from 'react';
import { UserRole, MetricsVisibility } from '../types';
import { CheckCircle2, Lightbulb, FileText, BarChart3, Settings, Lock, Sparkles, BookOpen, FileSpreadsheet } from 'lucide-react';

export type TabType = 'posts' | 'inspirations' | 'billing' | 'metrics' | 'settings' | 'admin' | 'book' | 'market';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentUserRole: UserRole;
  metricsAccess: MetricsVisibility;
  draftsCount: number;
  changesRequestedCount: number;
  inspirationsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  currentUserRole,
  metricsAccess,
  draftsCount,
  changesRequestedCount,
  inspirationsCount
}) => {
  // Regra de quem pode visualizar as Métricas
  const canViewMetrics =
    currentUserRole === 'gestor' ||
    metricsAccess === 'ambos' ||
    (metricsAccess === 'cliente' && currentUserRole === 'cliente') ||
    (metricsAccess === 'social_media' && currentUserRole === 'social_media');

  return (
    <nav className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-3 overflow-x-auto no-scrollbar py-2">
          
          {/* Tab 1: Posts & Aprovações */}
          <button
            onClick={() => onTabChange('posts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'posts'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mural de Posts & Aprovações</span>
            {(draftsCount > 0 || changesRequestedCount > 0) && (
              <span className="flex items-center gap-1 ml-1">
                {draftsCount > 0 && (
                  <span className="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-1.5 py-0.2 rounded-full border border-amber-500/30" title="Rascunhos pendentes">
                    {draftsCount}
                  </span>
                )}
                {changesRequestedCount > 0 && (
                  <span className="bg-rose-500/20 text-rose-300 text-[11px] font-bold px-1.5 py-0.2 rounded-full border border-rose-500/30" title="Ajustes solicitados">
                    {changesRequestedCount}
                  </span>
                )}
              </span>
            )}
          </button>

          {/* Tab 2: Inspirações & Referências do Cliente */}
          <button
            onClick={() => onTabChange('inspirations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'inspirations'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Inspirações & Modelos</span>
            {inspirationsCount > 0 && (
              <span className="bg-purple-500/20 text-purple-300 text-[11px] font-bold px-1.5 py-0.2 rounded-full border border-purple-500/30">
                {inspirationsCount}
              </span>
            )}
          </button>

          {/* Tab 3: Fechamento & Recibos PDF (Gestor & Social Media) */}
          {(currentUserRole === 'gestor' || currentUserRole === 'social_media') && (
            <button
              onClick={() => onTabChange('billing')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'billing'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Recibo PDF & Fechamento</span>
            </button>
          )}

          {/* Tab 4: Painel de Métricas Meta / Google */}
          <button
            onClick={() => {
              if (canViewMetrics) {
                onTabChange('metrics');
              }
            }}
            disabled={!canViewMetrics}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              !canViewMetrics
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : activeTab === 'metrics'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title={!canViewMetrics ? 'O Gestor restringiu o acesso ao painel de métricas para este perfil' : 'Meta Business Suite & Google Analytics'}
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Painel de Métricas</span>
            {!canViewMetrics && <Lock className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Tab 5: Configurações do Cliente */}
          {(currentUserRole === 'gestor' || currentUserRole === 'social_media') && (
            <button
              onClick={() => onTabChange('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Configurações do Cliente</span>
            </button>
          )}

          {/* Tab 6: PAINEL ADMIN SAAS (R$0,50/POST) - EXCLUSIVO DO GESTOR */}
          {currentUserRole === 'gestor' && (
            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap border ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/20'
                  : 'text-amber-300 border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Admin SaaS (R$0,50)</span>
            </button>
          )}

          {/* Tab 7: Livro do Projeto / Manual Vivo */}
          <button
            onClick={() => onTabChange('book')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'book'
                ? 'bg-amber-600 text-slate-950 font-extrabold shadow-md shadow-amber-600/20'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Livro do Projeto</span>
          </button>

          {/* Tab 8: Análise de Mercado Excel */}
          <button
            onClick={() => onTabChange('market')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'market'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-teal-400 hover:text-teal-300 hover:bg-teal-950/30'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>Análise de Mercado (.xlsx)</span>
          </button>

        </div>
      </div>
    </nav>
  );
};
