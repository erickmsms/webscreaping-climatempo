import { Termo } from "@/components/ui/Dica";
import type { Painel } from "@/lib/analise/painel";
import { formatarDecimal } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";
import { leituraDaCorrelacao } from "@/lib/apresentacao/textos";

type Correlacoes = NonNullable<Painel["correlacoes"]>;

const VARIAVEIS: Array<{ chave: keyof Correlacoes; titulo: string }> = [
  { chave: "chuva", titulo: "Chuva" },
  { chave: "temperaturaMax", titulo: "Temperatura máxima" },
  { chave: "temperaturaMin", titulo: "Temperatura mínima" },
];

/** Ao lado do gráfico de erros: quando uma cidade erra, as outras erram junto? Um índice por tipo de erro. */
export function CorrelacaoDeErros({ correlacoes }: { correlacoes: Correlacoes }) {
  return (
    <aside aria-label="Correlação entre os erros das cidades" className="flex flex-col gap-4 lg:w-64 lg:shrink-0">
      <h3 className="font-display text-lg font-bold">
        <Termo dica={GLOSSARIO.correlacao}>As cidades erram juntas?</Termo>
      </h3>
      <ul className="border-t-2 border-rule-strong">
        {VARIAVEIS.map((v) => (
          <li key={v.chave} className="flex flex-col gap-1 border-b border-rule py-4 last:border-b-0">
            <span className="text-[13px] font-semibold text-ink-2">{v.titulo}</span>
            <span className="font-display text-4xl leading-none font-extrabold tracking-[-0.03em] tabular-nums">
              {formatarDecimal(correlacoes[v.chave], 2, { sinal: true })}
            </span>
            <span className="text-sm leading-snug text-ink-2">{leituraDaCorrelacao(correlacoes[v.chave])}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
