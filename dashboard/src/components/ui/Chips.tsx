export type OpcaoDoChip<T extends string> = { valor: T; rotulo: string };

/** Escolha de uma opção entre poucas, em chips: o escolhido fica preenchido. */
export function Chips<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
}: {
  rotulo: string;
  opcoes: ReadonlyArray<OpcaoDoChip<T>>;
  valor: T;
  aoEscolher: (valor: T) => void;
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-1">
      {opcoes.map((o) => {
        const ativa = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={ativa}
            onClick={() => aoEscolher(o.valor)}
            className={`min-h-11 shrink-0 cursor-pointer rounded-full border px-3.5 text-sm outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 ${
              ativa
                ? "border-ink bg-ink font-semibold text-page"
                : "border-axis/50 bg-page font-medium text-ink hover:border-ink"
            }`}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}
