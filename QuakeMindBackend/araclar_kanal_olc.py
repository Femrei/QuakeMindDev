"""Yer seviyesi kanalların ölçümü: kamera (YOLO) ve metin (BERTurk).

Kural 8 gereği sayma birimi ve hedef önce yazılır:

  KAMERA  — birim: fotoğraf. Ölçülen: fotoğraf başına çatlak ve bina tespiti
            sayısı, en yüksek güven, ısınma sonrası çıkarım süresi. Hedef:
            katalogdaki her fotoğrafın modelden BİR ŞEY alıp almadığını görmek;
            "bulamadı" da sonuçtur ve öyle raporlanır.
  METİN   — birim: ihbar metni. Ölçülen: modelin verdiği kategori, güven,
            süre ve yazarın niyetiyle örtüşme. DİKKAT: örtüşme bir DOĞRULUK
            DEĞİLDİR. "beklenen" alanı tek kişinin (metni yazanın) etiketidir,
            yer gerçeği değil; "Enkaz Bildirimi" ile "Acil Yardım İhtiyacı"
            sınırı gerçekten bulanıktır (çöken binada mahsur kalan kişi
            ikisidir birden). Sayı bu yüzden "örtüşme" diye adlandırılır.

Koşum:  venv/Scripts/python.exe araclar_kanal_olc.py
"""

from __future__ import annotations

import json
import statistics
import sys
import time
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
KOK = Path(__file__).resolve().parent
sys.path.insert(0, str(KOK))

RAPOR = KOK / "benchmark" / "reports" / "kanal_olcumu.json"


def kamera_olc():
    import cv2

    from uclar.kamera import yolo_tespit

    dizin = KOK / "apps" / "camera_detection" / "data" / "tatbikat_foto"
    kunye = json.loads((dizin / "KUNYE.json").read_text(encoding="utf-8"))
    # Isınma: ilk çağrı modeli diske/belleğe alır, ölçüme girmez.
    yolo_tespit(cv2.imread(str(dizin / kunye[0]["dosya"])), "hybrid")

    satirlar, sureler = [], []
    for k in kunye:
        img = cv2.imread(str(dizin / k["dosya"]))
        t0 = time.perf_counter()
        tespitler, _modeller, kritik = yolo_tespit(img, "hybrid")
        ms = (time.perf_counter() - t0) * 1000
        sureler.append(ms)
        catlak = [d for d in tespitler if d["model"] == "catlak.pt"]
        bina = [d for d in tespitler if d["model"] == "bina.pt"]
        satirlar.append({
            "dosya": k["dosya"], "lisans": k["lisans"], "yazar": k["yazar"],
            "catlak": len(catlak), "bina": len(bina), "kritik": bool(kritik),
            "enYuksekGuven": round(max((d["confidence"] for d in tespitler), default=0.0), 1),
            "ms": round(ms, 1),
        })
    return {
        "birim": "fotoğraf",
        "fotoSayisi": len(satirlar),
        "tespitVeren": sum(1 for s in satirlar if s["catlak"] + s["bina"] > 0),
        "toplamCatlak": sum(s["catlak"] for s in satirlar),
        "toplamBina": sum(s["bina"] for s in satirlar),
        "medyanMs": round(statistics.median(sureler), 1),
        "enUzunMs": round(max(sureler), 1),
        "satirlar": satirlar,
    }


def metin_olc():
    sys.path.insert(0, str(KOK / "apps" / "disaster_nlp"))
    from src.classification import DisasterClassifier
    from src.preprocessing import clean_text

    havuz = json.loads(
        (KOK / "apps" / "disaster_nlp" / "data" / "tatbikat_metinleri.json").read_text(encoding="utf-8")
    )
    siniflandirici = DisasterClassifier()
    siniflandirici.classify("ısınma")  # ölçüme girmesin

    satirlar, sureler = [], []
    for il, liste in havuz["iller"].items():
        for kayit in liste:
            t0 = time.perf_counter()
            kategori, guven = siniflandirici.classify(clean_text(kayit["metin"], lowercase=False))
            ms = (time.perf_counter() - t0) * 1000
            sureler.append(ms)
            satirlar.append({
                "il": il, "beklenen": kayit["beklenen"], "model": kategori,
                "ortusuyor": kategori == kayit["beklenen"],
                "guven": round(float(guven), 3), "ms": round(ms, 1),
            })
    kaymalar = {}
    for s in satirlar:
        if not s["ortusuyor"]:
            kaymalar[s["model"]] = kaymalar.get(s["model"], 0) + 1
    return {
        "birim": "ihbar metni",
        "metinSayisi": len(satirlar),
        "ortusen": sum(1 for s in satirlar if s["ortusuyor"]),
        "ortusmeNotu": ("Bu bir DOĞRULUK DEĞİLDİR: 'beklenen' metni yazan tek kişinin "
                        "etiketidir, yer gerçeği değil. Kategori sınırları bulanıktır."),
        "kaymaDagilimi": kaymalar,
        "medyanMs": round(statistics.median(sureler), 1),
        "enUzunMs": round(max(sureler), 1),
        "satirlar": satirlar,
    }


def main():
    print("KAMERA kanalı ölçülüyor...")
    kam = kamera_olc()
    print(f"  {kam['tespitVeren']}/{kam['fotoSayisi']} fotoğraf tespit verdi · "
          f"{kam['toplamCatlak']} çatlak · {kam['toplamBina']} bina · "
          f"medyan {kam['medyanMs']} ms")
    print("METİN kanalı ölçülüyor...")
    met = metin_olc()
    print(f"  {met['ortusen']}/{met['metinSayisi']} metin yazarın niyetiyle örtüştü · "
          f"medyan {met['medyanMs']} ms · en uzun {met['enUzunMs']} ms")
    if met["kaymaDagilimi"]:
        print("  örtüşmeyenlerin gittiği sınıflar:", met["kaymaDagilimi"])

    RAPOR.parent.mkdir(parents=True, exist_ok=True)
    RAPOR.write_text(json.dumps(
        {"tarih": time.strftime("%Y-%m-%d"), "kamera": kam, "metin": met},
        ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nrapor: {RAPOR}")


if __name__ == "__main__":
    main()
