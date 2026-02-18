
  
    
    
    create  table main."silver_climatempo_previsao"
    as
        

WITH deduped_raw AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (
            PARTITION BY DATE(dt_ingest), atualouprevisao, cidade 
            ORDER BY dt_ingest DESC -- Mantém o registro mais recente em caso de duplicatas
        ) as rn
    FROM raw_climatempo_previsao
)

SELECT
    UPPER(cidade) as cidade_id,
    CASE 
        WHEN atualouprevisao = 'atual' THEN 'HOJE'
        ELSE 'AMANHA'
    END as tipo_previsao,
    CAST(REPLACE(tmin, '°', '') AS INTEGER) as temp_min,
    CAST(REPLACE(tmax, '°', '') AS INTEGER) as temp_max,
    TRIM(descricao) as clima_desc,
    CAST(REPLACE(chuva, 'mm', '') AS FLOAT) as chuva_mm,
    DATE(dt_ingest) as data_coleta
FROM deduped_raw
WHERE rn = 1

  