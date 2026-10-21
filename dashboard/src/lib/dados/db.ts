import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { LinhaGoldDia, LinhaGoldPrevisao } from "@/lib/analise/comparacao";

/**
 * Banco com as tabelas gold geradas pelo dbt.
 * Por padrão fica em data/ na raiz do repositório; CLIMATEMPO_DB_PATH sobrescreve.
 */
export function caminhoDoBanco(): string {
  return process.env.CLIMATEMPO_DB_PATH
    ? path.resolve(process.env.CLIMATEMPO_DB_PATH)
    : path.resolve(process.cwd(), "..", "data", "dataset_climatempo.db");
}

export type TabelasGold = {
  dadosDia: LinhaGoldDia[];
  previsoes: LinhaGoldPrevisao[];
};

/** Lê as duas tabelas gold, ou null se o banco não existir. */
export function lerTabelasGold(caminho = caminhoDoBanco()): TabelasGold | null {
  if (!fs.existsSync(caminho)) return null;

  const db = new Database(caminho, { readonly: true, fileMustExist: true });
  try {
    return {
      dadosDia: db.prepare(`SELECT * FROM "gold_climatempo_dadosdia"`).all() as LinhaGoldDia[],
      previsoes: db.prepare(`SELECT * FROM "gold_climatempo_previsoes"`).all() as LinhaGoldPrevisao[],
    };
  } finally {
    db.close();
  }
}
