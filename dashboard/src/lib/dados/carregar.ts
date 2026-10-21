import { cacheLife } from "next/cache";
import { montarCiencia, type Ciencia } from "@/lib/analise/ciencia";
import { montarComparacao, type LinhaComparada } from "@/lib/analise/comparacao";
import { montarGold } from "@/lib/analise/gold";
import { soCidadesExibidas } from "@/lib/apresentacao/cidades";
import { lerColeta } from "@/lib/dados/bronze";
import { lerEstacoes } from "@/lib/dados/estacoes";
import { lerMunicipios } from "@/lib/dados/municipios";

export type ResultadoComparacao =
  | { status: "ok"; linhas: LinhaComparada[] }
  | { status: "sem-dados" }
  | { status: "sem-pares" };

/**
 * Base comparada D-1 -> D, em cache por algumas horas. O workflow diário
 * acrescenta a coleta do dia ao arquivo de dados. Só entram as cidades
 * exibidas: a coleta guarda mais cidades do que a tela mostra.
 */
export async function carregarComparacao(): Promise<ResultadoComparacao> {
  "use cache";
  cacheLife("hours");

  const registros = lerColeta();
  if (!registros) return { status: "sem-dados" };

  const { dadosDia, previsoes } = montarGold(soCidadesExibidas(registros));
  const linhas = montarComparacao(dadosDia, previsoes);
  return linhas.length === 0 ? { status: "sem-pares" } : { status: "ok", linhas };
}

export type ResultadoCiencia = { status: "ok"; ciencia: Ciencia } | { status: "sem-dados" } | { status: "sem-pares" };

/** Análises da aba de ciência de dados: a mesma base comparada, mais o catálogo de estações. */
export async function carregarCiencia(): Promise<ResultadoCiencia> {
  "use cache";
  cacheLife("hours");

  const resultado = await carregarComparacao();
  if (resultado.status !== "ok") return resultado;
  const ciencia = montarCiencia(resultado.linhas, lerEstacoes(), lerMunicipios());
  return ciencia ? { status: "ok", ciencia } : { status: "sem-pares" };
}
