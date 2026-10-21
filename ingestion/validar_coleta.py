"""Confere a coleta recém-gravada e sai com erro se algo estiver errado.

Lê do stdin as linhas novas do JSON Lines (as que a execução acabou de
acrescentar). Esperado: uma leitura "atual" e uma "previsao" de cada cidade do
spider, com temperatura e chuva legíveis.

    tail -n +<primeira linha nova> ../data/bronze/previsoes.jsonl | python validar_coleta.py
"""

import json
import re
import sys

from coleta.spiders.previsao import PrevisaoSpider

TIPOS = ("atual", "previsao")
TEMPERATURA = re.compile(r"^-?\d+°$")
CHUVA = re.compile(r"^\d+(\.\d+)?mm$")


def cidades_esperadas() -> set[str]:
    return {url.rstrip("/").split("/")[-1] for url in PrevisaoSpider.start_urls}


def validar(registros: list[dict]) -> list[str]:
    problemas = []
    esperados = {(c, t) for c in cidades_esperadas() for t in TIPOS}
    obtidos = [(r.get("cidade"), r.get("atualouprevisao")) for r in registros]

    for falta in sorted(esperados - set(obtidos)):
        problemas.append(f"faltou a leitura {falta[1]} de {falta[0]}")
    for repetido in sorted({o for o in obtidos if obtidos.count(o) > 1}):
        problemas.append(f"leitura repetida: {repetido[1]} de {repetido[0]}")

    for r in registros:
        onde = f"{r.get('atualouprevisao')} de {r.get('cidade')}"
        for campo in ("tmin", "tmax"):
            if not TEMPERATURA.match(str(r.get(campo))):
                problemas.append(f"{campo} ilegível em {onde}: {r.get(campo)!r}")
        if not CHUVA.match(str(r.get("chuva"))):
            problemas.append(f"chuva ilegível em {onde}: {r.get('chuva')!r}")
        if not (r.get("descricao") or "").strip():
            problemas.append(f"descrição vazia em {onde}")
    return problemas


def main() -> int:
    # A coleta é UTF-8 ("°"); não depender da codificação padrão do sistema.
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    registros = [json.loads(linha) for linha in sys.stdin if linha.strip()]
    if not registros:
        print("Nenhuma linha nova na coleta de hoje.")
        return 1

    problemas = validar(registros)
    if problemas:
        print(f"Coleta com {len(problemas)} problema(s):")
        for p in problemas:
            print(f"  - {p}")
        return 1

    print(f"Coleta ok: {len(registros)} leituras de {len(cidades_esperadas())} cidades.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
