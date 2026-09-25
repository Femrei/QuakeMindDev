# Sarı Vurgulu Cümlelerin İç Tutarlılık Denetimi — 2026-09-25

Denetlenen girdi: `highlight_dump.txt` (578 segment, 367'si rakamlı) + `tables_dump.txt`.
Yer gerçeği: `06_rota/real_run/results/*.json` ve `05_risk_skoru/local_run/results/*.json`.
**Not:** Bu dosya yalnızca çelişki/şüphe raporudur. Hiçbir düzeltme yapılmamıştır; karar kullanıcıya aittir.

## Özet
- Taranan rakamlı segment: ~367 (tüm P-segmentleri + Tablo 2/4/5/10/12/14/15/16/20/21/22/26 dökümü).
- Bulgu: **2 🔴** (sayısal çelişki), **4 🟠** (şüpheli / doğrulanamaz), **1 🟡** (üslup/atıf).
- Risk skoru ve 8 bölgelik rota blokları büyük ölçüde **tutarlı**.

---

## Çelişki tablosu (en ciddi üstte)

| Konum | Vurgulu iddia (kısa) | Çeliştiği kaynak + değer | Ciddiyet | Öneri |
|---|---|---|---|---|
| **P232** | "Belen (H-Z5) ve Kahramanmaraş merkez (K-Z1) bölgeleri **tüm tohumlarda aynı yarılama düzeyinde** kalmaktadır" | `full_run.json` → **H-Z5 halvings tohuma göre değişiyor: [2,2,1,2,2,1,2,3,1,1]** (1, 2 ve 3 düzeyleri). Sabit olan bölgeler H-Z3 ve K-Z1 (ikisi de tüm tohumlarda 0). K-Z1 iddiası doğru, **H-Z5 iddiası yanlış**. | 🔴 | "Belen (H-Z5)" yerine muhtemelen **Kırıkhan (H-Z3)** kastedilmiş; bölge adını düzeltin. Ayrıca aynı cümledeki "bir ya da iki yarılama düzeyi arasında" ifadesi H-Z5 için ihlal ediliyor (3'e çıkıyor). |
| **P234 / P316 / P447** | Sentetik üreticinin bölge ortalaması kapalı kenar oranı **"%0,55–4,50"**, toplam oran **"%2,84 ± 0,20"** | `full_run.json` (synthetic_info, 10 tohum) hesabı: bölge **ortalamaları %1,32–1,97** (kapalı/toplam kenar); genel ortalama **≈%1,59–1,66**; tek-tohum yayılımı %0,42–2,90. Alternatif payda (kapalı/n0) bölge ort. %3,83–5,89, genel %4,87. **Hiçbir makul hesap %2,84 veya %0,55–4,50 aralığını üretmiyor.** İlginç: ss=0,20 benim bölge-ss'im (0,206) ile örtüşüyor, mean tutmuyor. | 🔴 | Bu sayılar farklı/eski bir koşumdan veya farklı bir paydadan gelmiş olabilir. Tablo 10 "Etkin oran (%)" tanımını ve %2,84 kaynağını `full_run.json` ile yeniden eşleştirin. (Not: dump'ta Tablo 10 yalnız başlık satırı; hücre verisiyle birebir kontrol edilemedi.) |
| **P333** | "Rotalanabilen görev sayısı yönteme göre **430-433/480**" | `analysis_summary.json` table16/table19 → R0=430, R1=430, R2=431, **R3=432**. Fiili en yüksek 432; **433 hiçbir yapılandırmada yok.** | 🟠 | "430-433" → "430-432" olarak düzeltilmeli (bir birim fazla). |
| **T26 r3 / T2 r10** | BERTurk mikro-F₁=0,825, makro-F₁=0,472, n_test=305 | Sağlanan iki sonuç dizininde (06_rota, 05_risk_skoru) **NLP sonuç JSON'u yok** → yer gerçeğiyle karşılaştırılamadı. İç tutarlılık: n_test=305, T2 (2028→1418/305/305) ve T26'da uyumlu. | 🟠 | Sayılar iç tutarlı ama harici doğrulanamaz; NLP sonuç dosyası eklenip çapraz kontrol edilmeli. |
| **T26 r8 / Tablo 19 (T20)** | Drone/SegFormer rota deneyi "**90 görev, 10 tohum**", "üç drone sahnesi" | Ana 8-bölge koşumu 10 tohum (42–51) `full_run.json` ile **doğrulandı**. Ancak drone SegFormer **rota** tablosunun tohum boyutu sağlanan JSON'larda yok (`table14_segformer_closure.json` deterministik kapanma örtüşmesi, tohumsuz, 6 örnek/"3 sahne"). small_validation=3 tohum, j22 kalibrasyon=3 tohum. **Görevin "fiilen 2 tohum" hipotezine dair kanıt bulunamadı**; ama drone rota deneyinin 10 tohumu da doğrulanamadı. | 🟠 | Drone rota (Tablo 19) tohum sayısını üreten koşum çıktısını sağlayıp "10 tohum" ifadesini teyit edin. "6 örnek" vs "3 sahne" ifadesini de netleştirin. |
| **P232 / Tablo 10 atfı** | "On tohumda bölge başına elde edilen **etkin oranlar** Tablo 10'da" | `table10_style` mean_effective_rho = %6–18 (0,06–0,18); bu, P316'daki kapanma oranı anlatısıyla (%0,55–4,50) aynı büyüklükte değil. "Etkin oran" sütunu ρ mi yoksa kapalı-kenar oranı mı belirsiz. | 🟡 | Tablo 10 "Etkin oran (%)" sütununun tanımını (effective_rho mı, kapalı/toplam kenar mı) metinde netleştirin; iki kavram karışıyor olabilir. |

---

## Çelişki bulunmayan (tutarlı) bloklar — özet

- **Risk skoru (P419, P421, P428, T26 r4):** n=13609 ✓ (`dataset_info.json`), temel oran 0,298 ✓, Lojistik PR-AUC 0,4231 / ROC-AUC 0,6370±0,0637 / Brier 0,2441 ✓ (`logistic_regression.json`), CatBoost PR-AUC 0,3607 / ROC-AUC 0,5928±0,0388 / Brier 0,2295 ✓ (`catboost.json`), yedi model ✓ (`leaderboard.csv`), kesik çizgi ROC-AUC=0,5 ✓. **Tam tutarlı.**
- **8-bölge sentetik rota (P350–P356, P444, P349):** görev başına fark 172,1 dk ✓ ve %97,4'ü ceza (8,3837×20/172,1=%97,4) ✓, R3 12,8±8,3 dk ✓, R0 184,9±200,2 dk ✓ (`analysis_summary.json` table16), R1 payı %2,3 / R2 payı %5,1 ✓ (table19'dan hesap), t_u=0 tabanı %25,6 ✓ (table17), K-Z1 24970 / H-Z5 2858 kenar ~9 kat ✓ (table10). **Tutarlı.**
- **EMSR648 kapanma (P312–P315, P380, P381, P448, P482):** kenar sayıları `full_run.json emsr648_closed_counts` ile eşleşiyor — K-Z1 orta/gevşek **406 kenar** ✓, katı 0 ✓; Hatay katı 70 / orta-gevşek 194 kenar. Prose'daki **kesim** sayıları (Hatay 39/70/73; K.Maraş 0/134/134) ve yüzdeler (39/4613=%0,85; 70/4613=%1,52; 134/7843=%1,71 …) aritmetik olarak doğru; kesim↔kenar ayrımı (134 kesim → 406 kenar) tutarlı. **Tutarlı** (payda 4613/7843 kesim toplamları JSON'da yok, doğrulanamadı ama iç aritmetik doğru). |
- **Tablo 14 SegFormer (T14):** τ=0,40, DP=0, YN=180, YP=136, F₁=0 ✓ birebir `table14_segformer_closure.json` (tau 0,40, medium/loose). **Tutarlı.**
- **Tablo 19 / T20 SegFormer rota:** "R0→R3 kazancının yakalanan payı %0 ile −11" ✓ (tablo c9 sütunu değerleri 0…−11), "15 ayarın hiçbiri" = z∈{18,19,20}×5 r_h = 15 ✓. **Tutarlı.**
- **Duyarlılık (Tablo 22 r4/r5, j22_calibration.json):** r_h∈{10,25,50,100} → 10,21–10,39 dk ✓, λ∈{0,5;1;2} → 10,31–10,36 dk ✓, 18/18 ulaşılabilir ✓ (n_total=18=6×3). **Tutarlı.**
- **Wilcoxon (`wilcoxon_test_results.json` her iki proje):** p-değerleri ve ortalama farklar iç tutarlı; 8-bölge R0–R3 p≈7,4e-64, EMSR648 katı p≈0,0076, risk lojistik-CatBoost p=0,4375. **Tutarlı.**
- **Senaryo kurgusu:** 48 çift (8 bölge × 6) ✓, 480 atama (×10 tohum) ✓, 10 tohum 42–51 ✓ (`full_run.json seeds`), v_ort=15 km/sa & t_u=20 dk (T12) ✓, K-Z1 katı diff=0 (R0=R3=12,57 dk) ✓ (`analysis4_per_district.json`).

---

## Doğrulama sırasında kullanılan kilit hesaplar
- H-Z5 halvings = [2,2,1,2,2,1,2,3,1,1] → değişken (P232 çürütür).
- Sentetik kapalı/toplam kenar bölge ort.: H-Z1 1,76 / H-Z2 1,37 / H-Z3 1,55 / H-Z4 1,47 / H-Z5 1,51 / K-Z1 1,76 / K-Z2 1,97 / K-Z3 1,32 (%). Aralık 1,32–1,97; genel ≈1,59.
- Rotalanabilen: R0 430, R1 430, R2 431, R3 432 (maks 432, "433" yok).
