import { Secao } from "@/components/ui/Secao";
import type { Painel } from "@/lib/analise/painel";
import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { formatarComUnidade, formatarDecimal } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";

const largura = (v: number, maximo: number) => `${maximo === 0 ? 0 : Math.min(100, (v / maximo) * 100)}%`;

function Linha({ rotulo, valor, barra, destaque = false }: { rotulo: string; valor: number; barra: string; destaque?: boolean }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_5rem] items-center gap-3">
      <dt className="text-sm text-ink-2">{rotulo}</dt>
      <div aria-hidden="true" className="h-3 rounded-r bg-track">
        <div className={`h-3 rounded-r ${destaque ? "bg-accent" : "bg-axis"}`} style={{ width: barra }} />
      </div>
      <dd className="text-right text-sm font-semibold tabular-nums">{formatarComUnidade(valor, "mm", { casas: 0 })}</dd>
    </div>
  );
}

/** Soma da chuva prevista e real por cidade, ao lado do erro médio por dia: o total bate, o dia nem sempre. */
export function TotalVsDia({ painel }: { painel: Painel }) {
  const cidades = painel.chuvaEmDetalhe.porCidade;
  const maximo = Math.max(...cidades.flatMap((c) => [c.previsto, c.real]), 0);

  return (
    <Secao titulo="Acerta o Total, Erra o Dia" dica={GLOSSARIO.totalDeChuva}>
      <p className="max-w-[47.5rem] leading-relaxed text-ink-2">
        Somando todo o período, a chuva prevista fica perto da que caiu. O erro aparece na hora de dizer em que dia ela
        cai.
      </p>
      <ul className="border-t-2 border-rule-strong">
        {cidades.map((c) => {
          const { nome, uf } = nomeDaCidade(c.cidade_id);
          const diferenca = c.real === 0 ? Number.NaN : ((c.previsto - c.real) / c.real) * 100;
          return (
            <li
              key={c.cidade_id}
              className="grid items-center gap-x-6 gap-y-3 border-b border-rule py-5 sm:grid-cols-[9rem_minmax(0,1fr)_13rem]"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display text-lg font-bold">{nome}</span>
                <span className="text-sm text-muted">{uf}</span>
              </div>
              <dl className="flex flex-col gap-2">
                <Linha rotulo="Previsto" valor={c.previsto} barra={largura(c.previsto, maximo)} destaque />
                <Linha rotulo="Choveu" valor={c.real} barra={largura(c.real, maximo)} />
              </dl>
              <div className="flex flex-col sm:text-right">
                <span className="font-display text-xl font-bold tabular-nums">
                  erra {formatarComUnidade(c.maePorDia, "mm", { casas: 1 })} por dia
                </span>
                <span className="text-sm text-ink-2">
                  {Number.isNaN(diferenca)
                    ? "sem chuva no período"
                    : Math.round(Math.abs(diferenca)) === 0
                      ? "no total, praticamente igual"
                      : `no total, ${formatarDecimal(Math.abs(diferenca), 0)}% ${diferenca >= 0 ? "a mais" : "a menos"}`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Secao>
  );
}
