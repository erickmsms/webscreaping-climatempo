/**
 * Modelo de tela do dashboard: todos os números que a página exibe para um
 * filtro de cidade. Só valores; rótulos e formatação ficam nos componentes.
 *
 * Os componentes só desenham este modelo, e o teste de paridade
 * (tests/paridade.test.ts) confere estes números com o gabarito capturado do
 * antigo dashboard Streamlit.
 */
import type { LinhaComparada } from "@/lib/analise/comparacao";
import {
  acuraciaChuvaBinaria,
  acuraciaDescricao,
  acuraciaVolumeChuva,
  bias,
  calcularScore,
  mae,
  mape,
  metricasPorCidade,
  rankingPorCidade,
  rmse,
  type LinhaRanking,
  type MetricasCidade,
  type Score,
} from "@/lib/analise/metricas";

export const TODAS = "Todas";

/** Erros de chuva menores que isso (em mm) não viram destaque no gráfico. */
export const LIMIAR_DESTAQUE_CHUVA = 5;

export type PontoSerie = { x: string; y: number | null };
export type Serie = { nome: string; pontos: PontoSerie[] };
export type GraficoErro = { unidade: string; series: Serie[] };

export type ErrosTemperatura = { mae: number; rmse: number; bias: number; mape: number };
export type ErrosChuva = { mae: number; rmse: number; bias: number };

/** Um dia em que a previsão de chuva errou muito, para anotar no gráfico. */
export type Destaque = { cidade_id: string; dia: string; erro: number };

export type Painel = {
  cidade: string;
  todas: boolean;
  linhasComparadas: number;
  numCidades: number;
  inicio: string;
  fim: string;
  temperaturaMax: ErrosTemperatura;
  temperaturaMin: ErrosTemperatura;
  chuva: ErrosChuva;
  acuracia: { descricao: number; chuvaBinaria: number; volumeChuva: number };
  /** Ranking de todas as cidades, mesmo quando o filtro é uma cidade só. */
  ranking: LinhaRanking[];
  /** Score da cidade filtrada (null em "Todas"). */
  scoreCidade: Score | null;
  /** Métricas por cidade (só em "Todas"). */
  porCidade: MetricasCidade[] | null;
  graficos: { temperaturaMax: GraficoErro; temperaturaMin: GraficoErro; chuva: GraficoErro };
  destaquesChuva: Destaque[];
  base: LinhaComparada[];
};

/** Opções do seletor de cidade: "Todas" + cidades em ordem alfabética. */
export function opcoesDeCidade(linhas: LinhaComparada[]): string[] {
  const cidades = [...new Set(linhas.map((l) => l.cidade_id))].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  return [TODAS, ...cidades];
}

function graficoDeErro(
  linhas: LinhaComparada[],
  todas: boolean,
  campo: "erro_temp_max" | "erro_temp_min" | "erro_chuva_mm",
  unidade: string,
): GraficoErro {
  const ordenadas = [...linhas].sort((a, b) =>
    a.dia_real < b.dia_real ? -1 : a.dia_real > b.dia_real ? 1 : 0,
  );
  const grupos = new Map<string, PontoSerie[]>();
  for (const l of ordenadas) {
    const nome = todas ? l.cidade_id : "";
    const pontos = grupos.get(nome) ?? [];
    pontos.push({ x: l.dia_real, y: l[campo] });
    grupos.set(nome, pontos);
  }
  return { unidade, series: [...grupos.entries()].map(([nome, pontos]) => ({ nome, pontos })) };
}

/** Os 2 maiores erros de chuva (em módulo) a partir do limiar, do maior para o menor. */
function destaquesDeChuva(linhas: LinhaComparada[]): Destaque[] {
  return linhas
    .filter((l) => l.erro_chuva_mm !== null && Math.abs(l.erro_chuva_mm) >= LIMIAR_DESTAQUE_CHUVA)
    .map((l) => ({ cidade_id: l.cidade_id, dia: l.dia_real, erro: l.erro_chuva_mm as number }))
    .sort((a, b) => Math.abs(b.erro) - Math.abs(a.erro))
    .slice(0, 2);
}

function errosTemperatura(linhas: LinhaComparada[], campo: "temp_max" | "temp_min"): ErrosTemperatura {
  const erros = linhas.map((l) => l[`erro_${campo}`]);
  return {
    mae: mae(erros),
    rmse: rmse(erros),
    bias: bias(erros),
    mape: mape(
      linhas.map((l) => l[`prev_${campo}`]),
      linhas.map((l) => l[`real_${campo}`]),
    ),
  };
}

export function montarPainel(todasAsLinhas: LinhaComparada[], cidade: string): Painel | null {
  const todas = cidade === TODAS;
  const linhas = todas ? todasAsLinhas : todasAsLinhas.filter((l) => l.cidade_id === cidade);
  if (linhas.length === 0) return null;

  const dias = linhas.map((l) => l.dia_real).sort();
  const errosChuva = linhas.map((l) => l.erro_chuva_mm);

  return {
    cidade,
    todas,
    linhasComparadas: linhas.length,
    numCidades: new Set(linhas.map((l) => l.cidade_id)).size,
    inicio: dias[0],
    fim: dias[dias.length - 1],
    temperaturaMax: errosTemperatura(linhas, "temp_max"),
    temperaturaMin: errosTemperatura(linhas, "temp_min"),
    chuva: { mae: mae(errosChuva), rmse: rmse(errosChuva), bias: bias(errosChuva) },
    acuracia: {
      descricao: acuraciaDescricao(linhas),
      chuvaBinaria: acuraciaChuvaBinaria(linhas),
      volumeChuva: acuraciaVolumeChuva(linhas),
    },
    ranking: rankingPorCidade(todasAsLinhas),
    scoreCidade: todas ? null : calcularScore(linhas),
    porCidade: todas ? metricasPorCidade(linhas) : null,
    graficos: {
      temperaturaMax: graficoDeErro(linhas, todas, "erro_temp_max", "°C"),
      temperaturaMin: graficoDeErro(linhas, todas, "erro_temp_min", "°C"),
      chuva: graficoDeErro(linhas, todas, "erro_chuva_mm", "mm"),
    },
    destaquesChuva: destaquesDeChuva(linhas),
    base: linhas,
  };
}
