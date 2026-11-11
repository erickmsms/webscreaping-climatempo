"""O que é uma leitura legível, compartilhado entre o spider e os scripts.

O Climatempo às vezes devolve a página de uma cidade sem os dados do dia:
chuva "Sem dados", temperatura ou descrição "-". Esses valores são lacunas.
"""

import re

TEMPERATURA = re.compile(r"^-?\d+°$")
CHUVA = re.compile(r"^\d+(\.\d+)?mm$")


def lacunas(registro: dict) -> list[str]:
    """Campos de uma leitura que não vieram legíveis (vazio = leitura completa)."""
    faltando = []
    for campo in ("tmin", "tmax"):
        if not TEMPERATURA.match(str(registro.get(campo))):
            faltando.append(campo)
    if not CHUVA.match(str(registro.get("chuva"))):
        faltando.append("chuva")
    if not (registro.get("descricao") or "").strip().strip("-").strip():
        faltando.append("descricao")
    return faltando
