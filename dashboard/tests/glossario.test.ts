import { describe, expect, it } from "vitest";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";

describe("glossário", () => {
  it("explica o score com os pesos e o limite que o cálculo usa", () => {
    expect(GLOSSARIO.score).toContain("50% temperatura");
    expect(GLOSSARIO.score).toContain("40% chuva");
    expect(GLOSSARIO.score).toContain("10% descrição");
    expect(GLOSSARIO.score).toContain("3 °C");
  });

  it("tem uma explicação não vazia e sem espaços sobrando para cada termo", () => {
    for (const [termo, texto] of Object.entries(GLOSSARIO)) {
      expect(texto.trim().length, termo).toBeGreaterThan(20);
      expect(texto, termo).toBe(texto.trim());
    }
  });
});
