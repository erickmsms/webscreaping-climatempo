import streamlit as st
import pandas as pd
import sqlite3
from pathlib import Path
import plotly.express as px

# -----------------------------
# CONFIG
# -----------------------------
st.set_page_config(page_title="Climatempo Forecast Quality", page_icon="🌦️", layout="wide")

st.title("🌦️ Qualidade da Previsão - Climatempo")
st.caption("Comparação entre previsão (D-1) e valor real observado (D)")

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

st.markdown("---")
st.header("🎯 Qualidade da Previsão (D-1 → D)")

# Carrega as duas tabelas GOLD
df_real = load_table("gold_climatempo_dadosdia").copy()
df_prev = load_table("gold_climatempo_previsoes").copy()

# Tipagem de datas
df_real["data_coleta"] = pd.to_datetime(df_real["data_coleta"], errors="coerce")
df_prev["data_coleta"] = pd.to_datetime(df_prev["data_coleta"], errors="coerce")      # dia que coletou a previsão
df_prev["data_previsao"] = pd.to_datetime(df_prev["data_previsao"], errors="coerce")  # dia previsto

# Remove linhas quebradas
df_real = df_real.dropna(subset=["cidade_id", "data_coleta"])
df_prev = df_prev.dropna(subset=["cidade_id", "data_coleta", "data_previsao"])

# Normaliza numéricos (pra não dar BO se vier string)
for col in ["temp_min", "temp_max", "chuva_mm", "amplitude_termica"]:
    if col in df_real.columns:
        df_real[col] = pd.to_numeric(df_real[col], errors="coerce")
    if col in df_prev.columns:
        df_prev[col] = pd.to_numeric(df_prev[col], errors="coerce")

# ---------------------------------------------------
# JOIN: previsão (coletada em D-1) para dia D  VS real do dia D
# Condição:
#   prev.data_previsao == real.data_coleta
#   prev.data_coleta   == real.data_coleta - 1 dia
# ---------------------------------------------------
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

# filtra apenas previsões do dia anterior (D-1 -> D)
df_cmp = df_cmp[df_cmp["dia_coleta_prev"] == (df_cmp["dia_real"] - pd.Timedelta(days=1))]

if df_cmp.empty:
    st.warning("Não encontrei pares (previsão D-1 → real D). Confere se o pipeline está gerando sempre o dia anterior.")
    st.stop()

# ---------------------------------------------------
# Funções de métricas
# ---------------------------------------------------
def mae(err: pd.Series) -> float:
    return float(err.abs().mean())

def rmse(err: pd.Series) -> float:
    return float((err.pow(2).mean()) ** 0.5)

def bias(err: pd.Series) -> float:
    return float(err.mean())

def mape(prev: pd.Series, real: pd.Series) -> float:
    denom = real.abs().replace(0, pd.NA)
    return float(((prev - real).abs() / denom).dropna().mean() * 100)

# ---------------------------------------------------
# Erros
# ---------------------------------------------------
df_cmp["erro_temp_max"] = df_cmp["prev_temp_max"] - df_cmp["real_temp_max"]
df_cmp["erro_temp_min"] = df_cmp["prev_temp_min"] - df_cmp["real_temp_min"]
df_cmp["erro_chuva_mm"] = df_cmp["prev_chuva_mm"] - df_cmp["real_chuva_mm"]
df_cmp["erro_amp_termica"] = df_cmp["prev_amplitude_termica"] - df_cmp["real_amplitude_termica"]

# ---------------------------------------------------
# Métricas gerais (por tabela toda filtrada)
# ---------------------------------------------------
st.subheader("📌 Métricas gerais (D-1 → D)")

c1, c2, c3, c4 = st.columns(4)
c1.metric("Linhas comparadas", f"{len(df_cmp)}")
c2.metric("Cidades", f"{df_cmp['cidade_id'].nunique()}")
c3.metric("Primeira data", f"{df_cmp['dia_real'].min().date()}")
c4.metric("Última data", f"{df_cmp['dia_real'].max().date()}")

st.markdown("### 🌡️ Temperatura Máx (°C)")
a, b, c, d = st.columns(4)
a.metric("Erro Médio Absoluto (MAE)", f"{mae(df_cmp['erro_temp_max']):.2f}")
b.metric("Raiz do Erro Quadrático Médio (RMSE)", f"{rmse(df_cmp['erro_temp_max']):.2f}")
c.metric("Tendência (Bias)", f"{bias(df_cmp['erro_temp_max']):.2f}")
d.metric("Erro Médio Percentual Absoluto (MAPE)", f"{mape(df_cmp['prev_temp_max'], df_cmp['real_temp_max']):.2f}%")

st.markdown("### 🌡️ Temperatura Mín (°C)")
a, b, c, d = st.columns(4)
a.metric("Erro Médio Absoluto (MAE)", f"{mae(df_cmp['erro_temp_min']):.2f}")
b.metric("Raiz do Erro Quadrático Médio (RMSE)", f"{rmse(df_cmp['erro_temp_min']):.2f}")
c.metric("Tendência (Bias)", f"{bias(df_cmp['erro_temp_min']):.2f}")
d.metric("Erro Médio Percentual Absoluto (MAPE)", f"{mape(df_cmp['prev_temp_min'], df_cmp['real_temp_min']):.2f}%")

st.markdown("### 🌧️ Chuva (mm)")
a, b, c = st.columns(3)
a.metric("Erro Médio Absoluto (MAE)", f"{mae(df_cmp['erro_chuva_mm']):.2f}")
b.metric("Raiz do Erro Quadrático Médio (RMSE)", f"{rmse(df_cmp['erro_chuva_mm']):.2f}")
c.metric("Tendência (Bias)", f"{bias(df_cmp['erro_chuva_mm']):.2f}")

st.markdown("### 📊 Métricas de Classificação e Chuva")

col1, col2, col3 = st.columns(3)

# 1️⃣ Accuracy descrição do clima
acc_desc = (
    df_cmp["real_clima_desc"].fillna("") ==
    df_cmp["prev_clima_desc"].fillna("")
).mean() * 100

col1.metric(
    "✅ Acurácia: Descrição do Clima",
    f"{acc_desc:.2f}%"
)

# 2️⃣ Accuracy chuva binária
df_cmp["real_choveu"] = df_cmp["real_chuva_mm"].fillna(0) > 0
df_cmp["prev_choveu"] = df_cmp["prev_chuva_mm"].fillna(0) > 0

acc_chuva_bin = (
    df_cmp["real_choveu"] == df_cmp["prev_choveu"]
).mean() * 100

col2.metric(
    "🌧️ Acurácia: Choveu vs Não",
    f"{acc_chuva_bin:.2f}%"
)

# 3️⃣ Accuracy percentual da chuva (100 - MAPE)
real = df_cmp["real_chuva_mm"].fillna(0).astype(float)
prev = df_cmp["prev_chuva_mm"].fillna(0).astype(float)

mask = real > 0
mape_chuva = ((prev[mask] - real[mask]).abs() / real[mask]).mean() * 100
acc_pct_chuva = 100 - mape_chuva

col3.metric(
    "🎯 Acurácia % Volume Chuva",
    f"{acc_pct_chuva:.2f}%"
)

st.caption("Volume percentual calculado apenas em dias com chuva real > 0.")
st.caption("Bias > 0 → previsão tende a superestimar. Bias < 0 → previsão tende a subestimar.")


# ---------------------------------------------------
# Métricas por cidade
# ---------------------------------------------------
st.subheader("🏙️ Métricas por cidade")

df_city = (
    df_cmp.groupby("cidade_id", as_index=False)
    .agg(
        #n=("cidade_id", "size"),
        mae_temp_max=("erro_temp_max", lambda s: float(s.abs().mean())),
        rmse_temp_max=("erro_temp_max", lambda s: float((s.pow(2).mean()) ** 0.5)),
        mae_temp_min=("erro_temp_min", lambda s: float(s.abs().mean())),
        rmse_temp_min=("erro_temp_min", lambda s: float((s.pow(2).mean()) ** 0.5)),
        mae_chuva=("erro_chuva_mm", lambda s: float(s.abs().mean())),
        acc_chuva=("real_choveu", lambda s: float((s == df_cmp.loc[s.index, "prev_choveu"]).mean() * 100)),
    )
    .sort_values(["mae_temp_max", "mae_chuva"], ascending=[False, False])
)

st.dataframe(df_city, use_container_width=True)

# ---------------------------------------------------
# Gráficos (erros ao longo do tempo)
# ---------------------------------------------------
st.subheader("📈 Erro ao longo do tempo")

df_plot = df_cmp.sort_values("dia_real")

fig1 = px.line(df_plot, x="dia_real", y="erro_temp_max", color="cidade_id",
               title="Erro Temp. Máx (Previsto - Real) por dia")
st.plotly_chart(fig1, use_container_width=True)

fig2 = px.line(df_plot, x="dia_real", y="erro_temp_min", color="cidade_id",
               title="Erro Temp. Mín (Previsto - Real) por dia")
st.plotly_chart(fig2, use_container_width=True)

fig3 = px.line(df_plot, x="dia_real", y="erro_chuva_mm", color="cidade_id",
               title="Erro Chuva (mm) (Previsto - Real) por dia")
st.plotly_chart(fig3, use_container_width=True)

# ---------------------------------------------------
# Base comparada (debug/inspeção)
# ---------------------------------------------------
with st.expander("🔎 Ver base comparada (D-1 → D)"):
    cols_show = [
        "cidade_id",
        "dia_coleta_prev", "dia_previsto", "dia_real",
        "prev_temp_min", "real_temp_min", "erro_temp_min",
        "prev_temp_max", "real_temp_max", "erro_temp_max",
        "prev_chuva_mm", "real_chuva_mm", "erro_chuva_mm",
        "prev_clima_desc", "real_clima_desc"
    ]
    cols_show = [c for c in cols_show if c in df_cmp.columns]
    st.dataframe(df_cmp[cols_show], use_container_width=True)

st.subheader("🏆 Ranking de Precisão por Cidade (Score Composto)")

# ---- 1) Componentes por linha ----
# erro absoluto de temperatura (min e max)
abs_err_temp_max = df_cmp["erro_temp_max"].abs()
abs_err_temp_min = df_cmp["erro_temp_min"].abs()

# MAE por linha (média entre min e max)
df_cmp["abs_err_temp_media"] = (abs_err_temp_max + abs_err_temp_min) / 2

# proximidade da chuva por linha (0..1)
real = df_cmp["real_chuva_mm"].fillna(0).astype(float)
prev = df_cmp["prev_chuva_mm"].fillna(0).astype(float)
den = (pd.concat([real, prev], axis=1).max(axis=1)).replace(0, 1e-9)

df_cmp["chuva_prox"] = (1 - ((prev - real).abs() / den)).clip(lower=0, upper=1)

# match do texto por linha (0/1)
df_cmp["clima_match"] = (
    df_cmp["real_clima_desc"].fillna("") ==
    df_cmp["prev_clima_desc"].fillna("")
).astype(int)

# ---- 2) Agregação por cidade ----
df_rank = (
    df_cmp.groupby("cidade_id", as_index=False)
    .agg(
        n=("cidade_id", "size"),
        mae_temp=("abs_err_temp_media", "mean"),
        chuva_score=("chuva_prox", "mean"),       # 0..1
        clima_score=("clima_match", "mean"),      # 0..1
    )
)

# ---- 3) Normalização em score 0..100 ----
# TempScore: 100 * (1 - mae_temp/5), capado entre 0 e 100
TEMP_CAP = 3.0  # ajuste se quiser mais rígido/mais flexível
df_rank["temp_score"] = (1 - (df_rank["mae_temp"] / TEMP_CAP)).clip(0, 1) * 100

# ChuvaScore e ClimaScore já estão em 0..1
df_rank["chuva_score"] = df_rank["chuva_score"] * 100
df_rank["clima_score"] = df_rank["clima_score"] * 100

# ---- 4) Score final ponderado ----
W_TEMP = 0.5
W_CHUVA = 0.4
W_CLIMA = 0.1

df_rank["score_final"] = (
    W_TEMP * df_rank["temp_score"] +
    W_CHUVA * df_rank["chuva_score"] +
    W_CLIMA * df_rank["clima_score"]
)

# ---- 5) Ordenação e exibição ----
df_rank = df_rank.sort_values("score_final", ascending=False)

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


# ---- 6) Gráfico Top 10 ----
top10 = (
    df_rank
    .sort_values("score_final", ascending=False)  # garante ordem correta
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

# 🔥 ESSA LINHA resolve a ordem visual
fig_rank.update_layout(
    yaxis=dict(autorange="reversed")
)

st.plotly_chart(fig_rank, use_container_width=True)

st.caption(
    f"Score Final = {int(W_TEMP*100)}% Temperatura + {int(W_CHUVA*100)}% Chuva + {int(W_CLIMA*100)}% Descrição. \n"
    f"Score Temperatura usa limite de {TEMP_CAP}°C (MAE ≥ {TEMP_CAP} → 0 pontos)."
)
