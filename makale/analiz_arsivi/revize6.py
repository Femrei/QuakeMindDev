# -*- coding: utf-8 -*-
"""Revizyon 6: Turkce metin kumesinin erisim politikasi = istek uzerine."""
import shutil
import sys

sys.path.insert(0, r"C:\Users\utkuc\AppData\Local\Temp\claude\D--quakemind-final-QuakeMind\4779ac37-74b5-4aeb-8690-74d7792eedc5\scratchpad")
from docx import Document
from yardimci import Duzenleyici

SRC = r"D:\quakemind_final\QuakeMind\makale\arsiv\QuakeMind_Makale_YEDEK_pre_revize6_2026-09-27.docx"
DST = r"D:\quakemind_final\QuakeMind\makale\QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3_LOCAL_2026-09-21.docx"
shutil.copyfile(SRC, DST)
doc = Document(DST)
D = Duzenleyici(doc)
D.degistir("(deprem-private/intent_test_v13_anonymized, HuggingFace; erişim kimlik doğrulamalı, şu an genel erişime "
           "kapalı) [ERİŞİM POLİTİKASI KARARLAŞTIRILACAK — açık/istek üzerine/kapalı].",
           "(deprem-private/intent_test_v13_anonymized, HuggingFace; genel erişime kapalıdır); küme, makul bir talep "
           "hâlinde sorumlu yazardan temin edilebilir.")
t2 = [t for t in doc.tables if t.rows[0].cells[0].text == "Kaynak" and len(t.columns) == 6][0]
for row in t2.rows:
    if row.cells[0].text.startswith("Türkçe afet metni kümesi"):
        D.hucre_yaz(row.cells[5], "Özel Hugging Face deposu; istek üzerine sorumlu yazardan temin edilebilir "
                                  "(bkz. Veri Erişilebilirliği)")
        D.log.append("TABLO 2 erisim hucresi")
doc.save(DST)
print("\n".join(D.log))
