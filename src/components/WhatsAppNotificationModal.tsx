import React, { useState } from 'react';
import { ClientProject, WhatsAppNotificationPayload } from '../types';
import { X, MessageSquare, Send, CheckCircle2, Phone, ExternalLink, Sparkles, Copy, Check, Link2 } from 'lucide-react';
import { buildApprovalUrl } from '../utils/token';
import { DriveImage } from './DriveImage';

interface WhatsAppNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: ClientProject;
  notificationHistory: WhatsAppNotificationPayload[];
  onTriggerNotification: (payload: WhatsAppNotificationPayload) => void;
  approvalToken?: string;
  defaultPostTitle?: string;
  defaultPostCaption?: string;
  defaultPostMediaUrl?: string;
}

export const WhatsAppNotificationModal: React.FC<WhatsAppNotificationModalProps> = ({
  isOpen,
  onClose,
  selectedClient,
  notificationHistory,
  onTriggerNotification,
  approvalToken,
  defaultPostTitle,
  defaultPostCaption,
  defaultPostMediaUrl
}) => {
  const [notificationType, setNotificationType] = useState<WhatsAppNotificationPayload['type']>('novo_rascunho');
  const [postTitle, setPostTitle] = useState(defaultPostTitle || 'Novo Post do Instagram / Reels');
  const [customMsg, setCustomMsg] = useState('');
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const host = typeof window !== 'undefined' ? window.location.host : 'socialmedia5.app';
  const approvalUrl = approvalToken ? buildApprovalUrl(approvalToken) : origin;

  const getTemplateMessage = () => {
    switch (notificationType) {
      case 'novo_rascunho':
        return `Olá ${selectedClient.contactName || selectedClient.name}! 🎨\n\nConfira a prévia da publicação "${postTitle}" para sua aprovação:\n\n${approvalUrl}`;
      case 'pedido_alteracao':
        return `Atenção Equipe Social Media! ⚠️ O cliente ${selectedClient.name} solicitou ajustes na publicação "${postTitle}".\n\n${approvalUrl}`;
      case 'aprovacao':
        return `Excelente notícia! 🎉 O post "${postTitle}" foi APROVADO pelo cliente ${selectedClient.name} e está pronto para o agendamento!\n\n${approvalUrl}`;
      case 'novo_recibo':
        return `Olá ${selectedClient.contactName || selectedClient.name}! 📄 O seu recibo e fechamento do período do cliente ${selectedClient.name} foi gerado e está disponível para download em PDF.`;
    }
  };

  const cleanPhone = (selectedClient.whatsappNumber || '').replace(/\D/g, '');
  const formattedPhone = (cleanPhone.length === 10 || cleanPhone.length === 11) && !cleanPhone.startsWith('55')
    ? `55${cleanPhone}`
    : cleanPhone;

  const finalMessage = customMsg || getTemplateMessage();
  const formattedWhatsAppUrl = formattedPhone
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(finalMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(finalMessage)}`;

  const handleCopyShareLink = () => {
    if (!approvalUrl) return;
    navigator.clipboard.writeText(approvalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerNotification({
      recipientPhone: selectedClient.whatsappNumber,
      recipientName: selectedClient.contactName,
      type: notificationType,
      postTitle,
      customMessage: finalMessage
    });

    setDispatchedSuccess(true);
    setTimeout(() => {
      setDispatchedSuccess(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Central de Disparo & Notificações WhatsApp</h2>
              <p className="text-xs text-slate-400">Link com cartão rico (imagem, descrição e botão clicável) para WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dispatch Form */}
        <form onSubmit={handleSend} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Destinatário do Projeto:</label>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 space-y-0.5">
                <div className="font-bold text-white">{selectedClient.contactName}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  +{selectedClient.whatsappNumber}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Gatilho da Etapa:</label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value as any)}
                className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="novo_rascunho">🎨 Novo Projeto Enviado ao Cliente</option>
                <option value="pedido_alteracao">⚠️ Cliente Solicitou Alteração</option>
                <option value="aprovacao">🎉 Publicação Aprovada pelo Cliente</option>
                <option value="novo_recibo">📄 Recibo / Fechamento do Mês Emitido</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Título do Item Relacionado:</label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
            />
          </div>

          {/* Prévia visual no estilo Instagram / WhatsApp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">Pré-visualização do Cartão no WhatsApp:</label>
              <div className="bg-[#0b141a] p-3 rounded-2xl border border-emerald-800/40">
                <div className="bg-[#1f2c34] rounded-xl overflow-hidden border border-white/10 shadow-md">
                  <div className="aspect-video w-full bg-slate-950 overflow-hidden">
                    {defaultPostMediaUrl ? (
                      <DriveImage src={defaultPostMediaUrl} alt={postTitle} className="w-full h-full object-cover" />
                    ) : (
                      <img src="/og-default.jpg" alt={postTitle} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-2.5 space-y-1">
                    <div className="text-xs font-bold text-white line-clamp-2 leading-snug">
                      {selectedClient.name}: &quot;{postTitle}&quot;
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                      {defaultPostCaption || 'Clique no cartão para visualizar a arte, comentar ou aprovar esta publicação.'}
                    </p>
                    <div className="pt-1.5 mt-1 border-t border-white/10 flex items-center justify-between gap-2 text-[10px] text-slate-300">
                      <span className="truncate font-mono flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        {host}
                      </span>
                      <img src="/favicon.jpg" alt="Ícone" className="w-4 h-4 rounded object-cover shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-300 font-bold">Mensagem & Link Compartilhável:</label>
              <textarea
                rows={5}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder={getTemplateMessage()}
                className="w-full bg-emerald-950/20 p-3 rounded-2xl border border-emerald-800/40 text-emerald-100 leading-relaxed font-sans text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{copiedLink ? 'Link Copiado para Colar no WhatsApp!' : 'Copiar Apenas o Link do Card'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            
            <a
              href={formattedWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir no WhatsApp Diretamente</span>
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {dispatchedSuccess && (
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Disparado com Sucesso!
                </span>
              )}
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
                <span>Registrar Envio</span>
              </button>
            </div>

          </div>

        </form>

        {/* History Log */}
        {notificationHistory.length > 0 && (
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Histórico de Disparos Recentes
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {notificationHistory.map((notif, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex justify-between items-center">
                  <span className="font-bold text-white uppercase">{notif.type.replace('_', ' ')}</span>
                  <span className="text-slate-400 truncate max-w-xs">{notif.postTitle || notif.customMessage}</span>
                  <span className="text-emerald-400 font-semibold">Enviado</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

