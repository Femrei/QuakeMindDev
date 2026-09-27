"""Makale şekli: üç kanal tek haritada (J-108).

Makalenin asıl iddiası, yazında ayrı ayrı çözülmüş üç işin TEK karar zincirinde
birleştirilmesi. Şimdiye kadarki şekiller bunu göstermiyordu: uydu kanalı ve
rotalar vardı, kamera ile metin yoktu. Bu araç üçünü aynı mahalle karesine
koyar ve zincirin sonunu da çizer (kapalı yollar + ekip güzergâhı).

Karede ne var:
  · zemin      — gerçek ortofoto/uydu görüntüsü (tarihli, sağlayıcısı yazılı)
  · kırmızı    — modelin hasarlı bulduğu piksel  (uydu kanalı)
  · sarı kare  — kamera kanalı: gerçek deprem fotoğrafı, gerçek YOLO tespiti
  · mor daire  — metin kanalı: sentetik ihbar, gerçek BERTurk sınıfı
  · koyu kırmızı kalın — kapanan yol
  · mavi       — ekibin güzergâhı (kapanmalara göre)
  · sağ altta  — bir kamera fotoğrafının kendisi, tespit kutuları çizili

DÜRÜSTLÜK: fotoğraflar ve bütün model çıktıları gerçektir; ihbar METİNLERİ ve
kamera/metin kanallarının HARİTADAKİ KONUMU üretilmiştir. Bu, göstergenin
üstündeki künye satırında ve şeklin altındaki notta yazılıdır (kural 1).

Koşum:
    venv/Scripts/python.exe araclar_makale_uc_kanal.py --alan Defne
    venv/Scripts/python.exe araclar_makale_uc_kanal.py --hepsi
"""

from __future__ import annotations

import argparse
import json
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
KOK = Path(__file__).resolve().parent
sys.path.insert(0, str(KOK))

import numpy as np  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402

from araclar_makale_haritalari import _gorsel, _gosterge, _yazitipi  # noqa: E402

CIK = KOK / "benchmark" / "makale_sekilleri"
ALANLAR_DOSYASI = KOK / "apps" / "road_damage" / "data" / "tatbikat_alanlari.json"

# Konsoldaki renklerle AYNI (tasarim/token.css): okuyucu ekranda gördüğünü
# makalede de tanısın.
R_HASAR = (209, 51, 46)
R_KAPALI = (150, 20, 18)
R_ACIK = (0, 200, 240)
R_ROTA = (31, 111, 235)
R_KAMERA = (242, 193, 78)   # --color-ch-cam
R_METIN = (176, 140, 255)   # --color-ch-nlp


def _alan_bul(ad):
    kayitlar = json.loads(ALANLAR_DOSYASI.read_text(encoding="utf-8"))
    return next(x for x in kayitlar if ad.lower() in x["parca"].lower())


def _foto_ic_gorsel(kayit, yukseklik):
    """Kamera kaydının fotoğrafı, üstünde modelin bulduğu kutular."""
    import cv2

    from uclar.kamera import yolo_tespit

    yol = KOK / "apps" / "camera_detection" / "data" / "tatbikat_foto" / kayit["foto"]["dosya"]
    img = cv2.imread(str(yol))
    if img is None:
        return None
    dets, _m, _k = yolo_tespit(img, "hybrid")
    for d in dets:
        x1, y1, x2, y2 = [int(v) for v in d["box"]]
        renk = (224, 200, 78) if d["model"] == "catlak.pt" else (140, 224, 78)  # BGR
        cv2.rectangle(img, (x1, y1), (x2, y2), renk, max(2, img.shape[1] // 350))
    pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    oran = yukseklik / pil.height
    return pil.resize((int(pil.width * oran), yukseklik), Image.LANCZOS)


def tek_alan(alan_adi, model_adi, tohum=42):
    from apps.road_damage.utils import model_kunyesi, tatbikat, tatbikat_kanallar
    from apps.road_damage.worker import _init_worker, run_analysis_job

    alan = _alan_bul(alan_adi)
    k = alan["analizBbox"]
    _init_worker(model_kunyesi.kunye_oku(model_kunyesi.etkin_model_adi()))
    r = run_analysis_job({
        "_analysisId": "uckanal", "city": alan["il"], "source": "oam",
        "latitude": alan["merkez"]["lat"], "longitude": alan["merkez"]["lon"],
        "bboxWest": k[0], "bboxSouth": k[1], "bboxEast": k[2], "bboxNorth": k[3],
        "oamTileUrl": alan["tmsUrl"] if "{z}" in alan["tmsUrl"] else alan["tmsUrl"] + "/{z}/{x}/{y}.png",
        "oamPreferredTitle": alan["sahneAdi"], "modelAdi": model_adi, "radiusKm": 2.5,
    })
    ham = _gorsel(r, "imageOriginalB64").convert("RGB")
    maske = (np.asarray(_gorsel(r, "imageDamageMaskB64").convert("L")) > 127)
    s = r["bounds"]
    B = (s["west"], s["south"], s["east"], s["north"])
    W, H = ham.size
    gecerli = (np.asarray(ham.convert("L")) > 12).astype(np.uint8)

    G, sg, kapali, _kt, kapsama, _c = tatbikat.mahalle_grafigi(
        maske.astype(np.uint8), B, gecerli_maske=gecerli)
    ekip = tatbikat.giris_noktalari(G, B, sayi=5)
    kurban = tatbikat.afetzedeler(maske.astype(np.uint8), B, sayi=15, tohum=tohum)
    kurban, _e, ekip = tatbikat.ulasilabilir_afetzedeler(G, ekip, kurban)
    n = min(len(ekip), len(kurban))
    ekip, kurban = ekip[:n], kurban[:n]
    rota = tatbikat.rota_kosusu(G, sg, ekip, kurban, hiz_kmh=15.0)

    anahtar = alan["parca"]
    kam = tatbikat_kanallar.kamera_kanali(maske.astype(np.uint8), B, sayi=4, tohum=tohum,
                                          alan_anahtari=anahtar)
    met = tatbikat_kanallar.metin_kanali(maske.astype(np.uint8), B, il=alan["il"],
                                         sayi=5, tohum=tohum, alan_anahtari=anahtar)

    def pik(lat, lon):
        return ((lon - B[0]) / (B[2] - B[0]) * W, (B[3] - lat) / (B[3] - B[1]) * H)

    arr = np.asarray(ham).copy()
    arr[maske] = (0.42 * arr[maske] + 0.58 * np.array(R_HASAR)).astype(np.uint8)
    tv = Image.fromarray(arr)
    d = ImageDraw.Draw(tv, "RGBA")

    kk = set(kapali)
    for u, v, key, dd in G.edges(keys=True, data=True):
        g = dd.get("geometry")
        koord = ([(la, lo) for lo, la in g.coords] if g is not None
                 else [(G.nodes[u]["y"], G.nodes[u]["x"]), (G.nodes[v]["y"], G.nodes[v]["x"])])
        p = [pik(la, lo) for la, lo in koord]
        if len(p) < 2:
            continue
        kap = (u, v, key) in kk or (v, u, key) in kk
        d.line(p, fill=(*R_KAPALI, 255) if kap else (*R_ACIK, 95), width=9 if kap else 2)
    for g in (rota.get("gorevler") or []):
        c = ((g.get("varyantlar") or {}).get("kapanmali") or {}).get("cizgi") or []
        if len(c) >= 2:
            d.line([pik(la, lo) for la, lo in c], fill=(*R_ROTA, 235), width=4)

    ekip_icerde = 0
    for e in ekip:
        x, y = pik(e["lat"], e["lon"])
        if 0 <= x < W and 0 <= y < H:
            ekip_icerde += 1
            d.ellipse([x-11, y-11, x+11, y+11], fill=(*R_ROTA, 255),
                      outline=(255, 255, 255, 255), width=3)
    for kb in kurban:
        x, y = pik(kb["lat"], kb["lon"])
        d.rectangle([x-8, y-8, x+8, y+8], fill=(255, 255, 255, 235),
                    outline=(*R_HASAR, 255), width=3)

    # --- yeni iki kanal ---
    yt = _yazitipi(22)
    for i, kayit in enumerate(kam["kayitlar"], 1):
        x, y = pik(kayit["lat"], kayit["lon"])
        d.rectangle([x-13, y-13, x+13, y+13], fill=(*R_KAMERA, 245),
                    outline=(20, 20, 20, 255), width=3)
        d.text((x+18, y-12), f"K{i}", font=yt, fill=(255, 255, 255, 255),
               stroke_width=4, stroke_fill=(0, 0, 0, 220))
    for i, kayit in enumerate(met["kayitlar"], 1):
        x, y = pik(kayit["lat"], kayit["lon"])
        rr = 9 + kayit["aciliyet"] * 1.6
        d.ellipse([x-rr, y-rr, x+rr, y+rr], fill=(*R_METIN, 245),
                  outline=(20, 20, 20, 255), width=3)
        d.text((x+rr+6, y-12), f"M{i}", font=yt, fill=(255, 255, 255, 255),
               stroke_width=4, stroke_fill=(0, 0, 0, 220))

    # --- sağ altta kamera fotoğrafının kendisi ---
    if kam["kayitlar"]:
        en_iyi = max(kam["kayitlar"], key=lambda z: z["tespitSayisi"])
        sira = kam["kayitlar"].index(en_iyi) + 1
        ic = _foto_ic_gorsel(en_iyi, yukseklik=max(180, H // 4))
        if ic is not None:
            px, py = W - ic.width - 24, H - ic.height - 24
            d.rectangle([px-5, py-5, px+ic.width+5, py+ic.height+5],
                        fill=(20, 20, 20, 235), outline=(*R_KAMERA, 255), width=4)
            tv.paste(ic, (px, py))
            d2 = ImageDraw.Draw(tv, "RGBA")
            d2.text((px+8, py-34), f"K{sira} — {en_iyi['etiket'][:44]}",
                    font=yt, fill=(255, 255, 255, 255), stroke_width=4,
                    stroke_fill=(0, 0, 0, 230))

    catlak = sum(z["catlakSayisi"] for z in kam["kayitlar"])
    bina = sum(z["binaSayisi"] for z in kam["kayitlar"])
    tv = _gosterge(tv, [
        (R_ACIK, "cizgi", "Açık yol (OpenStreetMap)"),
        (R_KAPALI, "cizgi-kalin", f"Kapalı yol — modelin bulduğu ({len(kapali)} kenar)"),
        (R_HASAR, "alan", "Hasarlı piksel — UYDU kanalı (bölütleme çıktısı)"),
        (R_KAMERA, "kare",
         f"KAMERA kanalı — {len(kam['kayitlar'])} gerçek fotoğraf, YOLO: "
         f"{catlak} çatlak + {bina} bina  (konum üretildi)"),
        (R_METIN, "daire",
         f"METİN kanalı — {len(met['kayitlar'])} ihbar, BERTurk sınıfı  "
         f"(metin ve konum üretildi)"),
        (R_ROTA, "cizgi", "Ekip güzergâhı — kapanmalara göre"),
        (R_ROTA, "daire", f"Mahalle giriş ağzı — {len(ekip)} ekip"),
        (R_HASAR, "kare", f"Afetzede — senaryo ({len(kurban)})"),
    ], baslik=(f"{alan['il']} / {alan['yer']} · {alan['saglayici']} · {alan['tarih']} · "
               f"model {model_adi} · kapsama %{kapsama['edgesObservedFraction']*100:.0f} · "
               f"GERÇEK: görüntü, fotoğraflar, bütün model çıktıları — "
               f"ÜRETİLEN: ihbar metinleri ve kamera/metin konumları. "
               f"Fotoğraflar aynı depremden (Hatay ve Adıyaman); "
               f"bu mahallenin fotoğrafı DEĞİLDİR."))

    ad = alan["parca"].split()[0].lower().replace("ı", "i")
    hedef = CIK / f"sekil_uc_kanal_{ad}.png"
    CIK.mkdir(parents=True, exist_ok=True)
    tv.save(hedef)
    print(f"  {alan['il']} / {alan['yer']}")
    print(f"    kapali {len(kapali)} · ekip {len(ekip)} · afetzede {len(kurban)} · "
          f"kamera {len(kam['kayitlar'])} ({catlak} çatlak, {bina} bina) · "
          f"metin {len(met['kayitlar'])}")
    print(f"    -> {hedef.name}  ({hedef.stat().st_size//1024} KB)")
    return hedef


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--alan", default="Defne")
    ap.add_argument("--model", default="unet_mitb4_p2_t42")
    ap.add_argument("--tohum", type=int, default=42)
    ap.add_argument("--hepsi", action="store_true",
                    help="Defne, Islahiye ve Nurdagi icin uretir")
    a = ap.parse_args()
    alanlar = ["Defne", "Islahiye", "Nurdagi"] if a.hepsi else [a.alan]
    for ad in alanlar:
        try:
            tek_alan(ad, a.model, a.tohum)
        except Exception as e:
            print(f"  {ad}: HATA {type(e).__name__}: {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
