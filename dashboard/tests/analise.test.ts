import { describe, expect, it } from "vitest";
import {
  montarComparacao,
  paraData,
  type LinhaComparada,
  type LinhaGoldDia,
  type LinhaGoldPrevisao,
} from "@/lib/analise/comparacao";
import { acuraciaVolumeChuva, calcularScore, mae, mape, rankingPorCidade, rmse } from "@/lib/analise/metricas";

function dia(cidade: string, data: string, extra: Partial<LinhaGoldDia> = {}): LinhaGoldDia {
  return {
    cidade_id: cidade,
    temp_min: 20,
    temp_max: 30,
    clima_desc: "Sol",
    chuva_mm: 0,
    data_coleta: data,
    amplitude_termica: 10,
    ...extra,
  };
}

function previsao(
  cidade: string,
  coleta: string,
  previsto: string,
  extra: Partial<LinhaGoldPrevisao> = {},
): LinhaGoldPrevisao {
  return { ...dia(cidade, coleta), data_previsao: previsto, ...extra };
}

function linha(extra: Partial<LinhaComparada>): LinhaComparada {
  return {
    cidade_id: "RECIFE-PE",
    dia_coleta_prev: "2026-02-16",
    dia_previsto: "2026-02-17",
    dia_real: "2026-02-17",
    prev_temp_min: 20,
    real_temp_min: 20,
    erro_temp_min: 0,
    prev_temp_max: 30,
    real_temp_max: 30,
    erro_temp_max: 0,
    prev_chuva_mm: 0,
    real_chuva_mm: 0,
    erro_chuva_mm: 0,
    prev_amplitude_termica: 10,
    real_amplitude_termica: 10,
    erro_amp_termica: 0,
    prev_clima_desc: "Sol",
    real_clima_desc: "Sol",
    real_choveu: false,
    prev_choveu: false,
    ...extra,
  };
}

describe("paraData", () => {
  it("aceita AAAA-MM-DD e rejeita datas inválidas", () => {
    expect(paraData("2026-02-17")).toBe("2026-02-17");
    expect(paraData("2026-02-17 00:00:00")).toBe("2026-02-17");
    expect(paraData("2026-02-30")).toBeNull();
    expect(paraData("ontem")).toBeNull();
    expect(paraData(null)).toBeNull();
  });
});

describe("montarComparacao", () => {
  it("cruza a previsão de D-1 com o real de D na mesma cidade", () => {
    const linhas = montarComparacao(
      [dia("RECIFE-PE", "2026-02-17", { temp_max: 31, chuva_mm: 2 })],
      [previsao("RECIFE-PE", "2026-02-16", "2026-02-17", { temp_max: 33 })],
    );
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({
      dia_coleta_prev: "2026-02-16",
      dia_real: "2026-02-17",
      erro_temp_max: 2,
      real_choveu: true,
      prev_choveu: false,
    });
  });

  it("ignora outra cidade, data sem real e previsão que não é de D-1", () => {
    const linhas = montarComparacao(
      [dia("RECIFE-PE", "2026-02-17")],
      [
        previsao("PEDRA-PE", "2026-02-16", "2026-02-17"),
        previsao("RECIFE-PE", "2026-02-17", "2026-02-18"),
        previsao("RECIFE-PE", "2026-02-15", "2026-02-17"),
      ],
    );
    expect(linhas).toHaveLength(0);
  });

  it("descarta linhas sem cidade ou com data inválida e propaga ausentes", () => {
    const linhas = montarComparacao(
      [dia("RECIFE-PE", "2026-02-17", { temp_min: null }), dia("", "lixo")],
      [previsao("RECIFE-PE", "2026-02-16", "2026-02-17"), previsao(null as never, "2026-02-16", "2026-02-17")],
    );
    expect(linhas).toHaveLength(1);
    expect(linhas[0].erro_temp_min).toBeNull();
  });
});

describe("métricas de erro", () => {
  it("ignoram ausentes e devolvem NaN sem dados", () => {
    expect(mae([1, -3, null])).toBe(2);
    expect(rmse([3, -4])).toBeCloseTo(Math.sqrt(12.5));
    expect(mae([])).toBeNaN();
    expect(mae([null])).toBeNaN();
  });

  it("MAPE pula real igual a zero", () => {
    expect(mape([11, 5], [10, 0])).toBeCloseTo(10);
    expect(mape([5], [0])).toBeNaN();
  });

  it("acurácia de volume só considera dias com chuva real", () => {
    expect(acuraciaVolumeChuva([linha({ real_chuva_mm: 0, prev_chuva_mm: 9 })])).toBeNaN();
    expect(
      acuraciaVolumeChuva([
        linha({ real_chuva_mm: 10, prev_chuva_mm: 8 }),
        linha({ real_chuva_mm: 0, prev_chuva_mm: 9 }),
      ]),
    ).toBeCloseTo(80);
  });
});

describe("score composto", () => {
  it("zera a temperatura com MAE no limite e pondera 50/33/17 (chuva/temperatura/descrição)", () => {
    const score = calcularScore([
      linha({ erro_temp_max: 3, erro_temp_min: -3, real_chuva_mm: 0, prev_chuva_mm: 0 }),
    ]);
    expect(score.scoreTemperatura).toBe(0);
    expect(score.scoreChuva).toBe(100);
    expect(score.scoreDescricao).toBe(100);
    expect(score.scoreFinal).toBeCloseTo(100 * (3 / 6 + 1 / 6));
  });

  it("ordena o ranking do maior score para o menor", () => {
    const ranking = rankingPorCidade([
      linha({ cidade_id: "A", erro_temp_max: 3, erro_temp_min: 3 }),
      linha({ cidade_id: "B" }),
    ]);
    expect(ranking.map((r) => r.cidade_id)).toEqual(["B", "A"]);
  });
});
