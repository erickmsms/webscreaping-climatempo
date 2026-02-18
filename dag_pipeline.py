from datetime import datetime
from airflow import DAG
from airflow.operators.bash import BashOperator

PROJECT_DIR = "/opt/project"

with DAG(
    dag_id="clima_pipeline",
    start_date=datetime(2025, 1, 1),
    schedule="@daily",
    catchup=False,
    tags=["clima"],
) as dag:

    run_scrapy = BashOperator(
        task_id="run_scrapy",
        bash_command=(
            f"cd {PROJECT_DIR}/bronze/coleta && "
            "scrapy crawl previsao -O coleta/data.jsonl"
        ),
    )

    run_transform = BashOperator(
        task_id="run_transform",
        bash_command=(
            f"cd {PROJECT_DIR}/bronze/transform && "
            "python transform.py"
        ),
    )

    run_dbt_silver = BashOperator(
        task_id="run_dbt_silver",
        bash_command=(
            f"cd {PROJECT_DIR}/silver-gold/projeto_clima && "
            "dbt run --profiles-dir ./.dbt --select silver"
        ),
    )

    run_dbt_gold = BashOperator(
        task_id="run_dbt_gold",
        bash_command=(
            f"cd {PROJECT_DIR}/silver-gold/projeto_clima && "
            "dbt run --profiles-dir ./.dbt --select gold"
        ),
    )

    run_scrapy >> run_transform >> run_dbt_silver >> run_dbt_gold
