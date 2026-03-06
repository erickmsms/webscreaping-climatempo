import streamlit as st
import pandas as pd
import sqlite3
from pathlib import Path
import plotly.express as px

# -----------------------------
# CONFIG
# -----------------------------
st.set_page_config(
    page_title="Climatempo Forecast Quality",
    page_icon="🌦️",
    layout="wide"
)

st.title("🌦️ Qualidade da Previsão - Climatempo")

# -----------------------------
# DB PATH
# -----------------------------
DB_PATH = Path(__file__).resolve().parents[1] / "dataset_climatempo.db"

if not DB_PATH.exists():
    st.error("Não encontrei dataset_climatempo.db.")
    st.stop()

# -----------------------------
# Helpers
# -----------------------------
def get_connection():
    return sqlite3.connect(str(DB_PATH), timeout=30)

@st.cache_data(show_spinner=True)
def load_table(table_name: str) -> pd.DataFrame:
    conn = get_connection()
    df = pd.read_sql_query(f'SELECT * FROM "{table_name}"', conn)
    conn.close()
    return df

def mae(err: pd.Series) -> float:
    err = pd.to_numeric(err, errors="coerce").dropna()
    if err.empty:
        return float("nan")
    return float(err.abs().mean())

def rmse(err: pd.Series) -> float:
    err = pd.to_numeric(err, errors="coerce").dropna()
    if err.empty:
        return float("nan")
    return float((err.pow(2).mean()) ** 0.5)

def bias(err: pd.Series) -> float:
    err = pd.to_numeric(err, errors="coerce").dropna()
    if err.empty:
        return float("nan")
    return float(err.mean())

def mape(prev: pd.Series, real: pd.Series) -> float:
    prev = pd.to_numeric(prev, errors="coerce")
    real = pd.to_numeric(real, errors="coerce")
    denom = real.abs().replace(0, pd.NA)
    val = ((prev - real).abs() / denom).dropna()
    if val.empty:
        return float("nan")
    return float(val.mean() * 100)

def fmt_num(v, suffix=""):
    if pd.isna(v):
        return "—"
    return f"{v:.2f}{suffix}"

# -----------------------------
# Carregamento das GOLD
# -----------------------------
df_real = load_table("gold_climatempo_dadosdia").copy()
df_prev = load_table("gold_climatempo_previsoes").copy()

# -----------------------------
# Tipagem / saneamento
# -----------------------------
df_real["data_coleta"] = pd.to_datetime(df_real["data_coleta"], errors="coerce")
df_prev["data_coleta"] = pd.to_datetime(df_prev["data_coleta"], errors="coerce")
df_prev["data_previsao"] = pd.to_datetime(df_prev["data_previsao"], errors="coerce")

df_real = df_real.dropna(subset=["cidade_id", "data_coleta"])
df_prev = df_prev.dropna(subset=["cidade_id", "data_coleta", "data_previsao"])

df_real["cidade_id"] = df_real["cidade_id"].astype(str)
df_prev["cidade_id"] = df_prev["cidade_id"].astype(str)

for col in ["temp_min", "temp_max", "chuva_mm", "amplitude_termica"]:
    if col in df_real.columns:
        df_real[col] = pd.to_numeric(df_real[col], errors="coerce")
    if col in df_prev.columns:
        df_prev[col] = pd.to_numeric(df_prev[col], errors="coerce")

# -----------------------------
# JOIN D-1 -> D
# -----------------------------
df_real_join = df_real.rename(columns={
    "temp_min": "real_temp_min",
    "temp_max": "real_temp_max",
    "chuva_mm": "real_chuva_mm",
    "amplitude_termica": "real_amplitude_termica",
    "clima_desc": "real_clima_desc",
    "data_coleta": "dia_real"
})

df_prev_join = df_prev.rename(columns={
    "temp_min": "prev_temp_min",
    "temp_max": "prev_temp_max",
    "chuva_mm": "prev_chuva_mm",
    "amplitude_termica": "prev_amplitude_termica",
    "clima_desc": "prev_clima_desc",
    "data_coleta": "dia_coleta_prev",
    "data_previsao": "dia_previsto"
})

df_cmp = df_prev_join.merge(
    df_real_join,
    left_on=["cidade_id", "dia_previsto"],
    right_on=["cidade_id", "dia_real"],
    how="inner"
)

df_cmp = df_cmp[
    df_cmp["dia_coleta_prev"] == (df_cmp["dia_real"] - pd.Timedelta(days=1))
].copy()

if df_cmp.empty:
    st.warning("Não encontrei pares válidos de previsão D-1 → real D.")
    st.stop()

# -----------------------------
# Erros base
# -----------------------------
df_cmp["erro_temp_max"] = df_cmp["prev_temp_max"] - df_cmp["real_temp_max"]
df_cmp["erro_temp_min"] = df_cmp["prev_temp_min"] - df_cmp["real_temp_min"]
df_cmp["erro_chuva_mm"] = df_cmp["prev_chuva_mm"] - df_cmp["real_chuva_mm"]
df_cmp["erro_amp_termica"] = df_cmp["prev_amplitude_termica"] - df_cmp["real_amplitude_termica"]

df_cmp["real_choveu"] = df_cmp["real_chuva_mm"].fillna(0) > 0
df_cmp["prev_choveu"] = df_cmp["prev_chuva_mm"].fillna(0) > 0

# -----------------------------
# Seletor no topo à direita
# -----------------------------
header_left, header_right = st.columns([6, 2])

with header_left:
    st.caption("Comparação entre previsão coletada em D-1 e valor real observado em D.")

with header_right:
    cidades_disponiveis = sorted(df_cmp["cidade_id"].dropna().unique().tolist())
    cidade_opcoes = ["Todas"] + cidades_disponiveis
    cidade_sel = st.selectbox(
        "Cidade",
        options=cidade_opcoes,
        index=0
    )

# aplica filtro
if cidade_sel == "Todas":
    df_view = df_cmp.copy()
    subtitulo = "Visão consolidada de todas as cidades"
else:
    df_view = df_cmp[df_cmp["cidade_id"] == cidade_sel].copy()
    subtitulo = f"Visão filtrada para cidade {cidade_sel}"

if df_view.empty:
    st.warning("Sem dados para o filtro selecionado.")
    st.stop()

st.markdown("---")
st.header("🎯 Qualidade da Previsão (D-1 → D)")
st.caption(subtitulo)

# -----------------------------
# Métricas gerais
# -----------------------------
st.subheader("📌 Métricas gerais")

c1, c2, c3, c4 = st.columns(4)
c1.metric("Linhas comparadas", f"{len(df_view)}")
c2.metric("Cidades", f"{df_view['cidade_id'].nunique()}")
c3.metric("Primeira data", f"{df_view['dia_real'].min().date()}")
c4.metric("Última data", f"{df_view['dia_real'].max().date()}")

# -----------------------------
# Bloco temperatura máxima
# -----------------------------
st.markdown("### 🌡️ Temperatura Máx (°C)")
a, b, c, d = st.columns(4)
a.metric("MAE", fmt_num(mae(df_view["erro_temp_max"])))
b.metric("RMSE", fmt_num(rmse(df_view["erro_temp_max"])))
c.metric("Bias", fmt_num(bias(df_view["erro_temp_max"])))
d.metric("MAPE", fmt_num(mape(df_view["prev_temp_max"], df_view["real_temp_max"]), "%"))

# -----------------------------
# Bloco temperatura mínima
# -----------------------------
st.markdown("### 🌡️ Temperatura Mín (°C)")
a, b, c, d = st.columns(4)
a.metric("MAE", fmt_num(mae(df_view["erro_temp_min"])))
b.metric("RMSE", fmt_num(rmse(df_view["erro_temp_min"])))
c.metric("Bias", fmt_num(bias(df_view["erro_temp_min"])))
d.metric("MAPE", fmt_num(mape(df_view["prev_temp_min"], df_view["real_temp_min"]), "%"))

# -----------------------------
# Bloco chuva
# -----------------------------
st.markdown("### 🌧️ Chuva (mm)")
a, b, c = st.columns(3)
a.metric("MAE", fmt_num(mae(df_view["erro_chuva_mm"])))
b.metric("RMSE", fmt_num(rmse(df_view["erro_chuva_mm"])))
c.metric("Bias", fmt_num(bias(df_view["erro_chuva_mm"])))

# -----------------------------
# Classificação / chuva
# -----------------------------
st.markdown("### 📊 Métricas de Classificação e Chuva")

col1, col2, col3 = st.columns(3)

acc_desc = (
    df_view["real_clima_desc"].fillna("") ==
    df_view["prev_clima_desc"].fillna("")
).mean() * 100

acc_chuva_bin = (
    df_view["real_choveu"] == df_view["prev_choveu"]
).mean() * 100

real = df_view["real_chuva_mm"].fillna(0).astype(float)
prev = df_view["prev_chuva_mm"].fillna(0).astype(float)
mask = real > 0

if mask.any():
    mape_chuva = ((prev[mask] - real[mask]).abs() / real[mask]).mean() * 100
    acc_pct_chuva = 100 - mape_chuva
else:
    acc_pct_chuva = float("nan")

col1.metric("✅ Acurácia: Descrição do Clima", fmt_num(acc_desc, "%"))
col2.metric("🌧️ Acurácia: Choveu vs Não", fmt_num(acc_chuva_bin, "%"))
col3.metric("🎯 Acurácia % Volume Chuva", fmt_num(acc_pct_chuva, "%"))

st.caption("Volume percentual calculado apenas em dias com chuva real > 0.")
st.caption("Bias > 0 indica superestimação; Bias < 0 indica subestimação.")

# -----------------------------
# Métricas por cidade
# Só faz sentido quando estiver em 'Todas'
# -----------------------------
if cidade_sel == "Todas":
    st.subheader("🏙️ Métricas por cidade")

    df_city = (
        df_view.groupby("cidade_id", as_index=False)
        .agg(
            n=("cidade_id", "size"),
            mae_temp_max=("erro_temp_max", lambda s: float(s.abs().mean())),
            rmse_temp_max=("erro_temp_max", lambda s: float((s.pow(2).mean()) ** 0.5)),
            mae_temp_min=("erro_temp_min", lambda s: float(s.abs().mean())),
            rmse_temp_min=("erro_temp_min", lambda s: float((s.pow(2).mean()) ** 0.5)),
            mae_chuva=("erro_chuva_mm", lambda s: float(s.abs().mean())),
            acc_chuva=("real_choveu", lambda s: float((s == df_view.loc[s.index, "prev_choveu"]).mean() * 100)),
        )
        .sort_values(["mae_temp_max", "mae_chuva"], ascending=[False, False])
    )

    st.dataframe(df_city, use_container_width=True)

# -----------------------------
# Séries temporais de erro
# -----------------------------
st.subheader("📈 Erro ao longo do tempo")

df_plot = df_view.sort_values("dia_real")

color_col = "cidade_id" if cidade_sel == "Todas" else None

fig1 = px.line(
    df_plot,
    x="dia_real",
    y="erro_temp_max",
    color=color_col,
    title="Erro Temp. Máx (Previsto - Real) por dia"
)
st.plotly_chart(fig1, use_container_width=True)

fig2 = px.line(
    df_plot,
    x="dia_real",
    y="erro_temp_min",
    color=color_col,
    title="Erro Temp. Mín (Previsto - Real) por dia"
)
st.plotly_chart(fig2, use_container_width=True)

fig3 = px.line(
    df_plot,
    x="dia_real",
    y="erro_chuva_mm",
    color=color_col,
    title="Erro Chuva (mm) (Previsto - Real) por dia"
)
st.plotly_chart(fig3, use_container_width=True)

# -----------------------------
# Base comparada
# -----------------------------
with st.expander("🔎 Ver base comparada (D-1 → D)"):
    cols_show = [
        "cidade_id",
        "dia_coleta_prev", "dia_previsto", "dia_real",
        "prev_temp_min", "real_temp_min", "erro_temp_min",
        "prev_temp_max", "real_temp_max", "erro_temp_max",
        "prev_chuva_mm", "real_chuva_mm", "erro_chuva_mm",
        "prev_clima_desc", "real_clima_desc"
    ]
    cols_show = [c for c in cols_show if c in df_view.columns]
    st.dataframe(df_view[cols_show], use_container_width=True)

# -----------------------------
# Ranking de precisão
# Só faz sentido quando estiver em 'Todas'
# -----------------------------
if cidade_sel == "Todas":
    st.subheader("🏆 Ranking de Precisão por Cidade (Score Composto)")

    abs_err_temp_max = df_view["erro_temp_max"].abs()
    abs_err_temp_min = df_view["erro_temp_min"].abs()
    df_view["abs_err_temp_media"] = (abs_err_temp_max + abs_err_temp_min) / 2

    real = df_view["real_chuva_mm"].fillna(0).astype(float)
    prev = df_view["prev_chuva_mm"].fillna(0).astype(float)
    den = (pd.concat([real, prev], axis=1).max(axis=1)).replace(0, 1e-9)

    df_view["chuva_prox"] = (1 - ((prev - real).abs() / den)).clip(lower=0, upper=1)
    df_view["clima_match"] = (
        df_view["real_clima_desc"].fillna("") ==
        df_view["prev_clima_desc"].fillna("")
    ).astype(int)

    df_rank = (
        df_view.groupby("cidade_id", as_index=False)
        .agg(
            n=("cidade_id", "size"),
            mae_temp=("abs_err_temp_media", "mean"),
            chuva_score=("chuva_prox", "mean"),
            clima_score=("clima_match", "mean"),
        )
    )

    TEMP_CAP = 3.0
    W_TEMP = 0.5
    W_CHUVA = 0.4
    W_CLIMA = 0.1

    df_rank["temp_score"] = (1 - (df_rank["mae_temp"] / TEMP_CAP)).clip(0, 1) * 100
    df_rank["chuva_score"] = df_rank["chuva_score"] * 100
    df_rank["clima_score"] = df_rank["clima_score"] * 100

    df_rank["score_final"] = (
        W_TEMP * df_rank["temp_score"] +
        W_CHUVA * df_rank["chuva_score"] +
        W_CLIMA * df_rank["clima_score"]
    )

    df_rank = df_rank.sort_values("score_final", ascending=False).reset_index(drop=True)

    c1, c2, c3 = st.columns(3)
    c1.metric("🥇 Cidade #1", df_rank.iloc[0]["cidade_id"])
    c2.metric("⭐ Score #1", f"{df_rank.iloc[0]['score_final']:.2f}")
    c3.metric("📌 Cidades no ranking", f"{len(df_rank)}")

    df_display = df_rank[[
        "cidade_id",
        "score_final",
        "temp_score",
        "chuva_score",
        "clima_score"
    ]].rename(columns={
        "cidade_id": "CidadeID",
        "score_final": "Score Final",
        "temp_score": "Score Temperatura",
        "chuva_score": "Score Chuva",
        "clima_score": "Score Descrição"
    })

    st.dataframe(
        df_display.style.format({
            "Score Final": "{:.2f}",
            "Score Temperatura": "{:.2f}",
            "Score Chuva": "{:.2f}",
            "Score Descrição": "{:.2f}",
        }),
        use_container_width=True
    )

    top10 = (
        df_rank
        .sort_values("score_final", ascending=False)
        .head(10)
        .copy()
    )

    fig_rank = px.bar(
        top10,
        x="score_final",
        y="cidade_id",
        orientation="h",
        title="Ranking - Cidades por Score Final (0-100)"
    )

    fig_rank.update_layout(
        yaxis=dict(autorange="reversed")
    )

    st.plotly_chart(fig_rank, use_container_width=True)

    st.caption(
        f"Score Final = {int(W_TEMP*100)}% Temperatura + "
        f"{int(W_CHUVA*100)}% Chuva + "
        f"{int(W_CLIMA*100)}% Descrição. "
        f"Score Temperatura usa limite de {TEMP_CAP}°C "
        f"(MAE ≥ {TEMP_CAP} → 0 pontos)."
    )
else:
    st.subheader("🏆 Score da cidade selecionada")

    abs_err_temp_max = df_view["erro_temp_max"].abs()
    abs_err_temp_min = df_view["erro_temp_min"].abs()
    mae_temp = ((abs_err_temp_max + abs_err_temp_min) / 2).mean()

    real = df_view["real_chuva_mm"].fillna(0).astype(float)
    prev = df_view["prev_chuva_mm"].fillna(0).astype(float)
    den = (pd.concat([real, prev], axis=1).max(axis=1)).replace(0, 1e-9)
    chuva_prox = (1 - ((prev - real).abs() / den)).clip(lower=0, upper=1).mean()

    clima_match = (
        df_view["real_clima_desc"].fillna("") ==
        df_view["prev_clima_desc"].fillna("")
    ).astype(int).mean()

    TEMP_CAP = 3.0
    W_TEMP = 0.5
    W_CHUVA = 0.4
    W_CLIMA = 0.1

    temp_score = max(0, min(100, (1 - (mae_temp / TEMP_CAP)) * 100)) if pd.notna(mae_temp) else float("nan")
    chuva_score = chuva_prox * 100 if pd.notna(chuva_prox) else float("nan")
    clima_score = clima_match * 100 if pd.notna(clima_match) else float("nan")

    score_final = (
        W_TEMP * temp_score +
        W_CHUVA * chuva_score +
        W_CLIMA * clima_score
    )

    s1, s2, s3, s4 = st.columns(4)
    s1.metric("Cidade", cidade_sel)
    s2.metric("Score Final", fmt_num(score_final))
    s3.metric("Score Temperatura", fmt_num(temp_score))
    s4.metric("Score Chuva", fmt_num(chuva_score))

    st.caption(
        f"Score Final = {int(W_TEMP*100)}% Temperatura + "
        f"{int(W_CHUVA*100)}% Chuva + "
        f"{int(W_CLIMA*100)}% Descrição."
    )