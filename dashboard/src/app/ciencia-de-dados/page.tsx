import type { Metadata } from "next";
import { Cabecalho } from "@/components/boletim/Cabecalho";
import { Rodape } from "@/components/boletim/Rodape";
import { AberturaCiencia } from "@/components/ciencia/AberturaCiencia";
import { CausasDoErro } from "@/components/ciencia/CausasDoErro";
import { ClimaDeCadaCidade } from "@/components/ciencia/ClimaDeCadaCidade";
import { ComoMedimosCiencia } from "@/components/ciencia/ComoMedimosCiencia";
import { ErroBrutoEErroJusto } from "@/components/ciencia/ErroBrutoEErroJusto";
import { ErroConformeOTempoMuda } from "@/components/ciencia/ErroConformeOTempoMuda";
import { EstacoesMeteorologicas } from "@/components/ciencia/EstacoesMeteorologicas";
import { Aviso } from "@/components/ui/Aviso";
import { carregarCiencia } from "@/lib/dados/carregar";

export const metadata: Metadata = {
  title: "Ciência de dados — Boletim de precisão",
  description: "Por que a previsão do Climatempo erra: clima de cada cidade, mudança do tempo e estações do INMET.",
};

/**
 * Aba de ciência de dados: separa o erro da previsão do efeito do clima de cada cidade e procura o que de fato
 * explica o erro. Ordem da história: o clima de cada cidade pesa, o erro justo tira esse peso, o erro cresce quando o
 * tempo vira, as estações ficam perto ou longe, e por fim o que explica o erro (e com que confiança).
 */
export default async function Page() {
  const resultado = await carregarCiencia();

  if (resultado.status !== "ok") {
    return (
      <>
        <Cabecalho />
        <main className="mx-auto max-w-[70rem] px-6 py-14">
          {resultado.status === "sem-dados" ? (
            <Aviso tipo="erro">Não encontrei os dados da coleta (data/bronze/previsoes.jsonl).</Aviso>
          ) : (
            <Aviso tipo="alerta">Não encontrei pares válidos de previsão D-1 → real D.</Aviso>
          )}
        </main>
      </>
    );
  }

  const { ciencia } = resultado;
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-[70rem] flex-col gap-16 px-6 pt-14 pb-20">
        <AberturaCiencia ciencia={ciencia} />
        <ClimaDeCadaCidade ciencia={ciencia} />
        <ErroBrutoEErroJusto ciencia={ciencia} />
        <ErroConformeOTempoMuda ciencia={ciencia} />
        <EstacoesMeteorologicas ciencia={ciencia} />
        <CausasDoErro ciencia={ciencia} />
        <ComoMedimosCiencia catalogoBaixadoEm={ciencia.catalogoBaixadoEm} />
        <Rodape inicio={ciencia.inicio} fim={ciencia.fim} />
      </main>
    </>
  );
}
