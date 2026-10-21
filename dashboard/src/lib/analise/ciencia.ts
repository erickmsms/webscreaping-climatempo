/**
 * Modelo de tela da aba "Ciência de Dados": o erro da previsão separado do efeito do clima de cada
 * cidade, o erro conforme o tempo muda, a cobertura de estações e a lista de fatores que podem
 * explicar o erro. Só valores; rótulos e formatação ficam nos componentes.
 */
import type { LinhaComparada } from "@/lib/analise/comparacao";
import { montarFator, type Fator } from "@/lib/analise/causas";
import { constanciaPorCidade, type ConstanciaDaCidade } from "@/lib/analise/constancia";
import { coberturaDaCidade, type CoberturaDaCidade, type Estacao, type Municipio } from "@/lib/analise/estacoes";
import { opcoesDeCidade } from "@/lib/analise/painel";
import { errosPorVariacao, paresDeVariacao, type ErroPorVariacao, type Variavel } from "@/lib/analise/variacao";

export type CatalogoDeEstacoes = { baixadoEm: string; estacoes: Estacao[] };

export type Ciencia = {
  cidades: string[];
  linhasComparadas: number;
  inicio: string;
  fim: string;
  /** Erro bruto, constância e erro justo de cada cidade, por variável. */
  constancia: Record<Variavel, ConstanciaDaCidade[]>;
  /** Erro da previsão conforme o tempo mudou em relação a ontem. */
  variacao: { temperaturaMax: ErroPorVariacao[]; chuva: ErroPorVariacao[] };
  /** Estações do INMET perto de cada cidade; vazio sem catálogo. */
  cobertura: CoberturaDaCidade[];
  catalogoBaixadoEm: string | null;
  /** Fatores comparados com o erro, dos mais bem sustentados aos menos. */
  fatores: Fator[];
};

const CONFIANCA_ORDEM = { alta: 0, baixa: 1, "muito baixa": 2 } as const;

/** Fatores ordenados pela confiança da amostra e, dentro dela, pela força da correlação. */
function ordenarFatores(fatores: Fator[]): Fator[] {
  return [...fatores].sort(
    (a, b) =>
      CONFIANCA_ORDEM[a.confianca] - CONFIANCA_ORDEM[b.confianca] ||
      (Number.isNaN(b.correlacao) ? -1 : Math.abs(b.correlacao)) - (Number.isNaN(a.correlacao) ? -1 : Math.abs(a.correlacao)),
  );
}

export function montarCiencia(
  linhas: LinhaComparada[],
  catalogo: CatalogoDeEstacoes | null,
  municipios: Municipio[] = [],
): Ciencia | null {
  if (linhas.length === 0) return null;
  const cidades = opcoesDeCidade(linhas);
  const dias = linhas.map((l) => l.dia_real).sort();

  const constancia: Ciencia["constancia"] = {
    temperaturaMax: constanciaPorCidade(linhas, "temperaturaMax"),
    temperaturaMin: constanciaPorCidade(linhas, "temperaturaMin"),
    chuva: constanciaPorCidade(linhas, "chuva"),
  };

  const cobertura = catalogo
    ? cidades.flatMap((c) => {
        const municipio = municipios.find((m) => m.cidade_id === c);
        return municipio ? coberturaDaCidade(municipio, catalogo.estacoes) : [];
      })
    : [];

  const fatores: Fator[] = [];
  for (const [variavel, nome] of [
    ["temperaturaMax", "Quanto a temperatura máxima mudou no dia"],
    ["chuva", "Quanto a chuva mudou no dia"],
  ] as const) {
    const pares = paresDeVariacao(linhas, variavel);
    fatores.push(
      montarFator(`dia-${variavel}`, nome, "dias", pares.map((p) => p.variacao), pares.map((p) => p.erro)),
    );
  }

  const tmax = constancia.temperaturaMax;
  fatores.push(
    montarFator(
      "clima-temperaturaMax",
      "Quanto o clima da cidade varia (temperatura máxima)",
      "cidades",
      tmax.map((c) => c.variacaoMedia),
      tmax.map((c) => c.erroMedio),
    ),
  );

  const comCobertura = cidades.map((id) => cobertura.find((c) => c.cidade_id === id) ?? null);
  if (comCobertura.every((c) => c !== null)) {
    const indice = comCobertura.map((c) => c?.indice ?? Number.NaN);
    const alvos: Array<[Variavel, string]> = [
      ["temperaturaMax", "temperatura máxima"],
      ["chuva", "chuva"],
    ];
    for (const [variavel, texto] of alvos) {
      fatores.push(
        montarFator(
          `cobertura-${variavel}`,
          `Cobertura de estações × erro justo da ${texto}`,
          "cidades",
          indice,
          constancia[variavel].map((c) => c.erroJusto),
        ),
      );
    }
  }

  return {
    cidades,
    linhasComparadas: linhas.length,
    inicio: dias[0],
    fim: dias[dias.length - 1],
    constancia,
    variacao: {
      temperaturaMax: errosPorVariacao(linhas, "temperaturaMax"),
      chuva: errosPorVariacao(linhas, "chuva"),
    },
    cobertura,
    catalogoBaixadoEm: catalogo?.baixadoEm ?? null,
    fatores: ordenarFatores(fatores),
  };
}
