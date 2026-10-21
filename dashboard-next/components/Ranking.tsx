import type { LinhaRanking } from "@/lib/analise";
import { nomeDaCidade } from "@/lib/cidades";
import { formatarDecimal } from "@/lib/formato";

const largura = (v: number) => `${Number.isNaN(v) ? 0 : Math.min(100, Math.max(0, v))}%`;

/** Ranking de precisão: posição, barra do score e as notas que o compõem. */
export function Ranking({
  linhas,
  cores,
  selecionada,
}: {
  linhas: LinhaRanking[];
  cores: Record<string, string>;
  selecionada?: string;
}) {
  return (
    <ol>
      {linhas.map((l, i) => {
        const { nome, uf } = nomeDaCidade(l.cidade_id);
        const destaque = l.cidade_id === selecionada;
        return (
          <li
            key={l.cidade_id}
            aria-current={destaque ? "true" : undefined}
            className={`grid grid-cols-[2.25rem_minmax(0,1fr)_4.5rem] items-center gap-4 border-t border-rule py-5 last:border-b sm:grid-cols-[3rem_minmax(0,1fr)_6rem] ${
              destaque ? "-mx-4 bg-surface px-4" : ""
            }`}
          >
            <span className={`font-display text-2xl font-bold sm:text-3xl ${i === 0 ? "text-accent" : "text-muted"}`}>
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-2.5">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <span className="font-display text-xl font-bold sm:text-2xl">{nome}</span>
                <span className="text-sm text-muted">{uf}</span>
                {destaque && (
                  <span className="text-xs font-semibold tracking-wider text-accent uppercase">cidade filtrada</span>
                )}
              </div>
              <div aria-hidden="true" className="h-3.5 rounded-r bg-track">
                <div className="h-3.5 rounded-r" style={{ width: largura(l.scoreFinal), background: cores[l.cidade_id] }} />
              </div>
              <span className="text-sm text-ink-2">
                Temperatura {formatarDecimal(l.scoreTemperatura, 1)} · Chuva {formatarDecimal(l.scoreChuva, 1)} ·
                Descrição {formatarDecimal(l.scoreDescricao, 1)}
              </span>
            </div>
            <span className="text-right font-display text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
              {formatarDecimal(l.scoreFinal, 1)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
