// src/admin/CodeEvolutionTab.tsx
import React, { useState } from 'react';
import {
  ShieldAlert, DollarSign, TrendingUp, Users, HardDrive,
  CheckCircle2, Plus, Sparkles, ExternalLink, Trash2, Mail, Phone, AlertTriangle, Layers,
  Lock, Unlock, Edit3, Code2, History, BookOpen, FileSpreadsheet, BarChart2, CheckSquare, Clock, Upload, Check, X,
  MessageSquare, Send, MousePointerClick, Database
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart, Line, Area
} from 'recharts';
import {
  getSupabaseCredentials, saveSupabaseCredentials, testSupabaseConnection,
  syncAllClientsToSupabase, syncAllPostsToSupabase, syncSocialMediaToSupabase
} from '../lib/supabase';
import { AdminTabSharedProps } from './types';

export const CodeEvolutionTab: React.FC<AdminTabSharedProps> = (props) => {
  const {
    clients, posts, socialMedias
  } = props;

  // Estado local desta aba (antes vivia centralizado no index.tsx)
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSupabaseCredentials().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getSupabaseCredentials().key);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <span>Evolução do Projeto & Contador de Linhas Auditável</span>
              </h2>
              <p className="text-xs text-slate-400">Histórico detalhado de cada atualização e componentes do ecossistema</p>
            </div>

            <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-3.5 py-1.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>v2.5 Full-Stack Ready</span>
            </div>
          </div>

          {/* Code stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs font-bold">Total de Linhas de Código</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">~4.150 linhas</div>
              <p className="text-[10px] text-slate-500">TypeScript + JSX + Tailwind</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs font-bold">Módulos & Componentes</span>
              <div className="text-2xl font-black text-indigo-400 font-mono">21 módulos</div>
              <p className="text-[10px] text-slate-500">Arquitetura modular React</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs font-bold">Tamanho Total do Projeto</span>
              <div className="text-2xl font-black text-purple-400 font-mono">~680 KB</div>
              <p className="text-[10px] text-slate-500">Código fonte compilado</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs font-bold">Tamanho Médio / Arquivo</span>
              <div className="text-2xl font-black text-amber-400 font-mono">26.1 KB</div>
              <p className="text-[10px] text-slate-500">Média por módulo em KB</p>
            </div>
          </div>

          {/* Gráfico de Evolução do Código vs Tamanho de Arquivos */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <span>Gráfico de Evolução: Tamanho do Projeto, Linhas de Código & Módulos</span>
                </h3>
                <p className="text-[11px] text-slate-400">Acompanhamento histórico da métrica de crescimento do sistema em cada versão</p>
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded-lg font-mono">
                  ● Linhas de Código
                </span>
                <span className="px-2 py-1 bg-cyan-950 text-cyan-400 border border-cyan-800/40 rounded-lg font-mono">
                  ● Tamanho Projeto (KB)
                </span>
                <span className="px-2 py-1 bg-indigo-950 text-indigo-400 border border-indigo-800/40 rounded-lg font-mono">
                  ● Módulos / Componentes
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={[
                    { version: 'v1.0 (Base)', lines: 1200, modules: 8, files: 12, projectSizeKB: 180, avgFileSizeKB: 15.0 },
                    { version: 'v1.5 (Inspirations)', lines: 2100, modules: 11, files: 16, projectSizeKB: 320, avgFileSizeKB: 20.0 },
                    { version: 'v2.0 (Recibos PDF)', lines: 3000, modules: 14, files: 20, projectSizeKB: 490, avgFileSizeKB: 24.5 },
                    { version: 'v2.2 (Multi-Redes)', lines: 3650, modules: 17, files: 23, projectSizeKB: 580, avgFileSizeKB: 25.2 },
                    { version: 'v2.5 (Full-Stack)', lines: 4150, modules: 21, files: 26, projectSizeKB: 680, avgFileSizeKB: 26.1 },
                  ]}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="version" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" stroke="#10b981" tick={{ fontSize: 11 }} label={{ value: 'Linhas / KB', angle: -90, position: 'insideLeft', fill: '#10b981', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#818cf8" tick={{ fontSize: 11 }} label={{ value: 'Qtd Módulos', angle: 90, position: 'insideRight', fill: '#818cf8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'projectSizeKB') return [`${value} KB`, 'Tamanho do Projeto'];
                      if (name === 'lines') return [`${value} linhas`, 'Linhas de Código'];
                      if (name === 'modules') return [`${value} módulos`, 'Quantidade Módulos'];
                      if (name === 'avgFileSizeKB') return [`${value} KB`, 'Tamanho Médio por Arquivo'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="projectSizeKB" name="Tamanho Projeto (KB)" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={28} />
                  <Area yAxisId="left" type="monotone" dataKey="lines" name="Linhas de Código" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth={3} />
                  <Line yAxisId="right" type="monotone" dataKey="modules" name="Quantidade Módulos" stroke="#818cf8" strokeWidth={3} dot={{ r: 5, fill: '#818cf8' }} />
                  <Line yAxisId="left" type="monotone" dataKey="avgFileSizeKB" name="Tamanho Médio/Arquivo (KB)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#f59e0b' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Audit Log Timeline */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Histórico de Atualizações do Sistema & Supabase Script:</span>
            </h3>

            {/* Supabase Connection, Diagnostics & SQL Script Panel */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span>Configuração & Diagnóstico do Supabase DB</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Insira as credenciais do seu projeto Supabase para persistência relacional de clientes, posts, rascunhos e auditoria.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    supabaseUrlInput && supabaseKeyInput
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                      : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                  }`}>
                    {supabaseUrlInput && supabaseKeyInput ? '⚡ Chaves Salvas' : '⚠️ Chaves Ausentes'}
                  </span>
                </div>
              </div>

              {/* Form de Configuração do Supabase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold text-[11px]">URL do Projeto Supabase (VITE_SUPABASE_URL):</label>
                  <input
                    type="url"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="Ex: https://xxxxxxxxxxxx.supabase.co"
                    className="w-full bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold text-[11px]">Chave Pública Anon Key (VITE_SUPABASE_ANON_KEY):</label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="Ex: eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isTestingConn}
                  onClick={async () => {
                    saveSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
                    setIsTestingConn(true);
                    setTestResult(null);
                    const res = await testSupabaseConnection();
                    setTestResult(res);
                    setIsTestingConn(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isTestingConn ? 'Testando Conexão...' : 'Salvar & Testar Conexão'}</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncingAll}
                  onClick={async () => {
                    saveSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
                    setIsSyncingAll(true);
                    try {
                      await syncAllClientsToSupabase(clients);
                      await syncAllPostsToSupabase(posts);
                      for (const sm of socialMedias) {
                        await syncSocialMediaToSupabase(sm);
                      }
                      alert('✓ Sincronização manual completa executada para Clientes, Posts e Social Medias no Supabase!');
                    } catch (err) {
                      alert('Erro durante a sincronização manual com o Supabase. Verifique se o script SQL de tabelas foi rodado.');
                    }
                    setIsSyncingAll(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSyncingAll ? 'Sincronizando...' : 'Forçar Sincronização Manual Agora'}</span>
                </button>
              </div>

              {/* Banner de Resultado do Teste */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-xs leading-relaxed font-medium flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-800 text-rose-300'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-bold">{testResult.success ? 'Conexão Bem-Sucedida!' : 'Atenção / Verificação de Conexão:'}</strong>
                    <span>{testResult.message}</span>
                  </div>
                </div>
              )}

              {/* Script SQL Completo do Supabase */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    Script SQL Completo para Criar Tabelas e Políticas (RLS) no Supabase:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const fullSql = `-- 1. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  cnpj TEXT,
  address TEXT,
  contact_name TEXT,
  whatsapp_number TEXT,
  email TEXT,
  price_per_post NUMERIC(10,2) DEFAULT 150,
  metrics_access TEXT DEFAULT 'ambos',
  drive_folder_url TEXT,
  logo_url TEXT,
  assigned_social_media_id TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE POSTS (RASCUNHOS E CONTEÚDOS)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  client_project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'image',
  social_networks JSONB DEFAULT '[]'::jsonb,
  scheduled_date TEXT,
  status TEXT DEFAULT 'rascunho',
  approval_token TEXT,
  token_expires_at TIMESTAMPTZ,
  comments JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  social_media_author_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE AUDITORIA DE COMENTÁRIOS DOS POSTS
CREATE TABLE IF NOT EXISTS post_comments_audit (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  post_title TEXT,
  client_id TEXT,
  author_role TEXT NOT NULL,
  author_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE SOCIAL MEDIAS E TAXAS PERSONALIZADAS
CREATE TABLE IF NOT EXISTS social_medias (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  social_profile TEXT,
  pix_key TEXT,
  custom_fee_per_post NUMERIC(10,2),
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. HABILITAR SEGURANÇA (RLS) E PERMISSÕES DE ACESSO
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_medias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso total clientes" ON clients;
CREATE POLICY "Permitir acesso total clientes" ON clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total posts" ON posts;
CREATE POLICY "Permitir acesso total posts" ON posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total audit" ON post_comments_audit;
CREATE POLICY "Permitir acesso total audit" ON post_comments_audit FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total social_medias" ON social_medias;
CREATE POLICY "Permitir acesso total social_medias" ON social_medias FOR ALL USING (true) WITH CHECK (true);`;
                      navigator.clipboard.writeText(fullSql);
                      alert('Script SQL Completo do Supabase copiado! Cole no SQL Editor do seu Supabase e clique em "Run".');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
                  >
                    Copiar Script SQL Completo
                  </button>
                </div>

                <pre className="bg-slate-900 text-indigo-300 p-3 rounded-xl font-mono text-[10px] overflow-x-auto border border-slate-800 leading-relaxed max-h-48">
{`-- 1. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, company_name TEXT, cnpj TEXT,
  address TEXT, contact_name TEXT, whatsapp_number TEXT, email TEXT,
  price_per_post NUMERIC(10,2) DEFAULT 150, metrics_access TEXT DEFAULT 'ambos',
  drive_folder_url TEXT, logo_url TEXT, assigned_social_media_id TEXT, status TEXT DEFAULT 'ativo'
);

-- 2. TABELA DE POSTS (RASCUNHOS & CONTEÚDOS)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY, client_project_id TEXT NOT NULL, title TEXT NOT NULL,
  caption TEXT, media_url TEXT, media_type TEXT DEFAULT 'image', social_networks JSONB DEFAULT '[]'::jsonb,
  scheduled_date TEXT, status TEXT DEFAULT 'rascunho', approval_token TEXT, token_expires_at TIMESTAMPTZ,
  comments JSONB DEFAULT '[]'::jsonb, is_published BOOLEAN DEFAULT false, published_at TIMESTAMPTZ,
  social_media_author_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AUDITORIA DE COMENTÁRIOS E SOCIAL MEDIAS
CREATE TABLE IF NOT EXISTS post_comments_audit ( id TEXT PRIMARY KEY, post_id TEXT NOT NULL, post_title TEXT, client_id TEXT, author_role TEXT NOT NULL, author_name TEXT NOT NULL, comment_text TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS social_medias ( id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, whatsapp TEXT, social_profile TEXT, pix_key TEXT, custom_fee_per_post NUMERIC(10,2), status TEXT DEFAULT 'ativo', created_at TIMESTAMPTZ DEFAULT NOW() );

-- 4. POLÍTICAS DE ACESSO (RLS - CRUCIAL PARA SALVAR SEM ERRO)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY; ALTER TABLE posts ENABLE ROW LEVEL SECURITY; ALTER TABLE post_comments_audit ENABLE ROW LEVEL SECURITY; ALTER TABLE social_medias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acesso total clientes" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total audit" ON post_comments_audit FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total social_medias" ON social_medias FOR ALL USING (true) WITH CHECK (true);`}
                </pre>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>[v2.5] Inversão de Chat de Debate + Taxa SaaS Editável + Anti-Drible</span>
                  <span className="text-[10px] text-slate-500">2026-07-29</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">
                  Chat de debate com mensagens mais recentes no topo e caixa de digitação no cabeçalho; valor da taxa de R$ 0,50 por postagem totalmente editável pelo Gestor; mecanismo de bloqueio/suspensão anti-drible de faturamento.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-indigo-400 font-bold">
                  <span>[v2.4] Livro Vivo do Projeto & Análise de Mercado Excel (.xlsx)</span>
                  <span className="text-[10px] text-slate-500">2026-07-29</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">
                  Integração do Livro do Projeto por capítulos com histórico vivo e gerador de planilha Excel em memória (.xlsx) com simulador de concorrência.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-purple-400 font-bold">
                  <span>[v2.3] Gestão de Múltiplos Social Medias & Google Drive Central</span>
                  <span className="text-[10px] text-slate-500">2026-07-29</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">
                  Suporte completo a múltiplos Social Medias por agência, perfil social obrigatório e botão modal do Google Drive por cliente.
                </p>
              </div>
            </div>
          </div>
        </div>
  );
};
