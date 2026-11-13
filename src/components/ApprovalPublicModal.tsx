import React, { useState, useRef, useEffect } from 'react';
import { PostItem, ClientProject, SocialMediaUser } from '../types';
import { 
  X, CheckCircle, AlertCircle, Send, 
  MessageSquare, ShieldCheck, Calendar, Check, RefreshCw, ArrowLeft,
  Sparkles, Clock, Phone, Mail
} from 'lucide-react';
import { getTimeRemainingText, isTokenExpired, buildApprovalUrl } from '../utils/token';
import { DriveImage } from './DriveImage';

interface ApprovalPublicModalProps {
  post: PostItem | null;
  client?: ClientProject;
  authorSocialMedia?: SocialMediaUser;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (postId: string) => void;
  onRequestChange: (postId: string, commentText: string, metadata?: { authorPhone?: string; authorEmail?: string; authorName?: string }) => void;
  onAddComment: (postId: string, text: string, metadata?: { authorPhone?: string; authorEmail?: string; authorName?: string }) => void;
  onRenewToken?: (postId: string) => void;
}

export const ApprovalPublicModal: React.FC<ApprovalPublicModalProps> = ({
  post,
  client,
  authorSocialMedia,
  isOpen,
  onClose,
  onApprove,
  onRequestChange,
  onAddComment,
  onRenewToken
}) => {
  if (!isOpen || !post) return null;

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [approvedFeedback, setApprovedFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const expired = isTokenExpired(post.tokenExpiresAt);
  const timeInfo = getTimeRemainingText(post.tokenExpiresAt);
  const isApproved = post.status === 'aprovado' || approvedFeedback;

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatOpen, post?.comments]);

  // Tecla Escape para fechar modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Sanitize comments to deduplicate repeated approval messages from previous clicks
  const sanitizedComments = post.comments.filter((comment, index, arr) => {
    const isApproval = comment.text.toLowerCase().includes('aprovad');
    if (isApproval) {
      const firstIdx = arr.findIndex(c => c.text.toLowerCase().includes('aprovad'));
      return index === firstIdx;
    }
    return true;
  });

  const handleApprove = () => {
    if (post.status !== 'aprovado') {
      onApprove(post.id);
      const alreadyHasApproval = post.comments.some(c => 
        c.text.toLowerCase().includes('aprovad') || 
        c.text.toLowerCase().includes('post aprovado') || 
        c.text.toLowerCase().includes('projeto aprovado')
      );
      if (!alreadyHasApproval) {
        onAddComment(post.id, '🎉 Projeto aprovado pelo cliente com sucesso!', {
          authorPhone: client?.whatsappNumber,
          authorEmail: (client as any)?.email,
          authorName: `${client?.contactName || client?.name || 'Cliente'} (Cliente)`
        });
      }
      setApprovedFeedback(true);
    }
  };

  const handleSendChatAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    // Registra a solicitação de ajuste e o comentário na discussão com os dados de identificação do cliente
    onRequestChange(post.id, chatMessage.trim(), {
      authorPhone: client?.whatsappNumber,
      authorEmail: (client as any)?.email,
      authorName: `${client?.contactName || client?.name || 'Cliente'} (Cliente)`
    });
    setChatMessage('');
  };

  const getInitial = (name?: string) => {
    if (!name) return 'C';
    const clean = name.replace(/[^a-zA-ZÀ-ÿ]/g, '').trim();
    return clean ? clean.charAt(0).toUpperCase() : 'C';
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center py-2 sm:py-6">
        <div 
          className="bg-[#090e1c] border border-indigo-900/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative text-white"
          onClick={(e) => e.stopPropagation()}
        >
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0d1326] to-indigo-950 p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {client?.logoUrl ? (
              <img 
                src={client.logoUrl} 
                alt={client.name} 
                className="w-10 h-10 rounded-2xl object-cover border border-indigo-500/30 bg-slate-900 shrink-0" 
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                {getInitial(client?.name || 'Cliente')}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                  {client?.name || 'Aprovação de Conteúdo'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase shrink-0">
                  Seguro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {authorSocialMedia?.name ? `Social Media: ${authorSocialMedia.name}` : 'Social Media 5.0'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all shrink-0"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* EXPIRED TOKEN STATE */}
        {expired ? (
          <div className="p-8 text-center space-y-4 my-4">
            <div className="w-14 h-14 bg-rose-950/60 text-rose-400 border border-rose-800/50 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-white">Link de Aprovação Expirado</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Este token de segurança possuía validade de 5 dias e expirou em{' '}
              <strong className="text-rose-300">
                {post.tokenExpiresAt ? new Date(post.tokenExpiresAt).toLocaleString('pt-BR') : 'Data não informada'}
              </strong>.
            </p>

            {onRenewToken && (
              <button
                onClick={() => onRenewToken(post.id)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 mx-auto shadow-lg shadow-amber-600/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Renovar Token por + 5 Dias</span>
              </button>
            )}
          </div>
        ) : !isChatOpen ? (

          /* VIEW 1: IMAGEM REDUZIDA DO PROJETO COM DESCRIÇÃO ABAIXO E BOTÕES APROVAR E AJUSTAR NO FINAL */
          <div className="p-4 sm:p-6 space-y-4">
            
            {/* 1. IMAGEM REDUZIDA DO PROJETO COM SINALIZAÇÃO DE APROVADO */}
            <div className="relative group">
              <div 
                className={`rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-64 sm:max-h-72 w-full relative flex items-center justify-center transition-all duration-300 ${
                  isApproved 
                    ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-500/30' 
                    : 'border border-indigo-500/30 shadow-md'
                }`}
              >
                <DriveImage
                  src={post.mediaUrl}
                  alt={post.title}
                  className="w-full h-full object-contain bg-slate-950"
                />

                {/* SINALIZAÇÃO NO PREVIEW DO PROJETO QUANDO APROVADO */}
                {isApproved && (
                  <>
                    {/* Badge flutuante no topo direito */}
                    <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-emerald-300/40 animate-fade-in">
                      <CheckCircle className="w-4 h-4 text-emerald-100" />
                      <span>PROJETO APROVADO</span>
                    </div>

                    {/* Faixa inferior de sinalização sobre o preview */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/80 to-transparent p-3 pt-6 flex items-center justify-between text-xs text-emerald-200">
                      <span className="font-bold flex items-center gap-1.5 text-white">
                        <Check className="w-4 h-4 text-emerald-400" />
                        Confirmado para Publicação
                      </span>
                      <span className="text-[10px] text-emerald-300 font-mono bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/50">
                        Status: Aprovado
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. DESCRIÇÃO ABAIXO DO PROJETO */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  {post.title}
                </h3>
                <span className="text-[10px] text-indigo-300 font-bold uppercase bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/40 shrink-0">
                  {post.socialNetworks.join(', ')}
                </span>
              </div>

              {/* Legenda / Briefing Proposto */}
              <div className="bg-[#0c1224] p-3.5 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                {post.caption || 'Sem descrição cadastrada para esta publicação.'}
              </div>

              {/* Data da Publicação Agendada */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Publicação Agendada:
                </span>
                <span className="font-semibold text-slate-200">
                  {new Date(post.scheduledDate).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Feedback Visual de Aprovação */}
            {approvedFeedback && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl text-xs text-emerald-200 flex items-center gap-2.5 shadow-lg animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>🎉 Projeto aprovado com sucesso! A equipe de Social Media foi notificada para agendamento.</span>
              </div>
            )}

            {/* 3. NO FINAL: OS DOIS BOTÕES: APROVAR E AJUSTAR */}
            <div className="pt-2 flex items-center gap-3">
              
              {/* Botão Aprovar */}
              <button
                type="button"
                onClick={handleApprove}
                disabled={post.status === 'aprovado' || approvedFeedback}
                className={`flex-1 py-3 px-4 font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isApproved
                    ? 'bg-[#10b981] text-white shadow-emerald-500/30 cursor-default'
                    : 'bg-[#10b981] hover:bg-emerald-400 text-white shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'
                }`}
                title={isApproved ? 'Este projeto já está aprovado' : 'Aprovar publicação'}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isApproved ? '✓ Projeto Aprovado' : 'Aprovar'}</span>
              </button>

              {/* Botão Ajustar (Abre a janela do chat / debate) */}
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="Abrir chat para debater e solicitar ajustes"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ajustar</span>
              </button>

            </div>

          </div>
        ) : (

          /* VIEW 2: JANELA DO CHAT (DEBATE) AO CLICAR EM AJUSTAR */
          <div className="p-4 sm:p-5 flex flex-col space-y-4 animate-fade-in">
            
            {/* Top Bar do Chat: Voltar ao Projeto e Miniatura */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Projeto</span>
              </button>

              {/* Miniatura do projeto no topo do chat */}
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                  <DriveImage src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-xs">
                  {post.title}
                </span>
              </div>
            </div>

            {/* Aviso acolhedor do debate */}
            <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-indigo-200">
              <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold">Janela de Debate & Ajustes:</strong>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Digite as alterações ou ajustes que você deseja na publicação. A equipe de Social Media receberá seu retorno instantaneamente.
                </p>
              </div>
            </div>

            {/* Lista de Mensagens do Chat (Debate) */}
            <div className="max-h-[320px] min-h-[220px] overflow-y-auto space-y-3 pr-1 py-2">
              {sanitizedComments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs italic">
                  Nenhum comentário enviado ainda. Digite sua mensagem de ajuste abaixo.
                </div>
              ) : (
                sanitizedComments.map((comment) => {
                  const isClient = 
                    comment.authorRole === 'cliente' || 
                    comment.authorName?.toLowerCase().includes('cliente');

                  return (
                    <div 
                      key={comment.id}
                      className={`flex items-end gap-2 ${isClient ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Avatar à esquerda para Social Media */}
                      {!isClient && (
                        <div 
                          className="w-7 h-7 rounded-full bg-indigo-700/80 border border-indigo-500/30 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm"
                          title={comment.authorName}
                        >
                          {getInitial(comment.authorName)}
                        </div>
                      )}

                      <div className={`flex flex-col ${isClient ? 'items-end' : 'items-start'} max-w-[82%]`}>
                        <div className="text-[10px] text-slate-400 mb-0.5 flex flex-wrap items-center gap-1.5 font-medium">
                          <span className="text-white font-semibold">{comment.authorName}</span>
                          {comment.authorPhone && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                              <Phone className="w-2.5 h-2.5" />
                              {comment.authorPhone}
                            </span>
                          )}
                          {comment.authorEmail && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/50">
                              <Mail className="w-2.5 h-2.5" />
                              {comment.authorEmail}
                            </span>
                          )}
                          <span>{comment.timestamp}</span>
                        </div>

                        <div 
                          className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-md ${
                            isClient
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-[#151d33] text-slate-100 rounded-tl-none border border-slate-700/60'
                          }`}
                        >
                          {comment.text}
                        </div>
                      </div>

                      {/* Avatar à direita para o Cliente */}
                      {isClient && (
                        <div 
                          className="w-7 h-7 rounded-full bg-emerald-600 border border-emerald-400/40 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm"
                          title={comment.authorName}
                        >
                          {getInitial(comment.authorName || 'Cliente')}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input para Envio de Ajuste */}
            <form onSubmit={handleSendChatAdjustment} className="pt-2 border-t border-slate-800">
              <div className="bg-[#070b16] border border-indigo-500/40 rounded-full px-4 py-2 flex items-center gap-2 shadow-inner">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Descreva o que precisa ser ajustado no post..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/40 shrink-0"
                  title="Enviar ajuste"
                >
                  <Send className="w-3.5 h-3.5 translate-x-px" />
                </button>
              </div>
            </form>

            {/* Botão de Atalho para Aprovar se tudo estiver resolvido */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-slate-400">Tudo resolvido com a proposta?</span>
              <button
                type="button"
                onClick={() => {
                  handleApprove();
                  setIsChatOpen(false);
                }}
                className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Aprovar Projeto Agora</span>
              </button>
            </div>

          </div>
        )}

        </div>
      </div>
    </div>
  );
};
