import { describe, expect, it } from "vitest";
import type { LinhaRanking } from "@/lib/analise";
import { nomeDaCidade } from "@/lib/cidades";
import type { Painel } from "@/lib/painel";
import { chapeu, linhaFina, manchete, textoDoDestaque } from "@/lib/textos";

function rankingDe(...cidades: string[]): LinhaRanking[] {
  return cidades.map((cidade_id, i) => ({
    cidade_id,
    n: 15,
    maeTemp: 0,
    scoreTemperatura: 0,
    scoreChuva: 0,
    scoreDescricao: 0,
    scoreFinal: 90 - i * 10,
  }));
}

function painel(extra: Partial<Painel>): Painel {
  return {
    cidade: "Todas",
    todas: true,
    linhasComparadas: 60,
    numCidades: 4,
    inicio: "2026-02-17",
    fim: "2026-03-06",
    temperaturaMax: { mae: 0.62, rmse: 0, bias: 0, mape: 0 },
    temperaturaMin: { mae: 0, rmse: 0, bias: 0, mape: 0 },
    chuva: { mae: 0, rmse: 0, bias: 0 },
    acuracia: { descricao: 0, chuvaBinaria: 0, volumeChuva: 29 },
    ranking: rankingDe("SAOPAULO-SP", "AMERICANA-SP", "RECIFE-PE", "PEDRA-PE"),
    scoreCidade: null,
    porCidade: null,
    graficos: {
      temperaturaMax: { unidade: "°C", series: [] },
      temperaturaMin: { unidade: "°C", series: [] },
      chuva: { unidade: "mm", series: [] },
    },
    destaquesChuva: [],
    base: [],
    ...extra,
  };
}

describe("nomeDaCidade", () => {
  it("reconstrói nomes legíveis a partir do id", () => {
    expect(nomeDaCidade("SAOPAULO-SP")).toEqual({ nome: "São Paulo", uf: "SP" });
    expect(nomeDaCidade("RECIFE-PE")).toEqual({ nome: "Recife", uf: "PE" });
    expect(nomeDaCidade("CAMPINA-GRANDE-PB")).toEqual({ nome: "Campina Grande", uf: "PB" });
    expect(nomeDaCidade("RIO-DE-JANEIRO-RJ")).toEqual({ nome: "Rio de Janeiro", uf: "RJ" });
  });
});

describe("manchete", () => {
  it("destaca a melhor cidade na visão geral", () => {
    expect(manchete(painel({}))).toBe("São Paulo teve a previsão mais confiável do período.");
  });

  it("diz a posição da cidade filtrada", () => {
    const filtro = { todas: false, numCidades: 1, linhasComparadas: 15 };
    expect(manchete(painel({ ...filtro, cidade: "SAOPAULO-SP" }))).toBe(
      "São Paulo teve a previsão mais confiável do período.",
    );
    expect(manchete(painel({ ...filtro, cidade: "RECIFE-PE" }))).toBe("Recife ficou em 3º lugar entre 4 cidades.");
    expect(manchete(painel({ ...filtro, cidade: "PEDRA-PE" }))).toBe(
      "Pedra teve a previsão menos confiável do período.",
    );
  });
});

describe("linhaFina", () => {
  const veredito = (maeMax: number, volume: number) =>
    linhaFina(
      painel({
        temperaturaMax: { mae: maeMax, rmse: 0, bias: 0, mape: 0 },
        acuracia: { descricao: 0, chuvaBinaria: 0, volumeChuva: volume },
      }),
    ).split("seguinte. ")[1];

  it("diz o que passa no teste conforme os dados", () => {
    expect(veredito(0.62, 29)).toBe("A temperatura passa no teste; o volume de chuva, não.");
    expect(veredito(0.62, 80)).toBe("Temperatura e volume de chuva passam no teste.");
    expect(veredito(2, 80)).toBe("O volume de chuva passa no teste; a temperatura, não.");
    expect(veredito(2, 29)).toBe("Nem a temperatura nem o volume de chuva passam no teste.");
    expect(veredito(0.62, Number.NaN)).toBe("A temperatura passa no teste.");
  });
});

describe("chapeu", () => {
  it("resume período, abrangência e volume de dados", () => {
    expect(chapeu(painel({}))).toBe("Fev–mar 2026 · 4 cidades · 60 previsões");
    expect(chapeu(painel({ todas: false, cidade: "RECIFE-PE", numCidades: 1, linhasComparadas: 15 }))).toBe(
      "Fev–mar 2026 · Recife/PE · 15 previsões",
    );
  });
});

describe("textoDoDestaque", () => {
  it("explica se choveu mais ou menos que o previsto", () => {
    expect(textoDoDestaque({ cidade_id: "RECIFE-PE", dia: "2026-03-01", erro: -49.6 })).toEqual({
      titulo: "Recife, 1 mar",
      texto: "choveu 49,6 mm a mais que o previsto",
    });
    expect(textoDoDestaque({ cidade_id: "PEDRA-PE", dia: "2026-02-25", erro: 9.1 }).texto).toBe(
      "choveu 9,1 mm a menos que o previsto",
    );
  });
});
