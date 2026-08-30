"""
ALAN 04 - Turkce metin siniflandirma: ortak veri + metrik + kayit.

Gorev: Turkce deprem ihbar metnini 5 UST kategoriye siniflandirmak
(BERTurk hattinin yaptigi is) ve opsiyonel olarak 1-5 aciliyet.

Butun kiyaslama defterleri AYNI veriyi, AYNI train/val/test bolmesini ve
AYNI metrik fonksiyonunu kullanir. Boylece makale tablosu adil olur.

VERI: `data/` klasorune kendi etiketli CSV'ni koy.
      Beklenen kolonlar:  text , label            (label = 5 ust kategoriden biri)
      opsiyonel:          urgency  (1..5)
      DepremKit / TSEqD / Kaggle Turkiye setini bu formata donustur.
      Ayrintili not: data/README.md
"""

from pathlib import Path
import json

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "data"
RESULTS_DIR = HERE / "results"

# 5 ust kategori - BERTurk hattiyla ayni sema (gerekirse duzenle)
UST_KATEGORILER = ["saglik", "barinma", "lojistik", "guvenlik", "diger"]

SEED = 42


# --- Veri yukleme -------------------------------------------------------

def load_text_dataset(csv_name="train.csv", text_col="text", label_col="label",
                      test_size=0.15, val_size=0.15):
    """CSV -> (train_df, val_df, test_df). Stratified, sabit seed.

    Tek dosya varsa uce boler; train.csv/val.csv/test.csv varsa onlari kullanir.
    """
    from sklearn.model_selection import train_test_split

    if (DATA_DIR / "train.csv").exists() and (DATA_DIR / "test.csv").exists():
        tr = pd.read_csv(DATA_DIR / "train.csv")
        te = pd.read_csv(DATA_DIR / "test.csv")
        va = (pd.read_csv(DATA_DIR / "val.csv")
              if (DATA_DIR / "val.csv").exists()
              else tr.sample(frac=val_size, random_state=SEED))
        tr = tr.drop(index=va.index, errors="ignore")
        return _clean(tr, text_col, label_col), _clean(va, text_col, label_col), _clean(te, text_col, label_col)

    path = DATA_DIR / csv_name
    if not path.exists():
        raise FileNotFoundError(
            f"Veri yok: {path}\n"
            "data/ klasorune 'text' ve 'label' kolonlu bir CSV koy. Bkz data/README.md"
        )
    df = _clean(pd.read_csv(path), text_col, label_col)
    tr, te = train_test_split(df, test_size=test_size, stratify=df[label_col], random_state=SEED)
    tr, va = train_test_split(tr, test_size=val_size / (1 - test_size),
                              stratify=tr[label_col], random_state=SEED)
    return tr.reset_index(drop=True), va.reset_index(drop=True), te.reset_index(drop=True)


def _clean(df, text_col, label_col):
    df = df.dropna(subset=[text_col, label_col]).copy()
    df[text_col] = df[text_col].astype(str).str.strip()
    df = df[df[text_col].str.len() > 0]
    return df.reset_index(drop=True)


def label_maps(train_df, label_col="label"):
    labels = sorted(train_df[label_col].unique().tolist())
    l2i = {l: i for i, l in enumerate(labels)}
    return labels, l2i, {i: l for l, i in l2i.items()}


# --- Opsiyonel Turkce on-isleme --------------------------------------

def zeyrek_lemmatize(texts):
    """Zeyrek ile lemmatizasyon (kuruluysa). BERTurk hattiyla ayni adim."""
    try:
        import zeyrek
    except ImportError:
        print("zeyrek kurulu degil - ham metin donduruluyor (pip install zeyrek)")
        return list(texts)
    analyzer = zeyrek.MorphAnalyzer()
    out = []
    for t in texts:
        toks = []
        for w in str(t).split():
            res = analyzer.lemmatize(w)
            toks.append(res[0][1][0] if res and res[0][1] else w)
        out.append(" ".join(toks))
    return out


# --- Metrikler --------------------------------------------------------

def classification_metrics(y_true, y_pred, labels):
    """Dogruluk, makro-F1, sinif bazli P/R, konfuzyon, YANLIS NEGATIF ORANI.

    Yanlis negatif orani = kritik sinif(lar) icin recall'un tersi. Senaryoda
    elenen ihbar = kaybedilen cagri; ayri bir sayi olarak raporlanir.
    """
    from sklearn.metrics import (
        accuracy_score, f1_score, precision_recall_fscore_support,
        confusion_matrix, classification_report,
    )
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    idx = list(range(len(labels)))

    p, r, f1, sup = precision_recall_fscore_support(y_true, y_pred, labels=idx, zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=idx)
    # sinif bazli yanlis negatif orani = 1 - recall
    fnr = {labels[i]: float(1.0 - r[i]) for i in idx}

    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "macro_f1": float(f1_score(y_true, y_pred, labels=idx, average="macro", zero_division=0)),
        "weighted_f1": float(f1_score(y_true, y_pred, labels=idx, average="weighted", zero_division=0)),
        "per_class": {labels[i]: {"precision": float(p[i]), "recall": float(r[i]),
                                  "f1": float(f1[i]), "support": int(sup[i])} for i in idx},
        "false_negative_rate": fnr,
        "macro_fnr": float(np.mean(list(fnr.values()))),
        "confusion_matrix": cm.tolist(),
        "report": classification_report(y_true, y_pred, labels=idx,
                                        target_names=labels, zero_division=0),
    }


def save_result(model_name, metrics, extra=None):
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {"model": model_name,
               "accuracy": metrics["accuracy"],
               "macro_f1": metrics["macro_f1"],
               "weighted_f1": metrics["weighted_f1"],
               "macro_fnr": metrics["macro_fnr"]}
    if extra:
        payload["extra"] = extra
    full = {"model": model_name, **metrics}
    if extra:
        full["extra"] = extra
    with open(RESULTS_DIR / f"{model_name}.json", "w") as f:
        json.dump(full, f, indent=2, ensure_ascii=False)

    rows = []
    for jf in sorted(RESULTS_DIR.glob("*.json")):
        d = json.load(open(jf))
        rows.append({k: d.get(k) for k in ["model", "accuracy", "macro_f1", "weighted_f1", "macro_fnr"]})
    lb = pd.DataFrame(rows).sort_values("macro_f1", ascending=False)
    lb.to_csv(RESULTS_DIR / "leaderboard.csv", index=False)
    return lb
