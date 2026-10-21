"""Baixa do IBGE a área e o contorno dos municípios do dashboard.

Uso:
    python data/estacoes/baixar_municipios.py

Saída: data/estacoes/municipios.json. O dashboard usa esse arquivo para saber quantas
estações meteorológicas ficam dentro de cada cidade e a que distância do contorno ficam as demais.
"""

import gzip
import json
import urllib.request
from datetime import date
from pathlib import Path

SAIDA = Path(__file__).with_name("municipios.json")

# id da cidade no dashboard -> código do município no IBGE
MUNICIPIOS = {
    "RECIFE-PE": 2611606,
    "SAOPAULO-SP": 3550308,
    "AMERICANA-SP": 3501608,
    "PEDRA-PE": 2610806,
}

API = "https://servicodados.ibge.gov.br/api"


def obter(url):
    requisicao = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept-Encoding": "identity"})
    with urllib.request.urlopen(requisicao, timeout=60) as resposta:
        corpo = resposta.read()
    if corpo[:2] == b"\x1f\x8b":  # o IBGE responde comprimido mesmo sem o cabeçalho pedir
        corpo = gzip.decompress(corpo)
    return json.loads(corpo.decode("utf-8"))


def main():
    codigos = ",".join(str(c) for c in MUNICIPIOS.values())
    areas_bruto = obter(f"{API}/v3/agregados/1301/periodos/2010/variaveis/615?localidades=N6[{codigos}]")
    areas = {
        int(s["localidade"]["id"]): float(s["serie"]["2010"]) for s in areas_bruto[0]["resultados"][0]["series"]
    }

    municipios = []
    for cidade_id, codigo in MUNICIPIOS.items():
        nome = obter(f"{API}/v1/localidades/municipios/{codigo}")["nome"]
        malha = obter(f"{API}/v3/malhas/municipios/{codigo}?formato=application/vnd.geo+json&qualidade=intermediaria")
        geometria = malha["features"][0]["geometry"]
        municipios.append(
            {"cidade_id": cidade_id, "codigo_ibge": codigo, "nome": nome, "area_km2": areas[codigo], "geometria": geometria}
        )

    saida = {"fonte": API, "baixado_em": date.today().isoformat(), "municipios": municipios}
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(municipios)} municípios em {SAIDA} ({SAIDA.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
