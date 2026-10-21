const ESTILO = {
  alerta: { rotulo: "Atenção", cor: "text-warning" },
  erro: { rotulo: "Erro", cor: "text-critical" },
} as const;

/** Mensagem de alerta ou erro, com ícone e rótulo além da cor. */
export function Aviso({ tipo, children }: { tipo: keyof typeof ESTILO; children: React.ReactNode }) {
  const estilo = ESTILO[tipo];
  return (
    <div role={tipo === "erro" ? "alert" : "status"} className="flex items-start gap-3 rounded-xl bg-surface p-5">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`mt-0.5 h-5 w-5 shrink-0 ${estilo.cor}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3 2.5 20h19L12 3z" />
        <path d="M12 10v4" />
        <path d="M12 17.5h.01" />
      </svg>
      <p>
        <strong>{estilo.rotulo}:</strong> {children}
      </p>
    </div>
  );
}
