"""FastText - cok-etiketli mod (loss=ova, alt-kelime n-gram)."""
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import data_multilabel as D  # noqa: E402

HERE = Path(__file__).resolve().parent


def _dump(df, path, label_list):
    with open(path, "w", encoding="utf-8") as f:
        for _, r in df.iterrows():
            labs = " ".join(f"__label__{l.replace(' ', '_')}" for l in r["label"])
            text = r["text"].replace("\n", " ")
            f.write(f"{labs} {text}\n")


def main():
    import fasttext

    tr, va, te, label_list, label2id = D.load_splits()
    train_txt = HERE / "data_cache" / "ft_train.txt"
    _dump(tr, train_txt, label_list)

    params = dict(epoch=25, lr=0.5, wordNgrams=2, dim=100, loss="ova")
    t0 = time.time()
    model = fasttext.train_supervised(str(train_txt), **params)
    train_s = time.time() - t0

    label_tags = [f"__label__{l.replace(' ', '_')}" for l in label_list]
    tag2idx = {t: i for i, t in enumerate(label_tags)}

    yte = D.multi_hot(te, label2id)
    yprob = np.zeros((len(te), len(label_list)), dtype=np.float32)

    # fasttext-wheel'in ic predict() sarmalayicisi numpy>=2.0'da "np.array(x, copy=False)"
    # ile hata veriyor (bkz. NumPy 2.0 copy-keyword degisikligi). Sadece bu dongu
    # sirasinda np.array'i uyumlu bir surumle degistirip hemen sonra geri al -
    # global/kalici bir yama degil.
    _orig_np_array = np.array
    np.array = lambda obj, copy=None, **kw: _orig_np_array(obj, **kw)
    try:
        for i, text in enumerate(te["text"]):
            tags, probs = model.predict(text.replace("\n", " "), k=len(label_list))
            for t, p in zip(tags, probs):
                if t in tag2idx:
                    yprob[i, tag2idx[t]] = p
    finally:
        np.array = _orig_np_array

    metrics = D.classification_metrics(yte, yprob, label_list)
    print(f"[fasttext] micro-F1={metrics['micro_f1']:.4f}  macro-F1={metrics['macro_f1']:.4f}  "
          f"(egitim {train_s:.1f}s)")

    D.save_result("fasttext", metrics, params={**params, "train_seconds": round(train_s, 2)})
    D.plot_per_class_bar("fasttext", metrics["per_class"])


if __name__ == "__main__":
    main()
