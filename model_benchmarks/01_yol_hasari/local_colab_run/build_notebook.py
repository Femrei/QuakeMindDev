"""01_yol_hasari - Colab'da tek oturumda calisacak, tum mimarileri kiyaslayan defter.

Veri: KATE-CD (HF: CSCRS/kate-cd) + MedBFS (Zenodo Turkey.zip) - "optimized_training_colab.ipynb"
ile AYNI kaynak/tiling. Butun mimariler (SegFormer referans haric - o zaten ayri
calistirilip IoU=0.4276 alindi) AYNI veri / AYNI kayip / AYNI optimizasyon ile
sirayla bu tek defterde egitilir.

    python build_notebook.py   ->  01_yol_hasari/local_colab_run/00_tum_mimariler.ipynb
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent))
from _nbtools import md, code, write_notebook  # noqa: E402


def cells():
    out = []

    out.append(md(
        "# 01 Yol Hasarı Segmentasyonu — Tüm Mimariler (Tek Oturum)",
        "",
        "**Veri:** KATE-CD (HF `CSCRS/kate-cd`) + MedBFS (Zenodo `Turkey.zip`) — "
        "`optimized_training_colab.ipynb` ile birebir aynı kaynak/tiling.  ",
        "**Referans model** (SegFormer MiT-B4) ayrı çalıştırılıp **Val IoU = 0.4276** alındı; "
        "bu defter geri kalan 5 zorunlu mimariyi AYNI veri / AYNI kayıp / AYNI optimizasyonla "
        "sırayla eğitir, böylece adil bir kıyaslama tablosu çıkar.  ",
        "**Mimariler:** U-Net (R18), LinkNet (R18), FPN (R18), PSPNet (R18), DeepLabV3+ (R101).",
        "",
        "**ÖNEMLİ:** Üst menüden `Çalışma Zamanı` → `Çalışma zamanı türünü değiştir` → **T4 GPU** seçin.",
    ))

    out.append(md("## 1. Kütüphaneler"))
    out.append(code(
        "!pip install -q datasets opencv-python numpy tqdm scikit-learn torch torchvision "
        "segmentation-models-pytorch albumentations matplotlib"
    ))

    out.append(md("## 2. Dizinler"))
    out.append(code(
        "import os",
        "import numpy as np",
        "import cv2",
        "",
        "IMG_DIR = 'data/images/'",
        "MASK_DIR = 'data/masks/'",
        "TILE_IMG_DIR = 'data/tiles/images/'",
        "TILE_MASK_DIR = 'data/tiles/masks/'",
        "RESULTS_DIR = 'results/'",
        "for d in [IMG_DIR, MASK_DIR, TILE_IMG_DIR, TILE_MASK_DIR, RESULTS_DIR]:",
        "    os.makedirs(d, exist_ok=True)",
        "print('Klasorler hazir.')",
    ))

    out.append(md("## 3. KATE-CD veri seti"))
    out.append(code(
        "from datasets import load_dataset",
        "",
        "print('KATE-CD cekiliyor...')",
        "try:",
        "    dataset_kate = load_dataset('CSCRS/kate-cd')",
        "except Exception as e:",
        "    print(f'Hata: {e}. Alternatif deneniyor...')",
        "    dataset_kate = load_dataset('hkayabilisim/kate-cd')",
        "",
        "kate_count = 0",
        "for i, veri in enumerate(dataset_kate['train']):",
        "    post_img = veri.get('post_image') or veri.get('image')",
        "    label_img = veri.get('label') or veri.get('mask')",
        "    if post_img and label_img:",
        "        img_np = np.array(post_img); mask_np = np.array(label_img)",
        "        if len(mask_np.shape) > 2:",
        "            mask_np = cv2.cvtColor(mask_np, cv2.COLOR_RGB2GRAY)",
        "        _, mask_np = cv2.threshold(mask_np, 0, 255, cv2.THRESH_BINARY)",
        "        if len(img_np.shape) == 3:",
        "            img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)",
        "        if img_np.shape[:2] == mask_np.shape[:2]:",
        "            cv2.imwrite(os.path.join(IMG_DIR, f'katecd_{i}.png'), img_np)",
        "            cv2.imwrite(os.path.join(MASK_DIR, f'katecd_{i}.png'), mask_np)",
        "            kate_count += 1",
        "print(f'KATE-CD: {kate_count} goruntu kaydedildi.')",
    ))

    out.append(md("## 4. MedBFS veri seti"))
    out.append(code(
        "import urllib.request, zipfile, time",
        "from tqdm import tqdm",
        "",
        "dataset_url = 'https://zenodo.org/records/11647956/files/Turkey.zip?download=1'",
        "zip_path = '/content/Turkey.zip'",
        "extract_path = '/content/MEDBFS_Turkey'",
        "",
        "def indir_yeniden_dene(url, path, deneme=6, bekleme_sn=20):",
        "    for i in range(1, deneme + 1):",
        "        try:",
        "            print(f'MedBFS indiriliyor... (~3.3GB) deneme {i}/{deneme}')",
        "            urllib.request.urlretrieve(url, path)",
        "            return True",
        "        except Exception as e:",
        "            print(f'  indirme hatasi: {e}')",
        "            if os.path.exists(path):",
        "                os.remove(path)",
        "            if i < deneme:",
        "                time.sleep(bekleme_sn)",
        "    return False",
        "",
        "medbfs_ok = True",
        "if not os.path.exists(zip_path):",
        "    medbfs_ok = indir_yeniden_dene(dataset_url, zip_path)",
        "if medbfs_ok and not os.path.exists(extract_path):",
        "    print('MedBFS cikariliyor...')",
        "    with zipfile.ZipFile(zip_path, 'r') as zip_ref:",
        "        zip_ref.extractall(extract_path)",
        "if not medbfs_ok:",
        "    print('MedBFS indirilemedi - sadece KATE-CD ile devam edilecek.')",
        "",
        "medbfs_img_dir = '/content/MEDBFS_Turkey/Turkey/Image/Post-disaster'",
        "medbfs_lbl_dir = '/content/MEDBFS_Turkey/Turkey/Label'",
        "medbfs_count = 0",
        "if os.path.exists(medbfs_img_dir) and os.path.exists(medbfs_lbl_dir):",
        "    for img_name in tqdm(os.listdir(medbfs_img_dir)):",
        "        if not img_name.endswith('.tif'):",
        "            continue",
        "        src_img = os.path.join(medbfs_img_dir, img_name)",
        "        src_lbl = os.path.join(medbfs_lbl_dir, img_name)",
        "        if not os.path.exists(src_lbl):",
        "            continue",
        "        img = cv2.imread(src_img); mask = cv2.imread(src_lbl, cv2.IMREAD_GRAYSCALE)",
        "        if img is None or mask is None:",
        "            continue",
        "        mask = np.where(mask > 0, 255, 0).astype(np.uint8)",
        "        base = os.path.splitext(img_name)[0]",
        "        if img.shape[:2] == mask.shape[:2]:",
        "            cv2.imwrite(os.path.join(IMG_DIR, f'medbfs_{base}.png'), img)",
        "            cv2.imwrite(os.path.join(MASK_DIR, f'medbfs_{base}.png'), mask)",
        "            medbfs_count += 1",
        "print(f'MedBFS: {medbfs_count} goruntu eklendi. Toplam: {kate_count + medbfs_count}')",
    ))

    out.append(md("## 5. Karolama (Tiling)",
                   "512x512 parcalar, 256 stride, hasarsiz karolarin %95'i atilir."))
    out.append(code(
        "tile_size, tile_stride = 512, 256",
        "positive_count = negative_count = 0",
        "for img_name in tqdm(os.listdir(IMG_DIR)):",
        "    img_path = os.path.join(IMG_DIR, img_name); mask_path = os.path.join(MASK_DIR, img_name)",
        "    if not os.path.exists(mask_path):",
        "        continue",
        "    img = cv2.imread(img_path); mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)",
        "    if img is None or mask is None or img.shape[:2] != mask.shape[:2]:",
        "        continue",
        "    h, w = img.shape[:2]",
        "    for y in range(0, h - tile_size + 1, tile_stride):",
        "        for x in range(0, w - tile_size + 1, tile_stride):",
        "            img_tile = img[y:y+tile_size, x:x+tile_size]; mask_tile = mask[y:y+tile_size, x:x+tile_size]",
        "            if img_tile.shape[0] != tile_size or img_tile.shape[1] != tile_size:",
        "                continue",
        "            has_damage = np.sum(mask_tile) > 0",
        "            if not has_damage and np.random.rand() > 0.05:",
        "                continue",
        "            base = os.path.splitext(img_name)[0]",
        "            tile_name = f'{base}_y{y}_x{x}.png'",
        "            cv2.imwrite(os.path.join(TILE_IMG_DIR, tile_name), img_tile)",
        "            cv2.imwrite(os.path.join(TILE_MASK_DIR, tile_name), mask_tile)",
        "            if has_damage: positive_count += 1",
        "            else: negative_count += 1",
        "print(f'Tiling tamamlandi: {positive_count} hasarli, {negative_count} hasarsiz')",
    ))

    out.append(md("## 6. Ortak eğitim altyapısı (Dataset, kayıp, metrik, döngü)",
                   "Bütün mimariler bu hücredeki AYNI fonksiyonları kullanır."))
    out.append(code(
        "import torch",
        "from torch.utils.data import Dataset, DataLoader",
        "from sklearn.model_selection import train_test_split",
        "from sklearn.metrics import roc_auc_score",
        "import albumentations as A",
        "from albumentations.pytorch import ToTensorV2",
        "import segmentation_models_pytorch as smp",
        "import torch.optim as optim",
        "import json, time",
        "",
        "IMAGENET_MEAN = [0.485, 0.456, 0.406]; IMAGENET_STD = [0.229, 0.224, 0.225]",
        "",
        "class DepremDataset(Dataset):",
        "    def __init__(self, file_list, img_dir, mask_dir, transform=None):",
        "        self.file_list = file_list; self.img_dir = img_dir; self.mask_dir = mask_dir",
        "        self.transform = transform",
        "    def __len__(self): return len(self.file_list)",
        "    def __getitem__(self, idx):",
        "        img_name = self.file_list[idx]",
        "        image = cv2.imread(os.path.join(self.img_dir, img_name))",
        "        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)",
        "        mask = cv2.imread(os.path.join(self.mask_dir, img_name), 0)",
        "        mask = np.where(mask > 0, 1.0, 0.0).astype(np.float32)",
        "        aug = self.transform(image=image, mask=mask)",
        "        return aug['image'], aug['mask'].long()",
        "",
        "train_transform = A.Compose([",
        "    A.HorizontalFlip(p=0.5), A.VerticalFlip(p=0.5), A.RandomRotate90(p=0.5),",
        "    A.ShiftScaleRotate(shift_limit=0.05, scale_limit=0.1, rotate_limit=20, p=0.5,",
        "                       border_mode=cv2.BORDER_REFLECT_101),",
        "    A.RandomResizedCrop(size=(512, 512), scale=(0.7, 1.0), ratio=(0.9, 1.1), p=0.3),",
        "    A.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05, p=0.5),",
        "    A.CLAHE(clip_limit=4.0, tile_grid_size=(8, 8), p=0.2),",
        "    A.GaussianBlur(blur_limit=(3, 5), p=0.15), A.GaussNoise(std_range=(0.02, 0.1), p=0.15),",
        "    A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD), ToTensorV2(),",
        "])",
        "eval_transform = A.Compose([A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD), ToTensorV2()])",
        "",
        "def evaluate_seg(model, loader, device, thr=0.5):",
        "    model.eval()",
        "    tp=fp=fn=tn=0; probs_all, gt_all = [], []",
        "    with torch.no_grad():",
        "        for img, m in loader:",
        "            img = img.to(device)",
        "            p = torch.sigmoid(model(img)).cpu().numpy().ravel()",
        "            g = m.numpy().ravel().astype(int)",
        "            pred = (p >= thr).astype(int)",
        "            tp += int(((pred==1)&(g==1)).sum()); fp += int(((pred==1)&(g==0)).sum())",
        "            fn += int(((pred==0)&(g==1)).sum()); tn += int(((pred==0)&(g==0)).sum())",
        "            if len(probs_all) < 50:",
        "                probs_all.append(p[::37]); gt_all.append(g[::37])",
        "    e=1e-9",
        "    iou=tp/(tp+fp+fn+e); iou_bg=tn/(tn+fp+fn+e)",
        "    prec=tp/(tp+fp+e); rec=tp/(tp+fn+e); spec=tn/(tn+fp+e)",
        "    f1=2*prec*rec/(prec+rec+e); acc=(tp+tn)/(tp+tn+fp+fn+e)",
        "    try:",
        "        auc=float(roc_auc_score(np.concatenate(gt_all), np.concatenate(probs_all)))",
        "    except Exception:",
        "        auc=float('nan')",
        "    return {'iou_fg':iou,'iou_bg':iou_bg,'mean_iou':(iou+iou_bg)/2,'f1':f1,'precision':prec,",
        "            'recall':rec,'specificity':spec,'accuracy':acc,'auc':auc}",
        "",
        "def train_one_arch(name, model_builder, all_tiles, epochs=50, patience=8):",
        "    train_files, rest = train_test_split(all_tiles, test_size=0.30, random_state=42)",
        "    val_files, test_files = train_test_split(rest, test_size=0.5, random_state=42)",
        "    print(f'[{name}] train={len(train_files)} val={len(val_files)} test={len(test_files)}')",
        "",
        "    train_ds = DepremDataset(train_files, TILE_IMG_DIR, TILE_MASK_DIR, train_transform)",
        "    val_ds = DepremDataset(val_files, TILE_IMG_DIR, TILE_MASK_DIR, eval_transform)",
        "    test_ds = DepremDataset(test_files, TILE_IMG_DIR, TILE_MASK_DIR, eval_transform)",
        "    train_loader = DataLoader(train_ds, batch_size=8, shuffle=True, num_workers=2, pin_memory=True)",
        "    val_loader = DataLoader(val_ds, batch_size=8, shuffle=False, num_workers=2, pin_memory=True)",
        "    test_loader = DataLoader(test_ds, batch_size=8, shuffle=False, num_workers=2, pin_memory=True)",
        "",
        "    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')",
        "    model = model_builder().to(device)",
        "    params_m = sum(p.numel() for p in model.parameters()) / 1e6",
        "",
        "    dice_loss_fn = smp.losses.DiceLoss(mode='binary')",
        "    focal_loss_fn = smp.losses.FocalLoss(mode='binary', alpha=0.25, gamma=2.0)",
        "    def combined_loss(pred, target): return 0.5*dice_loss_fn(pred, target) + 0.5*focal_loss_fn(pred, target)",
        "",
        "    optimizer = optim.AdamW(model.parameters(), lr=2e-4, weight_decay=1e-2)",
        "    scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=5, T_mult=2, eta_min=1e-6)",
        "",
        "    best_val_iou = 0.0; epochs_no_improve = 0; history = []",
        "    save_path = f'{RESULTS_DIR}{name}_best.pth'",
        "    t0 = time.time()",
        "    for epoch in range(epochs):",
        "        model.train(); train_loss = 0",
        "        for images, masks in train_loader:",
        "            images = images.to(device); masks = masks.to(device).unsqueeze(1).float()",
        "            optimizer.zero_grad()",
        "            outputs = model(images); loss = combined_loss(outputs, masks)",
        "            loss.backward()",
        "            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)",
        "            optimizer.step(); train_loss += loss.item()",
        "        scheduler.step()",
        "        val_metrics = evaluate_seg(model, val_loader, device)",
        "        avg_train_loss = train_loss / len(train_loader)",
        "        history.append({'epoch': epoch+1, 'train_loss': avg_train_loss, 'val_mean_iou': val_metrics['mean_iou'],",
        "                        'val_f1': val_metrics['f1']})",
        "        print(f'[{name}] epoch {epoch+1}/{epochs} loss={avg_train_loss:.4f} valIoU={val_metrics[\"mean_iou\"]:.4f}')",
        "        if val_metrics['mean_iou'] > best_val_iou:",
        "            best_val_iou = val_metrics['mean_iou']; epochs_no_improve = 0",
        "            torch.save(model.state_dict(), save_path)",
        "        else:",
        "            epochs_no_improve += 1",
        "            if epochs_no_improve >= patience:",
        "                print(f'[{name}] Erken durdurma (epoch {epoch+1})'); break",
        "    train_s = time.time() - t0",
        "",
        "    model.load_state_dict(torch.load(save_path))",
        "    test_metrics = evaluate_seg(model, test_loader, device)",
        "    print(f'[{name}] TEST mIoU={test_metrics[\"mean_iou\"]:.4f} F1={test_metrics[\"f1\"]:.4f}')",
        "",
        "    result = {'model': name, **test_metrics, 'params_m': params_m, 'train_seconds': round(train_s,1),",
        "              'n_epochs_run': len(history), 'history': history}",
        "    json.dump(result, open(f'{RESULTS_DIR}{name}.json', 'w'), indent=2)",
        "",
        "    fig, ax = plt.subplots(1, 2, figsize=(11,4))",
        "    ep = [h['epoch'] for h in history]",
        "    ax[0].plot(ep, [h['train_loss'] for h in history]); ax[0].set_title(f'{name} - egitim kaybi'); ax[0].set_xlabel('epoch')",
        "    ax[1].plot(ep, [h['val_mean_iou'] for h in history], label='val mIoU')",
        "    ax[1].plot(ep, [h['val_f1'] for h in history], label='val F1')",
        "    ax[1].set_title(f'{name} - dogrulama'); ax[1].set_xlabel('epoch'); ax[1].legend()",
        "    plt.tight_layout(); plt.savefig(f'{RESULTS_DIR}{name}_curve.png', dpi=150); plt.show()",
        "    return result",
    ))

    out.append(md("## 7. Beş mimariyi sırayla eğit",
                   "U-Net, LinkNet, FPN, PSPNet (ResNet18) + DeepLabV3+ (ResNet101)."))
    out.append(code(
        "import matplotlib.pyplot as plt",
        "all_tiles = sorted(os.listdir(TILE_IMG_DIR))",
        "print(f'Toplam tile: {len(all_tiles)}')",
        "",
        "ARCHS = {",
        "    'unet_resnet18':   lambda: smp.Unet(encoder_name='resnet18', encoder_weights='imagenet', in_channels=3, classes=1),",
        "    'linknet_resnet18':lambda: smp.Linknet(encoder_name='resnet18', encoder_weights='imagenet', in_channels=3, classes=1),",
        "    'fpn_resnet18':    lambda: smp.FPN(encoder_name='resnet18', encoder_weights='imagenet', in_channels=3, classes=1),",
        "    'pspnet_resnet18': lambda: smp.PSPNet(encoder_name='resnet18', encoder_weights='imagenet', in_channels=3, classes=1),",
        "    'deeplabv3plus_resnet101': lambda: smp.DeepLabV3Plus(encoder_name='resnet101', encoder_weights='imagenet', in_channels=3, classes=1),",
        "}",
        "",
        "all_results = {}",
        "for name, builder in ARCHS.items():",
        "    print(f\"\\n{'='*70}\\n{name}\\n{'='*70}\")",
        "    all_results[name] = train_one_arch(name, builder, all_tiles)",
    ))

    out.append(md("## 8. Karşılaştırma tablosu + grafik",
                   "SegFormer referans satırı (ayrı çalıştırılan `optimized_training_colab.ipynb` sonucu) elle eklenir."))
    out.append(code(
        "import pandas as pd",
        "",
        "# NOT (D-02 duzeltmesi): SegFormer referans degeri (0.4276) dogrulama kumesinde",
        "# hesaplanmis HASAR SINIFI IoU'sudur (iou_fg), arka plan+hasar ortalamasi (mean_iou)",
        "# DEGILDIR. Bes mimari icin de iou_fg ayrica raporlanir ki karsilastirma elma-armut",
        "# olmasin (bkz. makale D-02/A-15).",
        "REFERENCE_SEGFORMER = {'model': 'segformer_mitb4 (REFERANS)', 'mean_iou': None, 'iou_fg': 0.4276,",
        "                       'f1': None, 'precision': None, 'recall': None, 'params_m': None,",
        "                       'train_seconds': None,",
        "                       'note': 'optimized_training_colab.ipynb sonucu (ayri calistirildi, dogrulama kumesi, iou_fg)'}",
        "",
        "rows = [REFERENCE_SEGFORMER] + [",
        "    {'model': n, 'mean_iou': r['mean_iou'], 'iou_fg': r['iou_fg'], 'f1': r['f1'],",
        "     'precision': r['precision'], 'recall': r['recall'], 'params_m': r['params_m'],",
        "     'train_seconds': r['train_seconds']}",
        "    for n, r in all_results.items()]",
        "tbl = pd.DataFrame(rows).sort_values('iou_fg', ascending=False)",
        "tbl.to_csv(f'{RESULTS_DIR}00_comparison_table.csv', index=False)",
        "display(tbl.round(4))",
        "",
        "fig, ax = plt.subplots(figsize=(8,5))",
        "t = tbl.dropna(subset=['iou_fg'])",
        "ax.barh(t['model'], t['iou_fg'], color='#4C72B0')",
        "ax.set_xlabel('IoU_hasar (iou_fg)'); ax.set_title('01 Yol Hasari - Mimari Karsilastirmasi (hasar sinifi IoU)'); ax.set_xlim(0,1)",
        "plt.tight_layout(); plt.savefig(f'{RESULTS_DIR}00_comparison_chart.png', dpi=160); plt.show()",
    ))

    out.append(md("## 9. Sonuçları indir",
                   "`results/` klasörünü zip'leyip indirir - JSON'lar, eğrigrafikleri, karşılaştırma tablosu/grafiği."))
    out.append(code(
        "import shutil",
        "shutil.make_archive('01_yol_hasari_sonuclar', 'zip', RESULTS_DIR)",
        "from google.colab import files",
        "files.download('01_yol_hasari_sonuclar.zip')",
    ))

    return out


def main():
    write_notebook(HERE / "00_tum_mimariler.ipynb", cells())


if __name__ == "__main__":
    main()
