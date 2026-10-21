import { Secao } from "@/components/ui/Secao";
import type { Painel } from "@/lib/analise/painel";
import { formatarDecimal, formatarPercentual } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";

/** Os dois jeitos de errar "vai chover?": ser pego de surpresa ou carregar guarda-chuva à toa. */
export function GuardaChuva({ painel }: { painel: Painel }) {
  const { acertos, surpresas, alarmesFalsos, total } = painel.chuvaEmDetalhe.aviso;
  const parte = (n: number) => (total === 0 ? Number.NaN : (n / total) * 100);
  const itens = [
    { valor: acertos, rotulo: "dias em que a previsão acertou se ia chover", cor: "bg-accent" },
    { valor: alarmesFalsos, rotulo: "alarmes falsos: avisou chuva e não choveu", cor: "bg-axis" },
    { valor: surpresas, rotulo: "pego de surpresa: choveu sem aviso", cor: "bg-axis" },
  ];
  const leitura =
    surpresas + alarmesFalsos === 0
      ? "A previsão não errou o “vai chover?” em nenhum dia."
      : alarmesFalsos > surpresas
        ? "Quando erra, a previsão prefere o lado seguro: avisa chuva à toa mais vezes do que deixa a chuva passar sem aviso."
        : "Quando erra, a previsão deixa a chuva passar sem aviso mais vezes do que avisa chuva à toa.";

  return (
    <Secao titulo="Pego de Surpresa ou Guarda-Chuva à Toa?" dica={GLOSSARIO.aviso}>
      <p className="max-w-[47.5rem] leading-relaxed text-ink-2">{leitura}</p>
      <ul className="grid border-t-2 border-b border-rule-strong border-b-rule lg:grid-cols-3">
        {itens.map((i) => (
          <li
            key={i.rotulo}
            className="flex flex-col gap-2.5 border-t border-rule py-7 first:border-t-0 lg:border-t-0 lg:border-l lg:px-7 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
          >
            <span className="font-display text-5xl leading-none font-extrabold tracking-[-0.03em] tabular-nums">
              {formatarDecimal(i.valor, 0)}
            </span>
            <div aria-hidden="true" className="h-3 rounded-r bg-track">
              <div
                className={`h-3 rounded-r ${i.cor}`}
                style={{ width: `${Number.isNaN(parte(i.valor)) ? 0 : parte(i.valor)}%` }}
              />
            </div>
            <span className="leading-relaxed text-ink-2">
              {i.rotulo} <span className="text-muted">({formatarPercentual(parte(i.valor))})</span>
            </span>
          </li>
        ))}
      </ul>
    </Secao>
  );
}
