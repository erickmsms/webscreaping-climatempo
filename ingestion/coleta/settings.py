# Configuração do Scrapy. Referência: https://docs.scrapy.org/en/latest/topics/settings.html

BOT_NAME = "coleta"

SPIDER_MODULES = ["coleta.spiders"]
NEWSPIDER_MODULE = "coleta.spiders"

ADDONS = {}

# Coleta educada: respeita o robots.txt e faz uma requisição por vez, com intervalo.
ROBOTSTXT_OBEY = True
CONCURRENT_REQUESTS_PER_DOMAIN = 1
DOWNLOAD_DELAY = 1

FEED_EXPORT_ENCODING = "utf-8"
