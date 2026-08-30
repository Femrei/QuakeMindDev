# 04_turkce_metin/data/

Buraya etiketli Turkce metin veri setini koy.

## Beklenen format

Tek dosya `train.csv` (kod uçe böler) **veya** `train.csv` + `val.csv` + `test.csv`.

| kolon | zorunlu | açıklama |
|---|---|---|
| `text` | evet | ham ihbar metni (tweet / mesaj) |
| `label` | evet | 5 üst kategoriden biri (`common.UST_KATEGORILER`) |
| `urgency` | hayır | 1-5 aciliyet (aciliyet ablasyonu için) |

## Kaynak setler ve dönüştürme

| set | erişim | not |
|---|---|---|
| **DepremKit** | IEEE DataPort 2023 | Bize en yakın. İnsan + GPT-3.5 etiketli. 3 problem tanımı var; "ihtiyaç" tanımını `label`'a eşle |
| **TSEqD** | 10.352 tweet, 2023 | Çok modlu; "Humanitarian" görevini 5 kategoriye indir |
| **Kaggle Türkiye depremi tweet** | Kaggle, 28k | manuel/VADER/kümeleme etiketleri — manuel olanı al |
| **Turkey Earthquake X Corp.** | 500 tweet | ikili (yardım/diğer) — hızlı doğrulama |

13 alt kategori → 5 üst kategori eşlemesini `common.py` içindeki
`UST_KATEGORILER` listesine ve kendi `map_alt_to_ust()` fonksiyonuna göre yap.

## Lisans

Her setin kendi atıf metnini `data/LICENSES.md` içine kaydet — makale gönderiminde istenir.
