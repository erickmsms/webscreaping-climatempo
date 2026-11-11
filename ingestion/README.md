# Ingestão

Coleta as previsões do Climatempo com Scrapy e acrescenta ao histórico em
`../data/bronze/previsoes.jsonl`.

```
scrapy.cfg
requirements.txt
coleta/
  settings.py           respeita robots.txt, 1 requisição por vez com intervalo
  spiders/previsao.py   spider: hoje e amanhã de cada cidade
coleta/leitura.py      o que é uma leitura legível (e o que é lacuna)
validar_coleta.py       confere a coleta recém-gravada; sai com erro se algo estiver errado
cidades_com_lacuna.py   lista as cidades de hoje que precisam de recoleta
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
repetição. Valores ilegíveis (chuva "Sem dados", temperatura ou descrição "-")
são lacunas do site e viram aviso; só falha se faltar ou repetir leitura, ou se
mais da metade das cidades vier com lacuna.

## Recoleta

Para preencher lacunas, o spider aceita uma lista de cidades. Nesse modo ele
busca só elas e **não grava leituras que ainda tenham lacuna**, para que a
leitura mais recente do dia (a que o dashboard usa) nunca seja pior que a
anterior:

```bash
cidades=$(python cidades_com_lacuna.py ../data/bronze/previsoes.jsonl)
scrapy crawl previsao -a cidades="$cidades" -o ../data/bronze/previsoes.jsonl
```

Quem roda isso todo dia, às 19h de Brasília, é `.github/workflows/recoleta.yml`.

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
