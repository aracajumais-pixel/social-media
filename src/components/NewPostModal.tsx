import React, { useState } from 'react';
import { PostItem, SocialNetwork, InspirationFile } from '../types';
import { X, Image, Video, Layers, Plus, Lightbulb, HardDrive, MessageSquare, CheckCircle2 } from 'lucide-react';
import { generateApprovalToken, calculateTokenExpirationDays, buildApprovalUrl } from '../utils/token';
import { getEmbeddableMediaUrl, isGoogleDriveUrl } from '../utils/driveHelper';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientProjectId: string;
  driveFolderUrl?: string;
  clientWhatsappNumber?: string;
  clientContactName?: string;
  inspirations: InspirationFile[];
  onCreatePost: (newPostData: Omit<PostItem, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => void;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({
  isOpen,
  onClose,
  clientProjectId,
  driveFolderUrl,
  clientWhatsappNumber,
  clientContactName,
  inspirations,
  onCreatePost
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'carousel'>('image');
  const [socialNetworks, setSocialNetworks] = useState<SocialNetwork[]>(['instagram', 'facebook']);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [selectedInspirations, setSelectedInspirations] = useState<string[]>([]);

  // Token gerado uma única vez, assim que o modal abre — usado tanto ao salvar
  // quanto para já montar o link de WhatsApp na tela de confirmação, sem duplicar token.
  const [generatedToken] = useState(() => generateApprovalToken());
  const [tokenExpiresAt] = useState(() => calculateTokenExpirationDays(5));
  const [justCreated, setJustCreated] = useState(false);

  const toggleNetwork = (network: SocialNetwork) => {
    if (socialNetworks.includes(network)) {
      setSocialNetworks(socialNetworks.filter(n => n !== network));
    } else {
      setSocialNetworks([...socialNetworks, network]);
    }
  };

  const toggleInspiration = (id: string) => {
    if (selectedInspirations.includes(id)) {
      setSelectedInspirations(selectedInspirations.filter(i => i !== id));
    } else {
      setSelectedInspirations([...selectedInspirations, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !caption.trim()) return;

    const processedMediaUrl = mediaUrl.trim() 
      ? getEmbeddableMediaUrl(mediaUrl.trim())
      : 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80';

    onCreatePost({
      clientProjectId,
      title,
      caption,
      mediaUrl: processedMediaUrl,
      mediaType,
      socialNetworks: socialNetworks.length > 0 ? socialNetworks : ['instagram'],
      scheduledDate,
      status: 'rascunho', // Sempre inicia como Rascunho
      approvalToken: generatedToken,
      tokenExpiresAt,
      inspirationReferenceIds: selectedInspirations
    });

    setJustCreated(true);
  };

  const approvalUrl = buildApprovalUrl(generatedToken);
  const cleanClientPhone = (clientWhatsappNumber || '').replace(/\D/g, '');
  const whatsappMessage = `Olá${clientContactName ? ' ' + clientContactName : ''}! Temos um novo rascunho pronto para sua aprovação: "${title}".\n\nAcesse o link para revisar e aprovar:\n${approvalUrl}`;
  const directWhatsAppUrl = `https://wa.me/${cleanClientPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  if (justCreated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Rascunho criado com sucesso!</h3>
            <p className="text-xs text-slate-400 mt-1">Quer avisar o cliente agora pelo WhatsApp?</p>
          </div>

          <div className="flex flex-col gap-2">
            {clientWhatsappNumber && (
              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
                className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar WhatsApp Agora</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 p-6 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Novo Rascunho de Publicação
            </h2>
            <p className="text-xs text-slate-400">O post ficará em Rascunho para aguardar aprovação do cliente</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Title */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Título / Identificador da Peça:</label>
            <input
              type="text"
              required
              placeholder="Ex: Carrossel Dicas de Café para o Fim de Semana"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Legenda Recomendada:</label>
            <textarea
              required
              rows={4}
              placeholder="Digite o texto da legenda, emojis e hashtags..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
            />
          </div>

          {/* Media URL & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">URL da Mídia (Imagem, Vídeo ou Google Drive):</label>
              <input
                type="url"
                required
                placeholder="Ex: https://drive.google.com/file/d/123.../view ou URL direta"
                value={mediaUrl}
                onChange={(e) => {
                  const rawUrl = e.target.value;
                  const converted = rawUrl.trim() ? getEmbeddableMediaUrl(rawUrl) : rawUrl;
                  setMediaUrl(converted);
                }}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
              {mediaUrl.includes('googleusercontent.com/d/') && (
                <div className="mt-1.5 p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                  <span>✨ <strong>Tratamento Automático Ativo:</strong> O link do Google Drive foi convertido na URL direta da CDN de alta resolução (<code className="text-emerald-200">https://lh3.googleusercontent.com/d/ID</code>).</span>
                </div>
              )}
              <p className="text-[10px] text-indigo-300 mt-1 flex items-center gap-1 font-medium">
                <HardDrive className="w-3 h-3 text-indigo-400" />
                Cole o link de compartilhamento do Google Drive (seja /file/d/..., view?usp=sharing ou com /view) - conversão automática!
              </p>
              {driveFolderUrl && (
                <>
                  <a
                    href={driveFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition-colors"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    Faça o upload pelo Drive
                  </a>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Envie o arquivo lá e cole o link de compartilhamento aqui depois.
                  </p>
                </>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Formato da Mídia:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`flex-1 py-2.5 rounded-xl border font-bold flex items-center justify-center gap-1 ${
                    mediaType === 'image' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Image className="w-4 h-4" /> Imagem
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`flex-1 py-2.5 rounded-xl border font-bold flex items-center justify-center gap-1 ${
                    mediaType === 'video' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Video className="w-4 h-4" /> Vídeo
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('carousel')}
                  className={`flex-1 py-2.5 rounded-xl border font-bold flex items-center justify-center gap-1 ${
                    mediaType === 'carousel' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" /> Carrossel
                </button>
              </div>
            </div>
          </div>

          {/* Social Networks Selector */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Redes Sociais Destino:</label>
            <div className="flex flex-wrap gap-2">
              {(['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube'] as SocialNetwork[]).map(net => (
                <button
                  key={net}
                  type="button"
                  onClick={() => toggleNetwork(net)}
                  className={`px-3 py-2 rounded-xl capitalize font-bold border transition-colors ${
                    socialNetworks.includes(net)
                      ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Data e Hora Programada de Publicação:</label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Associate Inspirations from Client */}
          {inspirations.length > 0 && (
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-slate-300 font-bold flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Vincular Modelo/Inspiração enviado pelo Cliente:
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {inspirations.map(insp => (
                  <label key={insp.id} className="flex items-center gap-2 text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={selectedInspirations.includes(insp.id)}
                      onChange={() => toggleInspiration(insp.id)}
                      className="rounded border-slate-700 text-indigo-600"
                    />
                    <span className="font-medium">{insp.title}</span>
                    <span className="text-[10px] text-slate-500">({insp.uploadedByName})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20"
            >
              Salvar em Rascunho
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
