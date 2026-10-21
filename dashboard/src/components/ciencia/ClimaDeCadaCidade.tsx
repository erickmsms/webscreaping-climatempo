import { Secao } from "@/components/ui/Secao";
import type { Ciencia } from "@/lib/analise/ciencia";
import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { formatarComUnidade } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";

/** Primeira parte da história: o clima de cada cidade muda mais ou menos, e isso já decide quanto ela erra. */
export function ClimaDeCadaCidade({ ciencia }: { ciencia: Ciencia }) {
  const { temperaturaMax, temperaturaMin, chuva } = ciencia.constancia;
  const linhas = [...temperaturaMax].sort((a, b) => b.variacaoMedia - a.variacaoMedia);
  const maximo = Math.max(...linhas.map((l) => l.variacaoMedia), 1);

  return (
    <Secao titulo="Nem Todo Clima É Igualmente Difícil" dica={GLOSSARIO.constancia}>
      <p className="text-ink-2">Quanto a temperatura máxima muda, em média, de um dia para o outro.</p>
      <ol className="border-t-2 border-rule-strong">
        {linhas.map((l) => {
          const { nome, uf } = nomeDaCidade(l.cidade_id);
          const min = temperaturaMin.find((x) => x.cidade_id === l.cidade_id);
          const ch = chuva.find((x) => x.cidade_id === l.cidade_id);
          return (
            <li
              key={l.cidade_id}
              className="grid items-center gap-x-6 gap-y-2 border-b border-rule py-5 sm:grid-cols-[9rem_minmax(0,1fr)_16rem]"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display text-lg font-bold">{nome}</span>
                <span className="text-sm text-muted">{uf}</span>
              </div>
              <div aria-hidden="true" className="h-3.5 rounded-r bg-track">
                <div className="h-3.5 rounded-r bg-accent" style={{ width: `${(l.variacaoMedia / maximo) * 100}%` }} />
              </div>
              <div className="flex flex-col sm:text-right">
                <span className="font-display text-xl font-bold tabular-nums">
                  {formatarComUnidade(l.variacaoMedia, "°C", { casas: 1 })} por dia
                </span>
                <span className="text-sm text-ink-2">
                  mínima {formatarComUnidade(min?.variacaoMedia ?? Number.NaN, "°C", { casas: 1 })} · chuva{" "}
                  {formatarComUnidade(ch?.variacaoMedia ?? Number.NaN, "mm", { casas: 1 })}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </Secao>
  );
}
