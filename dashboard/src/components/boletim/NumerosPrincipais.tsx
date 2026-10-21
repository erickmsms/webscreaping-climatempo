import type { Painel } from "@/lib/analise/painel";
import { formatarComUnidade, formatarPercentual } from "@/lib/apresentacao/formato";

/** Os quatro números que resumem o período, logo abaixo da manchete. */
export function NumerosPrincipais({ painel }: { painel: Painel }) {
  const volume = painel.acuracia.volumeChuva;
  const numeros = [
    { valor: formatarComUnidade(painel.temperaturaMax.mae, "°C"), texto: "erro médio na temperatura máxima." },
    { valor: formatarComUnidade(painel.temperaturaMin.mae, "°C"), texto: "erro médio na temperatura mínima." },
    {
      valor: formatarPercentual(painel.acuracia.chuvaBinaria),
      texto: "dos dias acertou se ia ou não chover.",
    },
    Number.isNaN(volume)
      ? { valor: "—", texto: "não choveu no período, então não há volume para comparar." }
      : { valor: formatarPercentual(volume), texto: "de acerto no volume de chuva, nos dias em que choveu." },
  ];

  return (
    <section aria-label="Números principais" className="grid border-t-2 border-b border-rule-strong border-b-rule lg:grid-cols-4">
      {numeros.map((n) => (
        <div
          key={n.texto}
          className="flex flex-col gap-2.5 border-t border-rule py-7 first:border-t-0 lg:border-t-0 lg:border-l lg:px-7 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
        >
          <span className="font-display text-6xl leading-none font-extrabold tracking-[-0.03em] md:text-7xl lg:text-5xl xl:text-[3.25rem]">
            {n.valor}
          </span>
          <span className="leading-relaxed text-ink-2">{n.texto}</span>
        </div>
      ))}
    </section>
  );
}
