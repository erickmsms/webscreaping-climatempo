import { formatarNumero } from "@/lib/formato";

export type Coluna<T> = {
  chave: keyof T & string;
  titulo?: string;
  tipo: "texto" | "data" | "inteiro" | "decimal";
};

const ALINHAMENTO: Record<Coluna<unknown>["tipo"], string> = {
  texto: "min-w-32 text-left",
  data: "whitespace-nowrap text-left tabular-nums",
  inteiro: "whitespace-nowrap text-right tabular-nums",
  decimal: "whitespace-nowrap text-right tabular-nums",
};

function formatarCelula(valor: unknown, tipo: Coluna<unknown>["tipo"]): string {
  if (valor === null || valor === undefined) return "—";
  if (tipo === "texto" || tipo === "data") return String(valor);
  if (typeof valor !== "number") return String(valor);
  return tipo === "inteiro" ? String(valor) : formatarNumero(valor);
}

/** Tabela de dados (o st.dataframe do Streamlit). */
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
    <div className="max-h-[32rem] overflow-auto rounded-lg border border-borda bg-surface">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{legenda}</caption>
        <thead className="sticky top-0 bg-surface">
          <tr>
            {colunas.map((c) => (
              <th
                key={c.chave}
                scope="col"
                className={`whitespace-nowrap border-b border-axis px-3 py-2 font-medium text-ink-2 ${
                  c.tipo === "texto" || c.tipo === "data" ? "text-left" : "text-right"
                }`}
              >
                {c.titulo ?? c.chave}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={i} className="border-b border-grid last:border-0">
              {colunas.map((c) => (
                <td key={c.chave} className={`px-3 py-1.5 align-top ${ALINHAMENTO[c.tipo]}`}>
                  {formatarCelula(linha[c.chave], c.tipo)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
