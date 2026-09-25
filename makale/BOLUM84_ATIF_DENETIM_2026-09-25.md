# §8.4 Atıf/Sayı Düzeltmeleri — Denetim Sonucu (2026-09-25)

DURUM.md B-5'teki atıf/sayı düzeltme listesi mevcut docx'e karşı tek tek denetlendi.
**Bulgu: listenin büyük kısmı zaten uygulanmış (liste bayat).** Docx Word'de açık
olduğu için otomatik düzeltme yapılmadı; aşağıda karar gerektiren tek gerçek madde var.

## ✅ Zaten DOĞRU — düzeltme gerekmiyor
| Madde | Durum | Kanıt |
|---|---|---|
| TE23D %74,45=mIoU / 56,98=IoU ayrımı | ✅ Yapılmış | **P453:** "IoU_hasar 0,570… özetlerindeki 0,7445 değeri aslında ortalama IoU'dur (mIoU)". **P298** aynı ayrımı tekrar veriyor. |
| EMS-98 doğru ad | ✅ Doğru | P87/P138/P139/P141/P464 hepsi "EMS-98"; kaynakça **P511** "European Macroseismic Scale 1998 (EMS-98)", doi doğru. |
| P47 "Mosalam" atfı | ✅ Doğru | P47 "Gao ve Mosalam… [39]" → kaynakça **P544** [39] Gao & Mosalam, *Deep transfer learning* (2018) ile eşleşiyor; [38] PEER Hub ImageNet (P543) ayrı ve doğru. |
| Tablo 1 TUE-CD/TE23D satırları | ✅ Tutarlı | Tablo 1: TUE-CD (2024, 2338 görüntü, bina değişim), TE23D (2025, 1183, hasar değerlendirme) — metinle uyumlu. |
| IoU_hasar tek ölçüt gerekçesi | ✅ Var | P267: mIoU'nun arka planla şiştiği, [22] FPN 0,973 piksel doğruluğu vs IoU≤0,394 örneği. |

## 🟠 Karar gerektiren tek gerçek tutarsızlık
**P38 ↔ P453 — TE23D "bina odaklı" mı "enkaz" mı?**
- **P38:** "Her iki küme de **bina odaklıdır**" (TUE-CD ve TE23D için).
- **P453:** TE23D etiket tanımı "**enkaz alanı**" (bu çalışma "hasarlı bina") — hasar-IoU
  farkının başlıca nedeni olarak veriliyor.
- **Sorun:** P38 TE23D'yi "bina odaklı" derken, P453 onu "enkaz alanı" etiketli diye
  ayırıyor. Küçük ama gerçek bir gerilim.
- **Öneri:** P38'de TE23D için "bina/enkaz hasarı odaklı" veya "bina hasar
  değerlendirmesi (enkaz alanı etiketiyle)" gibi P453 ile hizalı bir ifade.
  _Karar senin — istersen Word'ü kapat, uygularım._

## ⚪ Kapsam dışı (internet gerektirir — düzeltme değil, isteğe bağlı EKLEME)
- Microsoft künye (Robinson, MSR-TR-2023-7): taslakta **hiç yok**; eklenmesi öneri, atıf içeriği internet ister.
- Ainscoe 2025 "uydudan görünür hasar", Hacıefendioğlu/RAPID-A/DA-SegFormer/Noto ilgili-çalışma eklemeleri: internet ister.
- P56/P276/P452 [7] derleme atıf içeriği doğrulaması: internet ister.

## Sonuç
İnternetsiz uygulanabilir gerçek düzeltme **tek**: P38 (yukarıda). Diğer her şey ya
zaten doğru ya da internet gerektiren isteğe bağlı ekleme. YAPILACAKLAR/DURUM B-5'teki
"§8.4 atıf düzeltmeleri" maddesi buna göre daraltılmalı.
