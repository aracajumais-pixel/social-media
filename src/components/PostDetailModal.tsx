import React, { useState, useEffect, useRef } from 'react';
import { PostItem, UserRole, PostStatus, InspirationFile, SocialNetwork } from '../types';
import { 
  X, CheckCircle, Copy, Send, 
  MessageSquare, Trash2, Pencil, Check, Paperclip, Link2, 
  AlertTriangle, Image as ImageIcon, Sparkles, UploadCloud, Loader2,
  HardDrive, Eye, EyeOff, Calendar
} from 'lucide-react';
import { buildApprovalUrl } from '../utils/token';
import { DriveImage } from './DriveImage';
import { uploadMediaToSupabase } from '../lib/supabase';
import { getEmbeddableMediaUrl } from '../utils/driveHelper';

interface PostDetailModalProps {
  post: PostItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  inspirations: InspirationFile[];
  clientWhatsapp?: string;
  clientName?: string;
  onUpdateStatus: (postId: string, newStatus: PostStatus) => void;
  onUpdateSocialNetworks?: (postId: string, networks: SocialNetwork[]) => void;
  onTogglePublished?: (postId: string, isPublished: boolean) => void;
  onConfirmPreviewCleanup?: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onSendWhatsAppAlert: (postId: string, message: string) => void;
  onOpenPublicApprovalLink?: (post: PostItem) => void;
  onRenewToken?: (postId: string) => void;
  onUpdatePostFields?: (postId: string, fields: Partial<PostItem>) => void;
  onDeletePost?: (postId: string) => void | Promise<void>;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  currentUserRole,
  inspirations,
  clientName,
  onUpdateStatus,
  onTogglePublished,
  onConfirmPreviewCleanup,
  onAddComment,
  onUpdatePostFields,
  onDeletePost
}) => {
  if (!isOpen || !post) return null;

  const [newComment, setNewComment] = useState('');
  const [copiedTokenUrl, setCopiedTokenUrl] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [approvalThanksFeedback, setApprovalThanksFeedback] = useState(false);

  // Editable Title & Caption
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption);

  // Simplified Media Controls State (Upload & Substituir Mídia)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadSuccessFeedback, setUploadSuccessFeedback] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isEditingMediaUrl, setIsEditingMediaUrl] = useState(false);
  const [manualMediaUrl, setManualMediaUrl] = useState(post.mediaUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (post) {
      setEditedTitle(post.title);
      setEditedCaption(post.caption);
      setManualMediaUrl(post.mediaUrl || '');
    }
  }, [post?.id, post?.title, post?.caption, post?.mediaUrl]);

  // Scroll to bottom of chat when new comments arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [post?.comments]);

  const handleSaveTitle = () => {
    if (onUpdatePostFields && post && editedTitle.trim()) {
      onUpdatePostFields(post.id, { title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSaveCaption = () => {
    if (onUpdatePostFields && post) {
      onUpdatePostFields(post.id, { caption: editedCaption.trim() });
    }
    setIsEditingCaption(false);
  };

  // Direct File Upload handler (Supabase Storage)
  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !post) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setUploadError('Formato inválido. Selecione imagem (JPG, PNG, WEBP) ou vídeo (MP4, MOV).');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('O arquivo excede o limite de 50MB.');
      return;
    }

    setIsUploadingMedia(true);
    setUploadError(null);
    setUploadSuccessFeedback(false);

    try {
      const res = await uploadMediaToSupabase(file, 'posts');
      if (!res.success || !res.url) {
        throw new Error(res.error || 'Falha ao enviar arquivo para o Supabase Storage.');
      }

      const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
      if (onUpdatePostFields) {
        onUpdatePostFields(post.id, {
          mediaUrl: res.url,
          mediaType
        });
      }

      setManualMediaUrl(res.url);
      setUploadSuccessFeedback(true);
      setShowMediaPreview(true);
      setTimeout(() => setUploadSuccessFeedback(false), 3500);
    } catch (err: any) {
      setUploadError(err.message || 'Erro durante o upload da mídia.');
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manual Media Replacement (URL or Drive Link)
  const handleSaveManualMediaUrl = () => {
    if (!post || !onUpdatePostFields) return;
    const trimmed = manualMediaUrl.trim();
    if (!trimmed) {
      setIsEditingMediaUrl(false);
      return;
    }

    const converted = getEmbeddableMediaUrl(trimmed);
    onUpdatePostFields(post.id, { mediaUrl: converted });
    setManualMediaUrl(converted);
    setIsEditingMediaUrl(false);
    setShowMediaPreview(true);
    setUploadSuccessFeedback(true);
    setTimeout(() => setUploadSuccessFeedback(false), 3500);
  };

  // Approval link
  const activeToken = post.approvalToken || 'sem-token';
  const approvalUrl = buildApprovalUrl(activeToken);

  const handleCopyApprovalLink = () => {
    navigator.clipboard.writeText(approvalUrl);
    setCopiedTokenUrl(true);
    setTimeout(() => setCopiedTokenUrl(false), 2200);
  };

  const handleToggleApprove = () => {
    if (post.status !== 'aprovado') {
      onUpdateStatus(post.id, 'aprovado');
      onAddComment(post.id, '🎉 Projeto aprovado com sucesso!');
      setApprovalThanksFeedback(true);
      setTimeout(() => setApprovalThanksFeedback(false), 4000);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(post.id, newComment.trim());
    setNewComment('');
  };

  // Determine current user display label
  const currentUserDisplayName = 
    currentUserRole === 'cliente' ? (clientName || 'Cliente') :
    currentUserRole === 'social_media' ? 'Social Media' : 'Gestor';

  // Compute unique participants for the counter badge
  const commentAuthors = post.comments.map(c => c.authorName?.trim()).filter(Boolean);
  const uniqueParticipantsSet = new Set<string>(commentAuthors);
  uniqueParticipantsSet.add(currentUserDisplayName);
  if (clientName) uniqueParticipantsSet.add(clientName);
  const participantCount = Math.max(uniqueParticipantsSet.size, 1);

  // Get initial letters for avatar circles
  const getInitial = (name?: string) => {
    if (!name) return 'U';
    const clean = name.replace(/[^a-zA-ZÀ-ÿ]/g, '').trim();
    return clean ? clean.charAt(0).toUpperCase() : 'U';
  };

  // Inspirações associadas
  const attachedInspirations = inspirations.filter(i => 
    post.inspirationReferenceIds?.includes(i.id)
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#090d18] border border-indigo-900/40 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-4 sm:my-8 flex flex-col relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* TOP HEADER: Title + Caption snippet (Left) and Delete + Close (Right) */}
        <div className="p-5 sm:p-6 pb-3">
          <div className="flex items-start justify-between gap-4">
            
            {/* Left: Title & Caption */}
            <div className="flex-1 min-w-0 pr-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="bg-slate-900 text-white font-extrabold text-xl px-3 py-1.5 rounded-xl border border-indigo-500/70 focus:outline-none w-full max-w-md"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveTitle}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(false)}
                    className="p-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    {post.title}
                  </h2>
                  {onUpdatePostFields && (
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(true)}
                      className="p-1 text-slate-500 hover:text-white transition-colors rounded-lg"
                      title="Editar título"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Caption / Briefing Snippet */}
              {isEditingCaption ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={2}
                    value={editedCaption}
                    onChange={(e) => setEditedCaption(e.target.value)}
                    className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-indigo-500/60 focus:outline-none"
                    placeholder="Editar legenda..."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveCaption}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingCaption(false)}
                      className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="mt-1 flex items-center gap-1.5 cursor-pointer group/caption"
                  onClick={() => onUpdatePostFields && setIsEditingCaption(true)}
                  title="Clique para editar legenda"
                >
                  <p className="text-xs sm:text-sm text-slate-400 font-normal line-clamp-2 leading-relaxed">
                    {post.caption || 'Sem legenda ou briefing definido.'}
                  </p>
                  {onUpdatePostFields && (
                    <Pencil className="w-3 h-3 text-slate-600 group-hover/caption:text-slate-400 opacity-0 group-hover/caption:opacity-100 transition-opacity shrink-0" />
                  )}
                </div>
              )}
            </div>

            {/* Right: Excluir Projeto + Close (X) */}
            <div className="flex items-center gap-2.5 shrink-0">
              {onDeletePost && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border border-rose-500/60 hover:border-rose-500 bg-transparent hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Excluir este projeto"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Excluir Projeto</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-b border-slate-800/80 w-full mt-3 mb-3" />

          {/* PARTE SIMPLIFICADA DE MÍDIA: Somente o botão de Upload e o de Substituir Mídia */}
          <div className="bg-[#0c1224] border border-indigo-500/25 rounded-2xl p-3 sm:px-4 sm:py-2.5 transition-all">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              
              {/* Identificação e Miniatura da Mídia */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowMediaPreview(!showMediaPreview)}
                  className="w-9 h-9 rounded-xl overflow-hidden bg-slate-950 border border-indigo-500/40 relative group shrink-0 transition-transform active:scale-95"
                  title={showMediaPreview ? 'Ocultar prévia' : 'Expandir prévia da mídia'}
                >
                  <DriveImage
                    src={post.mediaUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    {showMediaPreview ? <EyeOff className="w-3.5 h-3.5 text-white" /> : <Eye className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold text-white">Mídia da Publicação</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMediaPreview(!showMediaPreview)}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                  >
                    <span>{showMediaPreview ? 'Ocultar visualização' : 'Clique para visualizar mídia'}</span>
                  </button>
                </div>
              </div>

              {/* Apenas 2 Botões: Upload e Substituir Mídia */}
              <div className="flex items-center gap-2 justify-end">
                {/* 1. Botão de Upload direto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleDirectFileUpload}
                />
                <button
                  type="button"
                  disabled={isUploadingMedia}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  title="Fazer upload de nova mídia (imagem ou vídeo)"
                >
                  {isUploadingMedia ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </>
                  )}
                </button>

                {/* 2. Botão de Substituir Mídia */}
                <button
                  type="button"
                  onClick={() => setIsEditingMediaUrl(!isEditingMediaUrl)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/40 font-bold text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title="Substituir mídia por link do Drive ou URL"
                >
                  <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Substituir Mídia</span>
                </button>
              </div>

            </div>

            {/* Feedback de Upload ou Erro */}
            {uploadSuccessFeedback && (
              <div className="mt-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mídia atualizada com sucesso!</span>
              </div>
            )}
            {uploadError && (
              <div className="mt-2 text-[11px] text-rose-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Input simplificado para Substituir Mídia (Drive ou URL) quando acionado */}
            {isEditingMediaUrl && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2 animate-fade-in">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={manualMediaUrl}
                    onChange={(e) => setManualMediaUrl(e.target.value)}
                    placeholder="Cole o novo link do Google Drive ou link da imagem/vídeo..."
                    className="flex-1 bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-indigo-500/50 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveManualMediaUrl();
                      if (e.key === 'Escape') setIsEditingMediaUrl(false);
                    }}
                  />
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={handleSaveManualMediaUrl}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingMediaUrl(false)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Collapsible Media Preview: Data da publicação agendada logo abaixo do preview */}
        {showMediaPreview && (
          <div className="px-5 sm:px-6 pb-2 animate-fade-in space-y-2">
            <div className="bg-[#0b1020] border border-indigo-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-400" /> Visualização da Mídia
                </span>
                <button
                  type="button"
                  onClick={() => setShowMediaPreview(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Ocultar visualização
                </button>
              </div>

              {/* Preview Box */}
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video max-h-56 relative flex items-center justify-center">
                <DriveImage
                  src={post.mediaUrl}
                  alt={post.title}
                  className="w-full h-full object-contain bg-slate-950"
                />
              </div>

              {/* DATA DA PUBLICAÇÃO AGENDADA: LOGO ABAIXO DO PREVIEW */}
              <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/90 p-2.5 px-3 rounded-xl border border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Data da Publicação Agendada:
                </span>
                <span className="font-bold text-slate-100 font-mono">
                  {new Date(post.scheduledDate).toLocaleString('pt-BR')}
                </span>
              </div>

              {attachedInspirations.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inspirações vinculadas:</span>
                  {attachedInspirations.map(insp => (
                    <a
                      key={insp.id}
                      href={insp.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline font-medium"
                    >
                      {insp.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PARTE DE ARMAZENAMENTO TEMPORÁRIO (VISÍVEL SOMENTE PARA SOCIAL MEDIA) */}
        {currentUserRole === 'social_media' && (
          <div className="px-5 sm:px-6 pb-2 animate-fade-in">
            <div className="bg-[#0c1224] border border-amber-500/30 p-3.5 rounded-2xl space-y-2 text-xs shadow-lg">
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
              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Status de Publicação:</span>
                  <button
                    type="button"
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

                {post.isPublished && !post.previewCleanedUp && (
                  <button
                    type="button"
                    onClick={() => onConfirmPreviewCleanup?.(post.id)}
                    className="w-full py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Confirmar com Social Media & Liberar Exclusão de Preview</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CENTRAL CHAT CONTAINER ("Foco no Chat") */}
        <div className="px-5 sm:px-6 pb-4 flex-1 flex flex-col min-h-0">
          <div className="bg-[#0c1224] border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col flex-1">
            
            {/* Chat Header inside the card */}
            <div className="pb-3 border-b border-slate-800/70">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base sm:text-lg leading-tight">
                      Discussão da Publicação
                    </h3>
                  </div>
                </div>

                {/* Participants badge pill */}
                <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium px-3.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span>{participantCount} participantes</span>
                </div>
              </div>

              {/* Welcoming Subtitle */}
              <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed">
                Olá, vamos debater a proposta da publicação. Sintam-se à vontade para compartilhar suas opiniões e fazer perguntas.
              </p>
            </div>

            {/* Chat Messages Stream (Scrollable) */}
            <div className="flex-1 overflow-y-auto max-h-[360px] min-h-[200px] py-4 space-y-4 pr-1">
              {post.comments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs sm:text-sm italic">
                  Nenhum comentário enviado ainda. Digite sua mensagem abaixo para iniciar o debate com a equipe.
                </div>
              ) : (
                post.comments.map((comment) => {
                  const isCurrentUser = 
                    comment.authorRole === currentUserRole || 
                    (currentUserRole === 'social_media' && comment.authorName?.toLowerCase().includes('social media')) ||
                    (currentUserRole === 'cliente' && comment.authorName?.toLowerCase().includes('cliente'));

                  return (
                    <div 
                      key={comment.id}
                      className={`flex items-end gap-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Left Avatar for others */}
                      {!isCurrentUser && (
                        <div 
                          className="w-8 h-8 rounded-full bg-indigo-700/80 border border-indigo-500/30 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                          title={comment.authorName}
                        >
                          {getInitial(comment.authorName)}
                        </div>
                      )}

                      {/* Bubble & Author Info */}
                      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                        <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5 font-medium">
                          <span className="text-white font-semibold">{comment.authorName}</span>
                          <span>{comment.timestamp}</span>
                        </div>

                        <div 
                          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                            isCurrentUser
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-[#182138] text-slate-100 rounded-tl-none border border-slate-700/60'
                          }`}
                        >
                          {comment.text}
                        </div>
                      </div>

                      {/* Right Avatar for current user */}
                      {isCurrentUser && (
                        <div 
                          className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-400/40 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                          title={comment.authorName || currentUserDisplayName}
                        >
                          {getInitial(comment.authorName || currentUserDisplayName)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar */}
            <form onSubmit={handleCommentSubmit} className="mt-2">
              <div className="bg-[#070b16] border border-slate-700/80 hover:border-slate-600 rounded-full px-4 py-2 flex items-center gap-2.5 shadow-inner transition-colors">
                
                {/* Paperclip button to view/inspect attached media */}
                <button
                  type="button"
                  onClick={() => setShowMediaPreview(!showMediaPreview)}
                  className={`p-1.5 rounded-full transition-colors ${
                    showMediaPreview ? 'text-indigo-400 bg-indigo-950/60' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={showMediaPreview ? 'Ocultar anexo de mídia' : 'Ver anexo de mídia da publicação'}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Message input */}
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                />

                {/* Purple send button */}
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/40 shrink-0"
                  title="Enviar mensagem"
                >
                  <Send className="w-3.5 h-3.5 translate-x-px" />
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* BOTTOM BAR: Link público de aprovação + 2 BOTÕES: Copiar Link & Aprovado */}
        <div className="p-5 sm:p-6 pt-2">
          <div className="bg-[#0c1224] border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            
            {/* Left: Link público de aprovação */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Link2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  Link público de aprovação
                </span>
                <span className="text-[11px] text-slate-400 block truncate max-w-xs font-mono">
                  {approvalUrl}
                </span>
              </div>
            </div>

            {/* Right: Exactly 2 Buttons: Copiar Link e Aprovado */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              
              {/* Button 1: Copiar Link */}
              <button
                type="button"
                onClick={handleCopyApprovalLink}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {copiedTokenUrl ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              {/* Button 2: Aprovado */}
              <button
                type="button"
                onClick={handleToggleApprove}
                className={`flex-1 sm:flex-none px-6 py-2.5 font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                  post.status === 'aprovado'
                    ? 'bg-[#10b981] hover:bg-emerald-400 text-white shadow-emerald-500/30 cursor-default'
                    : 'bg-[#10b981] hover:bg-emerald-400 text-white shadow-emerald-500/30'
                }`}
                title={post.status === 'aprovado' ? 'Projeto já está aprovado' : 'Aprovar projeto'}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Aprovado</span>
              </button>
            </div>

          </div>

          {/* Feedback notice when approved */}
          {approvalThanksFeedback && (
            <div className="mt-3 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs text-emerald-200 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>🎉 Projeto aprovado com sucesso! Ele foi registrado e o status foi atualizado.</span>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal for Project Deletion */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative text-left text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Excluir Projeto</h3>
                <p className="text-[11px] text-slate-400">Ação irreversível</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <p>
                Tem certeza de que deseja apagar o projeto <strong className="text-white">"{post.title}"</strong>?
              </p>
              <p className="text-[11px] text-slate-400">
                Ele será removido permanentemente do sistema e do banco de dados.
              </p>
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
                    onClose();
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
