const CORES_CATEGORICAS = 8;

/**
 * Cor fixa de cada cidade: a N-ésima cidade em ordem alfabética usa a cor N,
 * independente do filtro. A paleta tem 8 cores validadas; uma 9ª cidade cai
 * no cinza neutro em vez de repetir uma cor.
 */
export function coresPorCidade(cidades: string[]): Record<string, string> {
  return Object.fromEntries(
    cidades.map((cidade, i) => [
      cidade,
      i < CORES_CATEGORICAS ? `var(--series-${i + 1})` : "var(--muted)",
    ]),
  );
}
