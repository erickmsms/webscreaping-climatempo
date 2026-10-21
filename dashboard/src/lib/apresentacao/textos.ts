/**
 * Textos do boletim gerados a partir dos números do painel, para que a
 * manchete e as conclusões acompanhem os dados em vez de ficarem fixas.
 */
import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import { formatarDecimal, formatarDia, formatarMeses } from "@/lib/apresentacao/formato";
import type { Destaque, Painel } from "@/lib/analise/painel";

/** Linha acima da manchete: "Fev–mar 2026 · 4 cidades · 60 previsões". */
export function chapeu(p: Painel): string {
  const onde = p.todas
    ? `${p.numCidades} ${p.numCidades === 1 ? "cidade" : "cidades"}`
    : `${nomeDaCidade(p.cidade).nome}/${nomeDaCidade(p.cidade).uf}`;
  return `${formatarMeses(p.inicio, p.fim)} · ${onde} · ${p.linhasComparadas} previsões`;
}

/** A conclusão principal, em uma frase. */
export function manchete(p: Painel): string {
  if (p.todas) return `${nomeDaCidade(p.ranking[0].cidade_id).nome} teve a previsão mais confiável do período.`;

  const nome = nomeDaCidade(p.cidade).nome;
  const posicao = p.ranking.findIndex((r) => r.cidade_id === p.cidade) + 1;
  const total = p.ranking.length;
  if (posicao === 1) return `${nome} teve a previsão mais confiável do período.`;
  if (posicao === total) return `${nome} teve a previsão menos confiável do período.`;
  return `${nome} ficou em ${posicao}º lugar entre ${total} cidades.`;
}

/** Uma frase que explica o que o boletim compara. */
export function linhaFina(): string {
  return "Comparamos cada previsão que o Climatempo fez na véspera com o que o próprio site registrou no dia seguinte.";
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
