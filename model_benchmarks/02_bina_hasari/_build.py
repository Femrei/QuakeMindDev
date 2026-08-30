"""ALAN 02 - Uydudan bina hasari segmentasyonu kiyaslama defterleri.

    python _build.py

Yol moduluyle AYNI mimari ailesi -> tek egitim protokolu yeter.
Veri: Roboflow Universe (PNG semantic mask) veya local. xBD / BRIGHT / TUE-CD /
Copernicus EMSR648 setlerini Roboflow'a yukleyip link'i seg_common.CONFIG'e gir.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _nbtools import md, code, write_notebook, colab_cell  # noqa: E402
SUB = "model_benchmarks/02_bina_hasari"

HERE = Path(__file__).resolve().parent
DOMAIN = "Uydudan bina hasari segmentasyonu"

SETUP_DATA = code(
    "import sys; from pathlib import Path; sys.path.insert(0, str(Path.cwd()))",
    "import seg_common as SC",
    "SC.CONFIG.update(dict(",
    "    source='roboflow',",
    "    roboflow_api_key='BURAYA_ROBOFLOW_API_KEY',",
    "    roboflow_workspace='workspace-slug',",
    "    roboflow_project='project-slug',",
    "    roboflow_version=1,",
    "    num_classes=1,   # xBD 4 hasar sinifi kullanilacaksa 4",
    "))",
    "paths = SC.prepare_dataset(); dl = SC.build_loaders(paths)",
    "print({k: len(v.dataset) for k, v in dl.items()})",
)


def smp_nb(name, title, arch, encoder, tier, why):
    return [
        md(f"# {title} - {DOMAIN}", "",
           f"**Katman:** {tier}  |  `{encoder}` / `{arch}`", "", why, "",
           "Yol modulu (`01_yol_hasari`) ile birebir ayni protokol -> M2 ile karsilastirilabilir.  ",
           "Metrik: IoU/mIoU, F1, Kesinlik, Duyarlilik, Ozgulluk, Dogruluk, AUC + Params/GFLOPs/cikarim."),
        colab_cell(SUB, "segmentation-models-pytorch albumentations roboflow thop opencv-python-headless"),
        md("## 1. Veri"), SETUP_DATA,
        md("## 2. Model"),
        code(
            f'MODEL_NAME = "{name}"',
            f'ARCH, ENCODER = "{arch}", "{encoder}"',
            "PARAMS = dict(arch=ARCH, encoder=ENCODER, **{k: SC.CONFIG[k] for k in ['img_size','batch_size','epochs','lr']})",
            "model = SC.build_model(ARCH, ENCODER, SC.CONFIG['num_classes'])",
        ),
        md("## 3. Egitim"),
        code("model = SC.train_model(model, dl, SC.CONFIG)"),
        md("## 4. Test + verimlilik"),
        code(
            "import torch; dev = 'cuda' if torch.cuda.is_available() else 'cpu'",
            "split = 'test' if 'test' in dl else 'valid'",
            "metrics = SC.evaluate_seg(model, dl[split], dev)",
            "eff = SC.efficiency_stats(model, SC.CONFIG['img_size'], 'cpu')",
            "for k, v in metrics.items(): print(f'{k:12s}: {v:.4f}')",
            "print(eff)",
        ),
        md("## 5. Kaydet"),
        code("lb = SC.save_result(MODEL_NAME, metrics, eff, extra={'params': PARAMS}); lb"),
    ]


def mask2former_nb():
    return [
        md(f"# Mask2Former (Swin-S) - {DOMAIN}", "",
           "**Katman:** Guclendirici", "",
           "M1'de SegFormer'i geciyor (mIoU %76,1 vs %74,4). smp'de yok - HF transformers ile.  ",
           "Ayni veri, ayni metrik fonksiyonu (`seg_common.evaluate_seg` uyumlu cikti)."),
        colab_cell(SUB, "transformers roboflow albumentations opencv-python-headless"),
        md("## 1. Veri"), SETUP_DATA,
        md("## 2. Model"),
        code(
            'MODEL_NAME = "mask2former_swin_s"',
            'HF_CKPT = "facebook/mask2former-swin-small-ade-semantic"',
            "PARAMS = dict(ckpt=HF_CKPT, epochs=SC.CONFIG['epochs'], lr=1e-5)",
            "import torch",
            "from transformers import Mask2FormerForUniversalSegmentation, Mask2FormerImageProcessor",
            "proc = Mask2FormerImageProcessor(reduce_labels=False, ignore_index=255,",
            "                                 do_resize=True, size={'height': SC.CONFIG['img_size'], 'width': SC.CONFIG['img_size']})",
            "model = Mask2FormerForUniversalSegmentation.from_pretrained(",
            "    HF_CKPT, num_labels=2, ignore_mismatched_sizes=True)",
        ),
        md("## 3. Egitim dongusu (basit)"),
        code(
            "dev = 'cuda' if torch.cuda.is_available() else 'cpu'; model.to(dev)",
            "opt = torch.optim.AdamW(model.parameters(), lr=PARAMS['lr'])",
            "for ep in range(PARAMS['epochs']):",
            "    model.train(); tot = 0",
            "    for img, m in dl['train']:",
            "        # img: (B,3,H,W) 0..1 normalize edilmis;  m: (B,1,H,W) 0/1",
            "        inp = proc(images=list((img*255).byte().permute(0,2,3,1).numpy()),",
            "                   segmentation_maps=list(m.squeeze(1).long().numpy()), return_tensors='pt')",
            "        inp = {k: v.to(dev) for k, v in inp.items()}",
            "        out = model(**inp); out.loss.backward(); opt.step(); opt.zero_grad(); tot += out.loss.item()",
            "    print(f'epoch {ep+1} loss {tot/len(dl[\"train\"]):.4f}')",
        ),
        md("## 4. Test (seg maskesine cevir) + metrik"),
        code(
            "import numpy as np",
            "def m2f_prob(model, loader):",
            "    class Wrap:  # evaluate_seg imzasina uydur: sigmoid(logits) bekliyor",
            "        pass",
            "    tp=fp=fn=tn=0",
            "    model.eval()",
            "    with torch.no_grad():",
            "        for img, m in loader:",
            "            inp = proc(images=list((img*255).byte().permute(0,2,3,1).numpy()), return_tensors='pt')",
            "            inp = {k: v.to(dev) for k, v in inp.items()}",
            "            seg = proc.post_process_semantic_segmentation(model(**inp),",
            "                     target_sizes=[img.shape[-2:]]*img.shape[0])",
            "            for s, gt in zip(seg, m):",
            "                pred = (s.cpu().numpy() == 1).astype(int).ravel()",
            "                g = gt.numpy().astype(int).ravel()",
            "                tp += int(((pred==1)&(g==1)).sum()); fp += int(((pred==1)&(g==0)).sum())",
            "                fn += int(((pred==0)&(g==1)).sum()); tn += int(((pred==0)&(g==0)).sum())",
            "    e=1e-9; iou=tp/(tp+fp+fn+e); iou_bg=tn/(tn+fp+fn+e)",
            "    prec=tp/(tp+fp+e); rec=tp/(tp+fn+e); spec=tn/(tn+fp+e)",
            "    f1=2*prec*rec/(prec+rec+e)",
            "    return {'iou_fg':iou,'iou_bg':iou_bg,'mean_iou':(iou+iou_bg)/2,'f1':f1,'precision':prec,",
            "            'recall':rec,'specificity':spec,'accuracy':(tp+tn)/(tp+tn+fp+fn+e),'auc':float('nan')}",
            "split = 'test' if 'test' in dl else 'valid'",
            "metrics = m2f_prob(model, dl[split])",
            "eff = {'params_m': sum(p.numel() for p in model.parameters())/1e6, 'gflops': float('nan')}",
            "lb = SC.save_result(MODEL_NAME, metrics, eff, extra={'params': PARAMS}); print(metrics); lb",
        ),
    ]


NB = {
    "01_unet_resnet18": smp_nb("unet_resnet18", "U-Net", "Unet", "resnet18", "Zorunlu",
                               "M2 ile birebir karsilastirilabilir kurulum."),
    "02_linknet_resnet18": smp_nb("linknet_resnet18", "LinkNet", "Linknet", "resnet18", "Zorunlu",
                                  "Artik bloklu U-Net varyanti."),
    "03_fpn_resnet18": smp_nb("fpn_resnet18", "FPN", "FPN", "resnet18", "Zorunlu",
                              "Ozellik piramidi; M2'de yuksek dogruluk/ozgulluk."),
    "04_pspnet_resnet18": smp_nb("pspnet_resnet18", "PSPNet", "PSPNet", "resnet18", "Zorunlu",
                                 "Piramit havuzlama; alt sinir referansi."),
    "05_segformer_mitb4": smp_nb("segformer_mitb4", "SegFormer (MiT-B4)", "Segformer", "mit_b4", "Referans",
                                 "**Mevcut mimarimiz - yol modulunden aktarim.**"),
    "06_deeplabv3plus_resnet101": smp_nb("deeplabv3plus_resnet101", "DeepLabV3+", "DeepLabV3Plus", "resnet101", "Zorunlu",
                                         "M1 ile karsilastirilabilirlik (atrous evrisim)."),
}


def leaderboard_nb():
    return [
        md(f"# 02 {DOMAIN} - Ozet Tablo"),
        code(
            "import json, pandas as pd; from pathlib import Path",
            "rows = [json.load(open(f)) for f in sorted(Path('results').glob('*.json'))]",
            "cols = ['model','mean_iou','iou_fg','f1','precision','recall','specificity','accuracy','auc','params_m','gflops']",
            "tbl = pd.DataFrame([{k: r.get(k) for k in cols} for r in rows]).sort_values('mean_iou', ascending=False)",
            "display(tbl.round(4)); print(tbl.round(4).to_latex(index=False))",
        ),
    ]


def main():
    (HERE / "data").mkdir(exist_ok=True)
    for n, cells in NB.items():
        write_notebook(HERE / f"{n}.ipynb", cells)
    write_notebook(HERE / "07_mask2former_swin_s.ipynb", mask2former_nb())
    write_notebook(HERE / "00_leaderboard.ipynb", leaderboard_nb())


if __name__ == "__main__":
    main()
