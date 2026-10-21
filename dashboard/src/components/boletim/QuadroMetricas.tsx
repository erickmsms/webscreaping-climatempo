import { formatarComUnidade, formatarDecimal, formatarPercentual } from "@/lib/apresentacao/formato";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";
import type { ErrosTemperatura, Painel } from "@/lib/analise/painel";
import { Termo } from "@/components/ui/Dica";

type Linha = { rotulo: string; valor: string; dica?: string };

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
    { rotulo: "Erro Médio", valor: formatarComUnidade(t.mae, "°C"), dica: GLOSSARIO.mae },
    { rotulo: "RMSE", valor: formatarComUnidade(t.rmse, "°C"), dica: GLOSSARIO.rmse },
    { rotulo: "Viés", valor: formatarComUnidade(t.bias, "°C", { sinal: true }), dica: GLOSSARIO.vies },
    {
      rotulo: "Erro Percentual",
      valor: Number.isNaN(t.mape) ? "—" : `${formatarDecimal(t.mape, 2)}%`,
      dica: GLOSSARIO.mape,
    },
  ];
}

/** Todas as métricas de erro e de acerto do filtro atual, cada termo com a sua explicação. */
export function QuadroMetricas({ painel }: { painel: Painel }) {
  return (
    <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
      <Grupo titulo="Temperatura Máxima" linhas={temperatura(painel.temperaturaMax)} />
      <Grupo titulo="Temperatura Mínima" linhas={temperatura(painel.temperaturaMin)} />
      <Grupo
        titulo="Chuva"
        linhas={[
          { rotulo: "Erro Médio", valor: formatarComUnidade(painel.chuva.mae, "mm"), dica: GLOSSARIO.mae },
          { rotulo: "RMSE", valor: formatarComUnidade(painel.chuva.rmse, "mm"), dica: GLOSSARIO.rmse },
          { rotulo: "Viés", valor: formatarComUnidade(painel.chuva.bias, "mm", { sinal: true }), dica: GLOSSARIO.vies },
        ]}
      />
      <Grupo
        titulo="Acertos"
        linhas={[
          {
            rotulo: "Descrição do Tempo",
            valor: formatarPercentual(painel.acuracia.descricao),
            dica: GLOSSARIO.acertoDescricao,
          },
          {
            rotulo: "Choveu ou Não",
            valor: formatarPercentual(painel.acuracia.chuvaBinaria),
            dica: GLOSSARIO.acertoChuva,
          },
          {
            rotulo: "Volume de Chuva",
            valor: formatarPercentual(painel.acuracia.volumeChuva),
            dica: GLOSSARIO.acertoVolume,
          },
        ]}
      />
    </div>
  );
}
