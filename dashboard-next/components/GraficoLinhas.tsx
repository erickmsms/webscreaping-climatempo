"use client";

import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatarNumero } from "@/lib/formato";
import type { PontoSerie } from "@/lib/painel";

export type SerieDesenho = { nome: string; cor: string; pontos: PontoSerie[] };

const ALTURA = 260;
const MARGEM = { topo: 12, direita: 16, base: 28, esquerda: 44 };
const DIA_MS = 86_400_000;
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const paraTempo = (data: string) => Date.parse(`${data}T00:00:00Z`);

function rotuloCurto(t: number) {
  const d = new Date(t);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

function rotuloLongo(t: number) {
  return `${rotuloCurto(t)} ${new Date(t).getUTCFullYear()}`;
}

function passoRedondo(bruto: number) {
  const base = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / base;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * base;
}

/** Marcas do eixo Y em passos redondos, sempre incluindo o zero. */
function escalaY(valores: number[]) {
  let min = Math.min(0, ...valores);
  let max = Math.max(0, ...valores);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const passo = passoRedondo((max - min) / 5);
  const inicio = Math.floor(min / passo) * passo;
  const fim = Math.ceil(max / passo) * passo;
  const marcas: number[] = [];
  for (let v = inicio; v <= fim + passo / 2; v += passo) marcas.push(Number(v.toFixed(10)));
  return { min: inicio, max: fim, marcas };
}

/** Marcas do eixo X: datas espaçadas em passos de dias que caibam na largura. */
function marcasX(t0: number, t1: number, larguraPlot: number) {
  const dias = Math.round((t1 - t0) / DIA_MS);
  const maximo = Math.max(2, Math.floor(larguraPlot / 72));
  const passo = [1, 2, 3, 7, 14, 28, 56, 91, 182, 364].find((p) => dias / p <= maximo) ?? 364;
  const marcas: number[] = [];
  for (let t = t0; t <= t1; t += passo * DIA_MS) marcas.push(t);
  return marcas;
}

/** Trechos contínuos da série: um valor ausente interrompe a linha (como no Plotly). */
function trechos(pontos: PontoSerie[]) {
  const resultado: Array<Array<{ t: number; y: number }>> = [];
  let atual: Array<{ t: number; y: number }> = [];
  for (const p of pontos) {
    if (p.y === null) {
      if (atual.length) resultado.push(atual);
      atual = [];
    } else {
      atual.push({ t: paraTempo(p.x), y: p.y });
    }
  }
  if (atual.length) resultado.push(atual);
  return resultado;
}

function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [largura, setLargura] = useState(720);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);
  return [ref, largura] as const;
}

/** Gráfico de linhas de erro por dia (o px.line do Streamlit), com uma linha por série. */
export function GraficoLinhas({
  titulo,
  unidade,
  series,
}: {
  titulo: string;
  unidade: string;
  series: SerieDesenho[];
}) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  const [ativo, setAtivo] = useState<number | null>(null);

  const desenho = useMemo(() => {
    const datas = [...new Set(series.flatMap((s) => s.pontos.map((p) => paraTempo(p.x))))].sort((a, b) => a - b);
    const valores = series.flatMap((s) => s.pontos.flatMap((p) => (p.y === null ? [] : [p.y])));
    let t0 = datas[0] ?? 0;
    let t1 = datas[datas.length - 1] ?? 0;
    if (t0 === t1) {
      t0 -= DIA_MS;
      t1 += DIA_MS;
    }
    const y = escalaY(valores);
    const larguraPlot = Math.max(1, largura - MARGEM.esquerda - MARGEM.direita);
    const alturaPlot = ALTURA - MARGEM.topo - MARGEM.base;
    const px = (t: number) => MARGEM.esquerda + ((t - t0) / (t1 - t0)) * larguraPlot;
    const py = (v: number) => MARGEM.topo + ((y.max - v) / (y.max - y.min)) * alturaPlot;
    return { datas, y, px, py, marcasX: marcasX(t0, t1, larguraPlot) };
  }, [series, largura]);

  const { datas, y, px, py } = desenho;
  const tAtivo = ativo === null ? null : datas[ativo];

  function aoMoverPonteiro(e: PointerEvent<SVGSVGElement>) {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    let melhor = 0;
    datas.forEach((t, i) => {
      if (Math.abs(px(t) - x) < Math.abs(px(datas[melhor]) - x)) melhor = i;
    });
    setAtivo(melhor);
  }

  function aoTeclar(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const passo = e.key === "ArrowLeft" ? -1 : 1;
    setAtivo((i) => Math.min(datas.length - 1, Math.max(0, (i ?? -passo) + passo)));
  }

  const linhasDica =
    tAtivo === null
      ? []
      : series.map((s) => ({
          ...s,
          y: s.pontos.find((p) => paraTempo(p.x) === tAtivo)?.y ?? null,
          existe: s.pontos.some((p) => paraTempo(p.x) === tAtivo),
        }));

  return (
    <figure className="rounded-lg border border-borda bg-surface p-4">
      <figcaption className="mb-2 font-medium">{titulo}</figcaption>

      {series.length >= 2 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
          {series.map((s) => (
            <li key={s.nome} className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block h-0.5 w-4 rounded-full" style={{ background: s.cor }} />
              {s.nome}
            </li>
          ))}
        </ul>
      )}

      <div ref={ref} className="relative">
        <svg
          width={largura}
          height={ALTURA}
          role="img"
          aria-label={`${titulo}. Use as setas para ver os valores de cada dia.`}
          tabIndex={0}
          className="block touch-none select-none rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--series-1)]"
          onPointerMove={aoMoverPonteiro}
          onPointerLeave={() => setAtivo(null)}
          onKeyDown={aoTeclar}
          onBlur={() => setAtivo(null)}
        >
          {y.marcas.map((v) => (
            <g key={v}>
              <line
                x1={MARGEM.esquerda}
                x2={largura - MARGEM.direita}
                y1={py(v)}
                y2={py(v)}
                stroke={v === 0 ? "var(--axis)" : "var(--grid)"}
                strokeWidth={1}
              />
              <text x={MARGEM.esquerda - 8} y={py(v)} dy="0.32em" textAnchor="end" className="fill-muted text-xs tabular-nums">
                {v}
              </text>
            </g>
          ))}

          {desenho.marcasX.map((t) => (
            <text key={t} x={px(t)} y={ALTURA - 8} textAnchor="middle" className="fill-muted text-xs">
              {rotuloCurto(t)}
            </text>
          ))}

          {series.map((s) =>
            trechos(s.pontos).map((trecho, i) =>
              trecho.length === 1 ? (
                <circle key={`${s.nome}-${i}`} cx={px(trecho[0].t)} cy={py(trecho[0].y)} r={4} fill={s.cor} />
              ) : (
                <polyline
                  key={`${s.nome}-${i}`}
                  points={trecho.map((p) => `${px(p.t)},${py(p.y)}`).join(" ")}
                  fill="none"
                  stroke={s.cor}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ),
            ),
          )}

          {tAtivo !== null && (
            <g pointerEvents="none">
              <line
                x1={px(tAtivo)}
                x2={px(tAtivo)}
                y1={MARGEM.topo}
                y2={ALTURA - MARGEM.base}
                stroke="var(--muted)"
                strokeWidth={1}
              />
              {linhasDica.map((s) =>
                s.y === null ? null : (
                  <circle
                    key={s.nome}
                    cx={px(tAtivo)}
                    cy={py(s.y)}
                    r={4}
                    fill={s.cor}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                ),
              )}
            </g>
          )}
        </svg>

        {tAtivo !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-md border border-borda bg-surface px-3 py-2 text-sm shadow-md"
            style={
              px(tAtivo) > largura * 0.6
                ? { right: largura - px(tAtivo) + 12 }
                : { left: px(tAtivo) + 12 }
            }
          >
            <div className="mb-1 font-medium">{rotuloLongo(tAtivo)}</div>
            {linhasDica
              .filter((s) => s.existe)
              .map((s) => (
                <div key={s.nome} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-ink-2">
                    <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: s.cor }} />
                    {s.nome}
                  </span>
                  <span className="tabular-nums">
                    {s.y === null ? "—" : `${formatarNumero(s.y)} ${unidade}`}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </figure>
  );
}
