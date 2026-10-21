/**
 * O quanto o tempo mudou de um dia para o outro e o que isso faz com o erro da previsão.
 * "Mudou" é a diferença entre o valor real de ontem e o de hoje, na mesma cidade: é também
 * o erro de supor que amanhã será igual a hoje.
 */
import type { LinhaComparada } from "@/lib/analise/comparacao";
import { somarDias } from "@/lib/analise/comparacao";
import { media } from "@/lib/analise/metricas";

export type Variavel = "temperaturaMax" | "temperaturaMin" | "chuva";

const CAMPOS = { temperaturaMax: "temp_max", temperaturaMin: "temp_min", chuva: "chuva_mm" } as const;

/** Um dia de uma cidade: o erro da previsão e o quanto o tempo mudou em relação a ontem. */
export type ParDeVariacao = {
  cidade_id: string;
  dia: string;
  /** Erro da previsão, sem sinal. */
  erro: number;
  /** Mudança do valor real em relação ao dia anterior, sem sinal. */
  variacao: number;
};

/** Só os dias em que existem a previsão, o real e o real da véspera. */
export function paresDeVariacao(linhas: LinhaComparada[], variavel: Variavel): ParDeVariacao[] {
  const campo = CAMPOS[variavel];
  const reais = new Map(linhas.map((l) => [`${l.cidade_id}|${l.dia_real}`, l[`real_${campo}`]]));
  const pares: ParDeVariacao[] = [];
  for (const l of linhas) {
    const ontem = reais.get(`${l.cidade_id}|${somarDias(l.dia_real, -1)}`) ?? null;
    const real = l[`real_${campo}`];
    const erro = l[`erro_${campo}`];
    if (ontem === null || real === null || erro === null) continue;
    pares.push({ cidade_id: l.cidade_id, dia: l.dia_real, erro: Math.abs(erro), variacao: Math.abs(ontem - real) });
  }
  return pares;
}

type Faixa = { rotulo: string; de: number; ate: number };

const FAIXAS: Record<"temperatura" | "chuva", Faixa[]> = {
  temperatura: [
    { rotulo: "Até 1 °C", de: 0, ate: 1 },
    { rotulo: "1 a 2 °C", de: 1, ate: 2 },
    { rotulo: "2 a 3 °C", de: 2, ate: 3 },
    { rotulo: "3 a 5 °C", de: 3, ate: 5 },
    { rotulo: "5 °C ou mais", de: 5, ate: Number.POSITIVE_INFINITY },
  ],
  chuva: [
    { rotulo: "Sem mudança", de: 0, ate: 0.05 },
    { rotulo: "Até 2 mm", de: 0.05, ate: 2 },
    { rotulo: "2 a 10 mm", de: 2, ate: 10 },
    { rotulo: "10 a 30 mm", de: 10, ate: 30 },
    { rotulo: "Mais de 30 mm", de: 30, ate: Number.POSITIVE_INFINITY },
  ],
};

/** Abaixo disso a mudança é pequena demais para dividir o erro por ela. */
const MUDANCA_MINIMA = 0.5;

export type ErroPorVariacao = {
  rotulo: string;
  dias: number;
  /** Erro médio da previsão nos dias da faixa. */
  erroMedio: number;
  /** Quanto o tempo mudou, em média, nos dias da faixa. */
  variacaoMedia: number;
  /** Erro para cada 1 unidade de mudança (NaN quando o tempo praticamente não mudou). */
  erroPorUnidade: number;
};

/** Erro da previsão conforme o tamanho da mudança do tempo em relação a ontem. */
export function errosPorVariacao(linhas: LinhaComparada[], variavel: Variavel): ErroPorVariacao[] {
  const pares = paresDeVariacao(linhas, variavel);
  const faixas = variavel === "chuva" ? FAIXAS.chuva : FAIXAS.temperatura;
  return faixas.map((f) => {
    const dentro = pares.filter((p) => p.variacao >= f.de && p.variacao < f.ate);
    const erroMedio = media(dentro.map((p) => p.erro));
    const variacaoMedia = media(dentro.map((p) => p.variacao));
    return {
      rotulo: f.rotulo,
      dias: dentro.length,
      erroMedio,
      variacaoMedia,
      erroPorUnidade: variacaoMedia >= MUDANCA_MINIMA ? erroMedio / variacaoMedia : Number.NaN,
    };
  });
}
