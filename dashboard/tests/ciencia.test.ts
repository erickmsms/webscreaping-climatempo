import { describe, expect, it } from "vitest";
import { confiancaDaAmostra, correlacaoDePosto, relacaoDaCorrelacao } from "@/lib/analise/causas";
import type { LinhaComparada } from "@/lib/analise/comparacao";
import { constanciaPorCidade } from "@/lib/analise/constancia";
import {
  coberturaDaCidade,
  distanciaAoContornoKm,
  pesoDaEstacao,
  pontoNoMunicipio,
  raioEquivalenteKm,
  type Estacao,
  type Municipio,
} from "@/lib/analise/estacoes";
import { errosPorVariacao } from "@/lib/analise/variacao";

function linha(cidade: string, dia: string, real: number, previsto: number): LinhaComparada {
  return {
    cidade_id: cidade,
    dia_coleta_prev: dia,
    dia_previsto: dia,
    dia_real: dia,
    prev_temp_min: null,
    real_temp_min: null,
    erro_temp_min: null,
    prev_temp_max: previsto,
    real_temp_max: real,
    erro_temp_max: previsto - real,
    prev_chuva_mm: null,
    real_chuva_mm: null,
    erro_chuva_mm: null,
    prev_amplitude_termica: null,
    real_amplitude_termica: null,
    erro_amp_termica: null,
    prev_clima_desc: null,
    real_clima_desc: null,
    real_choveu: false,
    prev_choveu: false,
  };
}

describe("correlacaoDePosto", () => {
  it("vai de -1 a +1 e ignora a escala", () => {
    expect(correlacaoDePosto([1, 2, 3, 4], [10, 200, 3000, 40000])).toBeCloseTo(1);
    expect(correlacaoDePosto([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1);
  });

  it("devolve NaN com poucos casos ou sem variação", () => {
    expect(Number.isNaN(correlacaoDePosto([1, 2], [1, 2]))).toBe(true);
    expect(Number.isNaN(correlacaoDePosto([1, 1, 1], [1, 2, 3]))).toBe(true);
  });

  it("trata empates pela média dos postos", () => {
    expect(correlacaoDePosto([1, 1, 2, 3], [1, 2, 3, 4])).toBeGreaterThan(0.8);
  });
});

describe("relação e confiança", () => {
  it("classifica pelo tamanho da correlação e pela quantidade de casos", () => {
    expect(relacaoDaCorrelacao(-0.7)).toBe("forte");
    expect(relacaoDaCorrelacao(0.35)).toBe("moderada");
    expect(relacaoDaCorrelacao(0.2)).toBe("fraca");
    expect(relacaoDaCorrelacao(0.05)).toBe("nenhuma");
    expect(confiancaDaAmostra(4)).toBe("muito baixa");
    expect(confiancaDaAmostra(50)).toBe("baixa");
    expect(confiancaDaAmostra(900)).toBe("alta");
  });
});

describe("constanciaPorCidade", () => {
  // A: tempo muda 4 °C por dia e a previsão erra 1 °C. B: muda 1 °C por dia e erra 0,5 °C.
  const linhas = [
    linha("A", "2026-03-01", 20, 20),
    linha("A", "2026-03-02", 24, 23),
    linha("A", "2026-03-03", 20, 21),
    linha("B", "2026-03-01", 20, 20),
    linha("B", "2026-03-02", 21, 20.5),
    linha("B", "2026-03-03", 20, 20.5),
  ];
  const [a, b] = constanciaPorCidade(linhas, "temperaturaMax");

  it("mede o erro bruto e o quanto o clima muda", () => {
    expect(a.erroMedio).toBe(1);
    expect(a.variacaoMedia).toBe(4);
    expect(b.erroMedio).toBe(0.5);
    expect(b.variacaoMedia).toBe(1);
  });

  it("a nota vai de 0 a 100 e fica em 0 quando a previsão piora o óbvio", () => {
    expect(a.nota).toBe(75);
    expect(b.nota).toBe(50);
    const pior = constanciaPorCidade(
      [linha("C", "2026-03-01", 20, 20), linha("C", "2026-03-02", 21, 25), linha("C", "2026-03-03", 20, 25)],
      "temperaturaMax",
    )[0];
    expect(pior.ganho).toBeLessThan(0);
    expect(pior.nota).toBe(0);
  });

  it("o erro justo troca a posição de quem tem clima calmo", () => {
    expect(a.ganho).toBe(75);
    expect(b.ganho).toBe(50);
    expect([a.posicaoBruta, a.posicaoJusta]).toEqual([2, 1]);
    expect([b.posicaoBruta, b.posicaoJusta]).toEqual([1, 2]);
  });
});

describe("errosPorVariacao", () => {
  it("agrupa pelo tamanho da mudança em relação a ontem", () => {
    const faixas = errosPorVariacao(
      [linha("A", "2026-03-01", 20, 20), linha("A", "2026-03-02", 20.5, 20), linha("A", "2026-03-03", 26, 25)],
      "temperaturaMax",
    );
    expect(faixas.map((f) => f.dias)).toEqual([1, 0, 0, 0, 1]);
    expect(faixas[4].erroPorUnidade).toBeCloseTo(1 / 5.5);
  });
});

describe("estações", () => {
  // Quadrado de 0,2° x 0,2° (cerca de 22 km de lado) centrado em (0, 0).
  const municipio: Municipio = {
    cidade_id: "QUADRADO-XX",
    nome: "Quadrado",
    areaKm2: 490,
    geometria: {
      type: "Polygon",
      coordinates: [
        [
          [-0.1, -0.1],
          [0.1, -0.1],
          [0.1, 0.1],
          [-0.1, 0.1],
          [-0.1, -0.1],
        ],
      ],
    },
  };
  const estacao = (nome: string, latitude: number, longitude: number, situacao = "Operante"): Estacao => ({
    codigo: nome,
    nome,
    uf: "XX",
    latitude,
    longitude,
    altitude: null,
    situacao,
    inicio: null,
  });

  it("separa o que está dentro do contorno do que está fora", () => {
    expect(pontoNoMunicipio(0, 0, municipio.geometria)).toBe(true);
    expect(pontoNoMunicipio(0, 0.2, municipio.geometria)).toBe(false);
  });

  it("mede a distância de um ponto ao contorno", () => {
    expect(distanciaAoContornoKm(0, 0.2, municipio.geometria)).toBeCloseTo(11.1, 0);
    expect(distanciaAoContornoKm(0, 0, municipio.geometria)).toBeCloseTo(11.1, 0);
  });

  it("dá peso 1 a quem está dentro e menos a quem está fora, conforme o tamanho da cidade", () => {
    const raio = raioEquivalenteKm(490);
    expect(pesoDaEstacao(true, 0, raio)).toBe(1);
    expect(pesoDaEstacao(false, raio, raio)).toBeCloseTo(0.5);
    expect(pesoDaEstacao(false, 50, raio)).toBeLessThan(pesoDaEstacao(false, 10, raio));
    // A mesma distância pesa menos para uma cidade pequena.
    expect(pesoDaEstacao(false, 10, 5)).toBeLessThan(pesoDaEstacao(false, 10, 20));
  });

  it("conta as estações de dentro, as do entorno e as em pane, sem as muito longe", () => {
    const cobertura = coberturaDaCidade(municipio, [
      estacao("DENTRO", 0, 0),
      estacao("PANE", 0.05, 0.05, "Pane"),
      estacao("ENTORNO", 0, 0.2),
      estacao("LONGE", 0, 3),
    ]);
    expect(cobertura.dentro.map((e) => e.nome)).toEqual(["DENTRO"]);
    expect(cobertura.noEntorno.map((e) => e.nome)).toEqual(["ENTORNO"]);
    expect(cobertura.emPane).toBe(1);
    expect(cobertura.categoria).toBe("na cidade");
    expect(cobertura.indice).toBeGreaterThan(1);
    expect(cobertura.indice).toBeLessThan(2);
  });

  it("classifica a cidade sem estação dentro como só no entorno ou descoberta", () => {
    expect(coberturaDaCidade(municipio, [estacao("ENTORNO", 0, 0.2)]).categoria).toBe("só no entorno");
    const descoberta = coberturaDaCidade(municipio, [estacao("LONGE", 0, 3)]);
    expect(descoberta.categoria).toBe("descoberta");
    expect(descoberta.indice).toBeLessThan(0.1);
  });
});
