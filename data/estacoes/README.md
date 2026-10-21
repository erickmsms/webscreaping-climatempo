# Estações meteorológicas

Dois arquivos alimentam a seção "Estações Meteorológicas" da aba "Ciência de Dados":

- `inmet.json`: catálogo de estações automáticas do INMET que ficam até 150 km das cidades do dashboard
  (código, nome, coordenadas, altitude, situação e início de operação).
- `municipios.json`: área e contorno (limites do IBGE) dos municípios do dashboard.

Com eles, o dashboard conta quantas estações operantes ficam **dentro** de cada município, quantas ficam no
**entorno** (até 50 km do limite) e calcula um índice de cobertura: uma estação dentro da cidade vale 1; fora, o
valor cai com a distância ao limite, medida em raios da cidade (raio de um círculo com a área do município).

O dashboard só lê os arquivos; ele não chama as APIs. Para atualizar:

```bash
python data/estacoes/baixar_estacoes.py
python data/estacoes/baixar_municipios.py
```

`baixar_estacoes.py` baixa `https://apitempo.inmet.gov.br/estacoes/T` e guarda só as estações próximas.
`baixar_municipios.py` busca área e contorno na API de localidades e malhas do IBGE. Ao incluir uma cidade nova no
dashboard, acrescente-a nos dois scripts (as coordenadas ficam em `baixar_estacoes.py`; o código do município do
IBGE, em `baixar_municipios.py`).

O catálogo mostra onde as estações ficam; as medições delas não são usadas. O "real" do dashboard continua sendo o
registro do Climatempo.
