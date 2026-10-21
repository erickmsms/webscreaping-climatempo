/**
 * Olhares sobre a chuva além da média: que tipo de erro a previsão comete (avisar à toa
 * ou deixar passar), como erra conforme o tamanho da chuva e se o total do período bate.
 */
import type { LinhaComparada } from "@/lib/analise/comparacao";
import { agruparPorCidade, bias, mae } from "@/lib/analise/metricas";

export type AvisoDeChuva = {
  /** Previu chuva e choveu, ou não previu e não choveu. */
  acertos: number;
  /** Choveu sem aviso. */
  surpresas: number;
  /** Avisou chuva que não veio. */
  alarmesFalsos: number;
  total: number;
};

export function avisoDeChuva(linhas: LinhaComparada[]): AvisoDeChuva {
  let surpresas = 0;
  let alarmesFalsos = 0;
  for (const l of linhas) {
    if (l.real_choveu && !l.prev_choveu) surpresas += 1;
    if (!l.real_choveu && l.prev_choveu) alarmesFalsos += 1;
  }
  return { acertos: linhas.length - surpresas - alarmesFalsos, surpresas, alarmesFalsos, total: linhas.length };
}

/** Faixas de chuva real (mm), da garoa ao temporal. O limite superior não entra na faixa. */
export const FAIXAS_DE_CHUVA = [
  { id: "garoa", rotulo: "Garoa", intervalo: "até 2 mm", de: 0, ate: 2 },
  { id: "fraca", rotulo: "Chuva fraca", intervalo: "2 a 10 mm", de: 2, ate: 10 },
  { id: "moderada", rotulo: "Chuva moderada", intervalo: "10 a 30 mm", de: 10, ate: 30 },
  { id: "forte", rotulo: "Temporal", intervalo: "mais de 30 mm", de: 30, ate: Number.POSITIVE_INFINITY },
] as const;

export type ErroPorFaixa = {
  id: (typeof FAIXAS_DE_CHUVA)[number]["id"];
  rotulo: string;
  intervalo: string;
  dias: number;
  /** Erro médio em mm, sem sinal. */
  mae: number;
  /** Previsto − real: abaixo de zero, a previsão costuma ficar aquém do que choveu. */
  vies: number;
};

/** Erro da previsão conforme o quanto choveu de verdade (só dias de chuva). */
export function errosPorFaixaDeChuva(linhas: LinhaComparada[]): ErroPorFaixa[] {
  return FAIXAS_DE_CHUVA.map((f) => {
    const erros = linhas
      .filter((l) => l.real_chuva_mm !== null && l.real_chuva_mm > 0)
      .filter((l) => (l.real_chuva_mm as number) >= f.de && (l.real_chuva_mm as number) < f.ate)
      .map((l) => l.erro_chuva_mm);
    return {
      id: f.id,
      rotulo: f.rotulo,
      intervalo: f.intervalo,
      dias: erros.filter((e) => e !== null).length,
      mae: mae(erros),
      vies: bias(erros),
    };
  });
}

export type TotalDeChuva = {
  cidade_id: string;
  dias: number;
  /** Soma da chuva prevista e da chuva real no período, em mm. */
  previsto: number;
  real: number;
  /** Erro médio por dia, em mm. */
  maePorDia: number;
};

/** Por cidade: o total de chuva previsto e o real no período, ao lado do erro médio dia a dia. */
export function totaisDeChuva(linhas: LinhaComparada[]): TotalDeChuva[] {
  return agruparPorCidade(linhas).map(([cidade_id, grupo]) => {
    const comChuva = grupo.filter((l) => l.prev_chuva_mm !== null && l.real_chuva_mm !== null);
    return {
      cidade_id,
      dias: comChuva.length,
      previsto: comChuva.reduce((soma, l) => soma + (l.prev_chuva_mm as number), 0),
      real: comChuva.reduce((soma, l) => soma + (l.real_chuva_mm as number), 0),
      maePorDia: mae(comChuva.map((l) => l.erro_chuva_mm)),
    };
  });
}
