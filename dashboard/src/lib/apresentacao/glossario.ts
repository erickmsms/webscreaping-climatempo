/**
 * Explicações dos termos do boletim, mostradas em tooltips ao lado de cada um.
 * Os números (pesos do score e limite de temperatura) vêm das mesmas
 * constantes que o cálculo usa, então o texto não fica desatualizado.
 */
import { LIMITE_TEMPERATURA, PESO_CHUVA, PESO_DESCRICAO, PESO_TEMPERATURA } from "@/lib/analise/metricas";
import { formatarDecimal } from "@/lib/apresentacao/formato";

const pct = (peso: number) => Math.round(peso * 100);

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
    `Nota de 0 a 100 que resume a qualidade da previsão de cada cidade: ${pct(PESO_CHUVA)}% chuva, ` +
    `${pct(PESO_TEMPERATURA)}% temperatura e ${pct(PESO_DESCRICAO)}% descrição do tempo. ` +
    "Os pesos seguem a ordem de importância que estudos sobre o uso de previsões apontam (chuva, depois temperatura, " +
    "depois descrição) e foram calculados pelo método rank-sum. " +
    `Na temperatura, um erro médio de ${formatarDecimal(LIMITE_TEMPERATURA, 0)} °C ou mais zera a nota.`,

  chuvaPorDia:
    "Erro de chuva por dia, em mm (previsto − real). Abaixo de zero, choveu mais do que o previsto. " +
    "Os maiores erros ficam anotados no gráfico.",

  temperaturaPorDia:
    "Previsto − real, em °C. Acima de zero, a previsão foi mais quente que o dia; abaixo, mais fria.",

  referenciaTemperatura:
    "Compara o erro médio da previsão com o de uma referência simples: supor que amanhã será igual a hoje, " +
    "sem previsão nenhuma. Barras menores são melhores. Se a previsão não ficasse bem abaixo da referência, " +
    "ela não estaria agregando nada.",

  referenciaChuva:
    "Compara o acerto de “choveu ou não” com o de chutar sempre o resultado mais comum no período (se choveu " +
    "na maioria dos dias, chutar sempre “vai chover”). Barras maiores são melhores. A previsão só vale algo " +
    "se passar bem desse chute.",

  viradas:
    "Dias em que a temperatura máxima mudou 3 °C ou mais em relação ao dia anterior. São os dias em que repetir " +
    "o dia de hoje falha feio, e em que uma previsão de verdade mais faz falta.",

  aviso:
    "Separa os dois jeitos de errar “vai chover?”. Pego de surpresa: choveu sem a previsão avisar. " +
    "Alarme falso: a previsão avisou chuva e o dia ficou seco.",

  faixasDeChuva:
    "Erro da previsão de chuva conforme o quanto choveu de verdade, só nos dias em que choveu. " +
    "Abaixo de zero, a previsão ficou aquém do que caiu.",

  totalDeChuva:
    "Soma da chuva prevista e da chuva real em todos os dias do período, ao lado do erro médio por dia. " +
    "Os dois números podem destoar: erros para mais e para menos em dias diferentes se compensam no total.",

  constancia:
    "Quanto a temperatura máxima muda, em média, de um dia para o outro em cada cidade. Onde o tempo quase não muda, " +
    "errar pouco é fácil: até repetir o dia de hoje funcionaria bem. Por isso o erro bruto premia o clima calmo, " +
    "e a seção seguinte compara as cidades de forma justa.",

  erroJusto:
    "À esquerda, as cidades ordenadas pelo menor erro. À direita, pela nota sobre o óbvio, de 0 a 100 (maior é melhor): " +
    "0 é igual a repetir o dia de hoje (“amanhã = hoje”) e 100 é acertar tudo. A nota é 100 × (1 − erro justo), em que o " +
    "erro justo é o erro da previsão dividido por quanto o tempo muda na cidade; quem fica pior que repetir o dia de hoje " +
    "recebe 0. A linha mostra quem sobe ou desce quando o clima calmo ou agitado sai da conta.",

  notaSobreObvio:
    "Nota de 0 a 100 (maior é melhor) sobre o “amanhã = hoje”: 0 é igual a repetir o dia de hoje e 100 é acertar tudo. " +
    "Já desconta o clima da cidade: é 100 × (1 − erro da previsão ÷ quanto o tempo muda na cidade), então cidades de " +
    "clima calmo e de clima agitado são comparadas de forma justa.",

  erroPorMudanca:
    "Erro médio da previsão separado pelo tamanho da mudança do tempo em relação ao dia anterior. " +
    "A segunda linha de cada faixa é o erro para cada 1 unidade de mudança: ele cai conforme a virada aumenta, " +
    "ou seja, o erro cresce bem menos que a própria mudança.",

  estacoes:
    "Estações automáticas do INMET dentro de cada município (limites do IBGE) e no entorno, até 50 km do limite. " +
    "O índice de cobertura soma as estações operantes: uma estação dentro da cidade vale 1; fora, o valor cai com a " +
    "distância ao limite, medida em raios da cidade, então uma cidade pequena precisa de estação mais colada do que " +
    "uma grande. Só a localização entra na conta; as medições não são usadas. " +
    "Com só 4 cidades, a comparação com o erro aponta uma tendência e não prova que a estação causa o erro. " +
    "As outras 30 cidades coletadas desde 21/10/2026 darão mais pontos quando juntarem histórico.",

  correlacaoDePosto:
    "Correlação de Spearman: de −1 a +1, mede se dois números sobem e descem juntos (positivo) ou em sentidos opostos " +
    "(negativo). Perto de zero, não há relação. Mostra associação, não prova causa. " +
    "A confiança vem de quantos casos sustentam a relação: com centenas de dias ela é bem estabelecida; " +
    "com 4 cidades só indica uma direção, e um ponto fora da curva muda o resultado.",

  porCidade:
    "Erro médio e acerto de chuva em cada cidade, do maior para o menor erro na máxima.",

  dias: "Quantos dias de previsão foram comparados nesta cidade.",
} as const;
