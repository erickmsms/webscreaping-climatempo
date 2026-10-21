import type { MetricasCidade } from "@/lib/analise/metricas";
import { GLOSSARIO } from "@/lib/apresentacao/glossario";
import type { Coluna } from "@/components/ui/TabelaDados";

/** Colunas da tabela "Cidade a Cidade". */
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
