"""Lista as cidades do dia que precisam ser coletadas de novo.

Lê o histórico, olha a leitura mais recente de cada cidade e tipo na data
(UTC, a mesma regra do dashboard) e imprime, separadas por vírgula, as cidades
sem alguma das duas leituras ou com lacuna em alguma. Sem nenhuma, imprime
nada. O resultado vai direto para `scrapy crawl previsao -a cidades=...`.

    python cidades_com_lacuna.py ../data/bronze/previsoes.jsonl [AAAA-MM-DD]
"""

import json
import sys
from datetime import datetime, timezone

from coleta.leitura import lacunas
from coleta.spiders.previsao import PrevisaoSpider

TIPOS = ("atual", "previsao")


def cidades_esperadas() -> list[str]:
    return [url.rstrip("/").split("/")[-1] for url in PrevisaoSpider.start_urls]


def cidades_com_lacuna(registros: list[dict], data: str) -> list[str]:
    ultima: dict[tuple[str, str], dict] = {}
    for r in registros:
        if str(r.get("dt_ingest", ""))[:10] != data:
            continue
        chave = (r.get("cidade"), r.get("atualouprevisao"))
        if chave not in ultima or r["dt_ingest"] > ultima[chave]["dt_ingest"]:
            ultima[chave] = r

    return [
        cidade
        for cidade in cidades_esperadas()
        if any(t not in {k[1] for k in ultima if k[0] == cidade} or lacunas(ultima[(cidade, t)]) for t in TIPOS)
    ]


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__, file=sys.stderr)
        return 2
    data = argv[2] if len(argv) > 2 else datetime.now(timezone.utc).strftime("%Y-%m-%d")
    with open(argv[1], encoding="utf-8") as f:
        registros = [json.loads(linha) for linha in f if linha.strip()]
    print(",".join(cidades_com_lacuna(registros, data)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
