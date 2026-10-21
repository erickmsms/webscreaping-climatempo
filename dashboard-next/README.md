# Dashboard Next.js — Qualidade da Previsão

Versão em **Next.js + React** do dashboard Streamlit (`../dashboard/app.py`).
Reproduz as mesmas análises, com os mesmos números: métricas de erro (MAE, RMSE,
Bias, MAPE), acurácias, métricas por cidade, séries de erro por dia, base
comparada e ranking por score composto.

O dashboard Streamlit continua no repositório e funcionando. Os dois leem o
mesmo banco: as tabelas gold do dbt em `../dataset_climatempo.db`.

## Como rodar

Requer Node.js 20.9 ou mais novo.

```bash
cd dashboard-next
npm install
npm run dev
```

Abra http://localhost:3000.

Para usar outro banco, defina `CLIMATEMPO_DB_PATH` com o caminho do `.db`.

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm test` | Testes unitários e de paridade (Vitest) |
| `npm run typecheck` | Checagem de tipos |
| `npm run lint` | ESLint |

## Estrutura

```
app/
  page.tsx            página: carrega os dados e trata banco ausente / sem pares
lib/
  db.ts               leitura das tabelas gold (better-sqlite3, só no servidor)
  dados.ts            base comparada D-1 -> D com cache de 1h ("use cache")
  analise.ts          cálculos portados do app.py (join, métricas, scores)
  painel.ts           modelo de tela: o que a página mostra para cada filtro
  formato.ts          formatação numérica idêntica ao Python
  cores.ts            cor fixa por cidade
components/           cartões, tabelas, gráficos e o painel (cliente)
tests/                testes unitários e de paridade
scripts/              gerador do gabarito de paridade (Python)
```

O cálculo fica todo em `lib/` (funções puras, testáveis sem o Next). Os
componentes só desenham o modelo de tela montado por `lib/painel.ts`.

## Paridade com o Streamlit

`tests/paridade.test.ts` garante que este front exibe exatamente o mesmo que o
Streamlit: para "Todas" e para cada cidade, compara métricas (rótulo e valor
formatado), tabelas e as séries de cada gráfico com um gabarito capturado do
próprio `app.py`.

O gabarito (`tests/fixtures/streamlit-golden.json`) depende do banco. Quando o
`dataset_climatempo.db` ou o `app.py` mudarem, gere de novo:

```bash
pip install streamlit pandas plotly
python scripts/gerar_golden_streamlit.py
```

## Decisões

- **Arredondamento como o Python.** `f"{v:.2f}"` desempata para o par
  (`1.125 -> 1.12`), e o `toFixed` do JS para cima (`1.13`). Com temperaturas
  inteiras, médias como 9/8 acontecem, então `lib/formato.ts` replica o Python.
- **Ausentes como no pandas.** Valores nulos se propagam nas contas e as médias
  os ignoram (`skipna`).
- **Gráficos próprios, sem biblioteca.** O Plotly liga os pontos de uma cidade
  mesmo quando falta um dia, mas abre um buraco quando o valor é nulo. As
  bibliotecas comuns de gráfico em React não distinguem os dois casos.
- **Cache de 1h.** O pipeline atualiza o banco uma vez por dia; a página é
  pré-renderizada e revalidada a cada hora (no Streamlit era o `st.cache_data`).
- **Filtro de cidade no navegador.** Trocar de cidade não faz nova requisição.

## Diferenças de apresentação

- Tabelas mostram decimais com 2 casas (o `st.dataframe` mostra o valor cru).
- Os gráficos têm tooltip e navegação por teclado, mas não têm zoom/pan como o Plotly.
- As versões antigas do dashboard (`dash1aversao.py`, `dash2aversao.py`) não foram migradas.
