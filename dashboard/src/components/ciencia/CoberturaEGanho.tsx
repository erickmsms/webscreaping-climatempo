import { Termo } from "@/components/ui/Dica";
import type { Ciencia } from "@/lib/analise/ciencia";
import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { formatarDecimal } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";

const LARGURA = 420;
const ALTURA = 270;
const MARGEM = { esquerda: 58, direita: 24, topo: 20, base: 46 };
const AREA = {
  largura: LARGURA - MARGEM.esquerda - MARGEM.direita,
  altura: ALTURA - MARGEM.topo - MARGEM.base,
};

type Ponto = { cidade_id: string; indice: number; nota: number };

/** Maior meio-inteiro que cobre o maior índice (no mínimo 1). */
function limiteDoEixo(pontos: Ponto[]): number {
  const maior = Math.max(...pontos.map((p) => p.indice), 1);
  return Math.ceil(maior * 2) / 2;
}

/** Nota abaixo de zero ou acima de 100 fica presa na borda do gráfico. */
const limitar = (v: number) => Math.min(100, Math.max(0, v));

function Grafico({ titulo, pontos }: { titulo: string; pontos: Ponto[] }) {
  const maximo = limiteDoEixo(pontos);
  const x = (indice: number) => MARGEM.esquerda + (indice / maximo) * AREA.largura;
  const y = (nota: number) => MARGEM.topo + (1 - limitar(nota) / 100) * AREA.altura;
  const marcasX = Array.from({ length: maximo * 2 + 1 }, (_, i) => i / 2);
  const marcasY = [0, 25, 50, 75, 100];
  const descricao = `${titulo}: ${pontos
    .map(
      (p) =>
        `${nomeDaCidade(p.cidade_id).nome}, cobertura ${formatarDecimal(p.indice, 1)}, nota ${formatarDecimal(p.nota, 0)}`,
    )
    .join("; ")}.`;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h3 className="font-display text-lg font-bold">
        <Termo dica={GLOSSARIO.notaSobreObvio}>{titulo}</Termo>
      </h3>
      <svg role="img" aria-label={descricao} viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full text-ink">
        {marcasY.map((v) => (
          <g key={`y-${v}`}>
            <line x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={y(v)} y2={y(v)} stroke="var(--grid)" strokeWidth={1} />
            <text x={MARGEM.esquerda - 8} y={y(v) + 4} textAnchor="end" className="fill-muted text-[11px]">
              {v}
            </text>
          </g>
        ))}
        {marcasX.map((v) => (
          <text key={`x-${v}`} x={x(v)} y={ALTURA - MARGEM.base + 18} textAnchor="middle" className="fill-muted text-[11px]">
            {formatarDecimal(v, 1)}
          </text>
        ))}
        <line x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={y(0)} y2={y(0)} stroke="var(--axis)" strokeWidth={1.5} />
        <text x={MARGEM.esquerda + AREA.largura / 2} y={ALTURA - 6} textAnchor="middle" className="fill-ink-2 text-[12px]">
          índice de cobertura de estações
        </text>
        <text
          transform={`rotate(-90 14 ${MARGEM.topo + AREA.altura / 2})`}
          x={14}
          y={MARGEM.topo + AREA.altura / 2}
          textAnchor="middle"
          className="fill-ink-2 text-[12px]"
        >
          Nota
        </text>

        {pontos.map((p) => (
          <g key={p.cidade_id}>
            <circle cx={x(p.indice)} cy={y(p.nota)} r={7} fill="var(--accent)" stroke="var(--page)" strokeWidth={2} />
            <text x={x(p.indice)} y={y(p.nota) - 13} textAnchor="middle" className="fill-current text-[13px] font-bold">
              {nomeDaCidade(p.cidade_id).nome}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** A cobertura de estações no eixo X e a nota sobre o óbvio no eixo Y: um ponto por cidade. */
export function CoberturaEGanho({ ciencia }: { ciencia: Ciencia }) {
  const indice = new Map(ciencia.cobertura.map((c) => [c.cidade_id, c.indice]));
  const pontosDe = (variavel: "temperaturaMax" | "chuva"): Ponto[] =>
    ciencia.constancia[variavel]
      .map((c) => ({ cidade_id: c.cidade_id, indice: indice.get(c.cidade_id) ?? Number.NaN, nota: c.nota }))
      .filter((p) => !Number.isNaN(p.indice) && !Number.isNaN(p.nota));

  const maxima = pontosDe("temperaturaMax");
  const chuva = pontosDe("chuva");
  if (maxima.length === 0 && chuva.length === 0) return null;

  return (
    <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
      <Grafico titulo="Temperatura máxima" pontos={maxima} />
      <Grafico titulo="Chuva" pontos={chuva} />
    </div>
  );
}
