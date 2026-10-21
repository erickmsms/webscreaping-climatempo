export type NomeCidade = { nome: string; uf: string };

/**
 * O id vem da URL do Climatempo em caixa alta ("SAOPAULO-SP"), sem acento nem
 * espaço. Cidades cujo nome não dá para reconstruir a partir do id ficam aqui.
 */
const NOMES_CONHECIDOS: Record<string, string> = {
  SAOPAULO: "São Paulo",
};

const PALAVRAS_MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e"]);

/** "SAOPAULO-SP" -> { nome: "São Paulo", uf: "SP" }; "CAMPINA-GRANDE-PB" -> "Campina Grande". */
export function nomeDaCidade(id: string): NomeCidade {
  const m = /^(.+)-([A-Za-z]{2})$/.exec(id);
  const base = (m ? m[1] : id).toUpperCase();
  const uf = m ? m[2].toUpperCase() : "";
  const nome =
    NOMES_CONHECIDOS[base] ??
    base
      .toLowerCase()
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((p, i) => (i > 0 && PALAVRAS_MINUSCULAS.has(p) ? p : p[0].toUpperCase() + p.slice(1)))
      .join(" ");
  return { nome, uf };
}
