"""M-09: iki naif risk tabani -- yalniz fay mesafesi, yalniz sismisite yogunlugu."""
import sys, json, time
from pathlib import Path
import numpy as np

PARENT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PARENT))
import common_preprocessing as cp

HERE = Path(__file__).resolve().parent
RESULTS = HERE / "results"

X, y, df_main = cp.load_dataset()
splits = cp.walk_forward_splits(len(X), 5)

def run_naive(name, title, score_col, ascending):
    fold_metrics = []
    t0 = time.time()
    for i, (tr, te) in enumerate(splits, 1):
        raw = X[score_col].iloc[te].values.astype(float)
        # min-max normalize within test fold to a pseudo-probability in [0,1]
        lo, hi = raw.min(), raw.max()
        norm = (raw - lo) / (hi - lo) if hi > lo else np.zeros_like(raw)
        prob = (1.0 - norm) if ascending else norm
        m = cp.evaluate_predictions(y.iloc[te], prob)
        fold_metrics.append(m)
        print(f"[{name}] fold {i}/{len(splits)}: ROC-AUC={m['roc_auc']:.3f} PR-AUC={m['pr_auc']:.3f} n={m['n']}")
    train_s = time.time() - t0
    agg = cp.aggregate_folds(fold_metrics)
    payload = {"model": name, "title": title, **agg, "fold_metrics": fold_metrics,
               "params": {"type": "tek_oznitelikli_siralama", "feature": score_col, "ascending": ascending},
               "train_seconds": round(train_s, 4)}
    with open(RESULTS / f"{name}.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    return agg

print(f"Ornek sayisi: {len(X)}  Pozitif oran: {y.mean():.4f}\n")

r1 = run_naive("naive_fault_distance", "Naif -- Yalnizca Fay Mesafesi (r0a)", "distance_to_fault", ascending=True)
print()
r2 = run_naive("naive_seismicity", "Naif -- Yalnizca Sismisite Yogunlugu (r0b)", "event_count_7d", ascending=False)

print("\n=== OZET ===")
for name, r in [("Fay mesafesi", r1), ("Sismisite yogunlugu", r2)]:
    print(f"{name}: ROC-AUC={r['roc_auc_mean']:.4f}+-{r['roc_auc_std']:.4f}  "
          f"PR-AUC={r['pr_auc_mean']:.4f}+-{r['pr_auc_std']:.4f}  F1={r['f1_mean']:.4f}  "
          f"BalAcc={r['balanced_accuracy_mean']:.4f}  Brier={r['brier_mean']:.4f}  MCC={r['mcc_mean']:.4f}")
