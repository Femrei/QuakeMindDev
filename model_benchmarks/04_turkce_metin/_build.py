"""ALAN 04 - Turkce metin siniflandirma kiyaslama defterlerini uretir.

    python _build.py

Her defter: common.load_text_dataset() -> egit -> common.classification_metrics
-> common.save_result -> results/<model>.json + leaderboard.csv
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _nbtools import md, code, write_notebook, colab_cell  # noqa: E402
SUB = "model_benchmarks/04_turkce_metin"

HERE = Path(__file__).resolve().parent

HEADER = lambda title, blurb, tier: md(
    f"# {title} - Turkce Metin Siniflandirma Kiyaslamasi",
    "",
    f"**Katman:** {tier}",
    "",
    f"{blurb}",
    "",
    "Gorev: Turkce deprem ihbar metni -> 5 ust kategori (+ opsiyonel 1-5 aciliyet).  ",
    "Veri: `data/` (bkz `data/README.md`).  ",
    "Butun defterler `common.py` uzerinden AYNI bolme ve AYNI metrikleri kullanir.  ",
    "Metrik: Dogruluk, makro-F1, sinif bazli P/R, konfuzyon matrisi, **yanlis negatif orani**.",
)

SETUP = code(
    "import sys, warnings; warnings.filterwarnings('ignore')",
    "from pathlib import Path",
    "sys.path.insert(0, str(Path.cwd()))",
    "import numpy as np, pandas as pd",
    "import common as C",
    "",
    "train_df, val_df, test_df = C.load_text_dataset()",
    "labels, l2i, i2l = C.label_maps(train_df)",
    "print('siniflar:', labels)",
    "print('train/val/test:', len(train_df), len(val_df), len(test_df))",
    "y_test = test_df['label'].map(l2i).values",
)

REPORT = code(
    "m = C.classification_metrics(y_test, y_pred, labels)",
    "print('accuracy :', round(m['accuracy'], 4))",
    "print('macro-F1 :', round(m['macro_f1'], 4))",
    "print('macro yanlis-negatif orani:', round(m['macro_fnr'], 4))",
    "print()",
    "print(m['report'])",
    "lb = C.save_result(MODEL_NAME, m, extra={'params': PARAMS})",
    "lb",
)

CONF_PLOT = code(
    "import matplotlib.pyplot as plt",
    "cm = np.array(m['confusion_matrix'])",
    "fig, ax = plt.subplots(figsize=(5, 4))",
    "im = ax.imshow(cm, cmap='Blues')",
    "ax.set_xticks(range(len(labels))); ax.set_xticklabels(labels, rotation=45, ha='right')",
    "ax.set_yticks(range(len(labels))); ax.set_yticklabels(labels)",
    "for (i, j), v in np.ndenumerate(cm): ax.text(j, i, int(v), ha='center', va='center')",
    "ax.set_xlabel('tahmin'); ax.set_ylabel('gercek'); ax.set_title(f'{MODEL_NAME} konfuzyon')",
    "plt.tight_layout(); plt.savefig(f'results/{MODEL_NAME}_cm.png', dpi=140); plt.show()",
)


def classic(name, title, blurb, tier, vectorizer, clf_lines):
    return [
        HEADER(title, blurb, tier),
        colab_cell(SUB, "scikit-learn"),
        md("## 1. Veri"), SETUP,
        md("## 2. Ozellik + model"),
        code(
            f'MODEL_NAME = "{name}"',
            "USE_ZEYREK = False   # True yaparsan BERTurk hattiyla ayni lemmatizasyon",
            "",
            "from sklearn.feature_extraction.text import TfidfVectorizer",
            *clf_lines,
            "",
            "Xtr_txt = train_df['text'].tolist(); Xte_txt = test_df['text'].tolist()",
            "if USE_ZEYREK:",
            "    Xtr_txt = C.zeyrek_lemmatize(Xtr_txt); Xte_txt = C.zeyrek_lemmatize(Xte_txt)",
            "",
            f"vec = {vectorizer}",
            "Xtr = vec.fit_transform(Xtr_txt); Xte = vec.transform(Xte_txt)",
            "ytr = train_df['label'].map(l2i).values",
            "PARAMS = {'vectorizer': str(vec), 'clf': str(clf)}",
        ),
        md("## 3. Egit ve tahmin et"),
        code("clf.fit(Xtr, ytr)", "y_pred = clf.predict(Xte)"),
        md("## 4. Sonuc"), REPORT, CONF_PLOT,
    ]


def transformer(name, title, blurb, tier, hf_model):
    return [
        HEADER(title, blurb, tier),
        colab_cell(SUB, "transformers datasets accelerate evaluate"),
        md("## 1. Veri"), SETUP,
        md("## 2. Model ve tokenizer"),
        code(
            f'MODEL_NAME = "{name}"',
            f'HF_MODEL = "{hf_model}"',
            "PARAMS = dict(hf_model=HF_MODEL, epochs=4, lr=2e-5, batch_size=16, max_len=128)",
            "",
            "import torch",
            "from transformers import (AutoTokenizer, AutoModelForSequenceClassification,",
            "                          TrainingArguments, Trainer, DataCollatorWithPadding)",
            "from datasets import Dataset",
            "",
            "tok = AutoTokenizer.from_pretrained(HF_MODEL)",
            "",
            "def to_ds(df):",
            "    d = Dataset.from_pandas(df[['text', 'label']].assign(label=df['label'].map(l2i)))",
            "    return d.map(lambda b: tok(b['text'], truncation=True, max_length=PARAMS['max_len']), batched=True)",
            "",
            "ds_tr, ds_va, ds_te = to_ds(train_df), to_ds(val_df), to_ds(test_df)",
            "model = AutoModelForSequenceClassification.from_pretrained(",
            "    HF_MODEL, num_labels=len(labels),",
            "    id2label=i2l, label2id=l2i)",
        ),
        md("## 3. Egitim"),
        code(
            "import evaluate; f1_metric = evaluate.load('f1')",
            "def compute_metrics(p):",
            "    preds = np.argmax(p.predictions, axis=1)",
            "    return f1_metric.compute(predictions=preds, references=p.label_ids, average='macro')",
            "",
            "args = TrainingArguments(",
            "    output_dir=f'./_hf_{MODEL_NAME}', num_train_epochs=PARAMS['epochs'],",
            "    learning_rate=PARAMS['lr'], per_device_train_batch_size=PARAMS['batch_size'],",
            "    per_device_eval_batch_size=32, eval_strategy='epoch', save_strategy='no',",
            "    logging_steps=50, report_to='none', seed=C.SEED)",
            "",
            "trainer = Trainer(model=model, args=args, train_dataset=ds_tr, eval_dataset=ds_va,",
            "                  tokenizer=tok, data_collator=DataCollatorWithPadding(tok),",
            "                  compute_metrics=compute_metrics)",
            "trainer.train()",
        ),
        md("## 4. Test tahmini + sonuc"),
        code("y_pred = np.argmax(trainer.predict(ds_te).predictions, axis=1)"),
        REPORT, CONF_PLOT,
    ]


def fasttext_nb():
    return [
        HEADER("FastText",
               "Alt-kelime gomme - Turkce gibi eklemeli dillerde avantajli (PeerJ makalesi bunu kullanmis).",
               "Klasik taban cizgisi"),
        colab_cell(SUB, "fasttext-wheel"),
        md("## 1. Veri"), SETUP,
        md("## 2. FastText formatina yaz"),
        code(
            'MODEL_NAME = "fasttext"',
            "PARAMS = dict(epoch=25, lr=0.5, wordNgrams=2, dim=100)",
            "import fasttext",
            "def dump(df, path):",
            "    with open(path, 'w') as f:",
            "        for _, r in df.iterrows():",
            "            f.write(f\"__label__{r['label']} {r['text'].replace(chr(10),' ')}\\n\")",
            "dump(train_df, 'ft_train.txt'); dump(test_df, 'ft_test.txt')",
        ),
        md("## 3. Egit ve tahmin et"),
        code(
            "ft = fasttext.train_supervised('ft_train.txt', **PARAMS)",
            "y_pred = np.array([l2i[ft.predict(t.replace(chr(10),' '))[0][0].replace('__label__','')]",
            "                   for t in test_df['text']])",
        ),
        md("## 4. Sonuc"), REPORT, CONF_PLOT,
    ]


def bilstm_nb():
    return [
        HEADER("BiLSTM + FastText",
               "FastText gomme uzerine BiLSTM - PeerJ'deki MConv-BiLSTM-GAM ile karsilastirilabilirlik.",
               "Derin (transformer disi)"),
        colab_cell(SUB, "torch"),
        md("## 1. Veri"), SETUP,
        md("## 2. Model"),
        code(
            'MODEL_NAME = "bilstm_fasttext"',
            "PARAMS = dict(embed_dim=100, hidden=128, epochs=10, lr=1e-3, batch_size=32, max_len=60)",
            "import torch, torch.nn as nn",
            "from collections import Counter",
            "",
            "def tokenize(s): return s.lower().split()",
            "cnt = Counter(w for t in train_df['text'] for w in tokenize(t))",
            "vocab = {'<pad>': 0, '<unk>': 1, **{w: i+2 for i, (w, _) in enumerate(cnt.most_common(20000))}}",
            "def encode(s):",
            "    ids = [vocab.get(w, 1) for w in tokenize(s)][:PARAMS['max_len']]",
            "    return ids + [0]*(PARAMS['max_len']-len(ids))",
            "",
            "class BiLSTM(nn.Module):",
            "    def __init__(self, V, E, H, C):",
            "        super().__init__()",
            "        self.emb = nn.Embedding(V, E, padding_idx=0)",
            "        self.lstm = nn.LSTM(E, H, batch_first=True, bidirectional=True)",
            "        self.fc = nn.Linear(2*H, C)",
            "    def forward(self, x):",
            "        o, _ = self.lstm(self.emb(x))",
            "        return self.fc(o.mean(1))",
        ),
        md("## 3. Egitim"),
        code(
            "dev = 'cuda' if torch.cuda.is_available() else 'cpu'",
            "Xtr = torch.tensor([encode(t) for t in train_df['text']]); ytr = torch.tensor(train_df['label'].map(l2i).values)",
            "Xte = torch.tensor([encode(t) for t in test_df['text']])",
            "net = BiLSTM(len(vocab), PARAMS['embed_dim'], PARAMS['hidden'], len(labels)).to(dev)",
            "opt = torch.optim.Adam(net.parameters(), lr=PARAMS['lr']); lossf = nn.CrossEntropyLoss()",
            "for ep in range(PARAMS['epochs']):",
            "    net.train(); perm = torch.randperm(len(Xtr))",
            "    for i in range(0, len(Xtr), PARAMS['batch_size']):",
            "        idx = perm[i:i+PARAMS['batch_size']]",
            "        opt.zero_grad()",
            "        out = net(Xtr[idx].to(dev)); loss = lossf(out, ytr[idx].to(dev))",
            "        loss.backward(); opt.step()",
            "    print(f'epoch {ep+1} loss {loss.item():.4f}')",
        ),
        md("## 4. Sonuc"),
        code("net.eval()",
             "with torch.no_grad(): y_pred = net(Xte.to(dev)).argmax(1).cpu().numpy()"),
        REPORT, CONF_PLOT,
    ]


def llm_nb():
    return [
        HEADER("LLM az-ornekli",
               "Buyuk dil modeli few-shot siniflandirma - DepremKit'in GPT-3.5 ile etiketledigi gibi; "
               "artik beklenen bir kiyaslama. Claude / OpenAI / yerel model uzerinden calisir.",
               "Uretici taban"),
        colab_cell(SUB, "anthropic"),
        md("## 1. Veri"), SETUP,
        md("## 2. Prompt + istemci"),
        code(
            'MODEL_NAME = "llm_few_shot"',
            "LLM_PROVIDER = 'anthropic'      # 'anthropic' | 'openai'",
            "LLM_MODEL = 'claude-sonnet-5'   # OpenAI icin ör. 'gpt-4o-mini'",
            "N_SHOT = 6",
            "PARAMS = dict(provider=LLM_PROVIDER, model=LLM_MODEL, n_shot=N_SHOT)",
            "",
            "shots = train_df.groupby('label', group_keys=False).apply(lambda g: g.head(max(1, N_SHOT//len(labels))))",
            "shot_txt = '\\n'.join(f\"Metin: {r.text}\\nKategori: {r.label}\" for r in shots.itertuples())",
            "SYS = ('Turkce deprem ihbar metnini su kategorilerden birine ata: '",
            "       + ', '.join(labels) + '. Sadece kategori adini yaz.')",
            "",
            "def classify(text):",
            "    prompt = f\"{shot_txt}\\n\\nMetin: {text}\\nKategori:\"",
            "    if LLM_PROVIDER == 'anthropic':",
            "        import anthropic",
            "        c = anthropic.Anthropic()",
            "        r = c.messages.create(model=LLM_MODEL, max_tokens=10, system=SYS,",
            "                              messages=[{'role': 'user', 'content': prompt}])",
            "        out = r.content[0].text.strip().lower()",
            "    else:",
            "        from openai import OpenAI",
            "        r = OpenAI().chat.completions.create(model=LLM_MODEL, max_tokens=10,",
            "            messages=[{'role': 'system', 'content': SYS}, {'role': 'user', 'content': prompt}])",
            "        out = r.choices[0].message.content.strip().lower()",
            "    for l in labels:",
            "        if l in out: return l",
            "    return labels[-1]",
        ),
        md("## 3. Test kumesini siniflandir (API anahtari gerekli)"),
        code(
            "from tqdm import tqdm",
            "preds = [classify(t) for t in tqdm(test_df['text'].tolist())]",
            "y_pred = np.array([l2i[p] for p in preds])",
        ),
        md("## 4. Sonuc"), REPORT, CONF_PLOT,
    ]


NOTEBOOKS = {
    "01_tfidf_logreg": classic(
        "tfidf_logreg", "TF-IDF + Lojistik Regresyon",
        "En basit taban - transformer'in kac puan kazandirdigini gosterir.",
        "Klasik taban cizgisi",
        "TfidfVectorizer(ngram_range=(1,2), min_df=2, max_features=50000, sublinear_tf=True)",
        ["from sklearn.linear_model import LogisticRegression",
         "clf = LogisticRegression(max_iter=2000, class_weight='balanced', C=2.0)"]),
    "02_tfidf_svm": classic(
        "tfidf_svm", "TF-IDF + Lineer SVM",
        "Kucuk veride hala guclu klasik taban.",
        "Klasik taban cizgisi",
        "TfidfVectorizer(ngram_range=(1,2), min_df=2, max_features=50000, sublinear_tf=True)",
        ["from sklearn.svm import LinearSVC",
         "from sklearn.calibration import CalibratedClassifierCV",
         "clf = CalibratedClassifierCV(LinearSVC(class_weight='balanced', C=1.0))"]),
    "03_fasttext": fasttext_nb(),
    "04_berturk": transformer(
        "berturk", "BERTurk", "**Mevcut modelimiz - referans satiri.**",
        "Turkce transformer", "dbmdz/bert-base-turkish-cased"),
    "05_distilberturk": transformer(
        "distilberturk", "DistilBERTurk", "Hiz/boyut ablasyonu - uc cihaz argumani.",
        "Turkce transformer", "dbmdz/distilbert-base-turkish-cased"),
    "06_convberturk": transformer(
        "convberturk", "ConvBERTurk", "BERTurk ailesinin guclu varyanti.",
        "Turkce transformer", "dbmdz/convbert-base-turkish-cased"),
    "07_xlm_roberta": transformer(
        "xlm_roberta", "XLM-RoBERTa", "'Turkce'ye ozel model gercekten gerekli mi' sorusunun cevabi.",
        "Cok dilli", "xlm-roberta-base"),
    "08_mbert": transformer(
        "mbert", "mBERT", "Klasik cok dilli taban.",
        "Cok dilli", "bert-base-multilingual-cased"),
    "09_bilstm_fasttext": bilstm_nb(),
    "10_turna": transformer(
        "turna", "TURNA", "Turkce icin uretilmis encoder-decoder - siniflandirma + aciklama uretimi. "
        "(Not: seq2seq; burada encoder ozellik cikarici olarak siniflandiriliyor.)",
        "Turkce transformer", "boun-tabi/TURNA"),
    "11_llm_few_shot": llm_nb(),
}


def main():
    for name, cells in NOTEBOOKS.items():
        write_notebook(HERE / f"{name}.ipynb", cells)
    # ozet defteri
    write_notebook(HERE / "00_leaderboard.ipynb", [
        md("# 04 Turkce Metin - Ozet Tablo", "",
           "Butun `NN_*.ipynb` defterleri calistiktan sonra bunu calistir."),
        code(
            "import json, pandas as pd, matplotlib.pyplot as plt",
            "from pathlib import Path",
            "rows = [json.load(open(f)) for f in sorted(Path('results').glob('*.json'))]",
            "tbl = pd.DataFrame([{k: r.get(k) for k in ['model','accuracy','macro_f1','weighted_f1','macro_fnr']} for r in rows])",
            "tbl = tbl.sort_values('macro_f1', ascending=False).reset_index(drop=True)",
            "display(tbl.round(4))",
            "print(tbl.round(4).to_latex(index=False))",
        ),
        code(
            "fig, ax = plt.subplots(figsize=(8, 4))",
            "t = tbl.sort_values('macro_f1')",
            "ax.barh(t['model'], t['macro_f1'])",
            "ax.set_xlabel('makro-F1'); ax.set_xlim(0, 1)",
            "plt.tight_layout(); plt.savefig('results/macro_f1_comparison.png', dpi=150); plt.show()",
        ),
    ])


if __name__ == "__main__":
    main()
