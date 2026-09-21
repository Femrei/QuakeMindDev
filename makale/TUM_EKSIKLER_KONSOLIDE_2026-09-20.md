# QuakeMind — Tüm Eksikler ve Yapılacaklar (Konsolide Rapor)

_Oluşturma: 2026-09-20 · Üç kaynak dosyanın tek yerde birleştirilmiş hâli. Tekrar eden maddeler
birleştirildi; her madde kaynak kimliğiyle (ör. A-16, Ç-03, §6.5-#7b) izlenebilir._

**Kaynaklar:**
- `UTKU_ICIN_LISTE.md` — Eksikler ve Sorunlar Takip Dosyası (kimlikler: **A / B / C / D / E / F / G / J**)
- `EKSIKLER_VE_SORUNLAR_2026-09-19_guncel.md` — Model/Veri Seti Aktarım Belgesi (**Ç-01…19**, **QM-VS01…14**, **§6.5**)
- `KALAN_ISLER.md` — Makale kod-vs-metin denetimi kalan işler

**Kaba sayım:** ~69 (takip dosyası açık) + 87 (aktarım belgesi eylem) + denetim listesi → tekrarlar
birleştirilince aşağıdaki 7 başlıkta ~120 ayrı iş. Öncelik: 🔴 kritik · 🟠 önemli · 🟡 orta · 🔵/⚪ düşük.

> **İş bölümü (belge §9):** Utku = eğitim/koşum (GPU/Colab). Furkan = veri kararları, yerel ölçümler,
> makale düzeltmeleri, dış iletişim. "Sen" = kullanıcı kararı / dış eylem gerektiren maddeler.

---

## 🟢 2026-09-20 GÜNCELLEMESİ — en kritik 3 madde kapatıldı/kararlaştırıldı

- **Veri erişim politikası (madde 27):** ✅ KARAR = **istek üzerine**. Makale docx'e işlendi — Veri
  Erişilebilirliği paragrafındaki `[ERİŞİM POLİTİKASI KARARLAŞTIRILACAK]` yer tutucusu "araştırma amaçlı
  olarak, sorumlu yazara yapılacak makul bir başvuru üzerine (istek üzerine) erişime açıktır" ile
  değiştirildi (yedek: `..._YEDEK_erisim_2026-09-20.docx`).
- **Tohum sayısı (madde 29):** ✅ KARAR = **segmentasyon 9-model eğitiminde model başına 10 tohum**
  (senaryo simülasyonlarındaki 10-tohum konvansiyonuyla uyumlu). Belge §9-B'deki "9 model tek tohum →
  en iyi 3×3" planı bununla değiştirilmiştir. Makale Bölüm 3.10 zaten çok-tohum vaat ediyor; asıl
  koşum GPU/Colab'da yapılacak (madde 7/11).
- **Roboflow anahtarı (madde 1):** kod tarafı ✅ **temiz** — gerçek anahtar değeri hiçbir çalıştırılabilir
  kodda yok (kodlar placeholder kullanıyor); yalnız `KALAN_ISLER.md`'de anılıyordu, o da redakte edildi.
  **Kalan tek iş (yalnız sen):** anahtarı Roboflow panelinden iptal edip yenisini üret — git geçmişi 2
  commit'te (`9d4cc22`, `55a50d1`) hâlâ içeriyor, iptal etmeden güvenli değil.

---

## 1) 🔴 GÜVENLİK & DIŞ EYLEM (yalnız kullanıcı/insan yapabilir — kod tarafı hazır)

| # | Kaynak | İş | Not |
|---|---|---|---|
| 1 | D-08 · KALAN · §8.1 | **Roboflow API anahtarını iptal et + yenisini üret** | Anahtar `origin/makale` git geçmişinde açık (2 commit); kod env/Secrets'e taşındı ama geçmiş temizlemek anahtarı geçersiz kılmaz. Yeni anahtar Tablo 24 YOLO koşumu için de gerekli |
| 2 | KALAN | **(İsteğe bağlı) git geçmişini temizle** | `git filter-repo`/BFG + `origin/makale`'ye force-push — yıkıcı, ayrı onay gerekir |
| 3 | KALAN (auth) | **`QUAKEMIND_DEMO_TOKEN=false`** (üretim dağıtımında) | `"demo-token"` ile kimlik doğrulama atlanabiliyor; kod flag'e bağlandı, dağıtımda kapatılmalı |
| 4 | G-01 · G-02 · G-03 | **Kaynakça künye tamamlama** | 6 kaynak yazarsız ([23][24][25][29][31][57]); ConvBERTurk/DistilBERTurk yanlış kaynak; [1] hem AFAD raporu hem katalog için — ayrı kaynak |
| 5 | Ç-03 · Ç-07 | **Veri seti lisans teyidi (dış iletişim)** | TE23D yazarları (can.ekkazan@optdcom.net, elif@yildiz.edu.tr — CC BY-NC-ND vs "tüm hakları saklıdır" çelişkisi); TUE-CD yazarları (README'de lisans yok) |
| 6 | Ç-13 · §9 | **ÇŞB'den hasar tespit verisi talebi** (isteğe bağlı) | En güçlü bağımsız yer gerçeği; csb.gov.tr / KEP |

---

## 2) 🔴🟡 GPU / COLAB — EĞİTİM VE ÇIKARIM (Utku)

### Ana protokol
| # | Kaynak | İş |
|---|---|---|
| 7 | A-01 · A-15 · D-07 · Tablo 13 | **9 modeli aynı bölme/ölçüt/tohumla yeniden eğit.** SegFormer'ın 0,4276'sı sadece doğrulama skoru; beş mimariyle karşılaştırılabilir değil. 3 grup: MiT-B4 (SegFormer/U-Net/FPN/DeepLabV3+/UPerNet) + DeepLabV3+ R101 + UPerNet ConvNeXt-S + ölçek (B0/B2). **Karar bekliyor:** tohum sayısı |
| 8 | Ç-04 · §6 | **U-Net ResNet-18 taban satırı ekle** — Türkiye 2023 emsaliyle (0,394) köprü, ~14M param |
| 9 | A-16 · §6.5-#2 | **Mekânsal bölme + negatif örnek** ile yeniden eğit. `optimized_training_colab.ipynb` bunu KISMEN uyguluyor (KATE-CD resmî bölme + öncesi-görüntü negatifleri + MEDBFS sahne bölmesi); tam 2 km-blok bölme `QuakeMind_veri/bolme.py` paketi gerektirir |
| 10 | A-19 · §6.5-#7b · §6.5-#7 | **Focal α taraması** α∈{0,25·0,5·0,75} + kayıp/eşik taraması (Tablo 21). Notebook'ta α taraması eklendi |
| 11 | §9-B5 | **En iyi 3 model × 3 tohum** (tohum 42/7/2026) |

### Tablo/şekil doldurma (eğitim çıktısına bağlı)
| # | Kaynak | İş |
|---|---|---|
| 12 | KALAN · A-17 · B-05 | **Tablo 13/14** — kapanma katmanı EMSR648 kesim-düzeyi değerlendirme (36 boş hücre); τ taraması |
| 13 | KALAN · A-20 · B-06 · Ç-16 | **Tablo 15** — Hatay↔Kahramanmaraş genelleme (28 boş) + il-dışarıda-bırakma satırı + oran sütunu + yalnız-KATE-PD kontrol |
| 14 | A-17 · B-07 | **Tablo 21** — bileşen çıkarma: kayıp ağırlıkları, focal α, morfoloji, r_h, λ(d), V₀, risk ağırlıkları (r_h/λ satırları KALAN'da tamamlandı, kalan 5 satır GPU) |
| 15 | KALAN · B-03 · §8.1 | **Tablo 24** — YOLOv8 çatlak+bina mAP@0,5 (defter hazır, yeni Roboflow anahtarı gerekli) |
| 16 | J-20 · J-25 · J-26 | **Model kalitesi/çözünürlük koşumları** — senaryo Maxar'ın 1/8 çözünürlüğünü veriyor (z=15); z21/z22 defteri hazır; drone sahnelerinde yol ağı kilitleniyor (9 atamadan 1 rotalandı); yol kesinliği %14–20 |

### Dış sınamalar (hazırlık sonrası, çoğu yalnız çıkarım)
| # | Kaynak | İş |
|---|---|---|
| 17 | §9-D11 · Ç-05 · Ç-08 · Ç-09 | HaitiBRD / Noto / HOTOSM üzerinde tüm modeller: piksel IoU + bina düzeyi P/R/F1/AUPRC |
| 18 | Ç-03 · §9-D12 | **TE23D yeniden üretimi** — SegFormer-B4'ü TE23D bölmesinde eğit, onların formülleriyle ölç (56,98 ile birebir kıyas) |

---

## 3) 🟠 VERİ HAZIRLIK (indirme, konumlandırma, maske temizliği — çoğu Utku)

**Veri setleri (QM-VS):**
- **QM-VS01 KATE-PD** — HF parquet + CodeOcean konum ızgaraları (`grid_maxar.geojson` vb.); mekânsal `bolme_listesi.csv`
- **QM-VS02 KATE-CD (yalnız öncesi)** — 486 `pre_image` boş maskeli negatif; histogram eşle
- **QM-VS03 MEDBFS** — `Turkey.zip` 3,33 GB; EPSG:32637 + 256 adım; CRS etiketi yok
- **QM-VS04 QQB** — bina listeleri + 4 Maxar ARD karo (~314 MB) + Overpass; `qqb_osm.py→qqb_karola.py→qqb_bolme.py`
- **QM-VS05 TUE-CD** · **QM-VS06 HaitiBRD** (yol etiketi de var) · **QM-VS07 HOTOSM** · **QM-VS08 TE23D** (2,3 GB) · **QM-VS11 Noto** (GeoPackage 47,9 MB + Maxar ~391 MB)
- **QM-VS09 BRIGHT** / **QM-VS10 xBD/xView2** (sonra; ön eğitim adayı)
- **QM-VS12 Microsoft ürünü** / **QM-VS13 ÇŞB** / **QM-VS14 L'Aquila** — erişim/lisans araştırması

**Düzeltme/temizlik adımları:**
- **A-18 · Ç-02 · §6.5-#3** — QQB'de 95 hasar etiketli "sağlam" bina → maskede **255 (yok say)**; dış sınamanın 51 sınama-bloğu karosunu ayrı raporla (23'ü doğrulamada); dağlık kesim etiketsiz bina denetimi; hasarlı 39 karo fazla örnekleme
- **Ç-01 · Ç-05 · §6.5-#3** — genel **`ignore_index=255`** (bulut/gölge/belirsiz). Notebook altyapısı eklendi
- **Noto** — `damage_val`: 9→255, 99→çıkar; kayma denetimi (21°'de ~5 px)
- **HOTOSM** — İslahiye 317 kayıt QQB ile mükerrer; ilçe tamlık denetimi olmadan eğitime girmez
- **TUE-CD** — konumlandır (Maxar şablon eşleştirme), maske oturma denetimi (KATE-PD sızıntı riski)
- **Sızıntı kuralı** — konumu bilinmeyen küme konumlandırılmadan eğitime girmez; doğr./sınama bloklarına düşen karolar eğitimden çıkar; aynı binanın farklı görüntüleri aynı bölmede

---

## 4) 🟠🟡 KOD (yerel — GPU gerekmez)

| # | Kaynak | İş |
|---|---|---|
| 19 | KALAN · Tablo 16 | **"Dokuz senaryo" gecikme ölçüm scripti repoda yok** — bulunup/yeniden yazılıp koşulmalı ya da tablo "yeniden üretilemedi" işaretlenmeli |
| 20 | KALAN · D-09 | **`analyze4.py` bölge-ayrımlı çıktı vermiyor** — genişletilmeli; risk yeniden koşumu `leaderboard.csv`'den 2 naif tabanı sildi, geri eklenmeli |
| 21 | D-01 · J-21 | **Google Earth karoları → Maxar Open Data** — `fetcher.py` yayında kullanılamaz; koşumlar taşınmalı |
| 22 | D-02 · D-03 · D-05 | CSV'de SegFormer değeri yanlış sütunda (`mean_iou`); `01_yol_hasari` aslında bina verisi (yeniden adlandır/README); defter CONFIG'i koşulan hiperparametrelerle uyuşmuyor |
| 23 | D-06 | **Word'deki 17 denklem ham LaTeX** — `.md`→`md2docx.py` ile gerçek alt/üst simgeyle yeniden üret |
| 24 | E-04 · A-08 | **NLP kuralı kodda uygulanıp yeniden ölçülmeli** — 6 ihbarın 2'si eleniyordu; çok-etiketli iki eşik (0,30/0,50) |
| 25 | J-07 · J-09 · J-10 · J-11 · J-18 · J-13 | **Backend performans** — senkron uçlar GIL'i tutuyor (ProcessPool/async); `_nearest_graph_node` O(n)→KD-ağacı; soğuk başlangıç; 5 polling→tek `/api/live/state` veya SSE; `/status` 17 MB; geocoding yerel sözlük (23→~4 sorgu, senaryo yeniden koşulur) |
| 26 | C-02 · C-03 · C-04 · C-05 | **Uygulanmamış yetenekler** — karo kalite filtresi (Laplacian); çok-kipli füzyon (S=w₁P_seg+w₂P_nlp); BLE mesh; risk modülünün sevk zincirine bağlanması (ya uygula ya gelecek-çalışma olarak konumlandır) |

---

## 5) 🔵 MAKALE — YAZIM & DÜZELTME

**Yöntem boşlukları (yeni alt bölüm/tanım yazılmalı):**
- **A-06** Bölüm 3.10 "Sentetik Kapanma Üretimi" (algoritma, sayı, tohum, EMSR648 kalibrasyonu) · **A-07** ekip–hedef atama kuralı (Algoritma 2) · **A-08** tek/çok-etiketli çelişki + iki eşik · **A-09** üç geçilebilirlik kuralı tablosu + atıf düzeltme · **A-10** yakınlaştırma seçimi (cos φ, karo boyutu) · **A-11** λ(d) ilk basamağı r_h örtüşmesi · **A-12** kenar orta noktası ölçütü tutarlılığı

**İç çelişki/tutarlılık:**
- **A-04** artçı ayıklaması Bölüm 3.7 ↔ 4.11 çelişkisi (`run_all_risk.py` kontrol) · **A-13** Bölüm 4.1.1 "4.2 sonra raporlanacak" (zaten yürütülmüş) · **A-02/A-03** Öz/Abstract 0,4276 iddiası koşullu hâle

**Çoklu tohum sonuçları işlenmeli (veri hazır, yazım kaldı):**
- **J-29** Tablo 16–19 tek koşu → 10 tohum ort.±ss; görev düzeyi p kullanma · **J-31** R1/R2 satırları 10 tohumla doldur, "koşulmadı" cümlesini kaldır · **J-28** kapanma kaynağına göre kazanç (206,6/1641,0 dk güncelle) · **J-30** Tablo 18 model-kapanma sonucu (SegFormer için olumsuz) işlenmeli

**Atıf/sayı düzeltmeleri (§8.4):** P38 (TE23D bina değil enkaz), Tablo 1 TUE-CD/TE23D satırları, TE23D %74,45=mIoU/56,98=IoU, P56/P276/P452 [7] derleme, P47 "Mosalam", Microsoft künye (Robinson MSR-TR-2023-7), ilgili çalışmalara ekleme (Hacıefendioğlu, RAPID-A, DA-SegFormer, Noto), "uydudan görünür hasar" paragrafı (Ainscoe 2025, optik %8–17), EMS-98 doğru ad

**Placeholder/onay:**
- **A-17** 86 `[ÖLÇÜLECEK]` + 6 `[TARANACAK]` (τ) doldur · **855 sarı vurgu** okunup onaylanmalı · Bölüm 4 girişi + iskelet tablolar yeniden yaz · 41 "henüz yapılmadı" cümlesi güncelle
- **B-13** Türkçe metin kümesi künyesi (305 kayıt: kaynak, etiketleme yönergesi, etiketleyici sayısı, erişim)

---

## 6) ⚫ KULLANICI KARARLARI (bilinçli açık bırakılanlar dahil)

| # | Kaynak | Karar |
|---|---|---|
| 27 | KALAN · §8.2 | **NLP kümesi veri erişim politikası** (açık / istek üzerine / kapalı) — "kendim karar veririm" denildi, placeholder duruyor |
| 28 | KALAN · B-02 · Tablo 5 | **Tablo 5 / yol hasarı kümesi** — (a) kendi küme etiketle / (b) CAU-RoadDamage dış test / (c) gelecek çalışma. KALAN'da (c) seçildi; öneri: bina hasarı kümeleri künyesine çevir |
| 29 | A-15 · §9-B3 | **Eğitim protokolü** (P2 mi P2+QQB mi) + **tohum sayısı** |
| 30 | §6.5-#4 · Ç-05 | **"Hasarlı" tanımını kümeler arası eşle** (EMS-98 D3 dahil mi) |
| 31 | Bölüm 3.3 V₀ | `[GELECEK ÇALIŞMA]` kalsın mı yoksa yerelde ölçülsün mü (öneri: ölç) |
| 32 | F-01 · F-02 | **Git:** 15 commit upstream'e gönderilsin mi; 123 commit edilmemiş dosyadan (14 değişmiş + 109 izlenmeyen) hangileri depoya girsin |
| 33 | E-01 | **EMSR648 kapsam-dışı 4 ilçe** (İskenderun, Samandağ, Belen, Pazarcık) hâlâ sentetik (~%6 kenar açık); "Damaged=ceza" kuralı uygulansın mı |

---

## 7) 📊⚪ AKADEMİK TAMLIK & DENETLENMEMİŞ ALANLAR (düşük öncelik / bilinen bilinmeyenler)

**Akademik tamlık:**
- **B-11 · KALAN** İstatistiksel anlamlılık testi/güven aralığı yok (Tablo 17/18/22/23 — yalnız ort.±ss); 18 eşleştirilmiş görev için Wilcoxon + etki büyüklüğü
- **KALAN** Ayrı "Finansman" başlığı yok (TÜBİTAK 2209-A yalnız Teşekkür'de)
- **A-05** İki naif risk tabanı (fay mesafesi, sismisite) Tablo 22'de yok
- **B-08/B-10** GFLOPs/çıkarım süresi (Tablo 12); gecikme n=2 → ≥100 tekrar medyan/p95/p99
- **B-12** Şekil 9 (görsel bölütleme karşılaştırması) üretilmemiş

**Yalnız ölçüm/analiz (GPU'suz, çoğu Furkan):**
- İnsan tavanı (2 etiketçi IoU); kümeler arası etiket uyumu (İslahiye/Türkoğlu — 0,086 çözünürlük mü etiket mi, §6.5-#8a); protokol duyarlılık tablosu (Ç-03: bizim/yalnız-hasarlı/rastgele); bina düzeyi ölçütler; ShakeMap MMI katmanlaması; risk ağırlığı duyarlılığı (Tablo 21); geometri/kayma denetimi; **J-22 r_h kalibrasyonu** (25 m'de gerçeğin ~8 katı yol kapatıyor — EMSR648 4 bölgede kalibre)

**IoU iyileştirme deneyleri (§6.5, isteğe bağlı kollar):** gerçek-sonrası negatifler, hasarlı fazla örnekleme, çözünürlük dayanıklılığı/çok-ölçekli çıkarım, radyometrik uyum, hasar-yapıştırma artırması, kar/aydınlatma, topluluk+TTA, SLIC süperpiksel oylaması+morfoloji, derin denetim, SegFormer-B5/UNet++/Mask2Former

**Denetimin kapsamadığı (KALAN ⚪ — "hiçbir şey kaçmadı" garantisi yok):**
- `fastapi_app.py` (1700+ satır) satır satır incelenmedi (PostGIS/dosya-yol/girdi doğrulama)
- `quakemind-web/src` (Next.js) + `quakemind/lib` (Flutter) sistematik taranmadı
- Kaynakça [1]-[64] atıfların gerçek içeriği doğrulanmadı (internet erişimi gerekir)
- Öncelik-2 okuma listesi + "yalnız atıf" kaynakların birincil metinden doğrulanması (Nex 2019, Xu 2019, vb.)

**Kapsam sınırı (eylem DEĞİL):** Xie 2022 (%62,43) ve Song 2020 sayıları kapalı-erişim olduğu için makaleye yazılmayacak — yalnız yöntem düzeyinde anılır.
