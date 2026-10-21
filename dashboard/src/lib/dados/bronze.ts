import "server-only";

import fs from "node:fs";
import path from "node:path";
import { lerRegistros, type RegistroBruto } from "@/lib/analise/gold";

/**
 * Histórico da coleta (JSON Lines), que o workflow diário acrescenta.
 * Por padrão fica em data/bronze/ na raiz do repositório;
 * CLIMATEMPO_DATA_PATH sobrescreve.
 */
export function caminhoDosDados(): string {
  return process.env.CLIMATEMPO_DATA_PATH
    ? path.resolve(process.env.CLIMATEMPO_DATA_PATH)
    : path.resolve(process.cwd(), "..", "data", "bronze", "previsoes.jsonl");
}

/** Lê o histórico da coleta, ou null se o arquivo não existir. */
export function lerColeta(caminho = caminhoDosDados()): RegistroBruto[] | null {
  if (!fs.existsSync(caminho)) return null;
  return lerRegistros(fs.readFileSync(caminho, "utf-8"));
}
