"""ALAN 04 / NER - konum cikarimi kiyaslama defterleri.  python _build.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from _nbtools import md, code, write_notebook, colab_cell  # noqa: E402
SUB = "model_benchmarks/04_turkce_metin/ner"

HERE = Path(__file__).resolve().parent


def ner_nb(name, title, hf_model, blurb, tier):
    return [
        md(f"# {title} - Turkce NER (konum cikarimi)", "",
           f"**Katman:** {tier}", "", blurb, "",
           "Metrik: varlik duzeyinde F1 (seqeval) + cografi kodlama metre hatasi.  ",
           "Veri: `common.HF_DATASET` ya da `data/` CoNLL. Butun NER defterleri ayni bolme."),
        colab_cell(SUB, "transformers datasets seqeval accelerate"),
        md("## 1. Veri"),
        code(
            "import sys; from pathlib import Path; sys.path.insert(0, str(Path.cwd()))",
            "import numpy as np, common as C",
            "train, val, test, label_list = C.load_ner_dataset()",
            "print('etiketler:', label_list); print('train/val/test:', len(train), len(val), len(test))",
            "id2label = {i: l for i, l in enumerate(label_list)}; label2id = {l: i for i, l in id2label.items()}",
        ),
        md("## 2. Model + tokenizasyon (alt-kelime hizalama)"),
        code(
            f'MODEL_NAME = "{name}"',
            f'HF_MODEL = "{hf_model}"',
            "PARAMS = dict(hf_model=HF_MODEL, epochs=5, lr=3e-5, batch_size=16)",
            "from transformers import (AutoTokenizer, AutoModelForTokenClassification,",
            "                          TrainingArguments, Trainer, DataCollatorForTokenClassification)",
            "from datasets import Dataset",
            "tok = AutoTokenizer.from_pretrained(HF_MODEL)",
            "",
            "def align(batch):",
            "    tk = tok(batch['tokens'], truncation=True, is_split_into_words=True)",
            "    labs = []",
            "    for i, lab in enumerate(batch['ner_tags']):",
            "        wid = tk.word_ids(i); prev = None; cur = []",
            "        for w in wid:",
            "            if w is None: cur.append(-100)",
            "            elif w != prev: cur.append(lab[w])",
            "            else: cur.append(-100)",
            "            prev = w",
            "        labs.append(cur)",
            "    tk['labels'] = labs; return tk",
            "",
            "def mk(rows):",
            "    d = Dataset.from_list(list(rows))",
            "    return d.map(align, batched=True, remove_columns=d.column_names)",
            "ds_tr, ds_va, ds_te = mk(train), mk(val), mk(test)",
            "model = AutoModelForTokenClassification.from_pretrained(",
            "    HF_MODEL, num_labels=len(label_list), id2label=id2label, label2id=label2id)",
        ),
        md("## 3. Egitim"),
        code(
            "import evaluate; seq = evaluate.load('seqeval')",
            "def compute(p):",
            "    preds = np.argmax(p.predictions, axis=2)",
            "    tp, tl = [], []",
            "    for pr, la in zip(preds, p.label_ids):",
            "        tp.append([label_list[x] for x, y in zip(pr, la) if y != -100])",
            "        tl.append([label_list[y] for x, y in zip(pr, la) if y != -100])",
            "    r = seq.compute(predictions=tp, references=tl)",
            "    return {'precision': r['overall_precision'], 'recall': r['overall_recall'], 'f1': r['overall_f1']}",
            "",
            "args = TrainingArguments(output_dir=f'./_ner_{MODEL_NAME}', num_train_epochs=PARAMS['epochs'],",
            "    learning_rate=PARAMS['lr'], per_device_train_batch_size=PARAMS['batch_size'],",
            "    eval_strategy='epoch', save_strategy='no', report_to='none', seed=42)",
            "trainer = Trainer(model, args, train_dataset=ds_tr, eval_dataset=ds_va, tokenizer=tok,",
            "    data_collator=DataCollatorForTokenClassification(tok), compute_metrics=compute)",
            "trainer.train()",
        ),
        md("## 4. Test + kayit"),
        code(
            "res = trainer.predict(ds_te)",
            "preds = np.argmax(res.predictions, axis=2)",
            "tp, tl = [], []",
            "for pr, la in zip(preds, res.label_ids):",
            "    tp.append([label_list[x] for x, y in zip(pr, la) if y != -100])",
            "    tl.append([label_list[y] for x, y in zip(pr, la) if y != -100])",
            "r = seq.compute(predictions=tp, references=tl)",
            "print('entity F1:', round(r['overall_f1'], 4))",
            "lb = C.save_result(MODEL_NAME, r['overall_f1'], r['overall_precision'], r['overall_recall'],",
            "                   geocode_err_m=None, extra={'params': PARAMS})",
            "lb",
        ),
        md("## 5. Cografi kodlama hatasi (opsiyonel)",
           "",
           "Tahmin edilen LOC varliklarini Nominatim/yerel gazetteer ile koordinata çevir, "
           "referans koordinatla haversine metre farkini olc. `data/geocode_gold.csv` "
           "(text, gold_lat, gold_lon) varsa calisir."),
        code(
            "gold_path = Path('data/geocode_gold.csv')",
            "if gold_path.exists():",
            "    import pandas as pd",
            "    from geopy.geocoders import Nominatim",
            "    g = pd.read_csv(gold_path); geo = Nominatim(user_agent='quakemind-bench')",
            "    errs = []",
            "    for _, row in g.iterrows():",
            "        ents = trainer.model  # TODO: row['text'] uzerinde LOC varligi cikar",
            "        # loc = extract_loc(row['text']); hit = geo.geocode(loc + ', Turkiye')",
            "        # errs.append(C.haversine_m(row.gold_lat, row.gold_lon, hit.latitude, hit.longitude))",
            "    print('median error (m):', np.median(errs) if errs else 'TODO')",
            "else:",
            "    print('data/geocode_gold.csv yok - cografi kodlama adimi atlandi')",
        ),
    ]


NB = {
    "01_domain_ner": ner_nb(
        "domain_ner", "Alan-ozel NER (yhaslan)", "yhaslan/turkish-earthquake-tweets-ner",
        "**Mevcut modelimiz - referans satiri.** Deprem tweet'lerine ozel egitilmis NER.",
        "Zorunlu"),
    "02_savasy_ner": ner_nb(
        "savasy_ner", "Genel Turkce NER (savasy)", "savasy/bert-base-turkish-ner-cased",
        "Genel amacli Turkce NER - alan-ozel modelin gercekten kazandirdigini gosterir.",
        "Zorunlu"),
    "03_akdeniz27_ner": ner_nb(
        "akdeniz27_ner", "Genel Turkce NER (akdeniz27)", "akdeniz27/bert-base-turkish-cased-ner",
        "Ikinci genel Turkce NER referansi.",
        "Zorunlu"),
}


def main():
    (HERE / "data").mkdir(exist_ok=True)
    for n, cells in NB.items():
        write_notebook(HERE / f"{n}.ipynb", cells)
    write_notebook(HERE / "00_leaderboard.ipynb", [
        md("# NER - Ozet Tablo"),
        code(
            "import json, pandas as pd; from pathlib import Path",
            "rows = [json.load(open(f)) for f in sorted(Path('results').glob('*.json'))]",
            "tbl = pd.DataFrame([{k: r.get(k) for k in ['model','entity_f1','precision','recall','geocode_median_error_m']} for r in rows])",
            "tbl.sort_values('entity_f1', ascending=False).round(4)",
        ),
    ])


if __name__ == "__main__":
    main()
