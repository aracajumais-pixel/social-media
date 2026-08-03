// Helper to convert monetary values (BRL) to written Portuguese text (por extenso)
export function valorPorExtenso(valor: number): string {
  if (isNaN(valor) || valor <= 0) return 'zero reais';

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezAonove = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function tresDigitosPorExtenso(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    
    let res = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) {
      res += centenas[c];
    }

    const rest = n % 100;
    if (rest > 0) {
      if (c > 0) res += ' e ';
      if (rest >= 10 && rest <= 19) {
        res += dezAonove[rest - 10];
      } else {
        if (d > 0) {
          res += dezenas[d];
          if (u > 0) res += ' e ' + unidades[u];
        } else if (u > 0) {
          res += unidades[u];
        }
      }
    }
    return res;
  }

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  let partesInteiro: string[] = [];

  if (inteiro === 0) {
    partesInteiro.push('zero reais');
  } else {
    const milhoes = Math.floor(inteiro / 1000000);
    const milhares = Math.floor((inteiro % 1000000) / 1000);
    const unidadesSimples = inteiro % 1000;

    if (milhoes > 0) {
      const txt = tresDigitosPorExtenso(milhoes);
      partesInteiro.push(txt + (milhoes === 1 ? ' milhão' : ' milhões'));
    }

    if (milhares > 0) {
      const txt = tresDigitosPorExtenso(milhares);
      partesInteiro.push((milhares === 1 ? 'um mil' : txt + ' mil'));
    }

    if (unidadesSimples > 0) {
      const txt = tresDigitosPorExtenso(unidadesSimples);
      partesInteiro.push(txt);
    }
  }

  let extensos = partesInteiro.join(' e ') + (inteiro === 1 ? ' real' : ' reais');

  if (centavos > 0) {
    const centext = tresDigitosPorExtenso(centavos);
    extensos += ' e ' + centext + (centavos === 1 ? ' centavo' : ' centavos');
  }

  return extensos;
}
