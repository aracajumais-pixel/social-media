import { BillingReceipt, ClientProject } from '../types';
import { valorPorExtenso } from './numberToWords';
import { getEmbeddableMediaUrl } from './driveHelper';

export function printReceiptPDF(receipt: BillingReceipt, client: ClientProject) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Por favor autorize janelas pop-up para gerar o PDF do recibo.');
    return;
  }

  const valorExtenso = valorPorExtenso(receipt.totalAmount);
  
  // Format current date in Portuguese: "9 de julho de 2026"
  const dateObj = receipt.issueDate ? new Date(receipt.issueDate) : new Date();
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('pt-BR', options);

  const cityStateText = receipt.cityState || '[Cidade - UF]';
  const socialName = receipt.socialMediaName || '[Nome Completo do Social Media / Prestador]';
  const socialPix = receipt.socialMediaPix || '[Chave Pix para Pagamento]';
  const socialBank = receipt.socialMediaBank || '[Banco / Agência / Conta]';
  const socialCpfCnpj = receipt.socialMediaCpfCnpj || '[CNPJ ou CPF do Prestador]';

  const logoUrlClean = client.logoUrl ? getEmbeddableMediaUrl(client.logoUrl) : '';
  const signatureUrlClean = receipt.socialMediaSignatureUrl ? getEmbeddableMediaUrl(receipt.socialMediaSignatureUrl) : '';

  const logoHtml = logoUrlClean ? `
    <img src="${logoUrlClean}" alt="Logo" style="max-height: 55px; max-width: 160px; object-fit: contain;" />
  ` : `
    <div style="font-size: 13px; font-weight: bold; color: #475569; border: 1px dashed #cbd5e1; padding: 6px 12px; border-radius: 6px;">
      [Logo do Social Media / Agência]
    </div>
  `;

  const signatureHtml = signatureUrlClean ? `
    <img src="${signatureUrlClean}" alt="Assinatura Digital" style="max-height: 50px; margin-bottom: 4px;" />
  ` : `
    <div style="font-family: 'Dancing Script', 'Brush Script MT', cursive; font-size: 24px; color: #1e293b; font-style: italic; margin-bottom: 2px;">
      ${socialName}
    </div>
  `;

  // Dynamic Service Text
  const itemsDescription = receipt.serviceSummaryText || receipt.items.map(i => `${i.quantity}x ${i.description}`).join(', ');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Recibo de Prestação de Serviços em Redes Sociais - ${receipt.receiptNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap');
        body { 
          font-family: 'Helvetica Neue', Arial, sans-serif; 
          margin: 0; 
          padding: 50px 60px; 
          color: #0f172a; 
          background: #ffffff;
          line-height: 1.6;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 40px; 
        }
        .header-title { 
          font-size: 18px; 
          font-weight: 800; 
          color: #0f172a; 
          max-width: 420px;
        }

        .section-block {
          margin-bottom: 24px;
        }

        .company-name {
          font-size: 15px;
          font-weight: bold;
          color: #0f172a;
        }

        .company-address {
          font-size: 13px;
          color: #334155;
          margin-top: 2px;
        }

        .company-tax {
          font-size: 13px;
          color: #334155;
          margin-top: 4px;
        }

        .declaration-text {
          font-size: 14px;
          color: #1e293b;
          margin-top: 30px;
          margin-bottom: 30px;
          text-align: justify;
        }

        .date-location {
          font-size: 14px;
          color: #0f172a;
          margin-top: 35px;
          margin-bottom: 50px;
        }

        .signature-section {
          margin-top: 40px;
          width: 320px;
        }

        .signature-line {
          border-top: 1px solid #94a3b8;
          padding-top: 8px;
          margin-top: 8px;
        }

        .signature-name {
          font-size: 14px;
          font-weight: bold;
          color: #0f172a;
        }

        .signature-info {
          font-size: 12px;
          color: #475569;
          margin-top: 2px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          margin-bottom: 25px;
        }

        .items-table th {
          background: #f8fafc;
          border-bottom: 2px solid #cbd5e1;
          padding: 8px 10px;
          font-size: 11px;
          text-transform: uppercase;
          color: #475569;
          text-align: left;
        }

        .items-table td {
          border-bottom: 1px solid #e2e8f0;
          padding: 8px 10px;
          font-size: 12px;
          color: #334155;
        }

        @media print {
          body { padding: 30px; }
        }
      </style>
    </head>
    <body>
      
      <!-- HEADER -->
      <div class="header">
        <div class="header-title">
          Recibo de Prestação de Serviços em Redes Sociais
        </div>
        <div>
          ${logoHtml}
        </div>
      </div>

      <!-- CLIENT / TOMADOR DATA -->
      <div class="section-block">
        <div style="font-size: 13px; color: #475569; font-weight: 500;">Recebi da</div>
        <div class="company-name">${client.companyName || client.name || '[Razão Social da Empresa Cliente]'}</div>
        <div class="company-address">${client.address || '[Rua, Número, Bairro, CEP, Cidade - UF]'}</div>
        <div class="company-tax">
          <div>CNPJ: ${client.cnpj || '[CNPJ da Empresa Cliente]'}</div>
          <div>Inscrição Estadual: ${receipt.notes && receipt.notes.includes('IE:') ? receipt.notes.split('IE:')[1] : '[Inscrição Estadual ou Isento]'}</div>
        </div>
      </div>

      <!-- DECLARATION TEXT WITH EXTENSO VALUE -->
      <div class="declaration-text">
        A quantia de <strong>R$ ${receipt.totalAmount.toFixed(2)}</strong> (<em>${valorExtenso}</em>), referente a serviços de ${itemsDescription}.
      </div>

      <!-- DISCRIMINATED ITEMS TABLE -->
      <table class="items-table">
        <thead>
          <tr>
            <th>Item / Serviço</th>
            <th style="text-align: center;">Qtd</th>
            <th style="text-align: right;">Unitário</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${receipt.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">R$ ${item.unitPrice.toFixed(2)}</td>
              <td style="text-align: right; font-weight: bold;">R$ ${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- CITY AND DATE -->
      <div class="date-location">
        ${cityStateText}, ${formattedDate}.
      </div>

      <!-- SOCIAL MEDIA PROVIDER SIGNATURE & PAYMENT DETAILS -->
      <div class="signature-section">
        ${signatureHtml}
        <div class="signature-line">
          <div class="signature-name">${socialName}</div>
          <div class="signature-info">Pix: ${socialPix}</div>
          <div class="signature-info">${socialBank}</div>
          <div class="signature-info">CPF/CNPJ: ${socialCpfCnpj}</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
