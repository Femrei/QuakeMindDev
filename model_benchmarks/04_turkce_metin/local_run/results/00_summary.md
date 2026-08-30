# 04 Turkce Metin - Yerel Egitim Sonuclari Ozeti

Toplam 8 model karsilastirildi. Hepsi AYNI veri seti ve AYNI train/val/test bolmesiyle (`data_multilabel.py`) egitildi.

## Karsilastirma Tablosu

| model               |   micro_f1 |   macro_f1 |   samples_f1 |   subset_accuracy |   micro_precision |   macro_precision |   micro_recall |   macro_recall |   n_test |
|:--------------------|-----------:|-----------:|-------------:|------------------:|------------------:|------------------:|---------------:|---------------:|---------:|
| TF-IDF + LogReg     |     0.7598 |     0.5024 |       0.7563 |            0.5574 |            0.7633 |            0.551  |         0.7563 |         0.4912 |      305 |
| TF-IDF + Lineer SVM |     0.7596 |     0.4852 |       0.7626 |            0.623  |            0.8191 |            0.5943 |         0.708  |         0.4338 |      305 |
| BERTurk             |     0.8247 |     0.4725 |       0.8275 |            0.7115 |            0.8907 |            0.5188 |         0.7678 |         0.4483 |      305 |
| ConvBERTurk         |     0.7199 |     0.2747 |       0.7591 |            0.623  |            0.8359 |            0.3188 |         0.6322 |         0.2673 |      305 |
| FastText            |     0.6003 |     0.2589 |       0.5547 |            0.4787 |            0.8728 |            0.5019 |         0.4575 |         0.2018 |      305 |
| mBERT               |     0.6415 |     0.2282 |       0.6684 |            0.5541 |            0.7752 |            0.3001 |         0.5471 |         0.2141 |      305 |
| BiLSTM              |     0.5285 |     0.1533 |       0.5666 |            0.4852 |            0.669  |            0.1686 |         0.4368 |         0.1509 |      305 |
| DistilBERTurk       |     0.5542 |     0.1295 |       0.5285 |            0.423  |            0.8035 |            0.1231 |         0.423  |         0.1366 |      305 |

## Model Detaylari (veri seti + parametreler)

### TF-IDF + LogReg
- **Dataset:** `deprem-private/intent_test_v13_anonymized` (seed=42, test_size=0.15, val_size=0.15, esik=0.5, n_test=305)
- **Parametreler:** vectorizer=TfidfVectorizer(max_features=50000, min_df=2, ngram_range=(1, 2),
                sublinear_tf=True), classifier=LogisticRegression(max_iter=2000, class_weight='balanced', C=2.0), strategy=OneVsRestClassifier, train_seconds=0.17
- **micro-F1:** 0.7598 | **macro-F1:** 0.5024 | **subset-accuracy:** 0.5574

### TF-IDF + Lineer SVM
- **Dataset:** `deprem-private/intent_test_v13_anonymized` (seed=42, test_size=0.15, val_size=0.15, esik=0.5, n_test=305)
- **Parametreler:** vectorizer=TfidfVectorizer(max_features=50000, min_df=2, ngram_range=(1, 2),
                sublinear_tf=True), classifier=LinearSVC(class_weight='balanced', C=1.0), strategy=OneVsRestClassifier, train_seconds=0.12
- **micro-F1:** 0.7596 | **macro-F1:** 0.4852 | **subset-accuracy:** 0.6230

### BERTurk
- **Dataset:** `deprem-private/intent_test_v13_anonymized` (seed=42, test_size=0.15, val_size=0.15, esik=0.5, n_test=305)
- **HF checkpoint:** `dbmdz/bert-base-turkish-cased`
- **Parametreler:** epochs=4, lr=2e-05, batch_size=8, eval_batch_size=16, max_len=256, weight_decay=0.01, train_seconds=1974.0
- **micro-F1:** 0.8247 | **macro-F1:** 0.4725 | **subset-accuracy:** 0.7115

### ConvBERTurk
- **Dataset:** `deprem-private/intent_test_v13_anonymized` (seed=42, test_size=0.15, val_size=0.15, esik=0.5, n_test=305)
- **HF checkpoint:** `dbmdz/convbert-base-turkish-cased`
- **Parametreler:** epochs=4, lr=2e-05, batch_size=8, eval_batch_size=16, max_len=256, weight_decay=0.01, train_seconds=2280.8
- **micro-F1:** 0.7199 | **macro-F1:** 0.2747 | **subset-accuracy:** 0.6230

### FastText
- **Dataset:** `deprem-private/intent_test_v13_anonymized` (seed=42, test_size=0.15, val_size=0.15, esik=0.5, n_test=305)
- **Parametreler:** epoch=25, lr=0.5, wordNgrams=2, dim=100, loss=ova, train_seconds=1.08
- **micro-F1:** 0.6003 | **macro-F1:** 0.2589 | **subset-accuracy:** 0.4787

### mBERT
- **Dataset:** `deprem-private/intent_test_v13_anonymized` (seed=42, test_size=0.15, val_size=0.15, esik=0.5, n_test=305)
- **HF checkpoint:** `bert-base-multilingual-cased`
- **Parametreler:** epochs=4, lr=2e-05, batch_size=8, eval_batch_size=16, max_len=256, weight_decay=0.01, train_seconds=2138.7
- **micro-F1:** 0.6415 | **macro-F1:** 0.2282 | **subset-accuracy:** 0.5541

### BiLSTM
- **Dataset:** `deprem-private/intent_test_v13_anonymized` (seed=42, test_size=0.15, val_size=0.15, esik=0.5, n_test=305)
- **Parametreler:** embed_dim=100, hidden=128, epochs=15, lr=0.001, batch_size=32, max_len=60, vocab_size=20000
- **micro-F1:** 0.5285 | **macro-F1:** 0.1533 | **subset-accuracy:** 0.4852

### DistilBERTurk
- **Dataset:** `deprem-private/intent_test_v13_anonymized` (seed=42, test_size=0.15, val_size=0.15, esik=0.5, n_test=305)
- **HF checkpoint:** `dbmdz/distilbert-base-turkish-cased`
- **Parametreler:** epochs=4, lr=2e-05, batch_size=8, eval_batch_size=16, max_len=256, weight_decay=0.01, train_seconds=915.9
- **micro-F1:** 0.5542 | **macro-F1:** 0.1295 | **subset-accuracy:** 0.4230
