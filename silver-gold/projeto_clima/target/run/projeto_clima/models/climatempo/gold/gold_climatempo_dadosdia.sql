
  
    
    
    create  table main."gold_climatempo_dadosdia"
    as
        

SELECT
    cidade_id,
    temp_min,
    temp_max,
    clima_desc,
    chuva_mm,
    data_coleta,
    (temp_max - temp_min) as amplitude_termica
FROM main."silver_climatempo_previsao"
WHERE tipo_previsao = 'HOJE'

  