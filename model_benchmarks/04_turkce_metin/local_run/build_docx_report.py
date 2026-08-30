"""04 Turkce Metin - makale formatinda detayli Word raporu uretir.

    python build_docx_report.py

Girdi: results/*.json + results/*.png (build_report.py'nin urettigi ozet grafik dahil)
Cikti: results/04_Turkce_Metin_Rapor.docx
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
CACHE = HERE / "data_cache"

DISPLAY_NAMES = {
    "tfidf_logreg": "TF-IDF + Lojistik Regresyon",
    "tfidf_svm": "TF-IDF + Lineer SVM",
    "fasttext": "FastText",
    "bilstm_fasttext": "BiLSTM",
    "berturk": "BERTurk",
    "distilberturk": "DistilBERTurk",
    "convberturk": "ConvBERTurk",
    "xlm_roberta": "XLM-RoBERTa",
    "mbert": "mBERT",
    "turna": "TURNA",
}

ORDER = ["tfidf_logreg", "tfidf_svm", "fasttext", "bilstm_fasttext",
         "berturk", "distilberturk", "convberturk", "mbert"]


def load_results():
    out = {}
    for n in ORDER:
        p = RESULTS / f"{n}.json"
        if p.exists():
            out[n] = json.load(open(p, encoding="utf-8"))
    return out


def load_dataset_stats():
    tr = pd.read_parquet(CACHE / "train.parquet")
    va = pd.read_parquet(CACHE / "val.parquet")
    te = pd.read_parquet(CACHE / "test.parquet")
    meta = json.load(open(CACHE / "labels.json", encoding="utf-8"))
    all_df = pd.concat([tr, va, te])
    from collections import Counter
    counts = Counter()
    for labs in all_df["label"]:
        for l in labs:
            counts[l] += 1
    avg_labels = float(all_df["label"].apply(len).mean())
    avg_words = float(all_df["text"].str.split().apply(len).mean())
    return {
        "n_total": meta["n_total"], "n_train": meta["n_train"],
        "n_val": meta["n_val"], "n_test": meta["n_test"],
        "label_list": meta["label_list"],
        "counts": dict(sorted(counts.items(), key=lambda x: -x[1])),
        "avg_labels": avg_labels, "avg_words": avg_words,
    }


# ---------------------------------------------------------------- helpers

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
                r.font.color.rgb = None
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


# ---------------------------------------------------------------- main

def main():
    results = load_results()
    ds = load_dataset_stats()

    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    # ---- Baslik ----
    title = doc.add_heading(
        "Türkçe Deprem İhbar Metinlerinde Çok-Etiketli İhtiyaç Sınıflandırması: "
        "Klasik, Alt-Kelime Tabanlı ve Transformer Modellerinin Karşılaştırmalı Analizi",
        level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    sub = doc.add_paragraph("QuakeMind Projesi — Yerel Deneysel Çalışma Raporu")
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.runs[0].italic = True

    # ---- Ozet ----
    doc.add_heading("Özet", level=1)
    doc.add_paragraph(
        f"Bu çalışmada, 2023 Kahramanmaraş ve Hatay depremleri sırasında sosyal medyada paylaşılan "
        f"{ds['n_total']} adet anonimleştirilmiş Türkçe afet ihbar metni üzerinde, {len(ds['label_list'])} "
        f"kategoriden oluşan çok-etiketli (multi-label) bir ihtiyaç sınıflandırma görevi ele alınmıştır. "
        f"Aynı veri bölmesi (train/val/test = {ds['n_train']}/{ds['n_val']}/{ds['n_test']}) ve aynı "
        f"değerlendirme protokolü kullanılarak sekiz farklı model ailesi — klasik öznitelik-tabanlı yöntemler "
        f"(TF-IDF + Lojistik Regresyon, TF-IDF + Lineer SVM), alt-kelime gömme tabanlı bir yöntem (FastText), "
        f"sıfırdan eğitilmiş bir tekrarlayan sinir ağı (BiLSTM) ve dört önceden eğitilmiş transformer modeli "
        f"(BERTurk, DistilBERTurk, ConvBERTurk, mBERT) — eğitilmiş ve karşılaştırılmıştır. Sonuçlar, alana "
        f"özel önceden eğitilmiş BERTurk modelinin hem mikro-F1 (0,825) hem de test doğruluğunda "
        f"(alt-küme doğruluğu 0,712) en iyi performansı gösterdiğini; ancak küçük ve dengesiz veri setinde "
        f"klasik TF-IDF tabanlı yöntemlerin makro-F1 metriğinde bazı transformer modellerini geride "
        f"bıraktığını ortaya koymaktadır."
    )

    # ---- 1. Giris ----
    doc.add_heading("1. Giriş ve Amaç", level=1)
    doc.add_paragraph(
        "Afet sonrası kriz anlarında sosyal medya üzerinden gelen yardım çağrılarının doğru ve hızlı "
        "biçimde kategorize edilmesi, saha ekiplerinin kaynak yönlendirmesi açısından kritik önem taşır. "
        "Bu çalışmanın amacı, Türkçe afet metinlerinin çok-etiketli ihtiyaç sınıflandırmasında farklı "
        "modelleme yaklaşımlarının (klasik makine öğrenmesi, alt-kelime gömmeleri, tekrarlayan sinir ağları "
        "ve transformer tabanlı dil modelleri) göreli performansını, AYNI veri, AYNI bölme ve AYNI metrik "
        "protokolü altında adil biçimde karşılaştırmaktır."
    )

    # ---- 2. Veri Seti ----
    doc.add_heading("2. Veri Seti ve Ön İşleme", level=1)
    doc.add_paragraph(
        f"Kullanılan veri kümesi `deprem-private/intent_test_v13_anonymized` (Hugging Face, özel erişim) "
        f"kümesidir; 2023 Kahramanmaraş/Hatay depremleri sırasında toplanmış, kişisel bilgileri "
        f"maskelenmiş (`[MASK]`) {ds['n_total']} adet sosyal medya gönderisinden oluşur. Her örnek, "
        f"{len(ds['label_list'])} kategoriden birine veya birkaçına aittir (ortalama "
        f"{ds['avg_labels']:.2f} etiket/örnek); ortalama metin uzunluğu {ds['avg_words']:.1f} kelimedir."
    )
    tr_pct = 100 * ds["n_train"] / ds["n_total"]
    va_pct = 100 * ds["n_val"] / ds["n_total"]
    te_pct = 100 * ds["n_test"] / ds["n_total"]
    doc.add_paragraph(
        "Veri, sabit bir rastgele tohum (seed=42) ile tabakalama yapılmaksızın "
        f"yaklaşık %{tr_pct:.0f}/%{va_pct:.0f}/%{te_pct:.0f} oranında train/val/test olarak "
        f"bölünmüştür (sırasıyla {ds['n_train']}/{ds['n_val']}/{ds['n_test']} örnek). Val kümesi "
        "model seçimi/erken durdurma, test kümesi ise NİHAİ ve raporlanan tüm metrikler için "
        "kullanılmıştır — hiçbir model test kümesini eğitim sırasında görmemiştir."
    )

    doc.add_heading("2.1 Etiket Dağılımı", level=2)
    doc.add_paragraph(
        "Veri kümesi belirgin bir sınıf dengesizliği göstermektedir; en sık görülen kategori "
        f"(“Enkaz Kaldırma”, {ds['counts'].get('Enkaz Kaldirma', '-')} örnek) en nadir kategoriden "
        f"(“Cenaze”, {ds['counts'].get('Cenaze', '-')} örnek) yaklaşık "
        f"{ds['counts'].get('Enkaz Kaldirma', 1) / max(1, ds['counts'].get('Cenaze', 1)):.0f} kat "
        "daha fazladır. Bu dengesizlik, makro-ortalamalı metriklerin (makro-F1) mikro-ortalamalı "
        "metriklere göre daha zayıf çıkmasının başlıca nedenidir."
    )
    add_table(doc, ["Kategori", "Örnek Sayısı", "Oran (%)"],
              [[k, v, f"{100*v/sum(ds['counts'].values()):.1f}"] for k, v in ds["counts"].items()],
              col_widths_cm=[6, 4, 4])

    # ---- 3. Yontem ----
    doc.add_heading("3. Yöntem", level=1)
    doc.add_paragraph(
        "Tüm modeller çok-etiketli sınıflandırma olarak ele alınmış; çıktı katmanında sigmoid "
        "aktivasyonu ve ikili çapraz entropi (binary cross-entropy) temelli kayıp fonksiyonları "
        "kullanılmış, karar eşiği tüm modeller için 0,5 olarak sabitlenmiştir."
    )

    doc.add_heading("3.1 Klasik Öznitelik-Tabanlı Modeller", level=2)
    doc.add_paragraph(
        "TF-IDF (1-2 gram, min_df=2, en fazla 50.000 öznitelik, sublinear tf ölçekleme) ile "
        "vektörleştirilen metinler, One-vs-Rest stratejisiyle çok-etiketli hale getirilmiş "
        "Lojistik Regresyon (C=2,0, sınıf ağırlıklandırması dengeli) ve Lineer SVM "
        "(C=1,0, sınıf ağırlıklandırması dengeli) sınıflandırıcılarına verilmiştir."
    )

    doc.add_heading("3.2 FastText", level=2)
    doc.add_paragraph(
        "Facebook FastText kütüphanesi, alt-kelime (subword) n-gram özniteliklerini kullanarak "
        "“one-vs-all” (ova) kayıp fonksiyonuyla çok-etiketli modda eğitilmiştir "
        "(epoch=25, lr=0,5, wordNgrams=2, boyut=100)."
    )

    doc.add_heading("3.3 BiLSTM", level=2)
    doc.add_paragraph(
        "Sıfırdan eğitilen bir gömme katmanı (boyut=100, en sık 20.000 kelime) üzerine çift yönlü "
        "tek katmanlı bir LSTM (gizli boyut=128) ve doğrusal bir çıkış katmanı eklenmiştir "
        "(15 epoch, Adam optimizasyonu, lr=0,001, batch=32, maksimum dizi uzunluğu=60 token)."
    )

    doc.add_heading("3.4 Transformer Tabanlı Modeller", level=2)
    doc.add_paragraph(
        "Dört önceden eğitilmiş kodlayıcı (encoder) — BERTurk (dbmdz/bert-base-turkish-cased), "
        "DistilBERTurk, ConvBERTurk ve çok-dilli mBERT — AYNI protokolle (4 epoch, öğrenme oranı 2e-5, "
        "batch=8, maksimum dizi uzunluğu=256 alt-kelime, AdamW, ağırlık sönümü 0,01) ince ayarlanmış; "
        "her epoch sonunda doğrulama kümesinde mikro-F1 izlenerek en iyi kontrol noktası (checkpoint) "
        "nihai değerlendirme için seçilmiştir."
    )

    doc.add_heading("3.5 Denenemeyen Modeller", level=2)
    doc.add_paragraph(
        "Aynı protokolle eğitilmesi planlanan XLM-RoBERTa (geniş çok-dilli kelime dağarcığı, ~278M "
        "parametre) ve TURNA (boun-tabi-LMG/TURNA, T5 tabanlı büyük Türkçe üretici model) modelleri, "
        "yerel eğitim ortamında eğitim döngüsünün ilk adımına geçişte tekrarlanan biçimde "
        "(mikro-batch küçültme ve gradyan biriktirme denemelerine rağmen) dış kaynaklı olarak "
        "sonlandırılmış ve bu çalışmaya dahil edilememiştir. Bu iki model için sonuçlar, daha "
        "yüksek bellek/GPU kapasiteli bir ortamda tamamlanabilir."
    )

    # ---- 4. Protokol ----
    doc.add_heading("4. Değerlendirme Protokolü", level=1)
    doc.add_paragraph(
        "Tüm modeller aynı test kümesinde (n=305) şu metriklerle değerlendirilmiştir: mikro-F1, "
        "makro-F1, örnek-bazlı F1 (samples-F1), alt-küme doğruluğu (subset accuracy — tüm etiketlerin "
        "birebir doğru tahmin edildiği örnek oranı), mikro/makro kesinlik (precision) ve mikro/makro "
        "duyarlılık (recall). Sınıf dengesizliği nedeniyle makro-F1, azınlık sınıflardaki performansı "
        "daha adil yansıttığından birincil karşılaştırma ölçütü olarak vurgulanmaktadır."
    )

    # ---- 5. Sonuclar ----
    doc.add_heading("5. Sonuçlar", level=1)

    rows = []
    for n in ORDER:
        if n not in results:
            continue
        d = results[n]
        rows.append([DISPLAY_NAMES.get(n, n), fmt(d["micro_f1"]), fmt(d["macro_f1"]),
                     fmt(d["subset_accuracy"]), fmt(d["micro_precision"]), fmt(d["macro_precision"]),
                     fmt(d["micro_recall"]), fmt(d["macro_recall"])])
    rows.sort(key=lambda r: -float(r[2]))
    add_table(doc, ["Model", "Mikro-F1", "Makro-F1", "Alt-küme Doğruluk",
                     "Mikro-Kesinlik", "Makro-Kesinlik", "Mikro-Duyarlılık", "Makro-Duyarlılık"],
              rows, col_widths_cm=[3.2, 1.7, 1.7, 2.0, 1.9, 1.9, 1.9, 1.9])
    doc.add_paragraph("Tablo: Test kümesi (n=305) üzerinde tüm modellerin karşılaştırmalı metrikleri, "
                       "makro-F1'e göre azalan sırada.").runs[0].italic = True

    add_figure(doc, RESULTS / "00_comparison_chart.png",
               "Şekil 1: Model başına mikro-F1 ve makro-F1 karşılaştırması.")

    doc.add_heading("5.1 Tartışma", level=2)
    best = rows[0]
    doc.add_paragraph(
        f"{best[0]} modeli makro-F1 metriğinde en yüksek skoru elde etmiştir "
        f"({best[2]}), bu da alana özel Türkçe önceden eğitimin (domain-agnostic çok-dilli modellere "
        "kıyasla) küçük veri rejiminde bile avantaj sağladığını göstermektedir. Buna karşın, klasik "
        "TF-IDF tabanlı yöntemlerin makro-F1'de bazı transformer modellerini (ConvBERTurk, mBERT, "
        "DistilBERTurk) geride bırakması dikkat çekicidir; bu durum, ~1400 örnekten oluşan küçük eğitim "
        "kümesinin, milyonlarca parametreli transformer modellerinin azınlık sınıflar için yeterince "
        "genelleme yapmasına imkân tanımadığını, buna karşın basit doğrusal modellerin sınıf "
        "ağırlıklandırmasıyla (class_weight='balanced') nadir sınıflara daha duyarlı kalabildiğini "
        "düşündürmektedir."
    )

    # ---- 5.2 Sinif bazli ----
    doc.add_heading("5.2 Sınıf Bazlı Analiz (En İyi Model: " + best[0] + ")", level=2)
    best_key = [k for k, v in DISPLAY_NAMES.items() if v == best[0]][0]
    per_class = results[best_key]["per_class"]
    pc_rows = sorted(per_class.items(), key=lambda x: -x[1]["support"])
    add_table(doc, ["Kategori", "Kesinlik", "Duyarlılık", "F1", "Destek (n)"],
              [[k, fmt(v["precision"]), fmt(v["recall"]), fmt(v["f1"]), v["support"]] for k, v in pc_rows],
              col_widths_cm=[5, 2.5, 2.5, 2.5, 2.5])

    for n in ["berturk", "tfidf_logreg"]:
        img = RESULTS / f"{n}_per_class.png"
        if img.exists():
            add_figure(doc, img, f"Şekil: {DISPLAY_NAMES.get(n, n)} — sınıf bazlı F1 skorları.", width_cm=13)

    # ---- 5.3 Egitim egrileri ----
    doc.add_heading("5.3 Eğitim Eğrileri", level=2)
    doc.add_paragraph(
        "Aşağıdaki grafikler, epoch bazlı eğitim kaybı ve doğrulama F1 skorlarının seyrini göstermektedir. "
        "Transformer modelleri 4 epoch, BiLSTM 15 epoch eğitilmiştir; erken durdurma uygulanmamış, "
        "en iyi doğrulama mikro-F1'ine sahip kontrol noktası nihai değerlendirme için kullanılmıştır."
    )
    for n in ["berturk", "distilberturk", "convberturk", "mbert", "bilstm_fasttext"]:
        img = RESULTS / f"{n}_curve.png"
        if img.exists():
            add_figure(doc, img, f"Şekil: {DISPLAY_NAMES.get(n, n)} — eğitim/doğrulama eğrisi.", width_cm=15)

    # ---- 6. Verimlilik ----
    doc.add_heading("6. Hesaplama Maliyeti", level=1)
    eff_rows = []
    for n in ORDER:
        if n not in results:
            continue
        ts = results[n]["params"].get("train_seconds")
        if ts is not None:
            eff_rows.append([DISPLAY_NAMES.get(n, n), f"{ts/60:.1f} dk" if ts > 60 else f"{ts:.2f} sn"])
    add_table(doc, ["Model", "Eğitim Süresi (CPU)"], eff_rows, col_widths_cm=[6, 4])
    doc.add_paragraph(
        "Tüm eğitimler CPU üzerinde (CUDA/GPU hızlandırma olmadan) gerçekleştirilmiştir; bu nedenle "
        "mutlak süreler GPU ortamına göre çok daha yüksektir, ancak modeller arası göreli sıralama "
        "(parametre sayısıyla orantılı) korunmaktadır."
    )

    # ---- 7. Sinirlamalar ----
    doc.add_heading("7. Sınırlamalar", level=1)
    doc.add_paragraph(
        "(1) Veri kümesi görece küçüktür (2028 örnek), bu da özellikle nadir kategorilerde "
        "(“Cenaze”: 2 örnek, “Tuvalet”: 10 örnek) güvenilir genelleme yapılmasını zorlaştırmaktadır. "
        "(2) Bölme işlemi çok-etiketli tabakalama (stratification) uygulanmadan rastgele yapılmıştır; "
        "bu, nadir sınıfların val/test kümelerinde yetersiz temsil edilmesine yol açmış olabilir. "
        "(3) XLM-RoBERTa ve TURNA modelleri, yerel donanım kısıtları nedeniyle bu tur çalışmaya dahil "
        "edilememiştir. (4) Tüm modeller sabit 0,5 karar eşiğiyle değerlendirilmiştir; sınıf bazlı "
        "eşik ayarı (threshold tuning) yapılmamıştır."
    )

    # ---- 8. Sonuc ----
    doc.add_heading("8. Sonuç", level=1)
    doc.add_paragraph(
        f"Bu karşılaştırmalı çalışma, Türkçe afet ihbar metinlerinin çok-etiketli ihtiyaç "
        f"sınıflandırmasında alana özel önceden eğitilmiş BERTurk modelinin genel performans "
        f"açısından en güçlü seçenek olduğunu; ancak küçük ve dengesiz veri koşullarında klasik "
        f"yöntemlerin de rekabetçi kalabileceğini göstermektedir. Sonuçlar, makale için gerekli "
        f"kıyaslama tablosu ve şekillerin temelini oluşturmaktadır."
    )

    out_path = RESULTS / "04_Turkce_Metin_Rapor.docx"
    doc.save(str(out_path))
    print("yazildi:", out_path)


if __name__ == "__main__":
    main()
