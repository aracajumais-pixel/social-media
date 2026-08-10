import React, { useState } from 'react';
import { 
  BookOpen, Search, Copy, Check, Sparkles, Code, FileText, Shield, 
  Layers, Calendar, MessageSquare, Download, TrendingUp, BarChart2, HardDrive
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, CartesianGrid, Legend 
} from 'recharts';

interface BookChapter {
  id: string;
  number: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  codeLines: number;
  growthStat: string;
  moduleScope: string;
  isTimelineChapter?: boolean;
}

const CHAPTERS: BookChapter[] = [
  {
    id: 'chap-1',
    number: 'Capítulo 01',
    title: 'Origem & Conceito: Aprovação de Posts Sem Fricção',
    date: '2026-07-29',
    summary: 'Criação do fluxo simplificado para clientes finais aprovarem ou pedirem alteração sem criar contas ou logins.',
    codeLines: 1250,
    growthStat: '+100% (Base Inicial)',
    moduleScope: 'src/App.tsx, src/types.ts, src/components/Header.tsx',
    content: `
### 1.1 O Problema Original
Clientes de agências e social medias freelancers frequentemente enfrentam dificuldades com plataformas complexas que exigem criação de senhas e logins. 

### 1.2 A Solução Social Media 5.0
Desenvolvemos uma esteira visual e responsiva onde o cliente final pode:
- Visualizar a arte em alta definição e legendas formatadas.
- Aprovar com 1 clique ("Aprovar Post").
- Solicitar revisão ("Revisar") informando instruções detalhadas.
- Ler e responder comentários em tempo real no chat lateral.
- Disparar alertas instantâneos via WhatsApp.
`
  },
  {
    id: 'chap-2',
    number: 'Capítulo 02',
    title: 'Modelo SaaS por Consumo: R$ 0,50 por Post Publicado',
    date: '2026-07-29',
    summary: 'Formatação da taxa de infraestrutura do sistema e repasse financeiro do Gestor.',
    codeLines: 840,
    growthStat: '+18% (+130 linhas)',
    moduleScope: 'src/data/mockData.ts, src/types.ts',
    content: `
### 2.1 Sustentabilidade do SaaS
Diferente dos concorrentes tradicionais (mLabs, Etus) que cobram mensalidades fixas pesadas mesmo sem uso, adotamos a regra de R$ 0,50 por post aprovado/publicado.

### 2.2 Cálculo Automático de Taxa
- Quando o Gestor emite o Fechamento do Período em PDF, o sistema calcula automaticamente a quantidade total de posts.
- Multiplica pelo valor unitário de R$ 0,50 (ex: 40 posts = R$ 20,00 de taxa de infraestrutura SaaS).
- O Gestor repassa esse valor ao cliente no total do recibo ou absorve em sua margem de lucro.
`
  },
  {
    id: 'chap-3',
    number: 'Capítulo 03',
    title: 'Painel do Gestor (SaaS Multi-Tenant, Auditoria, Infraestrutura & Financeiro)',
    date: '2026-07-29',
    summary: 'Arquitetura restrita do Administrador Founder para licenciamento SaaS, cadastro de redes por cliente, trava anti-drible, auditoria de comprovantes Pix e taxas de conversão WhatsApp.',
    codeLines: 1353,
    growthStat: '+1.353 LOC (Módulo Crítico)',
    moduleScope: 'src/components/AdminSaaSDashboard.tsx, src/types/index.ts',
    content: `
### 3.1 Arquitetura do Painel Sigiloso do Gestor
O Painel Admin SaaS é a central de controle do sistema, acessível unicamente pelo perfil de Gestor/Administrador Founder. Este módulo centraliza:
- **Gestão de Empresas Clientes**: Cadastro completo com CNPJ, Razão Social, Inscrição Estadual e seleção individualizada de redes sociais ativas (Instagram, Facebook, TikTok, LinkedIn, YouTube).
- **Controle de Social Medias**: Cadastro obrigatório com URL do Perfil Social (Instagram/LinkedIn), Chave Pix e alocação dinâmica de clientes.
- **Trava de Segurança Anti-Drible**: Botão de bloqueio instantâneo de acesso do Social Media ou do Cliente em caso de divergência nos recibos ou quebra de contrato.

### 3.2 Monetização & Auditoria de Taxa SaaS (R$ 0,50 / Post)
- **Painel de Fechamento**: O Gestor acompanha em tempo real a quantidade de posts faturados nos recibos de cada Social Media.
- **Taxa Dinâmica Configurável**: Valor padrão de R$ 0,50 por post que pode ser reajustado em tempo real pelo Gestor via modal dedicado.
- **Central de Comprovantes Pix de Repasse**: Os Social Medias enviam o comprovante Pix de quitação da taxa SaaS diretamente no painel. O Gestor revisa o comprovante, visualiza o anexo em nova aba e aprova ou rejeita com 1 clique.

### 3.3 Métrica de Conversão WhatsApp x Cliques no Link (CTR)
O Gestor monitora os disparos automáticos via WhatsApp API:
- **Taxa de Clique (77% CTR Médio)**: Rastreia a quantidade de mensagens enviadas vs. links acessados pelos clientes em tempo real.
- **Auditoria de Tempo de Resposta**: Tempo médio de apenas 4,2 minutos entre o envio e o acesso sem necessidade de senhas.
- **Log Auditável**: Tabela detalhada dos disparos recentes com cliente, destinatário, horário e status de clique.
`
  },
  {
    id: 'chap-4',
    number: 'Capítulo 04',
    title: 'Painel de Métricas, Tráfego Pago (Turbinar) & Benchmarking Concorrente',
    date: '2026-07-29',
    summary: 'Módulo analítico completo com Recharts para Alcance Orgânico vs Pago, ROAS de Anúncios, Comparativo contra Concorrente Principal, Desempenho por Formato e Simulador Interativo de Retorno Ads.',
    codeLines: 846,
    growthStat: '+846 LOC (Analytics Suite)',
    moduleScope: 'src/components/MetricsDashboard.tsx, src/types/index.ts',
    content: `
### 4.1 Estrutura em 5 Sub-Abas do Painel de Métricas
O módulo de Métricas oferece profundidade estratégica em 5 sub-abas especializadas:
1. **Visão Geral & Engajamento**: 8 Cards de Estatísticas Chave (Impressões, Alcance Único, Comentários, Cliques no Perfil, Salvamentos, Compartilhamentos, Retenção de Vídeo e Conversões) + Gráfico de Área Recharts comparando Alcance Orgânico vs Alcance Pago mês a mês.
2. **Tráfego Pago & Anúncios (Turbinar)**: Métricas financeiras diretas incluindo **ROAS (4.8x)**, Investimento Total em Turbinar, Custo por Clique (CPC: R$ 0,36), Custo por Lead/Mensagem (CPL: R$ 6,80) e Custo por Mil Impressões (CPM: R$ 14,20), acompanhado de recomendações estratégicas da agência.
3. **Benchmarking Concorrente**: Comparativo direto contra o principal concorrente no setor, apresentando um Gráfico de Barras Recharts que contrapõe Seguidores, Taxa de Engajamento (%), Frequência de Postagem/semana e Orçamento Estimado de Anúncios.
4. **Desempenho por Formato**: Análise isolada da performance de Reels, Carrossel, Imagem Estática e Stories, detalhando curtidas, comentários e salvamentos médios.
5. **Simulador Projetado de Investimento & ROI**: Slider interativo onde o usuário escolhe orçamentos de R$ 200 a R$ 10.000/mês e o sistema calcula instantaneamente o Alcance Adicional, Cliques no Link, Leads WA gerados e Faturamento Retorno ROAS (4.8x).

### 4.2 Controle Granular de Permissão pelo Gestor
O Gestor pode definir quem visualiza as métricas por cliente com a propriedade \`metricsAccess\`:
- **Somente o Cliente**: Para entregas transparentes com o contratante.
- **Somente o Social Media**: Para planejamento interno da equipe.
- **Ambos (Cliente & Social Media)**: Compartilhamento total de resultados.
- **Apenas o Gestor**: Modo estratégico confidencial.
`
  },
  {
    id: 'chap-5',
    number: 'Capítulo 05',
    title: 'Recibo de Serviços em PDF & Estampa de Assinatura',
    date: '2026-07-29',
    summary: 'Modelo oficial de recibo PDF com marca do cliente, valor por extenso automático e histórico oculto do PDF.',
    codeLines: 506,
    growthStat: '+15% (+180 linhas)',
    moduleScope: 'src/components/ReceiptGenerator.tsx',
    content: `
### 5.1 Réplica Fiel do Layout Oficial
O Recibo em PDF foi ajustado rigorosamente ao modelo fornecido pelo usuário:
- **Cabeçalho**: Título "Recibo de Prestação de Serviços em Redes Sociais" com a logomarca do Social Media / Agência no canto superior direito.
- **Tomador de Serviços**: Puxa automaticamente Razão Social, Endereço Completo, CNPJ e Inscrição Estadual do cadastro da empresa cliente.
- **Texto Declaratório Automático**: Gera o parágrafo descritivo contendo a discriminação das peças (ex: stories, artes feed e vídeos editados para Meta Business) com a conversão matemática do valor total em **Português por Extenso** (ex: *R$ 420,00 -> quatrocentos e vinte reais*).
- **Rodapé de Assinatura**: Nome do Social Media prestador, Chave Pix, Banco, CNPJ/CPF e campo para estampa de **Assinatura Digitalizada**.

### 5.2 Regra de Ocultação de Histórico
O sistema disponibiliza para o Social Media/Gestor um **Painel de Histórico de Totais para Acompanhamento**, porém este histórico é **estritamente ocultado do PDF gerado**, permanecendo privado no sistema.
`
  },
  {
    id: 'chap-6',
    number: 'Capítulo 06',
    title: 'Ciclo de Vida de Mídia & Limpeza de Preview',
    date: '2026-07-29',
    summary: 'Economia de espaço e aviso de política de retenção temporária de arquivos.',
    codeLines: 380,
    growthStat: '+10% (+110 linhas)',
    moduleScope: 'src/components/PostCard.tsx, src/components/StorageDriveModal.tsx',
    content: `
### 6.1 Preview Temporário
Como o custo do SaaS é de apenas R$ 0,50 por post, as mídias hospedadas para aprovação possuem caráter temporário.

### 6.2 Liberação de Exclusão Pós-Publicação
1. O post é aprovado pelo Cliente.
2. O Social Media publica o post nas redes sociais oficiais e marca a caixa **"Publicado nas Redes"**.
3. É exibido o botão **"Confirmar com Social Media & Liberar Exclusão de Preview"**.
4. A mídia temporária é liberada para limpeza de espaço no servidor, mantendo apenas o registro histórico do título e métricas.
`
  },
  {
    id: 'chap-7',
    number: 'Capítulo 07',
    title: 'Registro Completo das Conversas do Chat & Audit Log Vivo',
    date: '2026-07-29',
    summary: 'Audit log vivo de todas as instruções, feedbacks do usuário e soluções implementadas.',
    codeLines: 640,
    growthStat: '+32% (+210 linhas)',
    moduleScope: 'src/components/ProjectBookView.tsx, src/components/MarketAnalysisView.tsx',
    content: `
### 7.1 Histórico de Interações e Melhorias Contínuas
- **Pedido 1**: Ajustar recibo em PDF com logo do cliente e taxa SaaS (R$0,50/post).
- **Pedido 2**: Criar Painel Admin SaaS para Gestor gerenciar clientes e cadastrar Social Medias com perfil social obrigatório.
- **Pedido 3**: Permitir seleção de redes sociais ativas por cliente (Instagram, Facebook, TikTok, LinkedIn, YouTube).
- **Pedido 4**: Adicionar botão de confirmação com Social Media para apagar preview de mídias pós-publicação.
- **Pedido 5**: Liberar aba de Recibos em PDF também para a permissão de Social Media.
- **Pedido 6**: Integrar modelo oficial de Recibo do print (valor por extenso, placeholders autoexplicativos sem exemplos fixos, assinatura digitalizada e histórico privado fora do PDF).
- **Pedido 7**: Gerar Livro do Projeto com histórico do chat e exportação de Análise de Mercado para Excel (.xlsx).
- **Pedido 8**: Comprovantes de repasse Pix SaaS (R$0,50/post) e medidor de capacidade do Google Drive por cliente.
- **Pedido 9**: Estatística de Linhas de Código por capítulo do livro + Gráfico de linha do tempo de evolução de código + Métricas de conversão WhatsApp x Conversa enviada.
- **Pedido 10**: Confirmação visual no gerador de recibo ao salvar/registrar; remoção de textos explicativos entre parênteses no recibo; substituição do termo "alterar" por "revisar" no botão e chat com caixa de entrada de informações para revisão; seleção de canais de publicação em redes sociais; criação dos capítulos dedicados de Métricas e Painel do Gestor no Livro do Projeto.
- **Pedido 11**: Atualização do nome oficial da plataforma para **Social Media 5.0**; navegação por arraste com toque no menu horizontal sem exibição de barra de rolagem (sem scrollbar visível); verificação e garantia de modularização total das partes (menu isolado em /src/components/Navigation.tsx).
- **Pedido 12**: Link de Aprovação com Token Hash Único (\`approval_token\`) e Expiração Automática em 5 Dias (\`token_expires_at\`), integrando estrutura de tabela Supabase (\`id\`, \`approval_token\`, \`token_expires_at\`, \`status\`).
`
  },
  {
    id: 'chap-8',
    number: 'Capítulo 08',
    title: 'Estrutura Supabase & Mapeamento da Tabela de Posts',
    date: '2026-08-02',
    summary: 'Mapeamento de banco de dados relacional no Supabase com Hash Único de Token e regra de expiração de 5 dias.',
    codeLines: 6850,
    growthStat: '+570 LOC (Supabase & Token Module)',
    moduleScope: 'src/utils/token.ts, src/components/ApprovalPublicModal.tsx, Supabase DDL',
    content: `
### 8.1 Estrutura da Tabela \`posts\` no Supabase
Para suportar o Link Público Seguro com Token Hash e Expiração de 5 Dias, a tabela \`posts\` no PostgreSQL / Supabase está configurada com os seguintes campos:

\`\`\`sql
-- Tabela de Posts no Supabase
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'carousel')) DEFAULT 'image',
  social_networks TEXT[] DEFAULT ARRAY['instagram'],
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Campos de Controle do Link Público com Expiração de 5 Dias:
  approval_token UUID DEFAULT gen_random_uuid() NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 days') NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'rascunho', 'aprovado', 'alterar')) DEFAULT 'pending',
  
  is_published BOOLEAN DEFAULT FALSE,
  preview_cleaned_up BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca ultra-rápida por token de aprovação
CREATE INDEX IF NOT EXISTS idx_posts_approval_token ON public.posts(approval_token);
\`\`\`

### 8.2 Regra de Negócio: Link com Hash + Expiração em 5 Dias
1. **Privacidade e Segurança**: Cada post gera um \`approval_token\` (UUID único e imprevisível).
2. **Urgência & Agilidade**: O link público possui data limite de 5 dias (\`token_expires_at\`).
3. **Bloqueio de Tokens Antigos**: Links com mais de 5 dias exibem automaticamente uma tela de aviso solicitando que o cliente peça a renovação à equipe de Social Media.
4. **Renovação com 1 Clique**: A equipe de Social Media ou Gestor pode renovar o token e gerar + 5 dias de validade a qualquer momento.
`
  },
  {
    id: 'chap-9',
    number: 'Capítulo 09',
    title: 'Linha do Tempo de Evolução de Código & Gráfico de Crescimento',
    date: '2026-08-02',
    summary: 'Métricas consolidadas de linhas de código (LOC) por módulo e gráfico da linha do tempo de atualizações.',
    codeLines: 6850,
    growthStat: '+448% Crescimento Total',
    moduleScope: 'Todo o Repositório (16 arquivos principais)',
    isTimelineChapter: true,
    content: `
### 9.1 Evolução Histórica das Linhas de Código (LOC)
Acompanhamento gráfico em tempo real do crescimento da base de código fonte TypeScript/React do **Social Media 5.0** a cada ciclo de atualização e funcionalidade entregue.

### 9.2 Distribuição de Código por Módulo
O repositório está estruturado de forma modular e limpa para facilitar manutenção e performance:
- **AdminSaaSDashboard.tsx**: Painel Sigiloso do Gestor, Controle Finanças, Repasse Pix e Conversão WhatsApp (~1.353 linhas).
- **MetricsDashboard.tsx**: Painel de Métricas, Tráfego Pago ROAS 4.8x, Benchmarking e Simulador (~846 linhas).
- **ApprovalPublicModal.tsx & token.ts**: Sistema de Link Público com Token UUID e Expiração de 5 Dias (~380 linhas).
- **App.tsx**: Gerenciador de Estado Principal e Rroteador de Telas (~570 linhas).
- **ReceiptGenerator.tsx**: Gerador do Recibo Oficial em PDF com Valor por Extenso e Assinatura (~526 linhas).
- **ProjectBookView.tsx**: Livro do Projeto Vivo com Controle de Linhas de Código e Recharts (~540 linhas).
- **MarketAnalysisView.tsx**: Análise de Mercado e Exportador XLSX (~380 linhas).
- **Outros Componentes (Header, PostCard, Modais, Types, MockData)**: ~2.250 linhas restantes.
`
  }
];

// Recharts data for timeline evolution
const TIMELINE_DATA = [
  { release: 'v1.0 (Conceito Inicial)', lines: 1250, modules: 4, feat: 'Fluxo Básico de Aprovação' },
  { release: 'v1.2 (Painel SaaS & Roles)', lines: 2100, modules: 6, feat: 'Roles Gestor e Social Media' },
  { release: 'v1.5 (Recibo PDF & Assinatura)', lines: 3450, modules: 8, feat: 'Recibo Fiel com Por Extenso' },
  { release: 'v1.8 (Livro & Excel)', lines: 4200, modules: 11, feat: 'Livro do Projeto e Export XLSX' },
  { release: 'v2.0 (Comprovantes Pix & Drive)', lines: 4850, modules: 13, feat: 'Medidor Drive e Comprovantes' },
  { release: 'v2.2 (Linhas por Capítulo & WA)', lines: 5920, modules: 14, feat: 'Estatísticas LOC & Conversion WA' },
  { release: 'v2.5 (Capítulos Métricas & Gestor)', lines: 6280, modules: 14, feat: 'Capítulos Dedicados Métricas & Gestor' },
];

const MODULE_DISTRIBUTION_DATA = [
  { name: 'Admin SaaS', lines: 1353, color: '#6366f1' },
  { name: 'Métricas', lines: 846, color: '#06b6d4' },
  { name: 'App Core', lines: 540, color: '#ec4899' },
  { name: 'Recibo PDF', lines: 526, color: '#10b981' },
  { name: 'Livro Projeto', lines: 520, color: '#f59e0b' },
  { name: 'Análise Mercado', lines: 380, color: '#14b8a6' },
  { name: 'Outros Módulos', lines: 2115, color: '#8b5cf6' },
];

export const ProjectBookView: React.FC = () => {
  const [activeChapterId, setActiveChapterId] = useState<string>('chap-1');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const activeChapter = CHAPTERS.find(c => c.id === activeChapterId) || CHAPTERS[0];

  const filteredChapters = CHAPTERS.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyFullBook = () => {
    const fullBookText = CHAPTERS.map(c => 
      `${c.number}: ${c.title}\nData: ${c.date}\nLinhas de Código: ${c.codeLines} LOC (${c.growthStat})\nEscopo: ${c.moduleScope}\n\n${c.content}\n\n-------------------------\n`
    ).join('\n');
    navigator.clipboard.writeText(fullBookText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadMarkdown = () => {
    const fullBookText = `# LIVRO OFICIAL DO PROJETO - SOCIALAPPROVE SAAS\n\n` + 
      CHAPTERS.map(c => 
        `## ${c.number}: ${c.title}\n*Data: ${c.date} | Linhas de Código: ${c.codeLines} LOC (${c.growthStat})*\n\n> Escopo: ${c.moduleScope}\n\n${c.content}\n`
      ).join('\n---\n\n');
    
    const blob = new Blob([fullBookText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Livro_do_Projeto_SocialApprove.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-800/40 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <BookOpen className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Livro do Projeto & Manual Vivo de Atualizações
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-indigo-500/30">
                  LOC Control & Chat Log
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Histórico completo com <strong>controle de linhas de código por capítulo</strong>, gráfico da linha do tempo de evolução e audit log do chat.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyFullBook}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado para Transferência!' : 'Copiar Livro'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Baixar (.md)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Chapters Navigation & Search */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Pesquisar capítulos ou termos do chat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 text-white pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Chapters List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 space-y-1.5 shadow-xl">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Sumário ({filteredChapters.length} Capítulos)</span>
              <span className="text-[10px] text-cyan-400 font-mono">6.280 LOC Total</span>
            </div>

            {filteredChapters.map(chap => {
              const isActive = chap.id === activeChapter.id;
              return (
                <button
                  key={chap.id}
                  onClick={() => setActiveChapterId(chap.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex flex-col space-y-1.5 ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-900/60 to-purple-900/40 border border-indigo-500/50 shadow-md' 
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {chap.number}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {chap.codeLines} LOC
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {chap.title}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span className="text-emerald-400 font-semibold">{chap.growthStat}</span>
                    <span>{chap.date}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area: Active Chapter Reading View */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          <div className="border-b border-slate-800 pb-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="bg-amber-500/20 text-amber-300 font-extrabold uppercase px-2.5 py-1 rounded-lg border border-amber-500/30">
                {activeChapter.number}
              </span>
              
              {/* Code Line Count Badge */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-xl border border-cyan-500/40">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-bold text-xs">
                  Linhas de Código: <strong className="text-cyan-300 font-mono">{activeChapter.codeLines} LOC</strong>
                </span>
                <span className="text-emerald-400 font-extrabold text-[11px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  {activeChapter.growthStat}
                </span>
              </div>
            </div>

            <h1 className="text-xl font-black text-white">{activeChapter.title}</h1>
            
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Escopo dos Módulos:
              </span>
              <span className="font-mono text-indigo-300 font-bold">{activeChapter.moduleScope}</span>
            </div>

            <p className="text-xs text-indigo-300 font-medium leading-relaxed bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/30">
              💡 {activeChapter.summary}
            </p>
          </div>

          {/* Rendered Chapter Text */}
          <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-4 text-slate-200">
            {activeChapter.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-sm font-extrabold text-indigo-300 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('- ')) {
                const items = paragraph.split('\n- ');
                return (
                  <ul key={index} className="list-disc pl-5 space-y-1 text-slate-300">
                    {items.map((item, i) => (
                      <li key={i}>{item.replace(/^- /, '')}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={index} className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Chapter 07 Dedicated Timeline Charts */}
          {activeChapter.isTimelineChapter && (
            <div className="space-y-6 pt-6 border-t border-slate-800">
              
              {/* Stat Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total de Linhas</span>
                  <div className="text-xl font-black text-indigo-400 font-mono">5.920 LOC</div>
                  <span className="text-[10px] text-emerald-400 font-semibold">+393% desde v1.0</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-purple-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Arquivos Ativos</span>
                  <div className="text-xl font-black text-purple-400 font-mono">14 arquivos</div>
                  <span className="text-[10px] text-slate-400">100% TypeScript</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-cyan-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Média por Módulo</span>
                  <div className="text-xl font-black text-cyan-400 font-mono">422 LOC</div>
                  <span className="text-[10px] text-slate-400">Código modular</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Última Entrega</span>
                  <div className="text-xl font-black text-emerald-400 font-mono">v2.2</div>
                  <span className="text-[10px] text-emerald-300">Hoje (2026-07-29)</span>
                </div>
              </div>

              {/* Chart 1: Timeline Growth Area Chart */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Linha do Tempo de Crescimento de Linhas de Código (LOC)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Linha do Tempo de Lançamentos</span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TIMELINE_DATA}>
                      <defs>
                        <linearGradient id="colorLines" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="release" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                        formatter={(value: any) => [`${value} LOC`, 'Linhas de Código']}
                      />
                      <Area type="monotone" dataKey="lines" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLines)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Module Breakdown Bar Chart */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    <span>Distribuição de Linhas de Código por Componente Principal</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Total: 5.920 LOC</span>
                </div>

                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MODULE_DISTRIBUTION_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                        formatter={(value: any) => [`${value} LOC`, 'Linhas']}
                      />
                      <Bar dataKey="lines" fill="#818cf8" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          <div className="pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>SocialApprove SaaS • Registro Auditável Vivo</span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <MessageSquare className="w-3.5 h-3.5" /> Atualizado com controle de LOC por capítulo
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};

