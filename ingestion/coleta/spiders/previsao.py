import scrapy
from datetime import datetime, timezone

class PrevisaoSpider(scrapy.Spider):
    name = "previsao"

    start_urls = [
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/5208/pedra-pe",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/558/saopaulo-sp",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/259/recife-pe",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/391/americana-sp"
    ]

    def parse(self, response):
        dt_ingest = datetime.now(timezone.utc).isoformat()
        cidade = response.url.split('/')[-1]
        dias = response.css("section.-daily-infos-aggregator")

        # ====================
        # HOJE
        # ====================

        hoje = dias[0]

        yield {
            "cidade": cidade,
            "atualouprevisao": "atual",
            "tmin": hoje.css("span.agg-daily__temp.-min::text").get(),
            "tmax": hoje.css("span.agg-daily__temp.-max::text").get(),
            "descricao": hoje.css("p.agg-daily__description::text").get(),
            "chuva": hoje.css("span.agg-daily__rain-text::text").get(),
            "dt_ingest": dt_ingest,
        }

        # ====================
        # AMANHÃ
        # ====================

        amanha = dias[1]

        yield {
            "cidade": cidade,
            "atualouprevisao": "previsao",
            "tmin": amanha.css("span.agg-daily__temp.-min::text").get(),
            "tmax": amanha.css("span.agg-daily__temp.-max::text").get(),
            "descricao": amanha.css("p.agg-daily__description::text").get(),
            "chuva": amanha.css("span.agg-daily__rain-text::text").get(),
            "dt_ingest": dt_ingest,
        }