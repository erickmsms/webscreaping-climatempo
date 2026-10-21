import { describe, expect, it } from "vitest";
import { avisoDeChuva, errosPorFaixaDeChuva, totaisDeChuva } from "@/lib/analise/chuva";
import type { LinhaComparada } from "@/lib/analise/comparacao";

function linha(cidade: string, previsto: number | null, real: number | null): LinhaComparada {
  return {
    cidade_id: cidade,
    dia_coleta_prev: "2026-03-01",
    dia_previsto: "2026-03-02",
    dia_real: "2026-03-02",
    prev_temp_min: null,
    real_temp_min: null,
    erro_temp_min: null,
    prev_temp_max: null,
    real_temp_max: null,
    erro_temp_max: null,
    prev_chuva_mm: previsto,
    real_chuva_mm: real,
    erro_chuva_mm: previsto === null || real === null ? null : previsto - real,
    prev_amplitude_termica: null,
    real_amplitude_termica: null,
    erro_amp_termica: null,
    prev_clima_desc: null,
    real_clima_desc: null,
    real_choveu: (real ?? 0) > 0,
    prev_choveu: (previsto ?? 0) > 0,
  };
}

describe("avisoDeChuva", () => {
  it("separa acertos, surpresas e alarmes falsos", () => {
    const aviso = avisoDeChuva([linha("A", 2, 3), linha("A", 0, 0), linha("A", 0, 5), linha("A", 4, 0), linha("A", 1, 0)]);
    expect(aviso).toEqual({ acertos: 2, surpresas: 1, alarmesFalsos: 2, total: 5 });
  });
});

describe("errosPorFaixaDeChuva", () => {
  const faixas = errosPorFaixaDeChuva([linha("A", 1, 1.5), linha("A", 10, 20), linha("A", 10, 40), linha("A", 5, 0)]);

  it("agrupa pelo quanto choveu de verdade, só nos dias de chuva", () => {
    expect(faixas.map((f) => f.dias)).toEqual([1, 0, 1, 1]);
  });

  it("mostra que a previsão fica aquém nos temporais", () => {
    const forte = faixas.find((f) => f.id === "forte");
    expect(forte?.vies).toBe(-30);
    expect(forte?.mae).toBe(30);
  });
});

describe("totaisDeChuva", () => {
  it("soma o previsto e o real por cidade, ignorando dias sem leitura", () => {
    const totais = totaisDeChuva([linha("B", 10, 4), linha("B", 2, 8), linha("B", null, 9), linha("A", 1, 1)]);
    expect(totais.map((t) => t.cidade_id)).toEqual(["A", "B"]);
    expect(totais[1]).toMatchObject({ dias: 2, previsto: 12, real: 12, maePorDia: 6 });
  });
});
