import React, { useState } from 'react';
import { PostItem } from '../types';
import { 
  X, ExternalLink, Copy, Check, Share2, Sparkles, 
  Instagram, Facebook, Linkedin, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { PUBLISH_PLATFORMS, copyCaptionToClipboard } from '../utils/publishHelper';
import { DriveImage } from './DriveImage';

interface PublishModalProps {
  post: PostItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsPublished?: (postId: string) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  post,
  isOpen,
  onClose,
  onMarkAsPublished
}) => {
  if (!isOpen || !post) return null;

  const [copiedCaption, setCopiedCaption] = useState(false);
  const [clickedPlatformId, setClickedPlatformId] = useState<string | null>(null);

  const handleCopyCaption = () => {
    copyCaptionToClipboard(post.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handlePlatformClick = (platformId: string) => {
    copyCaptionToClipboard(post.caption);
    setCopiedCaption(true);
    setClickedPlatformId(platformId);
    setTimeout(() => setCopiedCaption(false), 3000);
    if (onMarkAsPublished) {
      onMarkAsPublished(post.id);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/40">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Abrir Sistema para Postar</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                  Aprovado
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Selecione onde deseja postar manualmente. A legenda é copiada automaticamente!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* Post Preview & Caption Snippet */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                <DriveImage
                  src={post.mediaUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{post.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  {post.caption || 'Sem legenda'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Post 100% Aprovado
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyCaption}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-md ${
                copiedCaption
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              {copiedCaption ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCaption ? 'Legenda Copiada!' : 'Copiar Legenda'}</span>
            </button>
          </div>

          {/* Feedback automático de cópia */}
          {copiedCaption && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Legenda copiada para sua área de transferência!</strong> Agora basta colar (<kbd className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700 font-mono text-[10px]">Ctrl+V</kbd>) no aplicativo.
              </span>
            </div>
          )}

          {/* DESTAQUE PRINCIPAL: META BUSINESS SUITE */}
          <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-950 border-2 border-blue-500/60 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white shadow-sm">
                    ⭐ Principal Plataforma
                  </span>
                  <span className="text-xs text-blue-300 font-bold">Instagram + Facebook Juntos</span>
                </div>
                <h4 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Meta Business Suite</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                  Acesse o painel oficial da Meta para criar, programar ou publicar simultaneamente no <strong>Instagram</strong> e na <strong>Página do Facebook</strong> com 1 só clique.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 shrink-0 hidden sm:block">
                <Share2 className="w-7 h-7" />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <a
                href="https://business.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handlePlatformClick('meta_business')}
                className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir Meta Business Suite (business.facebook.com)</span>
              </a>

              <a
                href="https://business.facebook.com/latest/composer"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handlePlatformClick('meta_composer')}
                className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-blue-300 hover:text-white border border-blue-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                title="Abrir diretamente a tela de criar publicação do Meta Business"
              >
                <span>Criador Direto</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* DEMAIS APLICATIVOS ESPECÍFICOS */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Ou Abrir Aplicativo Individual:
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PUBLISH_PLATFORMS.filter(p => p.id !== 'meta_business').map(plat => (
                <a
                  key={plat.id}
                  href={plat.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handlePlatformClick(plat.id)}
                  className={`p-3.5 rounded-2xl border ${plat.borderClass} bg-slate-950/80 hover:bg-slate-900 transition-all flex items-center justify-between group shadow-sm`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 shrink-0">
                      {plat.id === 'instagram' && <Instagram className="w-5 h-5 text-pink-400" />}
                      {plat.id === 'facebook' && <Facebook className="w-5 h-5 text-blue-400" />}
                      {plat.id === 'tiktok' && <span className="text-sm font-black text-emerald-400">TT</span>}
                      {plat.id === 'linkedin' && <Linkedin className="w-5 h-5 text-sky-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                          {plat.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {plat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {plat.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-slate-900 text-slate-400 group-hover:text-white transition-colors shrink-0 ml-2">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Dica para o Social Media */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Fluxo Rápido de Postagem:
            </span>
            <p>
              1. Ao clicar em qualquer botão acima, o sistema <strong>copia o texto da legenda</strong> para a memória.
            </p>
            <p>
              2. O Meta Business ou aplicativo será aberto em uma nova aba ou no app do celular.
            </p>
            <p>
              3. Cole a legenda com <strong className="text-slate-200">Ctrl+V</strong> e selecione a mídia aprovada para publicar.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            Fechar
          </button>

          {onMarkAsPublished && (
            <button
              type="button"
              onClick={() => {
                onMarkAsPublished(post.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Marcar como Publicado</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
