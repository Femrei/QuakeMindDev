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
    "rolling_mean_7d": "7 günlük ort. büyüklük",
    "rolling_std_7d": "7 günlük büyüklük std. sapma",
    "rolling_max_7d": "7 günlük maks. büyüklük",
    "event_count_7d": "7 günlük olay sayısı",
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
    X, y, _ = cp.load_dataset()
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
    fig1, ax1 = plt.subplots(figsize=(7, max(3.5, 0.35 * len(labels))))
    ax1.barh(labels, vals, color="#55A868")
    ax1.set_xlabel("Ortalama Öznitelik Önemi (CatBoost, son kat)")
    ax1.set_title("Esas Alınan CatBoost Modelinde Öznitelik Önemi")
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
