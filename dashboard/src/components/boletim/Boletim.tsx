"use client";

import { useMemo, useState } from "react";
import { Abertura } from "@/components/boletim/Abertura";
import { Cabecalho } from "@/components/boletim/Cabecalho";
import { COLUNAS_POR_CIDADE } from "@/components/boletim/colunas";
import { ComoMedimos } from "@/components/boletim/ComoMedimos";
import { ErroPorDia } from "@/components/boletim/ErrosPorDia";
import { GuardaChuva } from "@/components/boletim/GuardaChuva";
import { MelhorQueOObvio, QuandoOTempoVira } from "@/components/boletim/MelhorQueOObvio";
import { NumerosPrincipais } from "@/components/boletim/NumerosPrincipais";
import { QuadroMetricas } from "@/components/boletim/QuadroMetricas";
import { Ranking } from "@/components/boletim/Ranking";
import { Rodape } from "@/components/boletim/Rodape";
import { TemporaisPontoCego } from "@/components/boletim/TemporaisPontoCego";
import { TotalVsDia } from "@/components/boletim/TotalVsDia";
import { Aviso } from "@/components/ui/Aviso";
import { Secao } from "@/components/ui/Secao";
import { TabelaDados } from "@/components/ui/TabelaDados";
import type { LinhaComparada } from "@/lib/analise/comparacao";
import { montarPainel, opcoesDeCidade } from "@/lib/analise/painel";
import { coresPorCidade } from "@/lib/apresentacao/cores";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";

/**
 * A página: filtro de cidade e as seções do boletim, contando uma história em ordem:
 * quem acerta mais (a manchete, o ranking e a tabela por cidade), se isso é bom de verdade
 * (contra a referência ingênua, inclusive nos dias de virada), onde a previsão falha (erro por dia, temporais,
 * total contra dia a dia, tipo de erro de chuva) e, por fim, o método e as métricas.
 */
export function Boletim({ linhas }: { linhas: LinhaComparada[] }) {
  const opcoes = useMemo(() => opcoesDeCidade(linhas), [linhas]);
  const cores = useMemo(() => coresPorCidade(opcoes), [opcoes]);
  const [cidades, setCidades] = useState(opcoes);
  const painel = useMemo(() => montarPainel(linhas, cidades), [linhas, cidades]);

  return (
    <>
      <Cabecalho opcoes={opcoes} cidades={cidades} cores={cores} aoEscolher={setCidades} />
      <main className="mx-auto flex max-w-[70rem] flex-col gap-16 px-6 pt-14 pb-20">
        {!painel ? (
          <Aviso tipo="alerta">Marque ao menos uma cidade para ver o boletim.</Aviso>
        ) : (
          <>
            <Abertura painel={painel} />
            <NumerosPrincipais painel={painel} />

            <Secao titulo="Quem Acerta Mais?" dica={GLOSSARIO.score}>
              <Ranking linhas={painel.ranking} cores={cores} selecionadas={painel.numCidades < opcoes.length ? painel.cidades : undefined} />
            </Secao>

            {painel.porCidade && (
              <Secao titulo="Cidade a Cidade" dica={GLOSSARIO.porCidade}>
                <TabelaDados colunas={COLUNAS_POR_CIDADE} linhas={painel.porCidade} legenda="Métricas por cidade" />
              </Secao>
            )}

            <MelhorQueOObvio painel={painel} />
            <QuandoOTempoVira painel={painel} />

            <ErroPorDia painel={painel} cores={cores} />
            <TemporaisPontoCego painel={painel} />
            <TotalVsDia painel={painel} />
            <GuardaChuva painel={painel} />

            <Secao titulo="Todas as métricas">
              <QuadroMetricas painel={painel} />
            </Secao>

            <ComoMedimos />
            <Rodape inicio={painel.inicio} fim={painel.fim} />
          </>
        )}
      </main>
    </>
  );
}
