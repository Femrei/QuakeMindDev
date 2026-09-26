# Furkan — GPU/Kaggle İş Paketi (Tablo 14 · 15 · 22-r3 · tohum)

_2026-09-25 · Ölçülemeyen ~61 makale hücresinin büyük çoğunluğu bu 4 koşuma bağlı._

> **GÜNCELLEME (2026-09-25):** İş, hazır bir Colab defterine indirildi →
> **`makale/olcum_egitim_colab.ipynb`** (Furkan'ın `dokuz_model_protokol_colab.ipynb`
> protokolünü birebir miras alır). Aşağıdaki metin arka planı açıklar.

Ortak protokol (`dokuz_model_protokol_colab.ipynb` ile **birebir**, yoksa tablolar
kıyaslanamaz): `seed=42`, `batch=8` (T4 OOM'da 4), **`epochs=40`**, `lr=2e-4`,
`AdamW + CosineAnnealingWarmRestarts(T_0=5,T_mult=2) + grad clip 1.0 + early stopping(8)`,
girdi `512×512`, `encoder_weights="imagenet"`. Kayıp: **`0.5*dice + 0.5*focal(α=0,25,γ=2)`**,
`ignore_index=255`. Veri: KATE-CD (resmî bölme + öncesi negatif) + MEDBFS (sahne bölme).
Referans kod: `dokuz_model_protokol_colab.ipynb` hücre 11 (`train_one_run`).

---

## İŞ 1 — Tablo 14: eksik mimarilerin checkpoint'i 🟥 EN ÖNCELİKLİ
**Ölçtüğü:** Tablo 14'ün 30 `[ÖLÇÜLECEK]` + 5 `[TARANACAK]` hücresi (35 hücre).

**Karar (2026-09-25): MiT-B4 sabit.** U-Net/FPN/DeepLabV3+ **zaten Tablo 13
koşumunda MiT-B4 ile eğitildi** → yeniden eğitim YOK, sadece Kaggle
`quakemind-modeller`'den `{unet,fpn,deeplabv3p}_mitb4_s42.pth` indirilir.
LinkNet/PSPNet transformer MiT-B4'ü desteklemez → **CNN kodlayıcı (ResNet-34)** ile eğitilir.

| # | arch (smp) | encoder | Tablo 14 satırı | Durum |
|---|---|---|---|---|
| 1 | Unet | mit_b4 | r1 U-Net [14] | ✅ Kaggle'da var → indir |
| 2 | **Linknet** | **resnet34** | r2 LinkNet [15] | 🔴 `olcum_egitim_colab.ipynb` eğitir |
| 3 | FPN | mit_b4 | r3 FPN [16] | ✅ Kaggle'da var → indir |
| 4 | **PSPNet** | **resnet34** | r4 PSPNet [17] | 🔴 `olcum_egitim_colab.ipynb` eğitir |
| 5 | DeepLabV3Plus | resnet101 (Tablo 13 tabanı) | r5 DeepLabV3+ [18] | ✅ Kaggle'da var → indir |

**Çıktı:** `linknet_r34_s42.pth`, `pspnet_r34_s42.pth` (Colab defteri üretir) +
Kaggle'dan 3 mevcut MiT-B4 checkpoint.

**Sonra (Utku, yerel):** 5 checkpoint sırayla `table14_segformer_closure.py` ile
EMSR648 kapanma değerlendirmesine sokulur → DP/YN/YP/Kesinlik/Duyarlılık/F₁ + τ dolar.
⚠️ `inference.py:39` `load_simple_model` şu an `Segformer/mit_b4`'e sabit; 5 mimariyi
yükleyecek **genel bir yükleyici** yazılmalı (Utku, yerel kod — GPU değil).
⚠️ **Kodlayıcı dipnotu gerekli:** LinkNet/PSPNet ResNet-34, diğerleri MiT-B4.

---

## İŞ 2 — Tablo 15: bölgeler arası genelleme (il-ayrık eğitim) 🟥
**Ölçtüğü:** Tablo 15 r1-r4 (16 hücre) + r5/r6'nın F₁/Kesinlik/Duyarlılık'ı (6 hücre).

4 ayrı SegFormer-B4 eğitimi (aynı tarif, sadece eğitim/test ili değişir):
| Satır | Eğitim ili | Test ili |
|---|---|---|
| r1 | Hatay | Hatay (bölge içi) |
| r2 | Hatay | Kahramanmaraş |
| r3 | Kahramanmaraş | Kahramanmaraş (bölge içi) |
| r4 | Kahramanmaraş | Hatay |

Her koşumda: `IoU_hasar, F₁, Kesinlik, Duyarlılık` (+ bölge-içine göre fark).
**r5/r6:** Birleşik model zaten var (IoU 0,387/0,399 dolu); sadece **F₁/Kesinlik/Duyarlılık**
eksik → bunlar mevcut checkpoint'le **yerel çıkarımdan** hesaplanabilir (etiketli test
karosu varsa). Furkan'a bağlı değil, VERİ'ye bağlı.

> 🔴 **VERİ ENGELİ (2026-09-25 bulgusu):** `dokuz_model_protokol_colab.ipynb`
> KATE-CD'yi `scene='none'` ile yüklüyor — karolar **Hatay/Kahramanmaraş etiketi
> taşımıyor**. Bu yüzden il-ayrık eğitim bu veriyle **yapılamaz**; AOI-etiketli
> KATE-PD (AOI-11 Hatay / AOI-04 Kahramanmaraş) gerekir. `olcum_egitim_colab.ipynb`
> Grup B **uyarılı iskele** olarak eklendi (`city_of()` doldurulmalı).
> **Furkan'a soru:** (1) r5/r6'daki IoU 0,387/0,399 hangi veri+bölmeyle hesaplandı?
> (2) AOI-etiketli karolar nerede?

---

## İŞ 3 — Tablo 22 r3: kayıp ağırlıkları (λ_f, λ_d) ızgara taraması 🟥
**Ölçtüğü:** Tablo 22 r3 (1 hücre).
Şu an kayıp fonksiyonunda **ağırlık parametresi yok** (sabit focal+dice). λ_f/λ_d ızgarası
(ör. {0,5·1·2}²) için kayıp yeniden parametrelenip küçük bir ızgarayla yeniden eğitilir;
her kombinasyonda IoU_hasar raporlanır. Düşük öncelik — tek hücre.

---

## İŞ 4 — Tohum çelişkisinin çözümü 🔴 KARAR + belki GPU
**Ölçtüğü:** Tablo 13/14/16-20'nin istatistiksel güvenilirliği.
Kayıtlı karar **10 tohum**, fiilen SegFormer-B4 sadece **2 tohum** (42, 7). Paket kaydı da
"en iyi 3 model × 2-3 tohum tekrarı → yapılmadı" diyor.
**Furkan'a soru (iki seçenekten biri):**
1. En iyi 3 modeli (U-Net(MiT-B4), SegFormer-B2, DeepLabV3+/R101 vb.) ek tohumlarla
   (43-51) yeniden koş → gerçek ±std raporla; **veya**
2. "n=2 tohum, sınırlılık" olarak dürüstçe yazılsın (GPU gerekmez, sadece metin).

---

## Ön koşul (Utku/insan) — YOLO için
- 🔴 **Roboflow API anahtarını iptal et + yenile** (git geçmişinde açık: `9d4cc22`, `55a50d1`).
  Tablo 24 (YOLOv8 mAP@0,5) ve Tablo 26 r2 bu anahtar olmadan koşulamaz.

## Özet öncelik sırası
1. İŞ 1 (35 hücre) → 2. İŞ 2 (22 hücre) → 3. İŞ 4 kararı → 4. Roboflow+YOLO → 5. İŞ 3.
