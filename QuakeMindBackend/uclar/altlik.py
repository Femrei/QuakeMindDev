"""Harita altligi (J-40): `araclar_altlik_uret.py`'nin urettigi bolge paketleri.

Altlik kendi verimizden cizilir (ARAYUZ 11, MIMARI 8): yerel OSM kopyasindan
bir kez uretilir (kural 3), bu uc yalniz hazir ve sikistirilmis dosyayi verir.
Tarayici bir bolgeyi bir kez indirir ve onbellekte tutar."""

import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

import kimlik

yonlendirici = APIRouter()

ALTLIK_DIZINI = Path(__file__).resolve().parents[1] / "veri" / "altlik"


@yonlendirici.get("/api/altlik")
def altlik_katalogu(_kul: dict = Depends(kimlik.kullanici)):
    """Uretilmis bolgeler: kutu, nesne sayilari, boyut ve kaynak kunyesi."""
    yol = ALTLIK_DIZINI / "katalog.json"
    if not yol.exists():
        return {"bolgeler": [], "not": "Altlik uretilmedi: python araclar_altlik_uret.py"}
    return {"bolgeler": json.loads(yol.read_text(encoding="utf-8"))}


@yonlendirici.get("/api/altlik/yerler")
def altlik_yerleri(_kul: dict = Depends(kimlik.kullanici)):
    """Butun bolgelerin yer adlari (sehir, ilce, koy, mahalle) ve merkezleri.

    Afetzede ekrani konum alinamazsa mahallesini sectirir (J-43); bunun icin
    megabaytlik bolge paketini indirmez. `/api/altlik/{bolge}`'den ONCE
    tanimli: yoksa "yerler" bolge adi sanilirdi."""
    yol = ALTLIK_DIZINI / "yerler.json"
    if not yol.exists():
        return {"yerler": []}
    return {"yerler": json.loads(yol.read_text(encoding="utf-8"))}


@yonlendirici.get("/api/altlik/{bolge}")
def altlik_paketi(bolge: str, _kul: dict = Depends(kimlik.kullanici)):
    """Bolgenin yollari, yapilari, su alanlari ve nehirleri (gzip JSON, delta kodlu)."""
    if not bolge.isalnum():
        raise HTTPException(status_code=422, detail="Gecersiz bolge adi.")
    yol = ALTLIK_DIZINI / f"{bolge}.json.gz"
    if not yol.exists():
        raise HTTPException(status_code=404, detail="Bu bolgenin altligi uretilmedi.")
    return FileResponse(
        yol,
        media_type="application/json",
        headers={"Content-Encoding": "gzip", "Cache-Control": "private, max-age=86400"},
    )
