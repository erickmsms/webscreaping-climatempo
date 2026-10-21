import { Termo } from "@/components/ui/Dica";
import { Secao } from "@/components/ui/Secao";
import type { Painel } from "@/lib/analise/painel";
import { LIMIAR_VIRADA } from "@/lib/analise/referencia";
import { formatarComUnidade, formatarDecimal, formatarPercentual } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";

type Comparacao = {
  titulo: string;
  dica: string;
  previsao: number;
  ingenuo: number;
  /** Rótulo da referência, em linguagem simples. */
  rotuloIngenuo: string;
  formatar: (v: number) => string;
  /** Erro: menor é melhor. Acerto: maior é melhor. */
  menorEMelhor: boolean;
  veredito: string;
};

function comparacoes(painel: Painel): Comparacao[] {
  const { temperaturaMax, temperaturaMin, chuvaBinaria } = painel.referencia;
  const vezes = (a: number, b: number) => `${formatarDecimal(a / b, 1)}x`;
  const emC = (v: number) => formatarComUnidade(v, "°C");
  return [
    {
      titulo: "Temperatura máxima",
      dica: GLOSSARIO.referenciaTemperatura,
      ...temperaturaMax,
      rotuloIngenuo: "“Amanhã = hoje”",
      formatar: emC,
      menorEMelhor: true,
      veredito: `Erra ${vezes(temperaturaMax.ingenuo, temperaturaMax.previsao)} menos que repetir o dia de hoje.`,
    },
    {
      titulo: "Temperatura mínima",
      dica: GLOSSARIO.referenciaTemperatura,
      ...temperaturaMin,
      rotuloIngenuo: "“Amanhã = hoje”",
      formatar: emC,
      menorEMelhor: true,
      veredito: `Erra ${vezes(temperaturaMin.ingenuo, temperaturaMin.previsao)} menos que repetir o dia de hoje.`,
    },
    {
      titulo: "Choveu ou não",
      dica: GLOSSARIO.referenciaChuva,
      previsao: chuvaBinaria.previsao,
      ingenuo: chuvaBinaria.ingenuo,
      rotuloIngenuo: "Chutar o mais comum",
      formatar: formatarPercentual,
      menorEMelhor: false,
      veredito: `Choveu em ${formatarPercentual(chuvaBinaria.diasComChuva)} dos dias; chutar sempre o mais comum já acertaria ${formatarPercentual(chuvaBinaria.ingenuo)}.`,
    },
  ];
}

const largura = (v: number, maximo: number) => `${Math.min(100, Math.max(0, (v / maximo) * 100))}%`;

/** A previsão ao lado do que se acertaria sem previsão nenhuma: responde se ela agrega algo. */
export function MelhorQueOObvio({ painel }: { painel: Painel }) {
  return (
    <Secao titulo="Isso é bom de verdade?">
      <p className="max-w-[47.5rem] leading-relaxed text-ink-2">
        Um erro de meio grau só significa algo perto de uma referência. Comparamos a previsão com o que daria para
        acertar sem previsão nenhuma.
      </p>
      <div className="grid gap-px border-t-2 border-rule-strong lg:grid-cols-3">
        {comparacoes(painel).map((c) => {
          const maximo = c.menorEMelhor ? Math.max(c.previsao, c.ingenuo) : 100;
          return (
            <div key={c.titulo} className="flex flex-col gap-5 border-b border-rule py-7 lg:px-7 lg:first:pl-0 lg:last:pr-0">
              <h3 className="font-display text-lg font-bold">
                <Termo dica={c.dica}>{c.titulo}</Termo>
              </h3>
              <dl className="flex flex-col gap-4">
                <Barra rotulo="Previsão do Climatempo" valor={c.formatar(c.previsao)} largura={largura(c.previsao, maximo)} destaque />
                <Barra rotulo={c.rotuloIngenuo} valor={c.formatar(c.ingenuo)} largura={largura(c.ingenuo, maximo)} />
              </dl>
              <p className="text-sm leading-snug text-ink-2">{c.veredito}</p>
            </div>
          );
        })}
      </div>
    </Secao>
  );
}

function Barra({ rotulo, valor, largura, destaque = false }: { rotulo: string; valor: string; largura: string; destaque?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-sm text-ink-2">{rotulo}</dt>
        <dd className="font-display text-xl font-bold tabular-nums">{valor}</dd>
      </div>
      <div aria-hidden="true" className="h-3 rounded-r bg-track">
        <div className={`h-3 rounded-r ${destaque ? "bg-accent" : "bg-axis"}`} style={{ width: largura }} />
      </div>
    </div>
  );
}

/** O mesmo teste, só nos dias de virada de tempo, que é onde repetir o dia de hoje falha de vez. */
export function QuandoOTempoVira({ painel }: { painel: Painel }) {
  const { viradas } = painel.referencia;
  if (viradas.dias === 0) return null;
  const maximo = Math.max(viradas.previsao, viradas.ingenuo);

  return (
    <Secao titulo="E Quando o Tempo Vira?" dica={GLOSSARIO.viradas}>
      <p className="max-w-[47.5rem] leading-relaxed text-ink-2">
        Em {viradas.dias} dias a máxima mudou {LIMIAR_VIRADA} °C ou mais de um dia para o outro. É aí que repetir o dia de
        hoje falha de vez: a previsão erra {formatarComUnidade(viradas.previsao, "°C", { casas: 1 })}, contra{" "}
        {formatarComUnidade(viradas.ingenuo, "°C", { casas: 1 })} de “amanhã = hoje”.
      </p>
      <dl className="flex max-w-[47.5rem] flex-col gap-4 border-t-2 border-rule-strong pt-6">
        <Barra rotulo="Previsão do Climatempo" valor={formatarComUnidade(viradas.previsao, "°C")} largura={largura(viradas.previsao, maximo)} destaque />
        <Barra rotulo="“Amanhã = hoje”" valor={formatarComUnidade(viradas.ingenuo, "°C")} largura={largura(viradas.ingenuo, maximo)} />
      </dl>
    </Secao>
  );
}
