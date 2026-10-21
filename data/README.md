# Dados

`bronze/previsoes.jsonl` é o histórico completo da coleta, em JSON Lines (uma
linha por cidade, tipo e execução). O workflow diário acrescenta ao arquivo; é
a única fonte de dados do dashboard.

## De onde veio

Junta duas fontes, sem duplicatas:

- a coleta feita à mão neste repositório, de 16/02 a 06/03/2026;
- o histórico do repositório `githubactions-screapy`, que coleta desde
  21/02/2026. Foi importado em 21/10/2026 (leitura apenas; aquele repositório
  não foi alterado).

Quando há mais de uma leitura da mesma cidade e tipo no mesmo dia (UTC), o
dashboard usa a mais recente.

## Leituras ilegíveis

O site às vezes devolve `-` no lugar da temperatura ou deixa a chuva vazia
(04/10 e 29/09/2026 em São Paulo, por exemplo). Ficam no arquivo como vieram,
e o dashboard as trata como ausentes.
