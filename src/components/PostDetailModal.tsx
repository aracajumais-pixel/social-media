import React, { useState } from 'react';
import { PostItem, UserRole, PostStatus, InspirationFile, SocialNetwork } from '../types';
import { 
  X, CheckCircle, AlertCircle, Clock, Copy, Send, 
  MessageSquare, Lightbulb, Share2, Calendar, Check, MessageCircle, HardDrive, Trash2, ExternalLink,
  Instagram, Facebook, Linkedin, Key, ShieldCheck, RefreshCw, Pencil
} from 'lucide-react';
import { getTimeRemainingText, isTokenExpired, buildApprovalUrl, generateApprovalToken, calculateTokenExpirationDays } from '../utils/token';
import { DriveImage } from './DriveImage';
import { getEmbeddableMediaUrl } from '../utils/driveHelper';

interface PostDetailModalProps {
  post: PostItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  inspirations: InspirationFile[];
  onUpdateStatus: (postId: string, newStatus: PostStatus) => void;
  onUpdateSocialNetworks?: (postId: string, networks: SocialNetwork[]) => void;
  onTogglePublished?: (postId: string, isPublished: boolean) => void;
  onConfirmPreviewCleanup?: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onSendWhatsAppAlert: (postId: string, message: string) => void;
  onOpenPublicApprovalLink?: (post: PostItem) => void;
  onOpenWhatsApp?: (post: PostItem) => void;
  onRenewToken?: (postId: string) => void;
  onUpdatePostFields?: (postId: string, fields: Partial<PostItem>) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  currentUserRole,
  inspirations,
  onUpdateStatus,
  onUpdateSocialNetworks,
  onTogglePublished,
  onConfirmPreviewCleanup,
  onAddComment,
  onSendWhatsAppAlert,
  onOpenPublicApprovalLink,
  onOpenWhatsApp,
  onRenewToken,
  onUpdatePostFields
}) => {
  if (!isOpen || !post) return null;

  const [newComment, setNewComment] = useState('');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedTokenUrl, setCopiedTokenUrl] = useState(false);
  const [whatsappText, setWhatsappText] = useState('');
  const [showWhatsAppInput, setShowWhatsAppInput] = useState(false);

  // Editing Caption, Title and MediaUrl state
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [isEditingMediaUrl, setIsEditingMediaUrl] = useState(false);
  const [editedMediaUrl, setEditedMediaUrl] = useState(post.mediaUrl);

  React.useEffect(() => {
    if (post) {
      setEditedCaption(post.caption);
      setEditedTitle(post.title);
      setEditedMediaUrl(post.mediaUrl);
    }
  }, [post?.id, post?.caption, post?.title, post?.mediaUrl]);

  const handleSaveCaption = () => {
    if (onUpdatePostFields && post) {
      onUpdatePostFields(post.id, { caption: editedCaption });
    }
    setIsEditingCaption(false);
  };

  const handleSaveTitle = () => {
    if (onUpdatePostFields && post) {
      onUpdatePostFields(post.id, { title: editedTitle });
    }
    setIsEditingTitle(false);
  };

  const handleSaveMediaUrl = () => {
    if (onUpdatePostFields && post) {
      const converted = editedMediaUrl.trim() ? getEmbeddableMediaUrl(editedMediaUrl.trim()) : editedMediaUrl;
      onUpdatePostFields(post.id, { mediaUrl: converted });
    }
    setIsEditingMediaUrl(false);
  };

  // Token Approval Info
  const activeToken = post.approvalToken || 'sem-token';
  const approvalUrl = buildApprovalUrl(activeToken);
  const expired = isTokenExpired(post.tokenExpiresAt);
  const timeInfo = getTimeRemainingText(post.tokenExpiresAt);

  const handleCopyApprovalLink = () => {
    navigator.clipboard.writeText(approvalUrl);
    setCopiedTokenUrl(true);
    setTimeout(() => setCopiedTokenUrl(false), 2000);
  };

  // Revision Form State
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [revisionError, setRevisionError] = useState<string | null>(null);

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(post.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(post.id, newComment);
    setNewComment('');
  };

  const handleSendWhatsApp = () => {
    const textToSend = whatsappText.trim() || `Olá! Por favor veja as novidades e comentários no post "${post.title}".`;
    onSendWhatsAppAlert(post.id, textToSend);
    setWhatsappText('');
    setShowWhatsAppInput(false);
  };

  const handleToggleChannel = (net: SocialNetwork) => {
    if (!onUpdateSocialNetworks) return;
    const currentNets = post.socialNetworks || [];
    const updated = currentNets.includes(net)
      ? currentNets.filter(n => n !== net)
      : [...currentNets, net];
    onUpdateSocialNetworks(post.id, updated.length > 0 ? updated : ['instagram']);
  };

  const handleConfirmRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionText.trim()) {
      setRevisionError('Por favor, insira as informações e instruções para a revisão.');
      return;
    }
    setRevisionError(null);
    onAddComment(post.id, `[Instrução de Revisão]: ${revisionText.trim()}`);
    onUpdateStatus(post.id, 'alterar');
    setRevisionText('');
    setShowRevisionForm(false);
  };

  // Inspirações associadas
  const attachedInspirations = inspirations.filter(i => 
    post.inspirationReferenceIds?.includes(i.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl my-8 flex flex-col lg:flex-row max-h-[90vh]">
        
        {/* Left Side: Media Preview */}
        <div className="lg:w-1/2 bg-slate-950 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto">
          <div className="space-y-4">
            
            {/* Top Bar on Media */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {post.status === 'rascunho' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Rascunho
                  </span>
                )}
                {post.status === 'aprovado' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Aprovado
                  </span>
                )}
                {post.status === 'alterar' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Solicitado Revisão
                  </span>
                )}
              </div>

              <span className="text-xs text-slate-400 capitalize bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                Mídia: {post.mediaType}
              </span>
            </div>

            {/* Media Box */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-square relative flex items-center justify-center">
              <DriveImage
                src={post.mediaUrl}
                alt={post.title}
                className="w-full h-full object-contain bg-slate-950"
              />

              {post.previewCleanedUp && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                  <h4 className="text-white font-bold text-sm">Post Publicado & Preview Limpo</h4>
                  <p className="text-xs text-slate-400">O preview temporário foi liberado para limpeza de espaço conforme nossa política de armazenamento.</p>
                </div>
              )}
            </div>

            {/* Editable Media URL */}
            {onUpdatePostFields && (
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> URL da Mídia / Drive:
                  </span>
                  {!isEditingMediaUrl ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingMediaUrl(true)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" /> Alterar URL
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleSaveMediaUrl}
                        className="px-2 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded-lg"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingMediaUrl(false)}
                        className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                {isEditingMediaUrl ? (
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="url"
                      value={editedMediaUrl}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const converted = raw.trim() ? getEmbeddableMediaUrl(raw) : raw;
                        setEditedMediaUrl(converted);
                      }}
                      placeholder="Cole novo link do Drive..."
                      className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-indigo-500/50 text-[11px] font-mono focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400">
                      ✨ Links do Google Drive são convertidos instantaneamente para a CDN de alta resolução (<code className="text-emerald-400">https://lh3.googleusercontent.com/d/ID</code>).
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-mono truncate bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    {post.mediaUrl}
                  </p>
                )}
              </div>
            )}

            {/* Storage Lifecycle Notice */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" /> Armazenamento Temporário
                </span>
                <span className="text-[10px] text-slate-400">Taxa de R$ 0,50 por post</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                As mídias em aprovação são temporárias. Após a publicação nas redes, o preview é liberado para limpeza.
              </p>

              {/* Publication and Preview Cleanup Controls */}
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Status de Publicação:</span>
                  <button
                    onClick={() => onTogglePublished?.(post.id, !post.isPublished)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      post.isPublished
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{post.isPublished ? 'Publicado nas Redes' : 'Aguardando Publicação'}</span>
                  </button>
                </div>

                {post.isPublished && !post.previewCleanedUp && (currentUserRole === 'social_media' || currentUserRole === 'gestor') && (
                  <button
                    onClick={() => onConfirmPreviewCleanup?.(post.id)}
                    className="w-full py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Confirmar com Social Media & Liberar Exclusão de Preview</span>
                  </button>
                )}
              </div>
            </div>

            {/* Attached Inspirations References */}
            {attachedInspirations.length > 0 && (
              <div className="bg-purple-950/20 border border-purple-800/40 p-3 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Inspiração do Cliente Utilizada:</span>
                </div>
                {attachedInspirations.map(insp => (
                  <div key={insp.id} className="text-xs text-slate-300 bg-purple-900/30 p-2 rounded-xl flex items-center justify-between">
                    <span className="truncate">{insp.title}</span>
                    <a
                      href={insp.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-300 underline font-semibold text-[11px]"
                    >
                      Abrir Anexo
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Scheduled Date */}
            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Data de Publicação Agendada:
              </span>
              <span className="font-bold text-slate-200">
                {new Date(post.scheduledDate).toLocaleString('pt-BR')}
              </span>
            </div>

          </div>
        </div>

        {/* Right Side: Details, Approval Controls & Discussion Thread */}
        <div className="lg:w-1/2 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
          
          <div className="space-y-5">
            
            {/* Title & Close */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="flex-1 bg-slate-900 text-white font-bold text-base p-2 rounded-xl border border-amber-500/60 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveTitle}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(false)}
                      className="px-3 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl shrink-0"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white leading-tight">{post.title}</h2>
                    {onUpdatePostFields && (
                      <button
                        type="button"
                        onClick={() => setIsEditingTitle(true)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-colors"
                        title="Editar título"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                
                {/* Interactive Channels Selector for Social Media / Client */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">Canais de Publicação (Clique para escolher as redes):</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube'] as SocialNetwork[]).map(net => {
                      const isSelected = post.socialNetworks.includes(net);
                      return (
                        <button
                          key={net}
                          type="button"
                          onClick={() => handleToggleChannel(net)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/60 shadow-sm'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          {net === 'instagram' && <Instagram className="w-3.5 h-3.5 text-pink-400" />}
                          {net === 'facebook' && <Facebook className="w-3.5 h-3.5 text-blue-400" />}
                          {net === 'linkedin' && <Linkedin className="w-3.5 h-3.5 text-sky-400" />}
                          {net === 'tiktok' && <span className="text-[10px] font-black text-emerald-400">TT</span>}
                          {net === 'youtube' && <span className="text-[10px] font-black text-rose-400">YT</span>}
                          <span>{net}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Link de Aprovação com Token Hash (5 Dias de Expiração) */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-300">
                    <Key className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-xs font-bold text-white">Link Público de Aprovação (5 Dias)</span>
                </div>

                {expired ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Expirado (5 dias)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {timeInfo.text}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Link com Hash Único de Segurança para envio ao cliente. Vence automaticamente após 5 dias.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[11px] font-mono text-indigo-300 truncate">
                  {approvalUrl}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyApprovalLink}
                    className="flex-1 sm:flex-none px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                  >
                    {copiedTokenUrl ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTokenUrl ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>

                  {onOpenPublicApprovalLink && (
                    <button
                      type="button"
                      onClick={() => onOpenPublicApprovalLink(post)}
                      className="px-3 py-2 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                      title="Simular visualização pública do cliente"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-purple-300" />
                      <span className="hidden sm:inline">Simular Acesso</span>
                    </button>
                  )}

                  {onOpenWhatsApp && (
                    <button
                      type="button"
                      onClick={() => onOpenWhatsApp(post)}
                      className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                      title="Enviar este rascunho pelo WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="hidden sm:inline">Enviar WhatsApp</span>
                    </button>
                  )}

                  {expired && onRenewToken && (
                    <button
                      type="button"
                      onClick={() => onRenewToken(post.id)}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                      title="Renovar link com + 5 dias"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Renovar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Approval Decision Buttons (Aprovar / Revisar / Rascunho) */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Decisão de Aprovação:
                </span>
                <span className="text-xs text-slate-400">
                  Status atual: <strong className="text-white capitalize">{post.status === 'alterar' ? 'Revisar' : post.status}</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setShowRevisionForm(false);
                    onUpdateStatus(post.id, 'aprovado');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    post.status === 'aprovado'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-900 hover:bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Aprovado</span>
                </button>

                <button
                  onClick={() => {
                    setShowRevisionForm(true);
                    setRevisionError(null);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    post.status === 'alterar' || showRevisionForm
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-slate-900 hover:bg-rose-950/60 text-rose-400 border border-rose-800/40'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Revisar</span>
                </button>

                <button
                  onClick={() => {
                    setShowRevisionForm(false);
                    onUpdateStatus(post.id, 'rascunho');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    post.status === 'rascunho'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'bg-slate-900 hover:bg-amber-950/60 text-amber-400 border border-amber-800/40'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Rascunho</span>
                </button>
              </div>

              {/* Revision Required Input Box */}
              {showRevisionForm && (
                <form onSubmit={handleConfirmRevisionSubmit} className="bg-rose-950/40 border border-rose-500/50 p-4 rounded-2xl space-y-3 mt-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Informações para Revisão (Obrigatório):</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Insira as orientações e correções necessárias para a equipe de Social Media realizar a revisão.
                  </p>
                  <textarea
                    rows={3}
                    value={revisionText}
                    onChange={(e) => {
                      setRevisionText(e.target.value);
                      if (e.target.value.trim()) setRevisionError(null);
                    }}
                    placeholder="Digite o que precisa ser ajustado (ex: alterar a cor de fundo, mudar a chamada para ação)..."
                    className="w-full bg-slate-900 text-xs text-white p-3 rounded-xl border border-rose-800/60 focus:outline-none focus:border-rose-500"
                  />
                  {revisionError && (
                    <p className="text-rose-400 font-bold text-[11px]">
                      ⚠️ {revisionError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRevisionForm(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Solicitar Revisão</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Caption Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Legenda da Publicação:</label>
                <div className="flex items-center gap-2">
                  {onUpdatePostFields && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditedCaption(post.caption);
                        setIsEditingCaption(!isEditingCaption);
                      }}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isEditingCaption ? 'Cancelar' : 'Editar Legenda'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCaption ? 'Copiado!' : 'Copiar Legenda'}</span>
                  </button>
                </div>
              </div>

              {isEditingCaption ? (
                <div className="space-y-2.5 bg-slate-950 p-3 rounded-2xl border border-amber-500/50 shadow-lg animate-fade-in">
                  <textarea
                    rows={4}
                    value={editedCaption}
                    onChange={(e) => setEditedCaption(e.target.value)}
                    className="w-full bg-slate-900 text-xs text-white p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 leading-relaxed font-normal"
                    placeholder="Escreva ou altere a legenda do post..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCaption(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCaption}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar Legenda</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-normal whitespace-pre-line max-h-36 overflow-y-auto">
                  {post.caption}
                </div>
              )}
            </div>

            {/* Discussion Thread */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  Debate e Comentários ({post.comments.length})
                </h3>

                {/* Send WhatsApp notification button */}
                <button
                  type="button"
                  onClick={() => setShowWhatsAppInput(!showWhatsAppInput)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Alertar via WhatsApp</span>
                </button>
              </div>

              {/* WhatsApp Quick Message Input Toggle */}
              {showWhatsAppInput && (
                <div className="bg-emerald-950/30 border border-emerald-800/50 p-3 rounded-2xl space-y-2">
                  <p className="text-xs text-emerald-200">
                    Enviar notificação direta no WhatsApp sobre este item:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mensagem rápida (ex: Atualizei a imagem conforme solicitado)..."
                      value={whatsappText}
                      onChange={(e) => setWhatsappText(e.target.value)}
                      className="flex-1 bg-slate-900 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Disparar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Comment Form Input AT THE TOP OF THE CHAT DEBATE */}
              <form onSubmit={handleCommentSubmit} className="pt-1 pb-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Comentar como ${currentUserRole} (mensagens mais recentes no topo)...`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-slate-950 text-xs text-white px-4 py-3 rounded-2xl border border-indigo-500/40 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </div>
              </form>

              {/* List of comments - NEWEST AT TOP, OLDEST AT BOTTOM */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {post.comments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    Nenhum comentário ainda. Inicie o debate acima.
                  </p>
                ) : (
                  [...post.comments].reverse().map(c => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-2xl border text-xs space-y-1 ${
                        c.authorRole === 'cliente'
                          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-100'
                          : c.authorRole === 'social_media'
                          ? 'bg-purple-950/20 border-purple-900/40 text-purple-100'
                          : 'bg-indigo-950/20 border-indigo-900/40 text-indigo-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          {c.authorName}
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full uppercase bg-slate-800/80 text-slate-300">
                            {c.authorRole}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

