import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { CatalogoDeEstacoes } from "@/lib/analise/ciencia";
import type { Estacao } from "@/lib/analise/estacoes";

/**
 * Catálogo de estações do INMET perto das cidades (data/estacoes/inmet.json na raiz do repositório;
 * CLIMATEMPO_ESTACOES_PATH sobrescreve). O dashboard só lê o arquivo, não chama a API do INMET.
 */
export function caminhoDasEstacoes(): string {
  return process.env.CLIMATEMPO_ESTACOES_PATH
    ? path.resolve(process.env.CLIMATEMPO_ESTACOES_PATH)
    : path.resolve(process.cwd(), "..", "data", "estacoes", "inmet.json");
}

/** Lê o catálogo, ou null se o arquivo não existir ou estiver ilegível. */
export function lerEstacoes(caminho = caminhoDasEstacoes()): CatalogoDeEstacoes | null {
  if (!fs.existsSync(caminho)) return null;
  try {
    const bruto = JSON.parse(fs.readFileSync(caminho, "utf-8")) as { baixado_em?: string; estacoes?: Estacao[] };
    if (!Array.isArray(bruto.estacoes)) return null;
    return { baixadoEm: bruto.baixado_em ?? "", estacoes: bruto.estacoes };
  } catch {
    return null;
  }
}
