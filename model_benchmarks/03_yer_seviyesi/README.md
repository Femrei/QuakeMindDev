# 03 · Yer seviyesi görüntü — çatlak ve bina hasarı

**Bizim yöntem:** iki YOLOv8 modeli — `catlak.pt` (duvar/kolon çatlağı) ve
`bina.pt` (üç sınıflı yapısal hasar) — + ikisini aynı karede koşturan hibrit kip.
Güven eşiği 0,20; ölçülen gecikme 153–174 ms.

## Defterler

| dosya | model | katman |
|---|---|---|
| `01_yolov8` | **YOLOv8s — referans** | referans |
| `02_yolov8_scale` | YOLOv8 n/s/m/l ölçek ablasyonu | zorunlu |
| `03_yolov11` | YOLOv11 | zorunlu |
| `04_yolov11_seg` | YOLOv11-seg (kutu → maske) | zorunlu |
| `05_faster_rcnn` | Faster R-CNN (R50-FPN), torchvision | zorunlu |
| `06_rt_detr` | RT-DETR (transformer) | güçlendirici |
| `07_yolov8_simam` | YOLOv8 + SimAM dikkat modülü | güçlendirici |
| `08_mask_rcnn` | Mask R-CNN (R50-FPN) | güçlendirici |
| `00_leaderboard` | özet tablo + Params↔mAP grafiği | — |

## Metrikler

Tespit: mAP@50 · mAP@50-95 · Kesinlik · Duyarlılık · F1 · sınıf bazlı AP.
Segmentasyon: IoU / mIoU. Her ikisinde **FPS · Params · GFLOPs** — mobil iddiası bunlarla savunulur.

## Veri (Roboflow Universe)

- YOLO ailesi → format `yolov8` (`data.yaml` üretir)
- Faster/Mask R-CNN → format `coco` (`_annotations.coco.json`)

Bilgileri `common.py > CONFIG` veya defterin AYAR hücresine gir.

| set | ölçek | ne için |
|---|---|---|
| **PEER Hub ImageNet (φ-Net)** | 36.413 | yapısal hasar — M3 standardı |
| **EIDSeg** | 3.266, 5 piksel sınıf | en güncel; kod+veri açık |
| **RescueNet** | ~4.500 İHA | yol sınıfı da içerir — iki modülü besler |
| **SDNET2018** | 56.000+ | çatlak modeli standart benchmark — harici test |
| CrackForest / Crack500 / DeepCrack | — | çatlak maskeye geçerse |

## Kurulum

```bash
pip install -q ultralytics roboflow            # YOLO ailesi
pip install -q torch torchvision torchmetrics pycocotools   # R-CNN
python _build.py
```
