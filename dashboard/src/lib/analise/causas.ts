/**
 * Quanto cada fator anda junto com o erro da previsão. Usa correlação de posto (Spearman):
 * vale para relações que sobem e descem juntas sem ser linha reta e aguenta valores extremos.
 * A confiança depende de quantos casos há: milhares de dias sustentam uma conclusão, quatro
 * cidades só apontam uma direção.
 */

/** Posto de cada valor (1 = menor); empates recebem a média dos postos. */
function postos(valores: number[]): number[] {
  const ordem = valores.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const resultado = new Array<number>(valores.length);
  let inicio = 0;
  while (inicio < ordem.length) {
    let fim = inicio;
    while (fim + 1 < ordem.length && ordem[fim + 1].v === ordem[inicio].v) fim += 1;
    const posto = (inicio + fim) / 2 + 1;
    for (let k = inicio; k <= fim; k += 1) resultado[ordem[k].i] = posto;
    inicio = fim + 1;
  }
  return resultado;
}

/** Correlação de Spearman entre dois conjuntos de mesmo tamanho (−1 a +1; NaN com menos de 3 casos). */
export function correlacaoDePosto(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return Number.NaN;
  const px = postos(x.slice(0, n));
  const py = postos(y.slice(0, n));
  const mx = px.reduce((a, b) => a + b, 0) / n;
  const my = py.reduce((a, b) => a + b, 0) / n;
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < n; i += 1) {
    cov += (px[i] - mx) * (py[i] - my);
    vx += (px[i] - mx) ** 2;
    vy += (py[i] - my) ** 2;
  }
  return vx === 0 || vy === 0 ? Number.NaN : cov / Math.sqrt(vx * vy);
}

export type Relacao = "forte" | "moderada" | "fraca" | "nenhuma";
export type Confianca = "alta" | "baixa" | "muito baixa";

/** Quão forte é a relação, pelo tamanho da correlação. */
export function relacaoDaCorrelacao(rho: number): Relacao {
  const r = Math.abs(rho);
  if (Number.isNaN(r)) return "nenhuma";
  if (r >= 0.5) return "forte";
  if (r >= 0.3) return "moderada";
  if (r >= 0.15) return "fraca";
  return "nenhuma";
}

/** Quanto dá para confiar, pela quantidade de casos. */
export function confiancaDaAmostra(casos: number): Confianca {
  if (casos >= 100) return "alta";
  if (casos >= 10) return "baixa";
  return "muito baixa";
}

export type Fator = {
  id: string;
  /** O que foi comparado com o erro. */
  nome: string;
  /** Em que unidade se contam os casos. */
  unidadeDosCasos: "dias" | "cidades";
  casos: number;
  /** Correlação com o erro: positiva quando o erro cresce junto com o fator. */
  correlacao: number;
  relacao: Relacao;
  confianca: Confianca;
};

export function montarFator(
  id: string,
  nome: string,
  unidadeDosCasos: Fator["unidadeDosCasos"],
  fator: number[],
  erro: number[],
): Fator {
  const casos = Math.min(fator.length, erro.length);
  const correlacao = correlacaoDePosto(fator, erro);
  return {
    id,
    nome,
    unidadeDosCasos,
    casos,
    correlacao,
    relacao: relacaoDaCorrelacao(correlacao),
    confianca: confiancaDaAmostra(casos),
  };
}
