# -*- coding: utf-8 -*-
"""Revizyon 13: Veri Erisilebilirligi'ne herkese acik model ve kayit baglantilari;
ayrica sari revizyon vurgulari kaldirilmis gonderim kopyasi (asil dosya degismez).

Erisim sinamasi (28 Eylul): kaggle.com/datasets/furkanemrence/quakemind-modeller (200, CC0),
quakemind-rapor-paketi (200; giris yapmadan indirilebildi), huggingface.co/Utbird/EqTwitterTr (200).
"""
import shutil
import sys

sys.path.insert(0, r"C:\Users\utkuc\AppData\Local\Temp\claude\D--quakemind-final-QuakeMind\4779ac37-74b5-4aeb-8690-74d7792eedc5\scratchpad")
from docx import Document
from docx.oxml.ns import qn
from yardimci import Duzenleyici

SRC = r"D:\quakemind_final\QuakeMind\makale\arsiv\QuakeMind_Makale_YEDEK_pre_revize13_2026-09-28.docx"
DST = r"D:\quakemind_final\QuakeMind\makale\QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3_LOCAL_2026-09-21.docx"
TEMIZ = r"D:\quakemind_final\QuakeMind\makale\QuakeMind_Makale_GONDERIM_vurgusuz.docx"
shutil.copyfile(SRC, DST)
doc = Document(DST)
D = Duzenleyici(doc)

D.degistir(
    "Bölütleme modellerinin eğitildiği KATE-PD ve KATE-CD kümeleri [56]",
    "Tablo 12'deki on bölütleme modelinin eğitilmiş ağırlıkları (tatbikattaki üç model dahil) Kaggle'da CC0 "
    "lisansıyla herkese açıktır (https://www.kaggle.com/datasets/furkanemrence/quakemind-modeller); eğitim "
    "defteri, 2 km'lik blok bölme listesi ve bütün koşu kayıtları "
    "https://www.kaggle.com/datasets/furkanemrence/quakemind-rapor-paketi adresindedir. Üretimdeki metin "
    "sınıflandırma ağırlığı Hugging Face'te yayımlanmaktadır (https://huggingface.co/Utbird/EqTwitterTr). "
    "Bölütleme modellerinin eğitildiği KATE-PD ve KATE-CD kümeleri [56]")
doc.save(DST)
print("\n".join(D.log))

# Gonderim kopyasi: yalniz vurgu kaldirilir, metin ayni
t = Document(DST)
n = 0
for rpr in t.element.body.iter(qn("w:rPr")):
    for h in rpr.findall(qn("w:highlight")):
        rpr.remove(h)
        n += 1
t.save(TEMIZ)
print(f"gonderim kopyasi: {n} vurgu kaldirildi -> {TEMIZ}")
