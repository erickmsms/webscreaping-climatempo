# 🌦️ Webscraping Climatempo — Pipeline Completo com Scrapy + Airflow + DBT

Projeto de engenharia de dados que coleta previsões meteorológicas via **web scraping**, estrutura os dados em arquitetura medalhão (Bronze → Silver → Gold) e avalia a **qualidade das previsões** comparando previsão D-1 vs dado real D.

Toda a pipeline é **orquestrada com Apache Airflow**, e o resultado aparece num **dashboard em Next.js**.

<img width="1168" alt="Dashboard: manchete com a cidade de previsão mais confiável, números principais e ranking de precisão" src="docs/img/dashboard-abertura.png" />
<img width="1168" alt="Dashboard: erro de chuva por dia com os piores erros anotados e erro de temperatura por dia" src="docs/img/dashboard-graficos.png" />
<img width="1168" alt="Dashboard: métricas por cidade e quadro com todas as métricas" src="docs/img/dashboard-metricas.png" />


<img width="1918" height="968" alt="DAG do pipeline no Airflow" src="https://github.com/user-attachments/assets/8fd29bb6-4de8-4a4a-a4bd-2faace0392b4" />

---

# 🎯 Objetivo do Projeto

Construir um pipeline automatizado capaz de:

* Coletar previsões do tempo do site Climatempo
* Armazenar os dados brutos
* Transformar e modelar os dados com DBT
* Comparar previsão vs dado real
* Calcular métricas de erro (MAE, RMSE, Bias, MAPE)
* Gerar ranking de precisão por cidade

O foco principal é **medir o quão precisa é a previsão do tempo.**

---

# 🏗️ Arquitetura do Projeto

```
Scrapy ──► data/bronze/previsoes.jsonl ──► carga ──► SQLite (raw)
                                                        │
                                                       dbt
                                                        │
                                             silver ──► gold
                                                        │
                                              Dashboard (Next.js)

Airflow orquestra coleta → carga → dbt silver → dbt gold, todo dia.
```

# 📁 Estrutura do Repositório

```
ingestion/        coleta com Scrapy e carga da bronze no SQLite
transformation/   projeto dbt: modelos silver e gold, com testes
orchestration/    DAG do Airflow
dashboard/        dashboard em Next.js + React
data/             banco SQLite e arquivos da bronze
docs/             imagens e documentação
```

Cada pasta tem um README com o que ela faz e como rodar.

---

# 🥉 Camada Bronze

A Bronze é dividida em **duas tarefas principais**, ambas em [`ingestion/`](ingestion/):

## 1️⃣ Scrapy (Web Scraping)

Responsável por:

* Navegar no site Climatempo
* Extrair:

  * Temperatura mínima
  * Temperatura máxima
  * Descrição do clima
  * Volume de chuva
* Capturar previsões para o dia seguinte
* Capturar dados do dia atual

O Scrapy gera o dado bruto em `data/bronze/previsoes.jsonl`.

## 2️⃣ Carga

Após a coleta, `ingestion/carga/carregar_bronze.py`:

* Lê o JSON Lines da coleta
* Faz uma limpeza mínima de texto
* Grava uma cópia em CSV para inspeção
* Acrescenta as linhas na tabela `raw_climatempo_previsao` do SQLite

---

# 🥈 Silver (DBT)

Em [`transformation/`](transformation/), o DBT:

* Lê a tabela bruta (declarada como `source`)
* Aplica tipagem correta
* Normaliza colunas
* Remove duplicatas (mantém a coleta mais recente de cada cidade, tipo e dia)

Modelo: `silver_climatempo_previsao`.

---

# 🥇 Gold (DBT)

Camada analítica final:

* `gold_climatempo_dadosdia`: o dado do dia, por cidade
* `gold_climatempo_previsoes`: a previsão para o dia seguinte (D+1)

Estruturadas para permitir:

* Join D-1 → D
* Cálculo de erro
* Métricas estatísticas
* Avaliação por cidade
* Ranking de precisão

Silver e gold têm testes de dados (`not_null`, valores aceitos, faixas e regras como mínima ≤ máxima).

---

# ⚙️ Orquestração com Apache Airflow

A DAG em [`orchestration/dags/clima_pipeline.py`](orchestration/dags/clima_pipeline.py) roda todo dia:

```
run_scrapy
    ↓
run_carga
    ↓
dbt_build_silver   (dbt build = run + test)
    ↓
dbt_build_gold
```

Pontos fortes da orquestração:

* Execução sequencial garantida
* Separação clara de responsabilidades
* Testes do dbt a cada execução
* Falhas da carga derrubam a tarefa, em vez de passar em silêncio

---

# 📊 Métricas Implementadas

Comparação entre:

* Previsão coletada em D-1
* Dado observado em D

Métricas calculadas:

* MAE
* RMSE
* Bias
* MAPE
* Accuracy (Choveu vs Não Choveu)
* Accuracy descrição textual
* Score composto por cidade

Ranking final ponderado:

* 50% Temperatura
* 40% Chuva
* 10% Descrição

---

# 🧠 Stack Utilizada

* Python
* Scrapy
* Pandas
* SQLite
* DBT
* Apache Airflow
* Next.js + React (dashboard)

---

# 🚀 Como Executar

Requisitos: Python 3.11+ e Node.js 20.9+.

**1. Coleta e carga** ([detalhes](ingestion/README.md))

```bash
cd ingestion
pip install -r requirements.txt
scrapy crawl previsao -O ../data/bronze/previsoes.jsonl
python carga/carregar_bronze.py
```

**2. Transformação** ([detalhes](transformation/README.md))

```bash
cd transformation
pip install -r requirements.txt
dbt deps --profiles-dir .
dbt build --profiles-dir .
```

**3. Dashboard** ([detalhes](dashboard/README.md))

```bash
cd dashboard
npm install
npm run dev
```

Para rodar tudo agendado, veja a [orquestração com Airflow](orchestration/README.md).

---

# 📌 O que este projeto demonstra

* Engenharia de dados ponta a ponta
* Web scraping estruturado
* Arquitetura medalhão
* Orquestração real com Airflow
* Modelagem e testes de dados com DBT
* Métricas de avaliação preditiva
* Construção de dashboard analítico
