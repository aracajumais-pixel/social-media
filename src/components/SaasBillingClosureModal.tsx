import React, { useState } from 'react';
import { ClientProject, BillingReceipt, SocialMediaUser, UserRole, SaaSPaymentProof } from '../types';
import { 
  X, DollarSign, Printer, Send, CheckCircle2, Shield, 
  FileText, Calendar, Building2, UserCheck, Sparkles, Copy, Check, UploadCloud 
} from 'lucide-react';
import { valorPorExtenso } from '../utils/numberToWords';
import { openWhatsAppDirect } from '../utils/whatsappHelper';
import { SupabaseMediaUploader } from './SupabaseMediaUploader';

interface SaasBillingClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: ClientProject;
  socialMedia: SocialMediaUser | undefined;
  postsCount: number;
  feePerPost: number;
  period: string;
  currentUserRole: UserRole;
  onAddSaasProof?: (newProof: Omit<SaaSPaymentProof, 'id' | 'submittedAt' | 'status'>) => void;
}

export const SaasBillingClosureModal: React.FC<SaasBillingClosureModalProps> = ({
  isOpen,
  onClose,
  selectedClient,
  socialMedia,
  postsCount,
  feePerPost,
  period,
  currentUserRole,
  onAddSaasProof
}) => {
  if (!isOpen) return null;

  const totalFeeAmount = postsCount * feePerPost;
  const valorExtenso = valorPorExtenso(totalFeeAmount);

  const getTodayDateFormatted = () => {
    return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const [gestorPixKey, setGestorPixKey] = useState('financeiro@socialmedia5.com.br');
  const [gestorName, setGestorName] = useState('Gestão & Infraestrutura SaaS 5.0');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(gestorPixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleRegisterPayment = () => {
    if (onAddSaasProof && socialMedia) {
      onAddSaasProof({
        socialMediaId: socialMedia.id,
        socialMediaName: socialMedia.name,
        clientProjectId: selectedClient.id,
        clientName: selectedClient.name,
        period: period || 'Mês Atual',
        postsCount,
        feePerPost,
        totalAmount: totalFeeAmount,
        proofUrl: proofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
        notes: notes.trim() || undefined
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 3000);
    }
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Por favor autorize janelas pop-up para gerar o documento.');
      return;
    }

    const smName = socialMedia?.name || 'Social Media Prestador';
    const smCpfCnpj = socialMedia?.cnpj || '[CNPJ/CPF do Social Media]';
    const clientName = selectedClient.name;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Fechamento de Faturamento SaaS - ${period}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 50px 60px; color: #0f172a; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 20px; font-weight: 800; color: #1e1b4b; }
          .badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 11px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px; font-size: 13px; }
          .amount-box { background: #fffbeb; border: 2px solid #fde68a; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center; }
          .amount { font-size: 26px; font-weight: 900; color: #b45309; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          .table th { background: #f1f5f9; padding: 10px; text-align: left; border: 1px solid #cbd5e1; }
          .table td { padding: 10px; border: 1px solid #cbd5e1; }
          .footer-sign { margin-top: 50px; border-top: 1px solid #94a3b8; width: 280px; padding-top: 8px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Recibo de Fechamento de Faturamento SaaS</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Taxa de Infraestrutura e Licenciamento por Post</div>
          </div>
          <span class="badge">Gestor ⇄ Social Media</span>
        </div>

        <div class="info-box">
          <div><strong>Prestador da Plataforma (Gestor):</strong> ${gestorName}</div>
          <div><strong>Tomador da Infraestrutura (Social Media):</strong> ${smName} (CNPJ/CPF: ${smCpfCnpj})</div>
          <div><strong>Cliente Vinculado:</strong> ${clientName}</div>
          <div><strong>Mês de Competência:</strong> ${period || 'Mês Atual'}</div>
          <div><strong>Data do Fechamento:</strong> ${getTodayDateFormatted()}</div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Descrição do Serviço de Infraestrutura</th>
              <th style="text-align: center;">Quantidade de Posts</th>
              <th style="text-align: right;">Taxa Unitária</th>
              <th style="text-align: right;">Total Líquido</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Licenciamento SaaS, Armazenamento & Motor de Aprovação de Posts</td>
              <td style="text-align: center;">${postsCount} posts</td>
              <td style="text-align: right;">R$ ${feePerPost.toFixed(2)}</td>
              <td style="text-align: right; font-weight: bold; color: #b45309;">R$ ${totalFeeAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="amount-box">
          <div style="font-size: 12px; color: #78350f; font-weight: bold;">TOTAL A FATURAR DA TAXA DE INFRAESTRUTURA:</div>
          <div class="amount">R$ ${totalFeeAmount.toFixed(2)}</div>
          <div style="font-style: italic; color: #451a03; margin-top: 4px;">(${valorExtenso})</div>
        </div>

        <p style="font-size: 13px; line-height: 1.7; color: #334155;">
          Declaro para os devidos fins de acerto e fechamento financeiro interno que o valor acima discriminado corresponde à taxa de infraestrutura e hospedagem das publicações aprovadas do cliente <strong>${clientName}</strong> no período de <strong>${period}</strong>.
        </p>

        <div style="margin-top: 30px; font-size: 12px; color: #475569;">
          <div><strong>Dados Pix para Pagamento:</strong> ${gestorPixKey}</div>
          <div>Emissão realizada em ${getTodayDateFormatted()}.</div>
        </div>

        <div class="footer-sign">
          <strong>${gestorName}</strong><br/>
          Administração do SaaS
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleNotifyWhatsApp = () => {
    const targetPhone = socialMedia?.whatsapp || selectedClient.whatsappNumber;
    const text = `*Fechamento de Faturamento SaaS: Taxa de Infraestrutura*\n\n` +
      `📌 *Social Media:* ${socialMedia?.name || 'Profissional'}\n` +
      `🏢 *Cliente:* ${selectedClient.name}\n` +
      `📅 *Competência:* ${period || 'Mês Atual'}\n` +
      `📊 *Posts Faturados:* ${postsCount} posts\n` +
      `💰 *Taxa:* R$ ${feePerPost.toFixed(2)}/post\n` +
      `💵 *Total da Taxa SaaS:* R$ ${totalFeeAmount.toFixed(2)} (${valorExtenso})\n\n` +
      `🔑 *Chave Pix para Pagamento:* ${gestorPixKey}\n\n` +
      `Documento registrado com sucesso no sistema.`;
    
    openWhatsAppDirect(targetPhone, text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header do Fechamento */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                  Faturamento Gestor ⇄ Social Media
                </span>
                <span className="text-xs text-slate-400">• Modelo Oficial</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Fechamento de Faturamento: Taxa SaaS</h2>
              <p className="text-xs text-slate-300">
                Acerto de infraestrutura de postagens aprovadas (R$ {feePerPost.toFixed(2)} / post)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificação Toast de Registro com Sucesso */}
        {saveSuccess && (
          <div className="m-6 mb-0 bg-emerald-950/90 border border-emerald-500/60 p-3.5 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Fechamento da Taxa SaaS registrado no histórico de pagamentos com sucesso!</span>
          </div>
        )}

        {/* Corpo do Fechamento com Dados Calculados */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Card dos Dados do Acerto */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="font-bold text-amber-400 uppercase text-[11px] tracking-wider">
                Partes do Acerto de Infraestrutura
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Competência: <strong className="text-white">{period || 'Mês Atual'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px]">Prestador (Gestor do SaaS):</span>
                <strong className="text-white">{gestorName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Tomador (Social Media):</span>
                <strong className="text-indigo-300">{socialMedia?.name || 'Social Media Responsável'}</strong>
                {socialMedia?.cnpj && <span className="block text-[10px] text-slate-400">CPF/CNPJ: {socialMedia.cnpj}</span>}
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Cliente de Referência:</span>
                <strong className="text-white">{selectedClient.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Data do Fechamento:</span>
                <strong className="text-emerald-400">{getTodayDateFormatted()}</strong>
              </div>
            </div>
          </div>

          {/* Destaque do Valor da Taxa */}
          <div className="bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 p-5 rounded-2xl border border-amber-500/40 text-center space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Valor Total a Faturar da Taxa de Infraestrutura
            </span>
            <div className="text-3xl font-black text-amber-400 font-mono">
              R$ {totalFeeAmount.toFixed(2)}
            </div>
            <p className="text-xs text-slate-300 font-serif italic">
              "{valorExtenso}"
            </p>
            <div className="text-[11px] text-slate-400 pt-1">
              Cálculo: <strong className="text-white">{postsCount} posts</strong> × <strong className="text-white">R$ {feePerPost.toFixed(2)}</strong> por post
            </div>
          </div>

          {/* Dados Pix do Gestor para Pagamento */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Chave Pix do Gestor para Quitação da Taxa:
              </span>
              <button
                type="button"
                onClick={handleCopyPix}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              >
                {copiedPix ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedPix ? 'Copiado!' : 'Copiar Chave'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={gestorPixKey}
                onChange={(e) => setGestorPixKey(e.target.value)}
                className="w-full bg-slate-900 text-white font-mono p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-xs"
                placeholder="Chave Pix do Gestor"
              />
            </div>
          </div>

          {/* Upload do Comprovante Pix (Opcional) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
              Comprovante de Pagamento Pix (Opcional):
            </span>
            <SupabaseMediaUploader
              compact={true}
              currentUrl={proofUrl}
              folder="saas_proofs"
              onUploadSuccess={(url) => setProofUrl(url)}
            />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observação adicional ou código de autenticação Pix..."
              className="w-full bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Gerar PDF do Fechamento</span>
            </button>

            <button
              type="button"
              onClick={handleNotifyWhatsApp}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Enviar via WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onAddSaasProof && (
              <button
                type="button"
                onClick={handleRegisterPayment}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registrar Pagamento</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
