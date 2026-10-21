import { Secao } from "@/components/ui/Secao";
import type { MatrizDeCorrelacao } from "@/lib/analise/correlacao";
import type { Painel } from "@/lib/analise/painel";
import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { formatarDecimal } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";
import { leituraDaCorrelacao } from "@/lib/apresentacao/textos";

const VARIAVEIS = [
  { chave: "chuva", titulo: "Chuva" },
  { chave: "temperaturaMax", titulo: "Temperatura máxima" },
  { chave: "temperaturaMin", titulo: "Temperatura mínima" },
] as const;

/** Fundo da célula: azul para erros que andam juntos, laranja para opostos; quanto mais forte, mais cor. */
function fundo(valor: number | null, diagonal: boolean): string | undefined {
  if (valor === null || diagonal) return undefined;
  const cor = valor >= 0 ? "var(--accent)" : "var(--series-2)";
  return `color-mix(in srgb, ${cor} ${Math.round(Math.abs(valor) * 55)}%, transparent)`;
}

function Matriz({ titulo, matriz }: { titulo: string; matriz: MatrizDeCorrelacao }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-lg font-bold">{titulo}</h3>
        <p className="flex items-baseline gap-2.5">
          <span className="font-display text-4xl leading-none font-extrabold tracking-[-0.03em] tabular-nums">
            {formatarDecimal(matriz.indice, 2, { sinal: true })}
          </span>
          <span className="text-sm leading-snug text-ink-2">{leituraDaCorrelacao(matriz.indice)}</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm tabular-nums">
          <caption className="sr-only">{`Correlação entre os erros de ${titulo.toLowerCase()} de cada par de cidades`}</caption>
          <thead>
            <tr>
              <td />
              {matriz.cidades.map((id) => (
                <th key={id} scope="col" className="px-1 pb-2 text-center text-xs font-semibold text-ink-2">
                  {nomeDaCidade(id).nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matriz.cidades.map((linha, i) => (
              <tr key={linha}>
                <th scope="row" className="py-0.5 pr-2 text-left text-xs font-semibold whitespace-nowrap text-ink-2">
                  {nomeDaCidade(linha).nome}
                </th>
                {matriz.cidades.map((coluna, j) => {
                  const valor = matriz.valores[i][j];
                  return (
                    <td
                      key={coluna}
                      title={valor === null ? "Poucos dias em comum, ou erro sem variação" : undefined}
                      style={{ background: fundo(valor, i === j) }}
                      className={`h-10 border-2 border-page text-center ${i === j || valor === null ? "text-muted" : ""}`}
                    >
                      {i === j || valor === null ? "—" : formatarDecimal(valor, 2, { sinal: true })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Quando uma cidade erra, as outras erram junto? Uma matriz de correlação por tipo de erro. */
export function CorrelacaoDeErros({ painel }: { painel: Painel }) {
  if (!painel.correlacoes) return null;
  const correlacoes = painel.correlacoes;
  return (
    <Secao titulo="Quando uma cidade erra, as outras erram?" dica={GLOSSARIO.correlacao}>
      <p className="max-w-[47.5rem] text-ink-2">
        Cada quadro mostra o quanto os erros diários de duas cidades andam juntos, de −1 a +1. O número grande é o índice:
        a média de todos os pares.
      </p>
      <div className="mt-4 grid gap-10 lg:grid-cols-3">
        {VARIAVEIS.map((v) => (
          <Matriz key={v.chave} titulo={v.titulo} matriz={correlacoes[v.chave]} />
        ))}
      </div>
    </Secao>
  );
}
