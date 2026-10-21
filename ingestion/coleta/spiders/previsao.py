import scrapy
from datetime import datetime, timezone

class PrevisaoSpider(scrapy.Spider):
    name = "previsao"

    start_urls = [
        # Cidades originais (as que o dashboard exibe)
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/5208/pedra-pe",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/558/saopaulo-sp",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/259/recife-pe",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/391/americana-sp",

        # Demais capitais, por UF (desde 21/10/2026)
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/6/riobranco-ac",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/8/maceio-al",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/25/manaus-am",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/39/macapa-ap",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/56/salvador-ba",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/60/fortaleza-ce",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/61/brasilia-df",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/84/vitoria-es",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/88/goiania-go",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/94/saoluis-ma",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/107/belohorizonte-mg",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/212/campogrande-ms",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/218/cuiaba-mt",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/232/belem-pa",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/256/joaopessoa-pb",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/264/teresina-pi",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/271/curitiba-pr",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/321/riodejaneiro-rj",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/334/natal-rn",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/343/portovelho-ro",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/347/boavista-rr",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/363/portoalegre-rs",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/377/florianopolis-sc",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/384/aracaju-se",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/593/palmas-to",

        # Sorteadas entre os municípios do IBGE (desde 21/10/2026)
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/4692/santarosadosul-sc",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/302/itaperuna-rj",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/2987/jaboticaba-rs",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/6395/careirodavarzea-am",
        "https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/2667/aperibe-rj",
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