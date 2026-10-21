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

const MENOS = "−";

/**
 * Número no formato brasileiro, para a tela: vírgula decimal e sinal de menos
 * tipográfico, com o mesmo arredondamento do Python. `sinal` põe "+" nos
 * positivos (útil para erros e viés). Um valor que arredonda para zero sai sem sinal.
 */
export function formatarDecimal(v: number, casas: number, opcoes: { sinal?: boolean } = {}): string {
  if (Number.isNaN(v)) return "—";
  const texto = formatarFixo(v, casas).replace(".", ",");
  const absoluto = texto.replace("-", "");
  if (!/[1-9]/.test(absoluto)) return absoluto;
  if (texto.startsWith("-")) return `${MENOS}${absoluto}`;
  return opcoes.sinal ? `+${absoluto}` : absoluto;
}

/**
 * Número com unidade opcional ("0,62 °C", "+0,07 mm"): 2 casas por padrão,
 * `sinal` põe "+" nos positivos. Sem valor (NaN) sai só o travessão.
 */
export function formatarComUnidade(
  v: number,
  unidade?: string,
  opcoes: { casas?: number; sinal?: boolean } = {},
): string {
  const texto = formatarDecimal(v, opcoes.casas ?? 2, { sinal: opcoes.sinal });
  return unidade && !Number.isNaN(v) ? `${texto} ${unidade}` : texto;
}

/** Porcentagem com 1 casa ("91,7%"); 100 sai sem casa decimal ("100%"). */
export function formatarPercentual(v: number): string {
  if (Number.isNaN(v)) return "—";
  const texto = formatarDecimal(v, 1);
  return `${texto === "100,0" ? "100" : texto}%`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function partesDaData(data: string) {
  const [ano, mes, dia] = data.slice(0, 10).split("-").map(Number);
  return { ano, mes, dia };
}

/** "2026-03-01" -> "1 mar" (ou "1 mar 2026"). */
export function formatarDia(data: string, comAno = false): string {
  const { ano, mes, dia } = partesDaData(data);
  return `${dia} ${MESES[mes - 1]}${comAno ? ` ${ano}` : ""}`;
}

/** Intervalo de datas: "17 fev – 6 mar 2026"; o ano só se repete quando muda. */
export function formatarPeriodo(inicio: string, fim: string): string {
  if (inicio === fim) return formatarDia(fim, true);
  const mesmoAno = partesDaData(inicio).ano === partesDaData(fim).ano;
  return `${formatarDia(inicio, !mesmoAno)} – ${formatarDia(fim, true)}`;
}

/** Meses cobertos, para o chapéu: "Fev–mar 2026", "Mar 2026" ou "Dez 2025–jan 2026". */
export function formatarMeses(inicio: string, fim: string): string {
  const a = partesDaData(inicio);
  const b = partesDaData(fim);
  const capitular = (s: string) => s[0].toUpperCase() + s.slice(1);
  if (a.ano !== b.ano) return `${capitular(MESES[a.mes - 1])} ${a.ano}–${MESES[b.mes - 1]} ${b.ano}`;
  if (a.mes === b.mes) return `${capitular(MESES[a.mes - 1])} ${a.ano}`;
  return `${capitular(MESES[a.mes - 1])}–${MESES[b.mes - 1]} ${a.ano}`;
}
