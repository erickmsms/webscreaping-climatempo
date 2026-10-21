import { Secao } from "@/components/ui/Secao";
import type { Ciencia } from "@/lib/analise/ciencia";
import type { ErroPorVariacao } from "@/lib/analise/variacao";
import { formatarComUnidade } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";

function Grafico({ titulo, unidade, faixas }: { titulo: string; unidade: string; faixas: ErroPorVariacao[] }) {
  const maximo = Math.max(...faixas.map((f) => (Number.isNaN(f.erroMedio) ? 0 : f.erroMedio)), 0.01);
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="font-display text-lg font-bold">{titulo}</h3>
      <ol className="border-t-2 border-rule-strong">
        {faixas.map((f) => (
          <li key={f.rotulo} className="flex flex-col gap-2 border-b border-rule py-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">{f.rotulo}</span>
              <span className="text-sm text-muted">{f.dias} dias</span>
            </div>
            <div aria-hidden="true" className="h-3 rounded-r bg-track">
              <div
                className="h-3 rounded-r bg-accent"
                style={{ width: `${Number.isNaN(f.erroMedio) ? 0 : (f.erroMedio / maximo) * 100}%` }}
              />
            </div>
            <div className="flex flex-col text-sm leading-snug text-ink-2">
              <span>
                erra <strong className="text-ink">{formatarComUnidade(f.erroMedio, unidade, { casas: 2 })}</strong>
              </span>
              {!Number.isNaN(f.erroPorUnidade) && (
                <span>
                  para cada 1 {unidade} de mudança, erra {formatarComUnidade(f.erroPorUnidade, unidade, { casas: 2 })}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Terceira parte: o erro cresce quando o tempo vira, mas menos do que a própria mudança. */
export function ErroConformeOTempoMuda({ ciencia }: { ciencia: Ciencia }) {
  return (
    <Secao titulo="O Erro Cresce Quando o Tempo Vira" dica={GLOSSARIO.erroPorMudanca}>
      <p className="text-ink-2">Erro da previsão conforme o quanto o tempo mudou em relação a ontem.</p>
      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-2">
        <Grafico titulo="Temperatura máxima" unidade="°C" faixas={ciencia.variacao.temperaturaMax} />
        <Grafico titulo="Chuva" unidade="mm" faixas={ciencia.variacao.chuva} />
      </div>
    </Secao>
  );
}
