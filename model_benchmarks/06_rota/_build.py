"""ALAN 06 - Kapanma-farkinda rota kiyaslama defterleri.  python _build.py

Model degil algoritma kiyaslanir. Butun karsilastirmalar AYNI graf, AYNI OD
ciftleri, AYNI kapanma zemin dogrulugu (EMSR648) uzerinde.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _nbtools import md, code, write_notebook, colab_cell  # noqa: E402
SUB = "model_benchmarks/06_rota"

HERE = Path(__file__).resolve().parent

SETUP = code(
    "import sys; from pathlib import Path; sys.path.insert(0, str(Path.cwd()))",
    "import common as C",
    "C.CONFIG.update(dict(",
    "    place='Antakya, Hatay, Turkey',   # veya 'Kahramanmaras, Turkey'",
    "    n_od_pairs=120,                    # senaryo: Antakya 126, Maras 35",
    "))",
    "G = C.load_graph()",
    "closures = C.load_closures()",
    "od = C.sample_od_pairs(G, C.CONFIG['n_od_pairs'], C.CONFIG['seed'])",
    "print('dugum/kenar:', G.number_of_nodes(), G.number_of_edges(), ' kapanma:', len(closures))",
)


def main():
    (HERE / "data").mkdir(exist_ok=True)

    write_notebook(HERE / "01_risk_weighted_astar.ipynb", [
        md("# Risk-agirlikli A* - Kapanma-farkinda rota", "",
           "**Referans satiri.** Sert kapatma (25 m) + hasar yakinligina gore kenar cezasi.  ",
           "Butun kiyaslar `common.py` uzerinden AYNI graf / OD / kapanma."),
        colab_cell(SUB, "osmnx pyrosm networkx"),
        md("## 1. Graf + kapanma + OD ciftleri"), SETUP,
        md("## 2. Tam model (hard + soft) ile rota"),
        code(
            "H = C.apply_damage(G, closures, C.CONFIG, mode='full')",
            "metrics, routes = C.evaluate_routes(H, od, algo='astar')",
            "metrics",
        ),
        md("## 3. Referans yollari sakla (rota degisim orani icin)"),
        code(
            "baseline_paths = [r['path'] if r['ok'] else None for r in routes]",
            "import pickle; pickle.dump(baseline_paths, open('data/baseline_paths.pkl', 'wb'))",
            "C.save_result('risk_weighted_astar', metrics, extra={'mode': 'full'})",
        ),
        md("## 4. 80/80 erisilebilirlik egrisi"),
        code(
            "acc = C.accessibility_80_80(G, closures, od, C.CONFIG)",
            "print('curve:', acc['curve'])",
            "print('%80 erisim korunan max bozulma:', acc['max_disruption_at_80pct_access'])",
        ),
    ])

    write_notebook(HERE / "02_naive_agent.ipynb", [
        md("# Naif ajan (kapanma bilgisiz) - taban", "",
           "Bilgi kazancini gosterir. **Mesafe farki ve U-donusu cezasi AYRI verilmeli** "
           "- kazancin %94,8'i varsayimdan geliyor (planda not edildi)."),
        colab_cell(SUB, "osmnx pyrosm networkx"),
        md("## 1. Graf"), SETUP,
        md("## 2. Kapanmasiz rota (mode='none')"),
        code(
            "H0 = C.apply_damage(G, closures, C.CONFIG, mode='none')",
            "import pickle; base = pickle.load(open('data/baseline_paths.pkl', 'rb')) if Path('data/baseline_paths.pkl').exists() else None",
            "metrics, routes = C.evaluate_routes(H0, od, algo='astar', baseline_paths=base)",
            "# naif ajan gercekte kapali kenarlara girer -> fiili basarisizligi ayrica olc:",
            "Hreal = C.apply_damage(G, closures, C.CONFIG, mode='hard')",
            "actual_fail = sum(1 for (s,t), r in zip(od, routes) if r['ok'] and not C.route_once(Hreal, s, t)['ok'])",
            "metrics['actual_blocked_rate'] = actual_fail / len(od)",
            "metrics",
        ),
        code("C.save_result('naive_agent', metrics)"),
    ])

    write_notebook(HERE / "03_pure_shortest_path.ipynb", [
        md("# Saf en kisa yol (ceza yok) - yumusak ceza ablasyonu", "",
           "Sadece sert kapatma, hasar cezasi yok. Yumusak cezanin katkisini izole eder."),
        colab_cell(SUB, "osmnx pyrosm networkx"),
        md("## 1. Graf"), SETUP,
        md("## 2. mode='hard'"),
        code(
            "H = C.apply_damage(G, closures, C.CONFIG, mode='hard')",
            "import pickle; base = pickle.load(open('data/baseline_paths.pkl','rb')) if Path('data/baseline_paths.pkl').exists() else None",
            "metrics, _ = C.evaluate_routes(H, od, algo='astar', baseline_paths=base)",
            "C.save_result('pure_shortest_hard_only', metrics); metrics",
        ),
    ])

    write_notebook(HERE / "04_algo_comparison.ipynb", [
        md("# Dijkstra vs A* vs cift yonlu A* - hesap suresi", "",
           "'<10 sn' iddiasinin dayanagi. Ayni graf, ayni OD, uc algoritma."),
        colab_cell(SUB, "osmnx pyrosm networkx"),
        md("## 1. Graf"), SETUP,
        md("## 2. Uc algoritma"),
        code(
            "H = C.apply_damage(G, closures, C.CONFIG, mode='full')",
            "for algo in ['dijkstra', 'astar', 'bidirectional']:",
            "    m, _ = C.evaluate_routes(H, od, algo=algo)",
            "    C.save_result(f'algo_{algo}', m)",
            "    print(f\"{algo:14s} ort {m['mean_compute_s']*1000:.1f} ms  p95 {m['p95_compute_s']*1000:.1f} ms\")",
        ),
    ])

    write_notebook(HERE / "05_osrm.ipynb", [
        md("# OSRM (Contraction Hierarchies) - endustri hiz tabani", "",
           "Yerel OSRM sunucusu gerekir:  ",
           "```bash",
           "docker run -t -v $PWD:/data ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/turkey.osm.pbf",
           "osrm-partition ... ; osrm-customize ... ; osrm-routed --algorithm mld /data/turkey.osrm",
           "```"),
        colab_cell(SUB, "requests"),
        md("## 1. Graf + OD"), SETUP,
        md("## 2. OSRM'e sor"),
        code(
            "import requests, time, numpy as np",
            "OSRM = 'http://localhost:5000'",
            "def osrm_route(s, t):",
            "    a = (G.nodes[s]['x'], G.nodes[s]['y']); b = (G.nodes[t]['x'], G.nodes[t]['y'])",
            "    t0 = time.perf_counter()",
            "    r = requests.get(f\"{OSRM}/route/v1/driving/{a[0]},{a[1]};{b[0]},{b[1]}?overview=false\").json()",
            "    dt = time.perf_counter() - t0",
            "    if r.get('code') != 'Ok': return None",
            "    leg = r['routes'][0]",
            "    return dict(travel_time_s=leg['duration'], distance_m=leg['distance'], compute_s=dt, ok=True)",
            "rs = [osrm_route(s, t) for s, t in od]; ok = [x for x in rs if x]",
            "metrics = dict(n_pairs=len(rs), failed_route_rate=1-len(ok)/len(rs),",
            "               accessibility_ratio=len(ok)/len(rs),",
            "               mean_travel_time_s=float(np.mean([x['travel_time_s'] for x in ok])),",
            "               mean_distance_m=float(np.mean([x['distance_m'] for x in ok])),",
            "               mean_compute_s=float(np.mean([x['compute_s'] for x in ok])))",
            "C.save_result('osrm_ch', metrics); metrics",
        ),
    ])

    write_notebook(HERE / "06_openrouteservice_avoid_areas.ipynb", [
        md("# openrouteservice avoid_areas - sahada kullanilan sistem", "",
           "2023 Turkiye'de MSF bunu kullandi. **Farkimiz:** onlar kapanmayi elle "
           "haritaliyor, biz modelden cikariyoruz. Bu defter kapanmalari avoid_areas "
           "poligonu olarak verip ORS'yi kiyaslar."),
        colab_cell(SUB, "openrouteservice"),
        md("## 1. Graf + OD"), SETUP,
        md("## 2. ORS (yerel veya API anahtari)"),
        code(
            "import openrouteservice as ors, numpy as np, time",
            "client = ors.Client(base_url='http://localhost:8080/ors')  # veya key=...",
            "from shapely.geometry import Point, mapping",
            "avoid = mapping(__import__('shapely.ops', fromlist=['unary_union']).unary_union(",
            "    [Point(lon, lat).buffer(0.0003) for lat, lon in closures]))",
            "def ors_route(s, t):",
            "    a = [G.nodes[s]['x'], G.nodes[s]['y']]; b = [G.nodes[t]['x'], G.nodes[t]['y']]",
            "    t0 = time.perf_counter()",
            "    try:",
            "        r = client.directions([a, b], profile='driving-car', options={'avoid_polygons': avoid})",
            "        dt = time.perf_counter() - t0; seg = r['routes'][0]['summary']",
            "        return dict(travel_time_s=seg['duration'], distance_m=seg['distance'], compute_s=dt, ok=True)",
            "    except Exception:",
            "        return None",
            "rs = [ors_route(s, t) for s, t in od]; ok = [x for x in rs if x]",
            "metrics = dict(n_pairs=len(rs), failed_route_rate=1-len(ok)/len(rs), accessibility_ratio=len(ok)/len(rs),",
            "               mean_travel_time_s=float(np.mean([x['travel_time_s'] for x in ok])) if ok else float('nan'),",
            "               mean_distance_m=float(np.mean([x['distance_m'] for x in ok])) if ok else float('nan'),",
            "               mean_compute_s=float(np.mean([x['compute_s'] for x in ok])) if ok else float('nan'))",
            "C.save_result('openrouteservice_avoid', metrics); metrics",
        ),
    ])

    write_notebook(HERE / "00_leaderboard.ipynb", [
        md("# 06 Rota - Ozet Tablo", "",
           "Metrikler: seyahat suresi, mesafe, basarisiz rota orani, hesap suresi, "
           "erisilebilirlik orani, rota degisim orani, 80/80 siniri."),
        code(
            "import json, pandas as pd; from pathlib import Path",
            "rows = [json.load(open(f)) for f in sorted(Path('results').glob('*.json'))]",
            "cols = ['method','mean_travel_time_s','mean_distance_m','failed_route_rate','accessibility_ratio',",
            "        'mean_compute_s','p95_compute_s','route_change_rate']",
            "tbl = pd.DataFrame([{k: r.get(k) for k in cols} for r in rows])",
            "display(tbl.round(3)); print(tbl.round(3).to_latex(index=False))",
        ),
    ])


if __name__ == "__main__":
    main()
