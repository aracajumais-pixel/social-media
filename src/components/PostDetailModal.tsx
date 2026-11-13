import React, { useState, useEffect, useRef } from 'react';
import { PostItem, UserRole, PostStatus, InspirationFile, SocialNetwork } from '../types';
import { 
  X, CheckCircle, Copy, Send, 
  MessageSquare, Trash2, Pencil, Check, Paperclip, Link2, 
  AlertTriangle, Image as ImageIcon, Sparkles, UploadCloud, Loader2,
  HardDrive, Eye, EyeOff, Calendar, Phone, Mail, User
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
  clientEmail?: string;
  clientName?: string;
  onUpdateStatus: (postId: string, newStatus: PostStatus) => void;
  onUpdateSocialNetworks?: (postId: string, networks: SocialNetwork[]) => void;
  onTogglePublished?: (postId: string, isPublished: boolean) => void;
  onConfirmPreviewCleanup?: (postId: string) => void;
  onAddComment: (postId: string, commentText: string, metadata?: { authorPhone?: string; authorEmail?: string; authorName?: string }) => void;
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
  clientWhatsapp,
  clientEmail,
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
  const [showMediaPreview, setShowMediaPreview] = useState(true);
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

  // Identification of User commenting (WhatsApp / E-mail / Nome)
  const defaultAuthorPhone = currentUserRole === 'cliente' ? (clientWhatsapp || '') : '';
  const defaultAuthorEmail = currentUserRole === 'cliente' ? (clientEmail || '') : '';
  const [authorPhoneInput, setAuthorPhoneInput] = useState(defaultAuthorPhone);
  const [authorEmailInput, setAuthorEmailInput] = useState(defaultAuthorEmail);
  const [showIdentifierConfig, setShowIdentifierConfig] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (post) {
      setEditedTitle(post.title);
      setEditedCaption(post.caption);
      setManualMediaUrl(post.mediaUrl || '');
    }
  }, [post?.id, post?.title, post?.caption, post?.mediaUrl]);

  useEffect(() => {
    if (clientWhatsapp && !authorPhoneInput) setAuthorPhoneInput(clientWhatsapp);
    if (clientEmail && !authorEmailInput) setAuthorEmailInput(clientEmail);
  }, [clientWhatsapp, clientEmail]);

  // Scroll to bottom of chat when new comments arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [post?.comments]);

  // Tecla Escape para fechar modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showDeleteConfirm) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showDeleteConfirm]);

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

  // Prevents duplicate approval comments if already approved
  const handleToggleApprove = () => {
    if (post.status !== 'aprovado') {
      onUpdateStatus(post.id, 'aprovado');
      
      const alreadyHasApproval = post.comments.some(c => 
        c.text.toLowerCase().includes('aprovad') || 
        c.text.toLowerCase().includes('post aprovado') || 
        c.text.toLowerCase().includes('projeto aprovado')
      );

      if (!alreadyHasApproval) {
        onAddComment(post.id, '🎉 Projeto aprovado com sucesso!', {
          authorPhone: authorPhoneInput.trim() || clientWhatsapp,
          authorEmail: authorEmailInput.trim() || clientEmail,
          authorName: currentUserRole === 'cliente' ? `${clientName || 'Cliente'} (Cliente)` : 'Social Media'
        });
      }

      setApprovalThanksFeedback(true);
      setTimeout(() => setApprovalThanksFeedback(false), 4000);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    onAddComment(post.id, newComment.trim(), {
      authorPhone: authorPhoneInput.trim() || clientWhatsapp,
      authorEmail: authorEmailInput.trim() || clientEmail,
      authorName: currentUserRole === 'cliente' ? `${clientName || 'Cliente'} (Cliente)` : 'Social Media'
    });

    setNewComment('');
  };

  // Determine current user display label
  const currentUserDisplayName = 
    currentUserRole === 'cliente' ? (clientName || 'Cliente') :
    currentUserRole === 'social_media' ? 'Social Media' : 'Gestor';

  // Sanitize comments to deduplicate repeated approval messages from previous clicks
  const sanitizedComments = post.comments.filter((comment, index, arr) => {
    const isApproval = comment.text.toLowerCase().includes('aprovad');
    if (isApproval) {
      const firstIdx = arr.findIndex(c => c.text.toLowerCase().includes('aprovad'));
      return index === firstIdx;
    }
    return true;
  });

  // Compute unique participants for the counter badge
  const commentAuthors = sanitizedComments.map(c => c.authorName?.trim()).filter(Boolean);
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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center py-2 sm:py-6">
        <div 
          className="bg-[#090d18] border border-indigo-900/50 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative text-white"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* ============================================================ */}
          {/* CABEÇALHO SUPERIOR FIXO / STICKY: Título, Legenda, Excluir e Botão X */}
          {/* ============================================================ */}
          <div className="p-4 sm:p-5 pb-3 border-b border-slate-800/80 bg-[#090d18] shrink-0 sticky top-0 z-30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 pr-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 mb-1.5">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="bg-slate-900 text-white font-extrabold text-base px-2.5 py-1 rounded-xl border border-indigo-500/70 focus:outline-none w-full max-w-md"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') setIsEditingTitle(false);
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveTitle}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(false)}
                      className="p-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                      {post.title}
                    </h2>
                    {onUpdatePostFields && (
                      <button
                        type="button"
                        onClick={() => setIsEditingTitle(true)}
                        className="p-1 text-slate-500 hover:text-white transition-colors rounded-lg"
                        title="Editar título"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Legenda Snippet */}
                {isEditingCaption ? (
                  <div className="mt-1.5 space-y-1.5">
                    <textarea
                      rows={2}
                      value={editedCaption}
                      onChange={(e) => setEditedCaption(e.target.value)}
                      className="w-full bg-slate-900 text-xs text-white p-2 rounded-xl border border-indigo-500/60 focus:outline-none"
                      placeholder="Editar legenda..."
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSaveCaption}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingCaption(false)}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="mt-0.5 flex items-center gap-1 cursor-pointer group/caption"
                    onClick={() => onUpdatePostFields && setIsEditingCaption(true)}
                    title="Clique para editar legenda"
                  >
                    <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-relaxed">
                      {post.caption || 'Sem legenda cadastrada.'}
                    </p>
                    {onUpdatePostFields && (
                      <Pencil className="w-3 h-3 text-slate-600 group-hover/caption:text-slate-400 opacity-0 group-hover/caption:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                )}
              </div>

              {/* Botão Excluir Projeto e Botão X de Fechar */}
              <div className="flex items-center gap-2 shrink-0">
                {onDeletePost && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border border-rose-500/60 hover:border-rose-500 bg-transparent hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 transition-all"
                    title="Excluir este projeto"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span className="hidden sm:inline">Excluir Projeto</span>
                  </button>
                )}

                {/* BOTÃO X DE FECHAR: Sempre no topo, destacado, acessível e visível */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-md shrink-0 border border-slate-700/80"
                  title="Fechar janela (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* CORPO DO MODAL COM ROLAGEM VERTICAL LIMPA */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* ============================================================ */}
              {/* LADO ESQUERDO: IMAGEM DO PROJETO, DATA, UPLOAD & STORAGE   */}
              {/* ============================================================ */}
              <div className="lg:col-span-5 space-y-3.5">
                
                {/* Card da Imagem / Mídia do Projeto */}
                <div className="bg-[#0c1224] border border-indigo-500/25 rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-indigo-400" />
                      Mídia da Publicação
                    </span>
                    <span className="text-[10px] text-slate-400">Prévia do Projeto</span>
                  </div>

                  {/* Visualização da Mídia */}
                  <div className="rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-950 aspect-[4/5] sm:aspect-square relative flex items-center justify-center group shadow-inner">
                    <DriveImage
                      src={post.mediaUrl}
                      alt={post.title}
                      className="w-full h-full object-cover bg-slate-950"
                    />
                    {post.status === 'aprovado' && (
                      <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 border border-emerald-300/40">
                        <CheckCircle className="w-3 h-3 text-emerald-100" />
                        <span>PROJETO APROVADO</span>
                      </div>
                    )}
                    {post.status === 'rascunho' && (
                      <div className="absolute top-2.5 right-2.5 bg-amber-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border border-amber-300/40">
                        <span>EM PROJETO</span>
                      </div>
                    )}
                    {post.status === 'alterar' && (
                      <div className="absolute top-2.5 right-2.5 bg-rose-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border border-rose-300/40">
                        <span>AJUSTE SOLICITADO</span>
                      </div>
                    )}
                  </div>

                  {/* Data da Publicação Agendada logo abaixo do preview */}
                  <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/90 p-2.5 px-3 rounded-xl border border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      Data Agendada:
                    </span>
                    <span className="font-bold text-slate-100 font-mono text-[11px]">
                      {post.scheduledDate ? new Date(post.scheduledDate).toLocaleString('pt-BR') : 'A definir'}
                    </span>
                  </div>

                  {/* Botões de Upload e Substituir Mídia */}
                  <div className="flex items-center gap-2">
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
                      className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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

                    <button
                      type="button"
                      onClick={() => setIsEditingMediaUrl(!isEditingMediaUrl)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      title="Substituir mídia por link do Drive ou URL"
                    >
                      <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Substituir Mídia</span>
                    </button>
                  </div>

                  {/* Input de Substituir Mídia se acionado */}
                  {isEditingMediaUrl && (
                    <div className="pt-2 border-t border-slate-800 space-y-2 animate-fade-in">
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="url"
                          value={manualMediaUrl}
                          onChange={(e) => setManualMediaUrl(e.target.value)}
                          placeholder="Cole novo link do Drive ou URL..."
                          className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-indigo-500/50 focus:outline-none"
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
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingMediaUrl(false)}
                            className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-xl"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadSuccessFeedback && (
                    <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mídia atualizada com sucesso!</span>
                    </div>
                  )}
                  {uploadError && (
                    <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>

                {/* Card de Armazenamento Temporário (somente para Social Media) */}
                {currentUserRole === 'social_media' && (
                  <div className="bg-[#0c1224] border border-amber-500/30 p-3 rounded-2xl space-y-2 text-xs shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
                        <HardDrive className="w-3.5 h-3.5" /> Armazenamento Temporário
                      </span>
                      <span className="text-[10px] text-slate-400">R$ 0,50/post</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      As mídias em aprovação são temporárias. Após a publicação nas redes, o preview é liberado para limpeza.
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Status de Publicação:</span>
                        <button
                          type="button"
                          onClick={() => onTogglePublished?.(post.id, !post.isPublished)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                            post.isPublished
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-700'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>{post.isPublished ? 'Publicado nas Redes' : 'Aguardando Publicação'}</span>
                        </button>
                      </div>

                      {post.isPublished && !post.previewCleanedUp && (
                        <button
                          type="button"
                          onClick={() => onConfirmPreviewCleanup?.(post.id)}
                          className="w-full py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all mt-1"
                        >
                          <Trash2 className="w-3 h-3 text-amber-400" />
                          <span>Confirmar & Liberar Exclusão de Preview</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Inspirações vinculadas (se houver) */}
                {attachedInspirations.length > 0 && (
                  <div className="bg-purple-950/20 border border-purple-800/40 p-3 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-purple-300 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Inspiração Vinculada:</span>
                    </div>
                    {attachedInspirations.map(insp => (
                      <div key={insp.id} className="text-xs text-slate-300 flex items-center justify-between">
                        <span className="truncate">{insp.title}</span>
                        <a href={insp.url} target="_blank" rel="noreferrer" className="text-purple-300 underline font-semibold text-[11px]">
                          Ver Anexo
                        </a>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* ============================================================ */}
              {/* LADO DIREITO: O ESPAÇO DO CHAT / DEBATE                    */}
              {/* ============================================================ */}
              <div className="lg:col-span-7 bg-[#0c1224] border border-indigo-500/30 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between h-full min-h-[460px]">
                
                {/* Header do Chat */}
                <div className="pb-3 border-b border-slate-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm sm:text-base leading-tight">
                          Discussão da Publicação
                        </h3>
                      </div>
                    </div>

                    {/* Badge de Participantes */}
                    <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                      <span>{participantCount} participantes</span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                    Olá, vamos debater a proposta da publicação. Sintam-se à vontade para compartilhar suas opiniões e fazer perguntas.
                  </p>
                </div>

                {/* Mensagens do Chat com Identificação de WhatsApp / E-mail */}
                <div className="overflow-y-auto max-h-[320px] min-h-[220px] py-3 space-y-3 pr-1 flex-1">
                  {sanitizedComments.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs italic">
                      Nenhum comentário enviado ainda. Digite sua mensagem abaixo para iniciar o debate.
                    </div>
                  ) : (
                    sanitizedComments.map((comment) => {
                      const isCurrentUser = 
                        comment.authorRole === currentUserRole || 
                        (currentUserRole === 'social_media' && comment.authorName?.toLowerCase().includes('social media')) ||
                        (currentUserRole === 'cliente' && comment.authorName?.toLowerCase().includes('cliente'));

                      return (
                        <div 
                          key={comment.id}
                          className={`flex items-end gap-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isCurrentUser && (
                            <div 
                              className="w-7 h-7 rounded-full bg-indigo-700/80 border border-indigo-500/30 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm"
                              title={comment.authorName}
                            >
                              {getInitial(comment.authorName)}
                            </div>
                          )}

                          <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                            
                            {/* IDENTIFICAÇÃO DO AUTOR COM WHATSAPP OU E-MAIL */}
                            <div className="text-[10px] text-slate-400 mb-1 flex flex-wrap items-center gap-1.5 font-medium">
                              <span className="text-white font-semibold">{comment.authorName}</span>
                              
                              {comment.authorPhone && (
                                <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-md font-mono text-[9px] flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5 text-emerald-400" />
                                  {comment.authorPhone}
                                </span>
                              )}

                              {comment.authorEmail && (
                                <span className="bg-blue-950/80 border border-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded-md font-mono text-[9px] flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5 text-blue-400" />
                                  {comment.authorEmail}
                                </span>
                              )}

                              <span>{comment.timestamp}</span>
                            </div>

                            {/* Balão da Mensagem */}
                            <div 
                              className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                                isCurrentUser
                                  ? 'bg-indigo-600 text-white rounded-tr-none'
                                  : 'bg-[#182138] text-slate-100 rounded-tl-none border border-slate-700/60'
                              }`}
                            >
                              {comment.text}
                            </div>
                          </div>

                          {isCurrentUser && (
                            <div 
                              className="w-7 h-7 rounded-full bg-indigo-600 border border-indigo-400/40 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm"
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

                {/* Identificação de quem está comentando e input */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="text-slate-300 font-semibold">{currentUserDisplayName}</span>
                      {authorPhoneInput && (
                        <span className="text-emerald-400 flex items-center gap-0.5 truncate text-[10px]">
                          <Phone className="w-2.5 h-2.5" /> {authorPhoneInput}
                        </span>
                      )}
                      {authorEmailInput && !authorPhoneInput && (
                        <span className="text-blue-400 flex items-center gap-0.5 truncate text-[10px]">
                          <Mail className="w-2.5 h-2.5" /> {authorEmailInput}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowIdentifierConfig(!showIdentifierConfig)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold text-[10px] shrink-0"
                    >
                      {showIdentifierConfig ? 'Fechar' : 'Alterar Contato'}
                    </button>
                  </div>

                  {/* Painel opcional para configurar WhatsApp ou E-mail do Comentador */}
                  {showIdentifierConfig && (
                    <div className="p-2.5 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2 animate-fade-in text-xs">
                      <span className="text-[10px] font-bold text-slate-300 block">Identificação para os Comentários:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[10px] text-slate-400">WhatsApp que respondeu:</label>
                          <input
                            type="text"
                            value={authorPhoneInput}
                            onChange={(e) => setAuthorPhoneInput(e.target.value)}
                            placeholder="Ex: (79) 99999-9999"
                            className="w-full bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] text-slate-400">E-mail para identificação:</label>
                          <input
                            type="email"
                            value={authorEmailInput}
                            onChange={(e) => setAuthorEmailInput(e.target.value)}
                            placeholder="Ex: contato@empresa.com"
                            className="w-full bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barra de Envio de Mensagem */}
                  <form onSubmit={handleCommentSubmit} className="mt-1">
                    <div className="bg-[#070b16] border border-slate-700/80 hover:border-slate-600 rounded-full px-4 py-2 flex items-center gap-2.5 shadow-inner transition-colors">
                      <span className="text-slate-500 pl-1">
                        <Paperclip className="w-4 h-4" />
                      </span>

                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                      />

                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/40 shrink-0"
                        title="Enviar mensagem"
                      >
                        <Send className="w-3.5 h-3.5 translate-x-px" />
                      </button>
                    </div>
                  </form>
                </div>

              </div>

            </div>
          </div>

        {/* ============================================================ */}
        {/* CARD 4 (RODAPÉ): LINK PÚBLICO E OS 2 BOTÕES (COPIAR E APROVADO) */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-800/80 bg-[#090d18] shrink-0">
          <div className="bg-[#0c1224] border border-indigo-500/30 rounded-2xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            
            {/* Link público de aprovação */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Link2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">
                  Link público de aprovação
                </span>
                <span className="text-[10px] text-slate-400 block truncate max-w-[200px] sm:max-w-xs font-mono">
                  {approvalUrl}
                </span>
              </div>
            </div>

            {/* Os 2 Botões: Copiar Link e Aprovado */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCopyApprovalLink}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {copiedTokenUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleApprove}
                className={`flex-1 sm:flex-none px-6 py-2.5 font-bold text-xs rounded-full flex items-center justify-center gap-2 transition-all shadow-md ${
                  post.status === 'aprovado'
                    ? 'bg-[#10b981] hover:bg-emerald-400 text-white shadow-emerald-500/30 cursor-default'
                    : 'bg-[#10b981] hover:bg-emerald-400 text-white shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'
                }`}
                title={post.status === 'aprovado' ? 'Projeto já está aprovado' : 'Aprovar projeto'}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Aprovado</span>
              </button>
            </div>

          </div>

          {/* Feedback quando aprovado */}
          {approvalThanksFeedback && (
            <div className="mt-2.5 p-2.5 bg-emerald-950/70 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs text-emerald-200 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>🎉 Projeto aprovado com sucesso! O status foi atualizado.</span>
            </div>
          )}
        </div>
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
