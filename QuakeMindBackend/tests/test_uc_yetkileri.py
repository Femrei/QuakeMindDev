"""Uc yetkileri (J-163): ekip gonderme koordinasyonda, eski ve arastirma uclari
bayrak arkasinda, tani gorseli giris ister.

Yalniz ilgili yonlendiriciler ayri bir SQLite dosyasiyla kurulur; gercek
veritabanina dokunulmaz. Modeller tembel yuklenir, bu testler hicbirini kosturmaz.
"""
import os
import sys
import tempfile
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

_GECICI = tempfile.mkdtemp(prefix="qm_uc_yetki_")
os.environ["QUAKEMIND_SQLITE"] = str(Path(_GECICI) / "test.sqlite3")

import depo as depo_paketi  # noqa: E402
import kimlik  # noqa: E402
from uclar import bildirim, gorev, hasar_analiz, kapanma, rota, sozlesme  # noqa: E402

SIFRE = "test-sifresi-123"

# Eski web ve arastirma betiklerinin uclari: varsayilan kapali (404).
ESKI_UCLAR = [
    ("post", "/api/notifications/send_emergency"),
    ("get", "/api/notifications/active"),
    ("post", "/api/chat/send"),
    ("get", "/api/chat/messages"),
    ("post", "/api/road_damage/simulate_closures"),
    ("post", "/api/road_damage/closures_from_mask"),
    ("post", "/api/road_damage/closures_from_emsr"),
    ("post", "/api/road_damage/naive_compare"),
    ("post", "/api/road_damage/reference_compare"),
    ("post", "/api/road_damage/route"),
    ("post", "/api/road_damage/safe_route"),
    ("get", "/api/road_damage/assembly?latitude=36.2&longitude=36.16"),
    ("post", "/api/road_damage/calculate_custom_route"),
    ("get", "/api/road_damage/nearest_debris?latitude=36.2&longitude=36.16"),
]


@pytest.fixture(scope="module")
def ortam():
    depo_paketi._depo = None  # bu modul kendi dosyasini acsin
    d = depo_paketi.depo_ac()
    d._yaz("INSERT OR IGNORE INTO ekipler (id, ad, guncellendi) VALUES ('EKP-Y', 'Yetki ekibi', 0)")
    hesap = {}
    for ad, rol in [("koordinator", "koordinator"), ("saha", "saha"), ("afetzede", "afetzede")]:
        k = kimlik.kullanici_kaydet(f"{ad}@yetki.local", ad, SIFRE)
        d.rol_ata(k["id"], rol)
        hesap[ad] = d.kullanici_id(k["id"])
    d.ekip_uyelerini_ayarla("EKP-Y", [hesap["saha"]["id"]])
    hesap["saha"] = d.kullanici_id(hesap["saha"]["id"])
    uygulama = FastAPI()
    for m in (bildirim, gorev, hasar_analiz, kapanma, rota):
        uygulama.include_router(m.yonlendirici)
    uygulama.include_router(sozlesme.yonlendirici)
    return TestClient(uygulama), hesap, d


def _baslik(hesap: dict) -> dict:
    return {"Authorization": f"Bearer {kimlik.erisim_jetonu_uret(hesap)}"}


@pytest.mark.parametrize("yontem,yol", ESKI_UCLAR)
def test_eski_uclar_bayraksiz_kapali(ortam, monkeypatch, yontem, yol):
    istemci, _, _ = ortam
    monkeypatch.delenv(kimlik.ESKI_UC_DEGISKENI, raising=False)
    y = getattr(istemci, yontem)(yol, **({"json": {}} if yontem == "post" else {}))
    assert y.status_code == 404, (yol, y.status_code, y.text[:200])


def test_eski_uc_bayrakla_acilir(ortam, monkeypatch):
    istemci, _, _ = ortam
    monkeypatch.setenv(kimlik.ESKI_UC_DEGISKENI, "1")
    # Bos govde: yonlendirme ve dogrulama calisir, is yapilmaz.
    assert istemci.post("/api/road_damage/route", json={}).status_code == 422


def test_tani_gorseli_giris_ister(ortam):
    istemci, h, _ = ortam
    yol = "/api/road_damage/gorsel/yok-boyle-analiz/imageOriginal"
    assert istemci.get(yol).status_code == 401
    assert istemci.get(yol, headers=_baslik(h["afetzede"])).status_code == 403
    assert istemci.get(yol, headers=_baslik(h["saha"])).status_code == 404


def test_ekip_gondermek_koordinasyonun_isi(ortam):
    istemci, h, d = ortam
    hedef_id = d.sos_ekle(lon=36.16, lat=36.20, oncelik="yuksek", metin="yetki testi",
                          kullanici_id=h["afetzede"]["id"])["id"]
    govde = {"hedefTur": "sos", "hedefId": hedef_id, "ekipId": "EKP-Y", "kisiSayisi": 4}
    # Saha ekibi kendi ekibini bile gonderemez.
    assert istemci.post("/api/gorevler", json=govde, headers=_baslik(h["saha"])).status_code == 403
    assert istemci.post(f"/api/sos/{hedef_id}/ata", json={"ekipId": "EKP-Y"},
                        headers=_baslik(h["saha"])).status_code == 403
    y = istemci.post("/api/gorevler", json=govde, headers=_baslik(h["koordinator"]))
    assert y.status_code == 201, y.text
    assert y.json()["ekip"]["id"] == "EKP-Y"


def test_saha_kendi_konumunu_paylasmaya_devam_eder(ortam):
    istemci, h, _ = ortam
    y = istemci.post("/api/ekipler/EKP-Y/konum", json={"lon": 36.16, "lat": 36.2},
                     headers=_baslik(h["saha"]))
    assert y.status_code == 200, y.text
