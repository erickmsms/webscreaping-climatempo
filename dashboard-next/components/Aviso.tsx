const ESTILO = {
  alerta: { icone: "⚠️", rotulo: "Atenção", cor: "border-warning" },
  erro: { icone: "⛔", rotulo: "Erro", cor: "border-critical" },
} as const;

/** Mensagem de aviso (o st.warning / st.error do Streamlit). */
export function Aviso({ tipo, children }: { tipo: keyof typeof ESTILO; children: React.ReactNode }) {
  const estilo = ESTILO[tipo];
  return (
    <div role={tipo === "erro" ? "alert" : "status"} className={`rounded-lg border-l-4 ${estilo.cor} bg-surface px-4 py-3`}>
      <span aria-hidden>{estilo.icone}</span> <strong>{estilo.rotulo}:</strong> {children}
    </div>
  );
}
