/**
 * Explicações dos termos do boletim, mostradas em tooltips ao lado de cada um.
 * Os números (pesos do score, limites do "passa no teste") vêm das mesmas
 * constantes que o cálculo usa, então o texto não fica desatualizado.
 */
import { LIMITE_TEMPERATURA, PESO_CHUVA, PESO_DESCRICAO, PESO_TEMPERATURA } from "@/lib/analise/metricas";
import { formatarDecimal } from "@/lib/apresentacao/formato";

const pct = (peso: number) => Math.trunc(peso * 100);

export const GLOSSARIO = {
  mae:
    "Erro médio: quanto a previsão errou, em média, por dia, sem importar se foi para mais ou para menos. " +
    "Quanto menor, melhor. Um erro médio de 0,6 °C quer dizer que, em média, a previsão errou 0,6 °C.",

  rmse:
    "Parecido com o erro médio, mas os erros grandes pesam mais. Se o RMSE é bem maior que o erro médio, " +
    "há poucos dias com erros muito grandes puxando o número para cima.",

  vies:
    "Para que lado a previsão tende a errar. Acima de zero: costuma superestimar (prever mais quente ou mais chuva " +
    "do que aconteceu). Abaixo de zero: costuma subestimar. Perto de zero: os erros para mais e para menos se compensam.",

  mape:
    "Erro percentual: o tamanho do erro em relação ao valor real. Um erro percentual de 2% na máxima quer dizer que a previsão " +
    "errou, em média, 2% do valor da temperatura. Não conta os dias em que o valor real foi zero.",

  acertoChuva:
    "Em quantos por cento dos dias a previsão acertou se ia chover ou não, sem olhar a quantidade de chuva.",

  acertoVolume:
    "Quão perto ficou o volume de chuva previsto do que realmente choveu. Só conta os dias em que choveu. " +
    "É a medida mais difícil: 100% seria acertar a quantidade exata.",

  acertoDescricao:
    "Em quantos por cento dos dias o texto da previsão (por exemplo, “Sol com nuvens”) foi exatamente igual ao " +
    "registrado. É exigente: uma palavra diferente já conta como erro.",

  score:
    `Nota de 0 a 100 que resume a qualidade da previsão de cada cidade: ${pct(PESO_TEMPERATURA)}% temperatura, ` +
    `${pct(PESO_CHUVA)}% chuva e ${pct(PESO_DESCRICAO)}% descrição do tempo. Na temperatura, um erro médio de ` +
    `${formatarDecimal(LIMITE_TEMPERATURA, 0)} °C ou mais zera a nota.`,

  chuvaPorDia:
    "Erro de chuva por dia, em mm (previsto − real). Abaixo de zero, choveu mais do que o previsto. " +
    "Os maiores erros ficam anotados no gráfico.",

  temperaturaPorDia:
    "Previsto − real, em °C. Acima de zero, a previsão foi mais quente que o dia; abaixo, mais fria.",

  porCidade:
    "Erro médio e acerto de chuva em cada cidade, do maior para o menor erro na máxima.",

  dias: "Quantos dias de previsão foram comparados nesta cidade.",
} as const;
