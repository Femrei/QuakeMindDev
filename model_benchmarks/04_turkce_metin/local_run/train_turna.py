"""TURNA (boun-tabi/TURNA) - seq2seq (T5 tabanli) oldugu icin ozel ele alinir.

Once AutoModelForSequenceClassification denenir (bazi transformers surumlerinde
calisir); calismazsa T5 encoder'i ozellik cikarici olarak kullanip ustune basit
bir cok-etiketli siniflandirma katmani egitilir (elle egitim dongusu, HF Trainer
kullanilmaz - ciktisi Seq2SeqLM oldugu icin Trainer'in beklentileriyle uyusmuyor).
"""
import sys
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

sys.path.insert(0, str(Path(__file__).resolve().parent))
import data_multilabel as D  # noqa: E402

HF_CKPT = "boun-tabi-LMG/TURNA"
PARAMS = dict(epochs=4, lr=2e-5, batch_size=8, max_len=256, weight_decay=0.01)


def try_auto_seqcls(label_list):
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    tok = AutoTokenizer.from_pretrained(HF_CKPT)
    model = AutoModelForSequenceClassification.from_pretrained(
        HF_CKPT, num_labels=len(label_list), problem_type="multi_label_classification")
    return tok, model, "AutoModelForSequenceClassification"


class T5EncoderClassifier(nn.Module):
    """Yedek yol: T5 encoder cikisini ortalayip lineer siniflandirici uygular."""

    def __init__(self, encoder, hidden_size, n_labels):
        super().__init__()
        self.encoder = encoder
        self.fc = nn.Linear(hidden_size, n_labels)

    def forward(self, input_ids, attention_mask):
        out = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        h = out.last_hidden_state  # (B, T, H)
        mask = attention_mask.unsqueeze(-1).float()
        pooled = (h * mask).sum(1) / mask.sum(1).clamp(min=1e-6)
        return self.fc(pooled)


def try_encoder_fallback():
    from transformers import AutoTokenizer, T5EncoderModel
    tok = AutoTokenizer.from_pretrained(HF_CKPT)
    encoder = T5EncoderModel.from_pretrained(HF_CKPT)
    return tok, encoder, encoder.config.d_model, "T5EncoderModel + lineer siniflandirici (fallback)"


def main():
    tr, va, te, label_list, label2id = D.load_splits()
    n_labels = len(label_list)
    dev = "cuda" if torch.cuda.is_available() else "cpu"

    used_path = None
    try:
        tok, model, used_path = try_auto_seqcls(label_list)
        use_hf_trainer = True
    except Exception as e:
        print(f"[turna] AutoModelForSequenceClassification basarisiz ({e}); "
              f"T5EncoderModel yedegine geciliyor.")
        tok, encoder, hidden, used_path = try_encoder_fallback()
        model = T5EncoderClassifier(encoder, hidden, n_labels)
        use_hf_trainer = False

    def encode(df):
        enc = tok(df["text"].tolist(), truncation=True, padding=True,
                   max_length=PARAMS["max_len"], return_tensors="pt")
        y = torch.tensor(D.multi_hot(df, label2id))
        return enc, y

    if use_hf_trainer:
        from datasets import Dataset
        from transformers import Trainer, TrainingArguments, DataCollatorWithPadding

        def to_ds(df):
            y = D.multi_hot(df, label2id)
            d = Dataset.from_dict({"text": df["text"].tolist(), "labels": y.tolist()})
            return d.map(lambda b: tok(b["text"], truncation=True, max_length=PARAMS["max_len"]),
                         batched=True, remove_columns=["text"])

        ds_tr, ds_va, ds_te = to_ds(tr), to_ds(va), to_ds(te)

        def compute_metrics(eval_pred):
            logits, labels = eval_pred
            probs = 1 / (1 + np.exp(-logits))
            m = D.classification_metrics(labels, probs, label_list)
            return {"micro_f1": m["micro_f1"], "macro_f1": m["macro_f1"]}

        # TURNA buyuk bir T5 modeli - ilk adimdaki optimizer bellek zirvesini
        # dusurmek icin kucuk mikro-batch + gradient accumulation (etkin batch ayni).
        micro_bs = 2
        grad_accum = max(1, PARAMS["batch_size"] // micro_bs)
        args = TrainingArguments(
            output_dir=str(Path(__file__).resolve().parent / "_hf_turna"),
            eval_strategy="epoch", save_strategy="epoch", logging_strategy="epoch",
            learning_rate=PARAMS["lr"], per_device_train_batch_size=micro_bs,
            gradient_accumulation_steps=grad_accum,
            per_device_eval_batch_size=8, num_train_epochs=PARAMS["epochs"],
            weight_decay=PARAMS["weight_decay"], load_best_model_at_end=True,
            metric_for_best_model="micro_f1", greater_is_better=True,
            save_total_limit=1, report_to="none", seed=D.SEED, dataloader_pin_memory=False,
        )
        trainer = Trainer(model=model, args=args, train_dataset=ds_tr, eval_dataset=ds_va,
                           processing_class=tok, data_collator=DataCollatorWithPadding(tok),
                           compute_metrics=compute_metrics)
        ckpt_dir = Path(args.output_dir)
        has_ckpt = ckpt_dir.exists() and any(
            p.name.startswith("checkpoint-") and (p / "trainer_state.json").exists()
            for p in ckpt_dir.iterdir())
        t0 = time.time()
        trainer.train(resume_from_checkpoint=has_ckpt if has_ckpt else None)
        train_s = time.time() - t0

        history = {"epoch": [], "train_loss": [], "val_loss": [], "val_micro_f1": [], "val_macro_f1": []}
        per_epoch = {}
        for rec in trainer.state.log_history:
            if "epoch" not in rec:
                continue
            per_epoch.setdefault(round(rec["epoch"]), {}).update(rec)
        for ep in sorted(per_epoch):
            r = per_epoch[ep]
            history["epoch"].append(ep)
            history["train_loss"].append(r.get("loss"))
            history["val_loss"].append(r.get("eval_loss"))
            history["val_micro_f1"].append(r.get("eval_micro_f1"))
            history["val_macro_f1"].append(r.get("eval_macro_f1"))

        pred = trainer.predict(ds_te)
        probs = 1 / (1 + np.exp(-pred.predictions))
        yte = D.multi_hot(te, label2id)
        metrics = D.classification_metrics(yte, probs, label_list)

    else:
        model = model.to(dev)
        opt = torch.optim.AdamW(model.parameters(), lr=PARAMS["lr"], weight_decay=PARAMS["weight_decay"])
        lossf = nn.BCEWithLogitsLoss()

        Xtr, Ytr = encode(tr)
        Xva, Yva = encode(va)
        Xte, yte_t = encode(te)
        yte = yte_t.numpy()

        history = {"epoch": [], "train_loss": [], "val_loss": [], "val_micro_f1": [], "val_macro_f1": []}
        bs = PARAMS["batch_size"]
        t0 = time.time()
        n = Xtr["input_ids"].shape[0]
        for ep in range(PARAMS["epochs"]):
            model.train()
            perm = torch.randperm(n)
            tot_loss, n_batches = 0.0, 0
            for i in range(0, n, bs):
                idx = perm[i:i + bs]
                opt.zero_grad()
                out = model(Xtr["input_ids"][idx].to(dev), Xtr["attention_mask"][idx].to(dev))
                loss = lossf(out, Ytr[idx].to(dev))
                loss.backward()
                opt.step()
                tot_loss += loss.item(); n_batches += 1
            model.eval()
            with torch.no_grad():
                vout = model(Xva["input_ids"].to(dev), Xva["attention_mask"].to(dev))
                vloss = lossf(vout, Yva.to(dev)).item()
                vprob = torch.sigmoid(vout).cpu().numpy()
            vm = D.classification_metrics(Yva.numpy(), vprob, label_list)
            history["epoch"].append(ep + 1)
            history["train_loss"].append(tot_loss / n_batches)
            history["val_loss"].append(vloss)
            history["val_micro_f1"].append(vm["micro_f1"])
            history["val_macro_f1"].append(vm["macro_f1"])
            print(f"[turna] epoch {ep+1}/{PARAMS['epochs']} train_loss={history['train_loss'][-1]:.4f} "
                  f"val_loss={vloss:.4f} val_microF1={vm['micro_f1']:.4f}")
        train_s = time.time() - t0

        model.eval()
        with torch.no_grad():
            tprob = torch.sigmoid(model(Xte["input_ids"].to(dev), Xte["attention_mask"].to(dev))).cpu().numpy()
        metrics = D.classification_metrics(yte, tprob, label_list)

    print(f"[turna] TEST micro-F1={metrics['micro_f1']:.4f}  macro-F1={metrics['macro_f1']:.4f}  "
          f"(egitim {train_s/60:.1f} dk, yontem: {used_path})")

    D.save_result("turna", metrics,
                  params={**PARAMS, "hf_checkpoint": HF_CKPT, "method": used_path,
                           "train_seconds": round(train_s, 1)},
                  extra={"history": history})
    D.plot_curve("turna", history)
    D.plot_per_class_bar("turna", metrics["per_class"])


if __name__ == "__main__":
    main()
