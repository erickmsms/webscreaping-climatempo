import { Termo } from "@/components/ui/Dica";
import type { Painel } from "@/lib/analise/painel";
import { formatarDecimal, formatarPercentual } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";

type Numero = { valor: string; antes?: string; termo?: string; dica?: string; depois: string };

/** Os três números que resumem o período, logo abaixo da manchete. */
export function NumerosPrincipais({ painel }: { painel: Painel }) {
  const volume = painel.acuracia.volumeChuva;
  const numeros: Numero[] = [
    {
      valor: `${formatarDecimal(painel.temperaturaMax.mae, 2)} °C`,
      termo: "erro médio",
      dica: GLOSSARIO.mae,
      depois: ` na temperatura máxima. Na mínima, ${formatarDecimal(painel.temperaturaMin.mae, 2)} °C.`,
    },
    {
      valor: formatarPercentual(painel.acuracia.chuvaBinaria),
      antes: "dos dias ",
      termo: "acertou se ia ou não chover",
      dica: GLOSSARIO.acertoChuva,
      depois: ".",
    },
    Number.isNaN(volume)
      ? { valor: "—", depois: "não choveu no período, então não há volume para comparar." }
      : {
          valor: formatarPercentual(volume),
          antes: "de ",
          termo: "acerto no volume de chuva",
          dica: GLOSSARIO.acertoVolume,
          depois: ", nos dias em que choveu.",
        },
  ];

  return (
    <section aria-label="Números principais" className="grid border-t-2 border-b border-rule-strong border-b-rule md:grid-cols-3">
      {numeros.map((n) => (
        <div
          key={n.valor + n.depois}
          className="flex flex-col gap-2.5 border-t border-rule py-7 first:border-t-0 md:border-t-0 md:border-l md:px-7 md:first:border-l-0 md:first:pl-0 md:last:pr-0"
        >
          <span className="font-display text-6xl leading-none font-extrabold tracking-[-0.03em] md:text-7xl">
            {n.valor}
          </span>
          <span className="leading-relaxed text-ink-2">
            {n.antes}
            {n.termo && n.dica ? <Termo dica={n.dica}>{n.termo}</Termo> : null}
            {n.depois}
          </span>
        </div>
      ))}
    </section>
  );
}
