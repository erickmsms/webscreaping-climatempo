"""Baixa o catálogo de estações automáticas do INMET e guarda só as que ficam perto das cidades do dashboard.

Uso:
    python data/estacoes/baixar_estacoes.py                # baixa da API do INMET
    python data/estacoes/baixar_estacoes.py catalogo.json  # usa um catálogo já baixado

Saída: data/estacoes/inmet.json. O dashboard lê esse arquivo; ele não chama a API do INMET.
"""

import json
import math
import sys
import urllib.request
from datetime import date
from pathlib import Path

URL = "https://apitempo.inmet.gov.br/estacoes/T"
SAIDA = Path(__file__).with_name("inmet.json")

# Centro de cada município (mesmas coordenadas de dashboard/src/lib/analise/estacoes.ts).
CIDADES = {
    "RECIFE-PE": (-8.0476, -34.8770),
    "SAOPAULO-SP": (-23.5505, -46.6333),
    "AMERICANA-SP": (-22.7390, -47.3331),
    "PEDRA-PE": (-8.4958, -36.9514),
}
# Guarda as estações até este raio de qualquer cidade (o dashboard conta só as mais próximas).
RAIO_KM = 150


def distancia_km(lat1, lon1, lat2, lon2):
    p = math.pi / 180
    a = math.sin((lat2 - lat1) * p / 2) ** 2 + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(a))


def carregar_catalogo(caminho=None):
    if caminho:
        return json.loads(Path(caminho).read_text(encoding="utf-8"))
    requisicao = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(requisicao, timeout=60) as resposta:
        return json.loads(resposta.read().decode("utf-8"))


def main():
    catalogo = carregar_catalogo(sys.argv[1] if len(sys.argv) > 1 else None)
    estacoes = []
    for e in catalogo:
        if not e.get("VL_LATITUDE") or not e.get("VL_LONGITUDE"):
            continue
        lat, lon = float(e["VL_LATITUDE"]), float(e["VL_LONGITUDE"])
        if min(distancia_km(lat, lon, *c) for c in CIDADES.values()) > RAIO_KM:
            continue
        estacoes.append(
            {
                "codigo": e["CD_ESTACAO"],
                "nome": e["DC_NOME"],
                "uf": e["SG_ESTADO"],
                "latitude": lat,
                "longitude": lon,
                "altitude": float(e["VL_ALTITUDE"]) if e.get("VL_ALTITUDE") else None,
                "situacao": e["CD_SITUACAO"],
                "inicio": (e.get("DT_INICIO_OPERACAO") or "")[:10] or None,
            }
        )
    estacoes.sort(key=lambda e: e["codigo"])
    saida = {"fonte": URL, "baixado_em": date.today().isoformat(), "raio_km": RAIO_KM, "estacoes": estacoes}
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(estacoes)} estações em {SAIDA}")


if __name__ == "__main__":
    main()
