"""
ALAN 03 - Yer seviyesi goruntu: catlak ve yapisal bina hasari tespiti.

Bizim yontem: iki YOLOv8 modeli (catlak.pt, bina.pt) + hibrit kip.
              guven esigi 0,20; olculen gecikme 153-174 ms.

Butun kiyaslama modelleri AYNI Roboflow veri seti, AYNI train/val/test bolmesi,
AYNI metrik raporu ile.
Metrik: mAP@50, mAP@50-95, Kesinlik, Duyarlilik, F1, sinif bazli AP,
        + FPS, Params(M), GFLOPs.

VERI: Roboflow Universe.
  - YOLO ailesi   ->  format "yolov8"
  - Faster/Mask R-CNN -> format "coco"
Anahtar/slug'lari CONFIG'e gir.
"""
from pathlib import Path
import json
import time

HERE = Path(__file__).resolve().parent
RESULTS_DIR = HERE / "results"

CONFIG = {
    "roboflow_api_key": "BURAYA_ROBOFLOW_API_KEY",
    "roboflow_workspace": "workspace-slug",
    "roboflow_project": "project-slug",
    "roboflow_version": 1,
    "img_size": 640,
    "epochs": 60,          # free Colab 12s limiti; gercek sette 100 ideal
    "batch_size": 16,
    "conf": 0.20,          # bizim production esigimiz
}


def download_dataset(fmt="yolov8", cfg=CONFIG):
    """fmt: 'yolov8' (ultralytics) | 'coco' (torchvision). -> indirilen klasor yolu."""
    from roboflow import Roboflow
    rf = Roboflow(api_key=cfg["roboflow_api_key"])
    proj = rf.workspace(cfg["roboflow_workspace"]).project(cfg["roboflow_project"])
    ds = proj.version(cfg["roboflow_version"]).download(fmt)
    return Path(ds.location)


# --- YOLO / RT-DETR (ultralytics) --------------------------------

def train_yolo(weights, data_yaml, model_name, cfg=CONFIG, task="detect", extra=None):
    """weights: 'yolov8s.pt' / 'yolo11s.pt' / 'rtdetr-l.pt' / 'yolov8s-seg.pt' ...
    -> (metrics_dict, efficiency_dict). Sonucu results/'e yazar.
    """
    from ultralytics import YOLO, RTDETR
    Cls = RTDETR if "rtdetr" in weights.lower() else YOLO
    model = Cls(weights)
    model.train(data=str(data_yaml), epochs=cfg["epochs"], imgsz=cfg["img_size"],
                batch=cfg["batch_size"], seed=42, name=model_name, exist_ok=True,
                verbose=False)
    m = model.val(data=str(data_yaml), split="test", imgsz=cfg["img_size"], verbose=False)

    box = m.box
    prec = float(box.mp); rec = float(box.mr)
    metrics = {
        "map50": float(box.map50),
        "map50_95": float(box.map),
        "precision": prec,
        "recall": rec,
        "f1": float(2 * prec * rec / (prec + rec + 1e-9)),
        "per_class_ap50": {m.names[i]: float(v) for i, v in enumerate(box.ap50)} if hasattr(box, "ap50") else {},
    }
    if task == "segment" and getattr(m, "seg", None) is not None:
        metrics["mask_map50"] = float(m.seg.map50)
        metrics["mask_map50_95"] = float(m.seg.map)

    eff = _yolo_efficiency(model, cfg["img_size"])
    save_result(model_name, metrics, eff, extra=extra or {"weights": weights})
    return metrics, eff


def _yolo_efficiency(model, imgsz, runs=50):
    import torch
    info = model.info(verbose=False) if hasattr(model, "info") else None
    params_m = (info[1] / 1e6) if info else float("nan")
    gflops = (info[3]) if info and len(info) > 3 else float("nan")
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    x = torch.zeros(1, 3, imgsz, imgsz)
    try:
        pm = model.model.to(dev).eval()
        with torch.no_grad():
            for _ in range(5):
                pm(x.to(dev))
            if dev == "cuda":
                torch.cuda.synchronize()
            t0 = time.time()
            for _ in range(runs):
                pm(x.to(dev))
            if dev == "cuda":
                torch.cuda.synchronize()
        ms = (time.time() - t0) / runs * 1000
    except Exception:
        ms = float("nan")
    return {"params_m": params_m, "gflops": gflops, "infer_ms": ms, "fps": (1000 / ms) if ms == ms else float("nan")}


# --- Faster / Mask R-CNN (torchvision + COCO export) -------------

def coco_loaders(coco_root, img_size=640, batch_size=4):
    import torch
    from torch.utils.data import DataLoader
    from torchvision.datasets import CocoDetection
    import torchvision.transforms.v2 as T

    coco_root = Path(coco_root)
    tf = T.Compose([T.ToImage(), T.ToDtype(torch.float32, scale=True)])

    def make(split):
        d = coco_root / split
        ann = d / "_annotations.coco.json"
        if not ann.exists():
            return None
        ds = CocoDetection(str(d), str(ann), transforms=lambda i, t: (tf(i), t))
        return DataLoader(ds, batch_size=batch_size, shuffle=(split == "train"),
                          collate_fn=lambda b: tuple(zip(*b)), num_workers=2)
    return {s: make(s) for s in ("train", "valid", "test")}


# --- Kayit -----------------------------------------------------

def save_result(model_name, metrics, efficiency, extra=None):
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    flat = {"model": model_name}
    for k, v in {**metrics, **efficiency}.items():
        if not isinstance(v, dict):
            flat[k] = v
    full = {"model": model_name, **metrics, **efficiency}
    if extra:
        full["extra"] = extra
    json.dump(full, open(RESULTS_DIR / f"{model_name}.json", "w"), indent=2, ensure_ascii=False)

    import pandas as pd
    rows = []
    for jf in sorted(RESULTS_DIR.glob("*.json")):
        d = json.load(open(jf))
        rows.append({k: v for k, v in d.items() if not isinstance(v, dict) and k != "extra"})
    lb = pd.DataFrame(rows).sort_values("map50_95", ascending=False)
    lb.to_csv(RESULTS_DIR / "leaderboard.csv", index=False)
    return lb
