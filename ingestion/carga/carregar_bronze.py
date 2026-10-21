"""Carrega a coleta do Scrapy (JSON Lines) na tabela bruta do SQLite.

Lê data/bronze/previsoes.jsonl, faz uma limpeza mínima de texto, grava uma
cópia em CSV para inspeção e acrescenta as linhas em raw_climatempo_previsao,
de onde o dbt monta as camadas silver e gold.

    python carga/carregar_bronze.py
    python carga/carregar_bronze.py --entrada outro.jsonl --banco outro.db

Cada execução acrescenta (append) o conteúdo do arquivo de entrada. Rodar duas
vezes sobre o mesmo arquivo duplica as linhas; a silver deduplica por cidade,
tipo e dia, mantendo a coleta mais recente.
"""

import argparse
import json
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine

RAIZ = Path(__file__).resolve().parents[2]
TABELA = "raw_climatempo_previsao"


def ler_coleta(caminho: Path) -> pd.DataFrame:
    if not caminho.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho}")

    texto = caminho.read_text(encoding="utf-8").strip()
    if not texto:
        raise ValueError(f"Arquivo está vazio: {caminho}")

    # Aceita uma lista JSON ou JSON Lines (um objeto por linha, o formato do Scrapy).
    try:
        conteudo = json.loads(texto)
        df = pd.DataFrame(conteudo if isinstance(conteudo, list) else [conteudo])
    except json.JSONDecodeError:
        df = pd.read_json(caminho, lines=True)

    # Limpeza básica: a descrição vem do HTML com quebras de linha e espaços.
    for coluna in df.select_dtypes(include="object").columns:
        df[coluna] = df[coluna].astype(str).str.strip()
    return df


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--entrada", type=Path, default=RAIZ / "data" / "bronze" / "previsoes.jsonl")
    parser.add_argument("--csv", type=Path, default=RAIZ / "data" / "bronze" / "previsoes.csv")
    parser.add_argument("--banco", type=Path, default=RAIZ / "data" / "dataset_climatempo.db")
    args = parser.parse_args()

    df = ler_coleta(args.entrada.resolve())
    print(f"Coleta lida: {len(df)} linhas, {len(df.columns)} colunas")

    args.csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.csv, index=False, encoding="utf-8")
    print(f"CSV para inspeção: {args.csv.resolve()}")

    # Erros aqui devem derrubar o processo: o Airflow precisa ver a falha.
    engine = create_engine(f"sqlite:///{args.banco.resolve()}")
    with engine.begin() as conexao:
        df.to_sql(name=TABELA, con=conexao, if_exists="append", index=False)
    print(f"{len(df)} linhas acrescentadas em {TABELA} ({args.banco.resolve()})")


if __name__ == "__main__":
    main()
