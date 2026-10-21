/**
 * Cálculos do dashboard, portados de dashboard/app.py (Streamlit).
 *
 * Regra geral: replicar a semântica do pandas. Valores ausentes são `null` e
 * se propagam nas contas (como NaN), e as médias ignoram ausentes (skipna).
 */

export type LinhaGoldDia = {
  cidade_id: unknown;
  temp_min: unknown;
  temp_max: unknown;
  clima_desc: unknown;
  chuva_mm: unknown;
  data_coleta: unknown;
  amplitude_termica: unknown;
};

export type LinhaGoldPrevisao = LinhaGoldDia & { data_previsao: unknown };

export type LinhaComparada = {
  cidade_id: string;
  dia_coleta_prev: string;
  dia_previsto: string;
  dia_real: string;
  prev_temp_min: number | null;
  real_temp_min: number | null;
  erro_temp_min: number | null;
  prev_temp_max: number | null;
  real_temp_max: number | null;
  erro_temp_max: number | null;
  prev_chuva_mm: number | null;
  real_chuva_mm: number | null;
  erro_chuva_mm: number | null;
  prev_amplitude_termica: number | null;
  real_amplitude_termica: number | null;
  erro_amp_termica: number | null;
  prev_clima_desc: string | null;
  real_clima_desc: string | null;
  real_choveu: boolean;
  prev_choveu: boolean;
};

const DIA_MS = 24 * 60 * 60 * 1000;

/** pd.to_numeric(errors="coerce"): número válido ou null. */
export function paraNumero(v: unknown): number | null {
  if (typeof v === "number") return Number.isNaN(v) ? null : v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.trim());
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/** pd.to_datetime(errors="coerce") para datas "AAAA-MM-DD": data ou null. */
export function paraData(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v.trim());
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const data = new Date(t).toISOString().slice(0, 10);
  return data === `${m[1]}-${m[2]}-${m[3]}` ? data : null;
}

function somarDias(data: string, dias: number): string {
  return new Date(Date.parse(`${data}T00:00:00Z`) + dias * DIA_MS).toISOString().slice(0, 10);
}

function subtrair(a: number | null, b: number | null): number | null {
  return a === null || b === null ? null : a - b;
}

function paraTexto(v: unknown): string | null {
  return v === null || v === undefined ? null : String(v);
}

/** Tipagem, saneamento e JOIN D-1 -> D (seções equivalentes do app.py). */
export function montarComparacao(
  dadosDia: LinhaGoldDia[],
  previsoes: LinhaGoldPrevisao[],
): LinhaComparada[] {
  const real = dadosDia
    .map((l) => ({
      cidade_id: l.cidade_id,
      dia_real: paraData(l.data_coleta),
      temp_min: paraNumero(l.temp_min),
      temp_max: paraNumero(l.temp_max),
      chuva_mm: paraNumero(l.chuva_mm),
      amplitude_termica: paraNumero(l.amplitude_termica),
      clima_desc: paraTexto(l.clima_desc),
    }))
    .filter((l) => l.cidade_id !== null && l.cidade_id !== undefined && l.dia_real !== null)
    .map((l) => ({ ...l, cidade_id: String(l.cidade_id), dia_real: l.dia_real as string }));

  const prev = previsoes
    .map((l) => ({
      cidade_id: l.cidade_id,
      dia_coleta_prev: paraData(l.data_coleta),
      dia_previsto: paraData(l.data_previsao),
      temp_min: paraNumero(l.temp_min),
      temp_max: paraNumero(l.temp_max),
      chuva_mm: paraNumero(l.chuva_mm),
      amplitude_termica: paraNumero(l.amplitude_termica),
      clima_desc: paraTexto(l.clima_desc),
    }))
    .filter(
      (l) =>
        l.cidade_id !== null &&
        l.cidade_id !== undefined &&
        l.dia_coleta_prev !== null &&
        l.dia_previsto !== null,
    )
    .map((l) => ({
      ...l,
      cidade_id: String(l.cidade_id),
      dia_coleta_prev: l.dia_coleta_prev as string,
      dia_previsto: l.dia_previsto as string,
    }));

  // merge inner: mantém a ordem das previsões e, para cada uma, a ordem dos reais.
  const reaisPorChave = new Map<string, typeof real>();
  for (const r of real) {
    const chave = `${r.cidade_id}|${r.dia_real}`;
    const grupo = reaisPorChave.get(chave);
    if (grupo) grupo.push(r);
    else reaisPorChave.set(chave, [r]);
  }

  const linhas: LinhaComparada[] = [];
  for (const p of prev) {
    for (const r of reaisPorChave.get(`${p.cidade_id}|${p.dia_previsto}`) ?? []) {
      if (p.dia_coleta_prev !== somarDias(r.dia_real, -1)) continue;
      linhas.push({
        cidade_id: p.cidade_id,
        dia_coleta_prev: p.dia_coleta_prev,
        dia_previsto: p.dia_previsto,
        dia_real: r.dia_real,
        prev_temp_min: p.temp_min,
        real_temp_min: r.temp_min,
        erro_temp_min: subtrair(p.temp_min, r.temp_min),
        prev_temp_max: p.temp_max,
        real_temp_max: r.temp_max,
        erro_temp_max: subtrair(p.temp_max, r.temp_max),
        prev_chuva_mm: p.chuva_mm,
        real_chuva_mm: r.chuva_mm,
        erro_chuva_mm: subtrair(p.chuva_mm, r.chuva_mm),
        prev_amplitude_termica: p.amplitude_termica,
        real_amplitude_termica: r.amplitude_termica,
        erro_amp_termica: subtrair(p.amplitude_termica, r.amplitude_termica),
        prev_clima_desc: p.clima_desc,
        real_clima_desc: r.clima_desc,
        real_choveu: (r.chuva_mm ?? 0) > 0,
        prev_choveu: (p.chuva_mm ?? 0) > 0,
      });
    }
  }
  return linhas;
}

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
