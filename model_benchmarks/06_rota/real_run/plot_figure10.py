"""Sekil 10 gorseli: figure10_data.json'dan harita cizimi."""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

HERE = Path(__file__).resolve().parent
DATA_PATH = HERE / "results" / "figure10_data.json"
OUT_PATH = HERE / "results" / "figure10.png"

COLOR_R0 = "#C44E52"
COLOR_R3 = "#55A868"
COLOR_CLOSED = "#999999"
COLOR_BG = "#D9D9D9"
COLOR_DISCOVERY = "#8B0000"


def main():
    d = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    r0_path = d["r0"]["path_coords"]  # [[lat, lon], ...]
    r3_path = d["r3"]["path_coords"]
    closed_edges = d["all_closed_edge_coords"]
    discovery_edges = d["discovered_edge_coords"]

    # gorunur alan: R0 + R3 rotalarinin bbox'i, %20 pay ile genisletilmis
    all_lats = [p[0] for p in r0_path] + [p[0] for p in r3_path]
    all_lons = [p[1] for p in r0_path] + [p[1] for p in r3_path]
    lat_min, lat_max = min(all_lats), max(all_lats)
    lon_min, lon_max = min(all_lons), max(all_lons)
    pad_lat = (lat_max - lat_min) * 0.25 or 0.002
    pad_lon = (lon_max - lon_min) * 0.25 or 0.002
    lat_min, lat_max = lat_min - pad_lat, lat_max + pad_lat
    lon_min, lon_max = lon_min - pad_lon, lon_max + pad_lon

    def in_view(lat, lon):
        return lat_min <= lat <= lat_max and lon_min <= lon <= lon_max

    fig, ax = plt.subplots(figsize=(8, 7))

    # arka plan: bu bolgedeki kapali kenarlarin gorunum alanina denk gelenleri
    closed_drawn = 0
    for (p1, p2) in closed_edges:
        if in_view(*p1) or in_view(*p2):
            ax.plot([p1[1], p2[1]], [p1[0], p2[0]], color=COLOR_CLOSED,
                     linewidth=1.6, linestyle=(0, (2, 2)), alpha=0.8, zorder=1)
            closed_drawn += 1

    # R0 (naif ajan) - tam yurudugu iz
    r0_lons = [p[1] for p in r0_path]
    r0_lats = [p[0] for p in r0_path]
    ax.plot(r0_lons, r0_lats, color=COLOR_R0, linewidth=2.2, alpha=0.85,
            zorder=3, label=f"Naif ajan (R0) - {d['r0']['distance_m']:.0f} m, "
                             f"{d['r0']['k_discoveries']} keşif")

    # R3 (onerilen sistem) - kusursuz bilgi rotasi
    r3_lons = [p[1] for p in r3_path]
    r3_lats = [p[0] for p in r3_path]
    ax.plot(r3_lons, r3_lats, color=COLOR_R3, linewidth=3.0, alpha=0.95,
            zorder=4, label=f"Önerilen sistem (R3) - {d['r3']['distance_m']:.0f} m, "
                             f"0 keşif")

    # kesif noktalari (R0'in kapali kenarla karsilastigi yerler)
    disc_lons, disc_lats = [], []
    for (p1, _p2) in discovery_edges:
        disc_lons.append(p1[1])
        disc_lats.append(p1[0])
    ax.scatter(disc_lons, disc_lats, marker="x", color=COLOR_DISCOVERY, s=45,
               linewidths=1.8, zorder=5, label=f"Keşif noktası (n={len(discovery_edges)})")

    # baslangic / hedef
    ax.scatter([r0_lons[0]], [r0_lats[0]], marker="s", color="black", s=70,
               zorder=6, label="Ekip karargâhı (S)")
    ax.scatter([r0_lons[-1]], [r0_lats[-1]], marker="*", color="black", s=180,
               zorder=6, label="Afetzede (T)")

    ax.set_xlim(lon_min, lon_max)
    ax.set_ylim(lat_min, lat_max)
    ax.set_aspect(1.0 / max(0.1, abs(__import__("math").cos(__import__("math").radians(
        (lat_min + lat_max) / 2)))))
    ax.set_xlabel("Boylam")
    ax.set_ylabel("Enlem")
    ax.set_title(f"{d['district']} — tohum {d['seed']}, EMSR648 {d['rule']} kural, "
                 f"örnek görev {d['od_index']}")

    legend_elems = [
        Line2D([0], [0], color=COLOR_CLOSED, linestyle=(0, (2, 2)), linewidth=1.6,
               label="Kapalı yol kesimi (EMSR648)"),
        Line2D([0], [0], color=COLOR_R0, linewidth=2.2,
               label=f"Naif ajan (R0) — {d['r0']['distance_m']:.0f} m, {d['r0']['k_discoveries']} keşif"),
        Line2D([0], [0], color=COLOR_R3, linewidth=3.0,
               label=f"Önerilen sistem (R3) — {d['r3']['distance_m']:.0f} m, 0 keşif"),
        Line2D([0], [0], marker="x", color=COLOR_DISCOVERY, linestyle="None",
               markersize=8, markeredgewidth=1.8, label=f"Keşif noktası (n={len(discovery_edges)})"),
        Line2D([0], [0], marker="s", color="black", linestyle="None", markersize=8,
               label="Ekip karargâhı (S)"),
        Line2D([0], [0], marker="*", color="black", linestyle="None", markersize=14,
               label="Afetzede (T)"),
    ]
    ax.legend(handles=legend_elems, fontsize=8, loc="best", framealpha=0.9)

    plt.tight_layout()
    plt.savefig(OUT_PATH, dpi=300)
    print(f"yazildi -> {OUT_PATH} (kapali kenar cizildi: {closed_drawn})")


if __name__ == "__main__":
    main()
