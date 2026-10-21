import { formatarDecimal, formatarPercentual } from "@/lib/apresentacao/formato";
import type { ErrosTemperatura, Painel } from "@/lib/analise/painel";

type Linha = { rotulo: string; valor: string };

function comUnidade(v: number, unidade: string, sinal = false) {
  return Number.isNaN(v) ? "—" : `${formatarDecimal(v, 2, { sinal })} ${unidade}`;
}

function Grupo({ titulo, linhas }: { titulo: string; linhas: Linha[] }) {
  return (
    <div>
      <h3 className="border-b-2 border-rule-strong pb-2 font-display text-base font-bold">{titulo}</h3>
      <dl>
        {linhas.map((l) => (
          <div key={l.rotulo} className="flex justify-between gap-4 border-b border-rule py-2.5 text-[15px]">
            <dt className="text-ink-2">{l.rotulo}</dt>
            <dd className="font-medium tabular-nums">{l.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function temperatura(t: ErrosTemperatura): Linha[] {
  return [
    { rotulo: "Erro médio (MAE)", valor: comUnidade(t.mae, "°C") },
    { rotulo: "RMSE", valor: comUnidade(t.rmse, "°C") },
    { rotulo: "Viés", valor: comUnidade(t.bias, "°C", true) },
    { rotulo: "Erro percentual (MAPE)", valor: Number.isNaN(t.mape) ? "—" : `${formatarDecimal(t.mape, 2)}%` },
  ];
}

/** Todas as métricas de erro e de acerto do filtro atual. */
export function QuadroMetricas({ painel }: { painel: Painel }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
        <Grupo titulo="Temperatura máxima" linhas={temperatura(painel.temperaturaMax)} />
        <Grupo titulo="Temperatura mínima" linhas={temperatura(painel.temperaturaMin)} />
        <Grupo
          titulo="Chuva"
          linhas={[
            { rotulo: "Erro médio (MAE)", valor: comUnidade(painel.chuva.mae, "mm") },
            { rotulo: "RMSE", valor: comUnidade(painel.chuva.rmse, "mm") },
            { rotulo: "Viés", valor: comUnidade(painel.chuva.bias, "mm", true) },
          ]}
        />
        <Grupo
          titulo="Acertos"
          linhas={[
            { rotulo: "Descrição do tempo", valor: formatarPercentual(painel.acuracia.descricao) },
            { rotulo: "Choveu ou não", valor: formatarPercentual(painel.acuracia.chuvaBinaria) },
            { rotulo: "Volume de chuva", valor: formatarPercentual(painel.acuracia.volumeChuva) },
          ]}
        />
      </div>
      <p className="text-sm text-muted">
        Viés acima de zero: a previsão superestima; abaixo, subestima. O acerto de volume só considera os dias em que
        choveu, e o de descrição exige o texto idêntico.
      </p>
    </div>
  );
}
