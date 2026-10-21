import { describe, expect, it } from "vitest";
import {
  formatarDecimal,
  formatarComUnidade,
  formatarDia,
  formatarFixo,
  formatarMeses,
  formatarNumero,
  formatarPercentual,
  formatarPeriodo,
} from "@/lib/apresentacao/formato";

describe("formatarFixo", () => {
  // Valores esperados conferidos com f"{v:.2f}" no Python.
  it.each([
    [1.125, "1.12"],
    [1.375, "1.38"],
    [0.125, "0.12"],
    [2.675, "2.67"],
    [-1.125, "-1.12"],
    [-0.125, "-0.12"],
    [0.005, "0.01"],
    [1.005, "1.00"],
    [12.5, "12.50"],
    [-0.001, "-0.00"],
    [0, "0.00"],
    [-0, "-0.00"],
    [82.43865118850192, "82.44"],
  ])("formata %s como o Python (%s)", (valor, esperado) => {
    expect(formatarFixo(valor, 2)).toBe(esperado);
  });

  it("desempata para o par com zero casas", () => {
    expect(formatarFixo(2.5, 0)).toBe("2");
    expect(formatarFixo(3.5, 0)).toBe("4");
  });
});

describe("formatarNumero", () => {
  it("mostra travessão para NaN, como o fmt_num", () => {
    expect(formatarNumero(Number.NaN)).toBe("—");
    expect(formatarNumero(Number.NaN, "%")).toBe("—");
  });

  it("aplica o sufixo", () => {
    expect(formatarNumero(45, "%")).toBe("45.00%");
  });

  // Os dados atuais não têm empates exatos, então o teste de paridade não pega isso.
  it("desempata como o Python mesmo com sufixo", () => {
    expect(formatarNumero(9 / 8)).toBe("1.12");
    expect(formatarNumero(-9 / 8, "%")).toBe("-1.12%");
  });
});

describe("formatarDecimal", () => {
  it("usa vírgula, sinal de menos tipográfico e o arredondamento do Python", () => {
    expect(formatarDecimal(0.62, 2)).toBe("0,62");
    expect(formatarDecimal(-0.1, 2)).toBe("−0,10");
    expect(formatarDecimal(9 / 8, 2)).toBe("1,12");
    expect(formatarDecimal(91.66666, 1)).toBe("91,7");
    expect(formatarDecimal(100, 0)).toBe("100");
  });

  it("põe + nos positivos só quando pedido", () => {
    expect(formatarDecimal(0.22, 2, { sinal: true })).toBe("+0,22");
    expect(formatarDecimal(0.22, 2)).toBe("0,22");
  });

  it("não põe sinal em valor que arredonda para zero", () => {
    expect(formatarDecimal(-0.001, 2)).toBe("0,00");
    expect(formatarDecimal(0.001, 2, { sinal: true })).toBe("0,00");
    expect(formatarDecimal(0, 0, { sinal: true })).toBe("0");
  });

  it("mostra travessão para NaN", () => {
    expect(formatarDecimal(Number.NaN, 1)).toBe("—");
  });
});

describe("formatarComUnidade", () => {
  it("junta número e unidade, com 2 casas por padrão", () => {
    expect(formatarComUnidade(0.62, "°C")).toBe("0,62 °C");
    expect(formatarComUnidade(4.994, "mm")).toBe("4,99 mm");
  });

  it("aceita casas, sinal e unidade opcional", () => {
    expect(formatarComUnidade(0.074, "°C", { sinal: true })).toBe("+0,07 °C");
    expect(formatarComUnidade(-0.44, "mm", { sinal: true })).toBe("−0,44 mm");
    expect(formatarComUnidade(3, undefined, { casas: 0 })).toBe("3");
    expect(formatarComUnidade(20, "°C", { casas: 0 })).toBe("20 °C");
  });

  it("sem valor sai só o travessão, sem unidade", () => {
    expect(formatarComUnidade(Number.NaN, "°C")).toBe("—");
  });
});

describe("formatarPercentual", () => {
  it("usa 1 casa, exceto em 100%", () => {
    expect(formatarPercentual(45)).toBe("45,0%");
    expect(formatarPercentual(91.66666)).toBe("91,7%");
    expect(formatarPercentual(100)).toBe("100%");
    expect(formatarPercentual(Number.NaN)).toBe("—");
  });
});

describe("datas", () => {
  it("formata dia e período em português", () => {
    expect(formatarDia("2026-03-01")).toBe("1 mar");
    expect(formatarDia("2026-02-17", true)).toBe("17 fev 2026");
    expect(formatarPeriodo("2026-02-17", "2026-03-06")).toBe("17 fev – 6 mar 2026");
    expect(formatarPeriodo("2025-12-28", "2026-01-06")).toBe("28 dez 2025 – 6 jan 2026");
    expect(formatarPeriodo("2026-03-06", "2026-03-06")).toBe("6 mar 2026");
  });

  it("resume os meses cobertos", () => {
    expect(formatarMeses("2026-02-17", "2026-03-06")).toBe("Fev–mar 2026");
    expect(formatarMeses("2026-03-01", "2026-03-06")).toBe("Mar 2026");
    expect(formatarMeses("2025-12-28", "2026-01-06")).toBe("Dez 2025–jan 2026");
  });
});
