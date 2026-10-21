"use client";

import { useEffect, useId, useRef, useState } from "react";

export type OpcaoDoSeletor = { valor: string; rotulo: string; cor?: string };

/** "Todas", "Recife", "Recife, Pedra" ou "3 de 8": cabe no botão sem quebrar a barra. */
function resumir(opcoes: OpcaoDoSeletor[], selecionados: string[]): string {
  if (selecionados.length === 0) return "Nenhuma";
  if (selecionados.length === opcoes.length) return "Todas";
  if (selecionados.length <= 2) {
    return opcoes
      .filter((o) => selecionados.includes(o.valor))
      .map((o) => o.rotulo)
      .join(", ");
  }
  return `${selecionados.length} de ${opcoes.length}`;
}

const BOTAO_DE_ACAO =
  "cursor-pointer rounded px-1 text-sm font-medium text-accent underline-offset-2 outline-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:text-muted disabled:no-underline";

/**
 * Caixa de seleção múltipla: um botão com o resumo da escolha que abre uma lista
 * de caixas de marcar, com atalhos para marcar tudo e limpar. Fecha ao clicar
 * fora ou com Esc (devolvendo o foco ao botão).
 */
export function SeletorMultiplo({
  rotulo,
  opcoes,
  selecionados,
  aoMudar,
}: {
  rotulo: string;
  opcoes: OpcaoDoSeletor[];
  selecionados: string[];
  aoMudar: (selecionados: string[]) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const idDaLista = useId();

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAberto(false);
      botao.current?.focus();
    };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const alternar = (valor: string) =>
    aoMudar(
      selecionados.includes(valor)
        ? selecionados.filter((v) => v !== valor)
        : opcoes.map((o) => o.valor).filter((v) => v === valor || selecionados.includes(v)),
    );

  const todasMarcadas = selecionados.length === opcoes.length;

  return (
    <div ref={raiz} className="relative">
      <button
        ref={botao}
        type="button"
        aria-expanded={aberto}
        aria-controls={idDaLista}
        onClick={() => setAberto((a) => !a)}
        className={`flex min-h-11 w-full max-w-full cursor-pointer items-center gap-2 rounded-full border bg-page px-4 text-sm text-ink outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 md:w-auto ${
          aberto ? "border-ink" : "border-axis/50 hover:border-ink"
        }`}
      >
        <span className="text-muted">{rotulo}</span>
        <span className="min-w-0 truncate font-semibold">{resumir(opcoes, selecionados)}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={`ml-auto size-3 shrink-0 text-muted transition-transform ${aberto ? "rotate-180" : ""}`}
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {aberto && (
        <div
          id={idDaLista}
          role="group"
          aria-label={rotulo}
          className="absolute top-full left-0 z-50 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-rule bg-page shadow-lg md:right-0 md:left-auto"
        >
          <div className="flex items-center justify-between border-b border-rule px-3 py-2">
            <button type="button" className={BOTAO_DE_ACAO} disabled={todasMarcadas} onClick={() => aoMudar(opcoes.map((o) => o.valor))}>
              Marcar todas
            </button>
            <button type="button" className={BOTAO_DE_ACAO} disabled={selecionados.length === 0} onClick={() => aoMudar([])}>
              Limpar
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {opcoes.map((o) => (
              <li key={o.valor}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 text-sm hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={selecionados.includes(o.valor)}
                    onChange={() => alternar(o.valor)}
                    className="size-4 shrink-0 cursor-pointer accent-accent"
                  />
                  {o.cor && <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: o.cor }} />}
                  <span className="min-w-0 truncate">{o.rotulo}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
