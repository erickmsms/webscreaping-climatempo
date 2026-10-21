"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/", rotulo: "Boletim" },
  { href: "/ciencia-de-dados", rotulo: "Ciência de Dados" },
] as const;

/** Abas do cabeçalho: o boletim e a análise de ciência de dados. */
export function Abas() {
  const caminho = usePathname();
  return (
    <nav aria-label="Seções do site" className="flex gap-1">
      {ABAS.map((aba) => {
        const ativa = caminho === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              ativa ? "bg-ink text-page" : "text-ink-2 hover:bg-surface hover:text-ink"
            }`}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
