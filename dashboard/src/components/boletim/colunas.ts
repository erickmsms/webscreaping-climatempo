import type { LinhaComparada } from "@/lib/analise/comparacao";
import type { MetricasCidade } from "@/lib/analise/metricas";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";
import type { Coluna } from "@/components/ui/TabelaDados";

/** Colunas da tabela "Cidade a cidade". */
export const COLUNAS_POR_CIDADE: Coluna<MetricasCidade>[] = [
  { chave: "cidade_id", titulo: "Cidade", tipo: "cidade" },
  { chave: "n", titulo: "Dias", tipo: "numero", dica: GLOSSARIO.dias },
  { chave: "mae_temp_max", titulo: "Erro na Máxima", tipo: "decimal", sufixo: "°C", dica: GLOSSARIO.mae },
  { chave: "rmse_temp_max", titulo: "RMSE Máx", tipo: "decimal", dica: GLOSSARIO.rmse },
  { chave: "mae_temp_min", titulo: "Erro na Mínima", tipo: "decimal", sufixo: "°C", dica: GLOSSARIO.mae },
  { chave: "rmse_temp_min", titulo: "RMSE Mín", tipo: "decimal", dica: GLOSSARIO.rmse },
  { chave: "mae_chuva", titulo: "Erro na Chuva", tipo: "decimal", sufixo: "mm", dica: GLOSSARIO.mae },
  { chave: "acc_chuva", titulo: "Choveu ou Não", tipo: "percentual", dica: GLOSSARIO.acertoChuva },
];

/** Colunas da tabela "Base comparada". */
export const COLUNAS_BASE: Coluna<LinhaComparada>[] = [
  { chave: "cidade_id", titulo: "Cidade", tipo: "cidade" },
  { chave: "dia_coleta_prev", titulo: "Previsto em", tipo: "data", dica: GLOSSARIO.previstoEm },
  { chave: "dia_real", titulo: "Dia", tipo: "data", dica: GLOSSARIO.diaObservado },
  { chave: "prev_temp_min", titulo: "Mín prevista", tipo: "numero", sufixo: "°C" },
  { chave: "real_temp_min", titulo: "Mín real", tipo: "numero", sufixo: "°C" },
  { chave: "erro_temp_min", titulo: "Erro mín", tipo: "numero", sinal: true, dica: GLOSSARIO.erroPrevistoReal },
  { chave: "prev_temp_max", titulo: "Máx prevista", tipo: "numero", sufixo: "°C" },
  { chave: "real_temp_max", titulo: "Máx real", tipo: "numero", sufixo: "°C" },
  { chave: "erro_temp_max", titulo: "Erro máx", tipo: "numero", sinal: true, dica: GLOSSARIO.erroPrevistoReal },
  { chave: "prev_chuva_mm", titulo: "Chuva prevista", tipo: "decimal", sufixo: "mm" },
  { chave: "real_chuva_mm", titulo: "Chuva real", tipo: "decimal", sufixo: "mm" },
  { chave: "erro_chuva_mm", titulo: "Erro chuva", tipo: "decimal", sinal: true, dica: GLOSSARIO.erroPrevistoReal },
  { chave: "prev_clima_desc", titulo: "Descrição prevista", tipo: "texto" },
  { chave: "real_clima_desc", titulo: "Descrição real", tipo: "texto" },
];
