import { nomeDaCidade } from "@/lib/apresentacao/cidades";
import type { GraficoErro } from "@/lib/analise/painel";
import type { SerieDesenho } from "@/components/graficos/GraficoLinhas";

/**
 * Séries do modelo de tela -> séries para desenhar (nome legível e cor da
 * cidade). Na visão de uma cidade a série vem sem nome: é a própria cidade filtrada.
 */
export function desenharSeries(
  grafico: GraficoErro,
  cidadeFiltrada: string,
  cores: Record<string, string>,
): SerieDesenho[] {
  return grafico.series.map((s) => {
    const id = s.nome || cidadeFiltrada;
    return { nome: nomeDaCidade(id).nome, cor: cores[id], pontos: s.pontos };
  });
}
