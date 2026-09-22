"""
Sekil 16 (model karsilastirma) ve Sekil 18 (fold varyansi) icin, belgenin
geri kalanindaki temiz stille (grid'siz cerceve, yalniz yatay izgara)
uyumlu yeniden uretim. Ham OOF tahminleri diskte olmadigindan (yalniz
ozet metrikler + fold_metrics kaydedilmis), ROC/PR/kalibrasyon egrileri
(Sekil 17, 19) bu script'in kapsami disindadir -- onlar icin modellerin
yeniden kosulmasi gerekir.

Veri kaynagi: results/*.json (run_all_risk.py'nin onceki cikisi, degistirilmedi).
"""
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

HERE = Path(__file__).resolve().parent
RESULTS = HERE / "results"

MODEL_FILES = {
    "logistic_regression": "Lojistik Regresyon",
    "mlp": "Çok Katmanlı Algılayıcı",
    "random_forest": "Rastgele Orman",
    "catboost": "CatBoost",
    "xgboost": "XGBoost",
    "lightgbm": "LightGBM",
    "stacking_ensemble": "Yığınlanmış Topluluk (Cat+LGBM+RF)",
}

BLUE = "#2f6fed"
ORANGE = "#e2711d"
BAR_COLORS = ["#4C72B0", "#DD8452", "#55A868", "#C44E52", "#8172B2", "#937860", "#DA8BC3"]


def clean_axes(ax, x_grid=False):
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.set_axisbelow(True)
    ax.grid(axis="y", color="#dddddd", linewidth=0.9)
    if x_grid:
        ax.grid(axis="x", color="#dddddd", linewidth=0.9)
    ax.tick_params(length=0)


def load_all():
    out = {}
    for fname, title in MODEL_FILES.items():
        p = RESULTS / f"{fname}.json"
        if not p.exists():
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        d["title"] = title
        out[fname] = d
    return out


def plot_comparison_bar(all_results):
    names = [r["title"] for r in all_results.values()]
    roc = [r["roc_auc_mean"] for r in all_results.values()]
    roc_std = [r["roc_auc_std"] for r in all_results.values()]
    f1 = [r["f1_mean"] for r in all_results.values()]
    f1_std = [r["f1_std"] for r in all_results.values()]

    order = np.argsort(roc)[::-1]
    names = [names[i] for i in order]
    roc = [roc[i] for i in order]; roc_std = [roc_std[i] for i in order]
    f1 = [f1[i] for i in order]; f1_std = [f1_std[i] for i in order]

    x = np.arange(len(names)); w = 0.35
    fig, ax = plt.subplots(figsize=(max(7, 1.3 * len(names)), 5.2), facecolor="white")
    ax.bar(x - w/2, roc, w, yerr=roc_std, capsize=3, label="ROC-AUC (ort. ± ss, 5-kat)", color=BLUE)
    ax.bar(x + w/2, f1, w, yerr=f1_std, capsize=3, label="F₁ (ort. ± ss, 5-kat)", color=ORANGE)
    ax.set_xticks(x); ax.set_xticklabels(names, rotation=20, ha="right")
    ax.set_ylim(0, 1.02); ax.set_ylabel("Skor")
    clean_axes(ax)
    ax.legend(frameon=False, loc="upper right")
    ax.axhline(0.5, color="#999999", linewidth=1, linestyle="--", zorder=1)
    fig.tight_layout()
    fig.savefig(RESULTS / "00_comparison_chart_clean.png", dpi=300, facecolor="white")
    plt.close(fig)


def plot_fold_variance(all_results):
    names, data = [], []
    for r in all_results.values():
        vals = [fm["roc_auc"] for fm in r["fold_metrics"] if fm["roc_auc"] == fm["roc_auc"]]
        if vals:
            names.append(r["title"])
            data.append(vals)
    order = np.argsort([np.mean(d) for d in data])[::-1]
    names = [names[i] for i in order]; data = [data[i] for i in order]

    fig, ax = plt.subplots(figsize=(max(7, 1.2 * len(names)), 5.2), facecolor="white")
    bp = ax.boxplot(data, tick_labels=names, patch_artist=True, widths=0.55,
                     medianprops=dict(color="#333333", linewidth=1.6),
                     whiskerprops=dict(color="#888888"), capprops=dict(color="#888888"))
    for i, box in enumerate(bp["boxes"]):
        box.set_facecolor(BAR_COLORS[i % len(BAR_COLORS)])
        box.set_alpha(0.55)
        box.set_edgecolor(BAR_COLORS[i % len(BAR_COLORS)])
    for i, vals in enumerate(data):
        ax.scatter([i + 1] * len(vals), vals, color="#333333", s=18, zorder=3)
    ax.set_xticklabels(names, rotation=20, ha="right")
    ax.set_ylabel("Fold Bazlı ROC-AUC")
    clean_axes(ax)
    fig.tight_layout()
    fig.savefig(RESULTS / "fold_variance_clean.png", dpi=300, facecolor="white")
    plt.close(fig)


FEATURE_TR = {
    "days_since_start": "Başlangıçtan bu yana gün",
    "latitude": "Enlem",
    "longitude": "Boylam",
    "distance_to_fault": "Fay hattına uzaklık (km)",
    "day_of_year": "Yılın günü",
    "cos_month": "Ay (cos)",
    "rolling_std_7d": "7 günlük büyüklük std. sapma",
    "rolling_mean_7d": "7 günlük ort. büyüklük",
    "sin_month": "Ay (sin)",
    "day": "Gün",
    "year": "Yıl",
    "rolling_max_7d": "7 günlük maks. büyüklük",
    "month": "Ay",
    "depth": "Derinlik (km)",
    "sin_hour": "Saat (sin)",
    "cos_hour": "Saat (cos)",
    "hour": "Saat",
    "event_count_7d": "7 günlük olay sayısı",
}


def plot_feature_importance(all_results, name):
    r = all_results.get(name)
    if not r or not r.get("feature_importance"):
        return
    imp = {FEATURE_TR.get(k, k): v for k, v in r["feature_importance"].items()}
    items = sorted(imp.items(), key=lambda x: x[1])[-15:]
    labels, vals = zip(*items)
    fig, ax = plt.subplots(figsize=(7.5, max(4, 0.35 * len(labels))), facecolor="white")
    ax.barh(labels, vals, color="#55A868")
    ax.set_xlabel("Ortalama Öznitelik Önemi (5-kat ortalaması)")
    clean_axes(ax, x_grid=True)
    ax.grid(axis="y", visible=False)
    fig.tight_layout()
    fig.savefig(RESULTS / f"{name}_feature_importance_clean.png", dpi=300, facecolor="white")
    plt.close(fig)


def plot_roc_pr_calibration_clean(all_results):
    from sklearn.metrics import roc_curve, roc_auc_score, precision_recall_curve, average_precision_score
    from sklearn.calibration import calibration_curve

    # --- ROC ---
    fig, ax = plt.subplots(figsize=(6.8, 6.2), facecolor="white")
    for i, r in enumerate(all_results.values()):
        fpr, tpr, _ = roc_curve(r["oof_true"], r["oof_prob"])
        auc = roc_auc_score(r["oof_true"], r["oof_prob"])
        ax.plot(fpr, tpr, label=f"{r['title']} (AUC={auc:.3f})", color=BAR_COLORS[i % len(BAR_COLORS)], linewidth=1.9)
    ax.plot([0, 1], [0, 1], "--", color="#999999", linewidth=1)
    ax.set_xlabel("Yanlış Pozitif Oranı"); ax.set_ylabel("Doğru Pozitif Oranı")
    clean_axes(ax, x_grid=True)
    ax.legend(fontsize=9, loc="lower right", frameon=False)
    fig.tight_layout()
    fig.savefig(RESULTS / "roc_overlay_clean.png", dpi=300, facecolor="white")
    plt.close(fig)

    # --- PR ---
    fig, ax = plt.subplots(figsize=(6.8, 6.2), facecolor="white")
    base_rate = None
    for i, r in enumerate(all_results.values()):
        prec, rec, _ = precision_recall_curve(r["oof_true"], r["oof_prob"])
        ap = average_precision_score(r["oof_true"], r["oof_prob"])
        ax.plot(rec, prec, label=f"{r['title']} (AP={ap:.3f})", color=BAR_COLORS[i % len(BAR_COLORS)], linewidth=1.9)
        base_rate = float(np.mean(r["oof_true"]))
    if base_rate is not None:
        ax.axhline(base_rate, ls="--", color="#999999", linewidth=1, label=f"taban oran ({base_rate:.2f})")
    ax.set_xlabel("Duyarlılık (Recall)"); ax.set_ylabel("Kesinlik (Precision)")
    clean_axes(ax, x_grid=True)
    ax.legend(fontsize=9, loc="upper right", frameon=False)
    fig.tight_layout()
    fig.savefig(RESULTS / "pr_overlay_clean.png", dpi=300, facecolor="white")
    plt.close(fig)

    # --- Kalibrasyon ---
    fig, ax = plt.subplots(figsize=(6.2, 6.2), facecolor="white")
    for i, r in enumerate(all_results.values()):
        try:
            frac_pos, mean_pred = calibration_curve(r["oof_true"], r["oof_prob"], n_bins=8, strategy="quantile")
        except ValueError:
            continue
        ax.plot(mean_pred, frac_pos, "o-", label=r["title"], color=BAR_COLORS[i % len(BAR_COLORS)], markersize=4.5, linewidth=1.7)
    ax.plot([0, 1], [0, 1], "--", color="#999999")
    ax.set_xlabel("Ortalama Tahmin Olasılığı"); ax.set_ylabel("Gerçek Pozitif Oranı")
    clean_axes(ax, x_grid=True)
    ax.legend(fontsize=9, frameon=False)
    fig.tight_layout()
    fig.savefig(RESULTS / "calibration_overlay_clean.png", dpi=300, facecolor="white")
    plt.close(fig)


if __name__ == "__main__":
    all_results = load_all()
    plot_comparison_bar(all_results)
    plot_fold_variance(all_results)
    plot_feature_importance(all_results, "catboost")
    print("yazildi:", RESULTS / "00_comparison_chart_clean.png", RESULTS / "fold_variance_clean.png",
          RESULTS / "catboost_feature_importance_clean.png")
