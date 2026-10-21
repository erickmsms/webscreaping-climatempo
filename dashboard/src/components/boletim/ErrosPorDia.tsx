"use client";

import { useState } from "react";
import { CorrelacaoDeErros } from "@/components/boletim/CorrelacaoDeErros";
import { GraficoLinhas } from "@/components/graficos/GraficoLinhas";
import { desenharSeries } from "@/components/graficos/series";
import { Secao } from "@/components/ui/Secao";
import { SeletorUnico } from "@/components/ui/SeletorUnico";
import type { Painel } from "@/lib/analise/painel";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";
import { textoDoDestaque } from "@/lib/apresentacao/textos";

/** Com a coluna de correlação ao lado, o gráfico cresce para ficar da altura dela. */
const ALTURA_COM_CORRELACAO = 394;

type Props = { painel: Painel; cores: Record<string, string> };

const VARIAVEIS = [
  { chave: "chuva", chip: "Chuva", rotulo: "Erro de chuva por dia", unidade: "mm", dica: GLOSSARIO.chuvaPorDia },
  {
    chave: "temperaturaMax",
    chip: "Temperatura máxima",
    rotulo: "Erro na temperatura máxima por dia",
    unidade: "°C",
    dica: GLOSSARIO.temperaturaPorDia,
  },
  {
    chave: "temperaturaMin",
    chip: "Temperatura mínima",
    rotulo: "Erro na temperatura mínima por dia",
    unidade: "°C",
    dica: GLOSSARIO.temperaturaPorDia,
  },
] as const;

type Variavel = (typeof VARIAVEIS)[number]["chave"];

const OPCOES = VARIAVEIS.map((v) => ({ valor: v.chave, rotulo: v.chip }));

/**
 * Erro por dia de uma variável à escolha (chuva ou temperatura), com os maiores erros de chuva anotados
 * no gráfico e, ao lado, a correlação entre as cidades. Trocar de variável só muda a escala: a altura fica.
 */
export function ErroPorDia({ painel, cores }: Props) {
  const [chave, setChave] = useState<Variavel>("chuva");
  const variavel = VARIAVEIS.find((v) => v.chave === chave) ?? VARIAVEIS[0];
  const anotacoes = chave === "chuva" ? painel.destaquesChuva : [];

  return (
    <Secao
      titulo={painel.destaquesChuva.length > 0 ? "Quando a previsão errou feio" : "Erro por dia"}
      dica={variavel.dica}
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <GraficoLinhas
            rotulo={variavel.rotulo}
            unidade={variavel.unidade}
            altura={painel.correlacoes ? ALTURA_COM_CORRELACAO : 300}
            acoes={<SeletorUnico rotulo="Erro" opcoes={OPCOES} valor={chave} aoEscolher={setChave} />}
            series={desenharSeries(painel.graficos[chave], painel.cidades[0], cores)}
            anotacoes={anotacoes.map((d) => ({
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
