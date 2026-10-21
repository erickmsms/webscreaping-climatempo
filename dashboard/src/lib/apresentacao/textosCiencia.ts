/** Textos da aba "Ciência de Dados", gerados dos números para acompanhar os dados. */
import type { Fator } from "@/lib/analise/causas";
import type { Ciencia } from "@/lib/analise/ciencia";
import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { formatarDecimal, formatarMeses } from "@/lib/apresentacao/formato";

export function chapeuCiencia(c: Ciencia): string {
  return `${formatarMeses(c.inicio, c.fim)} · ${c.cidades.length} cidades · ${c.linhasComparadas} previsões`;
}

/** A conclusão principal: quem tem o menor erro nem sempre é quem mais agrega. */
export function mancheteCiencia(c: Ciencia): string {
  const cidades = c.constancia.temperaturaMax;
  const menorErro = cidades.find((x) => x.posicaoBruta === 1);
  const maiorGanho = cidades.find((x) => x.posicaoJusta === 1);
  if (!menorErro || !maiorGanho) return "O erro da previsão depende do clima de cada cidade.";
  const a = nomeDaCidade(menorErro.cidade_id).nome;
  const b = nomeDaCidade(maiorGanho.cidade_id).nome;
  return menorErro.cidade_id === maiorGanho.cidade_id
    ? `${a} lidera tanto no menor erro quanto no que a previsão agrega.`
    : `${a} tem o menor erro, mas é em ${b} que a previsão mais agrega.`;
}

export function linhaFinaCiencia(): string {
  return "Parte do erro vem do clima de cada cidade, não da previsão. Aqui separamos as duas coisas.";
}

const RELACAO = {
  forte: "relação forte",
  moderada: "relação moderada",
  fraca: "relação fraca",
  nenhuma: "sem relação clara",
} as const;

/** "relação forte"; com poucos casos, só "indício" dela. */
export function rotuloDaRelacao(f: Fator): string {
  if (f.confianca === "muito baixa" && f.relacao !== "nenhuma") return `indício de ${RELACAO[f.relacao]}`;
  return RELACAO[f.relacao];
}

/** O que a correlação quer dizer, em palavras. */
export function leituraDoFator(f: Fator): string {
  if (Number.isNaN(f.correlacao)) return "sem casos suficientes para comparar";
  if (f.relacao === "nenhuma") return "o erro quase não muda com isso";
  return f.correlacao > 0 ? "quanto maior, maior o erro" : "quanto maior, menor o erro";
}

/** Uma frase com o fator mais bem sustentado; sem ele, diz que nenhum se destaca. */
export function conclusaoDasCausas(fatores: Fator[]): string {
  const firme = fatores.find((f) => f.confianca === "alta" && f.relacao !== "nenhuma");
  if (!firme) return "Nenhum fator tem, ao mesmo tempo, amostra grande e relação clara com o erro.";
  return `Mais bem sustentado: ${firme.nome.toLowerCase()} (${formatarDecimal(firme.correlacao, 2, { sinal: true })} em ${firme.casos} ${firme.unidadeDosCasos}).`;
}

/** "SAO PAULO - MIRANTE" -> "Sao Paulo - Mirante" (o catálogo do INMET vem em caixa alta e sem acento). */
export function nomeDaEstacao(nome: string): string {
  return nome
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((p) => (p.length > 2 ? p[0].toUpperCase() + p.slice(1) : p))
    .join("");
}
