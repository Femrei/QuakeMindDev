# 01 · Uydudan yol hasarı segmentasyonu

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
