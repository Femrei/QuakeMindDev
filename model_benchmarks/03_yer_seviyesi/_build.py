"""ALAN 03 - Yer seviyesi tespit kiyaslama defterleri.  python _build.py

Veri: Roboflow Universe. YOLO ailesi -> 'yolov8' export; R-CNN -> 'coco' export.
Anahtar/slug -> common.CONFIG veya defterin AYAR hucresi.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _nbtools import md, code, write_notebook, colab_cell  # noqa: E402
SUB = "model_benchmarks/03_yer_seviyesi"

HERE = Path(__file__).resolve().parent
DOMAIN = "Yer seviyesi - catlak / yapisal hasar tespiti"

HEAD = lambda title, tier, why: md(
    f"# {title} - {DOMAIN}", "",
    f"**Katman:** {tier}", "", why, "",
    "Bizim yontem: 2x YOLOv8 (catlak.pt + bina.pt) + hibrit kip, guven esigi 0,20, gecikme 153-174 ms.  ",
    "Butun modeller `common.py` uzerinden AYNI Roboflow seti / AYNI bolme / AYNI metrik.  ",
    "Metrik: mAP@50, mAP@50-95, Kesinlik, Duyarlilik, F1, sinif bazli AP + FPS/Params/GFLOPs.",
)

DATA_YOLO = code(
    "import sys; from pathlib import Path; sys.path.insert(0, str(Path.cwd()))",
    "import common as C",
    "C.CONFIG.update(dict(",
    "    roboflow_api_key='BURAYA_ROBOFLOW_API_KEY',",
    "    roboflow_workspace='workspace-slug',",
    "    roboflow_project='project-slug',",
    "    roboflow_version=1,",
    "))",
    "ds_dir = C.download_dataset('yolov8')",
    "DATA_YAML = ds_dir / 'data.yaml'",
    "print('veri:', DATA_YAML)",
)


def yolo_nb(name, title, weights, tier, why, task="detect"):
    return [
        HEAD(title, tier, why),
        colab_cell(SUB, "ultralytics roboflow"),
        md("## 1. Veri (Roboflow YOLO export)"), DATA_YOLO,
        md("## 2. Egit + degerlendir + kaydet"),
        code(
            f'MODEL_NAME = "{name}"',
            f'WEIGHTS = "{weights}"',
            f'TASK = "{task}"',
            "metrics, eff = C.train_yolo(WEIGHTS, DATA_YAML, MODEL_NAME, C.CONFIG, task=TASK)",
            "print('mAP50:', round(metrics['map50'], 4), ' mAP50-95:', round(metrics['map50_95'], 4))",
            "print('F1:', round(metrics['f1'], 4), ' FPS:', round(eff['fps'], 1))",
        ),
        md("## 3. Liderlik tablosu"),
        code("import pandas as pd; pd.read_csv('results/leaderboard.csv')"),
    ]


def yolo_scale_nb():
    return [
        HEAD("YOLOv8 n/s/m/l - Olcek ablasyonu", "Zorunlu",
             "Mobil/uc cihaz argumaninin sayisal dayanagi - dort boyut ayni protokolde."),
        colab_cell(SUB, "ultralytics roboflow"),
        md("## 1. Veri"), DATA_YOLO,
        md("## 2. Dort olcegi sirayla egit"),
        code(
            "for sz in ['n', 's', 'm', 'l']:",
            "    name = f'yolov8{sz}'",
            "    C.train_yolo(f'yolov8{sz}.pt', DATA_YAML, name, C.CONFIG)",
            "import pandas as pd; pd.read_csv('results/leaderboard.csv')",
        ),
    ]


def yolo_simam_nb():
    return [
        HEAD("YOLOv8 + SimAM - Dikkat modulu", "Guclendirici",
             "Catlak oznitelik temsilini guclendiriyor; literaturde raporlanmis kazanc. "
             "SimAM parametresiz dikkat -> `ultralytics` model YAML'ine eklenir."),
        colab_cell(SUB, "ultralytics roboflow"),
        md("## 1. Veri"), DATA_YOLO,
        md("## 2. SimAM'li model YAML'i",
           "",
           "`ultralytics/cfg/models/v8/yolov8.yaml` kopyalanir, backbone sonuna "
           "`[-1, 1, SimAM, []]` katmani eklenir (SimAM ultralytics >= 8.1'de kayitli). "
           "Asagida hazir bir kopya olusturuluyor."),
        code(
            "import ultralytics, yaml, shutil",
            "base = Path(ultralytics.__file__).parent / 'cfg/models/v8/yolov8.yaml'",
            "cfg = yaml.safe_load(open(base))",
            "# backbone son SPPF'den sonra SimAM ekle",
            "cfg['backbone'].insert(-1, [-1, 1, 'SimAM', []])",
            "yaml.safe_dump(cfg, open('yolov8_simam.yaml', 'w'))",
            "print('yazildi: yolov8_simam.yaml')",
        ),
        md("## 3. Egit"),
        code(
            "from ultralytics import YOLO",
            "MODEL_NAME = 'yolov8s_simam'",
            "model = YOLO('yolov8_simam.yaml').load('yolov8s.pt')",
            "model.train(data=str(DATA_YAML), epochs=C.CONFIG['epochs'], imgsz=C.CONFIG['img_size'],",
            "            batch=C.CONFIG['batch_size'], seed=42, name=MODEL_NAME, exist_ok=True)",
            "m = model.val(data=str(DATA_YAML), split='test')",
            "prec, rec = float(m.box.mp), float(m.box.mr)",
            "metrics = dict(map50=float(m.box.map50), map50_95=float(m.box.map), precision=prec, recall=rec,",
            "               f1=2*prec*rec/(prec+rec+1e-9))",
            "eff = C._yolo_efficiency(model, C.CONFIG['img_size'])",
            "C.save_result(MODEL_NAME, metrics, eff, extra={'note': 'SimAM backbone'})",
            "print(metrics)",
        ),
    ]


def rcnn_nb(name, title, builder_lines, tier, why, is_mask=False):
    return [
        HEAD(title, tier, why),
        colab_cell(SUB, "torch torchvision roboflow pycocotools"),
        md("## 1. Veri (Roboflow COCO export)"),
        code(
            "import sys; from pathlib import Path; sys.path.insert(0, str(Path.cwd()))",
            "import common as C, torch",
            "C.CONFIG.update(dict(roboflow_api_key='BURAYA', roboflow_workspace='w', roboflow_project='p', roboflow_version=1))",
            "coco_dir = C.download_dataset('coco')",
            "dl = C.coco_loaders(coco_dir, C.CONFIG['img_size'], batch_size=4)",
            "n_classes = len(__import__('json').load(open(coco_dir / 'train' / '_annotations.coco.json'))['categories']) + 1",
            "print('sinif+bg:', n_classes)",
        ),
        md("## 2. Model"),
        code(
            f'MODEL_NAME = "{name}"',
            "from torchvision.models.detection.faster_rcnn import FastRCNNPredictor",
            *(["from torchvision.models.detection.mask_rcnn import MaskRCNNPredictor"] if is_mask else []),
            *builder_lines,
            "dev = 'cuda' if torch.cuda.is_available() else 'cpu'; model.to(dev)",
        ),
        md("## 3. Egitim dongusu"),
        code(
            "opt = torch.optim.SGD([p for p in model.parameters() if p.requires_grad], lr=5e-3, momentum=0.9, weight_decay=5e-4)",
            "EPOCHS = 30",
            "for ep in range(EPOCHS):",
            "    model.train(); tot = 0",
            "    for imgs, targets in dl['train']:",
            "        imgs = [i.to(dev) for i in imgs]",
            "        tg = [{'boxes': torch.tensor([o['bbox'] for o in t], dtype=torch.float32).reshape(-1,4).to(dev),",
            "               'labels': torch.tensor([o['category_id'] for o in t], dtype=torch.int64).to(dev)} for t in targets]",
            "        # NOT: Roboflow COCO bbox [x,y,w,h] -> [x1,y1,x2,y2] donusumu gerekir",
            "        for d in tg:",
            "            if len(d['boxes']): d['boxes'][:, 2:] += d['boxes'][:, :2]",
            "        loss = sum(model(imgs, tg).values())",
            "        opt.zero_grad(); loss.backward(); opt.step(); tot += float(loss)",
            "    print(f'epoch {ep+1} loss {tot/len(dl[\"train\"]):.3f}')",
        ),
        md("## 4. Degerlendirme (torchmetrics mAP) + kaydet"),
        code(
            "# pip install -q torchmetrics",
            "from torchmetrics.detection import MeanAveragePrecision",
            "metric = MeanAveragePrecision(box_format='xyxy')",
            "model.eval()",
            "with torch.no_grad():",
            "    for imgs, targets in dl.get('test') or dl['valid']:",
            "        imgs = [i.to(dev) for i in imgs]",
            "        preds = model(imgs)",
            "        gts = [{'boxes': torch.tensor([o['bbox'] for o in t]).reshape(-1,4),",
            "                'labels': torch.tensor([o['category_id'] for o in t])} for t in targets]",
            "        for g in gts:",
            "            if len(g['boxes']): g['boxes'][:, 2:] += g['boxes'][:, :2]",
            "        metric.update([{k: v.cpu() for k, v in p.items()} for p in preds], gts)",
            "r = metric.compute()",
            "metrics = dict(map50=float(r['map_50']), map50_95=float(r['map']),",
            "               precision=float('nan'), recall=float(r['mar_100']), f1=float('nan'))",
            "eff = dict(params_m=sum(p.numel() for p in model.parameters())/1e6, gflops=float('nan'),",
            "           infer_ms=float('nan'), fps=float('nan'))",
            "C.save_result(MODEL_NAME, metrics, eff)",
            "print(metrics)",
        ),
    ]


NB_YOLO = {
    "01_yolov8": yolo_nb("yolov8s", "YOLOv8", "yolov8s.pt", "Referans",
                         "**Mevcut modelimiz - referans satiri.**"),
    "03_yolov11": yolo_nb("yolo11s", "YOLOv11", "yolo11s.pt", "Zorunlu",
                          "Guncel surum - v8 -> v11 kazanimini olcer."),
    "04_yolov11_seg": yolo_nb("yolo11s_seg", "YOLOv11-seg", "yolo11s-seg.pt", "Zorunlu",
                              "Kutudan maskeye gecis - piksel seviyesi hasar siniri.", task="segment"),
    "06_rt_detr": yolo_nb("rtdetr_l", "RT-DETR", "rtdetr-l.pt", "Guclendirici",
                          "Gercek zamanli transformer tespiti - CNN/transformer karsilastirmasi."),
}


def leaderboard_nb():
    return [
        md(f"# 03 {DOMAIN} - Ozet Tablo"),
        code(
            "import json, pandas as pd, matplotlib.pyplot as plt; from pathlib import Path",
            "rows = [json.load(open(f)) for f in sorted(Path('results').glob('*.json'))]",
            "cols = ['model','map50','map50_95','precision','recall','f1','params_m','gflops','fps']",
            "tbl = pd.DataFrame([{k: r.get(k) for k in cols} for r in rows]).sort_values('map50_95', ascending=False)",
            "display(tbl.round(4)); print(tbl.round(4).to_latex(index=False))",
        ),
        code(
            "t = tbl.dropna(subset=['params_m'])",
            "fig, ax = plt.subplots(figsize=(7,4))",
            "ax.scatter(t['params_m'], t['map50_95'])",
            "for _, r in t.iterrows(): ax.annotate(r['model'], (r['params_m'], r['map50_95']), fontsize=8)",
            "ax.set_xlabel('Params (M)'); ax.set_ylabel('mAP@50-95'); ax.set_title('Olcek - dogruluk')",
            "plt.tight_layout(); plt.savefig('results/scale_vs_map.png', dpi=150); plt.show()",
        ),
    ]


def main():
    for n, cells in NB_YOLO.items():
        write_notebook(HERE / f"{n}.ipynb", cells)
    write_notebook(HERE / "02_yolov8_scale.ipynb", yolo_scale_nb())
    write_notebook(HERE / "07_yolov8_simam.ipynb", yolo_simam_nb())
    write_notebook(HERE / "05_faster_rcnn.ipynb", rcnn_nb(
        "faster_rcnn_r50fpn", "Faster R-CNN (R50-FPN)",
        ["from torchvision.models.detection import fasterrcnn_resnet50_fpn_v2",
         "model = fasterrcnn_resnet50_fpn_v2(weights='DEFAULT')",
         "model.roi_heads.box_predictor = FastRCNNPredictor(model.roi_heads.box_predictor.cls_score.in_features, n_classes)"],
        "Zorunlu", "M3'te en yaygin tespit ailesi - literaturle karsilastirilabilirlik."))
    write_notebook(HERE / "08_mask_rcnn.ipynb", rcnn_nb(
        "mask_rcnn_r50fpn", "Mask R-CNN (R50-FPN)",
        ["from torchvision.models.detection import maskrcnn_resnet50_fpn_v2",
         "model = maskrcnn_resnet50_fpn_v2(weights='DEFAULT')",
         "ic = model.roi_heads.box_predictor.cls_score.in_features",
         "model.roi_heads.box_predictor = FastRCNNPredictor(ic, n_classes)",
         "mic = model.roi_heads.mask_predictor.conv5_mask.in_channels",
         "model.roi_heads.mask_predictor = MaskRCNNPredictor(mic, 256, n_classes)"],
        "Guclendirici", "M3: ornek segmentasyonunun standart mimarisi.", is_mask=True))
    write_notebook(HERE / "00_leaderboard.ipynb", leaderboard_nb())


if __name__ == "__main__":
    main()
