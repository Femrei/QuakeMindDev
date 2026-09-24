# 01 · Uydudan yol hasarı segmentasyonu

> **⚠️ Klasör adı yanıltıcı (D-03).** Bu klasördeki defterler (`01_unet_resnet18`…
> `07_segformer_scale`, `00_leaderboard`) Roboflow'dan çekilecek **piksel-etiketli yol
> hasarı** verisi için tasarlanmıştı, ama makalede raporlanan gerçek sonuçlar
> (`local_colab_run/`) bunlardan **hiçbiriyle üretilmedi** — onun yerine KATE-CD +
> MedBFS **bina hasarı** verisiyle koşuldu (bkz. `local_colab_run/build_notebook.py`
> satır 3, "Veri: KATE-CD + MedBFS"). Yol hasarı için piksel-etiketli bir Türkiye
> kümesi hâlâ yok (bkz. Tablo 5 kararı — gelecek çalışmaya bırakıldı). Aşağıdaki
> "Defterler"/"Veri" bölümü orijinal (koşulmamış) tasarımı anlatıyor; makaledeki
> sayıların gerçek kaynağı `local_colab_run/results/*.json` + `00_comparison_table.csv`.

**Bizim yöntem:** SegFormer (MiT-B4 kodlayıcı), ikili maske, focal + dice bileşik
kayıp; örtüşmeli karolama + ağırlıklı pencere harmanlama + üç seviyeli morfolojik
son-işleme.

## Defterler

| dosya | model | katman |
|---|---|---|
| `01_unet_resnet18` | U-Net (ResNet18) | zorunlu |
| `02_linknet_resnet18` | LinkNet (ResNet18) | zorunlu |
| `03_fpn_resnet18` | FPN (ResNet18) | zorunlu |
| `04_pspnet_resnet18` | PSPNet (ResNet18) | zorunlu — alt sınır |
| `05_deeplabv3plus_resnet101` | DeepLabV3+ (ResNet101) | zorunlu |
| `06_segformer_mitb4` | **SegFormer MiT-B4 — referans** | referans |
| `07_segformer_scale` | SegFormer B0/B2/B5 ölçek ablasyonu | güçlendirici |
| `00_leaderboard` | özet tablo + Params↔mIoU grafiği | — |

smp'de mimari değişimi tek satır (`seg_common.build_model`). Kod çözücü değişir,
kodlayıcı/protokol/metrik sabit kalır.

## Metrikler

IoU / mIoU · F1 · Kesinlik · Duyarlılık · Özgüllük · Doğruluk · AUC
+ Params (M) · GFLOPs · CPU/GPU çıkarım süresi (ms).
**Doğruluk tek başına aldatıcı — her zaman IoU ile birlikte.**

## Veri

Roboflow Universe > dataset > Download > **PNG Mask (Semantic)** > "show download code".
Bilgileri her defterin **AYAR** hücresine ya da `seg_common.py > CONFIG` sözlüğüne gir.

İdeal harici test kümesi: **CAU-RoadDamage** (alandaki tek piksel-etiketli yol hasarı seti).
Zemin doğruluğu: depodaki **Copernicus EMSR648** (12.456 yol segmenti, 207 hasarlı).

## Kurulum

```bash
pip install -q segmentation-models-pytorch albumentations roboflow thop opencv-python-headless
python _build.py
jupyter nbconvert --to notebook --execute --inplace 0*.ipynb
```
