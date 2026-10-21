import { Secao } from "@/components/ui/Secao";
import type { Ciencia } from "@/lib/analise/ciencia";
import { formatarDecimal } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";
import { conclusaoDasCausas, leituraDoFator, rotuloDaRelacao } from "@/lib/apresentacao/textosCiencia";

/** Quinta parte: os fatores que podem explicar o erro, com a força da relação e quantos casos a sustentam. */
export function CausasDoErro({ ciencia }: { ciencia: Ciencia }) {
  return (
    <Secao titulo="O Que Explica o Erro?" dica={GLOSSARIO.correlacaoDePosto}>
      <p className="text-ink-2">{conclusaoDasCausas(ciencia.fatores)}</p>
      <ol className="border-t-2 border-rule-strong">
        {ciencia.fatores.map((f) => {
          const forca = Number.isNaN(f.correlacao) ? 0 : Math.min(1, Math.abs(f.correlacao)) * 100;
          return (
            <li
              key={f.id}
              className="grid items-center gap-x-6 gap-y-2 border-b border-rule py-5 lg:grid-cols-[minmax(0,1fr)_14rem_6rem]"
            >
              <div className="flex flex-col gap-1">
                <span className="font-display text-lg font-bold">{f.nome}</span>
                <span className="text-sm text-ink-2">
                  {rotuloDaRelacao(f)} · {leituraDoFator(f)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div aria-hidden="true" className="h-3 flex-1 rounded-r bg-track">
                  <div className="h-3 rounded-r bg-accent" style={{ width: `${forca}%` }} />
                </div>
                <span className="w-14 text-right font-display text-xl font-bold tabular-nums">
                  {formatarDecimal(f.correlacao, 2, { sinal: true })}
                </span>
              </div>
              <span className="text-sm text-muted lg:text-right">
                {f.casos} {f.unidadeDosCasos}
              </span>
            </li>
          );
        })}
      </ol>
    </Secao>
  );
}
