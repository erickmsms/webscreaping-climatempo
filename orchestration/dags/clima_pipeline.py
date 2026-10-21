"""Pipeline diário: coleta (Scrapy) -> carga bruta (SQLite) -> dbt silver -> dbt gold.

Espera o repositório montado em CLIMATEMPO_PROJECT_DIR (padrão /opt/project),
com as dependências de ingestion/ e transformation/ instaladas e `dbt deps`
já executado em transformation/.
"""

import os
from datetime import datetime

from airflow import DAG
from airflow.operators.bash import BashOperator

PROJECT_DIR = os.environ.get("CLIMATEMPO_PROJECT_DIR", "/opt/project")
INGESTION_DIR = f"{PROJECT_DIR}/ingestion"
TRANSFORMATION_DIR = f"{PROJECT_DIR}/transformation"

with DAG(
    dag_id="clima_pipeline",
    start_date=datetime(2025, 1, 1),
    schedule="@daily",
    catchup=False,
    tags=["clima"],
) as dag:

    # -O sobrescreve o arquivo: cada execução carrega só a coleta do dia.
    run_scrapy = BashOperator(
        task_id="run_scrapy",
        bash_command=f"cd {INGESTION_DIR} && scrapy crawl previsao -O ../data/bronze/previsoes.jsonl",
    )

    run_carga = BashOperator(
        task_id="run_carga",
        bash_command=f"cd {INGESTION_DIR} && python carga/carregar_bronze.py",
    )

    # dbt build = run + test de cada modelo da camada.
    dbt_build_silver = BashOperator(
        task_id="dbt_build_silver",
        bash_command=f"cd {TRANSFORMATION_DIR} && dbt build --profiles-dir . --select path:models/silver",
    )

    dbt_build_gold = BashOperator(
        task_id="dbt_build_gold",
        bash_command=f"cd {TRANSFORMATION_DIR} && dbt build --profiles-dir . --select path:models/gold",
    )

    run_scrapy >> run_carga >> dbt_build_silver >> dbt_build_gold
