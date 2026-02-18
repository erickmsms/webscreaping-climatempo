

SELECT
    cidade_id,
    temp_max,
    temp_min,
    chuva_mm,
    CASE 
        WHEN chuva_mm > 10 THEN 'ALERTA DE CHUVA'
        ELSE 'NORMAL'
    END as status_alerta
FROM main."silver_climatempo_previsao"
WHERE tipo_previsao = 'HOJE'