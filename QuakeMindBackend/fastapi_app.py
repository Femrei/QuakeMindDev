"""QuakeMind API -- uygulama girisi.

TASIMA_PLANI.md Faz 5: bu dosya eskiden 2.859 satirlik tek parcaydi. Artik
yalnizca uygulamayi kurar ve router'lari baglar:

  cekirdek.py        paylasilan durum, yardimcilar, veri modelleri, lifespan
  uclar/*.py         uclar, konuya gore (her biri 400 satirin altinda)

Calistirma degismedi:  uvicorn fastapi_app:app --host 127.0.0.1 --port 8001
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import cekirdek as ck
from uclar import (
    altlik,
    bildirim,
    canli,
    ekip,
    eski_kimlik,
    eski_sos,
    genel,
    hasar_analiz,
    kamera,
    kapanma,
    metin,
    oturum,
    risk,
    rota,
    sozlesme,
)

app = FastAPI(title="QuakeMind API", version="1.0.0", lifespan=ck.lifespan)

# Siralama korunur: yeni oturum ve sozlesme uclari eskiden de ilk sirada
# kaydediliyordu; ardindan eski dosyadaki sirayla digerleri.
for modul in (
    oturum,
    sozlesme,
    genel,
    metin,
    risk,
    hasar_analiz,
    canli,
    rota,
    kapanma,
    eski_sos,
    kamera,
    ekip,
    eski_kimlik,
    bildirim,
    altlik,
):
    app.include_router(modul.yonlendirici)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
