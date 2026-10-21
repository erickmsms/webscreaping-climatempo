import { CoberturaEGanho } from "@/components/ciencia/CoberturaEGanho";
import { Aviso } from "@/components/ui/Aviso";
import { Secao } from "@/components/ui/Secao";
import type { Ciencia } from "@/lib/analise/ciencia";
import { RAIO_DO_ENTORNO_KM, type Categoria, type CoberturaDaCidade } from "@/lib/analise/estacoes";
import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { formatarDecimal } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";
import { nomeDaEstacao } from "@/lib/apresentacao/textosCiencia";

const ESTILO_DA_CATEGORIA: Record<Categoria, string> = {
  "na cidade": "bg-accent text-page",
  "só no entorno": "bg-surface text-ink-2",
  descoberta: "bg-surface text-critical",
};

const ROTULO_DA_CATEGORIA: Record<Categoria, string> = {
  "na cidade": "estação na cidade",
  "só no entorno": "só no entorno",
  descoberta: "sem estação por perto",
};

/** Quais estações são, em uma linha: as de dentro da cidade ou, sem elas, a mais perto do limite. */
function detalhes(c: CoberturaDaCidade): string {
  const partes = [
    `${c.dentro.length} na cidade`,
    `${c.noEntorno.length} no entorno (até ${RAIO_DO_ENTORNO_KM} km do limite)`,
  ];
  if (c.emPane > 0) partes.push(`${c.emPane} em pane`);
  const maisPerto = c.noEntorno[0];
  const nomes =
    c.dentro.length > 0
      ? c.dentro.map((e) => nomeDaEstacao(e.nome)).join(", ")
      : maisPerto
        ? `${nomeDaEstacao(maisPerto.nome)}, a ${formatarDecimal(maisPerto.kmDoLimite, 1)} km do limite`
        : null;
  return `${partes.join(" · ")}${nomes ? ` · ${nomes}` : ""}`;
}

/** Quarta parte: quão bem cada cidade é coberta por estações do INMET e como o ganho da previsão se comporta ao lado. */
export function EstacoesMeteorologicas({ ciencia }: { ciencia: Ciencia }) {
  if (ciencia.cobertura.length === 0) {
    return (
      <Secao titulo="Estações Meteorológicas" dica={GLOSSARIO.estacoes}>
        <Aviso tipo="alerta">
          Não encontrei o catálogo de estações ou os limites dos municípios (data/estacoes). Rode
          data/estacoes/baixar_estacoes.py e data/estacoes/baixar_municipios.py para gerá-los.
        </Aviso>
      </Secao>
    );
  }

  const linhas = [...ciencia.cobertura].sort((a, b) => b.indice - a.indice);
  const maximo = Math.max(...linhas.map((l) => l.indice), 1);

  return (
    <Secao titulo="Estações Meteorológicas" dica={GLOSSARIO.estacoes}>
      <p className="text-ink-2">Estações do INMET dentro de cada cidade e no entorno, resumidas num índice de cobertura.</p>
      <ol className="border-t-2 border-rule-strong">
        {linhas.map((l) => {
          const { nome, uf } = nomeDaCidade(l.cidade_id);
          return (
            <li
              key={l.cidade_id}
              className="grid items-center gap-x-6 gap-y-3 border-b border-rule py-5 lg:grid-cols-[9rem_minmax(0,1fr)]"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display text-lg font-bold">{nome}</span>
                <span className="text-sm text-muted">{uf}</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_DA_CATEGORIA[l.categoria]}`}>
                    {ROTULO_DA_CATEGORIA[l.categoria]}
                  </span>
                  <span className="font-display text-xl font-bold tabular-nums">
                    {formatarDecimal(l.indice, 2)} <span className="text-sm font-semibold text-muted">cobertura</span>
                  </span>
                </div>
                <div aria-hidden="true" className="h-3 rounded-r bg-track">
                  <div className="h-3 rounded-r bg-accent" style={{ width: `${(l.indice / maximo) * 100}%` }} />
                </div>
                <span className="text-sm text-ink-2">{detalhes(l)}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <CoberturaEGanho ciencia={ciencia} />
    </Secao>
  );
}
