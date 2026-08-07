import React, { useState } from 'react';
import { PostItem, ClientProject } from '../types';
import { 
  X, CheckCircle, AlertCircle, Clock, Copy, Send, 
  MessageSquare, ShieldCheck, Key, Calendar, Check, ExternalLink, Sparkles, RefreshCw
} from 'lucide-react';
import { getTimeRemainingText, isTokenExpired, buildApprovalUrl } from '../utils/token';
import { DriveImage } from './DriveImage';

interface ApprovalPublicModalProps {
  post: PostItem | null;
  client?: ClientProject;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (postId: string) => void;
  onRequestChange: (postId: string, commentText: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onRenewToken?: (postId: string) => void;
}

export const ApprovalPublicModal: React.FC<ApprovalPublicModalProps> = ({
  post,
  client,
  isOpen,
  onClose,
  onApprove,
  onRequestChange,
  onAddComment,
  onRenewToken
}) => {
  if (!isOpen || !post) return null;

  const [newComment, setNewComment] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionText, setRevisionText] = useState('');

  const expired = isTokenExpired(post.tokenExpiresAt);
  const timeInfo = getTimeRemainingText(post.tokenExpiresAt);
  const publicUrl = buildApprovalUrl(post.approvalToken || 'sem-token');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(post.id, newComment);
    setNewComment('');
  };

  const handleConfirmRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionText.trim()) return;
    onRequestChange(post.id, revisionText.trim());
    setRevisionText('');
    setShowRevisionForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 flex flex-col">
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              <Key className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Link Público de Aprovação com Token Hash</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                  Privado & Seguro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {client ? `Cliente: ${client.name}` : 'Acesso com Hash Único de Segurança e Expiração de 5 Dias'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Link Token Info Bar */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto truncate">
            <span className="text-slate-400 font-medium">URL com Token:</span>
            <code className="bg-slate-900 text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-[11px] truncate max-w-xs sm:max-w-md">
              {publicUrl}
            </code>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {expired ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {timeInfo.text}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {timeInfo.text}
              </span>
            )}

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>
        </div>

        {/* MAIN BODY: EXPIRED STATE vs VALID TOKEN STATE */}
        {expired ? (
          <div className="p-10 text-center space-y-4 max-w-xl mx-auto my-6">
            <div className="w-16 h-16 bg-rose-950/60 text-rose-400 border border-rose-800/50 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Link de Aprovação Expirado!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Este token hash de segurança possuía validade de 5 dias e expirou em{' '}
              <strong className="text-rose-300">
                {post.tokenExpiresAt ? new Date(post.tokenExpiresAt).toLocaleString('pt-BR') : 'Data não informada'}
              </strong>.
              O prazo de 5 dias é uma medida de privacidade e agilidade no fluxo Social Media 5.0.
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2 text-left">
              <span className="font-bold text-amber-400 block">Como prosseguir:</span>
              <p>
                • Solicite à equipe responsável a renovação do link para gerar um novo <strong>approval_token (uuid)</strong> com mais 5 dias de validade.
              </p>
            </div>

            {onRenewToken && (
              <button
                onClick={() => onRenewToken(post.id)}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 mx-auto shadow-lg shadow-amber-600/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Renovar Token por + 5 Dias Agora</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
            
            {/* Left Column: Media & Info */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-square relative flex items-center justify-center">
                <DriveImage
                  src={post.mediaUrl}
                  alt={post.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Calendar className="w-4 h-4 text-indigo-400" /> Agendamento:
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {new Date(post.scheduledDate).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Canais de Publicação:</span>
                  <span className="text-indigo-300 font-bold uppercase">
                    {post.socialNetworks.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Title, Caption & Action Buttons */}
            <div className="space-y-5 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                    Publicação do Rascunho:
                  </span>
                  <h3 className="text-lg font-bold text-white">{post.title}</h3>
                </div>

                {/* Caption Box */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Legenda Proposta:</label>
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                    {post.caption}
                  </div>
                </div>

                {/* Decision Panel */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Sua Decisão como Cliente:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Status: <strong className="text-white capitalize">{post.status === 'alterar' ? 'Revisar' : post.status}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setShowRevisionForm(false);
                        onApprove(post.id);
                      }}
                      className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        post.status === 'aprovado'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-emerald-950/40 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Aprovar Post</span>
                    </button>

                    <button
                      onClick={() => setShowRevisionForm(!showRevisionForm)}
                      className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        post.status === 'alterar' || showRevisionForm
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                          : 'bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Solicitar Ajuste</span>
                    </button>
                  </div>

                  {/* Revision Form input */}
                  {showRevisionForm && (
                    <form onSubmit={handleConfirmRevision} className="bg-rose-950/30 border border-rose-500/40 p-3 rounded-xl space-y-2 mt-2">
                      <label className="text-[11px] font-bold text-rose-300 block">
                        Descreva o que deseja alterar:
                      </label>
                      <textarea
                        rows={2}
                        value={revisionText}
                        onChange={(e) => setRevisionText(e.target.value)}
                        placeholder="Ex: Trocar a foto do fundo por um ângulo mais aberto..."
                        className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Confirmar Solicitação de Ajuste</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Comment Thread */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Comentários do Post ({post.comments.length}):
                  </span>

                  <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escrever dúvida ou orientação..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 bg-slate-950 text-xs text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  </form>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {[...post.comments].reverse().map(c => (
                      <div key={c.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[11px] space-y-0.5">
                        <div className="flex justify-between items-center text-slate-400 font-semibold">
                          <span className="text-indigo-300">{c.authorName}:</span>
                          <span className="text-[10px]">{c.timestamp}</span>
                        </div>
                        <p className="text-slate-200">{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
