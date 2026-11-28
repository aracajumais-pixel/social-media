import React, { useState } from 'react';
import { PostItem, UserRole } from '../types';
import { 
  CheckCircle, AlertCircle, Clock, MessageSquare, 
  Video, Layers, Calendar, Key, ShieldCheck,
  Trash2, AlertTriangle, Share2, MessageCircle
} from 'lucide-react';
import { getTimeRemainingText, isTokenExpired } from '../utils/token';
import { DriveImage } from './DriveImage';
import { PublishModal } from './PublishModal';

interface PostCardProps {
  post: PostItem;
  currentUserRole: UserRole;
  onOpenDetails: (post: PostItem) => void;
  onQuickApprove?: (postId: string) => void;
  onQuickRequestChange?: (postId: string) => void;
  onOpenPublicApprovalLink?: (post: PostItem) => void;
  onShareWhatsApp?: (post: PostItem) => void;
  onDeletePost?: (postId: string) => void | Promise<void>;
  onPublishPost?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserRole,
  onOpenDetails,
  onQuickApprove,
  onQuickRequestChange,
  onOpenPublicApprovalLink,
  onShareWhatsApp,
  onDeletePost,
  onPublishPost
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const expired = isTokenExpired(post.tokenExpiresAt);
  const timeInfo = getTimeRemainingText(post.tokenExpiresAt);
  // Configurações visuais dos 3 únicos status permitidos
  const getStatusBadge = () => {
    switch (post.status) {
      case 'rascunho':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Projeto
          </span>
        );
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            Aprovado
          </span>
        );
      case 'alterar':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Revisar
          </span>
        );
      default:
        return null;
    }
  };

  const formattedDate = new Date(post.scheduledDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const latestComment = post.comments.length > 0 ? post.comments[post.comments.length - 1] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group shadow-xl">
      
      <div>
        {/* Top Header & Media Container */}
        <div className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onOpenDetails(post)}>
          <DriveImage
            src={post.mediaUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {getStatusBadge()}
          </div>

          {/* Media Type Indicator */}
          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-slate-200 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700/50">
            {post.mediaType === 'video' && <Video className="w-3.5 h-3.5 text-purple-400" />}
            {post.mediaType === 'carousel' && <Layers className="w-3.5 h-3.5 text-blue-400" />}
            <span className="capitalize">{post.mediaType}</span>
          </div>

          {/* Title on Media Overlay */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
              {post.title}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Botões Comentar e Aprovar lado a lado imediatamente abaixo da foto (50% cada da largura do preview) */}
        <div className="grid grid-cols-2 w-full border-t border-b border-slate-800/80 divide-x divide-slate-800/80">
          <button
            type="button"
            onClick={() => onOpenDetails(post)}
            className="w-full py-2.5 px-3 bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Comentar</span>
            {post.comments.length > 0 && (
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {post.comments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            disabled={post.status === 'aprovado' || !onQuickApprove}
            onClick={(e) => {
              e.stopPropagation();
              if (post.status !== 'aprovado' && onQuickApprove) {
                onQuickApprove(post.id);
              }
            }}
            className={`w-full py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              post.status === 'aprovado'
                ? 'bg-emerald-600/25 text-emerald-300 cursor-default'
                : 'bg-white hover:bg-slate-100 text-slate-900'
            }`}
            title={post.status === 'aprovado' ? 'Projeto já aprovado' : 'Aprovar Publicação'}
          >
            <CheckCircle className={`w-3.5 h-3.5 ${post.status === 'aprovado' ? '' : 'text-emerald-600'}`} />
            <span>{post.status === 'aprovado' ? 'Aprovado' : 'Aprovar'}</span>
          </button>
        </div>

        {/* Caption, Chat & Token Body */}
        <div className="p-4 pt-3 space-y-3">
          {/* Caption Snippet */}
          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-normal bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            {post.caption}
          </p>

          {/* Latest Comment / Discussion Snippet (Chat) */}
          {latestComment ? (
            <div className="bg-slate-850/80 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-indigo-400" />
                  {latestComment.authorName}:
                </span>
                <span className="text-[10px] text-slate-500">{latestComment.timestamp}</span>
              </div>
              <p className="text-slate-400 text-[11px] line-clamp-1 italic">
                "{latestComment.text}"
              </p>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 italic flex items-center gap-1 py-1">
              <MessageSquare className="w-3 h-3" /> Sem comentários no momento
            </div>
          )}

          {/* Token Hash Expiration Badge + Botão rápido WhatsApp */}
          <div className="flex items-center justify-between gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px]">
            <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
              <Key className="w-3 h-3 text-indigo-400" /> Token 5d:
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenPublicApprovalLink) onOpenPublicApprovalLink(post);
                  else onOpenDetails(post);
                }}
                className={`font-bold hover:underline flex items-center gap-1 truncate ${
                  expired ? 'text-rose-400' : 'text-emerald-400'
                }`}
                title="Abrir Link Público de Aprovação"
              >
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span className="truncate">{timeInfo.text}</span>
              </button>

              {onShareWhatsApp && currentUserRole !== 'cliente' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareWhatsApp(post);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-[10px] flex items-center gap-1 transition-colors shrink-0"
                  title="Enviar link com imagem e descrição no WhatsApp"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar Footer (Apenas Excluir para equipe e Postar no Meta quando aprovado) */}
      {(((currentUserRole === 'gestor' || currentUserRole === 'social_media') && onDeletePost) || post.status === 'aprovado') && (
        <div className="p-4 pt-0 space-y-2">
          {(currentUserRole === 'gestor' || currentUserRole === 'social_media') && onDeletePost && (
            <div className="flex items-center justify-end pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center transition-colors shrink-0"
                title="Excluir Projeto com Confirmação"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Botão de Postar no Meta Business / App para Posts Aprovados */}
          {post.status === 'aprovado' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPublishModalOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 transition-all hover:scale-[1.01] mt-1"
              title="Abrir Meta Business Suite ou aplicativo para postar"
            >
              <Share2 className="w-3.5 h-3.5 text-white" />
              <span>Postar no Meta Business / App</span>
            </button>
          )}
        </div>
      )}

      {/* Modal para Postar no Meta Business ou Apps */}
      <PublishModal
        post={post}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onMarkAsPublished={onPublishPost}
      />

      {/* Modal de Confirmação de Exclusão do Projeto */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Excluir Projeto</h3>
                <p className="text-[11px] text-slate-400">Confirmação obrigatória</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                Tem certeza de que deseja apagar o projeto <strong className="text-white">"{post.title}"</strong>?
              </p>
              <p className="text-[11px] text-slate-400">
                Esta publicação será removida permanentemente do mural e do Supabase.
              </p>
              {post.status === 'aprovado' && (
                <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-[11px] leading-relaxed">
                  <strong>Auditoria de Faturamento:</strong> Este projeto já possui registro oficial de aprovação. Mesmo após excluir o card do mural, o registro de aprovação permanece preservado para computação de faturamento.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!onDeletePost) return;
                  setIsDeleting(true);
                  try {
                    await onDeletePost(post.id);
                    setShowDeleteConfirm(false);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
