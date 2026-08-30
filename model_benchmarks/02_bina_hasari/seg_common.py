"""
Segmentasyon kiyaslamasi - ortak veri + egitim dongusu + metrik + kayit.
ALAN 02 (bina hasari) - ALAN 01 ile ayni protokol ayni dosyayi kullanir;
sadece VERI SETI AYARI kismi farklidir.

Bizim yontem: SegFormer (MiT-B4), ikili maske, focal + dice bilesik kayip,
ortusmeli karolama + agirlikli pencere harmanlama + morfolojik son-islem.
Butun kiyaslama mimarileri AYNI kodlayici / AYNI protokol / AYNI metrik ile.

VERI: Roboflow Universe'ten "Semantic Segmentation Masks" (PNG) formatinda indir.
      Dataset > Download > format: "PNG Mask (Semantic)" > "show download code".
      Anahtar + slug'lari asagidaki CONFIG'e gir. Alternatif: local images/ + masks/.
"""
from pathlib import Path
import json
import time

import numpy as np

HERE = Path(__file__).resolve().parent
RESULTS_DIR = HERE / "results"
SEED = 42

# ============================================================
#  VERI SETI AYARI  ->  buraya kendi Roboflow linkini/anahtarini gir
# ============================================================
CONFIG = {
    "source": "roboflow",          # "roboflow" | "local"
    "roboflow_api_key": "BURAYA_ROBOFLOW_API_KEY",
    "roboflow_workspace": "workspace-slug",
    "roboflow_project": "project-slug",
    "roboflow_version": 1,
    "roboflow_format": "png-mask-semantic",
    # source == "local" ise:
    "local_images": str(HERE / "data" / "images"),
    "local_masks": str(HERE / "data" / "masks"),
    # ortak:
    "img_size": 512,
    "num_classes": 1,            # ikili (hasarli bina / diger); xBD 4 sinif icin 4 yap
    "batch_size": 4,      # T4 16GB icin; B5/DeepLab-R101/Mask2Former OOM verirse 2 yap
    "epochs": 30,
    "lr": 6e-5,
}


def prepare_dataset(cfg=CONFIG):
    """Roboflow'dan indir (veya local yolu dogrula) -> {'train','valid','test'} dizinleri."""
    if cfg["source"] == "roboflow":
        from roboflow import Roboflow
        rf = Roboflow(api_key=cfg["roboflow_api_key"])
        proj = rf.workspace(cfg["roboflow_workspace"]).project(cfg["roboflow_project"])
        ds = proj.version(cfg["roboflow_version"]).download(cfg["roboflow_format"])
        root = Path(ds.location)
        return {s: root / s for s in ("train", "valid", "test") if (root / s).exists()}
    root = Path(cfg["local_images"]).parent
    return {"train": root, "valid": root, "test": root}


# --- Dataset --------------------------------------------------------

def build_loaders(paths, cfg=CONFIG):
    import torch
    from torch.utils.data import Dataset, DataLoader
    import cv2
    try:
        import albumentations as A
    except ImportError:
        A = None

    S = cfg["img_size"]

    class SegDS(Dataset):
        def __init__(self, root, train):
            root = Path(root)
            self.items = _pair_images_masks(root)
            self.train = train
            if A is not None:
                self.aug = (A.Compose([
                    A.RandomResizedCrop((S, S), scale=(0.6, 1.0)),
                    A.HorizontalFlip(), A.VerticalFlip(), A.RandomRotate90(),
                    A.RandomBrightnessContrast(0.2, 0.2),
                    A.Normalize(), ]) if train else
                    A.Compose([A.Resize(S, S), A.Normalize()]))
            else:
                self.aug = None

        def __len__(self):
            return len(self.items)

        def __getitem__(self, i):
            ip, mp = self.items[i]
            img = cv2.cvtColor(cv2.imread(str(ip)), cv2.COLOR_BGR2RGB)
            m = cv2.imread(str(mp), cv2.IMREAD_GRAYSCALE)
            m = (m > 0).astype("float32")
            if self.aug is not None:
                out = self.aug(image=img, mask=m)
                img, m = out["image"], out["mask"]
            else:
                img = cv2.resize(img, (S, S)).astype("float32") / 255.0
                m = cv2.resize(m, (S, S))
            img = torch.tensor(img).permute(2, 0, 1).float()
            return img, torch.tensor(m).unsqueeze(0).float()

    bs = cfg["batch_size"]
    dl = {}
    for split, tr in (("train", True), ("valid", False), ("test", False)):
        if split in paths:
            dl[split] = DataLoader(SegDS(paths[split], tr), batch_size=bs,
                                   shuffle=tr, num_workers=2, drop_last=tr)
    return dl


def _pair_images_masks(root):
    root = Path(root)
    img_dir = next((d for d in [root / "images", root] if d.exists()), root)
    mask_dir = next((d for d in [root / "masks", root / "annotations", root] if d.exists()), root)
    imgs = sorted([p for p in img_dir.rglob("*")
                   if p.suffix.lower() in {".jpg", ".jpeg", ".png"} and "mask" not in p.stem.lower()])
    pairs = []
    for ip in imgs:
        cands = [mask_dir / f"{ip.stem}_mask.png", mask_dir / f"{ip.stem}.png",
                 ip.with_name(f"{ip.stem}_mask.png")]
        mp = next((c for c in cands if c.exists()), None)
        if mp:
            pairs.append((ip, mp))
    return pairs


# --- Model fabrikasi (smp - mimari degisimi tek satir) --------------

def build_model(arch, encoder, num_classes=1):
    """arch: 'Unet'|'Linknet'|'FPN'|'PSPNet'|'DeepLabV3Plus'|'Segformer' ..."""
    import segmentation_models_pytorch as smp
    return getattr(smp, arch)(
        encoder_name=encoder, encoder_weights="imagenet",
        in_channels=3, classes=num_classes,
        activation=None,
    )


# --- Kayip: focal + dice (bizim kurulumla ayni) --------------------

def focal_dice_loss():
    import segmentation_models_pytorch as smp
    import torch.nn as nn
    dice = smp.losses.DiceLoss(mode="binary")
    focal = smp.losses.FocalLoss(mode="binary")

    def loss(logits, target):
        return dice(logits, target) + focal(logits, target)
    return loss


# --- Egitim dongusu ------------------------------------------------

def train_model(model, dl, cfg=CONFIG, device=None):
    import torch
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=cfg["lr"], weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=cfg["epochs"])
    lossf = focal_dice_loss()
    scaler = torch.cuda.amp.GradScaler(enabled=(device == "cuda"))

    for ep in range(cfg["epochs"]):
        model.train()
        run = 0.0
        for img, m in dl["train"]:
            img, m = img.to(device), m.to(device)
            opt.zero_grad()
            with torch.cuda.amp.autocast(enabled=(device == "cuda")):
                loss = lossf(model(img), m)
            scaler.scale(loss).backward()
            scaler.step(opt); scaler.update()
            run += loss.item()
        sched.step()
        msg = f"epoch {ep+1}/{cfg['epochs']}  loss {run/len(dl['train']):.4f}"
        if "valid" in dl:
            vm = evaluate_seg(model, dl["valid"], device)
            msg += f"  val mIoU {vm['mean_iou']:.4f}  F1 {vm['f1']:.4f}"
        print(msg)
    return model


# --- Metrikler ----------------------------------------------------

def evaluate_seg(model, loader, device=None, thr=0.5):
    import torch
    from sklearn.metrics import roc_auc_score
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device).eval()
    tp = fp = fn = tn = 0
    probs_all, gt_all = [], []
    with torch.no_grad():
        for img, m in loader:
            img = img.to(device)
            p = torch.sigmoid(model(img)).cpu().numpy().ravel()
            g = m.numpy().ravel().astype(int)
            pred = (p >= thr).astype(int)
            tp += int(((pred == 1) & (g == 1)).sum())
            fp += int(((pred == 1) & (g == 0)).sum())
            fn += int(((pred == 0) & (g == 1)).sum())
            tn += int(((pred == 0) & (g == 0)).sum())
            if len(probs_all) < 50:
                probs_all.append(p[::37]); gt_all.append(g[::37])
    eps = 1e-9
    iou = tp / (tp + fp + fn + eps)
    iou_bg = tn / (tn + fp + fn + eps)
    prec = tp / (tp + fp + eps)
    rec = tp / (tp + fn + eps)
    spec = tn / (tn + fp + eps)
    f1 = 2 * prec * rec / (prec + rec + eps)
    acc = (tp + tn) / (tp + tn + fp + fn + eps)
    try:
        auc = float(roc_auc_score(np.concatenate(gt_all), np.concatenate(probs_all)))
    except Exception:
        auc = float("nan")
    return {"iou_fg": iou, "iou_bg": iou_bg, "mean_iou": (iou + iou_bg) / 2,
            "f1": f1, "precision": prec, "recall": rec, "specificity": spec,
            "accuracy": acc, "auc": auc}


# --- Verimlilik: params / GFLOPs / cikarim suresi -----------------

def efficiency_stats(model, img_size=512, device="cpu", runs=30):
    import torch
    model = model.to(device).eval()
    params_m = sum(p.numel() for p in model.parameters()) / 1e6
    gflops = float("nan")
    try:
        from thop import profile
        x = torch.randn(1, 3, img_size, img_size).to(device)
        macs, _ = profile(model, inputs=(x,), verbose=False)
        gflops = macs * 2 / 1e9
    except Exception:
        pass
    x = torch.randn(1, 3, img_size, img_size).to(device)
    with torch.no_grad():
        for _ in range(3):
            model(x)
        if device == "cuda":
            torch.cuda.synchronize()
        t0 = time.time()
        for _ in range(runs):
            model(x)
        if device == "cuda":
            torch.cuda.synchronize()
    ms = (time.time() - t0) / runs * 1000
    return {"params_m": params_m, "gflops": gflops, f"infer_ms_{device}": ms}


# --- Kayit ------------------------------------------------------

def save_result(model_name, metrics, efficiency, extra=None):
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    full = {"model": model_name, **metrics, **efficiency}
    if extra:
        full["extra"] = extra
    json.dump(full, open(RESULTS_DIR / f"{model_name}.json", "w"), indent=2)
    import pandas as pd
    rows = []
    for jf in sorted(RESULTS_DIR.glob("*.json")):
        d = json.load(open(jf))
        rows.append({k: v for k, v in d.items() if k != "extra"})
    lb = pd.DataFrame(rows).sort_values("mean_iou", ascending=False)
    lb.to_csv(RESULTS_DIR / "leaderboard.csv", index=False)
    return lb
