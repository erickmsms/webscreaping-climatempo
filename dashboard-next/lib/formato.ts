/**
 * Formata como o f"{v:.Nf}" do Python.
 *
 * O toFixed do JS desempata para longe do zero (1.125 -> "1.13"), enquanto o
 * Python desempata para o par (1.125 -> "1.12"). Empates exatos são comuns
 * aqui: as temperaturas são inteiras, então médias como 9/8 aparecem.
 */
export function formatarFixo(v: number, casas = 2): string {
  const curto = v.toFixed(casas);
  if (Object.is(v, -0)) return `-${curto}`;

  // toFixed com muitas casas devolve a expansão decimal exata do double.
  const exato = Math.abs(v).toFixed(Math.min(100, casas + 40));
  const ponto = exato.indexOf(".");
  const resto = exato.slice(ponto + 1 + casas);
  if (!/^50*$/.test(resto)) return curto;

  const truncado = exato.slice(0, casas === 0 ? ponto : ponto + 1 + casas);
  const ultimoDigito = Number(truncado.replace(".", "").slice(-1));
  if (ultimoDigito % 2 !== 0) return curto;
  return v < 0 ? `-${truncado}` : truncado;
}

/** Número com 2 casas e sufixo opcional; travessão quando não há valor (NaN). */
export function formatarNumero(v: number, sufixo = ""): string {
  if (Number.isNaN(v)) return "—";
  return `${formatarFixo(v, 2)}${sufixo}`;
}
