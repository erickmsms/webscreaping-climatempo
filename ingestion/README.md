# Ingestão

Coleta as previsões do Climatempo com Scrapy e acrescenta ao histórico em
`../data/bronze/previsoes.jsonl`.

```
scrapy.cfg
requirements.txt
coleta/
  settings.py           respeita robots.txt, 1 requisição por vez com intervalo
  spiders/previsao.py   spider: hoje e amanhã de cada cidade
validar_coleta.py       confere a coleta recém-gravada; sai com erro se algo estiver errado
```

## Como rodar

Requer Python 3.11+. Todos os comandos a partir desta pasta.

```bash
pip install -r requirements.txt

# -o ACRESCENTA ao arquivo (o histórico fica nele). Não use -O: ele sobrescreve.
scrapy crawl previsao -o ../data/bronze/previsoes.jsonl
```

Quem roda isso todo dia é o workflow `.github/workflows/coleta.yml`.

## Validação

Depois da coleta, passa as linhas novas pelo validador:

```bash
antes=$(wc -l < ../data/bronze/previsoes.jsonl)
scrapy crawl previsao -o ../data/bronze/previsoes.jsonl
tail -n +$((antes + 1)) ../data/bronze/previsoes.jsonl | python validar_coleta.py
```

Ele exige uma leitura `atual` e uma `previsao` de cada cidade do spider, sem
repetição, com temperatura (`20°`), chuva (`1.0mm`) e descrição legíveis.

## Formato dos dados

Uma linha JSON por cidade e tipo, a cada execução:

```json
{"cidade": "recife-pe", "atualouprevisao": "atual", "tmin": "24°", "tmax": "31°", "descricao": "...", "chuva": "1.0mm", "dt_ingest": "2026-10-20T19:50:14+00:00"}
```

## Cidades

As URLs ficam em `start_urls`, no spider. São 34:

- as 4 originais: Pedra (PE), São Paulo (SP), Recife (PE) e Americana (SP);
- desde 21/10/2026, as demais 25 capitais;
- desde 21/10/2026, 5 cidades sorteadas entre os municípios do IBGE: Santa
  Rosa do Sul (SC), Itaperuna (RJ), Jaboticaba (RS), Careiro da Várzea (AM) e
  Aperibé (RJ).

Os ids das URLs vêm do sitemap do Climatempo
(`/sitemap/previsoes-cidades-15-dias.xml`). Todas entram na coleta e na
validação, mas o dashboard ainda exibe só as 4 originais (`CIDADES_EXIBIDAS`,
em `dashboard/src/lib/apresentacao/cidades.ts`).
