import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { montarComparacao } from "@/lib/analise/comparacao";
import { lerChuva, lerRegistros, lerTemperatura, montarGold, type RegistroBruto } from "@/lib/analise/gold";
import { CIDADES_EXIBIDAS, soCidadesExibidas } from "@/lib/apresentacao/cidades";

function registro(extra: Partial<RegistroBruto> = {}): RegistroBruto {
  return {
    cidade: "recife-pe",
    atualouprevisao: "atual",
    tmin: "24°",
    tmax: "31°",
    descricao: "\n   Sol com nuvens.\n  ",
    chuva: "1.5mm",
    dt_ingest: "2026-03-01T16:00:00+00:00",
    ...extra,
  };
}

describe("lerTemperatura e lerChuva", () => {
  it("leem os formatos do site", () => {
    expect(lerTemperatura("18°")).toBe(18);
    expect(lerTemperatura("-3°")).toBe(-3);
    expect(lerChuva("1.0mm")).toBe(1);
    expect(lerChuva("0.0mm")).toBe(0);
    expect(lerChuva("49.6mm")).toBe(49.6);
  });

  it("tratam o que o site às vezes devolve como ausente, não como zero", () => {
    expect(lerTemperatura("-")).toBeNull();
    expect(lerTemperatura("")).toBeNull();
    expect(lerTemperatura(null)).toBeNull();
    expect(lerChuva(null)).toBeNull();
    expect(lerChuva("-")).toBeNull();
    expect(lerChuva("sem dados")).toBeNull();
  });
});

describe("lerRegistros", () => {
  it("lê JSON Lines e ignora linhas em branco", () => {
    const texto = `${JSON.stringify(registro())}\n\n${JSON.stringify(registro({ cidade: "pedra-pe" }))}\n`;
    expect(lerRegistros(texto).map((r) => r.cidade)).toEqual(["recife-pe", "pedra-pe"]);
  });

  it("falha dizendo a linha quando o arquivo está corrompido", () => {
    expect(() => lerRegistros(`${JSON.stringify(registro())}\n{quebrado`)).toThrow("linha 2");
    expect(() => lerRegistros(JSON.stringify({ cidade: "x" }))).toThrow("linha 1");
  });
});

describe("montarGold", () => {
  it("separa o dado do dia (atual) da previsão para o dia seguinte", () => {
    const { dadosDia, previsoes } = montarGold([
      registro(),
      registro({ atualouprevisao: "previsao", tmin: "23°", tmax: "30°" }),
    ]);
    expect(dadosDia).toHaveLength(1);
    expect(previsoes).toHaveLength(1);
    expect(dadosDia[0]).toMatchObject({ cidade_id: "RECIFE-PE", temp_min: 24, temp_max: 31, chuva_mm: 1.5, amplitude_termica: 7 });
    expect(dadosDia[0].clima_desc).toBe("Sol com nuvens.");
    expect(previsoes[0]).toMatchObject({ data_coleta: "2026-03-01", data_previsao: "2026-03-02", amplitude_termica: 7 });
  });

  it("mantém só a leitura mais recente de cada cidade, tipo e dia", () => {
    const { dadosDia } = montarGold([
      registro({ dt_ingest: "2026-03-01T18:00:00+00:00", tmax: "33°" }),
      registro({ dt_ingest: "2026-03-01T16:00:00+00:00", tmax: "31°" }),
    ]);
    expect(dadosDia).toHaveLength(1);
    expect(dadosDia[0].temp_max).toBe(33);
  });

  it("vira o mês corretamente em data_previsao", () => {
    const { previsoes } = montarGold([registro({ atualouprevisao: "previsao", dt_ingest: "2026-02-28T16:00:00+00:00" })]);
    expect(previsoes[0].data_previsao).toBe("2026-03-01");
  });

  it("São Paulo com temperatura '-' (04/10) vira ausente e não distorce as métricas", () => {
    const { dadosDia, previsoes } = montarGold([
      registro({ cidade: "saopaulo-sp", tmin: "-", tmax: "-", dt_ingest: "2026-10-05T16:00:00+00:00" }),
      registro({ cidade: "saopaulo-sp", atualouprevisao: "previsao", dt_ingest: "2026-10-04T16:00:00+00:00", tmin: "-", tmax: "-" }),
    ]);
    expect(dadosDia[0]).toMatchObject({ temp_min: null, temp_max: null, amplitude_termica: null });
    const [par] = montarComparacao(dadosDia, previsoes);
    expect(par.erro_temp_max).toBeNull();
    expect(par.real_temp_max).toBeNull();
  });

  it("chuva vazia (29/09) vira ausente, não 0 mm", () => {
    const { dadosDia } = montarGold([registro({ chuva: null })]);
    expect(dadosDia[0].chuva_mm).toBeNull();
  });
});

describe("soCidadesExibidas", () => {
  it("deixa fora da tela as cidades que só a coleta guarda", () => {
    const registros = [registro(), registro({ cidade: "manaus-am" }), registro({ cidade: "saopaulo-sp" })];
    expect(soCidadesExibidas(registros).map((r) => r.cidade)).toEqual(["recife-pe", "saopaulo-sp"]);
  });
});

describe("histórico completo da coleta (data/bronze/previsoes.jsonl)", () => {
  const caminho = fileURLToPath(new URL("../../data/bronze/previsoes.jsonl", import.meta.url));
  const { dadosDia, previsoes } = montarGold(lerRegistros(fs.readFileSync(caminho, "utf-8")));
  const linhas = montarComparacao(dadosDia, previsoes);

  it("cobre meses de coleta, com as quatro cidades exibidas", () => {
    const cidades = [...new Set(linhas.map((l) => l.cidade_id))];
    expect(cidades).toEqual(expect.arrayContaining([...CIDADES_EXIBIDAS].map((c) => c.toUpperCase())));
    expect(linhas.length).toBeGreaterThan(200);
    expect(linhas[0].dia_real < "2026-03-01").toBe(true);
  });

  it("não tem nenhum par com data fora de ordem ou fora da regra D-1 -> D", () => {
    for (const l of linhas) {
      const antes = new Date(Date.parse(`${l.dia_real}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
      expect(l.dia_coleta_prev).toBe(antes);
    }
  });
});
