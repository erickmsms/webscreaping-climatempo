import { cacheLife } from "next/cache";
import { montarComparacao, type LinhaComparada } from "@/lib/analise/comparacao";
import { lerTabelasGold } from "@/lib/dados/db";

export type ResultadoComparacao =
  | { status: "ok"; linhas: LinhaComparada[] }
  | { status: "sem-banco" }
  | { status: "sem-pares" };

/**
 * Base comparada D-1 -> D, em cache por algumas horas. O pipeline atualiza o
 * banco uma vez por dia.
 */
export async function carregarComparacao(): Promise<ResultadoComparacao> {
  "use cache";
  cacheLife("hours");

  const tabelas = lerTabelasGold();
  if (!tabelas) return { status: "sem-banco" };

  const linhas = montarComparacao(tabelas.dadosDia, tabelas.previsoes);
  return linhas.length === 0 ? { status: "sem-pares" } : { status: "ok", linhas };
}
