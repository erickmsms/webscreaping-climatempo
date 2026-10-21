/**
 * Base comparada: tipagem, saneamento e o JOIN da previsão de D-1 com o dado de D.
 * Portado do antigo dashboard Streamlit (dashboard/app.py, removido; última
 * versão no commit c8b6151).
 *
 * Regra geral: replicar a semântica do pandas. Valores ausentes são `null` e
 * se propagam nas contas (como NaN).
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

/** Tipagem, saneamento e JOIN D-1 -> D. */
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
