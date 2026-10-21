/**
 * Correlação entre os erros das cidades: quando uma cidade erra num dia, as
 * outras erram junto? Para cada par de cidades, correlação de Pearson dos
 * erros diários (previsto − real), usando só os dias em que as duas têm erro.
 */
import type { LinhaComparada } from "@/lib/analise/comparacao";
import { media } from "@/lib/analise/metricas";

/** Menos dias em comum que isso e a correlação não é confiável: fica sem valor. */
export const MINIMO_DE_DIAS = 10;

export type CampoDeErro = "erro_temp_max" | "erro_temp_min" | "erro_chuva_mm";

export type MatrizDeCorrelacao = {
  /** Cidades (ids) nas linhas e colunas, em ordem alfabética. */
  cidades: string[];
  /** valores[i][j]: correlação entre cidades[i] e cidades[j]; null sem dias suficientes ou sem variação. */
  valores: Array<Array<number | null>>;
  /** Índice: média das correlações entre pares distintos de cidades (NaN se nenhum par tem valor). */
  indice: number;
};

/** Correlação de Pearson; null se há menos de MINIMO_DE_DIAS pares ou um dos lados não varia. */
export function pearson(x: number[], y: number[]): number | null {
  const n = x.length;
  if (n < MINIMO_DE_DIAS) return null;
  const mx = media(x);
  const my = media(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  // Arredondamentos podem passar de 1 por uma fração minúscula.
  return Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy)));
}

export function matrizDeCorrelacao(linhas: LinhaComparada[], campo: CampoDeErro): MatrizDeCorrelacao {
  const porCidade = new Map<string, Map<string, number>>();
  for (const l of linhas) {
    const erro = l[campo];
    if (erro === null) continue;
    const dias = porCidade.get(l.cidade_id) ?? new Map<string, number>();
    dias.set(l.dia_real, erro);
    porCidade.set(l.cidade_id, dias);
  }
  const cidades = [...new Set(linhas.map((l) => l.cidade_id))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const entre = (a: string, b: string): number | null => {
    const diasA = porCidade.get(a);
    const diasB = porCidade.get(b);
    if (!diasA || !diasB) return null;
    const x: number[] = [];
    const y: number[] = [];
    for (const [dia, erro] of diasA) {
      const outro = diasB.get(dia);
      if (outro === undefined) continue;
      x.push(erro);
      y.push(outro);
    }
    return pearson(x, y);
  };

  const valores = cidades.map((a, i) => cidades.map((b, j) => (i === j ? 1 : entre(a, b))));
  const pares = valores.flatMap((linha, i) => linha.filter((_, j) => j > i));
  return { cidades, valores, indice: media(pares) };
}
