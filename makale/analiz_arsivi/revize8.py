# -*- coding: utf-8 -*-
"""Revizyon 8: Sekil 1 kaynaga bagli olarak yeniden cizildi.

Eski Sekil 1'in ureticisi yoktu; ~42 noktanin hicbiri bir kaynaga bagli
degildi ve sag ustteki uc nokta Bolum 2.3'teki "rastlanmamistir" ifadesiyle
celisiyordu; ayrica eksen yazilari ust uste biniyordu. Yeni sekil:
QuakeMindBackend/araclar_makale_yazin_konumu.py (her kutu bir kaynak numarasi,
yeri betikte gerekcesiyle yazili).
"""
import shutil
import sys

sys.path.insert(0, r"C:\Users\utkuc\AppData\Local\Temp\claude\D--quakemind-final-QuakeMind\4779ac37-74b5-4aeb-8690-74d7792eedc5\scratchpad")
from docx import Document
from yardimci import Duzenleyici

SRC = r"D:\quakemind_final\QuakeMind\makale\arsiv\QuakeMind_Makale_YEDEK_pre_revize8_2026-09-27.docx"
DST = r"D:\quakemind_final\QuakeMind\makale\QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3_LOCAL_2026-09-21.docx"
SEKIL = r"D:\quakemind_final\QuakeMind\QuakeMindBackend\benchmark\makale_sekilleri\sekil_yazin_konumu.png"
shutil.copyfile(SRC, DST)
doc = Document(DST)
D = Duzenleyici(doc)

p = D.basliktan_onceki_gorsel("Şekil 1. Yazının algılama ve karar eksenlerinde")
D.resim_koy(p, SEKIL, 14.5)

D.yaz("Şekil 1, derlenen yazının algılama ve karar eksenlerinde",
      "Şekil 1, Bölüm 2.1–2.4'te tartışılan uygulamalı çalışmaları kullandıkları algılama kanalına ve "
      "çıktılarının ulaştığı karar düzeyine göre konumlandırmaktadır. Derlenen çalışmaların tamamı üç algılama "
      "kanalından (uydu/hava görüntüsü, yer seviyesi görüntü, metin) en çok birini kullanmaktadır (optik ve "
      "radar görüntüsünü birlikte kullanan çalışmalar uydu/hava kanalında sayılmıştır); ekip sevki düzeyine "
      "ulaşan bir çalışma bulunmamaktadır.")
alt = D.yaz("Şekil 1. Yazının algılama ve karar eksenlerinde",
      "Şekil 1. Bölüm 2'de tartışılan uygulamalı çalışmaların algılama kanalı ve çıktının ulaştığı karar "
      "düzeyine göre konumu. Her kutu bir kaynak numarasıdır; konum, Bölüm 2'deki anlatıma dayanan niteliksel "
      "bir sınıflamadır. Genel amaçlı mimariler ve algoritmalar, dil modelleri ve derleme [7] dışarıda "
      "bırakılmıştır.")
# diger altyazilarla ayni bicim: yalniz "Sekil 1." kalin
import copy
from docx.text.run import Run
r0 = alt.runs[0]
govde = r0.text[len("Şekil 1."):]
r0.text = "Şekil 1."
yeni = copy.deepcopy(r0._element)
r0._element.addnext(yeni)
r1 = Run(yeni, alt)
r1.text = govde
r1.bold = False
D.log.append("ALTYAZI kalinlik")

# Katki maddesi (Bolum 1): katman revize7'de duzeltildi
D.degistir("ve hattın kural katmanının modelin kararını ezdiği gözleminin açıkça raporlanması.",
           "ve hattın kural katmanının modelin kararını ezdiği gözleminin, bu katmanın düzeltilmesinin ve "
           "düzeltmeden sonra kalan ayrılıkların (yol kapanmasının modelce tanınmaması) açıkça raporlanması.")

doc.save(DST)
print("\n".join(D.log))
