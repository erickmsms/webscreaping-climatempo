# Dashboard — Qualidade da Previsão

Dashboard em **Next.js + React** que mede a qualidade da previsão do
Climatempo: compara a previsão coletada em D-1 com o dado de D e mostra
métricas de erro (MAE, RMSE, Bias, MAPE), acurácias, métricas por cidade,
séries de erro por dia, a base comparada e o ranking por score composto.

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
  painel.ts           modelo de tela: o que a página mostra para cada filtro
  formato.ts          formatação numérica idêntica ao Python
  cores.ts            cor fixa por cidade
components/           cartões, tabelas, gráficos e o painel (cliente)
tests/                testes unitários e de paridade
```

O cálculo fica todo em `lib/` (funções puras, testáveis sem o Next). Os
componentes só desenham o modelo de tela montado por `lib/painel.ts`.

## Origem e teste de paridade

Este dashboard substituiu o antigo, em Streamlit (`dashboard/app.py`). A última
versão em que os dois coexistem é o commit `c8b6151`.

`tests/paridade.test.ts` garante que as análises continuam idênticas às do
Streamlit. Ele usa dois arquivos congelados em `tests/fixtures/`:

- `dataset_climatempo.db`: uma cópia do banco na época da migração;
- `streamlit-golden.json`: tudo o que o `app.py` exibia com esse banco, para
  "Todas" e para cada cidade (métricas, tabelas e séries dos gráficos).

Com o mesmo banco, o front precisa exibir exatamente o mesmo. Como os arquivos
estão congelados, o teste não quebra quando o banco de produção é atualizado.
Se uma regra de cálculo mudar de propósito, ajuste o teste junto.

## Decisões

- **Arredondamento como o Python.** `f"{v:.2f}"` desempata para o par
  (`1.125 -> 1.12`), e o `toFixed` do JS para cima (`1.13`). Com temperaturas
  inteiras, médias como 9/8 acontecem, então `lib/formato.ts` replica o Python.
- **Ausentes como no pandas.** Valores nulos se propagam nas contas e as médias
  os ignoram (`skipna`).
- **Gráficos próprios, sem biblioteca.** Um dia sem coleta não interrompe a
  linha da cidade, mas um valor nulo interrompe. As bibliotecas comuns de
  gráfico em React não distinguem os dois casos.
- **Cache de 1h.** O pipeline atualiza o banco uma vez por dia; a página é
  pré-renderizada e revalidada a cada hora.
- **Filtro de cidade no navegador.** Trocar de cidade não faz nova requisição.
