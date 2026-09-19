"""
Sekil 3: calisma alani haritasi. Dogu Anadolu Fay Zonu ana kolu, 6 Subat 2023
depremlerinin iki merkez ilcesi (Pazarcik, Elbistan) ve sekiz operasyon
bolgesinin (DISTRICTS, scenario.py) merkezleri + 3 km analiz yaricapi.

NOT (durustluk): "dis merkez" olarak gosterilen noktalar Pazarcik/Elbistan
ILCE MERKEZLERIdir (OSM/Nominatim geocode), USGS/AFAD'in bildirdigi kesin
sismolojik dis merkez koordinati DEGILDIR -- ayni yontem scenario.py'deki
bolge merkezleri icin de kullanilmaktadir (P334'te aciklandigi gibi).
Fay hatti, earthquake_risk/common_preprocessing.py::FAULT_LINES[1] (Dogu
Anadolu Fay Zonu icin tanimli ayni segment) ile birebir aynidir.
"""
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / "model_benchmarks" / "05_risk_skoru"))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse

import osmnx as ox
ox.settings.use_cache = True
ox.settings.log_console = False

from scenario import DISTRICTS, RADIUS_M
from common_preprocessing import FAULT_LINES

OUT_PATH = Path(__file__).resolve().parent / "results" / "figure3.png"

EPICENTER_QUERIES = {
    "Pazarcık (Mw 7,7)": "Pazarcık, Kahramanmaraş, Turkiye",
    "Elbistan (Mw 7,6)": "Elbistan, Kahramanmaraş, Turkiye",
}

COLOR_HATAY = "#4C72B0"
COLOR_KMARAS = "#DD8452"
COLOR_FAULT = "#555555"
COLOR_EPI = "#C44E52"


def main():
    centers = {}
    for code, cfg in DISTRICTS.items():
        centers[code] = ox.geocode(cfg["query"])
        print(f"{code}: {cfg['query']} -> {centers[code]}")

    epi = {}
    for label, query in EPICENTER_QUERIES.items():
        epi[label] = ox.geocode(query)
        print(f"{label}: {query} -> {epi[label]}")

    fault = FAULT_LINES[1]  # Dogu Anadolu Fay Zonu ana kolu
    fault_lats = [p[0] for p in fault]
    fault_lons = [p[1] for p in fault]

    fig, ax = plt.subplots(figsize=(8, 7))

    ax.plot(fault_lons, fault_lats, color=COLOR_FAULT, linewidth=2.0,
            linestyle="-", zorder=2, label="Doğu Anadolu Fay Zonu (ana kol)")

    for code, cfg in DISTRICTS.items():
        lat, lon = centers[code]
        color = COLOR_HATAY if cfg["il"] == "Hatay" else COLOR_KMARAS
        # enlem/boylam derece olcegi metrede esit olmadigindan (boylam
        # cos(enlem) ile daralir), 3 km'lik gercek yaricapi eksene gore
        # ayri ayri derece cinsine cevirip Ellipse ile ciziyoruz.
        r_deg_lat = RADIUS_M / 111320.0
        r_deg_lon = RADIUS_M / (111320.0 * math.cos(math.radians(lat)))
        ell = Ellipse((lon, lat), width=2 * r_deg_lon, height=2 * r_deg_lat,
                       facecolor=color, edgecolor=color, alpha=0.25, zorder=3)
        ax.add_patch(ell)
        ax.scatter([lon], [lat], marker="o", color=color, s=30, zorder=4,
                   edgecolor="black", linewidth=0.5)
        ax.annotate(code, (lon, lat), textcoords="offset points", xytext=(5, 4),
                    fontsize=8, color="black", zorder=5)

    for label, (lat, lon) in epi.items():
        ax.scatter([lon], [lat], marker="*", color=COLOR_EPI, s=260, zorder=6,
                   edgecolor="black", linewidth=0.8)
        ax.annotate(label, (lon, lat), textcoords="offset points", xytext=(8, -12),
                    fontsize=9, color=COLOR_EPI, weight="bold", zorder=6)

    # gorunum alani SADECE calisma bolgesi + dis merkezlere gore ayarlanir;
    # fay hatti bunun disina tasip devam edebilir (bu dogru ve beklenen -
    # Dogu Anadolu Fay Zonu calisma alanimizdan cok daha uzun).
    all_lats = [c[0] for c in centers.values()] + [e[0] for e in epi.values()]
    all_lons = [c[1] for c in centers.values()] + [e[1] for e in epi.values()]
    pad_lat = (max(all_lats) - min(all_lats)) * 0.25
    pad_lon = (max(all_lons) - min(all_lons)) * 0.25
    ax.set_xlim(min(all_lons) - pad_lon, max(all_lons) + pad_lon)
    ax.set_ylim(min(all_lats) - pad_lat, max(all_lats) + pad_lat)

    mean_lat = sum(all_lats) / len(all_lats)
    ax.set_aspect(1.0 / max(0.1, math.cos(math.radians(mean_lat))))
    ax.set_xlabel("Boylam")
    ax.set_ylabel("Enlem")
    ax.set_title("Çalışma Alanı: Hatay ve Kahramanmaraş, sekiz operasyon bölgesi")

    handles = [
        plt.Line2D([0], [0], color=COLOR_FAULT, linewidth=2.0, label="Doğu Anadolu Fay Zonu (ana kol)"),
        plt.Line2D([0], [0], marker="*", color=COLOR_EPI, linestyle="None", markersize=16,
                   markeredgecolor="black", label="6 Şubat 2023 depremleri (ilçe merkezi, yaklaşık)"),
        plt.Line2D([0], [0], marker="o", color=COLOR_HATAY, linestyle="None", markersize=8,
                   markeredgecolor="black", label="Hatay bölgeleri (5) — 3 km analiz yarıçapı"),
        plt.Line2D([0], [0], marker="o", color=COLOR_KMARAS, linestyle="None", markersize=8,
                   markeredgecolor="black", label="Kahramanmaraş bölgeleri (3) — 3 km analiz yarıçapı"),
    ]
    ax.legend(handles=handles, fontsize=8, loc="lower left", framealpha=0.9)

    plt.tight_layout()
    plt.savefig(OUT_PATH, dpi=300)
    print(f"yazildi -> {OUT_PATH}")

    meta = {"centers": {k: list(v) for k, v in centers.items()},
            "epicenters": {k: list(v) for k, v in epi.items()}}
    (Path(__file__).resolve().parent / "results" / "figure3_meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
