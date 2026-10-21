import { cacheLife } from "next/cache";
import { montarComparacao, type LinhaComparada } from "@/lib/analise/comparacao";
import { montarGold } from "@/lib/analise/gold";
import { lerColeta } from "@/lib/dados/bronze";

export type ResultadoComparacao =
  | { status: "ok"; linhas: LinhaComparada[] }
  | { status: "sem-dados" }
  | { status: "sem-pares" };

/**
 * Base comparada D-1 -> D, em cache por algumas horas. O workflow diário
 * acrescenta a coleta do dia ao arquivo de dados.
 */
export async function carregarComparacao(): Promise<ResultadoComparacao> {
  "use cache";
  cacheLife("hours");

  const registros = lerColeta();
  if (!registros) return { status: "sem-dados" };

  const { dadosDia, previsoes } = montarGold(registros);
  const linhas = montarComparacao(dadosDia, previsoes);
  return linhas.length === 0 ? { status: "sem-pares" } : { status: "ok", linhas };
}
