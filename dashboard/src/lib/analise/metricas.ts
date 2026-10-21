/**
 * Métricas de erro, acertos e scores sobre a base comparada D-1 -> D.
 *
 * Regra geral: replicar a semântica do pandas do antigo dashboard Streamlit.
 * Valores ausentes são `null`, se propagam nas contas (como NaN) e as médias
 * os ignoram (skipna).
 */
import type { LinhaComparada } from "@/lib/analise/comparacao";

/** Média ignorando ausentes; NaN se não sobrar nenhum valor. */
export function media(valores: Array<number | null>): number {
  let soma = 0;
  let n = 0;
  for (const v of valores) {
    if (v === null || Number.isNaN(v)) continue;
    soma += v;
    n += 1;
  }
  return n === 0 ? Number.NaN : soma / n;
}

export function mae(erros: Array<number | null>): number {
  return media(erros.map((e) => (e === null ? null : Math.abs(e))));
}

export function rmse(erros: Array<number | null>): number {
  return Math.sqrt(media(erros.map((e) => (e === null ? null : e * e))));
}

export function bias(erros: Array<number | null>): number {
  return media(erros);
}

export function mape(previsto: Array<number | null>, real: Array<number | null>): number {
  return (
    media(
      previsto.map((p, i) => {
        const r = real[i];
        if (p === null || r === null || r === 0) return null;
        return Math.abs(p - r) / Math.abs(r);
      }),
    ) * 100
  );
}

function descricoesIguais(l: LinhaComparada): boolean {
  return (l.real_clima_desc ?? "") === (l.prev_clima_desc ?? "");
}

/** "Acurácia: Descrição do Clima" (%). */
export function acuraciaDescricao(linhas: LinhaComparada[]): number {
  return media(linhas.map((l) => (descricoesIguais(l) ? 1 : 0))) * 100;
}

/** "Acurácia: Choveu vs Não" (%). */
export function acuraciaChuvaBinaria(linhas: LinhaComparada[]): number {
  return media(linhas.map((l) => (l.real_choveu === l.prev_choveu ? 1 : 0))) * 100;
}

/** "Acurácia % Volume Chuva": 100 - MAPE, só nos dias com chuva real > 0. */
export function acuraciaVolumeChuva(linhas: LinhaComparada[]): number {
  const comChuva = linhas.filter((l) => (l.real_chuva_mm ?? 0) > 0);
  if (comChuva.length === 0) return Number.NaN;
  const mapeChuva =
    media(
      comChuva.map((l) => {
        const real = l.real_chuva_mm ?? 0;
        return Math.abs((l.prev_chuva_mm ?? 0) - real) / real;
      }),
    ) * 100;
  return 100 - mapeChuva;
}

export const PESO_TEMPERATURA = 0.5;
export const PESO_CHUVA = 0.4;
export const PESO_DESCRICAO = 0.1;
/** MAE de temperatura (°C) a partir do qual o Score Temperatura zera. */
export const LIMITE_TEMPERATURA = 3.0;

function limitar(v: number, min: number, max: number): number {
  return Number.isNaN(v) ? v : Math.min(max, Math.max(min, v));
}

/** Média entre o erro absoluto da máxima e da mínima, por linha. */
function erroTemperaturaMedio(l: LinhaComparada): number | null {
  if (l.erro_temp_max === null || l.erro_temp_min === null) return null;
  return (Math.abs(l.erro_temp_max) + Math.abs(l.erro_temp_min)) / 2;
}

/** Proximidade do volume de chuva (0 a 1), por linha. */
function proximidadeChuva(l: LinhaComparada): number {
  const real = l.real_chuva_mm ?? 0;
  const prev = l.prev_chuva_mm ?? 0;
  let den = Math.max(real, prev);
  if (den === 0) den = 1e-9;
  return limitar(1 - Math.abs(prev - real) / den, 0, 1);
}

export type Score = {
  maeTemp: number;
  scoreTemperatura: number;
  scoreChuva: number;
  scoreDescricao: number;
  scoreFinal: number;
};

/** Score composto de um conjunto de linhas (uma cidade). */
export function calcularScore(linhas: LinhaComparada[]): Score {
  const maeTemp = media(linhas.map(erroTemperaturaMedio));
  const scoreTemperatura = limitar(1 - maeTemp / LIMITE_TEMPERATURA, 0, 1) * 100;
  const scoreChuva = media(linhas.map(proximidadeChuva)) * 100;
  const scoreDescricao = media(linhas.map((l) => (descricoesIguais(l) ? 1 : 0))) * 100;
  const scoreFinal =
    PESO_TEMPERATURA * scoreTemperatura + PESO_CHUVA * scoreChuva + PESO_DESCRICAO * scoreDescricao;
  return { maeTemp, scoreTemperatura, scoreChuva, scoreDescricao, scoreFinal };
}

/** groupby("cidade_id"): grupos em ordem alfabética de cidade, como o pandas. */
export function agruparPorCidade(linhas: LinhaComparada[]): Array<[string, LinhaComparada[]]> {
  const grupos = new Map<string, LinhaComparada[]>();
  for (const l of linhas) {
    const grupo = grupos.get(l.cidade_id);
    if (grupo) grupo.push(l);
    else grupos.set(l.cidade_id, [l]);
  }
  return [...grupos.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

/** Ordenação decrescente do pandas: NaN sempre por último. */
export function compararDecrescente(a: number, b: number): number {
  const aNan = Number.isNaN(a);
  const bNan = Number.isNaN(b);
  if (aNan || bNan) return aNan === bNan ? 0 : aNan ? 1 : -1;
  return b - a;
}

export type MetricasCidade = {
  cidade_id: string;
  n: number;
  mae_temp_max: number;
  rmse_temp_max: number;
  mae_temp_min: number;
  rmse_temp_min: number;
  mae_chuva: number;
  acc_chuva: number;
};

/** Tabela "Métricas por cidade". */
export function metricasPorCidade(linhas: LinhaComparada[]): MetricasCidade[] {
  return agruparPorCidade(linhas)
    .map(([cidade_id, grupo]) => ({
      cidade_id,
      n: grupo.length,
      mae_temp_max: mae(grupo.map((l) => l.erro_temp_max)),
      rmse_temp_max: rmse(grupo.map((l) => l.erro_temp_max)),
      mae_temp_min: mae(grupo.map((l) => l.erro_temp_min)),
      rmse_temp_min: rmse(grupo.map((l) => l.erro_temp_min)),
      mae_chuva: mae(grupo.map((l) => l.erro_chuva_mm)),
      acc_chuva: acuraciaChuvaBinaria(grupo),
    }))
    .sort(
      (a, b) =>
        compararDecrescente(a.mae_temp_max, b.mae_temp_max) ||
        compararDecrescente(a.mae_chuva, b.mae_chuva),
    );
}

export type LinhaRanking = Score & { cidade_id: string; n: number };

/** Ranking de precisão por cidade (score composto), do melhor para o pior. */
export function rankingPorCidade(linhas: LinhaComparada[]): LinhaRanking[] {
  return agruparPorCidade(linhas)
    .map(([cidade_id, grupo]) => ({ cidade_id, n: grupo.length, ...calcularScore(grupo) }))
    .sort((a, b) => compararDecrescente(a.scoreFinal, b.scoreFinal));
}
