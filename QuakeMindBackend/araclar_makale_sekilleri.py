# -*- coding: utf-8 -*-
"""Makaleye girecek grafikleri uretir (Word'e dokunmadan, dosya olarak).

Butun sayilar `SIMULASYON_OLCUM_KAYDI.md`deki OLCULMUS degerlerdir; burada
hicbir sey uydurulmaz, yalnizca cizilir. Sayi degisirse once olcum kaydi,
sonra bu dosya guncellenir.
"""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

CIK = Path(__file__).resolve().parent / "benchmark" / "makale_sekilleri"
CIK.mkdir(parents=True, exist_ok=True)
plt.rcParams.update({
    "font.size": 9, "axes.titlesize": 10, "axes.labelsize": 9,
    "figure.dpi": 200, "savefig.dpi": 300, "savefig.bbox": "tight",
    "axes.spines.top": False, "axes.spines.right": False,
    # Turkce ondalik ayirici: butun eksenlerde virgul.
    "axes.formatter.use_locale": False,
    "axes.grid": True, "grid.alpha": 0.25, "grid.linewidth": 0.5,
})
# Renk: kirmizi/turuncu YALNIZ hasar ve aciliyet icin (ARAYUZ §6).
GRI, ORTA, VURGU = "#6b7280", "#9ca3af", "#1f6feb"
HASAR = "#d1332e"

ALAN = ["Defne / Elektrik", "İslahiye", "Nurdağı"]

# --- Sekil 1: kiyas kollari (ana kosu, En iyi model, 25 cift) ---------------
def sekil_kollar():
    kol = ["Kapanmayı bilmeyen\nekip", "Telsizle paylaşan\nfilo", "QuakeMind"]
    veri = {"Defne / Elektrik": [2.70, 2.40, 1.60],
            "İslahiye":         [1.20, 1.20, 1.08],
            "Nurdağı":          [4.58, 3.80, 1.54]}
    hata = {"Defne / Elektrik": [0.00, 0.00, 0.00],
            "İslahiye":         [0.10, 0.10, 0.08],
            "Nurdağı":          [0.87, 0.76, 0.13]}
    f, ax = plt.subplots(figsize=(6.2, 3.1))
    x = np.arange(len(ALAN)); g = 0.26
    for i, (k, renk) in enumerate(zip(kol, [GRI, ORTA, VURGU])):
        d = [veri[a][i] for a in ALAN]; e = [hata[a][i] for a in ALAN]
        ax.bar(x + (i - 1) * g, d, g * 0.92, yerr=e, capsize=3, label=k,
               color=renk, edgecolor="white", linewidth=0.6)
        for xi, v in zip(x + (i - 1) * g, d):
            ax.text(xi, v + 0.12, f"{v:.1f}".replace(".", ","), ha="center", fontsize=7.5)
    ax.set_xticks(x); ax.set_xticklabels(ALAN)
    ax.set_ylabel("Ortalama erişim süresi (dk)")
    ax.set_title("Kapanmayı önceden bilmenin erişim süresine etkisi\n"
                 "(U-Net MiT-B4, 25 ekip–afetzede çifti, 5 tohum)", pad=8)
    ax.legend(frameon=False, fontsize=8, ncol=3, loc="upper center",
              bbox_to_anchor=(0.5, -0.16))
    ax.set_ylim(0, 5.6)
    f.savefig(CIK / "sekil_kiyas_kollari.png"); plt.close(f)


# --- Sekil 2: duyarlilik, eski 20 dk sabitinin etkisi -----------------------
def sekil_duyarlilik():
    kosu = ["Değerlendirme\n0,5 dk", "ANA\n(1,42 dk)", "Değerlendirme\n2,0 dk",
            "ESKİ SABİT\n(20 dk)"]
    kazanc = {"Defne / Elektrik": [24, 28, 41, 84],
              "İslahiye":         [13, 13, 19, 62],
              "Nurdağı":          [50, 58, 67, 94]}
    f, ax = plt.subplots(figsize=(6.2, 3.1))
    x = np.arange(len(kosu))
    for a, isaret in zip(ALAN, ["o", "s", "^"]):
        ax.plot(x, kazanc[a], marker=isaret, color=VURGU if a == "Nurdağı" else GRI,
                linewidth=1.6, markersize=5, label=a,
                alpha=1.0 if a == "Nurdağı" else 0.75)
    ax.axvspan(2.5, 3.5, color=HASAR, alpha=0.07)
    ax.text(3, 99, "kullanılmıyor", ha="center", fontsize=7.5, color=HASAR)
    ax.set_xticks(x); ax.set_xticklabels(kosu, fontsize=8)
    ax.set_ylabel("QuakeMind kolunun kazancı (%)"); ax.set_ylim(0, 105)
    ax.set_title("Sonuç, beyan edilen ceza süresine ne kadar bağlı?\n"
                 "Eski 20 dk'lık sabit sonucu tek başına üretiyor", pad=8)
    ax.legend(frameon=False, fontsize=8, loc="center left")
    f.savefig(CIK / "sekil_duyarlilik.png"); plt.close(f)


# --- Sekil 3: model secimi, sure - dogruluk - operasyonel kazanc ------------
def sekil_model():
    ad = ["Hızlı\nMiT-B0", "Dengeli\nMiT-B2", "En iyi\nU-Net MiT-B4"]
    sure = [1.91, 4.71, 10.50]
    iou = [0.382, 0.409, 0.433]
    kazanc = {"Nurdağı": [59.5, 64.9, 65.8], "İslahiye": [7.1, 40.9, 9.9],
              "Defne / Elektrik": [np.nan, 40.9, 40.7]}
    f, (a1, a2) = plt.subplots(1, 2, figsize=(8.2, 3.0))
    # Iki panel arasi bosluk: ikiz eksenin "Sinama IoU" etiketi sag panelin
    # y etiketine biniyordu.
    f.subplots_adjust(wspace=0.52)
    a1.bar(ad, sure, 0.5, color=ORTA, edgecolor="white")
    a1.set_ylabel("Çıkarım süresi (sn)")
    for i, (s, v) in enumerate(zip(sure, iou)):
        a1.text(i, s + 0.25, f"{s:.2f} sn".replace(".", ","), ha="center", fontsize=8)
    b = a1.twinx(); b.plot(ad, iou, marker="o", color=VURGU, linewidth=1.6)
    b.set_ylabel("Sınama IoU", color=VURGU, labelpad=2)
    b.tick_params(axis="y", colors=VURGU, pad=1)
    b.set_ylim(0.35, 0.46); b.grid(False)
    # Tik cizgileri kucuk olcekte eksi isareti gibi okunuyordu; ice alindi.
    b.tick_params(axis="y", direction="in", length=2)
    b.set_yticks([0.36, 0.38, 0.40, 0.42, 0.44, 0.46])
    b.set_yticklabels([f"{v:.2f}".replace(".", ",") for v in
                       (0.36, 0.38, 0.40, 0.42, 0.44, 0.46)])
    a1.set_title("5,5 kat süre → +0,051 IoU", pad=6)
    for a, isaret in zip(ALAN, ["o", "s", "^"]):
        a2.plot(ad, kazanc[a], marker=isaret, linewidth=1.6, markersize=5, label=a,
                color=VURGU if a == "İslahiye" else GRI,
                alpha=1.0 if a == "İslahiye" else 0.75)
    a2.set_ylabel("QuakeMind kazancı (%)"); a2.set_ylim(0, 75)
    a2.set_title("Operasyonel kazanç tek yönlü artmıyor", pad=6)
    a2.legend(frameon=False, fontsize=7.5, loc="lower right")
    f.suptitle("Model seçimi: süre, doğruluk ve sevk zincirindeki karşılığı", y=1.02)
    f.savefig(CIK / "sekil_model_secimi.png", bbox_inches="tight"); plt.close(f)


# --- Sekil 4: sure dagilimi -------------------------------------------------
def sekil_sure():
    asama = ["Model çıkarımı", "Lojistik", "Kıyas kolları", "Rota koşusu",
             "Mahalle grafiği", "Kurulum"]
    sn = [9.12, 1.63, 0.49, 0.38, 0.32, 0.01]
    f, ax = plt.subplots(figsize=(5.6, 2.6))
    y = np.arange(len(asama))[::-1]
    renk = [VURGU] + [ORTA] * (len(asama) - 1)
    ax.barh(y, sn, 0.62, color=renk, edgecolor="white")
    for yi, v in zip(y, sn):
        ax.text(v + 0.18, yi, f"{v:.2f} sn".replace(".", ","), va="center", fontsize=8)
    ax.set_yticks(y); ax.set_yticklabels(asama)
    ax.set_xlabel("Süre (sn) — 20 çekirdekli CPU, 6 iş parçacığı, GPU yok")
    ax.set_xlim(0, 11.4)
    ax.set_title("Tatbikat koşusunda süre nereye gidiyor?  (toplam 15,0 sn)", pad=6)
    f.savefig(CIK / "sekil_sure_dagilimi.png"); plt.close(f)


for f in (sekil_kollar, sekil_duyarlilik, sekil_model, sekil_sure):
    f(); print("uretildi:", f.__name__)
print("dizin:", CIK)
