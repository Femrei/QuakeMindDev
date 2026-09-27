"""R0b duzeltmesi (27 Eylul 2026).

`naive_baselines.py` "yalniz sismisite yogunlugu" tabanini `event_count_7d` ile
kosuyordu. Bu oznitelik pandas rolling(window=7).count() oldugundan 13 609
kaydin hepsinde 7'dir (sabit); taban tanim geregi ROC-AUC = 0,5 veriyordu.
Makalenin tanimladigi taban "son yedi olayin ortalama buyuklugu"dur
(`rolling_mean_7d`). Bu betik:

  1. Makaledeki kosuyla ayni kumeyi kurar (katalog 2 Agustos 2026'ya kadar
     suzulur; n = 13 609 dogrulanir),
  2. R0a'yi (fay mesafesi) yeniden uretip Tablo 23 ile karsilastirir -- duzenek
     dogrulamasi,
  3. R0b'yi `rolling_mean_7d` ile kosar ve `results/naive_seismicity_mean7.json`
     yazar (eski `naive_seismicity.json`'a dokunmaz).
"""
import json
import sys
import tempfile
import time
from pathlib import Path

import numpy as np
import pandas as pd

PARENT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PARENT))
import common_preprocessing as cp  # noqa: E402

HERE = Path(__file__).resolve().parent
RESULTS = HERE / "results"
SON_TARIH = "2026-08-02T23:59:59"

ham = pd.read_csv(cp.DEFAULT_QUERY_CSV)
ham = ham[pd.to_datetime(ham["time"], utc=True) <= pd.Timestamp(SON_TARIH, tz="UTC")]
csv = Path(tempfile.gettempdir()) / "query_suzulmus_r0b.csv"
ham.to_csv(csv, index=False)
X, y, _ = cp.load_dataset(csv)
assert len(X) == 13609, len(X)
splits = cp.walk_forward_splits(len(X), 5)
print(f"n = {len(X)}  pozitif oran = {y.mean():.4f}")


def siralama(kolon, artan):
    """naive_baselines.run_naive ile ayni: kat icinde min-max -> olasilik."""
    olc = []
    t0 = time.time()
    for tr, te in splits:
        ham_skor = X[kolon].iloc[te].values.astype(float)
        lo, hi = np.nanmin(ham_skor), np.nanmax(ham_skor)
        norm = (ham_skor - lo) / (hi - lo) if hi > lo else np.zeros_like(ham_skor)
        norm = np.nan_to_num(norm, nan=0.0)
        olc.append(cp.evaluate_predictions(y.iloc[te], (1.0 - norm) if artan else norm))
    return cp.aggregate_folds(olc), olc, time.time() - t0


r0a, _, _ = siralama("distance_to_fault", artan=True)
print("R0a (dogrulama; Tablo 23: ROC 0,5333 ± 0,0283, PR 0,3074, MCC 0,0305):")
print(f"   ROC {r0a['roc_auc_mean']:.4f} ± {r0a['roc_auc_std']:.4f}  PR {r0a['pr_auc_mean']:.4f}  "
      f"F1 {r0a['f1_mean']:.4f}  BalAcc {r0a['balanced_accuracy_mean']:.4f}  "
      f"Brier {r0a['brier_mean']:.4f}  MCC {r0a['mcc_mean']:.4f}")

r0b, katlar, sure = siralama("rolling_mean_7d", artan=False)
print("R0b (rolling_mean_7d):")
print(f"   ROC {r0b['roc_auc_mean']:.4f} ± {r0b['roc_auc_std']:.4f}  PR {r0b['pr_auc_mean']:.4f}  "
      f"F1 {r0b['f1_mean']:.4f}  BalAcc {r0b['balanced_accuracy_mean']:.4f}  "
      f"Brier {r0b['brier_mean']:.4f}  MCC {r0b['mcc_mean']:.4f}")

(RESULTS / "naive_seismicity_mean7.json").write_text(json.dumps({
    "model": "naive_seismicity_mean7",
    "title": "Naif -- Son 7 olayin ortalama buyuklugu (r0b, duzeltilmis)",
    **r0b, "fold_metrics": katlar,
    "params": {"type": "tek_oznitelikli_siralama", "feature": "rolling_mean_7d",
               "ascending": False, "katalog_son_tarih": SON_TARIH, "n": int(len(X))},
    "train_seconds": round(sure, 4),
    "r0a_dogrulama": {k: r0a[k] for k in ("roc_auc_mean", "roc_auc_std", "pr_auc_mean", "mcc_mean")},
}, indent=2, ensure_ascii=False), encoding="utf-8")
print("yazildi:", RESULTS / "naive_seismicity_mean7.json")
