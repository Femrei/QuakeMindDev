"""03_yer_seviyesi - Colab'da tek oturumda calisacak, hem catlak hem bina hasari
tespiti veri setlerinde birden fazla mimariyi kiyaslayan defter.

Veri: Roboflow Universe (kullanicinin kendi projeleri, ikisi de SADECE bounding box
etiketli - poligon/piksel maskesi YOK):
  - catlak: akash-roy-edivz/building-crack-detection-ys4zf (v3)
  - bina:   ofgg/maras-tpx5p (v4)

Bu yuzden maske gerektiren mimariler (YOLOv11-seg, Mask R-CNN) DAHIL EDILMEDI -
gercek piksel siniri olmadan Roboflow bbox'i otomatik dortgen "maske"ye cevirir,
bu da yaniltici sonuc verir.

Her veri seti icin AYNI protokolle (epochs=60, img=640, batch=16, conf=0.20 -
production esigimiz) su mimariler egitilir:
  - yolov8s        (referans - production ailesi)
  - yolov8n/m/l     (olcek ablasyonu - mobil/uc cihaz argumani)
  - yolo11s         (guncel surum karsilastirmasi)
  - rtdetr_l        (transformer tabanli, gercek zamanli - CNN/transformer kiyasi)
  - yolov8s_simam   (SimAM dikkat modulu - parametresiz, catlak ozniteligini guclendirir)
  - faster_rcnn_r50fpn (torchvision, COCO export - M3'te en yaygin aile, literaturle kiyaslanabilirlik)

    python build_notebook.py   ->  03_yer_seviyesi/local_colab_run/00_catlak_bina_yolo.ipynb
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent))
from _nbtools import md, code, write_notebook  # noqa: E402

# --- Roboflow erisim bilgileri (kullanicidan) ------------------------------
DATASETS = {
    "catlak": dict(api_key="VjVedHy8GcB2HOWgjUAs", workspace="akash-roy-edivz",
                   project="building-crack-detection-ys4zf", version=3,
                   title="Catlak Tespiti"),
    "bina": dict(api_key="VjVedHy8GcB2HOWgjUAs", workspace="ofgg",
                 project="maras-tpx5p", version=4,
                 title="Bina Hasari Tespiti"),
}

ARCHS = ["yolov8n", "yolov8s", "yolov8m", "yolov8l", "yolo11s", "rtdetr_l"]
ARCH_WEIGHTS = {
    "yolov8n": "yolov8n.pt", "yolov8s": "yolov8s.pt", "yolov8m": "yolov8m.pt",
    "yolov8l": "yolov8l.pt", "yolo11s": "yolo11s.pt", "rtdetr_l": "rtdetr-l.pt",
}
REFERANS = "yolov8s"


def cells():
    out = []
    out.append(md(
        "# 03 Yer Seviyesi - Çatlak + Bina Hasarı Tespiti (Tek Oturum, Çoklu Mimari)",
        "",
        "**Veri:** kullanıcının kendi Roboflow projeleri — "
        "`akash-roy-edivz/building-crack-detection-ys4zf` (çatlak) ve "
        "`ofgg/maras-tpx5p` (bina hasarı). **İkisi de sadece bounding box "
        "etiketli** (poligon/piksel maskesi yok) — bu yüzden maske gerektiren "
        "YOLOv11-seg ve Mask R-CNN bu kıyaslamaya dahil edilmedi.  ",
        "**Bizim yöntem (production):** 2× YOLOv8 (catlak.pt + bina.pt), güven eşiği 0,20.  ",
        "**Mimariler (her veri seti icin AYNI protokolle):** YOLOv8n/s/m/l (olcek "
        "ablasyonu, s=referans), YOLOv11s (guncel surum), RT-DETR-l (transformer), "
        "YOLOv8s+SimAM (dikkat modülü), Faster R-CNN R50-FPN (torchvision, COCO export).  ",
        "**Metrik:** mAP@50, mAP@50-95, Kesinlik, Duyarlılık, F1, sınıf bazlı AP, "
        "FPS, Params(M), GFLOPs.",
        "",
        "**ÖNEMLİ:** Üst menüden `Çalışma Zamanı` → `Çalışma zamanı türünü değiştir` → **T4 GPU** seçin.  ",
        "**SÜRE UYARISI:** 2 veri seti × 8 model ≈ 16 eğitim koşusu. Ücretsiz Colab'ın "
        "~12 saatlik oturum sınırına yaklaşabilir — gerekirse iki veri setini iki ayrı "
        "oturumda (bölüm 4 ve 6'yı `DATASETS = {'catlak': ...}` / `{'bina': ...}` diye "
        "tek tek çalıştırarak) koş.",
    ))

    out.append(md("## 1. Kütüphaneler"))
    out.append(code(
        "!pip install -q ultralytics roboflow torch torchvision torchmetrics pycocotools"
    ))

    out.append(md("## 2. Veri setlerini indir (Roboflow)",
                   "Her veri seti hem YOLO formatında (YOLOv8/v11/RT-DETR/SimAM için) "
                   "hem COCO formatında (Faster R-CNN için) indirilir — aynı görsel/etiketler, "
                   "iki farklı export."))
    ds_lines = [
        "import os",
        "from roboflow import Roboflow",
        "",
        "DATASETS = {",
    ]
    for key, d in DATASETS.items():
        ds_lines.append(
            f"    '{key}': dict(api_key='{d['api_key']}', workspace='{d['workspace']}', "
            f"project='{d['project']}', version={d['version']}, title='{d['title']}'),"
        )
    ds_lines.append("}")
    ds_lines += [
        "",
        "DATA_YAML, DATA_COCO = {}, {}",
        "for key, d in DATASETS.items():",
        "    print(f'--- {d[\"title\"]} indiriliyor (YOLO) ---')",
        "    rf = Roboflow(api_key=d['api_key'])",
        "    proj = rf.workspace(d['workspace']).project(d['project'])",
        "    ds = proj.version(d['version']).download('yolov8')",
        "    DATA_YAML[key] = f'{ds.location}/data.yaml'",
        "    print(key, '-> yolo:', DATA_YAML[key])",
        "    print(f'--- {d[\"title\"]} indiriliyor (COCO) ---')",
        "    ds_coco = proj.version(d['version']).download('coco')",
        "    DATA_COCO[key] = ds_coco.location",
        "    print(key, '-> coco:', DATA_COCO[key])",
    ]
    out.append(code(*ds_lines))

    out.append(md("## 3. Ortak eğitim + değerlendirme fonksiyonu (YOLO ailesi + RT-DETR)",
                   "Bütün YOLO/RT-DETR mimarileri ve her iki veri seti bu AYNI fonksiyonu kullanır."))
    out.append(code(
        "import json, time",
        "import torch",
        "from ultralytics import YOLO, RTDETR",
        "",
        "RESULTS_DIR = 'results/'",
        "os.makedirs(RESULTS_DIR, exist_ok=True)",
        "",
        "EPOCHS, IMG_SIZE, BATCH, CONF = 60, 640, 16, 0.20",
        "",
        "def efficiency(model, imgsz=640, runs=30):",
        "    dev = 'cuda' if torch.cuda.is_available() else 'cpu'",
        "    info = model.info(verbose=False) if hasattr(model, 'info') else None",
        "    params_m = (info[1] / 1e6) if info else float('nan')",
        "    gflops = info[3] if info and len(info) > 3 else float('nan')",
        "    x = torch.zeros(1, 3, imgsz, imgsz)",
        "    try:",
        "        pm = model.model.to(dev).eval()",
        "        with torch.no_grad():",
        "            for _ in range(5): pm(x.to(dev))",
        "            if dev == 'cuda': torch.cuda.synchronize()",
        "            t0 = time.time()",
        "            for _ in range(runs): pm(x.to(dev))",
        "            if dev == 'cuda': torch.cuda.synchronize()",
        "        ms = (time.time() - t0) / runs * 1000",
        "    except Exception:",
        "        ms = float('nan')",
        "    return {'params_m': params_m, 'gflops': gflops, 'infer_ms': ms,",
        "            'fps': (1000/ms) if ms == ms else float('nan')}",
        "",
        "def train_eval(dataset_key, arch_name, weights):",
        "    data_yaml = DATA_YAML[dataset_key]",
        "    run_name = f'{dataset_key}_{arch_name}'",
        "    Cls = RTDETR if 'rtdetr' in weights.lower() else YOLO",
        "    model = Cls(weights)",
        "    model.train(data=data_yaml, epochs=EPOCHS, imgsz=IMG_SIZE, batch=BATCH,",
        "                seed=42, name=run_name, exist_ok=True, verbose=False)",
        "    m = model.val(data=data_yaml, split='test', imgsz=IMG_SIZE, conf=CONF, verbose=False)",
        "    box = m.box",
        "    prec, rec = float(box.mp), float(box.mr)",
        "    metrics = {",
        "        'dataset': dataset_key, 'arch': arch_name,",
        "        'map50': float(box.map50), 'map50_95': float(box.map),",
        "        'precision': prec, 'recall': rec,",
        "        'f1': float(2*prec*rec/(prec+rec+1e-9)),",
        "        'per_class_ap50': {m.names[i]: float(v) for i, v in enumerate(box.ap50)} if hasattr(box, 'ap50') else {},",
        "    }",
        "    metrics.update(efficiency(model, IMG_SIZE))",
        "    json.dump(metrics, open(f'{RESULTS_DIR}{run_name}.json', 'w'), indent=2, ensure_ascii=False)",
        "    map50, map5095, f1, fps = metrics['map50'], metrics['map50_95'], metrics['f1'], metrics['fps']",
        "    print(f'[{run_name}] mAP50={map50:.4f} mAP50-95={map5095:.4f} F1={f1:.4f} FPS={fps:.1f}')",
        "    return metrics",
    ))

    out.append(md(
        "## 3.5 (Opsiyonel) Önceki oturumdan devam",
        "Önceki bir oturumda indirdiğin `<run_name>.json` dosyaların varsa (örn. "
        "`catlak_yolov8n.json`), aşağıdaki hücreyi çalıştırıp onları seç — "
        "`results/` klasörüne kopyalanır ve aşağıdaki eğitim döngüleri bu koşuları "
        "atlar. Hiç dosyan yoksa bu hücreyi atla / boş iptal et.",
    ))
    out.append(code(
        "from google.colab import files as _colab_files",
        "import shutil as _shutil",
        "uploaded = _colab_files.upload()",
        "for fname in uploaded:",
        "    _shutil.move(fname, f'{RESULTS_DIR}{fname}')",
        "    print('tasindi ->', f'{RESULTS_DIR}{fname}')",
    ))

    out.append(md("## 4. Bütün veri setleri × YOLO/RT-DETR mimarileri için eğit",
                   "**Devam etme:** Önceki bir oturumdan indirdiğin `<run_name>.json` dosyalarını "
                   "bu oturumun `results/` klasörüne yüklersen, o koşular tekrar eğitilmez, atlanır."))
    out.append(code(
        "ARCH_WEIGHTS = {" + ", ".join(f"'{a}': '{w}'" for a, w in ARCH_WEIGHTS.items()) + "}",
        "",
        "all_results = {}",
        "for dataset_key in DATASETS:",
        "    for arch_name, weights in ARCH_WEIGHTS.items():",
        "        key = f'{dataset_key}_{arch_name}'",
        "        result_path = f'{RESULTS_DIR}{key}.json'",
        "        if os.path.exists(result_path):",
        "            all_results[key] = json.load(open(result_path))",
        "            print(f'[{key}] onceki oturumdan bulundu, atlaniyor.')",
        "            continue",
        "        print(f\"\\n{'='*70}\\n{key}\\n{'='*70}\")",
        "        try:",
        "            all_results[key] = train_eval(dataset_key, arch_name, weights)",
        "        except Exception as e:",
        "            print(f'HATA [{key}]: {e}')",
    ))

    out.append(md(
        "## 5. YOLOv8 + SimAM (dikkat modülü)",
        "SimAM parametresiz bir dikkat katmanı; `ultralytics/cfg/models/v8/yolov8.yaml` "
        "kopyalanıp backbone sonuna eklenir. **Risk:** SimAM katmanı ancak "
        "`ultralytics >= 8.1`'de yerleşik modül olarak kayıtlıysa çalışır — kurulu sürüm "
        "desteklemiyorsa bu hücre hata verir, aşağıdaki `try/except` bunu yutup diğer "
        "adımlara geçer (tüm koşuyu düşürmez).",
    ))
    out.append(code(
        "import ultralytics, yaml",
        "from pathlib import Path",
        "",
        "def build_simam_yaml():",
        "    base = Path(ultralytics.__file__).parent / 'cfg/models/v8/yolov8.yaml'",
        "    cfg = yaml.safe_load(open(base))",
        "    cfg['backbone'].insert(-1, [-1, 1, 'SimAM', []])",
        "    yaml.safe_dump(cfg, open('yolov8_simam.yaml', 'w'))",
        "    return 'yolov8_simam.yaml'",
        "",
        "for dataset_key in DATASETS:",
        "    run_name = f'{dataset_key}_yolov8s_simam'",
        "    result_path = f'{RESULTS_DIR}{run_name}.json'",
        "    if os.path.exists(result_path):",
        "        all_results[run_name] = json.load(open(result_path))",
        "        print(f'[{run_name}] onceki oturumdan bulundu, atlaniyor.')",
        "        continue",
        "    print(f\"\\n{'='*70}\\n{run_name}\\n{'='*70}\")",
        "    try:",
        "        simam_yaml = build_simam_yaml()",
        "        model = YOLO(simam_yaml).load('yolov8s.pt')",
        "        model.train(data=DATA_YAML[dataset_key], epochs=EPOCHS, imgsz=IMG_SIZE, batch=BATCH,",
        "                    seed=42, name=run_name, exist_ok=True, verbose=False)",
        "        m = model.val(data=DATA_YAML[dataset_key], split='test', imgsz=IMG_SIZE, conf=CONF, verbose=False)",
        "        box = m.box",
        "        prec, rec = float(box.mp), float(box.mr)",
        "        metrics = {",
        "            'dataset': dataset_key, 'arch': 'yolov8s_simam',",
        "            'map50': float(box.map50), 'map50_95': float(box.map),",
        "            'precision': prec, 'recall': rec,",
        "            'f1': float(2*prec*rec/(prec+rec+1e-9)),",
        "        }",
        "        metrics.update(efficiency(model, IMG_SIZE))",
        "        json.dump(metrics, open(f'{RESULTS_DIR}{run_name}.json', 'w'), indent=2, ensure_ascii=False)",
        "        all_results[run_name] = metrics",
        "        print(f\"[{run_name}] mAP50={metrics['map50']:.4f} mAP50-95={metrics['map50_95']:.4f}\")",
        "    except Exception as e:",
        "        print(f'HATA [{run_name}]: {e}')",
    ))

    out.append(md(
        "## 6. Faster R-CNN (R50-FPN, torchvision)",
        "COCO formatındaki export kullanılır (bbox yeterli, maske gerektirmez). "
        "`torchmetrics` ile mAP hesaplanır.",
    ))
    out.append(code(
        "import torch",
        "from torch.utils.data import DataLoader",
        "from torchvision.datasets import CocoDetection",
        "import torchvision.transforms.v2 as T",
        "from torchvision.models.detection import fasterrcnn_resnet50_fpn_v2",
        "from torchvision.models.detection.faster_rcnn import FastRCNNPredictor",
        "from torchmetrics.detection import MeanAveragePrecision",
        "",
        "def coco_loaders(coco_root, batch_size=4):",
        "    coco_root = Path(coco_root)",
        "    tf = T.Compose([T.ToImage(), T.ToDtype(torch.float32, scale=True)])",
        "    def make(split):",
        "        d = coco_root / split",
        "        ann = d / '_annotations.coco.json'",
        "        if not ann.exists(): return None",
        "        ds = CocoDetection(str(d), str(ann), transforms=lambda i, t: (tf(i), t))",
        "        return DataLoader(ds, batch_size=batch_size, shuffle=(split == 'train'),",
        "                          collate_fn=lambda b: tuple(zip(*b)), num_workers=2)",
        "    return {s: make(s) for s in ('train', 'valid', 'test')}",
        "",
        "def train_eval_fasterrcnn(dataset_key, epochs=60):",
        "    run_name = f'{dataset_key}_faster_rcnn_r50fpn'",
        "    coco_root = DATA_COCO[dataset_key]",
        "    dl = coco_loaders(coco_root)",
        "    n_classes = len(json.load(open(Path(coco_root) / 'train' / '_annotations.coco.json'))['categories']) + 1",
        "    dev = 'cuda' if torch.cuda.is_available() else 'cpu'",
        "    model = fasterrcnn_resnet50_fpn_v2(weights='DEFAULT')",
        "    in_features = model.roi_heads.box_predictor.cls_score.in_features",
        "    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, n_classes)",
        "    model.to(dev)",
        "    opt = torch.optim.SGD([p for p in model.parameters() if p.requires_grad],",
        "                          lr=5e-3, momentum=0.9, weight_decay=5e-4)",
        "    for ep in range(epochs):",
        "        model.train(); tot = 0.0",
        "        for imgs, targets in dl['train']:",
        "            imgs = [i.to(dev) for i in imgs]",
        "            tg = [{'boxes': torch.tensor([o['bbox'] for o in t], dtype=torch.float32).reshape(-1, 4).to(dev),",
        "                   'labels': torch.tensor([o['category_id'] for o in t], dtype=torch.int64).to(dev)} for t in targets]",
        "            for d in tg:",
        "                if len(d['boxes']): d['boxes'][:, 2:] += d['boxes'][:, :2]",
        "            loss = sum(model(imgs, tg).values())",
        "            opt.zero_grad(); loss.backward(); opt.step(); tot += float(loss)",
        "        print(f'[{run_name}] epoch {ep+1}/{epochs} loss {tot/len(dl[\"train\"]):.3f}')",
        "",
        "    metric = MeanAveragePrecision(box_format='xyxy')",
        "    model.eval()",
        "    with torch.no_grad():",
        "        for imgs, targets in dl.get('test') or dl['valid']:",
        "            imgs = [i.to(dev) for i in imgs]",
        "            preds = model(imgs)",
        "            gts = [{'boxes': torch.tensor([o['bbox'] for o in t]).reshape(-1, 4),",
        "                    'labels': torch.tensor([o['category_id'] for o in t])} for t in targets]",
        "            for g in gts:",
        "                if len(g['boxes']): g['boxes'][:, 2:] += g['boxes'][:, :2]",
        "            metric.update([{k: v.cpu() for k, v in p.items()} for p in preds], gts)",
        "    r = metric.compute()",
        "    metrics = {",
        "        'dataset': dataset_key, 'arch': 'faster_rcnn_r50fpn',",
        "        'map50': float(r['map_50']), 'map50_95': float(r['map']),",
        "        'precision': float('nan'), 'recall': float(r['mar_100']), 'f1': float('nan'),",
        "        'params_m': sum(p.numel() for p in model.parameters()) / 1e6,",
        "        'gflops': float('nan'), 'infer_ms': float('nan'), 'fps': float('nan'),",
        "    }",
        "    json.dump(metrics, open(f'{RESULTS_DIR}{run_name}.json', 'w'), indent=2, ensure_ascii=False)",
        "    print(f\"[{run_name}] mAP50={metrics['map50']:.4f} mAP50-95={metrics['map50_95']:.4f}\")",
        "    return metrics",
        "",
        "for dataset_key in DATASETS:",
        "    run_name = f'{dataset_key}_faster_rcnn_r50fpn'",
        "    result_path = f'{RESULTS_DIR}{run_name}.json'",
        "    if os.path.exists(result_path):",
        "        all_results[run_name] = json.load(open(result_path))",
        "        print(f'[{run_name}] onceki oturumdan bulundu, atlaniyor.')",
        "        continue",
        "    print(f\"\\n{'='*70}\\n{run_name}\\n{'='*70}\")",
        "    try:",
        "        all_results[run_name] = train_eval_fasterrcnn(dataset_key)",
        "    except Exception as e:",
        "        print(f'HATA [{run_name}]: {e}')",
    ))

    out.append(md("## 7. Karşılaştırma tabloları + grafikler (veri seti başına)"))
    out.append(code(
        "import pandas as pd, matplotlib.pyplot as plt",
        "",
        "for dataset_key, d in DATASETS.items():",
        "    rows = [v for k, v in all_results.items() if v.get('dataset') == dataset_key]",
        "    if not rows: continue",
        "    tbl = pd.DataFrame(rows)[['arch','map50','map50_95','precision','recall','f1','params_m','gflops','fps']]",
        "    tbl = tbl.sort_values('map50_95', ascending=False)",
        "    tbl.to_csv(f'{RESULTS_DIR}00_{dataset_key}_comparison.csv', index=False)",
        "    display(tbl.round(4))",
        "",
        "    fig, ax = plt.subplots(figsize=(7,4))",
        "    ax.barh(tbl['arch'], tbl['map50_95'], color='#4C72B0')",
        "    ax.set_xlabel('mAP@50-95'); ax.set_title(f\"{d['title']} - Mimari Karsilastirmasi\")",
        "    plt.tight_layout(); plt.savefig(f'{RESULTS_DIR}00_{dataset_key}_chart.png', dpi=160); plt.show()",
    ))

    out.append(md("## 8. Sonuçları indir"))
    out.append(code(
        "import shutil",
        "shutil.make_archive('03_yer_seviyesi_sonuclar', 'zip', RESULTS_DIR)",
        "from google.colab import files",
        "files.download('03_yer_seviyesi_sonuclar.zip')",
    ))

    return out


def main():
    write_notebook(HERE / "00_catlak_bina_yolo.ipynb", cells())


if __name__ == "__main__":
    main()
