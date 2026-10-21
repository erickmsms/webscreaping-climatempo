import { CorrelacaoDeErros } from "@/components/boletim/CorrelacaoDeErros";
import { GraficoLinhas } from "@/components/graficos/GraficoLinhas";
import { desenharSeries } from "@/components/graficos/series";
import { Secao } from "@/components/ui/Secao";
import type { Painel } from "@/lib/analise/painel";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";
import { textoDoDestaque } from "@/lib/apresentacao/textos";

type Props = { painel: Painel; cores: Record<string, string> };

/** Erro de chuva por dia, com os maiores erros anotados no gráfico e, ao lado, a correlação entre as cidades. */
export function ErroDeChuva({ painel, cores }: Props) {
  return (
    <Secao
      titulo={painel.destaquesChuva.length > 0 ? "Quando a previsão errou feio" : "Erro na chuva, dia a dia"}
      dica={GLOSSARIO.chuvaPorDia}
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <GraficoLinhas
            rotulo="Erro de chuva por dia"
            unidade="mm"
            altura={300}
            series={desenharSeries(painel.graficos.chuva, painel.cidades[0], cores)}
            anotacoes={painel.destaquesChuva.map((d) => ({
              x: d.dia,
              y: d.erro,
              cor: cores[d.cidade_id],
              ...textoDoDestaque(d),
            }))}
          />
        </div>
        {painel.correlacoes && <CorrelacaoDeErros correlacoes={painel.correlacoes} />}
      </div>
    </Secao>
  );
}

const TEMPERATURAS = [
  { titulo: "Máxima", rotulo: "Erro na temperatura máxima por dia", grafico: "temperaturaMax" },
  { titulo: "Mínima", rotulo: "Erro na temperatura mínima por dia", grafico: "temperaturaMin" },
] as const;

/** Erro de temperatura por dia: um gráfico para a máxima e outro para a mínima. */
export function ErroDeTemperatura({ painel, cores }: Props) {
  return (
    <Secao titulo="Erro na temperatura, dia a dia" dica={GLOSSARIO.temperaturaPorDia}>
      <div className="grid gap-10 lg:grid-cols-2">
        {TEMPERATURAS.map((t) => (
          <div key={t.grafico} className="flex min-w-0 flex-col gap-2">
            <h3 className="font-display text-lg font-bold">{t.titulo}</h3>
            <GraficoLinhas
              rotulo={t.rotulo}
              unidade="°C"
              series={desenharSeries(painel.graficos[t.grafico], painel.cidades[0], cores)}
            />
          </div>
        ))}
      </div>
    </Secao>
  );
}
