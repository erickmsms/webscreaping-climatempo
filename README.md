# 🌦️ Webscraping Climatempo — Pipeline Completo com Scrapy + Airflow + DBT

Projeto de engenharia de dados que coleta previsões meteorológicas via **web scraping**, estrutura os dados em arquitetura medalhão (Bronze → Silver → Gold) e avalia a **qualidade das previsões** comparando previsão D-1 vs dado real D.

Toda a pipeline é **orquestrada com Apache Airflow**.

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
Scrapy → Transform → Bronze (CSV)
                ↓
              DBT
      Silver → Gold (SQLite)
                ↓
             Airflow
                ↓
           Dashboard (Next.js)
```

---

# 🥉 Camada Bronze

A Bronze é dividida em **duas tarefas principais**:

## 1️⃣ Scrapy (Web Scraping)

Responsável por:

* Navegar no site Climatempo
* Extrair:

  * Temperatura mínima
  * Temperatura máxima
  * Descrição do clima
  * Volume de chuva
* Capturar previsões para o dia seguinte
* Capturar dados reais do dia atual

O Scrapy gera o dado bruto.

Essa é a parte mais crítica do projeto, pois:

* Lida com estrutura HTML
* Trata inconsistências
* Garante padronização mínima
* Evita falhas silenciosas

---

## 2️⃣ Transform (Padronização)

Após a coleta:

* Os dados são tratados com Python
* Convertidos para formato estruturado
* Salvos como **CSV em string**
* Armazenados como camada Bronze

Essa etapa garante que o DBT consiga consumir dados consistentes.

---

# 🥈 Silver (DBT)

O DBT:

* Lê os CSVs da Bronze
* Aplica tipagem correta
* Normaliza colunas
* Remove inconsistências
* Cria tabelas intermediárias

Separação clara entre:

* `silver_climatempo_previsao`
* `silver_climatempo_dadosdia`

---

# 🥇 Gold (DBT)

Camada analítica final:

* `gold_climatempo_dadosdia`
* `gold_climatempo_previsoes`

Estruturadas para permitir:

* Join D-1 → D
* Cálculo de erro
* Métricas estatísticas
* Avaliação por cidade
* Ranking de precisão

Essa camada já está pronta para consumo analítico.

---

# ⚙️ Orquestração com Apache Airflow

O Airflow é responsável por:

* Executar o Scrapy
* Rodar o script de Transform
* Executar DBT (run + test)
* Garantir ordem correta das etapas
* Evitar dependências quebradas
* Permitir execução diária automatizada

A DAG segue lógica:

```
scrapy_task
    ↓
transform_task
    ↓
dbt_run
    ↓
dbt_test
```

Pontos fortes da orquestração:

* Execução sequencial garantida
* Separação clara de responsabilidades
* Reprocessamento simples
* Controle de falhas

Essa parte é um dos principais diferenciais do projeto.

---

# 📊 Métricas Implementadas

Comparação entre:

* Previsão coletada em D-1
* Dado real observado em D

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

1. Instalar dependências

2. Subir Airflow

3. Rodar DAG

4. Abrir o dashboard (detalhes em [`dashboard-next/README.md`](dashboard-next/README.md)):

```
cd dashboard-next
npm install
npm run dev
```

---

# 📌 O que este projeto demonstra

* Engenharia de dados ponta a ponta
* Web scraping estruturado
* Arquitetura medalhão
* Orquestração real com Airflow
* Modelagem com DBT
* Métricas de avaliação preditiva
* Construção de dashboard analítico
