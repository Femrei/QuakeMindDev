"""Genel transformer egitici - cok-etiketli siniflandirma.

Kullanim:  python train_transformer.py <model_name> <hf_checkpoint>
Ornek:     python train_transformer.py berturk dbmdz/bert-base-turkish-cased

Butun transformer aileleri (BERTurk, DistilBERTurk, ConvBERTurk, XLM-R, mBERT)
AYNI parametrelerle (berturk_multilabel_intent_colab.ipynb ile birebir) egitilir:
epochs=4, lr=2e-5, batch_size=8, max_len=256. Val seti erken-durdurma/en-iyi-model
secimi icin, nihai metrik ayri tutulan TEST setinde raporlanir.
"""
import sys
import time
from pathlib import Path

import numpy as np
import torch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import data_multilabel as D  # noqa: E402

PARAMS = dict(epochs=4, lr=2e-5, batch_size=8, eval_batch_size=16, max_len=256, weight_decay=0.01)


def main(name, hf_checkpoint, micro_batch=None):
    """micro_batch: verilirse per_device_train_batch_size'i buna dusurup
    gradient_accumulation_steps ile etkin batch'i (PARAMS['batch_size']) korur -
    buyuk modellerde (ör. genis vocab/gomme) ilk adimdaki bellek zirvesini
    dusurmek icin (bellek yetersizliginden erken sonlandirma sorunu)."""
    from datasets import Dataset
    from transformers import (
        AutoModelForSequenceClassification, AutoTokenizer,
        Trainer, TrainingArguments, DataCollatorWithPadding,
    )

    tr, va, te, label_list, label2id = D.load_splits()
    n_labels = len(label_list)

    tok = AutoTokenizer.from_pretrained(hf_checkpoint)

    def to_ds(df):
        y = D.multi_hot(df, label2id)
        d = Dataset.from_dict({"text": df["text"].tolist(), "labels": y.tolist()})
        return d.map(lambda b: tok(b["text"], truncation=True, max_length=PARAMS["max_len"]),
                     batched=True, remove_columns=["text"])

    ds_tr, ds_va, ds_te = to_ds(tr), to_ds(va), to_ds(te)

    model = AutoModelForSequenceClassification.from_pretrained(
        hf_checkpoint, num_labels=n_labels, problem_type="multi_label_classification")

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        probs = 1 / (1 + np.exp(-logits))
        m = D.classification_metrics(labels, probs, label_list)
        return {"micro_f1": m["micro_f1"], "macro_f1": m["macro_f1"]}

    train_bs = micro_batch or PARAMS["batch_size"]
    grad_accum = max(1, PARAMS["batch_size"] // train_bs)
    args = TrainingArguments(
        output_dir=str(Path(__file__).resolve().parent / f"_hf_{name}"),
        eval_strategy="epoch", save_strategy="epoch",
        logging_strategy="epoch",
        learning_rate=PARAMS["lr"], per_device_train_batch_size=train_bs,
        gradient_accumulation_steps=grad_accum,
        per_device_eval_batch_size=PARAMS["eval_batch_size"],
        num_train_epochs=PARAMS["epochs"], weight_decay=PARAMS["weight_decay"],
        load_best_model_at_end=True, metric_for_best_model="micro_f1", greater_is_better=True,
        save_total_limit=1, report_to="none", seed=D.SEED, dataloader_pin_memory=False,
    )

    trainer = Trainer(model=model, args=args, train_dataset=ds_tr, eval_dataset=ds_va,
                       processing_class=tok, data_collator=DataCollatorWithPadding(tok),
                       compute_metrics=compute_metrics)

    # onceki calistirmadan kalan checkpoint varsa (ör. arka plan islemi yarida
    # kesildiyse) oradan devam et - epoch'lari bastan tekrar etmez.
    ckpt_dir = Path(args.output_dir)
    has_ckpt = ckpt_dir.exists() and any(
        p.name.startswith("checkpoint-") and (p / "trainer_state.json").exists()
        for p in ckpt_dir.iterdir())

    t0 = time.time()
    trainer.train(resume_from_checkpoint=has_ckpt if has_ckpt else None)
    train_s = time.time() - t0

    # egitim egrisi (log_history'den)
    history = {"epoch": [], "train_loss": [], "val_loss": [], "val_micro_f1": [], "val_macro_f1": []}
    per_epoch = {}
    for rec in trainer.state.log_history:
        if "epoch" not in rec:
            continue
        ep = round(rec["epoch"])
        per_epoch.setdefault(ep, {}).update(rec)
    for ep in sorted(per_epoch):
        r = per_epoch[ep]
        history["epoch"].append(ep)
        history["train_loss"].append(r.get("loss"))
        history["val_loss"].append(r.get("eval_loss"))
        history["val_micro_f1"].append(r.get("eval_micro_f1"))
        history["val_macro_f1"].append(r.get("eval_macro_f1"))

    # nihai metrik: ayri TUTULAN test seti (val degil)
    pred = trainer.predict(ds_te)
    probs = 1 / (1 + np.exp(-pred.predictions))
    yte = D.multi_hot(te, label2id)
    metrics = D.classification_metrics(yte, probs, label_list)
    print(f"[{name}] TEST micro-F1={metrics['micro_f1']:.4f}  macro-F1={metrics['macro_f1']:.4f}  "
          f"(egitim {train_s/60:.1f} dk)")

    out_dir = Path(__file__).resolve().parent / f"model_{name}"
    trainer.save_model(str(out_dir))
    tok.save_pretrained(str(out_dir))

    D.save_result(name, metrics,
                  params={**PARAMS, "hf_checkpoint": hf_checkpoint, "train_seconds": round(train_s, 1)},
                  extra={"history": history})
    D.plot_curve(name, history)
    D.plot_per_class_bar(name, metrics["per_class"])


if __name__ == "__main__":
    mb = int(sys.argv[3]) if len(sys.argv) > 3 else None
    main(sys.argv[1], sys.argv[2], micro_batch=mb)
