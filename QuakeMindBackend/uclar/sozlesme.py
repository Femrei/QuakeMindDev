"""Ortak cikti sozlesmesi uclari -- konsolun bagli oldugu API.

TASIMA_PLANI.md Faz 3 · CLAUDE.md kural 2:
    (konum, hasar/aciliyet skoru, guven, zaman damgasi, kaynak tipi)

Arayuz modellere degil bu sozlesmeye baglanir; yeni bir model eklemek bu uclari
degistirmez.

Birim karari: API disariya **milisaniye** (JavaScript'in kendi zamani) verir ve
alir; depo saniye tutar. Cevirme yalnizca bu dosyanin kenarinda yapilir.

Yetki: her uc `Depends` ile korunur. Afetzede yalniz kendi cagrisini gorur
(MIMARI 9, kayit duzeyinde kontrol).
"""

from __future__ import annotations

import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

import canli_yayin
import kimlik
from depo import aktif_depo
from depo.sqlite_surucu import mesafe_m

yonlendirici = APIRouter(prefix="/api", tags=["sozlesme"])

SAHA_VE_USTU = ("saha", "koordinator", "yonetici")
KOORDINASYON = ("koordinator", "yonetici")


# --- birim cevrimi ---------------------------------------------------------

def _sn(ms: Optional[float]) -> Optional[float]:
    return None if ms is None else float(ms) / 1000.0


def _ms(sn: Optional[float]) -> Optional[float]:
    return None if sn is None else round(float(sn) * 1000.0)


# --- cikti bicimleri -------------------------------------------------------

def _hasar_cikti(k: dict) -> dict:
    return {
        "id": k["id"],
        "lon": k["lon"],
        "lat": k["lat"],
        "skor": k["skor"],
        "guven": k["guven"],
        "zaman": _ms(k["zaman"]),
        "kaynak": k["kaynak"],
        "etiket": k.get("etiket"),
    }


def _sos_cikti(k: dict) -> dict:
    return {
        "id": k["id"],
        "lon": k["lon"],
        "lat": k["lat"],
        "oncelik": k["oncelik"],
        "durum": k["durum"],
        "zaman": _ms(k["zaman"]),
        "mahalle": k.get("mahalle"),
        "metin": k.get("metin"),
        "ekipId": k.get("ekip_id"),
        "atamaZamani": _ms(k["atama_zamani"]) if k.get("atama_zamani") else None,
    }


def _ekip_cikti(k: dict) -> dict:
    return {
        "id": k["id"],
        "ad": k["ad"],
        "lon": k["lon"],
        "lat": k["lat"],
        "durum": k["durum"],
        "gorev": k.get("gorev_id"),
        "guncellendi": _ms(k["guncellendi"]),
    }


# --- hasar noktalari -------------------------------------------------------

@yonlendirici.get("/hasar-noktalari")
def hasar_noktalari(
    baslangic: Optional[float] = None,
    bitis: Optional[float] = None,
    kaynak: Optional[str] = None,
    sinir: int = Query(default=20000, le=100000),
    _kul: dict = Depends(kimlik.rol_gerektir(*SAHA_VE_USTU)),
):
    kayitlar = aktif_depo().hasar_listele(
        baslangic=_sn(baslangic), bitis=_sn(bitis), kaynak=kaynak, sinir=sinir
    )
    return [_hasar_cikti(k) for k in kayitlar]


# --- SOS -------------------------------------------------------------------

class SosIstegi(BaseModel):
    lon: float
    lat: float
    oncelik: str = "kritik"
    metin: Optional[str] = None
    mahalle: Optional[str] = None
    kanal: Optional[str] = None


class AtamaIstegi(BaseModel):
    ekipId: str


@yonlendirici.get("/sos")
def sos_listesi(
    baslangic: Optional[float] = None,
    bitis: Optional[float] = None,
    durum: Optional[str] = None,
    kul: dict = Depends(kimlik.kullanici),
):
    # Afetzede yalniz kendi cagrisini gorur; sahada ve ustunde herkes hepsini.
    kendi = kul["id"] if kul["rol"] == "afetzede" else None
    kayitlar = aktif_depo().sos_listele(
        baslangic=_sn(baslangic), bitis=_sn(bitis), durum=durum, kullanici_id=kendi
    )
    return [_sos_cikti(k) for k in kayitlar]


@yonlendirici.post("/sos", status_code=201)
def sos_ac(istek: SosIstegi, kul: dict = Depends(kimlik.kullanici)):
    if not (-90.0 <= istek.lat <= 90.0) or not (-180.0 <= istek.lon <= 180.0):
        raise HTTPException(status_code=422, detail="Gecersiz koordinat.")
    if istek.oncelik not in ("kritik", "yuksek", "orta"):
        raise HTTPException(status_code=422, detail="Oncelik: kritik | yuksek | orta")

    depo = aktif_depo()
    kayit = depo.sos_ekle(
        lon=istek.lon,
        lat=istek.lat,
        oncelik=istek.oncelik,
        metin=istek.metin,
        mahalle=istek.mahalle,
        kullanici_id=kul["id"],
        kanal=istek.kanal,
    )
    # Cagri ayni zamanda ortak sozlesmeye bir nokta olarak duser: birlesik isi
    # haritasinin "SOS" kanali bu noktalardan beslenir.
    depo.hasar_ekle(
        lon=istek.lon,
        lat=istek.lat,
        skor={"kritik": 1.0, "yuksek": 0.75, "orta": 0.45}[istek.oncelik],
        guven=1.0,
        kaynak="sos",
        etiket=istek.metin,
        zaman=kayit["zaman"],
    )
    canli_yayin.yayinla(
        "yeni-sos",
        id=kayit["id"],
        lon=kayit["lon"],
        lat=kayit["lat"],
        oncelik=kayit["oncelik"],
        mahalle=kayit.get("mahalle"),
    )
    return _sos_cikti(kayit)


@yonlendirici.post("/sos/{sos_id}/ata")
def sos_ata(
    sos_id: str,
    istek: AtamaIstegi,
    _kul: dict = Depends(kimlik.rol_gerektir(*SAHA_VE_USTU)),
):
    depo = aktif_depo()
    if depo.sos_bul(sos_id) is None:
        raise HTTPException(status_code=404, detail="Cagri bulunamadi.")
    if depo.ekip_bul(istek.ekipId) is None:
        raise HTTPException(status_code=404, detail="Ekip bulunamadi.")

    # Mukerrer sevk engeli veritabaninda: yalniz 'bekliyor' durumundaki cagri atanir.
    if not depo.sos_ata(sos_id, istek.ekipId):
        raise HTTPException(status_code=409, detail="Cagri zaten atanmis ya da kapanmis.")

    kayit = depo.sos_bul(sos_id)
    canli_yayin.yayinla("yeni-sos", id=sos_id, durum="atandi", ekipId=istek.ekipId)
    return _sos_cikti(kayit)


@yonlendirici.post("/sos/{sos_id}/kapat")
def sos_kapat(sos_id: str, _kul: dict = Depends(kimlik.rol_gerektir(*SAHA_VE_USTU))):
    depo = aktif_depo()
    if depo.sos_bul(sos_id) is None:
        raise HTTPException(status_code=404, detail="Cagri bulunamadi.")
    if not depo.sos_kapat(sos_id):
        raise HTTPException(status_code=409, detail="Cagri zaten kapanmis.")
    canli_yayin.yayinla("yeni-sos", id=sos_id, durum="kapandi")
    return _sos_cikti(depo.sos_bul(sos_id))


@yonlendirici.get("/sos/{sos_id}/en-yakin-ekip")
def en_yakin_ekip(sos_id: str, _kul: dict = Depends(kimlik.rol_gerektir(*SAHA_VE_USTU))):
    depo = aktif_depo()
    cagri = depo.sos_bul(sos_id)
    if cagri is None:
        raise HTTPException(status_code=404, detail="Cagri bulunamadi.")
    ekip = depo.en_yakin_ekip(cagri["lon"], cagri["lat"])
    if ekip is None:
        return {"ekip": None, "mesafeM": None}
    return {
        "ekip": _ekip_cikti(ekip),
        "mesafeM": round(mesafe_m(cagri["lon"], cagri["lat"], ekip["lon"], ekip["lat"])),
    }


# --- ekipler ---------------------------------------------------------------

class EkipIstegi(BaseModel):
    id: str
    ad: str
    lon: Optional[float] = None
    lat: Optional[float] = None
    durum: str = "musait"


class KonumIstegi(BaseModel):
    lon: float
    lat: float


@yonlendirici.get("/ekipler")
def ekipler(_kul: dict = Depends(kimlik.rol_gerektir(*SAHA_VE_USTU))):
    return [_ekip_cikti(e) for e in aktif_depo().ekip_listele()]


@yonlendirici.put("/ekipler/{ekip_id}")
def ekip_kaydet(
    ekip_id: str,
    istek: EkipIstegi,
    _kul: dict = Depends(kimlik.rol_gerektir(*KOORDINASYON)),
):
    kayit = aktif_depo().ekip_kaydet(
        ekip_id=ekip_id, ad=istek.ad, lon=istek.lon, lat=istek.lat, durum=istek.durum
    )
    return _ekip_cikti(kayit)


@yonlendirici.post("/ekipler/{ekip_id}/konum")
def ekip_konum(
    ekip_id: str,
    istek: KonumIstegi,
    _kul: dict = Depends(kimlik.rol_gerektir(*SAHA_VE_USTU)),
):
    depo = aktif_depo()
    if depo.ekip_bul(ekip_id) is None:
        raise HTTPException(status_code=404, detail="Ekip bulunamadi.")
    depo.ekip_konum(ekip_id, istek.lon, istek.lat)
    canli_yayin.yayinla("ekip-konumu", ekipId=ekip_id, lon=istek.lon, lat=istek.lat)
    return _ekip_cikti(depo.ekip_bul(ekip_id))


# --- ozet ------------------------------------------------------------------

@yonlendirici.get("/ozet")
def ozet(
    baslangic: Optional[float] = None,
    bitis: Optional[float] = None,
    _kul: dict = Depends(kimlik.rol_gerektir(*SAHA_VE_USTU)),
):
    """KPI sayilari sunucuda hazirlanir; istemci hesap yapmaz (MIMARI 2)."""
    depo = aktif_depo()
    b, s = _sn(baslangic), _sn(bitis)

    sos_sayilari = depo.sos_sayilari(b, s)
    hasar = depo.hasar_listele(baslangic=b, bitis=s, sinir=100000)
    kapanmalar = depo.kapanma_listele(baslangic=b, bitis=s, sinir=100000)

    uydu = [h for h in hasar if h["kaynak"] == "uydu"]
    return {
        # Yikik/hasarli ayrimi skor esigiyle: 0,8 ustu yikik sayilir.
        "yikikYapi": sum(1 for h in uydu if h["skor"] >= 0.8),
        "hasarliYapi": sum(1 for h in uydu if h["skor"] < 0.8),
        "hasarliYol": len(kapanmalar),
        "bekleyenSos": sos_sayilari.get("bekliyor", 0),
        "atananSos": sos_sayilari.get("atandi", 0),
        "kapananSos": sos_sayilari.get("kapandi", 0),
        "kaynakSayilari": _kaynak_sayilari(hasar),
        "olusturuldu": _ms(time.time()),
    }


def _kaynak_sayilari(hasar: list[dict]) -> dict[str, int]:
    sayac: dict[str, int] = {}
    for h in hasar:
        sayac[h["kaynak"]] = sayac.get(h["kaynak"], 0) + 1
    return sayac
