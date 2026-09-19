"""
Kucuk olcekli DOGRULAMA kosumu: H-Z1 (Antakya) + K-Z1 (Onikisubat),
az sayida OD cifti, az tohum. Amac: Algoritma 1/2 + EMSR648 eslemenin
gercek veriyle DOGRU ve MANTIKLI calistigini kanitlamak (R0 > R3 sure,
k>0 bazi kosumlarda, EMSR648 oranlari indirilen veriyle tutarli, vb.)
Once bu dogrulanacak, sonra kapsam genisletilecek.
"""
import json
import statistics as st
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from scenario import load_district, sample_od_pairs, DISTRICTS
from synthetic_closures import generate_synthetic_closures
from emsr648_closures import closed_osm_edges, damage_counts
from naive_agent import naive_agent_run, line_of_sight_run, perfect_info_run

RESULTS_DIR = Path(__file__).resolve().parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

N_OD_PAIRS = 6
SEEDS = [42, 43, 44]
V_ORT_KMH = 15.0
T_U_MIN = 20.0


def run_for_district(code):
    print(f"\n=== {code} ({DISTRICTS[code]['query']}) ===")
    dg = load_district(code)
    G = dg.G
    print(f"graf: {G.number_of_nodes()} dugum, {G.number_of_edges()} kenar, merkez={dg.center}")

    aoi = DISTRICTS[code]["aoi"]
    print(f"EMSR648 {aoi} hasar dagilimi (tum AOI, bu bolgeyle sinirli degil):", damage_counts(aoi))

    emsr_closed = {}
    for rule in ("strict", "medium", "loose"):
        closed = closed_osm_edges(G, aoi, rule)
        emsr_closed[rule] = closed
        print(f"  EMSR648 [{rule}] bu bolge grafinde kapali kenar sayisi: {len(closed)} / {G.number_of_edges()}")

    od_pairs_by_seed = {seed: sample_od_pairs(G, N_OD_PAIRS, seed) for seed in SEEDS}

    district_result = {"district": code, "n_nodes": G.number_of_nodes(),
                        "n_edges": G.number_of_edges(), "emsr648_closed_edge_counts": {
                            rule: len(s) for rule, s in emsr_closed.items()},
                        "seeds": {}}

    for seed in SEEDS:
        synth_closed, synth_info = generate_synthetic_closures(G, rho0=0.18, seed=seed, alpha=0.92, max_tries=6)
        print(f"  seed={seed}: sentetik kapanma -> {len(synth_closed)} kenar "
              f"(etkin oran={synth_info['effective_rho']:.4f}, yarilama={synth_info['halvings']})")

        seed_out = {"synthetic": {"n_closed_edges": len(synth_closed), **synth_info},
                    "od_pairs": od_pairs_by_seed[seed], "runs": []}

        for pair_i, (s, t) in enumerate(od_pairs_by_seed[seed]):
            t_pair0 = time.time()
            row = {"s": s, "t": t}
            for source_name, closed_set in [("synthetic", synth_closed),
                                             ("emsr648_medium", emsr_closed["medium"])]:
                t0 = time.time(); r0 = naive_agent_run(G, closed_set, s, t, v_ort_kmh=V_ORT_KMH, t_u_min=T_U_MIN)
                t1 = time.time(); r1 = line_of_sight_run(G, closed_set, s, t, v_ort_kmh=V_ORT_KMH, t_u_min=T_U_MIN)
                t2 = time.time(); r3 = perfect_info_run(G, closed_set, s, t, v_ort_kmh=V_ORT_KMH)
                t3 = time.time()
                print(f"    seed={seed} pair#{pair_i} ({s}->{t}) [{source_name}]: "
                      f"R0={t1-t0:.2f}s R1={t2-t1:.2f}s R3={t3-t2:.2f}s", flush=True)
                row[source_name] = {
                    "R0": vars(r0) if not isinstance(r0, dict) else r0,
                    "R1": vars(r1),
                    "R3": vars(r3),
                }
            seed_out["runs"].append(row)
            print(f"    -> pair#{pair_i} toplam {time.time()-t_pair0:.2f}s", flush=True)
        district_result["seeds"][seed] = seed_out

    return district_result


def summarize(district_result):
    print(f"\n--- OZET: {district_result['district']} ---")
    for source in ("synthetic", "emsr648_medium"):
        r0_times, r3_times, r0_k = [], [], []
        unreachable_r0 = 0
        for seed, seed_out in district_result["seeds"].items():
            for row in seed_out["runs"]:
                r0 = row[source]["R0"]
                r3 = row[source]["R3"]
                if r0["reachable"]:
                    r0_times.append(r0["time_min"])
                    r0_k.append(r0["k_discoveries"])
                else:
                    unreachable_r0 += 1
                if r3["reachable"]:
                    r3_times.append(r3["time_min"])
        if r0_times and r3_times:
            print(f"  [{source}] R0 ortalama sure={st.mean(r0_times):.1f} dk "
                  f"(k ortalama={st.mean(r0_k):.2f}) | R3 ortalama sure={st.mean(r3_times):.1f} dk "
                  f"| R0 ulasilamayan={unreachable_r0}")
        else:
            print(f"  [{source}] yetersiz veri (R0 ok={len(r0_times)}, R3 ok={len(r3_times)})")


if __name__ == "__main__":
    t0 = time.time()
    all_results = {}
    for code in DISTRICTS:
        res = run_for_district(code)
        all_results[code] = res
        summarize(res)

    out_path = RESULTS_DIR / "small_validation_run.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    print(f"\nToplam sure: {time.time()-t0:.1f} sn. Sonuc: {out_path}")
