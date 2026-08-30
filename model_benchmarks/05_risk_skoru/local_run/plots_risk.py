"""ALAN 05 - risk skoru icin ayrintili grafik uretimi (OOF tahminlerden)."""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

HERE = Path(__file__).resolve().parent
RESULTS = HERE / "results"

COLORS = ["#4C72B0", "#DD8452", "#55A868", "#C44E52", "#8172B2", "#937860", "#DA8BC3"]


def _color(i):
    return COLORS[i % len(COLORS)]


def plot_roc_overlay(all_results):
    from sklearn.metrics import roc_curve, roc_auc_score
    fig, ax = plt.subplots(figsize=(6.5, 6))
    for i, (name, r) in enumerate(all_results.items()):
        fpr, tpr, _ = roc_curve(r["oof_true"], r["oof_prob"])
        auc = roc_auc_score(r["oof_true"], r["oof_prob"])
        ax.plot(fpr, tpr, label=f"{r['title']} (AUC={auc:.3f})", color=_color(i), linewidth=1.8)
    ax.plot([0, 1], [0, 1], "--", color="gray", linewidth=1)
    ax.set_xlabel("Yanlis Pozitif Orani"); ax.set_ylabel("Dogru Pozitif Orani")
    ax.set_title("ROC Egrileri (birlestirilmis OOF tahminler)")
    ax.legend(fontsize=8, loc="lower right")
    plt.tight_layout()
    plt.savefig(RESULTS / "roc_overlay.png", dpi=160)
    plt.close(fig)


def plot_pr_overlay(all_results):
    from sklearn.metrics import precision_recall_curve, average_precision_score
    fig, ax = plt.subplots(figsize=(6.5, 6))
    base_rate = None
    for i, (name, r) in enumerate(all_results.items()):
        prec, rec, _ = precision_recall_curve(r["oof_true"], r["oof_prob"])
        ap = average_precision_score(r["oof_true"], r["oof_prob"])
        ax.plot(rec, prec, label=f"{r['title']} (AP={ap:.3f})", color=_color(i), linewidth=1.8)
        base_rate = float(np.mean(r["oof_true"]))
    if base_rate is not None:
        ax.axhline(base_rate, ls="--", color="gray", linewidth=1, label=f"taban oran ({base_rate:.2f})")
    ax.set_xlabel("Duyarlilik (Recall)"); ax.set_ylabel("Kesinlik (Precision)")
    ax.set_title("Kesinlik-Duyarlilik Egrileri (birlestirilmis OOF tahminler)")
    ax.legend(fontsize=8, loc="lower left")
    plt.tight_layout()
    plt.savefig(RESULTS / "pr_overlay.png", dpi=160)
    plt.close(fig)


def plot_comparison_bar(all_results):
    names = [r["title"] for r in all_results.values()]
    roc = [r["agg"]["roc_auc_mean"] for r in all_results.values()]
    roc_std = [r["agg"]["roc_auc_std"] for r in all_results.values()]
    f1 = [r["agg"]["f1_mean"] for r in all_results.values()]
    f1_std = [r["agg"]["f1_std"] for r in all_results.values()]

    order = np.argsort(roc)[::-1]
    names = [names[i] for i in order]
    roc = [roc[i] for i in order]; roc_std = [roc_std[i] for i in order]
    f1 = [f1[i] for i in order]; f1_std = [f1_std[i] for i in order]

    x = np.arange(len(names)); w = 0.35
    fig, ax = plt.subplots(figsize=(max(7, 1.3 * len(names)), 5))
    ax.bar(x - w/2, roc, w, yerr=roc_std, capsize=3, label="ROC-AUC (ort +/- std, 5-fold)", color="#4C72B0")
    ax.bar(x + w/2, f1, w, yerr=f1_std, capsize=3, label="F1 (ort +/- std, 5-fold)", color="#DD8452")
    ax.set_xticks(x); ax.set_xticklabels(names, rotation=30, ha="right")
    ax.set_ylim(0, 1.05); ax.set_ylabel("Skor")
    ax.set_title("05 Deprem Risk Skoru - Model Karsilastirmasi (walk-forward 5-fold)")
    ax.legend()
    plt.tight_layout()
    plt.savefig(RESULTS / "00_comparison_chart.png", dpi=160)
    plt.close(fig)


def plot_calibration(all_results):
    from sklearn.calibration import calibration_curve
    fig, ax = plt.subplots(figsize=(6, 6))
    for i, (name, r) in enumerate(all_results.items()):
        try:
            frac_pos, mean_pred = calibration_curve(r["oof_true"], r["oof_prob"], n_bins=8, strategy="quantile")
        except ValueError:
            continue
        ax.plot(mean_pred, frac_pos, "o-", label=r["title"], color=_color(i), markersize=4)
    ax.plot([0, 1], [0, 1], "--", color="gray")
    ax.set_xlabel("Ortalama Tahmin Olasiligi"); ax.set_ylabel("Gercek Pozitif Orani")
    ax.set_title("Kalibrasyon Egrileri (OOF)")
    ax.legend(fontsize=8)
    plt.tight_layout()
    plt.savefig(RESULTS / "calibration_overlay.png", dpi=160)
    plt.close(fig)


def plot_confusion(all_results, best_name):
    from sklearn.metrics import confusion_matrix
    r = all_results[best_name]
    pred = (r["oof_prob"] >= 0.5).astype(int)
    cm = confusion_matrix(r["oof_true"], pred)
    fig, ax = plt.subplots(figsize=(4.5, 4))
    im = ax.imshow(cm, cmap="Blues")
    for (i, j), v in np.ndenumerate(cm):
        ax.text(j, i, int(v), ha="center", va="center",
                 color="white" if v > cm.max()/2 else "black")
    ax.set_xticks([0, 1]); ax.set_xticklabels(["deprem yok", "deprem var"])
    ax.set_yticks([0, 1]); ax.set_yticklabels(["deprem yok", "deprem var"])
    ax.set_xlabel("Tahmin"); ax.set_ylabel("Gercek")
    ax.set_title(f"{r['title']} - Karisiklik Matrisi (OOF, esik=0.5)")
    plt.tight_layout()
    plt.savefig(RESULTS / f"{best_name}_confusion.png", dpi=160)
    plt.close(fig)


def plot_feature_importance(all_results, name):
    r = all_results.get(name)
    if not r or not r.get("importance"):
        return
    imp = r["importance"]
    items = sorted(imp.items(), key=lambda x: x[1])[-15:]
    labels, vals = zip(*items)
    fig, ax = plt.subplots(figsize=(7, max(4, 0.35 * len(labels))))
    ax.barh(labels, vals, color="#55A868")
    ax.set_xlabel("Ortalama Oznitelik Onemi (5-fold ortalamasi)")
    ax.set_title(f"{r['title']} - Oznitelik Onem Siralamasi")
    plt.tight_layout()
    plt.savefig(RESULTS / f"{name}_feature_importance.png", dpi=160)
    plt.close(fig)


def plot_fold_variance(all_results):
    """Her modelin 5 fold'daki ROC-AUC dagilimini gosteren kutu grafigi -
    ozet tablodaki yuksek std degerlerinin (ör. LightGBM +/-0.23) gorsel karsiligi."""
    names, data = [], []
    for r in all_results.values():
        vals = [fm["roc_auc"] for fm in r["fold_metrics"] if fm["roc_auc"] == fm["roc_auc"]]
        if vals:
            names.append(r["title"])
            data.append(vals)
    if not data:
        return
    order = np.argsort([np.mean(d) for d in data])[::-1]
    names = [names[i] for i in order]; data = [data[i] for i in order]

    fig, ax = plt.subplots(figsize=(max(7, 1.2 * len(names)), 5))
    bp = ax.boxplot(data, tick_labels=names, patch_artist=True)
    for i, box in enumerate(bp["boxes"]):
        box.set_facecolor(_color(i))
        box.set_alpha(0.6)
    for i, vals in enumerate(data):
        ax.scatter([i + 1] * len(vals), vals, color="black", s=15, zorder=3)
    ax.set_xticklabels(names, rotation=30, ha="right")
    ax.set_ylabel("Fold Bazli ROC-AUC")
    ax.set_title("Model Basina Fold Varyansi (5-fold walk-forward)")
    plt.tight_layout()
    plt.savefig(RESULTS / "fold_variance.png", dpi=160)
    plt.close(fig)


def make_all_plots(all_results, X, y):
    RESULTS.mkdir(parents=True, exist_ok=True)
    plot_roc_overlay(all_results)
    plot_pr_overlay(all_results)
    plot_comparison_bar(all_results)
    plot_calibration(all_results)
    plot_fold_variance(all_results)

    best_name = max(all_results, key=lambda n: all_results[n]["agg"]["roc_auc_mean"])
    plot_confusion(all_results, best_name)

    for name in ("catboost", "random_forest", "xgboost", "lightgbm"):
        plot_feature_importance(all_results, name)

    print("Grafikler yazildi:", RESULTS)
