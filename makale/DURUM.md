# QuakeMind Makalesi — Güncel Durum ve Yapılacaklar (TEK KAYNAK)

_Son güncelleme: 2026-09-21_

> **Bu dosya tüm eski liste/durum dosyalarının yerine geçer.** Önceki dosyalar
> (`UTKU_ICIN_LISTE.md`, `EKSIKLER_VE_SORUNLAR_2026-09-19_guncel.md`,
> `KALAN_ISLER.md`, `TUM_EKSIKLER_KONSOLIDE_2026-09-20.md`,
> `OTURUM_DURUMU_2026-09-21.md`) bu belgede birleştirildi ve kaldırıldı.
> Kaynak kimlikleri (A-16, Ç-03, D-02, J-22, §6.5-#7b …) izlenebilirlik için korundu.

**Güncel docx:** `QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3_LOCAL_2026-09-21.docx`
**Eski docx/yedek/PDF:** `makale/arsiv/` altına taşındı.

**İş bölümü:** Utku = eğitim/koşum (GPU/Colab). Furkan = veri kararları, yerel
ölçümler, makale düzeltmeleri, dış iletişim. "Sen/Kullanıcı" = karar veya dış
eylem gerektiren maddeler. Öncelik: 🔴 kritik · 🟠 önemli · 🟡 orta · 🔵/⚪ düşük.

---

## ✅ BÖLÜM A — 2026-09-21 oturumunda TAMAMLANANLAR

> **Önemli bulgu:** docx, eski denetim listelerinden çok daha ileri durumdaydı —
> Bölüm 3'ün tüm alt bölümleri, çoklu tohum sonuçları, GFLOPs/gecikme, Şekil 9 ve
> kaynakça (G-01/02/03) zaten çözülmüştü. Aşağıdakiler doğrulandı ve yeni bulunan
> gerçek hatalar düzeltildi.

### Kod (GPU gerekmedi)
- **D-02** — `01_yol_hasari/.../00_comparison_table.csv`: SegFormer 0,4276 yanlış `mean_iou` sütunundaydı; `iou_fg` sütunu eklendi, CSV + `00_comparison_chart.png` yeniden üretildi.
- **D-03** — `01_yol_hasari/README.md`: klasörün aslında KATE-CD+MedBFS **bina** verisiyle koşulduğu uyarısı eklendi.
- **D-05** — `01_yol_hasari/seg_common.py` CONFIG'i, fiilen koşulan `build_notebook.py` değerleriyle hizalandı.
- **D-01** (kısmi) — `road_damage/utils/fetcher.py`'ye Google/Maxar netliği eklendi (akademik koşumlar Maxar, Google yalnız canlı). _Not: koşumların Maxar'a fiilen taşınması hâlâ açık — bkz. B-4 item 21._
- **D-09** — `06_rota/real_run/analyze4.py`'ye bölge-ayrımlı (H-Z1/K-Z1) çıktı eklendi (önceki elle doğrulamayla birebir eşleşti); `05_risk_skoru/run_all_risk.py`'ye 2 naif taban (fay mesafesi, sismisite) leaderboard'a geri eklendi.
- **E-04** — `disaster_nlp/src/classification.py`: anahtar kelime kurtarma 5 üst kategoriye genişletildi; düşük güvenli+kurtarılamayan kayıtlar artık "Alakasız" yerine "Belirsiz" kuyruğuna gidiyor (sessizce silinmiyor). `ner_extraction.py`'de Türkçe noktasız "ı"→"i" normalizasyon hatası düzeltildi.
- **Backend perf** — `local_osm.py` `_nearest_graph_node` O(n)→scipy `cKDTree` O(log n) (200/200 test birebir); `/status` 17MB gövde → 6 diagnostik görsel B64 yerine ikili endpoint'ten (`/api/road_damage/image/{id}/{kind}`), web + Flutter güncellendi; geocoding için `tr_locations.py`'ye yerel il/ilçe koordinat sözlüğü, sorgu sayısı 23→4.
- **requirements.txt** — eksik `scipy`, `xgboost`, `lightgbm` eklendi.
- **Tablo 16 "dokuz senaryo" scripti** — repoda bulunamadığı doğrulandı (kod tarafında yapılacak yok; tablo bu şekilde bırakıldı).

### Docx — doğrulandı (değişiklik gerekmedi)
- Bölüm 3 alt bölümleri (Sentetik Kapanma 3.8.1, atama Algoritma 3, geçilebilirlik Tablo 4, cos φ, λ(d)/r_h notu) zaten mevcuttu (A-06…A-12).
- Kaynakça G-01/G-02/G-03 zaten düzeltilmişti.
- Çoklu tohum sonuçları (Tablo 16-20), GFLOPs/gecikme n=100 (Tablo 12), Şekil 9 zaten mevcuttu (J-28/29/30/31, B-08/10/12).
- Uygulanmamış yetenekler (karo kalite filtresi, çok-kipli füzyon, risk-sevk zinciri) dürüstçe "gelecek çalışma" işaretliydi (C-02…05). BLE mesh makalede hiç anılmıyor.

### Docx — düzeltilen çelişkiler
- **P93/P292** — "yol hasarı kümesi oluşturulacaktır" eski taahhüt dili, (c) "gelecek çalışma" kararıyla tutarlı hâle getirildi.
- **P145** — NLP "Belirsiz" kuyruğu cümlesi P147 ve kodla tutarlı yapıldı.
- **FİNANSMAN** — TÜBİTAK 2209-A, TEŞEKKÜR'den ayrı kendi başlığına taşındı.

### Docx — Risk skorlama bölümü TAMAMEN yeniden üretildi (büyük bulgu)
Commit `94ecf57`'deki `dropna()` düzeltmesi sonrası gerçek veri kümesi **n=13.609,
pozitif oran 0,298** (eski hatalı: 454 satır / 0,687). `run_all_risk.py` eksik
kütüphanelerle koşuldu; **en iyi model artık lojistik regresyon** (CatBoost 4.
sırada — üretim hâlâ CatBoost ama artık ölçülen üstünlükle değil, önceden alınmış
mühendislik kararıyla gerekçelendiriliyor). Güncellenenler: Tablo 23 (tüm satırlar),
Şekil 16-20 (7 gömülü PNG), Bölüm 3.7/4.11 declustering ("uygulanmadı"→"uygulandı,
sınırlılık sabit 1 gün/50 km pencere"), Sınırlılık (n), ~10 paragraf, Tablo 21
ablasyon referansı. (A-04, A-05 kapandı.)

### Docx — E-04'ün senaryoya etkisi: tam yeniden koşum
`run_full.py` (8 bölge × 10 tohum × 4 kaynak) düzeltilmiş `classification.py` ile
yeniden koşuldu; `analyze*.py` yeniden çalıştı. Manşet **189,6±205,9 → 184,9±200,2
dk**; Kahramanmaraş orta/gevşek fark **39,1 → 44,4 dk**. Güncellenenler: Özet (P8),
Abstract (P13), Tablo 17/18/20, 11 paragraf. Eski sayı kalmadığı taramayla doğrulandı.

---

## ⚠️ BÖLÜM B — HÂLÂ AÇIK İŞLER

### B-0 · Kararsız/beklemede: J-22 (r_h kalibrasyonu) — docx'e YAZILMADI
`06_rota/real_run/_j22_calibration.py` yazıldı (gerçek Esri Wayback [2023-02-23,
id=57965] + gerçek SegFormer + gerçek EMSR648). Tek temiz örneklem (H-Z1-A,
Antakya): r_h=25m'de model %2,1 yol kapatıyor, EMSR648 %13,2 → model **eksik**
kapatıyor; r_h=100m'de örtüşüyor. Bu, makaledeki "r_h=25m'de ~8 kat fazla kapatıyor"
bulgusunun **tam tersi**. Tek örneklemle gerçek bulgu mu metodoloji hassasiyeti mi
ayırt edilemez → docx'teki dürüst "tek örneklem, kalibrasyon için yetersiz" notu
korundu.
- **Kalan dosyalar:** `_j22_calibration.py` (çalışır), `results/j22_calibration.json` (ilk hatalı bbox koşumu), `results/j22_calibration_kz1.json` (boş, Overpass zaman aşımı).
- **Yapılacak (isteğe bağlı):** Overpass erişilince K-Z1 örneklerini tamamla; H-Z1'e 2-3 örnek daha ekle; yine de resmî "kalibrasyon" iddiası yerine ek gözlem/duyarlılık notu olarak girmesi daha savunulabilir.

### B-1 · 🔴 GÜVENLİK & DIŞ EYLEM (yalnız kullanıcı/insan)
| # | Kaynak | İş | Not |
|---|---|---|---|
| 1 | D-08 · §8.1 | **Roboflow API anahtarını iptal et + yenisini üret** | `origin/makale` git geçmişinde açık (2 commit: `9d4cc22`, `55a50d1`); kod placeholder'a taşındı ama geçmiş temizlemek anahtarı geçersiz kılmaz. Yeni anahtar Tablo 24 YOLO koşumu için de gerekli |
| 2 | — | (İsteğe bağlı) **git geçmişini temizle** | `git filter-repo`/BFG + force-push — yıkıcı, ayrı onay gerekir |
| 3 | auth | **`QUAKEMIND_DEMO_TOKEN=false`** (üretim dağıtımı) | `"demo-token"` ile kimlik doğrulama atlanabiliyor; kod flag'e bağlı, dağıtımda kapat |
| 4 | Ç-03 · Ç-07 | **Veri seti lisans teyidi (dış iletişim)** | TE23D yazarları (CC BY-NC-ND vs "tüm hakları saklıdır" çelişkisi); TUE-CD (README'de lisans yok) |
| 5 | Ç-13 · §9 | **ÇŞB'den hasar tespit verisi talebi** (isteğe bağlı) | En güçlü bağımsız yer gerçeği; csb.gov.tr / KEP |

### B-2 · 🔴🟡 GPU/COLAB — EĞİTİM VE ÇIKARIM (Utku)
**Ana protokol**
| # | Kaynak | İş |
|---|---|---|
| 7 | A-01·A-15·D-07·Tablo 13 | **9 modeli aynı bölme/ölçüt/tohumla yeniden eğit.** SegFormer 0,4276 sadece doğrulama skoru. 3 grup: MiT-B4 (SegFormer/U-Net/FPN/DeepLabV3+/UPerNet) + DeepLabV3+ R101 + UPerNet ConvNeXt-S + ölçek (B0/B2) |
| 8 | Ç-04·§6 | **U-Net ResNet-18 taban satırı** — Türkiye 2023 emsaliyle (0,394) köprü |
| 9 | A-16·§6.5-#2 | **Mekânsal bölme + negatif örnek** ile yeniden eğit (`optimized_training_colab.ipynb` kısmen uyguluyor; tam 2 km-blok bölme `QuakeMind_veri/bolme.py` gerektirir) |
| 10 | A-19·§6.5-#7 | **Focal α taraması** α∈{0,25·0,5·0,75} + kayıp/eşik taraması (Tablo 21) |
| 11 | §9-B5 | **En iyi 3 model × 3 tohum** (tohum 42/7/2026). _Karar: model başına **10 tohum** (bkz. B-6 item 29)._ |

**Tablo/şekil doldurma (eğitim çıktısına bağlı)**
| # | Kaynak | İş |
|---|---|---|
| 12 | Tablo 13/14·A-17·B-05 | Kapanma katmanı EMSR648 kesim-düzeyi değerlendirme (36 boş hücre) + τ taraması |
| 13 | Tablo 15·A-20·B-06·Ç-16 | Hatay↔Kahramanmaraş genelleme (28 boş) + il-dışarıda-bırakma + oran sütunu + yalnız-KATE-PD kontrol |
| 14 | Tablo 21·A-17·B-07 | Bileşen çıkarma: kayıp ağırlıkları, focal α, morfoloji, r_h, λ(d), V₀, risk ağırlıkları (r_h/λ satırları tamam, 5 satır GPU) |
| 15 | Tablo 24·B-03·§8.1 | YOLOv8 çatlak+bina mAP@0,5 (defter hazır, yeni Roboflow anahtarı gerekli — item 1) |
| 16 | J-20·J-25·J-26 | Model kalitesi/çözünürlük koşumları (z15 Maxar 1/8; z21/z22 defteri hazır; drone yol ağı kilitleniyor) |

**Dış sınamalar (çoğu yalnız çıkarım)**
| # | Kaynak | İş |
|---|---|---|
| 17 | §9-D11·Ç-05·Ç-08·Ç-09 | HaitiBRD / Noto / HOTOSM: piksel IoU + bina düzeyi P/R/F1/AUPRC |
| 18 | Ç-03·§9-D12 | **TE23D yeniden üretimi** — SegFormer-B4'ü TE23D bölmesinde eğit, onların formülleriyle ölç (56,98 birebir kıyas) |

### B-3 · 🟠 VERİ HAZIRLIK (indirme/konumlandırma/maske temizliği — çoğu Utku)
**Veri setleri (QM-VS):** KATE-PD (HF parquet + CodeOcean ızgaraları), KATE-CD
(486 negatif), MEDBFS (Turkey.zip 3,33 GB), QQB (4 Maxar ARD karo ~314 MB),
TUE-CD, HaitiBRD, HOTOSM, TE23D (2,3 GB), Noto (GeoPackage + Maxar ~391 MB),
BRIGHT / xBD (ön eğitim adayı), Microsoft/ÇŞB/L'Aquila (erişim araştırması).

**Düzeltme/temizlik:**
- **A-18·Ç-02·§6.5-#3** — QQB'de 95 hasarlı "sağlam" bina → maskede 255 (yok say); 51 sınama karosu ayrı rapor; hasarlı 39 karo fazla örnekle.
- **Ç-01·Ç-05** — genel `ignore_index=255` (bulut/gölge/belirsiz); notebook altyapısı hazır.
- **Noto** — `damage_val`: 9→255, 99→çıkar; kayma denetimi (~5 px).
- **HOTOSM** — İslahiye 317 kayıt QQB ile mükerrer; ilçe tamlık denetimi olmadan eğitime girmez.
- **TUE-CD** — Maxar şablon eşleştirme ile konumlandır; KATE-PD sızıntı riski denetimi.
- **Sızıntı kuralı** — konumu bilinmeyen küme konumlandırılmadan eğitime girmez; doğr./sınama bloğu karoları eğitimden çıkar; aynı binanın farklı görüntüleri aynı bölmede.

### B-4 · 🟠🟡 KOD (yerel — GPU gerekmez)
| # | Kaynak | İş |
|---|---|---|
| 21 | D-01·J-21 | **Google Earth karoları → Maxar Open Data** — `fetcher.py`'ye netlik notu eklendi ama koşumların Maxar'a fiilen taşınması açık |
| 23 | D-06 | **Word'deki 17 denklem ham LaTeX** — `.md`→`md2docx.py` ile gerçek alt/üst simgeyle yeniden üret |
| 26 | C-02…C-05 | **Uygulanmamış yetenekler** — docx'te "gelecek çalışma" işaretli; istenirse uygula (karo kalite filtresi, çok-kipli füzyon, risk-sevk zinciri, BLE mesh) |

### B-5 · 🔵 MAKALE — YAZIM & DÜZELTME (çoğu GPU çıktısına bağlı)
- **Placeholder:** 86 `[ÖLÇÜLECEK]` + 6 `[TARANACAK]` (τ) — eğitim/ölçüm sonrası doldur; **855 sarı vurgu** okunup onaylanmalı; Bölüm 4 girişi + iskelet tablolar; 41 "henüz yapılmadı" cümlesi güncelle.
- **Atıf/sayı (§8.4):** P38 (TE23D enkaz), Tablo 1 TUE-CD/TE23D satırları, TE23D %74,45=mIoU/56,98=IoU, P56/P276/P452 [7] derleme, P47 "Mosalam", Microsoft künye (Robinson MSR-TR-2023-7), ilgili çalışmalara ekleme (Hacıefendioğlu, RAPID-A, DA-SegFormer, Noto), "uydudan görünür hasar" (Ainscoe 2025), EMS-98 doğru ad.
- **B-13** — Türkçe metin kümesi künyesi (305 kayıt: kaynak, etiketleme yönergesi, etiketleyici sayısı, erişim).

### B-6 · ⚫ KULLANICI KARARLARI
| # | Kaynak | Durum |
|---|---|---|
| 27 | §8.2 | NLP kümesi veri erişim politikası → ✅ **KARAR: istek üzerine** (docx'e işlendi) |
| 28 | B-02·Tablo 5 | Yol hasarı kümesi → ✅ (c) **gelecek çalışma** seçildi |
| 29 | A-15·§9-B3 | Eğitim protokolü (P2 mi P2+QQB mi) hâlâ açık · tohum → ✅ **10 tohum** kararlaştırıldı |
| 30 | §6.5-#4·Ç-05 | "Hasarlı" tanımını kümeler arası eşle (EMS-98 D3 dahil mi) — **açık** |
| 31 | Bölüm 3.3 V₀ | `[GELECEK ÇALIŞMA]` kalsın mı, yerelde ölçülsün mü (öneri: ölç) — **açık** |
| 32 | F-01·F-02 | Git: commit'ler upstream'e gönderilsin mi; hangi izlenmeyen dosyalar depoya girsin — **açık** |
| 33 | E-01 | EMSR648 kapsam-dışı 4 ilçe (İskenderun, Samandağ, Belen, Pazarcık) hâlâ sentetik; "Damaged=ceza" kuralı uygulansın mı — **açık** |

### B-7 · 📊⚪ AKADEMİK TAMLIK (düşük öncelik)
- **B-11** — İstatistiksel anlamlılık/güven aralığı yok (Tablo 17/18/22/23 yalnız ort.±ss); 18 eşleştirilmiş görev için Wilcoxon + etki büyüklüğü.
- **Yalnız ölçüm (GPU'suz, çoğu Furkan):** insan tavanı (2 etiketçi IoU); kümeler arası etiket uyumu (§6.5-#8a); protokol duyarlılık tablosu; bina düzeyi ölçütler; ShakeMap MMI katmanlaması; risk ağırlığı duyarlılığı; geometri/kayma denetimi.
- **IoU iyileştirme (§6.5, isteğe bağlı):** gerçek-sonrası negatifler, hasarlı fazla örnekleme, çok-ölçekli çıkarım, radyometrik uyum, hasar-yapıştırma, topluluk+TTA, SLIC+morfoloji, derin denetim, SegFormer-B5/UNet++/Mask2Former.
- **Denetlenmeyen (garanti yok):** `fastapi_app.py` (1700+ satır) satır satır; `quakemind-web`/`quakemind` (Flutter) sistematik; Kaynakça [1]-[64] atıf içerikleri (internet gerektirir).
- **Kapsam sınırı (eylem DEĞİL):** Xie 2022 (%62,43) ve Song 2020 kapalı erişim → yalnız yöntem düzeyinde anılır.

---

## 🖼️ BÖLÜM C — BEKLEYEN GÖRSEL İSTEKLERİ

Aşağıdaki 4 görsel **güncel uygulama arayüzünden gerçek veriyle** üretilip bu
isimlerle iletilmeli (PNG, ~300 dpi netlik, tarayıcı çubuğu görünmeden). docx'e
Şekil 21-24 olarak Türkçe alt yazıyla eklenecek.

1. **`1_catlak_tespit.png`** — Çatlak + bina hasarı tespiti. Kaynak: "Çatlak/Hasar Tespit" ekranı, gerçek fotoğraf üzerinde. Görünür: tespit kutuları + sınıf + güven skoru. → Bölüm 3.2.
2. **`2_risk_skoru.png`** — Deprem risk skoru. Kaynak: Risk sayfası, **Hatay veya Kahramanmaraş** (İstanbul/demo OLMASIN). Görünür: gerçek risk skoru + harita/ısı. → Bölüm 4.11.
3. **`3_nlp_harita.png`** — NLP çıktısı haritalı. Kaynak: NLP sayfası, gerçek ihbar metni, sınıflandırma + konum çıkarımı, mümkünse harita pin. → Bölüm 3.6 / 4.10.
4. **`4_isi_haritasi_guzergah.png`** — Isı haritası + güvenli güzergâh. Kaynak: Harita/komuta sayfası tam ekran, ısı katmanı + güzergâh çizili. → Sistem tanıtımı / Bölüm 4.5.

**Bu turda kapsam dışı (GPU/Colab bekliyor):** yol hasarı segmentasyon overlay'i
(SegFormer checkpoint yerelde yok); bina hasarı segmentasyon overlay'i (aynı GPU
engeli). "Etiketlenmiş veri örneği" (2209 raporundaki Şekil 10/12) ayrıca ele alınıyor.
