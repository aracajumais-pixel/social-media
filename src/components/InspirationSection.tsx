import React, { useState } from 'react';
import { InspirationFile, UserRole } from '../types';
import { 
  Lightbulb, Plus, ExternalLink, Image as ImageIcon, Link as LinkIcon, FileText, 
  Trash2, User, CheckCircle2, Clock, AlertTriangle, Filter, Calendar 
} from 'lucide-react';

interface InspirationSectionProps {
  inspirations: InspirationFile[];
  currentUserRole: UserRole;
  clientProjectId: string;
  onAddInspiration: (newInspiration: Omit<InspirationFile, 'id' | 'createdAt'>) => void;
  onDeleteInspiration?: (id: string) => void;
  onUpdateInspiration?: (updated: InspirationFile) => void;
}

export const InspirationSection: React.FC<InspirationSectionProps> = ({
  inspirations,
  currentUserRole,
  clientProjectId,
  onAddInspiration,
  onDeleteInspiration,
  onUpdateInspiration
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'image' | 'link' | 'doc'>('image');
  const [filterStatus, setFilterStatus] = useState<'todas' | 'disponiveis' | 'usadas'>('todas');

  // Modal para escolher se apaga ou mantem por 90 dias ao marcar como usado
  const [targetUsageItem, setTargetUsageItem] = useState<InspirationFile | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const authorName =
      currentUserRole === 'cliente'
        ? 'Cliente (Inspiração)'
        : currentUserRole === 'social_media'
        ? 'Social Media (Referência)'
        : 'Gestor (Diretriz)';

    onAddInspiration({
      clientProjectId,
      title,
      description,
      url,
      type,
      uploadedByRole: currentUserRole,
      uploadedByName: authorName,
      isUsed: false
    });

    setTitle('');
    setDescription('');
    setUrl('');
    setShowAddForm(false);
  };

  const handleConfirmUsageOption = (option: 'keep_90_days' | 'delete_now') => {
    if (!targetUsageItem) return;

    if (option === 'delete_now') {
      if (onDeleteInspiration) {
        onDeleteInspiration(targetUsageItem.id);
      }
    } else {
      // Manter por mais 90 dias
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
  const filteredInspirations = inspirations.filter(item => {
    if (filterStatus === 'disponiveis') return !item.isUsed;
    if (filterStatus === 'usadas') return !!item.isUsed;
    return true;
  });

  const usedCount = inspirations.filter(i => i.isUsed).length;
  const availableCount = inspirations.filter(i => !i.isUsed).length;

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
              Central de Inspirações & Modelos de Referência
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Envie imagens, referências de vídeos ou arquivos de marca. Ao utilizar uma inspiração em um post, marque como <strong className="text-emerald-400">Usado</strong> para decidir entre apagar ou mantê-la salva por mais 90 dias.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all shrink-0 relative z-10"
        >
          <Plus className="w-4 h-4" />
          <span>Enviar Nova Inspiração / Modelo</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
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

        <span className="text-xs text-slate-400 hidden sm:block font-medium">
          Mantenha seu banco de inspirações organizado e limpo
        </span>
      </div>

      {/* Add Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-purple-800/50 p-6 rounded-3xl space-y-4 shadow-2xl">
          <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Novo Arquivo de Referência / Modelo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Título do Modelo / Referência:</label>
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
              <label className="block font-bold text-slate-300 mb-1">Tipo de Arquivo:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'image' | 'link' | 'doc')}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="image">Imagem / Foto Exemplo</option>
                <option value="link">Link Exemplo (Instagram/TikTok/Vimeo)</option>
                <option value="doc">Documento / PDF Brandbook</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-300 mb-1">URL da Imagem ou Link do Exemplo:</label>
            <input
              type="url"
              required
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500"
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
              onClick={() => setShowAddForm(false)}
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

      {/* List of Inspiration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInspirations.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Lightbulb className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-slate-300 font-bold text-sm">Nenhuma inspiração encontrada</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {filterStatus === 'usadas'
                ? 'Nenhuma inspiração marcada como usada ainda.'
                : 'Envie exemplos de peças para orientar o design das postagens.'}
            </p>
          </div>
        ) : (
          filteredInspirations.map(item => {
            const isUsed = item.isUsed;

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
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-800/40 text-[11px] font-bold">
                      {item.type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                      {item.type === 'link' && <LinkIcon className="w-3.5 h-3.5" />}
                      {item.type === 'doc' && <FileText className="w-3.5 h-3.5" />}
                      <span className="capitalize">{item.type}</span>
                    </span>

                    {/* Used Status Badge */}
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
                        onClick={() => onDeleteInspiration(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Excluir Inspiração"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Preview Image if image */}
                  {item.type === 'image' && (
                    <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative">
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Content */}
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

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
                  
                  {/* Mark as used / unmark button */}
                  <div className="flex items-center justify-between gap-2">
                    {isUsed ? (
                      <button
                        onClick={() => handleUnmarkUsed(item)}
                        className="text-[11px] font-bold text-slate-400 hover:text-white underline flex items-center gap-1"
                      >
                        Reverter para Disponível
                      </button>
                    ) : (
                      <button
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
                      <span>Abrir</span>
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
              <button onClick={() => setTargetUsageItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p className="font-bold text-white text-sm">{targetUsageItem.title}</p>
              <p>O que você deseja fazer com este modelo após a utilização no post?</p>
            </div>

            <div className="space-y-3">
              <button
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
