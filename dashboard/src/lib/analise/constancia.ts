/**
 * Tira da conta o quanto o clima de cada cidade é "constante". Numa cidade em que o tempo quase não
 * muda, qualquer previsão (até a de "amanhã = hoje") erra pouco. O erro justo mede o erro da previsão
 * em relação ao que a cidade varia de um dia para o outro: quanto menor, mais a previsão agrega.
 */
import type { LinhaComparada } from "@/lib/analise/comparacao";
import { agruparPorCidade, media } from "@/lib/analise/metricas";
import { paresDeVariacao, type Variavel } from "@/lib/analise/variacao";

export type ConstanciaDaCidade = {
  cidade_id: string;
  dias: number;
  /** Erro médio da previsão (o erro bruto). */
  erroMedio: number;
  /** Quanto o tempo muda por dia, em média: o erro de supor "amanhã = hoje". */
  variacaoMedia: number;
  /** Erro da previsão para cada 1 unidade que o tempo muda. */
  erroJusto: number;
  /** Quanto do erro do "óbvio" a previsão elimina: (1 − erro justo) em %. Negativo se piorar. */
  ganho: number;
  /** O ganho como nota de 0 a 100 (maior é melhor): quem piora o óbvio fica com 0. */
  nota: number;
  /** Posição por erro bruto (1 = menor erro) e por ganho (1 = maior ganho). */
  posicaoBruta: number;
  posicaoJusta: number;
};

function posicoes(valores: number[], crescente: boolean): number[] {
  const ordem = valores
    .map((v, i) => ({ v: Number.isNaN(v) ? (crescente ? Infinity : -Infinity) : v, i }))
    .sort((a, b) => (crescente ? a.v - b.v : b.v - a.v));
  const resultado = new Array<number>(valores.length);
  ordem.forEach((o, posicao) => {
    resultado[o.i] = posicao + 1;
  });
  return resultado;
}

/** Erro bruto, constância e erro justo de cada cidade, para uma variável. */
export function constanciaPorCidade(linhas: LinhaComparada[], variavel: Variavel): ConstanciaDaCidade[] {
  const pares = paresDeVariacao(linhas, variavel);
  const cidades = agruparPorCidade(linhas).map(([id]) => id);
  const base = cidades.map((cidade_id) => {
    const dela = pares.filter((p) => p.cidade_id === cidade_id);
    const erroMedio = media(dela.map((p) => p.erro));
    const variacaoMedia = media(dela.map((p) => p.variacao));
    const erroJusto = variacaoMedia > 0 ? erroMedio / variacaoMedia : Number.NaN;
    return { cidade_id, dias: dela.length, erroMedio, variacaoMedia, erroJusto, ganho: (1 - erroJusto) * 100, nota: Math.min(100, Math.max(0, (1 - erroJusto) * 100)) };
  });
  const bruta = posicoes(
    base.map((c) => c.erroMedio),
    true,
  );
  const justa = posicoes(
    base.map((c) => c.ganho),
    false,
  );
  return base.map((c, i) => ({ ...c, posicaoBruta: bruta[i], posicaoJusta: justa[i] }));
}
