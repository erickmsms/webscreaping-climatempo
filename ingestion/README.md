# Ingestão

Coleta as previsões do Climatempo com Scrapy e carrega o resultado na tabela
bruta do SQLite (camada bronze).

```
scrapy.cfg
coleta/                 projeto Scrapy
  settings.py           respeita robots.txt, 1 requisição por vez com intervalo
  spiders/previsao.py   spider: hoje e amanhã de cada cidade
carga/
  carregar_bronze.py    JSON Lines -> CSV de inspeção + tabela raw_climatempo_previsao
```

## Como rodar

Requer Python 3.11+. Todos os comandos a partir desta pasta.

```bash
pip install -r requirements.txt

# coleta: -O sobrescreve o arquivo, então ele guarda só a última execução
scrapy crawl previsao -O ../data/bronze/previsoes.jsonl

# carga: acrescenta as linhas na tabela bruta de ../data/dataset_climatempo.db
python carga/carregar_bronze.py
```

A carga aceita `--entrada`, `--csv` e `--banco` para usar outros arquivos, por
exemplo uma cópia do banco para testes.

Cada carga **acrescenta** as linhas do arquivo. Carregar o mesmo arquivo duas
vezes duplica a tabela bruta; a silver do dbt remove as duplicatas, mantendo a
coleta mais recente de cada cidade, tipo e dia.

## Cidades

As URLs ficam em `start_urls`, no spider. Hoje: Pedra (PE), São Paulo (SP),
Recife (PE) e Americana (SP).
