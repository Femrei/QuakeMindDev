# -*- coding: utf-8 -*-
"""Tarama revizyonu (27 Eylul 2026, 2. tur). Yedekten baslar, yeniden calistirilabilir.
Kullanim: python revize2.py [--deneme]"""
import shutil, sys, importlib
sys.path.insert(0, r"C:\Users\utkuc\AppData\Local\Temp\claude\D--quakemind-final-QuakeMind\4779ac37-74b5-4aeb-8690-74d7792eedc5\scratchpad")
from docx import Document
from yardimci import Duzenleyici, alanlari_duzlestir

SRC = r"D:\quakemind_final\QuakeMind\makale\arsiv\QuakeMind_Makale_YEDEK_pre_tarama_revizyonu_2026-09-27.docx"
DST = r"D:\quakemind_final\QuakeMind\makale\QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3_LOCAL_2026-09-21.docx"
if '--deneme' in sys.argv:
    DST = r"C:\Users\utkuc\AppData\Local\Temp\claude\D--quakemind-final-QuakeMind\4779ac37-74b5-4aeb-8690-74d7792eedc5\scratchpad\deneme.docx"

shutil.copyfile(SRC, DST)
doc = Document(DST)
D = Duzenleyici(doc)
D.log.append('ALAN duzlestirildi: %d' % alanlari_duzlestir(doc))
bolumler = [b for b in ('revize2_a', 'revize2_b', 'revize2_c') if importlib.util.find_spec(b)]
for b in bolumler:
    importlib.import_module(b).uygula(D, doc)
doc.save(DST)
print("\n".join(D.log))
print("TOPLAM", len(D.log), "->", DST)
