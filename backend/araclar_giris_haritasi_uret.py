"""Giriş ekranının arka plan haritasını üretir (J-176).

Giriş ekranı oturumdan ÖNCE açılır; fay ve altlık uçları kimlik ister. Bu yüzden
harita bir kez sadeleştirilip konsola statik veri olarak yazılır: sunucuya istek
yok, sayfa yüklenince anında çizilir.

Veri (uydurma yok, CLAUDE.md §1):
  * Etkin faylar -- GEM Global Active Faults (harmonized), CC BY-SA 4.0.
    Tür (`slip_type`) ve kayma hızı (`net_slip_rate`, mm/yıl) veri setinden.
  * Türkiye silüeti -- ana yol iskeleti, OpenStreetMap katkıcıları, ODbL 1.0
    (veri/altlik/ulke.json.gz, araclar_altlik_uret.py).
  * 6 Şubat 2023 ana şokları -- projenin deprem kataloğu
    (apps/earthquake_risk/data/query.csv), M >= 7.

Çıktı: konsol/src/kimlik/girisHaritasiVerisi.ts

    python araclar_giris_haritasi_uret.py
"""
from __future__ import annotations

import csv
import gzip
import json
import math
import re
from pathlib import Path

from shapely.geometry import LineString, MultiLineString
from shapely.ops import linemerge

KOK = Path(__file__).resolve().parent
FAYLAR = KOK / "apps" / "earthquake_risk" / "data" / "fault_maps" / "fay_haritası" / "gem_active_faults_harmonized.geojson"
ULKE = KOK / "veri" / "altlik" / "ulke.json.gz"
KATALOG = KOK / "apps" / "earthquake_risk" / "data" / "query.csv"
CIKTI = KOK.parent / "konsol" / "src" / "kimlik" / "girisHaritasiVerisi.ts"

# Türkiye ve yakın çevresi.
BATI, GUNEY, DOGU, KUZEY = 25.6, 35.7, 44.9, 42.2
ORTA_ENLEM = (GUNEY + KUZEY) / 2
GENISLIK = 1000.0  # viewBox genişliği
OLCEK = GENISLIK / ((DOGU - BATI) * math.cos(math.radians(ORTA_ENLEM)))
YUKSEKLIK = round((KUZEY - GUNEY) * OLCEK, 1)

FAY_SADE = 0.012  # derece
YOL_SADE = 0.03  # derece; silüet için yeter
YOL_EN_KISA = 0.15  # derece; kısa bağlantılar silüete katkı vermez

# Kayma hızı sınıfları (mm/yıl, tercih edilen değer).
HIZ_SINIRLARI = (3.0, 10.0)  # < 3 ince · 3–10 orta · >= 10 kalın (KAF, DAF)


def izdus(lon: float, lat: float) -> tuple[float, float]:
    x = (lon - BATI) * math.cos(math.radians(ORTA_ENLEM)) * OLCEK
    y = (KUZEY - lat) * OLCEK
    return round(x, 1), round(y, 1)


def yol_d(coords) -> str:
    noktalar = [izdus(x, y) for x, y in coords]
    return "M" + "L".join(f"{x:g} {y:g}" for x, y in noktalar)


def cizgiler(geom):
    t = geom.get("type")
    if t == "LineString":
        yield geom["coordinates"]
    elif t == "MultiLineString":
        yield from geom["coordinates"]


def tur(slip: str | None) -> str:
    """Baskın hareket: GEM türünün ilk parçası (Dextral-Normal -> doğrultu atımlı)."""
    ilk = (slip or "").split("-")[0]
    if ilk in ("Dextral", "Sinistral", "Strike"):
        return "dogrultu"
    if ilk == "Normal":
        return "normal"
    if ilk in ("Reverse", "Subduction_Thrust", "Thrust"):
        return "ters"
    return "dogrultu"


def hiz(metin: str | None) -> float:
    m = re.match(r"\(?\s*([0-9.]+)", metin or "")
    return float(m.group(1)) if m else 0.0


def sinif(h: float) -> int:
    return 0 if h < HIZ_SINIRLARI[0] else 1 if h < HIZ_SINIRLARI[1] else 2


def faylar():
    veri = json.loads(FAYLAR.read_text(encoding="utf-8"))
    kova: dict[tuple[str, int], list[str]] = {}
    sayac = {"dogrultu": 0, "normal": 0, "ters": 0}
    nokta = 0
    for oz in veri.get("features", []):
        p = oz.get("properties") or {}
        for c in cizgiler(oz.get("geometry") or {}):
            if len(c) < 2 or not any(BATI <= lon <= DOGU and GUNEY <= lat <= KUZEY for lon, lat, *_ in c):
                continue
            hat = LineString([(q[0], q[1]) for q in c]).simplify(FAY_SADE, preserve_topology=False)
            if len(hat.coords) < 2:
                continue
            t = tur(p.get("slip_type"))
            k = (t, sinif(hiz(p.get("net_slip_rate"))))
            kova.setdefault(k, []).append(yol_d(hat.coords))
            sayac[t] += 1
            nokta += len(hat.coords)
    return kova, sayac, nokta


def yollar():
    d = json.load(gzip.open(ULKE, "rt", encoding="utf-8"))
    olcek = 100000.0
    parcalar = []
    for katman in d["yollar"]:
        if katman.get("sinif") != 0:  # yalnız en üst sınıf: otoyol ve ana yollar
            continue
        k = katman["koord"]
        bas = katman["baslangic"]
        x = y = 0
        nokta = []
        for i in range(0, len(k), 2):
            x += k[i]
            y += k[i + 1]
            nokta.append((x / olcek, y / olcek))
        for i, s in enumerate(bas):
            e = bas[i + 1] if i + 1 < len(bas) else len(nokta)
            if e - s >= 2:
                parcalar.append(nokta[s:e])
    birlesik = linemerge(MultiLineString(parcalar))
    hatlar = list(birlesik.geoms) if hasattr(birlesik, "geoms") else [birlesik]
    sonuc = []
    toplam = 0
    for h in hatlar:
        if h.length < YOL_EN_KISA:
            continue
        s = h.simplify(YOL_SADE, preserve_topology=False)
        if len(s.coords) < 2:
            continue
        sonuc.append(yol_d(s.coords))
        toplam += len(s.coords)
    return sonuc, toplam, d["kaynak"].get("dosyaTarihi", "")


def depremler():
    olaylar = []
    with KATALOG.open(encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["time"].startswith("2023-02-06") and float(r["mag"]) >= 7.0:
                x, y = izdus(float(r["longitude"]), float(r["latitude"]))
                yer = "Pazarcık" if "Pazarcik" in r.get("place", "") else "Elbistan" if "Elbistan" in r.get("place", "") else r.get("place", "")
                # Katalog UTC; ekranda Türkiye saati (TSİ = UTC+3).
                sa, dk = int(r["time"][11:13]), r["time"][14:16]
                olaylar.append({"x": x, "y": y, "mw": float(r["mag"]), "yer": yer, "saat": f"{(sa + 3) % 24:02d}.{dk}"})
    olaylar.sort(key=lambda o: o["saat"])
    return olaylar


def main():
    kova, sayac, fay_nokta = faylar()
    yol, yol_nokta, yol_tarih = yollar()
    deprem = depremler()

    def grup(t: str, s: int) -> str:
        return json.dumps(" ".join(kova.get((t, s), [])))

    ts = [
        "/* OTOMATİK ÜRETİLDİ: backend/araclar_giris_haritasi_uret.py (J-176). Elle düzenleme.",
        "   Etkin faylar: GEM Global Active Faults (harmonized), CC BY-SA 4.0; tür slip_type, kalınlık",
        f"   net_slip_rate (mm/yıl; < {HIZ_SINIRLARI[0]:g} ince, {HIZ_SINIRLARI[0]:g}–{HIZ_SINIRLARI[1]:g} orta, >= {HIZ_SINIRLARI[1]:g} kalın).",
        f"   Silüet: OpenStreetMap ana yol iskeleti, ODbL 1.0 ({yol_tarih}). Depremler: proje kataloğu (query.csv).",
        f"   {sum(sayac.values())} fay ({fay_nokta} nokta), {len(yol)} yol hattı ({yol_nokta} nokta). */",
        "",
        "export const GIRIS_HARITASI = {",
        f"  genislik: {GENISLIK:g},",
        f"  yukseklik: {YUKSEKLIK:g},",
        f"  yollar: {json.dumps(' '.join(yol))},",
        "  /** Tür → kayma hızı sınıfı (0 ince, 1 orta, 2 kalın) → tek path. */",
        "  faylar: {",
        *[f"    {t}: [{grup(t, 0)}, {grup(t, 1)}, {grup(t, 2)}]," for t in ("dogrultu", "normal", "ters")],
        "  },",
        f"  faySayisi: {json.dumps(sayac)},",
        f"  depremler: {json.dumps(deprem, ensure_ascii=False)},",
        "} as const",
        "",
    ]
    CIKTI.write_text("\n".join(ts), encoding="utf-8")
    print(
        f"{CIKTI.name}: fay {sayac} ({fay_nokta} nokta), yol {len(yol)} hat ({yol_nokta} nokta), "
        f"deprem {len(deprem)}, {CIKTI.stat().st_size / 1024:.1f} KB"
    )


if __name__ == "__main__":
    main()
