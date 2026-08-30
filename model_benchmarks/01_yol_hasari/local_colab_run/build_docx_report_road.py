"""01 Yol Hasari Segmentasyonu - makale formatinda detayli Word raporu uretir.

    python build_docx_report_road.py

Girdi: results/*.json + results/*curve.png + results/00_comparison_*
Cikti: results/01_Yol_Hasari_Rapor.docx
"""
import json
from pathlib import Path

import pandas as pd
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt
from docx.oxml.ns import qn

HERE = Path(__file__).resolve().parent
RESULTS = HERE / "results"

ORDER = ["linknet_resnet18", "unet_resnet18", "fpn_resnet18",
         "deeplabv3plus_resnet101", "pspnet_resnet18"]

DISPLAY_NAMES = {
    "unet_resnet18": "U-Net (ResNet18)",
    "linknet_resnet18": "LinkNet (ResNet18)",
    "fpn_resnet18": "FPN (ResNet18)",
    "pspnet_resnet18": "PSPNet (ResNet18)",
    "deeplabv3plus_resnet101": "DeepLabV3+ (ResNet101)",
}

REFERENCE_FG_IOU = 0.4276  # optimized_training_colab.ipynb - SegFormer MiT-B4, foreground IoU


def load_results():
    out = {}
    for n in ORDER:
        p = RESULTS / f"{n}.json"
        if p.exists():
            out[n] = json.load(open(p, encoding="utf-8"))
    return out


def set_cell_shading(cell, color_hex):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.makeelement(qn("w:shd"), {qn("w:val"): "clear", qn("w:color"): "auto", qn("w:fill"): color_hex})
    tc_pr.append(shd)


def add_table(doc, headers, rows, col_widths_cm=None, header_color="4472C4"):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Light Grid Accent 1"
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = str(h)
        for p in hdr[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.bold = True
        set_cell_shading(hdr[i], header_color)
    for row in rows:
        cells = table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = str(val)
            for p in cells[i].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if col_widths_cm:
        for i, w in enumerate(col_widths_cm):
            for row in table.rows:
                row.cells[i].width = Cm(w)
    return table


def add_figure(doc, img_path, caption, width_cm=15):
    if not img_path.exists():
        return
    doc.add_picture(str(img_path), width=Cm(width_cm))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    p = doc.add_paragraph(caption)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.runs[0].italic = True
    p.runs[0].font.size = Pt(9)


def fmt(x, nd=4):
    try:
        return f"{float(x):.{nd}f}"
    except (TypeError, ValueError):
        return str(x)


def main():
    results = load_results()

    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    title = doc.add_heading(
        "Uydu Görüntülerinden Yol Hasarı Segmentasyonunda Mimari Karşılaştırması",
        level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub = doc.add_paragraph("QuakeMind Projesi — Colab (T4 GPU) Deneysel Çalışma Raporu")
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.runs[0].italic = True

    # ---- Ozet ----
    doc.add_heading("Özet", level=1)
    doc.add_paragraph(
        "Bu çalışmada, deprem sonrası uydu görüntülerinden ikili yol hasarı segmentasyonu görevinde "
        "beş mimari — U-Net, LinkNet, FPN, PSPNet (hepsi ResNet18 kodlayıcı) ve DeepLabV3+ "
        "(ResNet101 kodlayıcı) — AYNI veri (KATE-CD + MedBFS birleşimi), AYNI kayıp fonksiyonu "
        "(focal+dice), AYNI optimizasyon (AdamW + CosineAnnealingWarmRestarts) ve AYNI erken "
        "durdurma protokolüyle Google Colab T4 GPU üzerinde eğitilmiştir. Referans model "
        "(SegFormer MiT-B4) ayrı bir oturumda (`optimized_training_colab.ipynb`) aynı veriyle "
        "eğitilmiş ve %ön-plan IoU = 0,4276 elde etmiştir. **Sonuçlar, referans SegFormer "
        "modelinin, karşılaştırılan beş CNN tabanlı mimarinin TÜMÜNDEN daha yüksek ön-plan IoU "
        "değeri verdiğini göstermektedir** — en iyi CNN mimarisi LinkNet bile %0,370 ile "
        "SegFormer'in gerisinde kalmıştır. Bu, transformer tabanlı kodlayıcıların (MiT-B4) bu "
        "veri setinde ince/düzensiz hasar bölgelerini yakalamada ResNet tabanlı kodlayıcılara "
        "göre üstün olduğuna işaret etmektedir."
    )

    # ---- 1. Giris ----
    doc.add_heading("1. Giriş ve Görev Tanımı", level=1)
    doc.add_paragraph(
        "Görev, uydu/hava görüntülerinde yol hasarı bölgelerinin piksel düzeyinde ikili "
        "segmentasyonudur (hasar var / yok). Bütün mimariler `segmentation_models_pytorch` "
        "kütüphanesi üzerinden AYNI ImageNet önceden eğitimli kodlayıcı ailesiyle (ResNet18, "
        "DeepLabV3+ için ResNet101) kurulmuştur; yalnızca kod çözücü (decoder) mimarisi "
        "değişmektedir — bu, kıyaslamanın adil olmasını sağlar."
    )

    doc.add_heading("1.1 Veri", level=2)
    doc.add_paragraph(
        "İki açık kaynak veri seti birleştirilmiştir: **KATE-CD** (Hugging Face `CSCRS/kate-cd`, "
        "404 görüntü-maske çifti) ve **MedBFS** (Zenodo, Türkiye 2023 depremi sonrası görüntüler). "
        "Görüntüler 512×512 boyutunda, 256 piksel kayma (stride) ile örtüşmeli karolara "
        "(tile) bölünmüş; sınıf dengesizliğini azaltmak için hasarsız (negatif) karoların "
        "%95'i rastgele atılmıştır. Veri, her mimari için ayrı ayrı %70/%15/%15 oranında "
        "train/val/test olarak bölünmüştür (sabit seed=42); nihai metrikler HİÇBİR modelin "
        "eğitim sırasında görmediği test kümesinde raporlanmıştır."
    )

    doc.add_heading("1.2 Eğitim Protokolü", level=2)
    doc.add_paragraph(
        "Kayıp fonksiyonu: %50 Dice + %50 Focal (α=0,25, γ=2,0). Optimizasyon: AdamW "
        "(lr=2e-4, weight_decay=1e-2) + CosineAnnealingWarmRestarts (T₀=5, T_mult=2). "
        "Veri artırma: yatay/dikey çevirme, döndürme, kayma-ölçekleme-döndürme, renk sıçraması, "
        "CLAHE, Gauss bulanıklığı/gürültüsü. Maksimum 50 epoch, doğrulama mIoU'sunda 8 epoch "
        "iyileşme olmazsa erken durdurma. Bu protokol, referans SegFormer modeliyle "
        "(`optimized_training_colab.ipynb`) BİREBİR aynıdır."
    )

    # ---- 2. Metrik notu (kritik) ----
    doc.add_heading("2. Metrik Tanımları — Önemli Not", level=1)
    doc.add_paragraph(
        "Bu görevde İKİ farklı IoU değeri raporlanmaktadır ve bunların karıştırılması yanıltıcı "
        "sonuçlara yol açabilir:"
    )
    doc.add_paragraph(
        "• **mIoU (ortalama IoU)** = (ön-plan IoU + arka-plan IoU) / 2. Hasar pikselleri "
        "görüntünün küçük bir kısmını kapladığından arka-plan IoU'su neredeyse her zaman "
        "%95'in üzerindedir; bu da mIoU'yu yapay olarak yükseltir (bu çalışmada tüm CNN "
        "mimarileri için mIoU ≈ %66-68).\n"
        "• **Ön-plan IoU (iou_fg)** = sadece hasar sınıfı için kesişim/birleşim oranı. Bu, "
        "modelin GERÇEK hasar tespit performansını yansıtan ölçüttür ve referans SegFormer "
        "sonucuyla (0,4276) karşılaştırılabilir tek metriktir."
    )
    doc.add_paragraph(
        "Aşağıdaki tüm karşılaştırmalar ve tartışma **ön-plan IoU** üzerinden yapılmıştır. "
        "mIoU değerleri de tabloda referans amaçlı verilmiştir ancak TEK BAŞINA "
        "yorumlanmamalıdır — bu, orijinal kıyaslama planındaki '01_yol_hasari' notunda da "
        "vurgulanan bir husustur (\"bu görevde doğruluk/mIoU tek başına aldatıcıdır\")."
    )

    # ---- 3. Sonuclar ----
    doc.add_heading("3. Sonuçlar", level=1)
    rows = []
    for n in ORDER:
        d = results[n]
        rows.append([DISPLAY_NAMES[n], fmt(d["iou_fg"], 4), fmt(d["mean_iou"], 4), fmt(d["f1"], 4),
                     fmt(d["precision"], 4), fmt(d["recall"], 4), fmt(d["params_m"], 1),
                     d["n_epochs_run"], f"{d['train_seconds']/60:.1f} dk"])
    rows.sort(key=lambda r: -float(r[1]))
    rows.append(["SegFormer MiT-B4 (REFERANS)", fmt(REFERENCE_FG_IOU, 4), "-", "-", "-", "-", "~64", "23*", "~73 dk*"])

    add_table(doc, ["Mimari", "Ön-plan IoU", "mIoU", "F1", "Kesinlik", "Duyarlılık",
                     "Params (M)", "Epoch", "Süre (T4)"],
              rows, col_widths_cm=[3.6, 1.7, 1.3, 1.2, 1.5, 1.5, 1.5, 1.2, 1.5])
    doc.add_paragraph("* Referans model ayrı bir oturumda (`optimized_training_colab.ipynb`), "
                       "aynı veriyle fakat 2 katmanlı (train/val) bölme ile eğitilmiştir; "
                       "epoch/süre yaklaşık değerlerdir.").runs[0].italic = True

    add_figure(doc, RESULTS / "00_comparison_chart.png",
               "Şekil 1: Mimari başına mIoU karşılaştırması (ham grafik; ön-plan IoU için Tablo 1'e bakınız).")

    doc.add_heading("3.1 Tartışma", level=2)
    best_cnn = rows[0]
    doc.add_paragraph(
        f"CNN tabanlı mimariler arasında en iyi sonucu **{best_cnn[0]}** vermiştir "
        f"(ön-plan IoU={best_cnn[1]}), ancak bu değer referans SegFormer modelinin "
        f"({REFERENCE_FG_IOU:.4f}) yaklaşık %{100*(REFERENCE_FG_IOU-float(best_cnn[1]))/REFERENCE_FG_IOU:.0f} "
        "altındadır. Bu fark, MiT-B4'ün hiyerarşik transformer kodlayıcısının, ResNet tabanlı "
        "kodlayıcılara kıyasla ince ve düzensiz şekilli hasar bölgelerini (yol çatlakları, "
        "parçalı enkaz) daha iyi temsil edebildiğini düşündürmektedir — bu, segmentasyon "
        "literatüründe transformer kodlayıcılar için sıkça raporlanan bir avantajdır. "
        "PSPNet'in en fazla epoch'ta (38) eğitilmesine rağmen en düşük ön-plan IoU'yu vermesi "
        "(0,3385), piramit havuzlama mimarisinin bu görevde alt sınır referansı olma "
        "beklentisini (bkz. proje README'si) doğrulamaktadır."
    )
    doc.add_paragraph(
        "Verimlilik açısından, DeepLabV3+ (ResNet101, 45,7M parametre) diğer dört mimariden "
        "(11-14M parametre) 3-4 kat daha fazla parametreye sahip olmasına rağmen ön-plan "
        "IoU'da orta sırada kalmıştır (0,3426) — parametre sayısının bu görevde performansla "
        "doğrudan orantılı olmadığını göstermektedir."
    )

    # ---- 4. Egitim egrileri ----
    doc.add_heading("4. Eğitim Eğrileri", level=1)
    doc.add_paragraph(
        "Her mimari için epoch bazlı eğitim kaybı ve doğrulama mIoU/F1 seyri aşağıda "
        "gösterilmiştir. Bütün mimariler erken durdurma (patience=8) ile sonlanmıştır."
    )
    for n in ORDER:
        img = RESULTS / f"{n}_curve.png"
        if img.exists():
            add_figure(doc, img, f"Şekil: {DISPLAY_NAMES[n]} — eğitim/doğrulama eğrisi.", width_cm=15)

    # ---- 5. Sinirlamalar ----
    doc.add_heading("5. Sınırlamalar", level=1)
    doc.add_paragraph(
        "(1) Referans SegFormer modeli ayrı bir oturumda, farklı bir veri bölme stratejisiyle "
        "(train/val, test seti ayrılmamış) eğitilmiştir; bu çalışmadaki beş mimari ise ayrı "
        "tutulan bir test kümesinde değerlendirilmiştir — dolayısıyla karşılaştırma yaklaşık "
        "olup birebir aynı protokolü paylaşmamaktadır (aynı veri kaynağı ve aynı kayıp/"
        "optimizasyon hiperparametreleri paylaşılsa da). Adil bir nihai karşılaştırma için "
        "SegFormer'in de aynı 3-katmanlı bölme ile yeniden değerlendirilmesi önerilir. "
        "(2) Sınıf dengesizliği (hasar pikselleri azınlıkta) nedeniyle mIoU metriği tek "
        "başına yanıltıcıdır (bkz. Bölüm 2). (3) Karolamada hasarsız karoların %95'i atılsa "
        "da, kalan karolar içinde de hasar pikselleri genellikle küçük bir alanı kaplamaktadır. "
        "(4) Eğitimler tek bir T4 GPU oturumunda sırayla yapılmıştır; mimariler arası "
        "rastgelelik (veri artırma, ağırlık başlatma) kontrol edilmiş olsa da (seed=42) "
        "tek-çalıştırma sonuçlarıdır, çoklu-tekrar (multi-seed) varyansı ölçülmemiştir."
    )

    # ---- 6. Sonuc ----
    doc.add_heading("6. Sonuç", level=1)
    doc.add_paragraph(
        "Bu kıyaslama, mevcut üretim modelinin (SegFormer MiT-B4) yol hasarı segmentasyonunda "
        "beş standart CNN kodlayıcı-kod çözücü mimarisinden daha güçlü kaldığını doğrulamaktadır. "
        "LinkNet, denenen CNN mimarileri arasında en iyi ön-plan IoU'yu vermiş olup, hesaplama "
        "kaynağı kısıtlı (uç cihaz) senaryolar için düşük parametre sayısıyla (11,7M) makul bir "
        "alternatif olabilir. Sonuçlar makale için gerekli mimari kıyaslama tablosu ve "
        "eğitim eğrilerinin temelini oluşturmaktadır."
    )

    out_path = RESULTS / "01_Yol_Hasari_Rapor.docx"
    doc.save(str(out_path))
    print("yazildi:", out_path)


if __name__ == "__main__":
    main()
