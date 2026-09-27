# -*- coding: utf-8 -*-
"""Tarama revizyonu - BOLUM C: eski senaryo sekillerinin yenileriyle
degistirilmesi, yeni Sekil 9 ve Sekil 10, degistirilmis tablolarin ozgun
bicime getirilmesi ve tamamen kalin kalan paragraflarin duzeltilmesi."""
import copy
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm
from docx.text.paragraph import Paragraph

SEK = r"D:\quakemind_final\QuakeMind\QuakeMindBackend\benchmark\makale_sekilleri"
HAZIR = r"D:\quakemind_final\QuakeMind\makale\sekiller_hazir"


def _gorsel_paragraf_ekle(D, capa_el, yol, cm, ornek_img_p):
    yeni = OxmlElement('w:p')
    if ornek_img_p._p.pPr is not None:
        yeni.append(copy.deepcopy(ornek_img_p._p.pPr))
    capa_el.addnext(yeni)
    p = Paragraph(yeni, D.doc)
    p.add_run().add_picture(yol, width=Cm(cm))
    D.log.append("GORSEL+ " + yol.split('\\')[-1])
    return p


def uygula(D, doc):
    yaz = D.yaz

    # ornek bicimler: Sekil 7 gorsel paragrafi ve basligi, govde paragrafi
    ornek_img = D.basliktan_onceki_gorsel("Şekil 7. Bina hasarı bölütlemesinde")
    ornek_cap = D.bul("Şekil 7. Bina hasarı bölütlemesinde")
    ornek_govde = D.bul("Model yanlış alarm üretmemektedir")

    # ---------------------------------------------------------------- Sekil 3
    D.resim_koy(D.basliktan_onceki_gorsel("Şekil 3. Çalışma alanı"), SEK + r"\sekil_calisma_alani.png", 10.5)
    yaz("Şekil 3. Çalışma alanı",
        "Şekil 3. Çalışma alanı: 6 Şubat 2023 depremlerinin dış merkezleri (USGS), bölgedeki aktif faylar (GEM Global "
        "Active Faults) ve değerlendirmede kullanılan üç drone mahallesi (Defne/Elektrik, İslahiye, Nurdağı; çekim "
        "tarihleriyle). Zemin © OpenStreetMap katkıcıları.")

    # ---------------------------------------------------------------- Sekil 5
    D.resim_koy(D.basliktan_onceki_gorsel("Şekil 5. Kapanma katmanının"), HAZIR + r"\sekil05_tatbikat_nurdagi_kunyesiz.png", 12.5)
    yaz("Şekil 5. Kapanma katmanının",
        "Şekil 5. Kapanma katmanının çizge üzerine işlenmesi ve ekip güzergâhları (Gaziantep / Nurdağı, U-Net MiT-B4, "
        "tohum 42). Zemin, modelin analiz ettiği drone ortofotosudur (Help.NGO, 14 Şubat 2023); kırmızı alanlar modelin "
        "hasarlı bulduğu pikseller, koyu kırmızı çizgiler bunlardan türetilen ve çizgeden çıkarılan kapalı yol kenarları "
        "(26 kenar), mavi çizgiler kapanmalara göre hesaplanan ekip güzergâhlarıdır. Ekiplerin giriş ağızları mahallenin "
        "+150 m marjında, görüntü karesinin dışında kalır. Modelin fiilen değerlendirebildiği kenar oranı (kapsama) "
        "%44'tür; görülmeyen kenar açık sayılır ancak ölçülmemiştir.")

    # ---------------------------------------------------------------- Sekil 9 (yeni, 4.3)
    t = D.sonrasina_ekle(ornek_govde._p,
                         "Değerlendirilen mahallenin deprem öncesi ve sonrası görüntüsü ile modelin hasar maskesi Şekil 9'da "
                         "verilmektedir.", ornek_govde)
    g = _gorsel_paragraf_ekle(D, t._p, SEK + r"\sekil_oncesi_sonrasi_defne.png", 15.5, ornek_img)
    D.sonrasina_ekle(g._p,
                     "Şekil 9. Hatay / Defne – Elektrik Mah.: (a) deprem öncesi görüntü (Esri World Imagery Wayback), (b) "
                     "deprem sonrası drone ortofotosu (Help.NGO, 9 Şubat 2023), (c) U-Net MiT-B4 modelinin hasar maskesi. "
                     "Üç kare aynı coğrafi çerçevededir; ortofotonun siyah bölgeleri uçuş izinin dışıdır ve model orada "
                     "değerlendirme yapmaz.", ornek_cap, kalin_bas="Şekil 9.")

    # ---------------------------------------------------------------- Sekil 10 (4.6'dan 4.5'e)
    eski_cap = D.bul("Şekil 10. Üç kolun")
    eski_img = D.basliktan_onceki_gorsel("Şekil 10. Üç kolun")
    for el in (eski_img._p, eski_cap._p, D.bul("Örnek bir güzergâh karşılaştırması Şekil 10'da")._p):
        el.getparent().remove(el)
    D.log.append("SIL  eski Sekil 10 (EMSR648 guzergah)")
    capa = D.bul("Metin kanalında bir eğilim gözlenmiştir.")
    t = D.sonrasina_ekle(capa._p,
                         "Üç kanalın aynı mahalledeki çıktıları ve zincirin sonu (kapalı yollar ve ekip güzergâhları) Şekil "
                         "10'da tek haritada gösterilmektedir.", ornek_govde)
    g = _gorsel_paragraf_ekle(D, t._p, SEK + r"\sekil_uc_kanal_nurdagi.png", 11.0, ornek_img)
    D.sonrasina_ekle(g._p,
                     "Şekil 10. Üç kanal tek haritada (Gaziantep / Nurdağı, U-Net MiT-B4, tohum 42). Kırmızı alanlar "
                     "uydu/drone kanalının hasarlı bulduğu pikseller, koyu kırmızı çizgiler bunlardan türetilen kapalı yollar "
                     "(26 kenar), mavi çizgiler ekip güzergâhlarıdır; sarı kareler kamera kanalını (4 gerçek fotoğraf; YOLO "
                     "15 çatlak ve 41 bina tespiti), mor daireler metin kanalını (5 ihbar, BERTurk sınıfı) gösterir. Görüntü, "
                     "fotoğraflar ve bütün model çıktıları gerçektir; ihbar metinleri ile kamera ve metin kayıtlarının harita "
                     "konumları üretilmiştir. Fotoğraflar aynı depremlerin ardından çekilmiş gerçek karelerdir (dokuzu "
                     "Hatay/Antakya'da, dördünün ili kaynakta belirtilmemiş), ancak bu mahallenin fotoğrafı değildir.",
                     ornek_cap, kalin_bas="Şekil 10.")

    # ---------------------------------------------------------------- Sekil 11 (tablo kapsayici)
    kap = doc.tables[19]
    hucreler = kap.rows[0].cells
    for hucre, yol in zip(hucreler, (SEK + r"\sekil_kiyas_kollari.png", SEK + r"\sekil_duyarlilik.png")):
        img_p = [p for p in hucre.paragraphs if D.gorsel_paragrafi_mi(p)][0]
        D.resim_koy(img_p, yol, 7.9)

    # ---------------------------------------------------------------- Sekil 12
    D.resim_koy(D.basliktan_onceki_gorsel("Şekil 12. QuakeMind kolunun kazancı"), SEK + r"\sekil_kesif_kazanc.png", 13.0)

    # ---------------------------------------------------------------- tablo bicimi
    n = 0
    for ti, tb in enumerate(doc.tables):
        w = tb._tbl.tblPr.find(qn('w:tblW'))
        if tb.style is not None and tb.style.name == 'Table Grid' and (w is None or w.get(qn('w:type')) != 'pct'):
            D.tablo_bicimle(tb, punto=8.0 if len(tb.columns) >= 10 else 8.5)
            n += 1
    D.log.append("TABLO bicimi ozgune getirildi: %d tablo" % n)

    # ---------------------------------------------------------------- kalinlik
    D.kalinlik_duzelt()

    # ---------------------------------------------------------------- denetim
    for ifade in ("EMSR648 medium", "Naif ajan (R0)", "r_h = 25 m tampon"):
        pass
    sekiller = []
    import re
    for p in D.paragraflar():
        m = re.match(r'^Şekil (\d+)\. ', p.text)
        if m:
            sekiller.append(int(m.group(1)))
    D.log.append("SEKIL SIRASI: %s" % sekiller)
