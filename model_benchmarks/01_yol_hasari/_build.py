"""ALAN 01 - Uydudan yol hasari segmentasyonu kiyaslama defterleri.

    python _build.py

Veri: Roboflow Universe (PNG semantic mask). Anahtar/slug -> seg_common.CONFIG
veya her defterin 'AYAR' hucresi. Butun mimariler AYNI protokol + AYNI metrik.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _nbtools import md, code, write_notebook, colab_cell  # noqa: E402

HERE = Path(__file__).resolve().parent
DOMAIN = "Uydudan yol hasari segmentasyonu"
SUB = "model_benchmarks/01_yol_hasari"
PIP = "segmentation-models-pytorch albumentations roboflow thop opencv-python-headless"


def seg_nb(name, title, arch, encoder, tier, why, extra_setup=None):
    cells = [
        md(f"# {title} - {DOMAIN}", "",
           f"**Katman:** {tier}  |  **Kodlayici:** `{encoder}`  |  **Kod cozucu:** `{arch}`", "",
           f"{why}", "",
           "Bizim yontem: **SegFormer (MiT-B4)**, focal+dice, ortusmeli karolama + morfolojik son-islem.  ",
           "Butun mimariler `seg_common.py` uzerinden AYNI veri / AYNI kayip / AYNI metrik.  ",
           "Metrik: IoU/mIoU, F1, Kesinlik, Duyarlilik, Ozgulluk, Dogruluk, AUC + Params(M)/GFLOPs/cikarim(ms).  ",
           "> M2'nin dersi: bu gorevde dogruluk tek basina aldaticidir; IoU ile birlikte verilir."),
        colab_cell(SUB, PIP),
        md("## 1. Veri seti (Roboflow Universe)"),
        code(
            "import sys; from pathlib import Path; sys.path.insert(0, str(Path.cwd()))",
            "import seg_common as SC",
            "",
            "# === AYAR: kendi Roboflow bilgilerini gir (ya da seg_common.py > CONFIG) ===",
            "SC.CONFIG.update(dict(",
            "    source='roboflow',",
            "    roboflow_api_key='BURAYA_ROBOFLOW_API_KEY',",
            "    roboflow_workspace='workspace-slug',",
            "    roboflow_project='project-slug',",
            "    roboflow_version=1,",
            "))",
            "paths = SC.prepare_dataset()",
            "dl = SC.build_loaders(paths)",
            "print({k: len(v.dataset) for k, v in dl.items()})",
        ),
        md("## 2. Model"),
        code(
            f'MODEL_NAME = "{name}"',
            f'ARCH, ENCODER = "{arch}", "{encoder}"',
            "PARAMS = dict(arch=ARCH, encoder=ENCODER, **{k: SC.CONFIG[k] for k in ['img_size','batch_size','epochs','lr']})",
            *(extra_setup or []),
            "model = SC.build_model(ARCH, ENCODER, num_classes=SC.CONFIG['num_classes'])",
        ),
        md("## 3. Egitim (focal + dice, cosine LR)"),
        code("model = SC.train_model(model, dl, SC.CONFIG)"),
        md("## 4. Test metrikleri + verimlilik"),
        code(
            "import torch",
            "dev = 'cuda' if torch.cuda.is_available() else 'cpu'",
            "test_split = 'test' if 'test' in dl else 'valid'",
            "metrics = SC.evaluate_seg(model, dl[test_split], dev)",
            "for k, v in metrics.items(): print(f'{k:12s}: {v:.4f}')",
            "",
            "eff = SC.efficiency_stats(model, SC.CONFIG['img_size'], device='cpu')",
            "if dev == 'cuda': eff.update(SC.efficiency_stats(model, SC.CONFIG['img_size'], device='cuda'))",
            "print(eff)",
        ),
        md("## 5. Kaydet"),
        code(
            "lb = SC.save_result(MODEL_NAME, metrics, eff, extra={'params': PARAMS})",
            "lb[['model','mean_iou','f1','precision','recall','accuracy','params_m']]",
        ),
    ]
    return cells


NB = {
    "01_unet_resnet18": seg_nb(
        "unet_resnet18", "U-Net", "Unet", "resnet18", "Zorunlu",
        "Alanin taban cizgisi; M2'de en yuksek IoU (0,394) ve duyarlilik."),
    "02_linknet_resnet18": seg_nb(
        "linknet_resnet18", "LinkNet", "Linknet", "resnet18", "Zorunlu",
        "U-Net'in artik bloklu varyanti - kodlayici etkisini izole eder."),
    "03_fpn_resnet18": seg_nb(
        "fpn_resnet18", "FPN", "FPN", "resnet18", "Zorunlu",
        "M2'de en yuksek dogruluk (0,973) ve ozgulluk (0,995)."),
    "04_pspnet_resnet18": seg_nb(
        "pspnet_resnet18", "PSPNet", "PSPNet", "resnet18", "Zorunlu",
        "Piramit havuzlama; M2'de en zayif - alt sinir referansi."),
    "05_deeplabv3plus_resnet101": seg_nb(
        "deeplabv3plus_resnet101", "DeepLabV3+", "DeepLabV3Plus", "resnet101", "Zorunlu",
        "M1'in taban cizgisi (mIoU %67,1); atrous evrisim ailesi."),
    "06_segformer_mitb4": seg_nb(
        "segformer_mitb4", "SegFormer (MiT-B4)", "Segformer", "mit_b4", "Referans",
        "**Mevcut modelimiz - referans satiri.**"),
}


def scale_nb():
    return [
        md("# SegFormer B0/B2/B5 - Olcek ablasyonu", "",
           "**Katman:** Guclendirici", "",
           "Olcek-performans egrisi: uc cihaz argumani icin Params/GFLOPs ekseni. "
           "Ayni protokolde uc kodlayici boyutu."),
        colab_cell(SUB, PIP),
        code(
            "import sys; from pathlib import Path; sys.path.insert(0, str(Path.cwd()))",
            "import seg_common as SC, torch",
            "SC.CONFIG.update(dict(roboflow_api_key='BURAYA', roboflow_workspace='w', roboflow_project='p', roboflow_version=1))",
            "paths = SC.prepare_dataset(); dl = SC.build_loaders(paths)",
            "dev = 'cuda' if torch.cuda.is_available() else 'cpu'",
            "for enc in ['mit_b0', 'mit_b2', 'mit_b5']:",
            "    name = f'segformer_{enc}'",
            "    m = SC.build_model('Segformer', enc, SC.CONFIG['num_classes'])",
            "    m = SC.train_model(m, dl, SC.CONFIG)",
            "    split = 'test' if 'test' in dl else 'valid'",
            "    met = SC.evaluate_seg(m, dl[split], dev)",
            "    eff = SC.efficiency_stats(m, SC.CONFIG['img_size'], 'cpu')",
            "    SC.save_result(name, met, eff, extra={'encoder': enc})",
            "    print(enc, met['mean_iou'], eff)",
        ),
    ]


def leaderboard_nb():
    return [
        md(f"# 01 {DOMAIN} - Ozet Tablo", "",
           "Butun `NN_*.ipynb` defterleri calistiktan sonra."),
        code(
            "import json, pandas as pd, matplotlib.pyplot as plt; from pathlib import Path",
            "rows = [json.load(open(f)) for f in sorted(Path('results').glob('*.json'))]",
            "cols = ['model','mean_iou','iou_fg','f1','precision','recall','specificity','accuracy','auc','params_m','gflops']",
            "tbl = pd.DataFrame([{k: r.get(k) for k in cols} for r in rows]).sort_values('mean_iou', ascending=False)",
            "display(tbl.round(4)); print(tbl.round(4).to_latex(index=False))",
        ),
        code(
            "fig, ax = plt.subplots(figsize=(7, 4))",
            "t = tbl.dropna(subset=['params_m'])",
            "ax.scatter(t['params_m'], t['mean_iou'])",
            "for _, r in t.iterrows(): ax.annotate(r['model'], (r['params_m'], r['mean_iou']), fontsize=8)",
            "ax.set_xlabel('Params (M)'); ax.set_ylabel('mIoU'); ax.set_title('Olcek - performans')",
            "plt.tight_layout(); plt.savefig('results/scale_vs_miou.png', dpi=150); plt.show()",
        ),
    ]


def main():
    (HERE / "data").mkdir(exist_ok=True)
    for n, cells in NB.items():
        write_notebook(HERE / f"{n}.ipynb", cells)
    write_notebook(HERE / "07_segformer_scale.ipynb", scale_nb())
    write_notebook(HERE / "00_leaderboard.ipynb", leaderboard_nb())


if __name__ == "__main__":
    main()
