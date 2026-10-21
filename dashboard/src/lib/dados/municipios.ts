import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { Geometria, Municipio } from "@/lib/analise/estacoes";

/**
 * Área e contorno dos municípios do dashboard, vindos do IBGE (data/estacoes/municipios.json na raiz do
 * repositório; CLIMATEMPO_MUNICIPIOS_PATH sobrescreve). O dashboard só lê o arquivo, não chama a API do IBGE.
 */
export function caminhoDosMunicipios(): string {
  return process.env.CLIMATEMPO_MUNICIPIOS_PATH
    ? path.resolve(process.env.CLIMATEMPO_MUNICIPIOS_PATH)
    : path.resolve(process.cwd(), "..", "data", "estacoes", "municipios.json");
}

type MunicipioBruto = { cidade_id: string; nome: string; area_km2: number; geometria: Geometria };

/** Lê os municípios, ou uma lista vazia se o arquivo não existir ou estiver ilegível. */
export function lerMunicipios(caminho = caminhoDosMunicipios()): Municipio[] {
  if (!fs.existsSync(caminho)) return [];
  try {
    const bruto = JSON.parse(fs.readFileSync(caminho, "utf-8")) as { municipios?: MunicipioBruto[] };
    return (bruto.municipios ?? []).map((m) => ({
      cidade_id: m.cidade_id,
      nome: m.nome,
      areaKm2: m.area_km2,
      geometria: m.geometria,
    }));
  } catch {
    return [];
  }
}
