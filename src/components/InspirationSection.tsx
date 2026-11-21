import React, { useState, useEffect } from 'react';
import { InspirationFile, UserRole } from '../types';
import {
  Lightbulb, Plus, ExternalLink, Link as LinkIcon,
  Trash2, User, CheckCircle2, Clock, Calendar, Pencil, Check, X, Tag
} from 'lucide-react';

interface InspirationSectionProps {
  inspirations: InspirationFile[];
  currentUserRole: UserRole;
  clientProjectId: string;
  onAddInspiration: (newInspiration: Omit<InspirationFile, 'id' | 'createdAt'>) => void;
  onDeleteInspiration?: (id: string) => void;
  onUpdateInspiration?: (updated: InspirationFile) => void;
}

const DEFAULT_CATEGORIES = [
  'Reels / Vídeo',
  'Carrossel',
  'Post / Feed',
  'Stories',
  'Referência Geral'
];

const CATEGORIES_STORAGE_KEY = 'social_saas_inspiration_categories';

function normalizeLegacyCategory(rawType?: string, rawCategory?: string): string {
  const val = (rawCategory || rawType || '').trim();
  if (!val) return 'Referência Geral';
  if (val === 'image') return 'Post / Feed';
  if (val === 'link') return 'Reels / Vídeo';
  if (val === 'doc') return 'Referência Geral';
  return val;
}

export const InspirationSection: React.FC<InspirationSectionProps> = ({
  inspirations,
  currentUserRole,
  clientProjectId,
  onAddInspiration,
  onDeleteInspiration,
  onUpdateInspiration
}) => {
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c) => String(c).trim()).filter(Boolean);
        }
      }
    } catch {
      // ignore storage read error
    }
    return DEFAULT_CATEGORIES;
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => categories[0] || 'Referência Geral');
  const [filterStatus, setFilterStatus] = useState<'todas' | 'disponiveis' | 'usadas'>('todas');
  const [filterCategory, setFilterCategory] = useState<string>('todas');

  // Controles da Categoria: Criar, Editar (lápis) e Excluir (lixeira)
  const [categoryActionMode, setCategoryActionMode] = useState<'none' | 'create' | 'edit' | 'delete'>('none');
  const [categoryInputValue, setCategoryInputValue] = useState('');

  // Modal para escolher se apaga ou mantem por 90 dias ao marcar como usado
  const [targetUsageItem, setTargetUsageItem] = useState<InspirationFile | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch {
      // ignore storage write error
    }
  }, [categories]);

  // Garante que categorias usadas em inspirações existentes apareçam na lista
  useEffect(() => {
    const existingCats = inspirations
      .map((item) => normalizeLegacyCategory(item.type, item.category))
      .filter(Boolean);
    const missing = existingCats.filter((cat) => !categories.includes(cat));
    if (missing.length > 0) {
      setCategories((prev) => Array.from(new Set([...prev, ...missing])));
    }
  }, [inspirations, categories]);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const handleOpenCreateCategory = () => {
    setCategoryInputValue('');
    setCategoryActionMode((prev) => (prev === 'create' ? 'none' : 'create'));
  };

  const handleCreateCategory = () => {
    const clean = categoryInputValue.trim();
    if (!clean) return;
    if (!categories.includes(clean)) {
      setCategories((prev) => [...prev, clean]);
    }
    setSelectedCategory(clean);
    setCategoryInputValue('');
    setCategoryActionMode('none');
  };

  const handleOpenEditCategory = () => {
    if (!selectedCategory) return;
    setCategoryInputValue(selectedCategory);
    setCategoryActionMode((prev) => (prev === 'edit' ? 'none' : 'edit'));
  };

  const handleSaveEditCategory = () => {
    const clean = categoryInputValue.trim();
    if (!clean || !selectedCategory) return;
    const oldName = selectedCategory;

    setCategories((prev) => {
      const mapped = prev.map((c) => (c === oldName ? clean : c));
      return Array.from(new Set(mapped));
    });
    setSelectedCategory(clean);

    if (filterCategory === oldName) {
      setFilterCategory(clean);
    }

    if (onUpdateInspiration) {
      inspirations.forEach((item) => {
        const itemCat = normalizeLegacyCategory(item.type, item.category);
        if (itemCat === oldName) {
          onUpdateInspiration({
            ...item,
            type: clean,
            category: clean
          });
        }
      });
    }

    setCategoryInputValue('');
    setCategoryActionMode('none');
  };

  const handleDeleteCategory = () => {
    if (!selectedCategory) return;
    const target = selectedCategory;
    const nextList = categories.filter((c) => c !== target);
    setCategories(nextList);
    setSelectedCategory(nextList[0] || '');
    if (filterCategory === target) {
      setFilterCategory('todas');
    }
    setCategoryActionMode('none');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const categoryToSave = selectedCategory.trim() || 'Referência Geral';
    const authorName =
      currentUserRole === 'cliente'
        ? 'Cliente (Inspiração)'
        : currentUserRole === 'social_media'
        ? 'Social Media (Referência)'
        : 'Gestor (Diretriz)';

    onAddInspiration({
      clientProjectId,
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      type: categoryToSave,
      category: categoryToSave,
      uploadedByRole: currentUserRole,
      uploadedByName: authorName,
      isUsed: false
    });

    setTitle('');
    setDescription('');
    setUrl('');
    setShowAddForm(false);
    setCategoryActionMode('none');
  };

  const handleConfirmUsageOption = (option: 'keep_90_days' | 'delete_now') => {
    if (!targetUsageItem) return;

    if (option === 'delete_now') {
      if (onDeleteInspiration) {
        onDeleteInspiration(targetUsageItem.id);
      }
    } else {
      const today = new Date();
      const usedAtStr = today.toISOString().split('T')[0];
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);
      const expiresAtStr = expiryDate.toISOString().split('T')[0];

      if (onUpdateInspiration) {
        onUpdateInspiration({
          ...targetUsageItem,
          isUsed: true,
          usedAt: usedAtStr,
          retentionOption: 'keep_90_days',
          expiresAt: expiresAtStr
        });
      }
    }

    setTargetUsageItem(null);
  };

  const handleUnmarkUsed = (item: InspirationFile) => {
    if (onUpdateInspiration) {
      onUpdateInspiration({
        ...item,
        isUsed: false,
        usedAt: undefined,
        retentionOption: undefined,
        expiresAt: undefined
      });
    }
  };

  // Filtered list
  const filteredInspirations = inspirations.filter((item) => {
    if (filterStatus === 'disponiveis' && item.isUsed) return false;
    if (filterStatus === 'usadas' && !item.isUsed) return false;
    if (filterCategory !== 'todas') {
      const itemCat = normalizeLegacyCategory(item.type, item.category);
      if (itemCat !== filterCategory) return false;
    }
    return true;
  });

  const usedCount = inspirations.filter((i) => i.isUsed).length;
  const availableCount = inspirations.filter((i) => !i.isUsed).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-800/40 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/30">
              <Lightbulb className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Central de Inspirações &amp; Modelos de Referência
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Salve referências com descrição, categoria e link clicável. Ao utilizar uma inspiração em um post, marque como <strong className="text-emerald-400">Usado</strong> para decidir entre apagar ou mantê-la salva por mais 90 dias.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all shrink-0 relative z-10"
        >
          <Plus className="w-4 h-4" />
          <span>Enviar Nova Inspiração / Modelo</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('todas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'todas'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Todas ({inspirations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('disponiveis')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'disponiveis'
                ? 'bg-amber-600 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Disponíveis ({availableCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('usadas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'usadas'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Já Usadas ({usedCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Categoria:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="todas">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-purple-800/50 p-6 rounded-3xl space-y-4 shadow-2xl">
          <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Nova Referência / Modelo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Descrição / Título da Referência:</label>
              <input
                type="text"
                required
                placeholder="Ex: Estilo de fotos com luz natural da marca X"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Categoria:</label>
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    if (categoryActionMode === 'edit') {
                      setCategoryInputValue(e.target.value);
                    }
                  }}
                  className="flex-1 bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer min-w-0"
                >
                  {categories.length === 0 ? (
                    <option value="">Sem categoria (clique em + para criar)</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                        {cat}
                      </option>
                    ))
                  )}
                </select>

                {/* Botão Lápis (Editar categoria selecionada) */}
                <button
                  type="button"
                  onClick={handleOpenEditCategory}
                  disabled={!selectedCategory}
                  title="Editar nome da categoria selecionada"
                  className={`p-3 rounded-xl border transition-colors shrink-0 disabled:opacity-40 ${
                    categoryActionMode === 'edit'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 hover:bg-slate-800 text-indigo-300 border-slate-800'
                  }`}
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Botão Lixeira (Excluir categoria selecionada) */}
                <button
                  type="button"
                  onClick={() => setCategoryActionMode((prev) => (prev === 'delete' ? 'none' : 'delete'))}
                  disabled={!selectedCategory}
                  title="Excluir categoria selecionada"
                  className={`p-3 rounded-xl border transition-colors shrink-0 disabled:opacity-40 ${
                    categoryActionMode === 'delete'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-950 hover:bg-rose-950/60 text-rose-400 border-slate-800'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Botão Criar Nova Categoria */}
                <button
                  type="button"
                  onClick={handleOpenCreateCategory}
                  title="Criar nova categoria"
                  className={`px-3 py-3 rounded-xl border font-bold flex items-center gap-1 transition-colors shrink-0 ${
                    categoryActionMode === 'create'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/40'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Criar</span>
                </button>
              </div>

              {/* Painel Inline para Criar / Editar / Excluir Categoria */}
              {categoryActionMode === 'create' && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-purple-500/40 flex items-center gap-2">
                  <input
                    type="text"
                    value={categoryInputValue}
                    onChange={(e) => setCategoryInputValue(e.target.value)}
                    placeholder="Nome da nova categoria..."
                    className="flex-1 bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-purple-500 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                      if (e.key === 'Escape') setCategoryActionMode('none');
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Criar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryActionMode('none')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {categoryActionMode === 'edit' && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-indigo-500/40 flex items-center gap-2">
                  <input
                    type="text"
                    value={categoryInputValue}
                    onChange={(e) => setCategoryInputValue(e.target.value)}
                    placeholder="Novo nome da categoria..."
                    className="flex-1 bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveEditCategory();
                      }
                      if (e.key === 'Escape') setCategoryActionMode('none');
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveEditCategory}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryActionMode('none')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {categoryActionMode === 'delete' && selectedCategory && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-2 text-xs">
                  <span className="text-rose-200 truncate">
                    Excluir categoria <strong className="text-white">&quot;{selectedCategory}&quot;</strong>?
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleDeleteCategory}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                    >
                      Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryActionMode('none')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-300 mb-1">URL / Link Clicável do Exemplo:</label>
            <input
              type="url"
              required
              placeholder="https://... (link do Instagram, TikTok, Drive, site ou referência)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 font-mono text-xs"
            />
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-300 mb-1">Observações do que você gostou neste modelo:</label>
            <textarea
              rows={2}
              placeholder="Ex: Gostei das fontes em caixa alta e do ritmo do áudio instrumental..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setCategoryActionMode('none');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20"
            >
              Salvar Inspiração
            </button>
          </div>
        </form>
      )}

      {/* List of Inspiration Cards (somente descrição, categoria, observação e link clicável) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInspirations.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Lightbulb className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-slate-300 font-bold text-sm">Nenhuma inspiração encontrada</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {filterStatus === 'usadas'
                ? 'Nenhuma inspiração marcada como usada ainda.'
                : 'Adicione links de referência com descrição e observações para orientar a criação das postagens.'}
            </p>
          </div>
        ) : (
          filteredInspirations.map((item) => {
            const isUsed = item.isUsed;
            const displayCategory = normalizeLegacyCategory(item.type, item.category);

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-3xl overflow-hidden transition-all flex flex-col justify-between p-5 space-y-4 shadow-xl relative ${
                  isUsed ? 'border-emerald-500/40 bg-slate-900/90' : 'border-slate-800 hover:border-purple-800/60'
                }`}
              >
                <div className="space-y-3">

                  {/* Header Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-800/40 text-[11px] font-bold truncate max-w-[155px]">
                      <Tag className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                      <span className="truncate">{displayCategory}</span>
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isUsed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> JÁ FOI USADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                          <Clock className="w-3 h-3 text-amber-400" /> DISPONÍVEL
                        </span>
                      )}

                      {onDeleteInspiration && (
                        <button
                          type="button"
                          onClick={() => onDeleteInspiration(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Excluir Inspiração"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Descrição / Título */}
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>
                  </div>

                  {/* Link Clicável */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-950/90 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <LinkIcon className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-xs font-mono text-purple-300 group-hover:text-purple-200 underline truncate">
                        {item.url}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                  </a>

                  {/* Observações */}
                  {item.description && (
                    <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Observações:
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {item.description}
                      </p>
                    </div>
                  )}

                  {/* Retention Note if Used */}
                  {isUsed && item.expiresAt && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Manter salvo até <strong>{item.expiresAt}</strong> (90 dias)</span>
                    </div>
                  )}

                </div>

                {/* Footer Controls & Link */}
                <div className="pt-3 border-t border-slate-800 space-y-3">

                  <div className="flex items-center justify-between gap-2">
                    {isUsed ? (
                      <button
                        type="button"
                        onClick={() => handleUnmarkUsed(item)}
                        className="text-[11px] font-bold text-slate-400 hover:text-white underline flex items-center gap-1"
                      >
                        Reverter para Disponível
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTargetUsageItem(item)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Marcar como Já Usado</span>
                      </button>
                    )}

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 font-bold flex items-center gap-1 transition-colors text-[11px] shrink-0"
                    >
                      <span>Abrir Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Author line */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <User className="w-3 h-3 text-purple-400" />
                    <span>Enviado por: {item.uploadedByName}</span>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modal Decisão: Apagar ou Manter 90 Dias */}
      {targetUsageItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Marcar Inspiração como Usada</span>
              </h3>
              <button type="button" onClick={() => setTargetUsageItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p className="font-bold text-white text-sm">{targetUsageItem.title}</p>
              <p>O que você deseja fazer com este modelo após a utilização no post?</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleConfirmUsageOption('keep_90_days')}
                className="w-full p-4 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-left space-y-1 transition-all group"
              >
                <div className="font-bold text-indigo-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Manter por mais 90 dias
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">RECOMENDADO</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Fica salvo no acervo para consultas futuras e métricas de reaproveitamento, expirando em 90 dias.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmUsageOption('delete_now')}
                className="w-full p-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-left space-y-1 transition-all"
              >
                <div className="font-bold text-rose-300 text-xs flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  Apagar Inspiração Agora
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Remove permanentemente este modelo do painel para manter o banco de ideias enxuto.
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTargetUsageItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

