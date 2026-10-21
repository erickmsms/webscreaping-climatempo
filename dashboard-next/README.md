# Dashboard — Qualidade da Previsão

Dashboard em **Next.js + React** que mede a qualidade da previsão do
Climatempo: compara a previsão coletada em D-1 com o dado de D e mostra
métricas de erro (MAE, RMSE, Bias, MAPE), acurácias, métricas por cidade,
séries de erro por dia, a base comparada e o ranking por score composto.

O visual é o de um boletim: abre com a conclusão em manchete, gerada a partir
dos dados, seguida dos números principais e do ranking. Os detalhes vêm depois.

Ele lê as tabelas gold geradas pelo dbt em `../dataset_climatempo.db`.

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
  analise.ts          cálculos (join, métricas, scores)
  painel.ts           modelo de tela: os números que a página mostra para cada filtro
  textos.ts           manchete, linha fina e anotações, gerados dos números
  formato.ts          formatação brasileira, com o arredondamento do Python
  cidades.ts          nome legível da cidade a partir do id ("SAOPAULO-SP")
  cores.ts            cor fixa por cidade
components/           cabeçalho, números, ranking, gráficos, tabelas e o painel
tests/                testes unitários e de paridade
```

O cálculo fica todo em `lib/` (funções puras, testáveis sem o Next). O modelo
de `lib/painel.ts` só tem números; rótulos e formatação ficam nos componentes.

## Origem e teste de paridade

Este dashboard substituiu o antigo, em Streamlit (`dashboard/app.py`). A última
versão em que os dois coexistem é o commit `c8b6151`. Prints de uma versão
anterior do dashboard Streamlit estão em
[`docs/img/streamlit-antigo/`](../docs/img/streamlit-antigo/).

`tests/paridade.test.ts` garante que as análises continuam idênticas às do
Streamlit. Ele usa dois arquivos congelados em `tests/fixtures/`:

- `dataset_climatempo.db`: uma cópia do banco na época da migração;
- `streamlit-golden.json`: tudo o que o `app.py` exibia com esse banco, para
  "Todas" e para cada cidade (métricas, tabelas e séries dos gráficos).

A tela atual tem outro visual e outros rótulos, então o teste reconstrói, a
partir do modelo numérico, o que o Streamlit mostrava (mesmos rótulos, 2 casas,
arredondamento do Python) e exige que seja idêntico ao gabarito. Como os
arquivos estão congelados, o teste não quebra quando o banco de produção é
atualizado. Se uma regra de cálculo mudar de propósito, ajuste o teste junto.

## Decisões

- **Arredondamento como o Python.** `f"{v:.2f}"` desempata para o par
  (`1.125 -> 1.12`), e o `toFixed` do JS para cima (`1.13`). Com temperaturas
  inteiras, médias como 9/8 acontecem, então `lib/formato.ts` replica o Python.
- **Formato brasileiro na tela.** Vírgula decimal e sinal de menos tipográfico;
  erros com 2 casas, porcentagens e scores com 1.
- **Textos gerados dos dados.** A manchete, a linha fina ("a temperatura passa
  no teste…") e as anotações do gráfico de chuva saem de `lib/textos.ts`, com
  os critérios em constantes. Se os dados mudarem, as frases acompanham.
- **Ausentes como no pandas.** Valores nulos se propagam nas contas e as médias
  os ignoram (`skipna`).
- **Gráficos próprios, sem biblioteca.** Um dia sem coleta não interrompe a
  linha da cidade, mas um valor nulo interrompe. As bibliotecas comuns de
  gráfico em React não distinguem os dois casos.
- **Cache de 1h.** O pipeline atualiza o banco uma vez por dia; a página é
  pré-renderizada e revalidada a cada hora.
- **Filtro de cidade no navegador.** Trocar de cidade não faz nova requisição.
