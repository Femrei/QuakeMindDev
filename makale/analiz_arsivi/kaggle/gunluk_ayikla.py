# -*- coding: utf-8 -*-
"""Kaggle koşu günlüğünden sonuç kayıtlarını çıkarır.

03_kaggle_protokol defteri her deneyin sonuc.json'unu günlüğe de basar
(===SONUC_JSON_BASLA=== / ===SONUC_JSON_BITTI=== arası tek satır). Kaggle çıktısı
(ağırlıklarla birlikte yüzlerce MB) indirilmeden sonuçlar bu günlükten alınır.

    python gunluk_ayikla.py <gunluk.txt> <cikti_klasoru>

Her deney için <deney>__<model>__tohum_<n>.json yazar ve kısa bir özet basar.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ONEK = re.compile(r"^\s*[\d.]+s\s+\d+\s?")


def ayikla(gunluk: Path) -> list[dict]:
    satirlar = [ONEK.sub("", s, count=1) for s in gunluk.read_text(encoding="utf-8").splitlines()]
    kayitlar, i = [], 0
    while i < len(satirlar):
        if satirlar[i].strip() == "===SONUC_JSON_BASLA===":
            j = i + 1
            while satirlar[j].strip() != "===SONUC_JSON_BITTI===":
                j += 1
            kayitlar.append(json.loads("".join(satirlar[i + 1:j])))
            i = j
        i += 1
    return kayitlar


def main() -> int:
    gunluk, cikti = Path(sys.argv[1]), Path(sys.argv[2])
    cikti.mkdir(parents=True, exist_ok=True)
    for k in ayikla(gunluk):
        ad = f"{k['deney']}__{k['model']}__tohum_{k['tohum']}.json"
        (cikti / ad).write_text(json.dumps(k, ensure_ascii=False, indent=1), encoding="utf-8")
        il = lambda a: (k.get(a) or {}).get("iou_hasar")
        print(f"{ad}: tümü {il('sinama_sonrasi_tumu'):.4f} | Hatay {il('sinama_hatay'):.4f} | "
              f"Kahramanmaraş {il('sinama_kahramanmaras'):.4f} | eğitim karo {k['egitim']['karo']['egitim']} | "
              f"{k['egitim']['sure_dk']} dk")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
