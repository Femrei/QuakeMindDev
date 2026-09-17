# QuakeMind Makale Taslağı — Durum Özeti (17 Eylül 2026)

Bu belge, `QuakeMind_Taslak_Duzeltme_Listesi.md` (12 Eylül 2026 incelemesi) ile başlayan düzeltme çalışmasının 17 Eylül 2026 itibarıyla geldiği noktayı özetler. Aktif taslak dosyası: `QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3.docx`.

---

## 1. Bu oturumda yapılanlar

### 1.1. Eksik şekiller üretildi ve gömüldü
20 şekilden 7 tanesi (Şekil 1, 2, 4, 5, 6, 3, 10) yer tutucuydu. Bunlardan **5 tanesi** (veri gerektirmeyen şematik diyagramlar) üretilip belgeye gömüldü:
- **Şekil 1** — Algılama × karar ekseni konumlandırma şeması
- **Şekil 2** — Üç katmanlı sistem mimarisi ve veri akışı (eşzamanlı/eşzamansız ayrımı)
- **Şekil 4** — Karolama + ağırlık penceresi + harmanlama + morfolojik son işleme (4 panel)
- **Şekil 5** — Kapanma katmanının çizgeye işlenmesi (4 panel)
- **Şekil 6** — Üç düzeyli değerlendirme protokolü + R0–R3 referans yelpazesi

**Şekil 3** (çalışma alanı haritası) ve **Şekil 10** (örnek güzergâh karşılaştırması) için gerçek coğrafi veri (dokuz bölge sınırı, fay hattı geometrisi, örnek güzergâh koordinatları) gerekiyor — henüz üretilmedi.

### 1.2. Eksik dikey eksen etiketleri düzeltildi
Şekil 8 (5 mimarinin eğitim/doğrulama eğrileri) ve Şekil 15 (BERTurk eğitim eğrisi) toplam 6 panelde y-ekseni başlığı eksikti. Kök neden bulundu: `model_benchmarks/01_yol_hasari/.../build_notebook.py` ve `04_turkce_metin/.../data_multilabel.py` içindeki çizim kodunda `set_ylabel()` unutulmuş. Bu 6 grafik, **gerçek eğitim geçmişi verileriyle** (`results/*.json`) aynı sayılar korunarak, eksik y-ekseni başlıklarıyla yeniden üretildi ve belgedeki yerlerine gömüldü.

### 1.3. Düzeltme listesinin (A–E, ~50 madde) güncel duruma karşı doğrulanması
12 Eylül incelemesi, 16 Eylül taslağına karşı madde madde kontrol edildi. Sonuç: **A1–A4 (4/4), B1–B9 (9/9, B1 hariç), C1–C21'in neredeyse tamamı zaten çözülmüş** durumda (Sep 12 → Sep 16 arasında düzeltilmiş). Ayrıca doğrudan dosya incelemesiyle:
- **D1 (denklemler)** → 17 gerçek `m:oMath` nesnesi doğrulandı, LaTeX metni değil. ✅
- **D3 (çapraz referanslar)** → 360 gerçek `w:fldChar` alan kodu doğrulandı, elle yazılmamış. ✅
- **D10 (Kısaltmalar tablosu)** → dolu (önceki inceleme yanlışlıkla boş sanmış). ✅

Bu oturumda ek olarak 5 somut düzeltme uygulandı:
| Madde | Düzeltme |
|---|---|
| D8 | Şekil 9'un bayat "üretilmemiştir" parantez notu silindi |
| C21 | ÖZ ve ABSTRACT'ta IoU ilk geçtiği yerde açıldı |
| B1 | Bölüm 3.5'e YOLOv8 eğitim verisi kaynağı eklendi (Roboflow "building-crack-detection" + "maras" kümeleri) |
| C18 | Bölüm 5.3 sınırlılıklar listesine (q) maddesi eklendi (yer seviyesi mAP hiç ölçülmedi) |

### 1.4. Klasör temizliği
Eski `MAKALE_TASLAK_TR (1)` ailesinin 7 adet `YEDEK_*` ara-yedeği silindi (kullanıcı onayıyla); final sürüm (`MAKALE_TASLAK_TR (1).docx`) korundu.

---

## 2. Kalanlar

### 2.1. Dergi belirlenene kadar bekleyenler
- **D2** — ORCID numaraları (yazarlardan gelecek)
- **D4 / D5** — ÖZ (368 kelime) ve ABSTRACT (439 kelime) hedef dergi sınırına indirilmeli; 23 tablo/21 şekil dergiye göre fazla olabilir, bir kısmı Ek'e taşınabilir
- **D6** — Başlık uzunluğu (bazı dergiler 15–20 kelime sınırı koyar)
- **D10** — "Öne Çıkanlar (Highlights)" bölümü gerekip gerekmediği

### 2.2. Dergiden bağımsız, yazarın kararı gereken
- **C17** — Çift kör hakemlik uygulanacak mı? Uygulanacaksa `Utbird/UtBird` geçen 2 yer (model ağırlığı adı + Veri Erişilebilirliği repo linki) anonimleştirilmeli. *(Şu an bilinmiyor, dokunulmadı.)*
- **D10** — Özel Türkçe metin veri kümesi için erişim politikası (açık / istek üzerine / kapalı) — hâlâ `[ERİŞİM POLİTİKASI KARARLAŞTIRILACAK]` işaretli.

### 2.3. Yeni deney gerektiren
- **Tablo 13, SegFormer satırı** — diğer 5 mimariyle aynı %70/15/15 bölmede yeniden koşulmalı. İnceleme: `06_segformer_mitb4.ipynb`'nin kullandığı `seg_common.py` modülü henüz gerçek veriye bağlanmamış bir şablon (Roboflow anahtarı placeholder). Asıl 5 mimariyi eğiten kod (`local_colab_run/build_notebook.py`) ayrı bir veri hazırlama akışı kullanıyor — SegFormer'ı doğru veriyle eşleştiren bir Colab hücresi hazırlanması gerekiyor (henüz yapılmadı).
- **Tablo 24, "Yer seviyesi hasar tespiti" mAP** — `03_yer_seviyesi/local_colab_run/00_catlak_bina_yolo.ipynb` çalıştırılmalı (henüz sonuç yok).

### 2.4. Kalıcı engel — yeni veri toplama gerektirir
- **Tablo 5** (yol hasarı eğitim kümesi künyesi), **Tablo 14** (kapanma katmanı vs EMSR648), **Tablo 15** (bölgeler arası genelleme), **Tablo 24**'ün ilgili satırları — toplam **86 adet `[ÖLÇÜLECEK]`** hücre. Kök neden: yol hasarına özgü etiketli eğitim kümesi bu sürümde hiç oluşturulmamış (paragraf (m) bunu zaten itiraf ediyor); Tablo 14 ayrıca EMSR648'in ham raster/vektör verisini gerektiriyor, bu da depoda yok.
- **Tablo 21** (ablasyon/duyarlılık analizi, 7 hücre) — çoklu yeni eğitim koşumu gerekiyor.
- **Şekil 3** (çalışma alanı haritası) ve **Şekil 10** (güzergâh karşılaştırması) — gerçek coğrafi veri gerekiyor.

### 2.5. Düşük öncelikli / kozmetik
- **D7** — Şekil 8'in 5 alt görseline (a)–(e) harf etiketi eklenebilir (altyazıda sıra zaten yazıyor, düşük öncelikli).
- **C10, C15, E2, E6** — küçük, doğrulanmamış tutarlılık kontrolleri.

---

## 3. Dosya referansları
- Aktif taslak: `QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3.docx`
- Orijinal (dokunulmamış) yedek: `QuakeMind_Makale_Taslak_2026-09-16.BACKUP.docx`
- Önceki inceleme: `QuakeMind_Taslak_Duzeltme_Listesi.md`
- Kaynak veri/kod: `model_benchmarks/` (repo kökünde)
