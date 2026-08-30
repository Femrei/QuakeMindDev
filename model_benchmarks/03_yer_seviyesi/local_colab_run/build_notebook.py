"""03_yer_seviyesi - Colab'da tek oturumda calisacak, hem catlak hem bina hasari
tespiti veri setlerinde birden fazla YOLO mimarisini kiyaslayan defter.

Veri: Roboflow Universe (kullanicinin kendi projeleri):
  - catlak: akash-roy-edivz/building-crack-detection-ys4zf (v3)
  - bina:   ofgg/maras-tpx5p (v4)

Her veri seti icin AYNI protokolle (epochs=60, img=640, batch=16, conf=0.20 -
production esigimiz) su mimariler egitilir:
  - yolov8s   (referans - production ailesi)
  - yolov8n/m/l (olcek ablasyonu - mobil/uc cihaz argumani)
  - yolo11s   (guncel surum karsilastirmasi)

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

ARCHS = ["yolov8n", "yolov8s", "yolov8m", "yolov8l", "yolo11s"]
REFERANS = "yolov8s"


def cells():
    out = []
    out.append(md(
        "# 03 Yer Seviyesi - Çatlak + Bina Hasarı Tespiti (Tek Oturum, Çoklu Mimari)",
        "",
        "**Veri:** kullanıcının kendi Roboflow projeleri — "
        "`akash-roy-edivz/building-crack-detection-ys4zf` (çatlak) ve "
        "`ofgg/maras-tpx5p` (bina hasarı).  ",
        "**Bizim yöntem (production):** 2× YOLOv8 (catlak.pt + bina.pt), güven eşiği 0,20.  ",
        "**Mimariler (her veri seti için AYNI protokolle):** YOLOv8n/s/m/l (ölçek ablasyonu, "
        "s=referans) + YOLOv11s (güncel sürüm karşılaştırması).  ",
        "**Metrik:** mAP@50, mAP@50-95, Kesinlik, Duyarlılık, F1, sınıf bazlı AP, "
        "FPS, Params(M), GFLOPs.",
        "",
        "**ÖNEMLİ:** Üst menüden `Çalışma Zamanı` → `Çalışma zamanı türünü değiştir` → **T4 GPU** seçin.",
    ))

    out.append(md("## 1. Kütüphaneler"))
    out.append(code("!pip install -q ultralytics roboflow"))

    out.append(md("## 2. Veri setlerini indir (Roboflow)"))
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
        "DATA_YAML = {}",
        "for key, d in DATASETS.items():",
        "    print(f'--- {d[\"title\"]} indiriliyor ---')",
        "    rf = Roboflow(api_key=d['api_key'])",
        "    proj = rf.workspace(d['workspace']).project(d['project'])",
        "    ds = proj.version(d['version']).download('yolov8')",
        "    DATA_YAML[key] = f'{ds.location}/data.yaml'",
        "    print(key, '->', DATA_YAML[key])",
    ]
    out.append(code(*ds_lines))

    out.append(md("## 3. Ortak eğitim + değerlendirme fonksiyonu",
                   "Bütün mimariler ve her iki veri seti bu AYNI fonksiyonu kullanır."))
    out.append(code(
        "import json, time",
        "import torch",
        "from ultralytics import YOLO",
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
        "    model = YOLO(weights)",
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

    out.append(md("## 4. Bütün veri setleri × mimariler için eğit"))
    weight_map = ", ".join(f"'{a}': '{a}.pt'" for a in ARCHS)
    out.append(code(
        "ARCH_WEIGHTS = {" + weight_map + "}",
        "",
        "all_results = {}",
        "for dataset_key in DATASETS:",
        "    for arch_name, weights in ARCH_WEIGHTS.items():",
        "        key = f'{dataset_key}_{arch_name}'",
        "        print(f\"\\n{'='*70}\\n{key}\\n{'='*70}\")",
        "        try:",
        "            all_results[key] = train_eval(dataset_key, arch_name, weights)",
        "        except Exception as e:",
        "            print(f'HATA [{key}]: {e}')",
    ))

    out.append(md("## 5. Karşılaştırma tabloları + grafikler (veri seti başına)"))
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

    out.append(md("## 6. Sonuçları indir"))
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
