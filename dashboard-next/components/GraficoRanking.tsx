"use client";

import { useState } from "react";
import type { LinhaRanking } from "@/lib/analise";
import { formatarNumero } from "@/lib/formato";

const MARCAS = [0, 25, 50, 75, 100];

/** Barras horizontais do ranking: top 10 por Score Final. */
export function GraficoRanking({
  titulo,
  linhas,
  cores,
}: {
  titulo: string;
  linhas: LinhaRanking[];
  cores: Record<string, string>;
}) {
  const [ativa, setAtiva] = useState<string | null>(null);
  const top10 = linhas.slice(0, 10);
  const largura = (v: number) => `${Number.isNaN(v) ? 0 : Math.min(100, Math.max(0, v))}%`;

  return (
    <figure className="rounded-lg border border-borda bg-surface p-4">
      <figcaption className="mb-3 font-medium">{titulo}</figcaption>
      <div className="grid grid-cols-[minmax(0,8rem)_1fr] gap-x-3">
        <div>
          {top10.map((l) => (
            <div key={l.cidade_id} className="flex h-9 items-center justify-end truncate text-sm text-ink-2">
              {l.cidade_id}
            </div>
          ))}
        </div>

        <div className="relative mr-16">
          {MARCAS.map((m) => (
            <div
              key={m}
              aria-hidden
              className={`absolute top-0 bottom-6 w-px ${m === 0 ? "bg-axis" : "bg-grid"}`}
              style={{ left: `${m}%` }}
            />
          ))}

          <ul>
            {top10.map((l) => (
              <li
                key={l.cidade_id}
                tabIndex={0}
                aria-label={`${l.cidade_id}: Score Final ${formatarNumero(l.scoreFinal)}`}
                className="relative h-9 rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--series-1)]"
                onPointerEnter={() => setAtiva(l.cidade_id)}
                onPointerLeave={() => setAtiva(null)}
                onFocus={() => setAtiva(l.cidade_id)}
                onBlur={() => setAtiva(null)}
              >
                <div
                  className="absolute top-1.5 bottom-1.5 left-0 rounded-r-[4px]"
                  style={{ width: largura(l.scoreFinal), background: cores[l.cidade_id] }}
                />
                <span
                  className="absolute top-1/2 -translate-y-1/2 pl-1.5 text-sm tabular-nums"
                  style={{ left: largura(l.scoreFinal) }}
                >
                  {formatarNumero(l.scoreFinal)}
                </span>

                {ativa === l.cidade_id && (
                  <div
                    role="status"
                    className="pointer-events-none absolute top-full left-0 z-10 mt-1 min-w-52 rounded-md border border-borda bg-surface px-3 py-2 text-sm shadow-md"
                  >
                    <div className="mb-1 font-medium">{l.cidade_id}</div>
                    {[
                      ["Score Final", l.scoreFinal],
                      ["Score Temperatura", l.scoreTemperatura],
                      ["Score Chuva", l.scoreChuva],
                      ["Score Descrição", l.scoreDescricao],
                    ].map(([rotulo, valor]) => (
                      <div key={rotulo as string} className="flex justify-between gap-4">
                        <span className="text-ink-2">{rotulo}</span>
                        <span className="tabular-nums">{formatarNumero(valor as number)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div aria-hidden className="relative h-6 text-xs text-muted">
            {MARCAS.map((m) => (
              <span key={m} className="absolute top-1 -translate-x-1/2 tabular-nums" style={{ left: `${m}%` }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}
