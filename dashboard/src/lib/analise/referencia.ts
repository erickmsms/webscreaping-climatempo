/**
 * Referências "ingênuas" para dar contexto aos números: o que se acertaria sem
 * previsão nenhuma. Se o Climatempo não ganha delas, a previsão não agrega nada.
 */
import type { LinhaComparada } from "@/lib/analise/comparacao";
import { somarDias } from "@/lib/analise/comparacao";
import { acuraciaChuvaBinaria, mae, media } from "@/lib/analise/metricas";

/** Erro médio (°C) da previsão e da referência "amanhã = hoje", nos mesmos dias. */
export type ReferenciaTemperatura = { previsao: number; ingenuo: number };

/** Acerto (%) de "choveu ou não" da previsão e de chutar sempre o resultado mais comum. */
export type ReferenciaChuva = { previsao: number; ingenuo: number; diasComChuva: number };

export type Referencia = {
  temperaturaMax: ReferenciaTemperatura;
  temperaturaMin: ReferenciaTemperatura;
  chuvaBinaria: ReferenciaChuva;
  viradas: DiasDeVirada;
};

type ParDeTemperatura = { erroPrevisao: number; erroIngenuo: number; variacao: number };

/**
 * Para cada dia com véspera disponível: erro da previsão, erro de "amanhã = hoje" e quanto a
 * temperatura real mudou de um dia para o outro. Só entram os dias em que as duas formas de prever existem.
 */
function paresDeTemperatura(linhas: LinhaComparada[], campo: "temp_max" | "temp_min"): ParDeTemperatura[] {
  const ontemPorChave = new Map(linhas.map((l) => [`${l.cidade_id}|${l.dia_real}`, l]));
  const pares: ParDeTemperatura[] = [];
  for (const l of linhas) {
    const realOntem = ontemPorChave.get(`${l.cidade_id}|${somarDias(l.dia_real, -1)}`)?.[`real_${campo}`] ?? null;
    const real = l[`real_${campo}`];
    const erroPrevisao = l[`erro_${campo}`];
    if (realOntem === null || real === null || erroPrevisao === null) continue;
    pares.push({ erroPrevisao, erroIngenuo: realOntem - real, variacao: Math.abs(realOntem - real) });
  }
  return pares;
}

function referenciaDeTemperatura(pares: ParDeTemperatura[]): ReferenciaTemperatura {
  return { previsao: mae(pares.map((p) => p.erroPrevisao)), ingenuo: mae(pares.map((p) => p.erroIngenuo)) };
}

/** Variação da máxima (°C) de um dia para o outro a partir da qual o dia conta como "virada de tempo". */
export const LIMIAR_VIRADA = 3;

/** Erro da previsão e de "amanhã = hoje" só nos dias em que a máxima mudou bastante. */
export type DiasDeVirada = ReferenciaTemperatura & { dias: number };

/** Compara a previsão com "amanhã será igual a hoje" (temperatura) e com o chute mais comum (chuva). */
export function calcularReferencia(linhas: LinhaComparada[]): Referencia {
  const paresMax = paresDeTemperatura(linhas, "temp_max");
  const viradas = paresMax.filter((p) => p.variacao >= LIMIAR_VIRADA);
  const diasComChuva = media(linhas.map((l) => (l.real_choveu ? 1 : 0))) * 100;
  return {
    temperaturaMax: referenciaDeTemperatura(paresMax),
    temperaturaMin: referenciaDeTemperatura(paresDeTemperatura(linhas, "temp_min")),
    viradas: { ...referenciaDeTemperatura(viradas), dias: viradas.length },
    chuvaBinaria: {
      previsao: acuraciaChuvaBinaria(linhas),
      ingenuo: Math.max(diasComChuva, 100 - diasComChuva),
      diasComChuva,
    },
  };
}
