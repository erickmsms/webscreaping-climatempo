"use client";

import { useMemo, useState } from "react";
import type { LinhaComparada } from "@/lib/analise/comparacao";
import type { MetricasCidade } from "@/lib/analise/metricas";
import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { coresPorCidade } from "@/lib/apresentacao/cores";
import { formatarPeriodo } from "@/lib/apresentacao/formato";
import { montarPainel, opcoesDeCidade, TODAS, type GraficoErro } from "@/lib/analise/painel";
import { chapeu, criterios, explicacaoScore, linhaFina, manchete, textoDoDestaque } from "@/lib/apresentacao/textos";
import { Aviso } from "@/components/ui/Aviso";
import { Cabecalho } from "@/components/boletim/Cabecalho";
import { GraficoLinhas, type SerieDesenho } from "@/components/graficos/GraficoLinhas";
import { NumerosPrincipais } from "@/components/boletim/NumerosPrincipais";
import { QuadroMetricas } from "@/components/boletim/QuadroMetricas";
import { Ranking } from "@/components/boletim/Ranking";
import { TabelaDados, type Coluna } from "@/components/ui/TabelaDados";

const REPOSITORIO = "https://github.com/erickmsms/webscreaping-climatempo";

const COLUNAS_POR_CIDADE: Coluna<MetricasCidade>[] = [
  { chave: "cidade_id", titulo: "Cidade", tipo: "cidade" },
  { chave: "n", titulo: "Dias", tipo: "numero" },
  { chave: "mae_temp_max", titulo: "Erro na máxima", tipo: "decimal", sufixo: "°C" },
  { chave: "rmse_temp_max", titulo: "RMSE máx", tipo: "decimal" },
  { chave: "mae_temp_min", titulo: "Erro na mínima", tipo: "decimal", sufixo: "°C" },
  { chave: "rmse_temp_min", titulo: "RMSE mín", tipo: "decimal" },
  { chave: "mae_chuva", titulo: "Erro na chuva", tipo: "decimal", sufixo: "mm" },
  { chave: "acc_chuva", titulo: "Acertou se choveria", tipo: "percentual" },
];

const COLUNAS_BASE: Coluna<LinhaComparada>[] = [
  { chave: "cidade_id", titulo: "Cidade", tipo: "cidade" },
  { chave: "dia_coleta_prev", titulo: "Previsto em", tipo: "data" },
  { chave: "dia_real", titulo: "Dia", tipo: "data" },
  { chave: "prev_temp_min", titulo: "Mín prevista", tipo: "numero", sufixo: "°C" },
  { chave: "real_temp_min", titulo: "Mín real", tipo: "numero", sufixo: "°C" },
  { chave: "erro_temp_min", titulo: "Erro mín", tipo: "numero", sinal: true },
  { chave: "prev_temp_max", titulo: "Máx prevista", tipo: "numero", sufixo: "°C" },
  { chave: "real_temp_max", titulo: "Máx real", tipo: "numero", sufixo: "°C" },
  { chave: "erro_temp_max", titulo: "Erro máx", tipo: "numero", sinal: true },
  { chave: "prev_chuva_mm", titulo: "Chuva prevista", tipo: "decimal", sufixo: "mm" },
  { chave: "real_chuva_mm", titulo: "Chuva real", tipo: "decimal", sufixo: "mm" },
  { chave: "erro_chuva_mm", titulo: "Erro chuva", tipo: "decimal", sinal: true },
  { chave: "prev_clima_desc", titulo: "Descrição prevista", tipo: "texto" },
  { chave: "real_clima_desc", titulo: "Descrição real", tipo: "texto" },
];

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-3xl font-bold tracking-[-0.015em]">{titulo}</h2>
      {descricao && <p className="mb-2 max-w-[47.5rem] text-ink-2">{descricao}</p>}
      {children}
    </section>
  );
}

export function Boletim({ linhas }: { linhas: LinhaComparada[] }) {
  const opcoes = useMemo(() => opcoesDeCidade(linhas), [linhas]);
  const cores = useMemo(() => coresPorCidade(opcoes.filter((o) => o !== TODAS)), [opcoes]);
  const [cidade, setCidade] = useState(TODAS);
  const painel = useMemo(() => montarPainel(linhas, cidade), [linhas, cidade]);

  // Na visão de uma cidade, a série vem sem nome: ela é a própria cidade filtrada.
  const desenhar = (g: GraficoErro): SerieDesenho[] =>
    g.series.map((s) => {
      const id = s.nome || cidade;
      return { nome: nomeDaCidade(id).nome, cor: cores[id], pontos: s.pontos };
    });

  return (
    <>
      <Cabecalho opcoes={opcoes} cidade={cidade} aoEscolher={setCidade} />
      <main className="mx-auto flex max-w-[70rem] flex-col gap-16 px-6 pt-14 pb-20">
        {!painel ? (
          <Aviso tipo="alerta">Sem dados para o filtro selecionado.</Aviso>
        ) : (
          <>
            <section className="flex max-w-[57.5rem] flex-col gap-5">
              <p className="text-[13px] font-semibold tracking-[0.08em] text-accent uppercase">{chapeu(painel)}</p>
              <h1 className="font-display text-4xl leading-[1.04] font-extrabold tracking-[-0.025em] sm:text-6xl">
                {manchete(painel)}
              </h1>
              <p className="max-w-[47.5rem] text-lg leading-relaxed text-ink-2 sm:text-xl">{linhaFina(painel)}</p>
            </section>

            <NumerosPrincipais painel={painel} />

            <Secao titulo="O ranking" descricao={explicacaoScore()}>
              <Ranking linhas={painel.ranking} cores={cores} selecionada={painel.todas ? undefined : painel.cidade} />
            </Secao>

            <Secao
              titulo={painel.destaquesChuva.length > 0 ? "Quando a previsão errou feio" : "Erro na chuva, dia a dia"}
              descricao="Erro de chuva por dia, em mm (previsto − real). Abaixo de zero, choveu mais do que o previsto."
            >
              <GraficoLinhas
                rotulo="Erro de chuva por dia"
                unidade="mm"
                altura={300}
                series={desenhar(painel.graficos.chuva)}
                anotacoes={painel.destaquesChuva.map((d) => ({
                  x: d.dia,
                  y: d.erro,
                  cor: cores[d.cidade_id],
                  ...textoDoDestaque(d),
                }))}
              />
            </Secao>

            <Secao
              titulo="Erro na temperatura, dia a dia"
              descricao="Previsto − real, em °C. Acima de zero, a previsão foi mais quente que o dia."
            >
              <div className="grid gap-10 lg:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="font-display text-lg font-bold">Máxima</h3>
                  <GraficoLinhas
                    rotulo="Erro na temperatura máxima por dia"
                    unidade="°C"
                    series={desenhar(painel.graficos.temperaturaMax)}
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="font-display text-lg font-bold">Mínima</h3>
                  <GraficoLinhas
                    rotulo="Erro na temperatura mínima por dia"
                    unidade="°C"
                    series={desenhar(painel.graficos.temperaturaMin)}
                  />
                </div>
              </div>
            </Secao>

            {painel.porCidade && (
              <Secao
                titulo="Cidade a cidade"
                descricao="Erros médios (MAE) e acerto de chuva em cada cidade, do maior para o menor erro na máxima."
              >
                <TabelaDados colunas={COLUNAS_POR_CIDADE} linhas={painel.porCidade} legenda="Métricas por cidade" />
              </Secao>
            )}

            <Secao titulo="Todas as métricas">
              <QuadroMetricas painel={painel} />
            </Secao>

            <details className="border-y border-rule">
              <summary className="flex min-h-11 cursor-pointer items-center py-4 font-display text-lg font-bold">
                Ver base comparada ({painel.base.length} linhas)
              </summary>
              <div className="pb-6">
                <TabelaDados colunas={COLUNAS_BASE} linhas={painel.base} legenda="Base comparada (D-1 → D)" rolagem />
              </div>
            </details>

            <section className="flex max-w-[51rem] flex-col gap-2.5 rounded-xl bg-surface p-7 leading-relaxed">
              <h2 className="font-display text-xl font-bold">Como medimos</h2>
              <p>
                Para cada cidade e dia, pegamos a previsão publicada na véspera (D-1) e comparamos com o registro do
                próprio Climatempo no dia (D). MAE é o erro médio absoluto; RMSE pesa mais os erros grandes; viés mostra
                se a previsão tende a errar para cima ou para baixo.
              </p>
              <p>{criterios()}</p>
              <p>
                <strong>Limitação:</strong> o “real” ainda é o registro do site, não uma medição de estação. Próxima
                etapa: comparar com as estações do INMET.
              </p>
            </section>

            <footer className="flex flex-wrap justify-between gap-2 border-t border-rule pt-5 text-[13px] text-muted">
              <span>
                Dados: coleta diária automatizada (Scrapy + GitHub Actions) · {formatarPeriodo(painel.inicio, painel.fim)}
              </span>
              <a className="text-accent underline-offset-4 hover:underline" href={REPOSITORIO}>
                Código no GitHub
              </a>
            </footer>
          </>
        )}
      </main>
    </>
  );
}
