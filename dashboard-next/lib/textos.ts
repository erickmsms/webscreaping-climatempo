/**
 * Textos do boletim gerados a partir dos números do painel, para que a
 * manchete e as conclusões acompanhem os dados em vez de ficarem fixas.
 */
import { PESO_CHUVA, PESO_DESCRICAO, PESO_TEMPERATURA } from "./analise";
import { nomeDaCidade } from "./cidades";
import { formatarDecimal, formatarDia, formatarMeses } from "./formato";
import type { Destaque, Painel } from "./painel";

/** A temperatura "passa no teste" com erro médio na máxima de até 1 °C. */
export const ERRO_MAXIMO_TEMPERATURA_OK = 1;
/** O volume de chuva "passa no teste" com pelo menos 50% de acerto. */
export const ACERTO_MINIMO_VOLUME_OK = 50;

const pct = (peso: number) => Math.trunc(peso * 100);

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

/** Explica o método e diz o que passa no teste (critérios nas constantes acima). */
export function linhaFina(p: Painel): string {
  const metodo =
    "Comparamos cada previsão que o Climatempo fez na véspera com o que o próprio site registrou no dia seguinte.";
  const temperaturaOk = p.temperaturaMax.mae <= ERRO_MAXIMO_TEMPERATURA_OK;
  const volume = p.acuracia.volumeChuva;

  if (Number.isNaN(volume)) {
    return `${metodo} ${temperaturaOk ? "A temperatura passa no teste." : "A temperatura não passa no teste."}`;
  }
  const chuvaOk = volume >= ACERTO_MINIMO_VOLUME_OK;
  if (temperaturaOk && chuvaOk) return `${metodo} Temperatura e volume de chuva passam no teste.`;
  if (temperaturaOk) return `${metodo} A temperatura passa no teste; o volume de chuva, não.`;
  if (chuvaOk) return `${metodo} O volume de chuva passa no teste; a temperatura, não.`;
  return `${metodo} Nem a temperatura nem o volume de chuva passam no teste.`;
}

/** "Score de 0 a 100: 50% temperatura, 40% chuva e 10% descrição do tempo." */
export function explicacaoScore(): string {
  return (
    `Score de 0 a 100: ${pct(PESO_TEMPERATURA)}% temperatura, ` +
    `${pct(PESO_CHUVA)}% chuva e ${pct(PESO_DESCRICAO)}% descrição do tempo.`
  );
}

/** Critérios usados na linha fina, para a seção "Como medimos". */
export function criterios(): string {
  return (
    `Consideramos que a temperatura passa no teste com erro médio de até ` +
    `${formatarDecimal(ERRO_MAXIMO_TEMPERATURA_OK, 0)} °C na máxima, e o volume de chuva ` +
    `com pelo menos ${ACERTO_MINIMO_VOLUME_OK}% de acerto.`
  );
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
