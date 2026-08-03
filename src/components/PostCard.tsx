import React from 'react';
import { PostItem, UserRole, SocialNetwork } from '../types';
import { 
  CheckCircle, AlertCircle, Clock, MessageSquare, 
  Instagram, Facebook, Linkedin, Video, Layers, Calendar, ExternalLink 
} from 'lucide-react';

interface PostCardProps {
  post: PostItem;
  currentUserRole: UserRole;
  onOpenDetails: (post: PostItem) => void;
  onQuickApprove?: (postId: string) => void;
  onQuickRequestChange?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserRole,
  onOpenDetails,
  onQuickApprove,
  onQuickRequestChange
}) => {
  // Configurações visuais dos 3 únicos status permitidos
  const getStatusBadge = () => {
    switch (post.status) {
      case 'rascunho':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Rascunho
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

  const renderNetworkIcon = (network: SocialNetwork) => {
    switch (network) {
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-400" title="Instagram" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-400" title="Facebook" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-sky-400" title="LinkedIn" />;
      case 'tiktok':
        return <span className="text-xs font-black text-emerald-300" title="TikTok">TT</span>;
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
          <img
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

        {/* Caption & Info Body */}
        <div className="p-4 space-y-3">
          
          {/* Social Networks List */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs text-slate-400 font-medium">Canais:</span>
            <div className="flex items-center gap-2">
              {post.socialNetworks.map(net => (
                <div key={net} className="p-1 rounded-md bg-slate-800/80 border border-slate-700/50">
                  {renderNetworkIcon(net)}
                </div>
              ))}
            </div>
          </div>

          {/* Caption Snippet */}
          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-normal bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            {post.caption}
          </p>

          {/* Latest Comment / Discussion Snippet */}
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

        </div>
      </div>

      {/* Action Bar Footer */}
      <div className="p-4 pt-0 space-y-2">
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          
          <button
            onClick={() => onOpenDetails(post)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ver & Debater</span>
            {post.comments.length > 0 && (
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                {post.comments.length}
              </span>
            )}
          </button>

          {/* Direct Approval / Change Action for Client or Gestor */}
          {(currentUserRole === 'cliente' || currentUserRole === 'gestor') && (
            <div className="flex items-center gap-1.5">
              {post.status !== 'aprovado' && onQuickApprove && (
                <button
                  onClick={() => onQuickApprove(post.id)}
                  className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                  title="Aprovar Publicação"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Aprovar</span>
                </button>
              )}

              {post.status !== 'alterar' && (
                <button
                  onClick={() => {
                    if (onQuickRequestChange) {
                      onQuickRequestChange(post.id);
                    } else {
                      onOpenDetails(post);
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                  title="Solicitar Revisão"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Revisar</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
