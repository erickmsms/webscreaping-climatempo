import json
from pathlib import Path
import pandas as pd
from sqlalchemy import create_engine

def main():
    # caminho do arquivo de entrada
    input_path = Path(__file__).parent.parent / "coleta" / "data.jsonl"

    if not input_path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {input_path.resolve()}")

    # lê o json (pode ser lista JSON normal ou JSON Lines)
    text = input_path.read_text(encoding="utf-8").strip()

    if not text:
        raise ValueError(f"Arquivo está vazio: {input_path.resolve()}")

    # tenta primeiro como JSON "normal" (lista/dict)
    try:
        payload = json.loads(text)
        df = pd.DataFrame(payload if isinstance(payload, list) else [payload])
    except json.JSONDecodeError:
        # fallback: JSON Lines (1 objeto por linha)
        df = pd.read_json(input_path, lines=True)

    # limpeza básica de strings (opcional, mas ajuda)
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].astype(str).str.strip()

    print("✅ DataFrame carregado")
    print("Linhas:", len(df), "| Colunas:", len(df.columns))
    print(df.head())

    # se quiser já salvar uma versão em csv/parquet pra facilitar debug
    output_dir = Path(__file__).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    df.to_csv(output_dir / "saídatransform.csv", index=False, encoding="utf-8")

    print(f"📁 Salvo em: {(output_dir / 'saídatransform.csv').resolve()}")

    # --- PARTE 2: SALVAR NO BANCO DE DADOS ---
    
    # Usando Path para evitar problemas com barras \ ou /
    db_file = "dataset_climatempo.db"
    # Isso pega a pasta 'projeto_screap' (sobe 2 níveis de onde está o script)
    base_dir = Path(__file__).parent.parent.parent 
    full_db_path = base_dir / db_file

    print(f"Tentando salvar em: {full_db_path.resolve()}")

    # Para SQLite no Windows, o ideal é usar caminhos absolutos com 3 barras após sqlite:///
    # E converter o objeto Path para string
    engine = create_engine(f'sqlite:///{full_db_path.resolve()}')

    try:
        # Abrindo a conexão de forma explícita
        with engine.begin() as connection:
            df.to_sql(
                name='raw_climatempo_previsao', 
                con=connection, 
                if_exists='append', 
                index=False
            )
        print(f"🚀 BOA! Dados inseridos na tabela 'raw_climatempo_previsao'!")
    except Exception as e:
        print(f"❌ Erro ao abrir o banco: {e}")

if __name__ == "__main__":
    main()