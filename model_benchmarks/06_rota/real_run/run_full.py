"""
Tam olcekli kosum: 8 bolge (H-Z1..H-Z5, K-Z1..K-Z3), tohum 42-51 (Algoritma
2'nin makalede kullanilan araligi), bolge basina 6 OD cifti (afetzede-ekip
temsili). Her (bolge, tohum, kapanma-kaynagi, OD cifti) icin R0, R1, R3 ve
R2 (filo, ayni tohum/kaynaktaki tum ciftler ayni K_shared'i paylasir)
kosulur. Ham L (mesafe) ve k (kesif sayisi) saklanir; T = L/v_ort + k*t_u
turetimi analiz asamasinda (analyze.py) yapilir ki t_u/v_ort duyarliligi
YENIDEN SIMULASYON GEREKTIRMEDEN hesaplanabilsin.

Notlar / kapsam disi birakilanlar (durustluk icin):
  - r_h (sert kapatma yaricapi) duyarliligi ve SegFormer-turevli kapanmalar
    (Tablo 18) bu kosuma DAHIL DEGIL: bu, yol hasari bolutleme modelinin
    kendisini gerektirir (Tablo 5/6 karari bekliyor), routing katmaniyla
    ilgisizdir.
  - Victim/team/HQ sayilari (8 bolgede 6'sar cift = 48/tohum) orijinal
    makalenin 18 afetzede/18 ekip sayisiyla BIREBIR AYNI DEGIL - orijinal
    tam konumlar kayip. Bu, ayni algoritmayla YENI ve tekrarlanabilir bir
    sahne.
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from scenario import load_district, DISTRICTS
from synthetic_closures import generate_synthetic_closures
from emsr648_closures import closed_osm_edges
from naive_agent import naive_agent_run, line_of_sight_run, perfect_info_run, fleet_r2_run
from assignment import (build_victims_and_teams, run_algorithm3,
                         test_duplicate_dispatch_on_real_scenario)

RESULTS_DIR = Path(__file__).resolve().parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

N_OD_PAIRS = 6
SEEDS = list(range(42, 52))  # 42..51, Algoritma 2 ile ayni aralik
RULES = ("strict", "medium", "loose")


def rr_to_dict(r):
    return {"reachable": r.reachable, "distance_m": r.distance_m,
            "k_discoveries": r.k_discoveries, "time_min_raw": r.time_min}


def run_district(code):
    cfg = DISTRICTS[code]
    print(f"\n=== {code} ({cfg['query']}) ===", flush=True)
    t_start = time.time()
    dg = load_district(code)
    G = dg.G
    print(f"graf: {G.number_of_nodes()} dugum, {G.number_of_edges()} kenar "
          f"({time.time()-t_start:.1f}s)", flush=True)

    emsr_closed = {}
    if cfg["aoi"] is not None:
        for rule in RULES:
            emsr_closed[rule] = closed_osm_edges(G, cfg["aoi"], rule)
            print(f"  EMSR648[{rule}]: {len(emsr_closed[rule])} kenar", flush=True)
    else:
        print("  EMSR648 kapsami disi (bu bolge icin sadece sentetik).", flush=True)

    out = {"district": code, "il": cfg["il"], "n_nodes": G.number_of_nodes(),
           "n_edges": G.number_of_edges(), "aoi": cfg["aoi"],
           "emsr648_closed_counts": {r: len(s) for r, s in emsr_closed.items()},
           "seeds": {}}

    for seed in SEEDS:
        t_seed = time.time()
        synth_closed, synth_info = generate_synthetic_closures(G, rho0=0.18, seed=seed, alpha=0.92, max_tries=6)

        victims, teams = build_victims_and_teams(G, N_OD_PAIRS, seed)
        assignments, lock = run_algorithm3(G, victims, teams)
        od_pairs = [(t["hq_node"], v["node"]) for (t, v, _role) in assignments]
        dup_test = test_duplicate_dispatch_on_real_scenario(assignments, lock, n_attempts=5)
        assignment_info = {
            "n_victims": len(victims), "n_teams": len(teams),
            "n_assigned": len(assignments),
            "roles_used": [role for (_t, _v, role) in assignments],
            "statuses": [v["status"] for v in victims],
            "duplicate_dispatch_test": dup_test,
        }

        sources = {"synthetic": synth_closed}
        if emsr_closed:
            sources["emsr648_strict"] = emsr_closed["strict"]
            sources["emsr648_medium"] = emsr_closed["medium"]
            sources["emsr648_loose"] = emsr_closed["loose"]

        seed_out = {"synthetic_info": synth_info, "od_pairs": od_pairs,
                    "assignment": assignment_info, "sources": {}}
        for source_name, closed_set in sources.items():
            r0_list, r1_list, r3_list = [], [], []
            for (s, t) in od_pairs:
                r0_list.append(rr_to_dict(naive_agent_run(G, closed_set, s, t)))
                r1_list.append(rr_to_dict(line_of_sight_run(G, closed_set, s, t)))
                r3_list.append(rr_to_dict(perfect_info_run(G, closed_set, s, t)))
            r2_results, _shared = fleet_r2_run(G, closed_set, od_pairs)
            r2_list = [rr_to_dict(r) for r in r2_results]
            seed_out["sources"][source_name] = {
                "R0": r0_list, "R1": r1_list, "R2": r2_list, "R3": r3_list,
            }
        out["seeds"][seed] = seed_out
        print(f"  seed={seed} tamam ({time.time()-t_seed:.1f}s, "
              f"sentetik kapali={len(synth_closed)}, atama={len(assignments)}/{N_OD_PAIRS}, "
              f"mukerrer_red={dup_test['n_rejected']}/{dup_test['n_attempts']})", flush=True)

    print(f"  {code} toplam: {time.time()-t_start:.1f}s", flush=True)
    return out


if __name__ == "__main__":
    t0 = time.time()
    all_out = {}
    for code in DISTRICTS:
        res = run_district(code)
        all_out[code] = res
        # her bolgeden sonra ara kaydet (uzun kosumda veri kaybini onlemek icin)
        with open(RESULTS_DIR / "full_run.json", "w", encoding="utf-8") as f:
            json.dump(all_out, f, ensure_ascii=False)
    print(f"\nTOPLAM SURE: {time.time()-t0:.1f}s")
