"""Eslesmis Wilcoxon isaretli-sira testi: 5 katli ileri yuruyen bolmede model ciftleri.

Tum modeller ayni 5 kati (run_all_risk.py'de bir kez hesaplanan splits) paylastigi
icin kat-eslestirmeli karsilastirma gecerlidir. n=5 oldugundan istatistiksel guc
dusuktur (iki-tarafli en dusuk olasi p degeri 0,0625); bu acikca raporlanir.
"""
import json
from pathlib import Path
from scipy.stats import wilcoxon
import numpy as np

HERE = Path(__file__).parent
RESULTS_DIR = HERE / "results"

MODELS = ["logistic_regression", "mlp", "random_forest", "catboost", "xgboost", "lightgbm", "stacking_ensemble"]
METRIC = "roc_auc"

fold_values = {}
means = {}
for m in MODELS:
    d = json.load(open(RESULTS_DIR / f"{m}.json", encoding="utf-8"))
    fold_values[m] = np.array([fm[METRIC] for fm in d["fold_metrics"]])
    means[m] = d[f"{METRIC}_mean"]

ranked = sorted(MODELS, key=lambda m: -means[m])
print("Siralama (roc_auc_mean):", [(m, round(means[m], 4)) for m in ranked])

PAIRS = [
    ("logistic_regression", "catboost"),   # en iyi vs uretimde kullanilan
    ("logistic_regression", "mlp"),        # en iyi vs 2.
    ("logistic_regression", "random_forest"),  # en iyi vs 3.
    ("catboost", "xgboost"),
    ("catboost", "lightgbm"),
]

results = []
for a, b in PAIRS:
    va, vb = fold_values[a], fold_values[b]
    diff = va - vb
    if np.all(diff == 0):
        stat, p = float("nan"), 1.0
    else:
        stat, p = wilcoxon(va, vb)
    r = {
        "pair": f"{a} vs {b}",
        "n_folds": len(va),
        "mean_a": float(np.mean(va)),
        "mean_b": float(np.mean(vb)),
        "mean_diff": float(np.mean(diff)),
        "wilcoxon_stat": float(stat) if stat == stat else None,
        "p_value": float(p),
    }
    results.append(r)
    print(f"{a} vs {b}: n={r['n_folds']}  {METRIC}_a={r['mean_a']:.4f}  {METRIC}_b={r['mean_b']:.4f}  "
          f"fark={r['mean_diff']:.4f}  p={p:.4g}")

with open(RESULTS_DIR / "wilcoxon_test_results.json", "w", encoding="utf-8") as f:
    json.dump({"metric": METRIC, "ranking": [(m, means[m]) for m in ranked], "pairs": results},
               f, ensure_ascii=False, indent=2)
print("\nSonuclar yazildi:", RESULTS_DIR / "wilcoxon_test_results.json")
