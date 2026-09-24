"""Eslesmis Wilcoxon isaretli-sira testi: R0 (naif) vs R1/R2/R3 karsilastirma referanslari.

Girdi: full_run.json (8 bolge x 10 tohum x 4 kaynak x {R0,R1,R2,R3} x 6 gorev).
Her (bolge, tohum, gorev) ucluosu bir eslesmis cift ayni senaryoda hem R0 hem
karsilastirilan yontemle kosuldugu icin, time_min_raw uzerinden eslesmis test
gecerlidir. Yalniz her iki yontemde de reachable=True olan gorevler kullanilir.
"""
import json
from pathlib import Path
from scipy.stats import wilcoxon
import numpy as np

HERE = Path(__file__).parent
data = json.load(open(HERE / "results" / "full_run.json", encoding="utf-8"))

EMSR648_DISTRICTS = {"H-Z1", "H-Z3", "K-Z1", "K-Z2"}


def paired_values(source_key, method_a="R0", method_b="R3", districts=None):
    a_vals, b_vals = [], []
    for district, ddata in data.items():
        if districts is not None and district not in districts:
            continue
        for seed, sdata in ddata["seeds"].items():
            sources = sdata["sources"]
            if source_key not in sources:
                continue
            list_a = sources[source_key][method_a]
            list_b = sources[source_key][method_b]
            for ra, rb in zip(list_a, list_b):
                if ra["reachable"] and rb["reachable"]:
                    a_vals.append(ra["time_min_raw"])
                    b_vals.append(rb["time_min_raw"])
    return np.array(a_vals), np.array(b_vals)


def run_test(label, source_key, method_a, method_b, districts=None):
    a, b = paired_values(source_key, method_a, method_b, districts)
    n = len(a)
    if n == 0:
        print(f"{label}: n=0, atlandi")
        return None
    diff = a - b
    if np.all(diff == 0):
        stat, p = float("nan"), 1.0
    else:
        stat, p = wilcoxon(a, b)
    result = {
        "label": label,
        "n": n,
        "mean_a": float(np.mean(a)),
        "mean_b": float(np.mean(b)),
        "mean_diff": float(np.mean(diff)),
        "wilcoxon_stat": float(stat) if stat == stat else None,
        "p_value": float(p),
    }
    print(f"{label}: n={n}  ort_a={result['mean_a']:.2f}  ort_b={result['mean_b']:.2f}  "
          f"fark={result['mean_diff']:.2f}  p={p:.4g}")
    return result


results = []
# Sentetik senaryo: 8 bolge, R0 (naif) vs R1 (gorus mesafeli), R2 (bilgi paylasan), R3 (onerilen)
results.append(run_test("Sentetik 8 bolge: R0 vs R1 (gorus mesafeli)", "synthetic", "R0", "R1"))
results.append(run_test("Sentetik 8 bolge: R0 vs R2 (bilgi paylasan)", "synthetic", "R0", "R2"))
results.append(run_test("Sentetik 8 bolge: R0 vs R3 (onerilen sistem)", "synthetic", "R0", "R3"))

# EMSR648 gercek hasar (4 kapsam ilcesi): R0 vs R3, orta ve gevsek kural
for source_key, adname in [("emsr648_medium", "orta"), ("emsr648_loose", "gevsek"), ("emsr648_strict", "kati")]:
    results.append(run_test(
        f"EMSR648 {adname} kural (4 ilce): R0 vs R3 (onerilen sistem)",
        source_key, "R0", "R3", districts=EMSR648_DISTRICTS))

results = [r for r in results if r is not None]
with open(HERE / "results" / "wilcoxon_test_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("\nSonuclar yazildi:", HERE / "results" / "wilcoxon_test_results.json")
