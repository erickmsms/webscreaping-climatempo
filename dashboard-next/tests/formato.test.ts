import { describe, expect, it } from "vitest";
import { formatarFixo, formatarNumero } from "@/lib/formato";

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
