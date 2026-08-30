"""BiLSTM (egitilebilir embedding) - cok-etiketli, BCEWithLogitsLoss."""
import sys
from collections import Counter
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

sys.path.insert(0, str(Path(__file__).resolve().parent))
import data_multilabel as D  # noqa: E402

PARAMS = dict(embed_dim=100, hidden=128, epochs=15, lr=1e-3, batch_size=32, max_len=60, vocab_size=20000)


def tokenize(s):
    return s.lower().split()


class BiLSTM(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden, n_labels):
        super().__init__()
        self.emb = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(2 * hidden, n_labels)

    def forward(self, x):
        o, _ = self.lstm(self.emb(x))
        return self.fc(o.mean(1))


def encode_batch(texts, vocab, max_len):
    out = []
    for t in texts:
        ids = [vocab.get(w, 1) for w in tokenize(t)][:max_len]
        ids = ids + [0] * (max_len - len(ids))
        out.append(ids)
    return torch.tensor(out, dtype=torch.long)


def main():
    tr, va, te, label_list, label2id = D.load_splits()
    n_labels = len(label_list)

    cnt = Counter(w for t in tr["text"] for w in tokenize(t))
    vocab = {"<pad>": 0, "<unk>": 1}
    for i, (w, _) in enumerate(cnt.most_common(PARAMS["vocab_size"])):
        vocab[w] = i + 2

    Xtr = encode_batch(tr["text"], vocab, PARAMS["max_len"])
    Xva = encode_batch(va["text"], vocab, PARAMS["max_len"])
    Xte = encode_batch(te["text"], vocab, PARAMS["max_len"])
    Ytr = torch.tensor(D.multi_hot(tr, label2id))
    Yva = torch.tensor(D.multi_hot(va, label2id))
    yte = D.multi_hot(te, label2id)

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    net = BiLSTM(len(vocab), PARAMS["embed_dim"], PARAMS["hidden"], n_labels).to(dev)
    opt = torch.optim.Adam(net.parameters(), lr=PARAMS["lr"])
    lossf = nn.BCEWithLogitsLoss()

    history = {"epoch": [], "train_loss": [], "val_loss": [], "val_micro_f1": [], "val_macro_f1": []}
    bs = PARAMS["batch_size"]

    for ep in range(PARAMS["epochs"]):
        net.train()
        perm = torch.randperm(len(Xtr))
        tot_loss = 0.0
        n_batches = 0
        for i in range(0, len(Xtr), bs):
            idx = perm[i:i + bs]
            opt.zero_grad()
            out = net(Xtr[idx].to(dev))
            loss = lossf(out, Ytr[idx].to(dev))
            loss.backward()
            opt.step()
            tot_loss += loss.item()
            n_batches += 1

        net.eval()
        with torch.no_grad():
            val_out = net(Xva.to(dev))
            val_loss = lossf(val_out, Yva.to(dev)).item()
            val_prob = torch.sigmoid(val_out).cpu().numpy()
        vm = D.classification_metrics(Yva.numpy(), val_prob, label_list)

        history["epoch"].append(ep + 1)
        history["train_loss"].append(tot_loss / n_batches)
        history["val_loss"].append(val_loss)
        history["val_micro_f1"].append(vm["micro_f1"])
        history["val_macro_f1"].append(vm["macro_f1"])
        print(f"[bilstm_fasttext] epoch {ep+1}/{PARAMS['epochs']} "
              f"train_loss={history['train_loss'][-1]:.4f} val_loss={val_loss:.4f} "
              f"val_microF1={vm['micro_f1']:.4f} val_macroF1={vm['macro_f1']:.4f}")

    net.eval()
    with torch.no_grad():
        yprob = torch.sigmoid(net(Xte.to(dev))).cpu().numpy()
    metrics = D.classification_metrics(yte, yprob, label_list)
    print(f"[bilstm_fasttext] TEST micro-F1={metrics['micro_f1']:.4f}  macro-F1={metrics['macro_f1']:.4f}")

    D.save_result("bilstm_fasttext", metrics, params=PARAMS, extra={"history": history})
    D.plot_curve("bilstm_fasttext", history)
    D.plot_per_class_bar("bilstm_fasttext", metrics["per_class"])


if __name__ == "__main__":
    main()
