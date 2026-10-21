import { Termo } from "@/components/ui/Dica";
import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { formatarComUnidade, formatarPercentual } from "@/lib/apresentacao/formato";

export type Coluna<T> = {
  chave: keyof T & string;
  titulo: string;
  tipo: "cidade" | "numero" | "decimal" | "percentual";
  /** Unidade depois do número ("°C", "mm"). */
  sufixo?: string;
  /** Explicação do termo, mostrada num tooltip ao lado do título. */
  dica?: string;
};

const NUMERICO = new Set<Coluna<unknown>["tipo"]>(["numero", "decimal", "percentual"]);

function formatarCelula(valor: unknown, coluna: Coluna<unknown>): string {
  if (valor === null || valor === undefined) return "—";
  if (coluna.tipo === "cidade") return nomeDaCidade(String(valor)).nome;
  if (typeof valor !== "number" || Number.isNaN(valor)) return "—";
  if (coluna.tipo === "percentual") return formatarPercentual(valor);

  // "numero": inteiros como estão (temperaturas); "decimal": 2 casas.
  const casas = coluna.tipo === "decimal" ? 2 : Number.isInteger(valor) ? 0 : 1;
  return formatarComUnidade(valor, coluna.sufixo, { casas });
}

/** Tabela de dados, com rolagem horizontal em telas estreitas. */
export function TabelaDados<T extends object>({
  colunas,
  linhas,
  legenda,
}: {
  colunas: Coluna<T>[];
  linhas: T[];
  legenda: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[45rem] border-collapse text-[15px] tabular-nums">
        <caption className="sr-only">{legenda}</caption>
        <thead>
          <tr>
            {colunas.map((c) => (
              <th
                key={c.chave}
                scope="col"
                className={`border-b-2 border-rule-strong px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap text-ink-2 first:pl-0 last:pr-0 ${
                  NUMERICO.has(c.tipo) ? "text-right" : "text-left"
                }`}
              >
                {c.dica ? <Termo dica={c.dica}>{c.titulo}</Termo> : c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={i} className="border-b border-rule">
              {colunas.map((c, j) => {
                const Celula = j === 0 ? "th" : "td";
                return (
                  <Celula
                    key={c.chave}
                    scope={j === 0 ? "row" : undefined}
                    className={`px-3 py-3 align-top first:pl-0 last:pr-0 ${
                      NUMERICO.has(c.tipo) ? "text-right" : "text-left"
                    } whitespace-nowrap ${j === 0 ? "font-semibold" : "font-normal"}`}
                  >
                    {formatarCelula(linha[c.chave], c as Coluna<unknown>)}
                  </Celula>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
