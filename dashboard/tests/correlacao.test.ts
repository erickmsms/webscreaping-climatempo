import { describe, expect, it } from "vitest";
import type { LinhaComparada } from "@/lib/analise/comparacao";
import { matrizDeCorrelacao, MINIMO_DE_DIAS, pearson } from "@/lib/analise/correlacao";
import { leituraDaCorrelacao } from "@/lib/apresentacao/textos";

const dias = (n: number) => Array.from({ length: n }, (_, i) => `2026-03-${String(i + 1).padStart(2, "0")}`);

function erros(cidade: string, valores: Array<number | null>): LinhaComparada[] {
  return valores.map((v, i) => ({ cidade_id: cidade, dia_real: dias(valores.length)[i], erro_temp_max: v }) as LinhaComparada);
}

const base = Array.from({ length: 14 }, (_, i) => (i % 4) - 1.5);

describe("pearson", () => {
  it("dá +1 para erros iguais, −1 para opostos e 0 para independentes", () => {
    expect(pearson(base, base)).toBeCloseTo(1);
    expect(pearson(base, base.map((v) => -v))).toBeCloseTo(-1);
    expect(pearson([1, -1, 1, -1, 1, -1, 1, -1, 1, -1], [1, 1, -1, -1, 1, 1, -1, -1, 1, 1])).toBeCloseTo(0);
  });

  it("fica sem valor com poucos dias ou sem variação", () => {
    expect(pearson(base.slice(0, MINIMO_DE_DIAS - 1), base.slice(0, MINIMO_DE_DIAS - 1))).toBeNull();
    expect(pearson(base, base.map(() => 2))).toBeNull();
  });
});

describe("matrizDeCorrelacao", () => {
  const linhas = [
    ...erros("A-XX", base),
    ...erros("B-XX", base.map((v) => v * 2)),
    ...erros("C-XX", base.map((v) => -v)),
  ];

  it("monta a matriz simétrica, com 1 na diagonal e o índice como média dos pares", () => {
    const m = matrizDeCorrelacao(linhas, "erro_temp_max");
    expect(m.cidades).toEqual(["A-XX", "B-XX", "C-XX"]);
    expect(m.valores[0][0]).toBe(1);
    expect(m.valores[0][1]).toBeCloseTo(1);
    expect(m.valores[0][2]).toBeCloseTo(-1);
    expect(m.valores[2][0]).toBe(m.valores[0][2]);
    expect(m.indice).toBeCloseTo((1 - 1 - 1) / 3);
  });

  it("usa só os dias em que as duas cidades têm erro", () => {
    const m = matrizDeCorrelacao([...erros("A-XX", base), ...erros("B-XX", base.map((v, i) => (i < 3 ? null : v)))], "erro_temp_max");
    expect(m.valores[0][1]).toBeCloseTo(1);
    const curta = matrizDeCorrelacao([...erros("A-XX", base), ...erros("B-XX", base.map((v, i) => (i < 5 ? null : v)))], "erro_temp_max");
    expect(curta.valores[0][1]).toBeNull();
    expect(curta.indice).toBeNaN();
  });
});

describe("leituraDaCorrelacao", () => {
  it("traduz o índice em palavras", () => {
    expect(leituraDaCorrelacao(0.7)).toBe("as cidades tendem a errar juntas");
    expect(leituraDaCorrelacao(0.3)).toBe("as cidades erram junto só um pouco");
    expect(leituraDaCorrelacao(0.05)).toBe("os erros de uma cidade não dizem nada sobre os das outras");
    expect(leituraDaCorrelacao(-0.4)).toBe("as cidades tendem a errar em sentidos opostos");
    expect(leituraDaCorrelacao(Number.NaN)).toBe("sem dias suficientes para comparar");
  });
});
