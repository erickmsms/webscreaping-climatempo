/**
 * Da coleta bruta (JSON Lines do Scrapy) às tabelas "dado do dia" e "previsão
 * para o dia seguinte". Substitui as camadas silver e gold do antigo projeto
 * dbt (última versão no commit 388077a), com uma diferença de propósito:
 * valores ilegíveis ("-" no lugar da temperatura, chuva vazia) viram ausentes
 * (`null`), e não zero, para não distorcer as métricas.
 */
import type { LinhaGoldDia, LinhaGoldPrevisao } from "@/lib/analise/comparacao";

/** Uma linha do JSON Lines, como o spider grava. */
export type RegistroBruto = {
  cidade: string;
  atualouprevisao: string;
  tmin: string | null;
  tmax: string | null;
  descricao: string | null;
  chuva: string | null;
  dt_ingest: string;
};

const DIA_MS = 86_400_000;

/** Lê o JSON Lines inteiro; uma linha inválida derruba a leitura, com o número da linha. */
export function lerRegistros(texto: string): RegistroBruto[] {
  const registros: RegistroBruto[] = [];
  texto.split("\n").forEach((linha, i) => {
    if (linha.trim() === "") return;
    let objeto: unknown;
    try {
      objeto = JSON.parse(linha);
    } catch {
      throw new Error(`JSON inválido na linha ${i + 1} dos dados brutos`);
    }
    const r = objeto as Partial<RegistroBruto>;
    if (typeof r.cidade !== "string" || typeof r.atualouprevisao !== "string" || typeof r.dt_ingest !== "string") {
      throw new Error(`Registro sem cidade, tipo ou dt_ingest na linha ${i + 1} dos dados brutos`);
    }
    registros.push({
      cidade: r.cidade,
      atualouprevisao: r.atualouprevisao,
      tmin: r.tmin ?? null,
      tmax: r.tmax ?? null,
      descricao: r.descricao ?? null,
      chuva: r.chuva ?? null,
      dt_ingest: r.dt_ingest,
    });
  });
  return registros;
}

/** "18°" -> 18; "-", vazio e texto inesperado -> null. */
export function lerTemperatura(texto: string | null): number | null {
  const m = /^\s*(-?\d+)\s*°?\s*$/.exec(texto ?? "");
  return m ? Number(m[1]) : null;
}

/** "1.0mm" -> 1; "-", vazio e texto inesperado -> null. */
export function lerChuva(texto: string | null): number | null {
  const m = /^\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*$/.exec(texto ?? "");
  return m ? Number(m[1]) : null;
}

const comparar = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function somarUmDia(data: string): string {
  return new Date(Date.parse(`${data}T00:00:00Z`) + DIA_MS).toISOString().slice(0, 10);
}

/**
 * Mantém uma leitura por cidade, tipo e dia (data UTC da coleta): a mais
 * recente. A ordem do resultado é a do antigo SQL: dia, tipo e cidade.
 */
function maisRecentePorDia(registros: RegistroBruto[]): RegistroBruto[] {
  const porChave = new Map<string, RegistroBruto>();
  for (const r of registros) {
    const chave = `${r.dt_ingest.slice(0, 10)}|${r.atualouprevisao}|${r.cidade}`;
    const atual = porChave.get(chave);
    if (!atual || r.dt_ingest > atual.dt_ingest) porChave.set(chave, r);
  }
  return [...porChave.entries()].sort(([a], [b]) => comparar(a, b)).map(([, r]) => r);
}

function limpar(r: RegistroBruto) {
  const temp_min = lerTemperatura(r.tmin);
  const temp_max = lerTemperatura(r.tmax);
  const descricao = r.descricao?.trim();
  return {
    cidade_id: r.cidade.toUpperCase(),
    temp_min,
    temp_max,
    clima_desc: descricao ? descricao : null,
    chuva_mm: lerChuva(r.chuva),
    data_coleta: r.dt_ingest.slice(0, 10),
    amplitude_termica: temp_min !== null && temp_max !== null ? temp_max - temp_min : null,
  };
}

export type TabelasGold = { dadosDia: LinhaGoldDia[]; previsoes: LinhaGoldPrevisao[] };

/** "atual" vira o dado do dia (HOJE); "previsao" vira a previsão para o dia seguinte (AMANHA). */
export function montarGold(registros: RegistroBruto[]): TabelasGold {
  const dadosDia: LinhaGoldDia[] = [];
  const previsoes: LinhaGoldPrevisao[] = [];
  for (const r of maisRecentePorDia(registros)) {
    const linha = limpar(r);
    if (r.atualouprevisao === "atual") dadosDia.push(linha);
    else previsoes.push({ ...linha, data_previsao: somarUmDia(linha.data_coleta) });
  }
  return { dadosDia, previsoes };
}
