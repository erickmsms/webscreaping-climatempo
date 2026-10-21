import type { Painel } from "@/lib/analise/painel";
import { formatarComUnidade, formatarPercentual } from "@/lib/apresentacao/formato";

/** Os quatro números que resumem o período, em cards logo abaixo da manchete. */
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
    <section aria-label="Números principais" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {numeros.map((n) => (
        <div key={n.texto} className="flex flex-col gap-2.5 rounded-xl bg-surface p-6">
          <span className="font-display text-6xl leading-none font-extrabold tracking-[-0.03em] lg:text-5xl">
            {n.valor}
          </span>
          <span className="leading-relaxed text-ink-2">{n.texto}</span>
        </div>
      ))}
    </section>
  );
}
