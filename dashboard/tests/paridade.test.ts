/**
 * Paridade com o antigo dashboard Streamlit (removido).
 *
 * O gabarito (fixtures/streamlit-golden.json) é o que o dashboard/app.py exibia
 * para cada filtro de cidade, a partir da coleta em fixtures/bronze.jsonl
 * (processada pelo dbt e lida do SQLite). Os dois arquivos estão congelados: o
 * app e o script que gerou o gabarito estão no commit c8b6151, e o dbt no
 * commit 388077a. Aqui a coleta passa pela gold em TypeScript, o que também
 * prova que ela equivale ao dbt.
 *
 * A tela atual tem outro visual e outros rótulos, então o teste reconstrói, a
 * partir do modelo numérico, o que o Streamlit mostrava (mesmos rótulos, 2
 * casas e arredondamento do Python) e exige que seja idêntico ao gabarito.
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { montarComparacao, type LinhaComparada } from "@/lib/analise/comparacao";
import { lerRegistros, montarGold } from "@/lib/analise/gold";
import { formatarFixo, formatarNumero } from "@/lib/apresentacao/formato";
import { montarPainel, opcoesDeCidade, type ErrosTemperatura, type Painel } from "@/lib/analise/painel";
import gabarito from "./fixtures/streamlit-golden.json";

type Valor = string | number | boolean | null;
type Tabela = { colunas: string[]; linhas: Valor[][] };
type Grafico = { titulo: string; series: Array<{ nome: string; x: Valor[]; y: Valor[] }> };
type Visao = { metricas: Array<{ rotulo: string; valor: string }>; tabelas: Tabela[]; graficos: Grafico[] };

const visoes = gabarito.visoes as Record<string, Visao>;

const COLETA_DO_GABARITO = fileURLToPath(new URL("./fixtures/bronze.jsonl", import.meta.url));

const { dadosDia, previsoes } = montarGold(lerRegistros(fs.readFileSync(COLETA_DO_GABARITO, "utf-8")));
const linhas = montarComparacao(dadosDia, previsoes);

/** As métricas na ordem, com os rótulos e o formato do app Streamlit. */
function comoOStreamlitExibia(p: Painel) {
  const n = (v: number) => formatarNumero(v);
  const pct = (v: number) => formatarNumero(v, "%");
  const temperatura = (t: ErrosTemperatura) => [
    { rotulo: "MAE", valor: n(t.mae) },
    { rotulo: "RMSE", valor: n(t.rmse) },
    { rotulo: "Bias", valor: n(t.bias) },
    { rotulo: "MAPE", valor: pct(t.mape) },
  ];
  const metricas = [
    { rotulo: "Linhas comparadas", valor: String(p.linhasComparadas) },
    { rotulo: "Cidades", valor: String(p.numCidades) },
    { rotulo: "Primeira data", valor: p.inicio },
    { rotulo: "Última data", valor: p.fim },
    ...temperatura(p.temperaturaMax),
    ...temperatura(p.temperaturaMin),
    { rotulo: "MAE", valor: n(p.chuva.mae) },
    { rotulo: "RMSE", valor: n(p.chuva.rmse) },
    { rotulo: "Bias", valor: n(p.chuva.bias) },
    { rotulo: "✅ Acurácia: Descrição do Clima", valor: pct(p.acuracia.descricao) },
    { rotulo: "🌧️ Acurácia: Choveu vs Não", valor: pct(p.acuracia.chuvaBinaria) },
    { rotulo: "🎯 Acurácia % Volume Chuva", valor: pct(p.acuracia.volumeChuva) },
  ];
  if (p.todas) {
    metricas.push(
      { rotulo: "🥇 Cidade #1", valor: p.ranking[0].cidade_id },
      { rotulo: "⭐ Score #1", valor: formatarFixo(p.ranking[0].scoreFinal, 2) },
      { rotulo: "📌 Cidades no ranking", valor: String(p.ranking.length) },
    );
  } else {
    const score = p.scoreCidade!;
    metricas.push(
      { rotulo: "Cidade", valor: p.cidade },
      { rotulo: "Score Final", valor: n(score.scoreFinal) },
      { rotulo: "Score Temperatura", valor: n(score.scoreTemperatura) },
      { rotulo: "Score Chuva", valor: n(score.scoreChuva) },
    );
  }
  return metricas;
}

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

const comoRegistro = (l: LinhaComparada) => l as unknown as Record<string, Valor>;

it("oferece as mesmas opções de cidade", () => {
  expect(opcoesDeCidade(linhas)).toEqual(gabarito.opcoes_cidade);
});

describe.each(gabarito.opcoes_cidade)("visão %s", (cidade) => {
  const esperado = visoes[cidade];
  const painel = montarPainel(linhas, cidade);
  if (!painel) throw new Error(`painel vazio para ${cidade}`);

  it("tem as mesmas métricas, com o mesmo arredondamento", () => {
    expect(comoOStreamlitExibia(painel)).toEqual(esperado.metricas);
  });

  it("tem as mesmas tabelas", () => {
    const [primeira, ...resto] = esperado.tabelas;
    if (painel.porCidade) {
      expectTabelaIgual(painel.porCidade, primeira, "métricas por cidade");
      const [base, ranking] = resto;
      expectTabelaIgual(painel.base.map(comoRegistro), base, "base comparada");
      expectTabelaIgual(
        painel.ranking.map((r) => ({
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
    const { temperaturaMax, temperaturaMin, chuva } = painel.graficos;
    [temperaturaMax, temperaturaMin, chuva].forEach((grafico, i) => {
      const { titulo, series: seriesEsperadas } = esperado.graficos[i];
      expect(grafico.series.map((s) => s.nome).sort(), titulo).toEqual(seriesEsperadas.map((s) => s.nome).sort());
      for (const serieEsperada of seriesEsperadas) {
        const serie = grafico.series.find((s) => s.nome === serieEsperada.nome)!;
        expect(serie.pontos.map((p) => p.x), titulo).toEqual(serieEsperada.x);
        serie.pontos.forEach((p, k) => expectValorIgual(p.y, serieEsperada.y[k], `${titulo} ${serie.nome}[${k}]`));
      }
    });
  });

  it.runIf(cidade === "Todas")("plota o mesmo ranking", () => {
    const [barras] = esperado.graficos[3].series;
    expect(painel.ranking.map((r) => r.cidade_id)).toEqual(barras.y);
    painel.ranking.forEach((r, k) => expectValorIgual(r.scoreFinal, barras.x[k], `ranking[${k}]`));
  });
});
