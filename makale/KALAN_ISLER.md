# QuakeMind Makalesi — Kalan İşler

_Son güncelleme: 2026-09-18. Bu dosya, `QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3.docx`
üzerinde yapılan kod-vs-makale denetimi ve rota/görev-orkestrasyonu yeniden inşası sonrasında
geriye kalan açık maddeleri listeler. Tamamlanan işler (yol hasarı bölütlemesi/kesişim düzeltmesi,
Algoritma 1-3'ün gerçek OSM+EMSR648 verisiyle yeniden koşulması, Tablo 10/17/18/20 güncellemesi)
bu listede yer almıyor — onlar zaten docx'e işlendi.

## 🔴 Bulundu, henüz düzeltilmedi (kod denetiminden)

1. **Isı haritası (Bölüm 3.1)** — "çekirdek yoğunluk kestirimine dayalı ısı haritası" iddiası
   kodda karşılığı olmayan bir özellik. Tek bulunan heatmap (`earthquake_risk/map_visualizer.py`)
   deprem risk skoru yoğunluğu gösteriyor, yıkım/kapanma değil. Metinden çıkarılmalı ya da
   gelecek çalışmaya taşınmalı.
2. **Risk skorlama declustering çelişkisi (Sınırlılık (n), Tablo 24)** — makale "declustering
   uygulanmadı" diyor, kod (`risk_engine.py`, `common_preprocessing.py`) zaten uyguluyor.
   Ayrıca Tablo 24'teki n=454/temel oran 0,687 sayılarının kaynağı bulunamadı; gerçek değerler
   n=375, temel oran 0,731 (`leaderboard.csv`).
3. **YOLO Tablo 7** — bina modelinin "Kritik işaretleme: —" hücresi yanlış (kod sınıf adına göre
   CRITICAL işaretliyor). "Hibrit kipte çatlak kutuları bina kutularının içine yerleştirilir"
   iddiası kodda yok (iki model bağımsız çalışıp sonuçlar birleştiriliyor).
4. **NLP ölü kod iddiası (Bölüm 3.6)** — "kök/ek ayrıştırması hem kurallarda hem normalleştirmede
   kullanılıyor" deniyor; `pipeline.py`'de hesaplanıp hiç kullanılmayan bir değişken.
5. **Güvenlik** — `model_benchmarks/03_yer_seviyesi/local_colab_run/00_catlak_bina_yolo.ipynb`
   içinde açık yazılı bir Roboflow API anahtarı var. Repo herkese açılmadan önce anahtar
   Roboflow'dan döndürülmeli ve defterden temizlenmeli.

## 🟡 GPU/Colab bekleyen

6. **Tablo 13** — SegFormer satırının aynı 3'lü (eğitim/doğrulama/sınama) mekânsal blok
   bölmesiyle yeniden değerlendirilmesi (mevcut checkpoint:
   `QuakeMindBackend/apps/road_damage/models/optimized_mitb4_focal_dice30.pth`).
7. **Tablo 15** — Hatay↔Kahramanmaraş bölgeler arası genelleme (bina hasarı bölütleme modeli;
   `model_benchmarks/02_bina_hasari` ağırlıkları yalnız Colab'da, yerelde yok).
8. **Tablo 24** — YOLOv8 çatlak+bina mAP@0,5 / mAP@0,5:0,95
   (`model_benchmarks/03_yer_seviyesi/local_colab_run/00_catlak_bina_yolo.ipynb`, gerçek
   Roboflow projelerine atıf yapıyor ama hiç çalıştırılmamış — Roboflow API anahtarı gerekiyor).

## ⚪ Karar bekleyen

9. **Tablo 5** — yol hasarı için piksel-etiketli eğitim kümesi: (a) kendi kümemizi etiketle,
   (b) CAU-RoadDamage'ı harici test kümesi olarak kullan, (c) bu sürümde açıkça gelecek
   çalışmaya bırak. Bu karar, Tablo 14 (6 model × 3 kural kapanma değerlendirmesi) ve yol
   ekseninde çoklu-mimari karşılaştırmayı (Tablo 24 ilgili satırı) da blokluyor.

## ⚫ Hiç başlanmadı

10. **Tablo 21** — bileşen çıkarma ve parametre duyarlılığı (ağırlıklı pencere harmanlama,
    morfolojik son işleme seviyesi, kayıp bileşim ağırlıkları, sert kapatma yarıçapı r_h,
    ceza basamakları λ(d), karo kalite eşiği V₀, risk skoru ağırlıkları). r_h/λ(d) ekseni,
    `model_benchmarks/06_rota/real_run/` altındaki mevcut rota koduyla nispeten kolay
    genişletilebilir; diğerleri ilgili model eğitim döngülerini gerektiriyor.
11. **Şekil 3** (çalışma alanı haritası) ve **Şekil 10** (güzergâh karşılaştırma haritası) —
    docx'e gömülü görsel yok, sadece yer tutucu metin var. Şekil 10 için artık gerçek rota
    verisi mevcut (`model_benchmarks/06_rota/real_run/results/full_run.json`); Şekil 3 için
    bölge sınırı/harita üretimi gerekiyor.

## Referans: bu sürümde eklenen gerçek kod

- `model_benchmarks/06_rota/real_run/` — Algoritma 1 (`naive_agent.py`), Algoritma 2
  (`synthetic_closures.py`), Algoritma 3 (`assignment.py`), EMSR648 eşleme
  (`emsr648_closures.py`), görev kilitleme (`task_locking.py`), sahne/bölge tanımları
  (`scenario.py`), orkestrasyon (`run_full.py`), analiz (`analyze*.py`).
- Gerçek EMSR648 MONIT01 verisi: `QuakeMindBackend/apps/road_damage/data/emsr648/{AOI04,AOI11}/`
  (Copernicus EMS'ten indirildi, 2026-09-17).
- Ham koşum çıktısı: `model_benchmarks/06_rota/real_run/results/full_run.json` ve
  `analysis_summary.json` (8 bölge × 10 tohum × 6 görev, R0/R1/R2/R3).
