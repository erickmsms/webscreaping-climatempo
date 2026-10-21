import { formatarDecimal, formatarPercentual } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";
import type { ErrosTemperatura, Painel } from "@/lib/analise/painel";
import { Termo } from "@/components/ui/Dica";

type Linha = { rotulo: string; valor: string; dica?: string };

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
            <dt className="text-ink-2">{l.dica ? <Termo dica={l.dica}>{l.rotulo}</Termo> : l.rotulo}</dt>
            <dd className="font-medium tabular-nums">{l.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function temperatura(t: ErrosTemperatura): Linha[] {
  return [
    { rotulo: "Erro médio (MAE)", valor: comUnidade(t.mae, "°C"), dica: GLOSSARIO.mae },
    { rotulo: "RMSE", valor: comUnidade(t.rmse, "°C"), dica: GLOSSARIO.rmse },
    { rotulo: "Viés", valor: comUnidade(t.bias, "°C", true), dica: GLOSSARIO.vies },
    {
      rotulo: "Erro percentual (MAPE)",
      valor: Number.isNaN(t.mape) ? "—" : `${formatarDecimal(t.mape, 2)}%`,
      dica: GLOSSARIO.mape,
    },
  ];
}

/** Todas as métricas de erro e de acerto do filtro atual, cada termo com a sua explicação. */
export function QuadroMetricas({ painel }: { painel: Painel }) {
  return (
    <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
      <Grupo titulo="Temperatura máxima" linhas={temperatura(painel.temperaturaMax)} />
      <Grupo titulo="Temperatura mínima" linhas={temperatura(painel.temperaturaMin)} />
      <Grupo
        titulo="Chuva"
        linhas={[
          { rotulo: "Erro médio (MAE)", valor: comUnidade(painel.chuva.mae, "mm"), dica: GLOSSARIO.mae },
          { rotulo: "RMSE", valor: comUnidade(painel.chuva.rmse, "mm"), dica: GLOSSARIO.rmse },
          { rotulo: "Viés", valor: comUnidade(painel.chuva.bias, "mm", true), dica: GLOSSARIO.vies },
        ]}
      />
      <Grupo
        titulo="Acertos"
        linhas={[
          {
            rotulo: "Descrição do tempo",
            valor: formatarPercentual(painel.acuracia.descricao),
            dica: GLOSSARIO.acertoDescricao,
          },
          {
            rotulo: "Choveu ou não",
            valor: formatarPercentual(painel.acuracia.chuvaBinaria),
            dica: GLOSSARIO.acertoChuva,
          },
          {
            rotulo: "Volume de chuva",
            valor: formatarPercentual(painel.acuracia.volumeChuva),
            dica: GLOSSARIO.acertoVolume,
          },
        ]}
      />
    </div>
  );
}
