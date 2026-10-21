import { Secao } from "@/components/ui/Secao";
import type { Ciencia } from "@/lib/analise/ciencia";
import type { ConstanciaDaCidade } from "@/lib/analise/constancia";
import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { formatarComUnidade, formatarDecimal } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";

const BLOCOS = [
  { chave: "temperaturaMax", titulo: "Temperatura máxima", unidade: "°C" },
  { chave: "temperaturaMin", titulo: "Temperatura mínima", unidade: "°C" },
  { chave: "chuva", titulo: "Chuva", unidade: "mm" },
] as const;

const LARGURA = 400;
const ALTURA_LINHA = 38;
const TOPO = 34;
const X_ESQUERDA = 168;
const X_DIREITA = 232;

const COR = { sobe: "var(--accent)", desce: "var(--series-2)", igual: "var(--axis)" } as const;

function movimento(c: ConstanciaDaCidade): keyof typeof COR {
  return c.posicaoJusta < c.posicaoBruta ? "sobe" : c.posicaoJusta > c.posicaoBruta ? "desce" : "igual";
}

const yDaPosicao = (posicao: number) => TOPO + (posicao - 1) * ALTURA_LINHA + ALTURA_LINHA / 2;

/** Descrição em texto do gráfico, para leitores de tela. */
function descricao(titulo: string, linhas: ConstanciaDaCidade[]): string {
  const partes = linhas.map((c) => {
    const nome = nomeDaCidade(c.cidade_id).nome;
    return `${nome}: ${c.posicaoBruta}º no menor erro e ${c.posicaoJusta}º na maior nota`;
  });
  return `${titulo}. ${partes.join("; ")}.`;
}

/**
 * Dois rankings lado a lado: quem tem o menor erro bruto e quem tem a maior nota sobre o óbvio.
 * Uma linha liga cada cidade nos dois, para ver quem sobe ou desce quando o clima sai da conta.
 */
function Comparacao({ titulo, unidade, linhas }: { titulo: string; unidade: string; linhas: ConstanciaDaCidade[] }) {
  const altura = TOPO + linhas.length * ALTURA_LINHA + 4;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h3 className="font-display text-lg font-bold">{titulo}</h3>
      <svg
        role="img"
        aria-label={descricao(titulo, linhas)}
        viewBox={`0 0 ${LARGURA} ${altura}`}
        className="w-full border-t-2 border-rule-strong text-ink"
      >
        <text x={0} y={22} className="fill-muted text-[11px] font-semibold tracking-wider uppercase">
          Menor erro
        </text>
        <text x={LARGURA} y={22} textAnchor="end" className="fill-muted text-[11px] font-semibold tracking-wider uppercase">
          Maior nota
        </text>

        {linhas.map((c) => (
          <line
            key={`linha-${c.cidade_id}`}
            x1={X_ESQUERDA}
            y1={yDaPosicao(c.posicaoBruta)}
            x2={X_DIREITA}
            y2={yDaPosicao(c.posicaoJusta)}
            stroke={COR[movimento(c)]}
            strokeWidth={movimento(c) === "igual" ? 2 : 3}
            strokeLinecap="round"
          />
        ))}

        {linhas.map((c) => {
          const nome = nomeDaCidade(c.cidade_id).nome;
          return (
            <g key={`esq-${c.cidade_id}`}>
              <text x={0} y={yDaPosicao(c.posicaoBruta) - 2} className="fill-current text-[14px] font-bold">
                {c.posicaoBruta}º {nome}
              </text>
              <text x={0} y={yDaPosicao(c.posicaoBruta) + 13} className="fill-ink-2 text-[12px]">
                erra {formatarComUnidade(c.erroMedio, unidade, { casas: 2 })}
              </text>
            </g>
          );
        })}

        {linhas.map((c) => {
          const nome = nomeDaCidade(c.cidade_id).nome;
          return (
            <g key={`dir-${c.cidade_id}`}>
              <text x={LARGURA} y={yDaPosicao(c.posicaoJusta) - 2} textAnchor="end" className="fill-current text-[14px] font-bold">
                {nome} {c.posicaoJusta}º
              </text>
              <text x={LARGURA} y={yDaPosicao(c.posicaoJusta) + 13} textAnchor="end" className="fill-ink-2 text-[12px]">
                nota {formatarDecimal(c.nota, 0)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Legenda() {
  const itens = [
    { cor: COR.sobe, texto: "sobe ao descontar o clima" },
    { cor: COR.desce, texto: "desce" },
    { cor: COR.igual, texto: "fica igual" },
  ];
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-2">
      {itens.map((i) => (
        <li key={i.texto} className="flex items-center gap-2">
          <span aria-hidden="true" className="h-[3px] w-5 rounded-full" style={{ background: i.cor }} />
          {i.texto}
        </li>
      ))}
    </ul>
  );
}

/** Segunda parte: o ranking de erro bruto contra o ranking depois de descontar o clima de cada cidade. */
export function ErroBrutoEErroJusto({ ciencia }: { ciencia: Ciencia }) {
  return (
    <Secao titulo="Menor Erro × Maior Nota" dica={GLOSSARIO.erroJusto}>
      <p className="text-ink-2">À esquerda, quem tem o menor erro; à direita, a nota sobre o óbvio, de 0 a 100 (maior é melhor).</p>
      <Legenda />
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-3">
        {BLOCOS.map((b) => (
          <Comparacao key={b.chave} titulo={b.titulo} unidade={b.unidade} linhas={ciencia.constancia[b.chave]} />
        ))}
      </div>
    </Secao>
  );
}
