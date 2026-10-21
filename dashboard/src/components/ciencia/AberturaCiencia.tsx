import type { Ciencia } from "@/lib/analise/ciencia";
import { chapeuCiencia, linhaFinaCiencia, mancheteCiencia } from "@/lib/apresentacao/textosCiencia";

/** Chapéu, manchete e linha fina da aba de ciência de dados. */
export function AberturaCiencia({ ciencia }: { ciencia: Ciencia }) {
  return (
    <section className="flex max-w-[57.5rem] flex-col gap-5">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-accent uppercase">{chapeuCiencia(ciencia)}</p>
      <h1 className="font-display text-4xl leading-[1.04] font-extrabold tracking-[-0.025em] sm:text-6xl">
        {mancheteCiencia(ciencia)}
      </h1>
      <p className="max-w-[47.5rem] text-lg leading-relaxed text-ink-2 sm:text-xl">{linhaFinaCiencia()}</p>
    </section>
  );
}
