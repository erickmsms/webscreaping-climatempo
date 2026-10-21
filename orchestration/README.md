# Orquestração (Airflow)

`dags/clima_pipeline.py` roda o pipeline uma vez por dia:

```
run_scrapy -> run_carga -> dbt_build_silver -> dbt_build_gold
```

| Tarefa | O que faz |
|---|---|
| `run_scrapy` | Coleta e sobrescreve `data/bronze/previsoes.jsonl` |
| `run_carga` | Acrescenta a coleta na tabela bruta do SQLite |
| `dbt_build_silver` | Roda e testa os modelos de `models/silver` |
| `dbt_build_gold` | Roda e testa os modelos de `models/gold` |

## Ambiente esperado

- O repositório montado em `CLIMATEMPO_PROJECT_DIR` (padrão `/opt/project`).
- As dependências de `ingestion/requirements.txt` e
  `transformation/requirements.txt` instaladas no ambiente do Airflow.
- `dbt deps --profiles-dir .` já executado em `transformation/`.

Copie ou monte `dags/` na pasta de DAGs do Airflow.
