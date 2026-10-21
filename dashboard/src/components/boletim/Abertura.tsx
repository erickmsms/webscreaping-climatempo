import type { Painel } from "@/lib/analise/painel";
import { chapeu, linhaFina, manchete } from "@/lib/apresentacao/textos";

/** Chapéu, manchete e linha fina: a conclusão do boletim, gerada dos dados. */
export function Abertura({ painel }: { painel: Painel }) {
  return (
    <section className="flex max-w-[57.5rem] flex-col gap-5">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-accent uppercase">{chapeu(painel)}</p>
      <h1 className="font-display text-4xl leading-[1.04] font-extrabold tracking-[-0.025em] sm:text-6xl">
        {manchete(painel)}
      </h1>
      <p className="max-w-[47.5rem] text-lg leading-relaxed text-ink-2 sm:text-xl">{linhaFina()}</p>
    </section>
  );
}
