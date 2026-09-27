"""Şekil 20 - Esas alınan CatBoost modelinde Öznitelik Önemi (üstte) ve SHAP
değerlerinin özeti (altta). 08_calibration_and_shap.ipynb ile aynı tarif:
son walk-forward katında (splits[-1]) eğitilen CatBoost, aynı hiperparametreler
(iterations=800, depth=8, learning_rate=0.03, random_seed=42).

    python shap_figure.py
"""
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import shap
from catboost import CatBoostClassifier
from PIL import Image

PARENT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PARENT))
import common_preprocessing as cp  # noqa: E402

HERE = Path(__file__).resolve().parent
RESULTS = HERE / "results"
RESULTS.mkdir(parents=True, exist_ok=True)

TR_LABELS = {
    "latitude": "Enlem",
    "longitude": "Boylam",
    "depth": "Derinlik (km)",
    "rolling_mean_7d": "Son 7 olay: ort. büyüklük",
    "rolling_std_7d": "Son 7 olay: büyüklük std. sapma",
    "rolling_max_7d": "Son 7 olay: maks. büyüklük",
    "event_count_7d": "Son 7 olay: pencere doluluğu",
    "year": "Yıl",
    "month": "Ay",
    "day": "Gün",
    "hour": "Saat",
    "day_of_year": "Yılın günü",
    "days_since_start": "Başlangıçtan bu yana gün",
    "sin_month": "Ay (sin)",
    "cos_month": "Ay (cos)",
    "sin_hour": "Saat (sin)",
    "cos_hour": "Saat (cos)",
    "distance_to_fault": "Fay hattına uzaklık (km)",
}


def turkish_label(col):
    return TR_LABELS.get(col, col)


def main():
    # _7d oznitelikleri pandas rolling(window=7) ile SATIR (olay) tabanlidir,
    # gun tabanli degil. --son-tarih: makaledeki kosu 2 Agustos 2026'ya kadarki
    # katalogla yapildi (n = 13 609); katalog sonradan buyudugu icin ayni
    # kumeyi yeniden kurmak uzere ham katalog bu tarihe kadar suzulur.
    csv = None
    if '--son-tarih' in sys.argv:
        import pandas as pd, tempfile
        son = sys.argv[sys.argv.index('--son-tarih') + 1]
        ham = pd.read_csv(cp.DEFAULT_QUERY_CSV)
        ham = ham[pd.to_datetime(ham['time'], utc=True) <= pd.Timestamp(son, tz='UTC')]
        csv = Path(tempfile.gettempdir()) / 'query_suzulmus.csv'
        ham.to_csv(csv, index=False)
    X, y, _ = cp.load_dataset(csv)
    print('n =', len(X), 'pozitif oran =', round(float(y.mean()), 3))
    splits = cp.walk_forward_splits(len(X), 5)
    tr, te = splits[-1]

    model = CatBoostClassifier(iterations=800, depth=8, learning_rate=0.03,
                                loss_function="Logloss", random_seed=42, verbose=False)
    model.fit(X.iloc[tr], y.iloc[tr])

    # --- üstte: native öznitelik önemi (bu son kat modeli için) ---
    imp = np.asarray(model.get_feature_importance(), dtype=float)
    cols = X.columns.tolist()
    order = np.argsort(imp)[-15:]
    labels = [turkish_label(cols[i]) for i in order]
    vals = imp[order]
    fig1, ax1 = plt.subplots(figsize=(7.5, max(3.5, 0.35 * len(labels))))
    ax1.barh(labels, vals, color="#55A868")
    ax1.set_xlabel("Ortalama Öznitelik Önemi (CatBoost, son kat)")
    for spine in ax1.spines.values():
        spine.set_visible(False)
    ax1.set_axisbelow(True)
    ax1.grid(axis="x", color="#dddddd", linewidth=0.9)
    ax1.tick_params(length=0)
    plt.tight_layout()
    top_path = RESULTS / "shap_top_importance.png"
    plt.savefig(top_path, dpi=300)
    plt.close(fig1)

    # --- altta: SHAP özet (beeswarm) ---
    explainer = shap.TreeExplainer(model)
    sv = explainer.shap_values(X.iloc[te])
    X_te_tr = X.iloc[te].rename(columns=turkish_label)
    shap.summary_plot(sv, X_te_tr, show=False, plot_size=(7, max(3.5, 0.35 * len(cols))))
    plt.title("SHAP Değerlerinin Özeti (test katı)")
    bottom_path = RESULTS / "shap_bottom_summary.png"
    plt.savefig(bottom_path, dpi=300, bbox_inches="tight")
    plt.close("all")

    # shap.summary_plot birakiyor buyuk bir bos sol kenar birakiyor; otomatik kirp
    im = Image.open(bottom_path).convert("RGB")
    arr = np.asarray(im)
    non_white_cols = np.where((arr < 250).any(axis=(0, 2)))[0]
    if non_white_cols.size:
        left = max(0, non_white_cols[0] - 15)
        im.crop((left, 0, im.width, im.height)).save(bottom_path, dpi=(300, 300))

    for p in (top_path, bottom_path):
        im = Image.open(p)
        print("Yazıldı:", p, im.size, round(im.size[0] / im.size[1], 3))


if __name__ == "__main__":
    main()
