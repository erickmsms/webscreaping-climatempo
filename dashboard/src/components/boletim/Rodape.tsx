import { formatarPeriodo } from "@/lib/apresentacao/formato";

const REPOSITORIO = "https://github.com/erickmsms/webscreaping-climatempo";

/** Origem dos dados e link para o código. */
export function Rodape({ inicio, fim }: { inicio: string; fim: string }) {
  return (
    <footer className="flex flex-wrap justify-between gap-2 border-t border-rule pt-5 text-[13px] text-muted">
      <span>Dados: coleta diária automatizada (Scrapy + GitHub Actions) · {formatarPeriodo(inicio, fim)}</span>
      <a className="text-accent underline-offset-4 hover:underline" href={REPOSITORIO}>
        Código no GitHub
      </a>
    </footer>
  );
}
