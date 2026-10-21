import type { Metrica } from "@/lib/painel";

const COLUNAS: Record<number, string> = {
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/** Linha de cartões de métrica (o st.metric do Streamlit). */
export function GrupoMetricas({ metricas }: { metricas: Metrica[] }) {
  return (
    <dl className={`grid grid-cols-2 gap-3 ${COLUNAS[metricas.length] ?? "sm:grid-cols-4"}`}>
      {metricas.map((m) => (
        <div key={m.rotulo} className="min-w-0 rounded-lg border border-borda bg-surface px-3 py-3 sm:px-4">
          <dt className="text-sm text-ink-2">{m.rotulo}</dt>
          <dd className="mt-1 truncate text-xl font-semibold sm:text-3xl" title={m.valor}>
            {m.valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}
