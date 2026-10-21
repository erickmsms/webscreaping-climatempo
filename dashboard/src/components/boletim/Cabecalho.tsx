import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { TODAS } from "@/lib/analise/painel";

/** Barra fixa no topo: nome do boletim e, quando há dados, o filtro de cidade (que acompanha a rolagem). */
export function Cabecalho({
  opcoes,
  cidade,
  aoEscolher,
}: {
  opcoes?: string[];
  cidade?: string;
  aoEscolher?: (cidade: string) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-page/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[70rem] flex-col gap-2 px-6 py-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3 md:py-4">
        <span className="font-display text-lg font-extrabold tracking-tight">Boletim de precisão</span>
        {opcoes && aoEscolher && (
          <div
            role="group"
            aria-label="Filtrar por cidade"
            className="-mx-6 flex gap-1 overflow-x-auto px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
          >
            {opcoes.map((opcao) => {
              const ativa = opcao === cidade;
              return (
                <button
                  key={opcao}
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => aoEscolher(opcao)}
                  className={`min-h-11 shrink-0 cursor-pointer rounded-full border px-3.5 text-sm outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    ativa
                      ? "border-ink bg-ink font-semibold text-page"
                      : "border-axis/50 bg-page font-medium text-ink hover:border-ink"
                  }`}
                >
                  {opcao === TODAS ? "Todas" : nomeDaCidade(opcao).nome}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
