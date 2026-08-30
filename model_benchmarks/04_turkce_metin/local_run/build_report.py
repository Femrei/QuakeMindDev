"""Butun sonuclari (results/*.json) tek tabloda + grafikte + markdown ozette birlestirir.

    python build_report.py

Uretir:
  results/00_comparison_table.csv
  results/00_comparison_table.tex
  results/00_comparison_chart.png   (model basina micro-F1 / macro-F1 cubuk grafik)
  results/00_summary.md             (model / dataset / parametreler / metrikler)
"""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
RESULTS_DIR = HERE / "results"

DISPLAY_NAMES = {
    "tfidf_logreg": "TF-IDF + LogReg",
    "tfidf_svm": "TF-IDF + Lineer SVM",
    "fasttext": "FastText",
    "bilstm_fasttext": "BiLSTM",
    "berturk": "BERTurk",
    "distilberturk": "DistilBERTurk",
    "convberturk": "ConvBERTurk",
    "xlm_roberta": "XLM-RoBERTa",
    "mbert": "mBERT",
    "turna": "TURNA",
}


def load_all():
    rows = []
    for jf in sorted(RESULTS_DIR.glob("*.json")):
        if jf.name.startswith("00_"):
            continue
        rows.append(json.load(open(jf, encoding="utf-8")))
    return rows


def main():
    rows = load_all()
    if not rows:
        print("results/ altinda henuz .json yok - once modelleri egit.")
        return

    tbl = pd.DataFrame([{
        "model": DISPLAY_NAMES.get(r["model"], r["model"]),
        "micro_f1": r["micro_f1"], "macro_f1": r["macro_f1"],
        "samples_f1": r["samples_f1"], "subset_accuracy": r["subset_accuracy"],
        "micro_precision": r["micro_precision"], "macro_precision": r["macro_precision"],
        "micro_recall": r["micro_recall"], "macro_recall": r["macro_recall"],
        "n_test": r["n_test"],
    } for r in rows]).sort_values("macro_f1", ascending=False).reset_index(drop=True)

    tbl.to_csv(RESULTS_DIR / "00_comparison_table.csv", index=False)
    with open(RESULTS_DIR / "00_comparison_table.tex", "w", encoding="utf-8") as f:
        f.write(tbl.round(4).to_latex(index=False))

    # --- grafik: micro-F1 / macro-F1 gruplu cubuk ---
    order = tbl["model"].tolist()
    x = np.arange(len(order))
    w = 0.35
    fig, ax = plt.subplots(figsize=(max(7, 1.1 * len(order)), 5))
    ax.bar(x - w / 2, tbl["micro_f1"], w, label="micro-F1", color="#4C72B0")
    ax.bar(x + w / 2, tbl["macro_f1"], w, label="macro-F1", color="#DD8452")
    ax.set_xticks(x); ax.set_xticklabels(order, rotation=35, ha="right")
    ax.set_ylim(0, 1); ax.set_ylabel("F1"); ax.set_title("04 Turkce Metin - Model Karsilastirmasi")
    ax.legend()
    for xi, (mi, ma) in enumerate(zip(tbl["micro_f1"], tbl["macro_f1"])):
        ax.text(xi - w / 2, mi + 0.015, f"{mi:.3f}", ha="center", fontsize=8)
        ax.text(xi + w / 2, ma + 0.015, f"{ma:.3f}", ha="center", fontsize=8)
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "00_comparison_chart.png", dpi=160)
    plt.close(fig)

    # --- markdown ozet: model / dataset / parametreler / metrikler ---
    lines = ["# 04 Turkce Metin - Yerel Egitim Sonuclari Ozeti", "",
             f"Toplam {len(rows)} model karsilastirildi. Hepsi AYNI veri seti ve "
             "AYNI train/val/test bolmesiyle (`data_multilabel.py`) egitildi.", "",
             "## Karsilastirma Tablosu", "",
             tbl.round(4).to_markdown(index=False), "",
             "## Model Detaylari (veri seti + parametreler)", ""]

    for r in sorted(rows, key=lambda x: -x["macro_f1"]):
        name = DISPLAY_NAMES.get(r["model"], r["model"])
        ds = r.get("dataset", {})
        params = r.get("params", {})
        lines.append(f"### {name}")
        lines.append(f"- **Dataset:** `{ds.get('name', '?')}` "
                      f"(seed={ds.get('seed')}, test_size={ds.get('test_size')}, "
                      f"val_size={ds.get('val_size')}, esik={ds.get('threshold')}, "
                      f"n_test={r.get('n_test')})")
        param_str = ", ".join(f"{k}={v}" for k, v in params.items() if k not in ("hf_checkpoint",))
        if "hf_checkpoint" in params:
            lines.append(f"- **HF checkpoint:** `{params['hf_checkpoint']}`")
        lines.append(f"- **Parametreler:** {param_str}")
        lines.append(f"- **micro-F1:** {r['micro_f1']:.4f} | **macro-F1:** {r['macro_f1']:.4f} | "
                      f"**subset-accuracy:** {r['subset_accuracy']:.4f}")
        lines.append("")

    with open(RESULTS_DIR / "00_summary.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print("yazildi: 00_comparison_table.csv / .tex, 00_comparison_chart.png, 00_summary.md")
    print(tbl.round(4).to_string(index=False))


if __name__ == "__main__":
    main()
