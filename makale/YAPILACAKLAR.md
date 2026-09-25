# QuakeMind Makalesi — Yapılacaklar (Kısa Liste)

_Son güncelleme: 2026-09-25_

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

## ✅ 2026-09-25'te tamamlanan

- [x] **Tablo 14 SegFormer satırı** — `table14_segformer_closure.py` gerçek
      checkpoint + EMSR648 + 6 karo/4513 kenarla koşuldu. Sonuç: **sıfır
      örtüşme** (DP=0 tüm τ'larda) — Tablo 19'un bağımsız bulgusuyla tutarlı.
      Docx'e işlendi. _DURUM B-2/12._

## ⏳ GPU/Colab'a bağlı (Furkan) → HAZIR DEFTER: `olcum_egitim_colab.ipynb`

> **2026-09-25:** Ölçüm envanteri + Furkan iş paketi + Colab defteri üretildi:
> `OLCUM_ENVANTERI_2026-09-25.md`, `FURKAN_GPU_IS_PAKETI_2026-09-25.md`,
> `olcum_egitim_colab.ipynb`. Karar: Tablo 14'te **MiT-B4 sabit** — U-Net/FPN/DeepLabV3+
> zaten Tablo 13'te eğitildi (Kaggle'dan indir), sadece **LinkNet+PSPNet (ResNet-34)** yeni.

- [ ] **Grup A** — LinkNet+PSPNet eğit (`olcum_egitim_colab.ipynb` Grup A) → yerelde
      `table14_segformer_closure.py` genel yükleyiciyle koş → Tablo 14 (35 hücre). _DURUM B-2/12._
- [ ] **Grup B** — Tablo 15 il-ayrık 🔴 **VERİ ENGELİ**: KATE-CD `scene='none'`, şehir
      etiketi yok. AOI-etiketli KATE-PD gerekli. Furkan'a: r5/r6 (0,387/0,399) nasıl
      hesaplandı, AOI karoları nerede? _DURUM B-2/13._
- [ ] **Grup C** — λ_f/λ_d ızgarası (`olcum_egitim_colab.ipynb` Grup C, opsiyonel). _DURUM B-2/14._
- [ ] Eşik (0,5) duyarlılık taraması. _DURUM B-2/10._
- [ ] YOLOv8 çatlak+bina mAP@0,5 (yeni Roboflow anahtarı sonrası). _DURUM B-2/15._
- [ ] Dış sınama: HaitiBRD + Noto (veri setleri indirilmeli). _DURUM B-2/17._

## 🔴 Sarı vurgu taramasından çıkan sayısal çelişkiler (2026-09-25) → `SARI_VURGU_TUTARLILIK_2026-09-25.md`

- [ ] **P232 — yarılama sabitliği yanlış bölge.** "Belen (H-Z5)… sabit" yanlış;
      `full_run.json` H-Z5 halvings=[2,2,1,2,2,1,2,3,1,1]. Sabit olanlar **H-Z3 + K-Z1** (hep 0).
- [ ] **P234/P316/P447 — sentetik kapanma oranları yeniden üretilemiyor.** Metin %0,55–4,50
      / %2,84±0,20; `full_run.json` hesabı %1,32–1,97 / ~%1,59. Kaynak koşum yeniden eşleştirilmeli.
- [ ] **P333 — "430-433/480" off-by-one:** fiili maks. rotalanan 432 (R3), 433 yok.

## 📦 Diskte olmayan etiketli veriye bağlı

- [ ] **V₀ IoU etkisi** ölçümü (`tile_quality_score()` kodu hazır; etiketli ham karo gerekli). _DURUM B-6/31._
- [ ] Morfoloji ablasyonu (Tablo 21) — uygun test karosu + maske gerekli. _DURUM B-2/14._
- [ ] Tablo 22 NLP Wilcoxon — per-tohum/per-örnek ham veri gerekli. _DURUM B-7._

## 🧹 Bakım / temizlik

- [x] Geçici döküm dosyaları (`_*.txt`, `naive_agent_dump.txt`) silindi (2026-09-24).
- [x] Kullanılmayan görseller (`00.jpg`, `images.jpg`) silindi; Şekil 21 kaynağı
      `1_catlak_kaynak_foto.jpg` olarak saklandı (2026-09-24).
- [x] `.vscode/`, `**/cache/` `.gitignore`'a eklendi (2026-09-24).
