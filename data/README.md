# Dados

| Arquivo | O que é |
|---|---|
| `dataset_climatempo.db` | SQLite com a tabela bruta (`raw_climatempo_previsao`) e as tabelas silver e gold do dbt. É o que o dashboard lê. |
| `bronze/previsoes.jsonl` | Saída da coleta do Scrapy. A coleta sobrescreve este arquivo; o histórico fica na tabela bruta. |
| `bronze/nao-carregado-2026-02-18.jsonl` | 8 leituras de 18/02/2026 que uma execução da DAG gravou no caminho errado e nunca foram carregadas no banco. |
| `bronze/previsoes.csv` | Cópia em CSV da última carga, para inspeção. Gerado pela carga e fora do git. |

Para carregar o arquivo de 18/02 no banco, a partir de `ingestion/`:

```bash
python carga/carregar_bronze.py --entrada ../data/bronze/nao-carregado-2026-02-18.jsonl
```
