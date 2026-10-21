import { nomeDaCidade } from "@/lib/cidades";
import { TODAS } from "@/lib/painel";

/** Barra do topo: nome do boletim e, quando há dados, o filtro de cidade. */
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
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-[70rem] flex-wrap items-center justify-between gap-3 px-6 py-4">
        <span className="font-display text-lg font-extrabold tracking-tight">Boletim de precisão</span>
        {opcoes && aoEscolher && (
          <div role="group" aria-label="Filtrar por cidade" className="flex flex-wrap gap-1">
            {opcoes.map((opcao) => {
              const ativa = opcao === cidade;
              return (
                <button
                  key={opcao}
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => aoEscolher(opcao)}
                  className={`min-h-11 cursor-pointer rounded-full border px-3.5 text-sm outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 ${
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
