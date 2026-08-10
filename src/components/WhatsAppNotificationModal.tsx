import React, { useState } from 'react';
import { ClientProject, WhatsAppNotificationPayload } from '../types';
import { X, MessageSquare, Send, CheckCircle2, Phone, ExternalLink, Sparkles } from 'lucide-react';

interface WhatsAppNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: ClientProject;
  notificationHistory: WhatsAppNotificationPayload[];
  onTriggerNotification: (payload: WhatsAppNotificationPayload) => void;
  approvalToken?: string;
  defaultPostTitle?: string;
}

export const WhatsAppNotificationModal: React.FC<WhatsAppNotificationModalProps> = ({
  isOpen,
  onClose,
  selectedClient,
  notificationHistory,
  onTriggerNotification,
  approvalToken,
  defaultPostTitle
}) => {
  if (!isOpen) return null;

  const [notificationType, setNotificationType] = useState<WhatsAppNotificationPayload['type']>('novo_rascunho');
  const [postTitle, setPostTitle] = useState(defaultPostTitle || 'Novo Post do Instagram / Reels');
  const [customMsg, setCustomMsg] = useState('');
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);

  const getTemplateMessage = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const approvalUrl = approvalToken ? `${origin}/?approvalToken=${approvalToken}` : origin;

    switch (notificationType) {
      case 'novo_rascunho':
        return `Olá ${selectedClient.contactName}! 🎨 Um novo rascunho de post ("${postTitle}") está disponível no Social Media 5.0 para sua aprovação.\n\nAcesse o link para revisar a legenda e mídia:\n${approvalUrl}`;
      case 'pedido_alteracao':
        return `Atenção Equipe Social Media! ⚠️ O cliente ${selectedClient.name} solicitou ajustes na publicação "${postTitle}". Por favor verifique o comentário no app.`;
      case 'aprovacao':
        return `Excelente notícia! 🎉 O post "${postTitle}" foi APROVADO pelo cliente ${selectedClient.name} e está pronto para o agendamento!`;
      case 'novo_recibo':
        return `Olá ${selectedClient.contactName}! 📄 O seu recibo e fechamento do período do cliente ${selectedClient.name} foi gerado e está disponível para download em PDF.`;
    }
  };

  const formattedWhatsAppUrl = `https://wa.me/${selectedClient.whatsappNumber}?text=${encodeURIComponent(
    customMsg || getTemplateMessage()
  )}`;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerNotification({
      recipientPhone: selectedClient.whatsappNumber,
      recipientName: selectedClient.contactName,
      type: notificationType,
      postTitle,
      customMessage: customMsg || getTemplateMessage()
    });

    setDispatchedSuccess(true);
    setTimeout(() => {
      setDispatchedSuccess(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Central de Disparo & Notificações WhatsApp</h2>
              <p className="text-xs text-slate-400">Automação de mensagens para cada etapa do processo</p>
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
                <option value="novo_rascunho">🎨 Novo Rascunho Enviado ao Cliente</option>
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

          <div>
            <label className="block text-slate-300 font-bold mb-1">Pré-visualização da Mensagem Formatada:</label>
            <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-800/40 text-emerald-100 leading-relaxed font-sans text-xs">
              {getTemplateMessage()}
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
              <span>Abrir no WhatsApp Web Diretamente</span>
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
                <span>Simular Envio Automático</span>
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
