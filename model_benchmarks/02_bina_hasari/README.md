# 02 · Uydudan bina hasarı segmentasyonu

**Durum:** şu an üründe yok — plana göre eklenmeli. Copernicus EMSR648 zemin
doğruluğunda bina verisi yoldan ~6 kat zengin (1.321 hasarlı bina vs 207 yol
segmenti) ve M1/M2 ile doğrudan sayısal karşılaştırma açar.

**Yaklaşım:** yol modülüyle (`01_yol_hasari`) **aynı mimari ailesi ve aynı eğitim
protokolü** — tek `seg_common.py` iki alanı da besler.

## Defterler

| dosya | model | katman |
|---|---|---|
| `01_unet_resnet18` … `04_pspnet_resnet18` | U-Net / LinkNet / FPN / PSPNet (ResNet18) | zorunlu — M2 ile birebir |
| `05_segformer_mitb4` | **SegFormer MiT-B4 — referans (aktarım)** | referans |
| `06_deeplabv3plus_resnet101` | DeepLabV3+ (ResNet101) | zorunlu — M1 ile |
| `07_mask2former_swin_s` | Mask2Former (Swin-S), HF transformers | güçlendirici |
| `00_leaderboard` | özet tablo | — |

## Veri (Roboflow Universe veya local)

| set | ölçek | not |
|---|---|---|
| **xBD** | 22.068 görüntü · 850.736 bina · 4 hasar sınıfı | alan standardı; %80/10/10 bölme buradan (`num_classes=4` yap) |
| **BRIGHT** | 14 olay · 384.000+ bina · optik+SAR | açık erişim |
| **Copernicus EMSR648** | 8.308 bina, 1.321 hasarlı | depoda hazır — Hatay 394, Maraş 927 |
| TUE-CD · TE23D | 2.338 + 1.183 | 2023 Türkiye'ye özgü |

Roboflow: format `png-mask-semantic`. Bilgileri defterin AYAR hücresine gir.

## Kurulum

```bash
pip install -q segmentation-models-pytorch albumentations roboflow thop transformers opencv-python-headless
python _build.py
```
