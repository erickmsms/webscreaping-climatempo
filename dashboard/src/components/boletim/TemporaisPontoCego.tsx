import { Secao } from "@/components/ui/Secao";
import type { Painel } from "@/lib/analise/painel";
import { formatarComUnidade } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";

function tendencia(vies: number): string {
  if (Number.isNaN(vies)) return "sem dias de chuva";
  if (Math.abs(vies) < 0.5) return "sem tendência clara";
  const quanto = formatarComUnidade(Math.abs(vies), "mm", { casas: 1 });
  return vies > 0 ? `costuma prever ${quanto} a mais` : `costuma prever ${quanto} a menos`;
}

/** Erro da previsão de chuva por tamanho da chuva: tranquila na garoa, cega no temporal. */
export function TemporaisPontoCego({ painel }: { painel: Painel }) {
  const faixas = painel.chuvaEmDetalhe.faixas;
  const maximo = Math.max(...faixas.map((f) => (Number.isNaN(f.mae) ? 0 : f.mae)), 1);
  const forte = faixas.find((f) => f.id === "forte");
  const subestima = forte !== undefined && forte.dias > 0 && forte.vies < 0;

  return (
    <Secao titulo="Temporais: o Ponto Cego" dica={GLOSSARIO.faixasDeChuva}>
      <p className="max-w-[47.5rem] leading-relaxed text-ink-2">
        {subestima
          ? `Nos temporais, a previsão ficou ${formatarComUnidade(Math.abs(forte.vies), "mm", { casas: 1 })} aquém do que caiu, em média. Quanto maior a chuva, maior o erro: justo nos dias que mais importam.`
          : "Quanto maior a chuva, maior tende a ser o erro da previsão."}
      </p>
      <ol className="border-t-2 border-rule-strong">
        {faixas.map((f) => (
          <li
            key={f.id}
            className="grid grid-cols-1 items-center gap-x-6 gap-y-2 border-b border-rule py-5 sm:grid-cols-[11rem_minmax(0,1fr)_14rem]"
          >
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold">{f.rotulo}</span>
              <span className="text-sm text-muted">
                {f.intervalo} · {f.dias} {f.dias === 1 ? "dia" : "dias"}
              </span>
            </div>
            <div aria-hidden="true" className="h-3.5 rounded-r bg-track">
              <div
                className={`h-3.5 rounded-r ${f.id === "forte" ? "bg-critical" : "bg-accent"}`}
                style={{ width: `${Number.isNaN(f.mae) ? 0 : (f.mae / maximo) * 100}%` }}
              />
            </div>
            <div className="flex flex-col sm:text-right">
              <span className="font-display text-xl font-bold tabular-nums">
                erra {formatarComUnidade(f.mae, "mm", { casas: 1 })}
              </span>
              <span className="text-sm text-ink-2">{tendencia(f.vies)}</span>
            </div>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
