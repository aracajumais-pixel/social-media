import React, { useState } from 'react';
import { BillingReceipt, ClientProject, ReceiptLineItem, UserRole } from '../types';
import { printReceiptPDF } from '../utils/pdfGenerator';
import { valorPorExtenso } from '../utils/numberToWords';
import { FileText, Printer, Plus, Trash2, Shield, DollarSign, Send, CheckCircle2, Image as ImageIcon, Sparkles, EyeOff, BarChart2 } from 'lucide-react';

interface ReceiptGeneratorProps {
  receipts: BillingReceipt[];
  selectedClient: ClientProject;
  currentUserRole: UserRole;
  feePerPost?: number;
  onSaveReceipt: (receipt: BillingReceipt) => void;
  onSendWhatsAppReceipt: (receipt: BillingReceipt) => void;
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  receipts,
  selectedClient,
  currentUserRole,
  feePerPost = 0.50,
  onSaveReceipt,
  onSendWhatsAppReceipt
}) => {

  const existingReceipt = receipts.find(r => r.clientProjectId === selectedClient.id) || null;

  const [period, setPeriod] = useState(existingReceipt?.period || '');
  const [issueDate, setIssueDate] = useState(existingReceipt?.issueDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(existingReceipt?.dueDate || '');
  const [cityState, setCityState] = useState(existingReceipt?.cityState || '');
  const [serviceSummaryText, setServiceSummaryText] = useState(
    existingReceipt?.serviceSummaryText || ''
  );

  const [socialMediaName, setSocialMediaName] = useState(existingReceipt?.socialMediaName || '');
  const [socialMediaPix, setSocialMediaPix] = useState(existingReceipt?.socialMediaPix || '');
  const [socialMediaBank, setSocialMediaBank] = useState(existingReceipt?.socialMediaBank || '');
  const [socialMediaCpfCnpj, setSocialMediaCpfCnpj] = useState(existingReceipt?.socialMediaCpfCnpj || '');
  const [socialMediaSignatureUrl, setSocialMediaSignatureUrl] = useState(existingReceipt?.socialMediaSignatureUrl || '');

  const [notes, setNotes] = useState(existingReceipt?.notes || '');
  const [discount, setDiscount] = useState(existingReceipt?.discount || 0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [items, setItems] = useState<ReceiptLineItem[]>(
    existingReceipt?.items || [
      {
        id: 'item-1',
        description: '',
        quantity: 1,
        unitPrice: selectedClient?.pricePerPost || 150.00,
        total: selectedClient?.pricePerPost || 150.00
      }
    ]
  );

  const handleAddItem = () => {
    const newItem: ReceiptLineItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: selectedClient.pricePerPost || 50.00,
      total: selectedClient.pricePerPost || 50.00
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof ReceiptLineItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = Number(updated.quantity) * Number(updated.unitPrice);
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const subtotal = items.reduce((acc, curr) => acc + curr.total, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const totalPostsCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const platformFeeTotal = totalPostsCount * feePerPost;
  const valorExtenso = valorPorExtenso(totalAmount);

  const currentReceiptObj: BillingReceipt = {
    id: existingReceipt?.id || `rec-${Date.now()}`,
    receiptNumber: existingReceipt?.receiptNumber || `REC-2026-008`,
    clientProjectId: selectedClient.id,
    period: period || 'Mês Atual',
    issueDate,
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    items,
    subtotal,
    discount,
    totalAmount,
    platformFeeTotal,
    paymentMethod: 'Pix / Transferência Bancária',
    notes,
    status: existingReceipt?.status || 'enviado',
    cityState,
    serviceSummaryText,
    socialMediaName,
    socialMediaPix,
    socialMediaBank,
    socialMediaCpfCnpj,
    socialMediaSignatureUrl
  };

  const handlePrintPDF = () => {
    onSaveReceipt(currentReceiptObj);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 5000);
    printReceiptPDF(currentReceiptObj, selectedClient);
  };

  const handleSendWhatsApp = () => {
    onSaveReceipt(currentReceiptObj);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 5000);
    onSendWhatsAppReceipt(currentReceiptObj);
  };

  return (
    <div className="space-y-6">
      
      {/* Registration Confirmation Toast */}
      {saveSuccess && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 p-4 rounded-2xl flex items-center justify-between text-emerald-200 shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold">
              Recibo registrado e salvo com sucesso no histórico da plataforma!
            </span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-extrabold uppercase border border-emerald-500/30">
            Registrado
          </span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-800/40 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Recibo de Prestação de Serviços em Redes Sociais
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-emerald-500/30">
                  Modelo Oficial em PDF
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Preencha as informações do recibo, acompanhe a conversão do valor em extenso e imprima o documento formatado.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Gerar PDF do Recibo</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Notificar no WhatsApp</span>
          </button>
        </div>
      </div>

      {/* PRIVATE SOCIAL MEDIA HISTORY PANEL */}
      <div className="bg-slate-900 border border-indigo-800/40 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Histórico de Totais para Acompanhamento do Social Media
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1">
                  <EyeOff className="w-3 h-3 text-indigo-400" /> Oculto no PDF Final
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                O sistema proporciona o acompanhamento interno dos valores acumulados sem exibir esse bloco no documento impresso do cliente.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-bold">Total de Posts no Fechamento</span>
            <span className="text-base font-black text-white">{totalPostsCount} posts</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-bold">Valor Total Bruto</span>
            <span className="text-base font-black text-emerald-400">R$ {totalAmount.toFixed(2)}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-bold">Taxa SaaS de Infraestrutura: R$ 0,50 por post</span>
            <span className="text-base font-black text-amber-400">R$ {platformFeeTotal.toFixed(2)}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-bold">Lucro Líquido Estimado</span>
            <span className="text-base font-black text-purple-400">R$ {(totalAmount - platformFeeTotal).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Fields & Editor */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Dados do Recibo e Valores Individuais por Post
          </h3>

          {/* Client Registration Details Readonly Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-indigo-400 text-xs flex items-center justify-between">
              <span>Empresa Cliente (Tomador dos Serviços):</span>
              <span className="text-[10px] text-slate-400">Puxado do cadastro do cliente</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
              <div><strong>Razão Social:</strong> {selectedClient.companyName || '[Informe a Razão Social no Cadastro]'}</div>
              <div><strong>CNPJ / CPF:</strong> {selectedClient.cnpj || '[Informe o CNPJ/CPF]'}</div>
              <div className="sm:col-span-2"><strong>Endereço Completo:</strong> {selectedClient.address || '[Informe o Endereço Completo: Rua, Número, Bairro, CEP, Cidade-UF]'}</div>
            </div>
          </div>

          {/* Period, Date and Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Período de Referência:</label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="[Ex: Julho / 2026]"
                className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Cidade e UF de Emissão:</label>
              <input
                type="text"
                value={cityState}
                onChange={(e) => setCityState(e.target.value)}
                placeholder="[Digite Cidade - UF. Ex: Aracaju-SE]"
                className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Data de Emissão:</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Service Description Summary */}
          <div className="space-y-1 text-xs">
            <label className="block text-slate-300 font-bold">
              Texto Descritivo do Objeto do Recibo:
            </label>
            <textarea
              rows={2}
              value={serviceSummaryText}
              onChange={(e) => setServiceSummaryText(e.target.value)}
              placeholder="[Insira a descrição dos serviços: ex. criação e postagens de stories, 22 artes para o feed e 3 vídeos editados para Instagram e Meta Business]"
              className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Discriminação de Serviços e Valores por Post:</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Serviço
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      placeholder="[Descrição do item: Feed / Story / Vídeo]"
                      className="w-full bg-slate-900 text-white p-2 rounded-lg border border-slate-800 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                      placeholder="[Qtd]"
                      className="w-full bg-slate-900 text-white p-2 rounded-lg border border-slate-800 focus:outline-none text-center text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      step={5}
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                      placeholder="[Unit. R$]"
                      className="w-full bg-slate-900 text-white p-2 rounded-lg border border-slate-800 focus:outline-none text-right text-xs"
                    />
                  </div>

                  <div className="col-span-2 text-right font-bold text-emerald-400">
                    R$ {item.total.toFixed(2)}
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Value in Words (Extenso) Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400 font-bold text-[11px]">
              <span>Conversão Automática em Extenso:</span>
              <span className="text-emerald-400 font-bold">R$ {totalAmount.toFixed(2)}</span>
            </div>
            <p className="text-white font-serif italic text-sm bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              "{valorExtenso}"
            </p>
          </div>

          {/* Social Media Signature & Bank Info Block */}
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Dados do Social Media Prestador (Assinatura e Pagamento)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nome Completo do Prestador:</label>
                <input
                  type="text"
                  value={socialMediaName}
                  onChange={(e) => setSocialMediaName(e.target.value)}
                  placeholder="[Digite o Nome Completo do Social Media]"
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Chave Pix para Recebimento:</label>
                <input
                  type="text"
                  value={socialMediaPix}
                  onChange={(e) => setSocialMediaPix(e.target.value)}
                  placeholder="[Digite a Chave Pix: Telefone, E-mail ou CPF]"
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Banco / Agência / Conta:</label>
                <input
                  type="text"
                  value={socialMediaBank}
                  onChange={(e) => setSocialMediaBank(e.target.value)}
                  placeholder="[Digite o Banco: Ex. Banco Unibanco S.A.]"
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">CNPJ ou CPF do Prestador:</label>
                <input
                  type="text"
                  value={socialMediaCpfCnpj}
                  onChange={(e) => setSocialMediaCpfCnpj(e.target.value)}
                  placeholder="[Digite o CNPJ ou CPF do Prestador]"
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> URL da Assinatura Digitalizada (Opcional):
              </label>
              <input
                type="url"
                value={socialMediaSignatureUrl}
                onChange={(e) => setSocialMediaSignatureUrl(e.target.value)}
                placeholder="[URL da Imagem da Assinatura PNG/JPG ou deixe vazio para fonte cursiva digital]"
                className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

        </div>

        {/* Right Column: Visual Print Simulation Preview */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Pré-visualização do PDF do Recibo
              </h3>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-800/40">
                Fiel ao Print
              </span>
            </div>

            {/* Print Mock Box */}
            <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-300 text-xs space-y-4 font-sans shadow-md">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div className="font-extrabold text-sm text-slate-900 leading-tight">
                  Recibo de Prestação de Serviços em Redes Sociais
                </div>
                {selectedClient.logoUrl ? (
                  <img src={selectedClient.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
                ) : (
                  <div className="text-[10px] text-slate-400 border border-dashed border-slate-300 px-2 py-1 rounded">
                    [Logo Social Media]
                  </div>
                )}
              </div>

              <div className="space-y-1 text-[11px] text-slate-700">
                <div>Recebi da <strong>{selectedClient.companyName || '[Empresa Cliente LTDA]'}</strong></div>
                <div>{selectedClient.address || '[Endereço da Empresa Cliente]'}</div>
                <div>CNPJ: {selectedClient.cnpj || '[CNPJ do Cliente]'}</div>
              </div>

              <div className="text-xs leading-relaxed text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
                A quantia de <strong>R$ {totalAmount.toFixed(2)}</strong> (<em>{valorExtenso}</em>), referente a serviços de {serviceSummaryText || '[discriminação dos serviços]'}.
              </div>

              <div className="text-[11px] text-slate-600 font-bold">
                {cityState || '[Cidade - UF]'}, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </div>

              <div className="border-t border-slate-300 pt-3 space-y-1 text-[11px]">
                {socialMediaSignatureUrl ? (
                  <img src={socialMediaSignatureUrl} alt="Assinatura" className="h-8 object-contain mb-1" />
                ) : (
                  <div className="font-serif italic text-base text-slate-800 font-bold mb-1">
                    {socialMediaName || '[Assinatura do Prestador]'}
                  </div>
                )}
                <div className="font-bold text-slate-900">{socialMediaName || '[Wallace Rodrigues Rocha Silva]'}</div>
                <div>Pix: {socialMediaPix || '[Chave Pix]'}</div>
                <div>{socialMediaBank || '[Banco]'}</div>
                <div>CNPJ/CPF: {socialMediaCpfCnpj || '[CPF/CNPJ]'}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handlePrintPDF}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-2xl transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-4"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Recibo em PDF Agora</span>
          </button>
        </div>

      </div>

    </div>
  );
};
