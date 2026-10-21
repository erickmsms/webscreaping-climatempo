import { SeletorMultiplo } from "@/components/ui/SeletorMultiplo";
import { nomeDaCidade } from "@/lib/apresentacao/cidades";

/** Barra fixa no topo: nome do boletim e, quando há dados, o filtro de cidades (que acompanha a rolagem). */
export function Cabecalho({
  opcoes,
  cidades,
  cores,
  aoEscolher,
}: {
  opcoes?: string[];
  cidades?: string[];
  cores?: Record<string, string>;
  aoEscolher?: (cidades: string[]) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-page/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[70rem] flex-col gap-2 px-6 py-3 md:flex-row md:items-center md:justify-between md:gap-3 md:py-4">
        <span className="font-display text-lg font-extrabold tracking-tight">Boletim de precisão</span>
        {opcoes && cidades && aoEscolher && (
          <SeletorMultiplo
            rotulo="Cidades"
            opcoes={opcoes.map((id) => ({ valor: id, rotulo: nomeDaCidade(id).nome, cor: cores?.[id] }))}
            selecionados={cidades}
            aoMudar={aoEscolher}
          />
        )}
      </div>
    </header>
  );
}
