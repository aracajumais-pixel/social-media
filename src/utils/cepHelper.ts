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
 * Consulta o endereço através do CEP utilizando a API pública do ViaCEP com fallback automático para BrasilAPI.
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  // 1. Tenta ViaCEP com timeout rápido (3 segundos)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (!data.erro) {
        return {
          cep: data.cep || clean,
          logradouro: data.logradouro || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          localidade: data.localidade || '',
          uf: data.uf || ''
        };
      }
    }
  } catch (err) {
    console.warn('ViaCEP indisponível ou timeout, tentando BrasilAPI como fallback...');
  }

  // 2. Fallback resiliente BrasilAPI
  try {
    const res2 = await fetch(`https://brasilapi.com.br/api/cep/v1/${clean}`);
    if (res2.ok) {
      const data2 = await res2.json();
      return {
        cep: data2.cep || clean,
        logradouro: data2.street || '',
        complemento: '',
        bairro: data2.neighborhood || '',
        localidade: data2.city || '',
        uf: data2.state || ''
      };
    }
  } catch (err2) {
    console.warn('Erro ao consultar BrasilAPI fallback:', err2);
  }

  return null;
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
