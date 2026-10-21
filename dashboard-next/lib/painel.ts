/**
 * Modelo de tela do dashboard: tudo o que a página exibe para um filtro de
 * cidade, com os mesmos rótulos e a mesma ordem do antigo dashboard Streamlit.
 *
 * Os componentes só desenham este modelo, e o teste de paridade
 * (tests/paridade.test.ts) compara este modelo com o gabarito capturado do Streamlit.
 */
import {
  acuraciaChuvaBinaria,
  acuraciaDescricao,
  acuraciaVolumeChuva,
  bias,
  calcularScore,
  LIMITE_TEMPERATURA,
  mae,
  mape,
  metricasPorCidade,
  PESO_CHUVA,
  PESO_DESCRICAO,
  PESO_TEMPERATURA,
  rankingPorCidade,
  rmse,
  type LinhaComparada,
  type LinhaRanking,
  type MetricasCidade,
} from "./analise";
import { formatarFixo, formatarNumero } from "./formato";

export const TODAS = "Todas";

export type Metrica = { rotulo: string; valor: string };

export type PontoSerie = { x: string; y: number | null };
export type Serie = { nome: string; pontos: PontoSerie[] };

export type GraficoErro = {
  titulo: string;
  unidade: string;
  series: Serie[];
};

export type Painel = {
  cidade: string;
  subtitulo: string;
  geral: Metrica[];
  temperaturaMax: Metrica[];
  temperaturaMin: Metrica[];
  chuva: Metrica[];
  classificacao: Metrica[];
  porCidade: MetricasCidade[] | null;
  graficos: GraficoErro[];
  base: LinhaComparada[];
  ranking: { destaques: Metrica[]; linhas: LinhaRanking[]; legenda: string } | null;
  scoreCidade: { metricas: Metrica[]; legenda: string } | null;
};

const pct = (v: number) => formatarNumero(v, "%");
const percentual = (peso: number) => Math.trunc(peso * 100);

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
  titulo: string,
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
  return {
    titulo,
    unidade,
    series: [...grupos.entries()].map(([nome, pontos]) => ({ nome, pontos })),
  };
}

export function montarPainel(todasAsLinhas: LinhaComparada[], cidade: string): Painel | null {
  const todas = cidade === TODAS;
  const linhas = todas ? todasAsLinhas : todasAsLinhas.filter((l) => l.cidade_id === cidade);
  if (linhas.length === 0) return null;

  const erroMax = linhas.map((l) => l.erro_temp_max);
  const erroMin = linhas.map((l) => l.erro_temp_min);
  const erroChuva = linhas.map((l) => l.erro_chuva_mm);
  const dias = linhas.map((l) => l.dia_real).sort();

  const geral: Metrica[] = [
    { rotulo: "Linhas comparadas", valor: String(linhas.length) },
    { rotulo: "Cidades", valor: String(new Set(linhas.map((l) => l.cidade_id)).size) },
    { rotulo: "Primeira data", valor: dias[0] },
    { rotulo: "Última data", valor: dias[dias.length - 1] },
  ];

  const temperatura = (erros: Array<number | null>, campo: "temp_max" | "temp_min"): Metrica[] => [
    { rotulo: "MAE", valor: formatarNumero(mae(erros)) },
    { rotulo: "RMSE", valor: formatarNumero(rmse(erros)) },
    { rotulo: "Bias", valor: formatarNumero(bias(erros)) },
    {
      rotulo: "MAPE",
      valor: pct(
        mape(
          linhas.map((l) => l[`prev_${campo}`]),
          linhas.map((l) => l[`real_${campo}`]),
        ),
      ),
    },
  ];

  const pesos =
    `Score Final = ${percentual(PESO_TEMPERATURA)}% Temperatura + ` +
    `${percentual(PESO_CHUVA)}% Chuva + ` +
    `${percentual(PESO_DESCRICAO)}% Descrição.`;

  let ranking: Painel["ranking"] = null;
  let scoreCidade: Painel["scoreCidade"] = null;
  if (todas) {
    const linhasRanking = rankingPorCidade(linhas);
    ranking = {
      destaques: [
        { rotulo: "🥇 Cidade #1", valor: linhasRanking[0].cidade_id },
        { rotulo: "⭐ Score #1", valor: formatarFixo(linhasRanking[0].scoreFinal, 2) },
        { rotulo: "📌 Cidades no ranking", valor: String(linhasRanking.length) },
      ],
      linhas: linhasRanking,
      legenda:
        `${pesos} Score Temperatura usa limite de ${LIMITE_TEMPERATURA.toFixed(1)}°C ` +
        `(MAE ≥ ${LIMITE_TEMPERATURA.toFixed(1)} → 0 pontos).`,
    };
  } else {
    const score = calcularScore(linhas);
    scoreCidade = {
      metricas: [
        { rotulo: "Cidade", valor: cidade },
        { rotulo: "Score Final", valor: formatarNumero(score.scoreFinal) },
        { rotulo: "Score Temperatura", valor: formatarNumero(score.scoreTemperatura) },
        { rotulo: "Score Chuva", valor: formatarNumero(score.scoreChuva) },
      ],
      legenda: pesos,
    };
  }

  return {
    cidade,
    subtitulo: todas
      ? "Visão consolidada de todas as cidades"
      : `Visão filtrada para cidade ${cidade}`,
    geral,
    temperaturaMax: temperatura(erroMax, "temp_max"),
    temperaturaMin: temperatura(erroMin, "temp_min"),
    chuva: [
      { rotulo: "MAE", valor: formatarNumero(mae(erroChuva)) },
      { rotulo: "RMSE", valor: formatarNumero(rmse(erroChuva)) },
      { rotulo: "Bias", valor: formatarNumero(bias(erroChuva)) },
    ],
    classificacao: [
      { rotulo: "✅ Acurácia: Descrição do Clima", valor: pct(acuraciaDescricao(linhas)) },
      { rotulo: "🌧️ Acurácia: Choveu vs Não", valor: pct(acuraciaChuvaBinaria(linhas)) },
      { rotulo: "🎯 Acurácia % Volume Chuva", valor: pct(acuraciaVolumeChuva(linhas)) },
    ],
    porCidade: todas ? metricasPorCidade(linhas) : null,
    graficos: [
      graficoDeErro(linhas, todas, "erro_temp_max", "Erro Temp. Máx (Previsto - Real) por dia", "°C"),
      graficoDeErro(linhas, todas, "erro_temp_min", "Erro Temp. Mín (Previsto - Real) por dia", "°C"),
      graficoDeErro(linhas, todas, "erro_chuva_mm", "Erro Chuva (mm) (Previsto - Real) por dia", "mm"),
    ],
    base: linhas,
    ranking,
    scoreCidade,
  };
}
