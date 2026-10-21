# Dashboard — Qualidade da Previsão

Dashboard em **Next.js + React** que mede a qualidade da previsão do
Climatempo: compara a previsão coletada em D-1 com o dado de D e mostra
métricas de erro (MAE, RMSE, Bias, MAPE), acurácias, métricas por cidade,
séries de erro por dia, a base comparada e o ranking por score composto.

O visual é o de um boletim: abre com a conclusão em manchete, gerada a partir
dos dados, seguida dos números principais e do ranking. Os detalhes vêm depois.

Ele lê o histórico da coleta em `../data/bronze/previsoes.jsonl` e calcula tudo
a partir dele, sem banco de dados. A cada coleta diária, o dado novo aparece.

## Como rodar

Requer Node.js 20.9 ou mais novo.

```bash
cd dashboard
npm install
npm run dev
```

Abra http://localhost:3000.

Para usar outro arquivo de dados, defina `CLIMATEMPO_DATA_PATH` com o caminho do `.jsonl`.

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm test` | Testes unitários e de paridade (Vitest) |
| `npm run typecheck` | Checagem de tipos |
| `npm run lint` | ESLint |

## Estrutura

```
src/
  app/                      página, layout e estilos (App Router)
  components/
    boletim/                Boletim (a página), Cabecalho, NumerosPrincipais,
                            Ranking, QuadroMetricas
    graficos/               GraficoLinhas
    ui/                     Aviso, TabelaDados (genéricos)
  lib/
    dados/
      bronze.ts             leitura do histórico da coleta (só no servidor)
      carregar.ts           base comparada D-1 -> D com cache de 1h ("use cache")
    analise/
      gold.ts               coleta bruta -> dado do dia e previsão para amanhã
                            (leituras ilegíveis viram ausentes, não zero)
      comparacao.ts         tipagem, saneamento e JOIN D-1 -> D
      metricas.ts           erros, acertos, scores e ranking
      painel.ts             modelo de tela: os números de cada filtro
    apresentacao/
      formato.ts            formatação brasileira, com o arredondamento do Python
      textos.ts             manchete, linha fina e anotações, gerados dos números
      cidades.ts            nome legível da cidade a partir do id ("SAOPAULO-SP")
      cores.ts              cor fixa por cidade
tests/                      testes unitários e de paridade
```

`lib/` não depende de React nem do Next: são funções puras, testáveis isoladas.
O modelo de `lib/analise/painel.ts` só tem números; rótulos e formatação ficam
em `lib/apresentacao/` e nos componentes.

## Origem e teste de paridade

Este dashboard substituiu o antigo, em Streamlit (`dashboard/app.py`), que lia
um SQLite montado por um projeto dbt. A última versão em que o Streamlit existe
é o commit `c8b6151`, e a última com o dbt é a `388077a`. O print da DAG do
Airflow da época do dbt está em [`docs/img/airflow-dag.png`](../docs/img/airflow-dag.png).

`tests/paridade.test.ts` garante que as análises continuam idênticas às do
Streamlit. Ele usa dois arquivos congelados em `tests/fixtures/`:

- `bronze.jsonl`: a coleta bruta da época da migração (16/02 a 06/03/2026);
- `streamlit-golden.json`: tudo o que o `app.py` exibia com esses dados, para
  "Todas" e para cada cidade (métricas, tabelas e séries dos gráficos).

A coleta passa pela `lib/analise/gold.ts` (que substituiu as camadas silver e
gold do dbt) e o resultado precisa ser idêntico ao gabarito. Quando a troca do
dbt por esse código foi feita, as tabelas dos dois foram comparadas linha a
linha e eram iguais.

A tela atual tem outro visual e outros rótulos, então o teste reconstrói, a
partir do modelo numérico, o que o Streamlit mostrava (mesmos rótulos, 2 casas,
arredondamento do Python). Como os arquivos estão congelados, o teste não quebra
quando o histórico cresce. Se uma regra de cálculo mudar de propósito, ajuste o
teste junto.

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
- **Leitura ilegível é ausente, não zero.** O `-` que o site às vezes devolve no
  lugar da temperatura, e a chuva vazia, viram `null`. O dbt antigo convertia
  isso em 0 sem avisar.
- **Explicações em tooltips, não em rodapé.** Cada termo técnico (MAE, RMSE,
  viés, MAPE, acertos, score) tem um ícone "?" ao lado com a explicação, em
  `components/ui/Dica.tsx`. Os textos ficam em `lib/apresentacao/glossario.ts`,
  com os pesos e limites vindos das mesmas constantes do cálculo. O balão abre
  com mouse, teclado (foco) ou toque, fecha com Esc ou ao tocar fora, e tem
  posição fixa para não ser cortado por tabelas com rolagem.
- **Gráficos próprios, sem biblioteca.** Um dia sem coleta não interrompe a
  linha da cidade, mas um valor nulo interrompe. As bibliotecas comuns de
  gráfico em React não distinguem os dois casos.
- **Cache de 1h.** O workflow acrescenta a coleta uma vez por dia; a página é
  pré-renderizada e revalidada a cada hora.
- **Filtro de cidade no navegador.** Trocar de cidade não faz nova requisição.
