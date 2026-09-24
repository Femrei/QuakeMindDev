# QuakeMind Makalesi — Yapılacaklar (Kısa Liste)

_Son güncelleme: 2026-09-24_

> Bu dosya **sıradaki eyleme yönelik** kısa listedir. Tüm ayrıntılı durum/gerekçe
> tek kaynak olan **`DURUM.md`**'dedir; buradaki maddeler oraya işaret eder.
> Bölüm C (uygulama görselleri, Şekil 21-24) **tamamlandı** — bkz. DURUM Bölüm C.

---

## 🟢 Yerelde şimdi yapılabilir (GPU/dış eylem gerekmez)

- [ ] **855 sarı vurgu — iç tutarlılık taraması.** docx'teki sarı vurgulu cümlelerdeki
      sayıların tablolarla, iddiaların sonuçlarla tutarlılığını gözden geçir; sorunluları
      listele (karar kullanıcının). _DURUM B-5._
- [ ] **Furkan'a "tohum çelişkisi" sorusu (B-2/11).** Karar 10 tohumdu ama fiilen
      SegFormer-B4 yalnız 2 tohumla (42/7) koşulmuş; paket kaydı da tekrar koşumu
      "yapılmadı" işaretliyor. Net bir soru iletilmeli. _DURUM B-2/11 🔴._
- [ ] **§8.4 atıf/sayı düzeltmeleri** (bir kısmı internetsiz doğrulanabilir): TE23D
      %74,45=mIoU / 56,98=IoU ayrımı, Tablo 1 satırları, EMS-98 adı, vb. _DURUM B-5._

## 🔴 Kullanıcı / dış eylem gerektirir

- [ ] **Roboflow API anahtarını iptal et + yenile.** Git geçmişinde açık (commit
      `9d4cc22`, `55a50d1`); Tablo 24 YOLO koşumu için de gerekli. _DURUM B-1/1._
- [ ] **TE23D / TUE-CD lisans teyidi** (dış iletişim; taslaklar `lisans_epostalari_taslak.md`). _DURUM B-1/4._
- [ ] (İsteğe bağlı) Üretim dağıtımında `QUAKEMIND_DEMO_TOKEN=false`. _DURUM B-1/3._

## ⏳ GPU/Colab'a bağlı (Furkan)

- [ ] Tablo 15 il-dışarıda-bırakma (4 satır) + F₁/Kesinlik/Duyarlılık. _DURUM B-2/13._
- [ ] Tablo 13/14 EMSR648 kesim-düzeyi (36 boş hücre) + τ taraması. _DURUM B-2/12._
- [ ] Eşik (0,5) duyarlılık taraması; kayıp ağırlıkları (λ_f/λ_d). _DURUM B-2/10, B-2/14._
- [ ] YOLOv8 çatlak+bina mAP@0,5 (yeni Roboflow anahtarı sonrası). _DURUM B-2/15._
- [ ] Dış sınama: HaitiBRD + Noto (veri setleri indirilmeli). _DURUM B-2/17._

## 📦 Diskte olmayan etiketli veriye bağlı

- [ ] **V₀ IoU etkisi** ölçümü (`tile_quality_score()` kodu hazır; etiketli ham karo gerekli). _DURUM B-6/31._
- [ ] Morfoloji ablasyonu (Tablo 21) — uygun test karosu + maske gerekli. _DURUM B-2/14._
- [ ] Tablo 22 NLP Wilcoxon — per-tohum/per-örnek ham veri gerekli. _DURUM B-7._

## 🧹 Bakım / temizlik

- [x] Geçici döküm dosyaları (`_*.txt`, `naive_agent_dump.txt`) silindi (2026-09-24).
- [x] Kullanılmayan görseller (`00.jpg`, `images.jpg`) silindi; Şekil 21 kaynağı
      `1_catlak_kaynak_foto.jpg` olarak saklandı (2026-09-24).
- [x] `.vscode/`, `**/cache/` `.gitignore`'a eklendi (2026-09-24).
