"""Oturum uclari -- yeni konsolun kimlik akisi.

TASIMA_PLANI.md Faz 2. Eski `/api/auth/*` uclari dokunulmadan duruyor; eski web
onlarla calismaya devam ediyor. Yeni konsol yalnizca buradaki uclari kullanir.

Rol istemciden GELMEZ: kayit istegi rol alani tasimaz, rol yalnizca depodan
okunur ve yalnizca yonetici degistirebilir (CLAUDE.md kural 5).
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel

import kimlik
from depo import aktif_depo

yonlendirici = APIRouter(prefix="/api/oturum", tags=["oturum"])


class KayitIstegi(BaseModel):
    eposta: str
    adSoyad: str
    sifre: str
    # Bilerek rol alani yok.


class GirisIstegi(BaseModel):
    eposta: str
    sifre: str


class RolIstegi(BaseModel):
    kullaniciId: str
    rol: str


def _profil(kayit: dict) -> dict:
    return {
        "id": kayit["id"],
        "eposta": kayit["eposta"],
        "adSoyad": kayit["ad_soyad"],
        "rol": kayit["rol"],
        "birim": kayit.get("birim"),
        "sehir": kayit.get("sehir"),
    }


@yonlendirici.post("/kayit", status_code=201)
def kayit(istek: KayitIstegi, yanit: Response):
    kayit_edilen = kimlik.kullanici_kaydet(istek.eposta, istek.adSoyad, istek.sifre)
    erisim = kimlik.oturum_baslat(kayit_edilen, yanit)
    return {"erisimJetonu": erisim, "kullanici": _profil(kayit_edilen)}


@yonlendirici.post("/giris")
def giris(istek: GirisIstegi, yanit: Response):
    kayit_edilen = kimlik.giris_yap(istek.eposta, istek.sifre)
    erisim = kimlik.oturum_baslat(kayit_edilen, yanit)
    return {"erisimJetonu": erisim, "kullanici": _profil(kayit_edilen)}


@yonlendirici.post("/yenile")
def yenile(
    yanit: Response,
    qm_yenileme: Optional[str] = Cookie(default=None, alias=kimlik.YENILEME_CEREZI),
):
    sonuc = kimlik.oturum_yenile(yanit, qm_yenileme)
    return {"erisimJetonu": sonuc["erisimJetonu"], "kullanici": _profil(sonuc["kullanici"])}


@yonlendirici.post("/cikis")
def cikis(
    yanit: Response,
    qm_yenileme: Optional[str] = Cookie(default=None, alias=kimlik.YENILEME_CEREZI),
):
    kimlik.oturum_kapat(yanit, qm_yenileme)
    return {"durum": "kapandi"}


@yonlendirici.get("/ben")
def ben(kul: dict = Depends(kimlik.kullanici)):
    return {"kullanici": _profil(kul)}


@yonlendirici.post("/rol")
def rol_degistir(
    istek: RolIstegi,
    _yonetici: dict = Depends(kimlik.rol_gerektir("yonetici")),
):
    """Rol yukseltme tek kapi. Istemcinin kendi rolunu secmesi mumkun degil."""
    if istek.rol not in kimlik.ROLLER:
        raise HTTPException(status_code=422, detail=f"Bilinmeyen rol: {istek.rol}")
    depo = aktif_depo()
    if depo.kullanici_id(istek.kullaniciId) is None:
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi.")
    depo.rol_ata(istek.kullaniciId, istek.rol)
    # Rol degisince eldeki oturumlar dusurulur.
    depo.oturumlari_iptal(istek.kullaniciId)
    return {"durum": "guncellendi", "kullaniciId": istek.kullaniciId, "rol": istek.rol}
