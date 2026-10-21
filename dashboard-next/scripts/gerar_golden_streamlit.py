"""Gera o gabarito de paridade entre o dashboard Streamlit e o dashboard Next.js.

Roda o app Streamlit original (../dashboard/app.py) de forma headless com o
AppTest, para "Todas" e para cada cidade, e salva tudo que ele exibe (métricas,
tabelas e séries dos gráficos) em tests/fixtures/streamlit-golden.json.

O teste tests/paridade.test.ts compara o novo front contra esse arquivo.
Rode de novo sempre que o dataset_climatempo.db ou o app.py mudarem:

    pip install streamlit pandas plotly
    python scripts/gerar_golden_streamlit.py
"""

import base64
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
from streamlit.testing.v1 import AppTest

RAIZ_NEXT = Path(__file__).resolve().parents[1]
APP_STREAMLIT = RAIZ_NEXT.parent / "dashboard" / "app.py"
SAIDA = RAIZ_NEXT / "tests" / "fixtures" / "streamlit-golden.json"


def valor_json(v):
    if v is None:
        return None
    if isinstance(v, pd.Timestamp):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, float) and math.isnan(v):
        return None
    if hasattr(v, "item"):
        return valor_json(v.item())
    return v


def tabela_json(df: pd.DataFrame):
    return {
        "colunas": [str(c) for c in df.columns],
        "linhas": [[valor_json(v) for v in linha] for linha in df.itertuples(index=False)],
    }


def eixo_json(valores):
    # Plotly >= 6 serializa arrays numéricos como {"dtype": ..., "bdata": base64}.
    if isinstance(valores, dict) and "bdata" in valores:
        bruto = base64.b64decode(valores["bdata"])
        valores = np.frombuffer(bruto, dtype=np.dtype(valores["dtype"])).tolist()
    return [x[:10] if isinstance(x, str) and len(x) >= 10 and x[4] == "-" else valor_json(x) for x in valores]


def graficos_json(at: AppTest):
    graficos = []
    for el in at.get("plotly_chart"):
        spec = json.loads(el.proto.spec)
        graficos.append({
            "titulo": spec["layout"]["title"]["text"],
            "series": [
                {
                    "nome": trace.get("name", ""),
                    "x": eixo_json(trace["x"]),
                    "y": eixo_json(trace["y"]),
                }
                for trace in spec["data"]
            ],
        })
    return graficos


def capturar(at: AppTest):
    assert not at.exception, at.exception
    return {
        "metricas": [{"rotulo": m.label, "valor": m.value} for m in at.metric],
        "tabelas": [tabela_json(df.value) for df in at.dataframe],
        "graficos": graficos_json(at),
    }


def main():
    at = AppTest.from_file(str(APP_STREAMLIT), default_timeout=120).run()
    seletor = at.selectbox[0]
    opcoes = list(seletor.options)

    gabarito = {"opcoes_cidade": opcoes, "visoes": {}}
    for opcao in opcoes:
        at.selectbox[0].set_value(opcao).run()
        gabarito["visoes"][opcao] = capturar(at)

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(gabarito, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Gabarito salvo em {SAIDA} ({len(opcoes)} visões)")


if __name__ == "__main__":
    main()
