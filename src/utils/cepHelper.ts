export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Consulta o endereço através do CEP utilizando a API pública e gratuita do ViaCEP.
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch (err) {
    console.warn('Erro ao consultar ViaCEP:', err);
    return null;
  }
}

/**
 * Formata um valor de CEP como 00000-000
 */
export function formatCep(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 8);
  if (clean.length > 5) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return clean;
}

/**
 * Monta o endereço completo formatado a partir dos campos
 */
export function buildFormattedAddress(params: {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}): string {
  const parts: string[] = [];
  if (params.street) {
    const num = params.number ? `, ${params.number}` : ', S/N';
    const comp = params.complement ? ` - ${params.complement}` : '';
    parts.push(`${params.street}${num}${comp}`);
  }
  if (params.neighborhood) {
    parts.push(params.neighborhood);
  }
  if (params.city && params.state) {
    parts.push(`${params.city}/${params.state}`);
  } else if (params.city) {
    parts.push(params.city);
  }
  if (params.cep) {
    parts.push(`CEP: ${formatCep(params.cep)}`);
  }
  return parts.join(' - ');
}
