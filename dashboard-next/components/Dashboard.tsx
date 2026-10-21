"use client";

import { useMemo, useState } from "react";
import type { LinhaComparada, LinhaRanking, MetricasCidade } from "@/lib/analise";
import { coresPorCidade } from "@/lib/cores";
import { montarPainel, opcoesDeCidade, TODAS } from "@/lib/painel";
import { Aviso } from "./Aviso";
import { GraficoLinhas } from "./GraficoLinhas";
import { GraficoRanking } from "./GraficoRanking";
import { GrupoMetricas } from "./Metricas";
import { TabelaDados, type Coluna } from "./TabelaDados";

const COLUNAS_POR_CIDADE: Coluna<MetricasCidade>[] = [
  { chave: "cidade_id", tipo: "texto" },
  { chave: "n", tipo: "inteiro" },
  { chave: "mae_temp_max", tipo: "decimal" },
  { chave: "rmse_temp_max", tipo: "decimal" },
  { chave: "mae_temp_min", tipo: "decimal" },
  { chave: "rmse_temp_min", tipo: "decimal" },
  { chave: "mae_chuva", tipo: "decimal" },
  { chave: "acc_chuva", tipo: "decimal" },
];

const COLUNAS_BASE: Coluna<LinhaComparada>[] = [
  { chave: "cidade_id", tipo: "data" },
  { chave: "dia_coleta_prev", tipo: "data" },
  { chave: "dia_previsto", tipo: "data" },
  { chave: "dia_real", tipo: "data" },
  { chave: "prev_temp_min", tipo: "inteiro" },
  { chave: "real_temp_min", tipo: "inteiro" },
  { chave: "erro_temp_min", tipo: "inteiro" },
  { chave: "prev_temp_max", tipo: "inteiro" },
  { chave: "real_temp_max", tipo: "inteiro" },
  { chave: "erro_temp_max", tipo: "inteiro" },
  { chave: "prev_chuva_mm", tipo: "decimal" },
  { chave: "real_chuva_mm", tipo: "decimal" },
  { chave: "erro_chuva_mm", tipo: "decimal" },
  { chave: "prev_clima_desc", tipo: "texto" },
  { chave: "real_clima_desc", tipo: "texto" },
];

const COLUNAS_RANKING: Coluna<LinhaRanking>[] = [
  { chave: "cidade_id", titulo: "CidadeID", tipo: "data" },
  { chave: "scoreFinal", titulo: "Score Final", tipo: "decimal" },
  { chave: "scoreTemperatura", titulo: "Score Temperatura", tipo: "decimal" },
  { chave: "scoreChuva", titulo: "Score Chuva", tipo: "decimal" },
  { chave: "scoreDescricao", titulo: "Score Descrição", tipo: "decimal" },
];

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xl font-semibold">{titulo}</h3>
      {children}
    </section>
  );
}

function Legenda({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

export function Dashboard({ linhas }: { linhas: LinhaComparada[] }) {
  const opcoes = useMemo(() => opcoesDeCidade(linhas), [linhas]);
  const cores = useMemo(() => coresPorCidade(opcoes.filter((o) => o !== TODAS)), [opcoes]);
  const [cidade, setCidade] = useState(TODAS);
  const painel = useMemo(() => montarPainel(linhas, cidade), [linhas, cidade]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-muted">Comparação entre previsão coletada em D-1 e valor real observado em D.</p>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          Cidade
          <select
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="min-w-56 rounded-md border border-borda bg-surface px-3 py-2 text-base text-ink"
          >
            {opcoes.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!painel ? (
        <Aviso tipo="alerta">Sem dados para o filtro selecionado.</Aviso>
      ) : (
        <>
          <hr className="border-grid" />
          <header className="space-y-1">
            <h2 className="text-2xl font-semibold">🎯 Qualidade da Previsão (D-1 → D)</h2>
            <p className="text-sm text-muted">{painel.subtitulo}</p>
          </header>

          <Secao titulo="📌 Métricas gerais">
            <GrupoMetricas metricas={painel.geral} />
          </Secao>
          <Secao titulo="🌡️ Temperatura Máx (°C)">
            <GrupoMetricas metricas={painel.temperaturaMax} />
          </Secao>
          <Secao titulo="🌡️ Temperatura Mín (°C)">
            <GrupoMetricas metricas={painel.temperaturaMin} />
          </Secao>
          <Secao titulo="🌧️ Chuva (mm)">
            <GrupoMetricas metricas={painel.chuva} />
          </Secao>
          <Secao titulo="📊 Métricas de Classificação e Chuva">
            <GrupoMetricas metricas={painel.classificacao} />
            <Legenda>Volume percentual calculado apenas em dias com chuva real &gt; 0.</Legenda>
            <Legenda>Bias &gt; 0 indica superestimação; Bias &lt; 0 indica subestimação.</Legenda>
          </Secao>

          {painel.porCidade && (
            <Secao titulo="🏙️ Métricas por cidade">
              <TabelaDados colunas={COLUNAS_POR_CIDADE} linhas={painel.porCidade} legenda="Métricas por cidade" />
            </Secao>
          )}

          <Secao titulo="📈 Erro ao longo do tempo">
            {painel.graficos.map((g) => (
              <GraficoLinhas
                key={g.titulo}
                titulo={g.titulo}
                unidade={g.unidade}
                series={g.series.map((s) => ({
                  nome: s.nome || painel.cidade,
                  cor: cores[s.nome || painel.cidade],
                  pontos: s.pontos,
                }))}
              />
            ))}
          </Secao>

          <details className="group rounded-lg border border-borda bg-surface">
            <summary className="cursor-pointer px-4 py-3 font-medium">🔎 Ver base comparada (D-1 → D)</summary>
            <div className="px-4 pb-4">
              <TabelaDados colunas={COLUNAS_BASE} linhas={painel.base} legenda="Base comparada (D-1 → D)" />
            </div>
          </details>

          {painel.ranking && (
            <Secao titulo="🏆 Ranking de Precisão por Cidade (Score Composto)">
              <GrupoMetricas metricas={painel.ranking.destaques} />
              <TabelaDados colunas={COLUNAS_RANKING} linhas={painel.ranking.linhas} legenda="Ranking de precisão" />
              <GraficoRanking
                titulo="Ranking - Cidades por Score Final (0-100)"
                linhas={painel.ranking.linhas}
                cores={cores}
              />
              <Legenda>{painel.ranking.legenda}</Legenda>
            </Secao>
          )}

          {painel.scoreCidade && (
            <Secao titulo="🏆 Score da cidade selecionada">
              <GrupoMetricas metricas={painel.scoreCidade.metricas} />
              <Legenda>{painel.scoreCidade.legenda}</Legenda>
            </Secao>
          )}
        </>
      )}
    </div>
  );
}
