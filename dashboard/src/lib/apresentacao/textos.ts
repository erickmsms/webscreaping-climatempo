/**
 * Textos do boletim gerados a partir dos números do painel, para que a
 * manchete e as conclusões acompanhem os dados em vez de ficarem fixas.
 */
import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { formatarDecimal, formatarDia, formatarMeses } from "@/lib/apresentacao/formato";
import type { Destaque, Painel } from "@/lib/analise/painel";

/** Linha acima da manchete: "Fev–mar 2026 · 4 cidades · 60 previsões". */
export function chapeu(p: Painel): string {
  const unica = nomeDaCidade(p.cidades[0]);
  const onde = p.varias ? `${p.numCidades} cidades` : `${unica.nome}/${unica.uf}`;
  return `${formatarMeses(p.inicio, p.fim)} · ${onde} · ${p.linhasComparadas} previsões`;
}

/** A conclusão principal, em uma frase. */
export function manchete(p: Painel): string {
  if (p.varias) {
    const melhor = p.ranking.find((r) => p.cidades.includes(r.cidade_id)) ?? p.ranking[0];
    const onde = p.numCidades < p.ranking.length ? "entre as cidades selecionadas" : "do período";
    return `${nomeDaCidade(melhor.cidade_id).nome} teve a previsão mais confiável ${onde}.`;
  }

  const cidade = p.cidades[0];
  const nome = nomeDaCidade(cidade).nome;
  const posicao = p.ranking.findIndex((r) => r.cidade_id === cidade) + 1;
  const total = p.ranking.length;
  if (posicao === 1) return `${nome} teve a previsão mais confiável do período.`;
  if (posicao === total) return `${nome} teve a previsão menos confiável do período.`;
  return `${nome} ficou em ${posicao}º lugar entre ${total} cidades.`;
}

/** Uma frase que explica o que o boletim compara. */
export function linhaFina(): string {
  return "Comparamos cada previsão que o Climatempo fez na véspera com o que o próprio site registrou no dia seguinte.";
}

/** Em palavras, o que um índice de correlação entre erros quer dizer. */
export function leituraDaCorrelacao(indice: number): string {
  if (Number.isNaN(indice)) return "sem dias suficientes para comparar";
  if (indice >= 0.5) return "as cidades tendem a errar juntas";
  if (indice >= 0.2) return "as cidades erram junto só um pouco";
  if (indice > -0.2) return "os erros de uma cidade não dizem nada sobre os das outras";
  return "as cidades tendem a errar em sentidos opostos";
}

/** Anotação de um destaque: "Recife, 1 mar" / "choveu 49,6 mm a mais que o previsto". */
export function textoDoDestaque(d: Destaque): { titulo: string; texto: string } {
  const quanto = formatarDecimal(Math.abs(d.erro), 1);
  return {
    titulo: `${nomeDaCidade(d.cidade_id).nome}, ${formatarDia(d.dia)}`,
    texto:
      d.erro < 0
        ? `choveu ${quanto} mm a mais que o previsto`
        : `choveu ${quanto} mm a menos que o previsto`,
  };
}
