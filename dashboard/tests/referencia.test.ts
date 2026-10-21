import { describe, expect, it } from "vitest";
import type { LinhaComparada } from "@/lib/analise/comparacao";
import { calcularReferencia } from "@/lib/analise/referencia";

function linha(dia: string, real: number, previsto: number, choveu: boolean, prevChoveu = choveu): LinhaComparada {
  return {
    cidade_id: "RECIFE-PE",
    dia_coleta_prev: dia,
    dia_previsto: dia,
    dia_real: dia,
    prev_temp_min: previsto - 5,
    real_temp_min: real - 5,
    erro_temp_min: previsto - real,
    prev_temp_max: previsto,
    real_temp_max: real,
    erro_temp_max: previsto - real,
    prev_chuva_mm: prevChoveu ? 1 : 0,
    real_chuva_mm: choveu ? 1 : 0,
    erro_chuva_mm: (prevChoveu ? 1 : 0) - (choveu ? 1 : 0),
    prev_amplitude_termica: null,
    real_amplitude_termica: null,
    erro_amp_termica: null,
    prev_clima_desc: null,
    real_clima_desc: null,
    real_choveu: choveu,
    prev_choveu: prevChoveu,
  };
}

describe("calcularReferencia", () => {
  const linhas = [
    linha("2026-03-01", 30, 30, true),
    linha("2026-03-02", 32, 31, true),
    linha("2026-03-03", 28, 28, false),
    linha("2026-03-04", 29, 30, true, false),
  ];

  it("compara 'amanhã = hoje' só nos dias com o dia anterior disponível", () => {
    const r = calcularReferencia(linhas);
    // previsão: erros 1, 0, 1 nos três dias com véspera; ingênuo: |30-32|, |32-28|, |28-29| = 2, 4, 1
    expect(r.temperaturaMax.previsao).toBeCloseTo(2 / 3);
    expect(r.temperaturaMax.ingenuo).toBeCloseTo(7 / 3);
  });

  it("usa o resultado mais comum como chute para 'choveu ou não'", () => {
    const r = calcularReferencia(linhas);
    expect(r.chuvaBinaria.diasComChuva).toBe(75);
    expect(r.chuvaBinaria.ingenuo).toBe(75);
    expect(r.chuvaBinaria.previsao).toBe(75);
  });

  it("não cruza cidades diferentes nem dias que não são consecutivos", () => {
    const outra = { ...linha("2026-03-02", 99, 99, false), cidade_id: "PEDRA-PE" };
    const r = calcularReferencia([linha("2026-03-01", 30, 30, true), outra, linha("2026-03-05", 20, 20, true)]);
    expect(Number.isNaN(r.temperaturaMax.ingenuo)).toBe(true);
  });
});

describe("calcularReferencia: dias de virada", () => {
  it("considera só os dias em que a máxima mudou 3 °C ou mais", () => {
    const dias = [
      linha("2026-03-01", 30, 30, false),
      linha("2026-03-02", 30, 29, false), // variação 0: não é virada
      linha("2026-03-03", 25, 26, false), // variação 5: é virada
    ];
    const { viradas } = calcularReferencia(dias);
    expect(viradas.dias).toBe(1);
    expect(viradas.previsao).toBe(1);
    expect(viradas.ingenuo).toBe(5);
  });
});
