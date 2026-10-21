/**
 * Paridade com o antigo dashboard Streamlit (removido).
 *
 * O gabarito (fixtures/streamlit-golden.json) é o que o dashboard/app.py exibia
 * para cada filtro de cidade, lendo fixtures/dataset_climatempo.db. Os dois
 * arquivos estão congelados: o app e o script que gerou o gabarito estão no
 * commit c8b6151 (dashboard/app.py e dashboard-next/scripts/).
 * Com o mesmo banco, este front precisa exibir exatamente o mesmo.
 */
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { montarComparacao, type LinhaComparada } from "@/lib/analise";
import { lerTabelasGold } from "@/lib/db";
import { montarPainel, opcoesDeCidade, type Painel } from "@/lib/painel";
import gabarito from "./fixtures/streamlit-golden.json";

type Valor = string | number | boolean | null;
type Tabela = { colunas: string[]; linhas: Valor[][] };
type Grafico = { titulo: string; series: Array<{ nome: string; x: Valor[]; y: Valor[] }> };
type Visao = { metricas: Array<{ rotulo: string; valor: string }>; tabelas: Tabela[]; graficos: Grafico[] };

const visoes = gabarito.visoes as Record<string, Visao>;

const BANCO_DO_GABARITO = fileURLToPath(new URL("./fixtures/dataset_climatempo.db", import.meta.url));

const tabelas = lerTabelasGold(BANCO_DO_GABARITO);
if (!tabelas) throw new Error(`banco do gabarito não encontrado: ${BANCO_DO_GABARITO}`);
const linhas = montarComparacao(tabelas.dadosDia, tabelas.previsoes);

/** Números iguais até ruído de ponto flutuante; NaN do JS equivale ao null do JSON. */
function expectValorIgual(obtido: Valor | undefined, esperado: Valor, onde: string) {
  if (typeof esperado === "number") {
    expect(typeof obtido, onde).toBe("number");
    expect(obtido as number, onde).toBeCloseTo(esperado, 9);
  } else if (esperado === null) {
    expect(obtido === null || Number.isNaN(obtido), onde).toBe(true);
  } else {
    expect(obtido, onde).toBe(esperado);
  }
}

function expectTabelaIgual(obtida: Record<string, Valor>[], esperada: Tabela, nome: string) {
  expect(obtida, nome).toHaveLength(esperada.linhas.length);
  esperada.linhas.forEach((linhaEsperada, i) => {
    esperada.colunas.forEach((coluna, j) => {
      expectValorIgual(obtida[i][coluna], linhaEsperada[j], `${nome}[${i}].${coluna}`);
    });
  });
}

function metricasNaOrdemDaTela(painel: Painel) {
  return [
    ...painel.geral,
    ...painel.temperaturaMax,
    ...painel.temperaturaMin,
    ...painel.chuva,
    ...painel.classificacao,
    ...(painel.ranking?.destaques ?? []),
    ...(painel.scoreCidade?.metricas ?? []),
  ];
}

const comoRegistro = (l: LinhaComparada) => l as unknown as Record<string, Valor>;

it("oferece as mesmas opções de cidade", () => {
  expect(opcoesDeCidade(linhas)).toEqual(gabarito.opcoes_cidade);
});

describe.each(gabarito.opcoes_cidade)("visão %s", (cidade) => {
  const esperado = visoes[cidade];
  const painel = montarPainel(linhas, cidade);
  if (!painel) throw new Error(`painel vazio para ${cidade}`);

  it("mostra as mesmas métricas, com os mesmos rótulos e valores", () => {
    expect(metricasNaOrdemDaTela(painel)).toEqual(esperado.metricas);
  });

  it("mostra as mesmas tabelas", () => {
    const [primeira, ...resto] = esperado.tabelas;
    if (painel.porCidade) {
      expectTabelaIgual(painel.porCidade, primeira, "métricas por cidade");
      const [base, ranking] = resto;
      expectTabelaIgual(painel.base.map(comoRegistro), base, "base comparada");
      expectTabelaIgual(
        painel.ranking!.linhas.map((r) => ({
          CidadeID: r.cidade_id,
          "Score Final": r.scoreFinal,
          "Score Temperatura": r.scoreTemperatura,
          "Score Chuva": r.scoreChuva,
          "Score Descrição": r.scoreDescricao,
        })),
        ranking,
        "ranking",
      );
    } else {
      expect(esperado.tabelas).toHaveLength(1);
      expectTabelaIgual(painel.base.map(comoRegistro), primeira, "base comparada");
    }
  });

  it("plota as mesmas séries nos gráficos de erro", () => {
    const linhasEsperadas = esperado.graficos.slice(0, 3);
    expect(painel.graficos.map((g) => g.titulo)).toEqual(linhasEsperadas.map((g) => g.titulo));

    painel.graficos.forEach((grafico, i) => {
      const seriesEsperadas = linhasEsperadas[i].series;
      expect(grafico.series.map((s) => s.nome).sort()).toEqual(seriesEsperadas.map((s) => s.nome).sort());
      for (const serieEsperada of seriesEsperadas) {
        const serie = grafico.series.find((s) => s.nome === serieEsperada.nome)!;
        expect(serie.pontos.map((p) => p.x), grafico.titulo).toEqual(serieEsperada.x);
        serie.pontos.forEach((p, k) =>
          expectValorIgual(p.y, serieEsperada.y[k], `${grafico.titulo} ${serie.nome}[${k}]`),
        );
      }
    });
  });

  it.runIf(cidade === "Todas")("plota o mesmo ranking", () => {
    const [barras] = esperado.graficos[3].series;
    expect(painel.ranking!.linhas.map((r) => r.cidade_id)).toEqual(barras.y);
    painel.ranking!.linhas.forEach((r, k) => expectValorIgual(r.scoreFinal, barras.x[k], `ranking[${k}]`));
  });
});
