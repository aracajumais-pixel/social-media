/**
 * Utilitário para envio manual via WhatsApp
 * Abre diretamente a URL api.whatsapp.com com texto pré-preenchido e número formatado
 */
export const openWhatsAppDirect = (phone?: string, message?: string) => {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const encodedText = encodeURIComponent(message || '');
  
  let targetUrl = '';
  if (cleanPhone) {
    // Adiciona código do país 55 se o número tiver 10 ou 11 dígitos (DDD + telefone) e não começar com 55
    const formattedPhone = (cleanPhone.length === 10 || cleanPhone.length === 11) && !cleanPhone.startsWith('55')
      ? `55${cleanPhone}`
      : cleanPhone;
    targetUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
  } else {
    targetUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
};
