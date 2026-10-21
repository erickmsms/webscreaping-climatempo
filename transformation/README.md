# Transformação (dbt)

Projeto dbt que transforma a tabela bruta em silver e gold, no mesmo SQLite.

```
dbt_project.yml        projeto e materialização por camada
profiles.yml           conexão (dbt-sqlite) com ../data/dataset_climatempo.db
packages.yml           dbt_utils (testes)
models/
  silver/
    sources.yml                     tabela bruta (bronze) como source
    silver_climatempo_previsao.sql  tipagem, normalização e deduplicação
    schema.yml                      testes
  gold/
    gold_climatempo_dadosdia.sql    dado do dia, por cidade
    gold_climatempo_previsoes.sql   previsão para D+1
    schema.yml                      testes
```

## Como rodar

Requer Python 3.11+. Todos os comandos a partir desta pasta.

```bash
pip install -r requirements.txt
dbt deps --profiles-dir .     # instala o dbt_utils (uma vez)
dbt build --profiles-dir .    # roda os modelos e os testes
```

Só uma camada: `dbt build --profiles-dir . --select path:models/silver`.

Para rodar contra outro banco (uma cópia para testes, por exemplo), defina
`CLIMATEMPO_DB_PATH` com o caminho do `.db`.
