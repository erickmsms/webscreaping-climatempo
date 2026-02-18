
  
    
    
    create  table main."silver_previsao"
    as
        

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
FROM raw_climatempo_previsao

  