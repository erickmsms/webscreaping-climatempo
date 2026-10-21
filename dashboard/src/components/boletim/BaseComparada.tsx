import { COLUNAS_BASE } from "@/components/boletim/colunas";
import { TabelaDados } from "@/components/ui/TabelaDados";
import type { LinhaComparada } from "@/lib/analise/comparacao";

/** A base de pares previsão D-1 -> dado D, recolhida por padrão. */
export function BaseComparada({ linhas }: { linhas: LinhaComparada[] }) {
  return (
    <details className="border-y border-rule">
      <summary className="flex min-h-11 cursor-pointer items-center py-4 font-display text-lg font-bold">
        Ver base comparada ({linhas.length} linhas)
      </summary>
      <div className="pb-6">
        <TabelaDados colunas={COLUNAS_BASE} linhas={linhas} legenda="Base comparada (D-1 → D)" rolagem />
      </div>
    </details>
  );
}
