# 04 · Türkçe metinden ihtiyaç, aciliyet ve konum

**Bizim yöntem:** üç aşamalı Türkçe hat — Zeyrek morfolojik çözümleme →
BERTurk ile 13 alt kategoriden 5 üst kategoriye sınıflandırma ve 1–5 aciliyet
türetimi → NER ile konum varlığı çıkarımı ve coğrafi kodlama.

Bu alanın stratejik değeri: emsal taramasındaki Türkçe deprem metni
çalışmalarının neredeyse tamamı **duygu analizi** yapıyor. İhtiyaç + aciliyet +
adres → sevk edilebilir koordinat üreten yayın yok. En savunulabilir özgünlük
iddiası burada.

## Sınıflandırma defterleri

| dosya | model | katman |
|---|---|---|
| `01_tfidf_logreg` | TF-IDF + Lojistik Regresyon | klasik taban |
| `02_tfidf_svm` | TF-IDF + Lineer SVM | klasik taban |
| `03_fasttext` | FastText (alt-kelime) | klasik taban |
| `04_berturk` | **BERTurk — referans** | Türkçe transformer |
| `05_distilberturk` | DistilBERTurk (hız/boyut ablasyonu) | Türkçe transformer |
| `06_convberturk` | ConvBERTurk | Türkçe transformer |
| `07_xlm_roberta` | XLM-RoBERTa | çok dilli |
| `08_mbert` | mBERT | çok dilli |
| `09_bilstm_fasttext` | BiLSTM + FastText | derin (transformer dışı) |
| `10_turna` | TURNA (encoder-decoder) | Türkçe transformer |
| `11_llm_few_shot` | LLM az-örnekli (Claude / OpenAI) | üretici taban |
| `00_leaderboard` | özet tablo + makro-F1 grafiği | — |

## NER defterleri (`ner/`)

| dosya | model |
|---|---|
| `01_domain_ner` | **alan-özel NER (`yhaslan/turkish-earthquake-tweets-ner`) — referans** |
| `02_savasy_ner` | genel Türkçe NER (savasy) |
| `03_akdeniz27_ner` | genel Türkçe NER (akdeniz27) |

## Metrikler

Doğruluk · makro-F1 · sınıf bazlı kesinlik/duyarlılık · konfüzyon matrisi.
**Ayrı bir sayı olarak yanlış negatif oranı** — elenen ihbar = kaybedilen çağrı.
NER için varlık düzeyinde F1; coğrafi kodlama için metre cinsinden konum hatası.

## Veri

`data/` klasörüne `text`, `label` kolonlu CSV koy — ayrıntı `data/README.md`.
Öncelik: **DepremKit** (bize en yakın), sonra **TSEqD** (çok modlu, 10.352 tweet).
NER için HF `yhaslan/turkish-earthquake-tweets-ner` otomatik iner.

## Kurulum

```bash
pip install -q transformers datasets accelerate evaluate seqeval scikit-learn
# klasik: zaten kurulu | fasttext: pip install fasttext-wheel | llm: pip install anthropic
python _build.py && cd ner && python _build.py
```
