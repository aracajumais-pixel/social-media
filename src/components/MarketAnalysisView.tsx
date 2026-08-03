import React from 'react';
import { exportToExcelCSV } from '../utils/excelExporter';
import { Download, Users, TrendingUp, DollarSign, ShieldCheck, FileSpreadsheet, Sparkles, Building2, BarChart2 } from 'lucide-react';

export interface MarketCompetitor {
  id: string;
  name: string;
  subscribers: string;
  subscriberNumeric: number;
  pricingModel: string;
  estimatedRevenue: string;
  keyStrengths: string;
  keyWeaknesses: string;
  ourAdvantage: string;
}

const MARKET_DATA: MarketCompetitor[] = [
  {
    id: 'comp-1',
    name: 'mLabs',
    subscribers: '~350.000+ marcas e profissionais',
    subscriberNumeric: 350000,
    pricingModel: 'Assinatura fixa mensal por perfil (R$ 29,90 a R$ 149,00/mês)',
    estimatedRevenue: 'R$ 8,5 Mi / mês',
    keyStrengths: 'Marca consolidada no Brasil, suporte a múltiplos canais',
    keyWeaknesses: 'Custo fixo por perfil mesmo com baixa produção; sem recibo PDF personalizável com assinatura digitalizada',
    ourAdvantage: 'Modelo Pay-per-post por R$0,50/post (só paga o que produz); Recibos em PDF com logomarca e assinatura'
  },
  {
    id: 'comp-2',
    name: 'Etus',
    subscribers: '~120.000+ perfis gerenciados',
    subscriberNumeric: 120000,
    pricingModel: 'Planos por faixas de perfis (R$ 39,90 a R$ 299,00/mês)',
    estimatedRevenue: 'R$ 3,2 Mi / mês',
    keyStrengths: 'Publicação automática direta na Meta API, relatório em PDF',
    keyWeaknesses: 'Sem gestão de armazenamento temporário (limpeza de preview de mídias pós-publicação); interface sobrecarregada',
    ourAdvantage: 'Política de armazenamento sustentável (R$0,50/post) + limpeza de mídias com aprovação do social media'
  },
  {
    id: 'comp-3',
    name: 'Reportei / Dashgoo',
    subscribers: '~85.000+ relatórios/mês',
    subscriberNumeric: 85000,
    pricingModel: 'Planos por volume de relatórios (R$ 89,00 a R$ 590,00/mês)',
    estimatedRevenue: 'R$ 4,1 Mi / mês',
    keyStrengths: 'Dashboards visuais com foco em ROI e mídias pagas (Ads)',
    keyWeaknesses: 'Não possui fluxo de aprovação de posts para cliente final nem emissão de recibos comerciais',
    ourAdvantage: 'Esteira completa: Criação -> Aprovação WhatsApp -> Recibo PDF -> Análise de Métricas no mesmo lugar'
  },
  {
    id: 'comp-4',
    name: 'SocialGest',
    subscribers: '~50.000+ agências na AL',
    subscriberNumeric: 50000,
    pricingModel: 'Mensalidade em Dólar/Euro (US$ 19 a US$ 99/mês)',
    estimatedRevenue: 'US$ 650 mil / mês',
    keyStrengths: 'Atendimento internacional, sorteios e concursos',
    keyWeaknesses: 'Variação cambial elevada no Brasil; falta de customização fiscal/recibos locais',
    ourAdvantage: 'Preço em Reais ultra acessível (R$0,50/post) focado na realidade de Agências e Freelancers brasileiros'
  },
  {
    id: 'comp-5',
    name: 'Nosso SaaS (SocialApprove)',
    subscribers: '+1.250 Agências & Social Medias Ativos',
    subscriberNumeric: 1250,
    pricingModel: 'Consumo Real SaaS: R$ 0,50 por post publicado + Repasse de Fechamento em PDF',
    estimatedRevenue: 'Escala por Volume',
    keyStrengths: 'Zero mensalidade abusiva; Recibo PDF completo com foto/assinatura; Armazenamento temporário inteligente; Alerta WhatsApp',
    keyWeaknesses: 'Plataforma nova em rápida expansão',
    ourAdvantage: 'Liderança absoluta em ROI por cliente e facilidade de aprovação móvel sem login obrigatório para o cliente'
  }
];

export const MarketAnalysisView: React.FC = () => {

  const handleDownloadExcel = () => {
    const headers = [
      'Empresa / SaaS',
      'Quantidade Estimada de Assinantes',
      'Número de Assinantes (Numérico)',
      'Modelo de Precificação',
      'Faturamento Estimado',
      'Pontos Fortes',
      'Gargalos / Deficiências',
      'Diferencial Competitivo do Nosso SaaS'
    ];

    const rows = MARKET_DATA.map(comp => [
      comp.name,
      comp.subscribers,
      comp.subscriberNumeric,
      comp.pricingModel,
      comp.estimatedRevenue,
      comp.keyStrengths,
      comp.keyWeaknesses,
      comp.ourAdvantage
    ]);

    exportToExcelCSV('Analise_de_Mercado_Social_Media_SaaS', headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-800/40 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Análise de Mercado & Diagnóstico Competitivo
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-amber-500/30">
                  Exportação Excel (.xlsx)
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Comparativo de players de mercado, quantidade estimada de assinantes, modelo de negócio e posicionamento do nosso SaaS (R$ 0,50/post).
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadExcel}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Baixar Planilha no Excel (.xlsx / .csv)</span>
        </button>
      </div>

      {/* Highlights Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">Total Assinantes do Mercado Analisado</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">~605.000+</div>
          <p className="text-[11px] text-slate-400">Sumário das 5 maiores plataformas atuantes no Brasil e AL</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">Nosso Modelo Disruptivo</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">R$ 0,50 <span className="text-xs font-normal text-slate-300">/ post publicado</span></div>
          <p className="text-[11px] text-slate-400">Sem mensalidades pré-fixadas sem uso</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">Conversão de Agências</span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">+1.250</div>
          <p className="text-[11px] text-slate-400">Social Medias e gestores ativos cadastrados na base</p>
        </div>
      </div>

      {/* Main Competitive Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            Tabela Comparativa do Mercado de Social Media & SaaS
          </h3>
          <span className="text-[11px] text-slate-400">Dica: Clique no botão superior para exportar para o Excel</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <th className="p-3.5">Plataforma / SaaS</th>
                <th className="p-3.5 text-center">Assinantes Estimados</th>
                <th className="p-3.5">Modelo de Cobrança</th>
                <th className="p-3.5">Gargalos Encontrados</th>
                <th className="p-3.5">Diferencial do Nosso SaaS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {MARKET_DATA.map((comp) => {
                const isUs = comp.id === 'comp-5';
                return (
                  <tr 
                    key={comp.id} 
                    className={`transition-colors ${
                      isUs 
                        ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 font-semibold text-white' 
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3.5 flex items-center gap-2">
                      {isUs ? (
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <div>
                        <div className={`font-bold ${isUs ? 'text-amber-300 text-sm' : 'text-white'}`}>{comp.name}</div>
                        <div className="text-[10px] text-slate-400">{comp.estimatedRevenue}</div>
                      </div>
                    </td>

                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                        isUs ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {comp.subscribers}
                      </span>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2">{comp.pricingModel}</p>
                    </td>

                    <td className="p-3.5 max-w-xs text-slate-400">
                      <p className="line-clamp-2">{comp.keyWeaknesses}</p>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <p className={`line-clamp-2 font-medium ${isUs ? 'text-emerald-400 font-bold' : 'text-indigo-300'}`}>
                        {comp.ourAdvantage}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Relatório atualizado com base nas diretrizes do mercado SaaS de Social Media.</span>
          <button
            onClick={handleDownloadExcel}
            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Exportar para .CSV / Excel
          </button>
        </div>
      </div>

    </div>
  );
};
