"""
Yerel calistirma - ortak veri + metrik + kayit yardimcilari.

Veri: deprem-private/intent_test_v13_anonymized (HF, private - HF_TOKEN gerekir).
Kolonlar: image_url (gercekte mesaj METNI - kolon adi yaniltici), label (cok-etiketli,
liste), label_confidence, labeler, label_creation_time.

Butun modeller (klasik ML, FastText, BiLSTM, transformer aileleri) BURADAN gelen
AYNI train/val/test bolmesini ve AYNI metrik fonksiyonunu kullanir; boylece
makale tablosu adil olur.
"""
from pathlib import Path
import json

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
RESULTS_DIR = HERE / "results"
CACHE_DIR = HERE / "data_cache"
DATASET_NAME = "deprem-private/intent_test_v13_anonymized"

SEED = 42
TEST_SIZE = 0.15
VAL_SIZE = 0.15  # egitimde kalan kisimdan oran
THRESHOLD = 0.5


def _load_raw():
    from datasets import load_dataset
    ds = load_dataset(DATASET_NAME)["train"]
    df = ds.to_pandas()
    df["text"] = df["image_url"].astype(str).str.strip()
    df = df[df["text"].str.len() > 0].reset_index(drop=True)
    df["label"] = df["label"].apply(list)
    return df


def _build_label_space(df):
    all_labels = sorted({l for labs in df["label"] for l in labs})
    label2id = {l: i for i, l in enumerate(all_labels)}
    return all_labels, label2id


def load_splits():
    """-> (train_df, val_df, test_df, label_list, label2id). Sonuclari önbelleğe alir."""
    tr_p, va_p, te_p = CACHE_DIR / "train.parquet", CACHE_DIR / "val.parquet", CACHE_DIR / "test.parquet"
    meta_p = CACHE_DIR / "labels.json"

    if tr_p.exists() and va_p.exists() and te_p.exists() and meta_p.exists():
        tr, va, te = pd.read_parquet(tr_p), pd.read_parquet(va_p), pd.read_parquet(te_p)
        meta = json.load(open(meta_p, encoding="utf-8"))
        return tr, va, te, meta["label_list"], {l: i for i, l in enumerate(meta["label_list"])}

    df = _load_raw()
    label_list, label2id = _build_label_space(df)

    from sklearn.model_selection import train_test_split
    idx = np.arange(len(df))
    tr_idx, te_idx = train_test_split(idx, test_size=TEST_SIZE, random_state=SEED)
    tr_idx, va_idx = train_test_split(tr_idx, test_size=VAL_SIZE / (1 - TEST_SIZE), random_state=SEED)

    tr = df.iloc[tr_idx].reset_index(drop=True)
    va = df.iloc[va_idx].reset_index(drop=True)
    te = df.iloc[te_idx].reset_index(drop=True)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    tr.to_parquet(tr_p); va.to_parquet(va_p); te.to_parquet(te_p)
    json.dump({"label_list": label_list, "n_total": len(df),
               "n_train": len(tr), "n_val": len(va), "n_test": len(te)},
              open(meta_p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    return tr, va, te, label_list, label2id


def multi_hot(df, label2id):
    n = len(label2id)
    Y = np.zeros((len(df), n), dtype=np.float32)
    for i, labs in enumerate(df["label"]):
        for l in labs:
            Y[i, label2id[l]] = 1.0
    return Y


# --- Metrikler ----------------------------------------------------

def classification_metrics(y_true, y_prob, label_list, threshold=THRESHOLD):
    """y_true: (N,L) 0/1. y_prob: (N,L) olasilik. -> dict (micro/macro/per-class)."""
    from sklearn.metrics import (
        accuracy_score, f1_score, precision_score, recall_score,
        precision_recall_fscore_support,
    )
    y_true = np.asarray(y_true)
    y_prob = np.asarray(y_prob)
    y_pred = (y_prob >= threshold).astype(int)

    p, r, f1, sup = precision_recall_fscore_support(y_true, y_pred, average=None, zero_division=0)
    per_class = {label_list[i]: {"precision": float(p[i]), "recall": float(r[i]),
                                  "f1": float(f1[i]), "support": int(sup[i])}
                 for i in range(len(label_list))}

    return {
        "n": int(len(y_true)),
        "micro_f1": float(f1_score(y_true, y_pred, average="micro", zero_division=0)),
        "macro_f1": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        "samples_f1": float(f1_score(y_true, y_pred, average="samples", zero_division=0)),
        "subset_accuracy": float(accuracy_score(y_true, y_pred)),
        "micro_precision": float(precision_score(y_true, y_pred, average="micro", zero_division=0)),
        "macro_precision": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
        "micro_recall": float(recall_score(y_true, y_pred, average="micro", zero_division=0)),
        "macro_recall": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
        "per_class": per_class,
    }


# --- Kayit ----------------------------------------------------------

def save_result(model_name, metrics, params=None, dataset_info=None, extra=None):
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "model": model_name,
        "micro_f1": metrics["micro_f1"], "macro_f1": metrics["macro_f1"],
        "samples_f1": metrics["samples_f1"], "subset_accuracy": metrics["subset_accuracy"],
        "micro_precision": metrics["micro_precision"], "macro_precision": metrics["macro_precision"],
        "micro_recall": metrics["micro_recall"], "macro_recall": metrics["macro_recall"],
        "n_test": metrics["n"],
        "per_class": metrics["per_class"],
        "params": params or {},
        "dataset": dataset_info or {"name": DATASET_NAME, "seed": SEED,
                                     "test_size": TEST_SIZE, "val_size": VAL_SIZE,
                                     "threshold": THRESHOLD},
    }
    if extra:
        payload["extra"] = extra
    with open(RESULTS_DIR / f"{model_name}.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    rows = []
    for jf in sorted(RESULTS_DIR.glob("*.json")):
        if jf.name.startswith("00_"):
            continue
        d = json.load(open(jf, encoding="utf-8"))
        rows.append({k: d.get(k) for k in
                     ["model", "micro_f1", "macro_f1", "samples_f1", "subset_accuracy",
                      "micro_precision", "macro_precision", "micro_recall", "macro_recall", "n_test"]})
    lb = pd.DataFrame(rows).sort_values("macro_f1", ascending=False)
    lb.to_csv(RESULTS_DIR / "leaderboard.csv", index=False)
    return lb


def plot_curve(model_name, history, out_path=None):
    """history: {'epoch':[...], 'train_loss':[...], 'val_loss':[...]?, 'val_micro_f1':[...], 'val_macro_f1':[...]}"""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    out_path = out_path or (RESULTS_DIR / f"{model_name}_curve.png")
    fig, axes = plt.subplots(1, 2, figsize=(11, 4))

    ax = axes[0]
    if "train_loss" in history:
        ax.plot(history["epoch"], history["train_loss"], marker="o", label="train loss")
    if "val_loss" in history:
        ax.plot(history["epoch"], history["val_loss"], marker="o", label="val loss")
    ax.set_xlabel("epoch"); ax.set_ylabel("loss"); ax.set_title(f"{model_name} - kayip")
    ax.legend()

    ax = axes[1]
    if "val_micro_f1" in history:
        ax.plot(history["epoch"], history["val_micro_f1"], marker="o", label="val micro-F1")
    if "val_macro_f1" in history:
        ax.plot(history["epoch"], history["val_macro_f1"], marker="o", label="val macro-F1")
    ax.set_xlabel("epoch"); ax.set_ylabel("F1"); ax.set_ylim(0, 1)
    ax.set_title(f"{model_name} - dogrulama F1"); ax.legend()

    plt.tight_layout()
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    plt.savefig(out_path, dpi=150)
    plt.close(fig)


def plot_per_class_bar(model_name, per_class, out_path=None):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    out_path = out_path or (RESULTS_DIR / f"{model_name}_per_class.png")
    labels = list(per_class.keys())
    f1s = [per_class[l]["f1"] for l in labels]
    order = np.argsort(f1s)
    labels = [labels[i] for i in order]
    f1s = [f1s[i] for i in order]

    fig, ax = plt.subplots(figsize=(7, max(3, 0.35 * len(labels))))
    ax.barh(labels, f1s, color="#4C72B0")
    ax.set_xlim(0, 1); ax.set_xlabel("F1"); ax.set_title(f"{model_name} - sinif bazli F1")
    plt.tight_layout()
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    plt.savefig(out_path, dpi=150)
    plt.close(fig)
