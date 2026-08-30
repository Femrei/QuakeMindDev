"""
ALAN 04 - NER alt gorevi: Turkce metinden KONUM varligi cikarimi.

Ayri olcuulur (siniflandirmadan bagimsiz):
  - varlik duzeyinde F1 (seqeval)
  - cografi kodlama: metre cinsinden konum hatasi (tahmin edilen koordinat
    vs referans koordinat, haversine)

VERI: HF dataset `yhaslan/turkish-earthquake-tweets-ner` (varsayilan) ya da
      data/ altinda CoNLL formatinda train.txt / test.txt (token TAB etiket,
      bos satir = cumle sonu).
"""
from pathlib import Path
import json
import numpy as np

HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "data"
RESULTS_DIR = HERE / "results"

HF_DATASET = "yhaslan/turkish-earthquake-tweets-ner"


def load_ner_dataset():
    """-> (train, val, test) her biri {'tokens': [...], 'ner_tags': [...]} listesi, label_list"""
    conll_tr = DATA_DIR / "train.txt"
    if conll_tr.exists():
        return _load_conll()
    try:
        from datasets import load_dataset
        ds = load_dataset(HF_DATASET)
    except Exception as e:
        raise RuntimeError(
            f"HF dataset yuklenemedi ({e}).\n"
            "data/ altina CoNLL formatinda train.txt / test.txt koy."
        )
    split = ds["train"].train_test_split(test_size=0.2, seed=42)
    val = split["train"].train_test_split(test_size=0.15, seed=42)
    feat = ds["train"].features["ner_tags"]
    label_list = feat.feature.names if hasattr(feat, "feature") else sorted(
        {t for row in ds["train"]["ner_tags"] for t in row})
    return val["train"], val["test"], split["test"], label_list


def _load_conll():
    def parse(p):
        sents, toks, tags = [], [], []
        for line in open(p, encoding="utf-8"):
            line = line.rstrip("\n")
            if not line:
                if toks:
                    sents.append({"tokens": toks, "ner_tags": tags}); toks, tags = [], []
                continue
            parts = line.split()
            toks.append(parts[0]); tags.append(parts[-1])
        if toks:
            sents.append({"tokens": toks, "ner_tags": tags})
        return sents
    tr = parse(DATA_DIR / "train.txt")
    te = parse(DATA_DIR / "test.txt") if (DATA_DIR / "test.txt").exists() else tr[: len(tr)//5]
    labels = sorted({t for s in tr for t in s["ner_tags"]})
    l2i = {l: i for i, l in enumerate(labels)}
    for s in tr + te:
        s["ner_tags"] = [l2i[t] for t in s["ner_tags"]]
    cut = int(len(tr) * 0.85)
    return tr[:cut], tr[cut:], te, labels


def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    p = np.pi / 180
    a = (0.5 - np.cos((lat2-lat1)*p)/2
         + np.cos(lat1*p)*np.cos(lat2*p)*(1-np.cos((lon2-lon1)*p))/2)
    return 2*R*np.arcsin(np.sqrt(a))


def save_result(model_name, entity_f1, precision, recall, geocode_err_m=None, extra=None):
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {"model": model_name, "entity_f1": entity_f1,
               "precision": precision, "recall": recall,
               "geocode_median_error_m": geocode_err_m}
    if extra:
        payload["extra"] = extra
    json.dump(payload, open(RESULTS_DIR / f"{model_name}.json", "w"), indent=2, ensure_ascii=False)
    import pandas as pd
    rows = [json.load(open(f)) for f in sorted(RESULTS_DIR.glob("*.json"))]
    lb = pd.DataFrame([{k: r.get(k) for k in
                        ["model", "entity_f1", "precision", "recall", "geocode_median_error_m"]}
                       for r in rows]).sort_values("entity_f1", ascending=False)
    lb.to_csv(RESULTS_DIR / "leaderboard.csv", index=False)
    return lb
