# QuakeMind Makalesi — Güncel Durum ve Yapılacaklar (TEK KAYNAK)

_Son güncelleme: 2026-09-25_

> **Bu dosya tüm eski liste/durum dosyalarının yerine geçer.** Önceki dosyalar
> (`UTKU_ICIN_LISTE.md`, `EKSIKLER_VE_SORUNLAR_2026-09-19_guncel.md`,
> `KALAN_ISLER.md`, `TUM_EKSIKLER_KONSOLIDE_2026-09-20.md`,
> `OTURUM_DURUMU_2026-09-21.md`) bu belgede birleştirildi ve kaldırıldı.
> Kaynak kimlikleri (A-16, Ç-03, D-02, J-22, §6.5-#7b …) izlenebilirlik için korundu.

**Güncel docx:** `QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3_LOCAL_2026-09-21.docx`
**Eski docx/yedek/PDF:** `makale/arsiv/` altına taşındı.
**Makine değiştiriyorsan önce oku:** `makale/DEVAM_NOTU_2026-09-24.md` — 2026-09-24
oturumunun tam özeti, ortam kurulum adımları (Node.js/Python 3.12/Playwright bu
makineye özel, yeni makinede yeniden kurulmalı) ve tam olarak nerede kalındığı.

**İş bölümü:** Furkan = 9 model eğitim/koşum (GPU/Colab, B-2). Utku = veri
kararları, yerel ölçümler, makale düzeltmeleri, dış iletişim. "Sen/Kullanıcı" =
karar veya dış eylem gerektiren maddeler. Öncelik: 🔴 kritik · 🟠 önemli ·
🟡 orta · 🔵/⚪ düşük.

**✅ B-2 ana koşum bitti (2026-09-23, Furkan, Kaggle Tesla T4) — 10 mimari, aynı
bölme/tarif/tohum. Sonuçlar iki Kaggle veri setinde: `furkanemrence/quakemind-modeller`
(ağırlıklar) ve `furkanemrence/quakemind-rapor-paketi` (tablo/şekil/ham koşu kaydı).
2026-09-24 oturumunda bu verilerle madde 7/8/9 kapatıldı, 10/13/17/18 kısmen kapatıldı
(bkz. altındaki durum). `EGITIM_SONRASI_GUNCELLENECEKLER.md` kontrol listesi de bu
oturumda uygulandı.**

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

## ✅ BÖLÜM A2 — 2026-09-24 oturumu: Kaggle 10-model sonuçlarıyla docx güncellemesi

Furkan'ın Kaggle'da (`furkanemrence/quakemind-rapor-paketi`, `furkanemrence/quakemind-modeller`)
yayımladığı 10 mimarilik eğitim koşumu indirilip makaledeki eksiklerle karşılaştırıldı;
kapatılabilecek her şey docx'e işlendi (yedek: `makale/arsiv/..._YEDEK_2026-09-24_kaggle-oncesi.docx`).

**Tam kapanan (B-2 madde 7, 8, 9):**
- **Tablo 13** tamamen yeniden üretildi: 10 mimari (U-Net/FPN/DeepLabV3+/UPerNet/SegFormer-B0/B2/B4
  kodlayıcısı MiT-B4'te sabit + U-Net/ResNet-18, DeepLabV3+/ResNet-101, UPerNet/ConvNeXt-S taban
  çizgileri), aynı bölme/tarif/tohum(42). Eski "[KARŞILAŞTIRILAMAZ]" notu, dipnotlar ve
  hedeflenen-vs-koşulan ayrımı (P121-128, P280, P294-302, P468, P482, Katkı 3, TR özet, EN abstract)
  kaldırıldı/güncellendi. En iyi: U-Net(MiT-B4) 0,433; en düşük: UPerNet(ConvNeXt-S) 0,327 — belirleyici
  olan kodlayıcı, kod çözücü değil.
- **Tablo 6** 10 satıra yeniden yapılandırıldı (Kodlayıcı/Grup sütunları); UPerNet [65] ve
  ConvNeXt-S [66] için kaynakça eklendi (Xiao vd. 2018 ECCV; Liu vd. 2022 CVPR — atıf bilgileri
  WebSearch ile doğrulandı).
- **Tablo 12** model eğitimi sütunu gerçek ortamla dolduruldu (Kaggle, Tesla T4, Python 3.12.13,
  PyTorch 2.10.0+cu128, smp 0.5.0, albumentations 2.0.8, timm 1.0.26).
- **Şekil 7 ve Şekil 8** gerçek koşu verisinden (`kosu_kayitlari/kaggle/P2/*/tohum_42.json`, 50 devirlik
  ham eğitim geçmişi) yeniden üretildi ve gömüldü (10 mimari sıralaması; eğitim kaybı + doğrulama IoU
  eğrileri).
- **Veri kümesi paragrafı (P294)** güncel protokolü anlatıyor: KATE-PD (1013 karo, negatif örnek dahil)
  + KATE-CD öncesi; MEDBFS/QQB/HOTOSM artık yalnız dış sınama.

**Kısmen kapanan:**
- **Madde 10 (focal α)** — α∈{0,25·0,5·0,75} taraması Tablo 21'e (docx Tablo 21 = python-docx
  table[22]) yeni satır olarak eklendi. Eşik (0,5) duyarlılık taraması hâlâ açık.
- **Madde 13 (Tablo 15)** — yalnız "Birleşik→Hatay" (0,387) ve "Birleşik→Kahramanmaraş" (0,399)
  IoU_hasar hücreleri dolduruldu (SegFormer-B4, esas alınan model). İl-ayrık eğitim koşumları
  (4 satır) ve diğer ölçütler (F₁/Kesinlik/Duyarlılık) hâlâ [ÖLÇÜLECEK].
- **Madde 17/18 (dış sınama, TE23D)** — RAPOR_BILGILERI.md'deki mIoU-eşdeğerliği cümlesi kullanılabilir
  durumda ama docx'e henüz işlenmedi (bkz. Bölüm B, kalanlar).

**Çelişki bulundu (Furkan'a sorulmalı):** DURUM.md B-6 madde 29 "model başına 10 tohum" kararı
kayıtlı, ama fiilen yalnız SegFormer-B4 iki tohumla (42, 7) koşulmuş; paketin kendi açık-iş listesi de
"en iyi 3 modelin 2-3 tohumla tekrarı" diyerek bunun yapılmadığını doğruluyor.

---

## ✅ BÖLÜM A3 — 2026-09-24 (devam): GPU'suz yapılabilecekler taraması ve uygulanması

Üç paralel kod taraması sonrası, GPU/Furkan/üçüncü şahıs gerektirmeyen her şey uygulandı
(plan: `~/.claude/plans/staged-stirring-rocket.md`). Bulgular ve düzeltmeler:

- **Tespit edilen kayıt hataları düzeltildi:** `ignore_index=255` ana kayıp fonksiyonuna
  (`seg_common.py`) hiç bağlanmamış (yalnız tek bir Mask2Former notebook'unda kullanılıyor) —
  önceki "altyapı hazır" notu yanlıştı. `requirements.txt`'e scipy/xgboost/lightgbm eklendiği
  iddiası da yanlıştı (git geçmişinde yok) — **bu oturumda gerçekten eklendi**
  (`QuakeMindBackend/requirements.txt`, `apps/earthquake_risk/requirements.txt`).
- **`_j22_calibration.py` kayıp:** DURUM.md "yazıldı" diyordu ama dosya repoda hiç yok —
  önceki oturumda üretilip hiç commit'lenmemiş. Yeniden yazılması gerekiyor (B-0, düşük öncelik).
- **B-6 kararları (30/31/32/33)** kullanıcıyla netleştirildi ve docx'e işlendi: "hasarlı" =
  yalnız EMS-98 D4/D5 (Veri kümesi paragrafına eklendi); V₀ basit bir CPU ölçütüyle şimdi
  ölçülecek (ayrı madde); commit'ler şimdilik yerel kalacak, push edilmeyecek; EMSR648
  kapsam-dışı 4 ilçe için "Damaged=ceza" kuralı uygulanmayacak (mevcut sentetik + not korunuyor).
- **Wilcoxon istatistiksel anlamlılık testi (B-11)** yazıldı ve koşuldu — bkz. yukarıdaki B-7
  girdisi. Sonuç dosyaları: `model_benchmarks/06_rota/real_run/results/wilcoxon_test_results.json`,
  `model_benchmarks/05_risk_skoru/local_run/results/wilcoxon_test_results.json`.
- **Dış sınamalar (madde 17) ve TE23D karşılaştırması (madde 18)** docx'e işlendi (yeni
  paragraflar, Bölüm 4.2 ve 5.2; [67] QQB, [68] HOTOSM kaynakçaya eklendi).
- **Lisans e-posta taslakları** hazırlandı: `makale/lisans_epostalari_taslak.md`.

- **V₀ (madde 31)** — `tile_quality_score()` yazıldı ve docx'e işlendi (P102, Tablo 21); IoU
  etkisi etiketli karo kümesi olmadan ölçülemedi (kod hazır, veri erişilebilir olunca tamamlanır).

**Henüz yapılmayan (bir sonraki adım için hazır):**
- Morfoloji ablasyonu (Tablo 21) — HF checkpoint indirilip gerçek bir test karosuyla denenecek;
  uygun etiketli bir karo+maske bulunması gerekiyor (V₀ ile aynı engel).
- Bölüm C'nin 4 uygulama ekran görüntüsü — backend/frontend yerelde çalıştırılabilir durumda
  (bkz. plan dosyası), ama en az bir gerçek çatlak/hasar fotoğrafı kullanıcıdan gerekiyor.

---

## ⚠️ BÖLÜM B — HÂLÂ AÇIK İŞLER

### B-0 · Kararsız/beklemede: J-22 (r_h kalibrasyonu) — docx'e YAZILMADI
✅ **Düzeltme (2026-09-25):** `06_rota/real_run/_j22_calibration.py` "kayıp" notu **yanlıştı** —
dosya `origin/makale` commit `9041696`'da (2026-09-24, Furkan) geri gelmiş, bu oturumda
`git pull` ile çekildi ve içeriği okunup doğrulandı: çalışır durumda, gerçek Esri Wayback
[2023-02-23, id=57965] + gerçek SegFormer (`optimized_mitb4_focal_dice30.pth`) + gerçek
EMSR648 (`emsr648_closures.py`) kullanıyor. Aşağıdaki bulgu bu script'in daha önceki
koşumuna dayanıyor: Tek temiz örneklem (H-Z1-A, Antakya): r_h=25m'de model %2,1 yol
kapatıyor, EMSR648 %13,2 → model **eksik** kapatıyor; r_h=100m'de örtüşüyor. Bu, makaledeki
"r_h=25m'de ~8 kat fazla kapatıyor" bulgusunun **tam tersi**. Tek örneklemle gerçek bulgu mu
metodoloji hassasiyeti mi ayırt edilemez → docx'teki dürüst "tek örneklem, kalibrasyon için
yetersiz" notu korundu.
- **Kalan dosyalar:** `_j22_calibration.py` (çalışır, repoda), `results/j22_calibration.json` (ilk hatalı bbox koşumu), `results/j22_calibration_kz1.json` (boş, Overpass zaman aşımı).
- **Bu script'in bileşenleri Tablo 14/madde 12'nin SegFormer satırı için de yeniden kullanıldı** — bkz. B-2 madde 12.
- **Yapılacak (isteğe bağlı):** Overpass erişilince K-Z1 örneklerini tamamla; H-Z1'e 2-3 örnek daha ekle; yine de resmî "kalibrasyon" iddiası yerine ek gözlem/duyarlılık notu olarak girmesi daha savunulabilir.

### B-1 · 🔴 GÜVENLİK & DIŞ EYLEM (yalnız kullanıcı/insan)
| # | Kaynak | İş | Not |
|---|---|---|---|
| 1 | D-08 · §8.1 | **Roboflow API anahtarını iptal et + yenisini üret** | `origin/makale` git geçmişinde açık (2 commit: `9d4cc22`, `55a50d1`); kod placeholder'a taşındı ama geçmiş temizlemek anahtarı geçersiz kılmaz. Yeni anahtar Tablo 24 YOLO koşumu için de gerekli |
| 2 | — | (İsteğe bağlı) **git geçmişini temizle** | `git filter-repo`/BFG + force-push — yıkıcı, ayrı onay gerekir |
| 3 | auth | **`QUAKEMIND_DEMO_TOKEN=false`** (üretim dağıtımı) | `"demo-token"` ile kimlik doğrulama atlanabiliyor; kod flag'e bağlı, dağıtımda kapat |
| 4 | Ç-03 · Ç-07 | **Veri seti lisans teyidi (dış iletişim)** | TE23D yazarları (CC BY-NC-ND vs "tüm hakları saklıdır" çelişkisi); TUE-CD (README'de lisans yok) |
| 5 | Ç-13 · §9 | **ÇŞB'den hasar tespit verisi talebi** (isteğe bağlı) | En güçlü bağımsız yer gerçeği; csb.gov.tr / KEP |

### B-2 · ⏳ EĞİTİM BEKLENİYOR — GPU/COLAB (Furkan koşuyor)
**Ana protokol**
| # | Kaynak | İş |
|---|---|---|
| 7 | A-01·A-15·D-07·Tablo 13 | ✅ **KAPANDI (2026-09-24)** — 10 mimari aynı bölme/ölçüt/tohumla eğitildi (Kaggle, Furkan); Tablo 13/6/12 ve Şekil 7/8 güncellendi |
| 8 | Ç-04·§6 | ✅ **KAPANDI (2026-09-24)** — U-Net/ResNet-18 = 0,339, Hacıefendioğlu (0,394) ile aynı mertebe, Tablo 13/Gözlemler'de karşılaştırıldı |
| 9 | A-16·§6.5-#2 | ✅ **KAPANDI (2026-09-24)** — 2 km UTM blok bölmesi + KATE-CD öncesi negatif örnek fiilen kullanıldı (Veri kümesi paragrafı) |
| 10 | A-19·§6.5-#7 | 🟡 **KISMEN (2026-09-24)** — focal α taraması Tablo 21'e eklendi; eşik (0,5) duyarlılık taraması hâlâ açık |
| 11 | §9-B5 | 🔴 **AÇIK — çelişki bulundu**: karar 10 tohumdu, fiilen yalnız SegFormer-B4 2 tohumla (42/7) koşuldu; paketin kendi kaydı da "en iyi 3 model × 2-3 tohum" tekrarını "yapılmadı" işaretliyor. Furkan'a sorulmalı. |

**Tablo/şekil doldurma (eğitim çıktısına bağlı)**
| # | Kaynak | İş |
|---|---|---|
| 12 | Tablo 13/14·A-17·B-05 | 🟡 **KISMEN (2026-09-25) — SegFormer satırı KAPANDI, sonuç sıfır-örtüşme.** `table14_segformer_closure.py` gerçek checkpoint + `emsr648_closures.py` + `_j22_calibration.py` altyapısıyla H-Z1 (Antakya, 4 örnek) ve K-Z1 (Onikisubat, 2 örnek — 2 örnek Overpass zaman aşımıyla atlandı) bölgelerinde, toplam 4513 OSM kenarında koşuldu. **Bulgu:** τ∈[0,10; 0,60] taramasının hiçbir noktasında model, EMSR648'in kapalı saydığı 180 kenardan hiçbirini doğru tahmin etmedi (DP=0 tüm τ'larda) — Kesinlik=Duyarlılık=F₁=0,000 (orta kural, raporlanan τ=0,40 üretim varsayılanı, veri güdümlü değil çünkü hiçbir τ diğerinden iyi değildi). Katı kuralda örneklemde "Destroyed" kesit yoktu. Docx'e işlendi (Tablo 14 r6 + açıklama paragrafı); yedek `arsiv/..._YEDEK_2026-09-25_pre_tablo14*.docx`. Bu sıfır-örtüşme, Tablo 19'un bağımsız bulgusuyla (aynı model görev tabanlı değerlendirmede R0'a göre iyileşme sağlamadı) tutarlı — makalenin dürüstlüğünü güçlendiriyor, zayıflatmıyor. **Küçük örneklem (6 karo) uyarısı not edildi.** **Kalan 5 mimari (U-Net, LinkNet, FPN, PSPNet, DeepLabV3+) hâlâ GPU'ya bağlı**: `01_yol_hasari/local_colab_run/results/linknet_resnet18.json` ve `pspnet_resnet18.json` var ama farklı/kontrolsüz protokolden (tek tohum, mekânsal blok belirtilmemiş, KATE-CD+MedBFS bina verisi — D-03) ve checkpoint diskte yok. **Furkan'a soru:** bu 5 mimari Kaggle'daki "aynı bölme/tohum" protokolüyle yeniden eğitilip ağırlıkları indirilebilir mi? |
| 13 | Tablo 15·A-20·B-06·Ç-16 | 🟡 **KISMEN (2026-09-24)** — Birleşik→Hatay (0,387) ve Birleşik→Kahramanmaraş (0,399) IoU_hasar dolduruldu (SegFormer-B4); il-dışarıda-bırakma (4 satır) ve F₁/Kesinlik/Duyarlılık hâlâ açık. "Yalnız-KATE-PD kontrol" P2 tabanının kendisiyle zaten örtüşüyor olabilir. |
| 14 | Tablo 21·A-17·B-07 | 🟡 **KISMEN** — r_h/λ(d) VE risk ağırlıkları satırları zaten CPU'da tamamdı (önceki not "5 satır GPU" yanlıştı — risk ağırlıkları satırı da bitmiş, bkz. `table21_row7_risk_weights.py`); focal α bu oturumda eklendi. **Kalan:** kayıp ağırlıkları (λ_f/λ_d, gerçek GPU eğitimi gerektirir — kayıpta şu an ağırlık parametresi bile yok), morfoloji (CPU'da mümkün, uygun test karosu gerekiyor), V₀ (madde 31 kararınca şimdi yazılacak, henüz yazılmadı) |
| 15 | Tablo 24·B-03·§8.1 | YOLOv8 çatlak+bina mAP@0,5 (defter hazır, yeni Roboflow anahtarı gerekli — item 1) |
| 16 | J-20·J-25·J-26 | Model kalitesi/çözünürlük koşumları (z15 Maxar 1/8; z21/z22 defteri hazır; drone yol ağı kilitleniyor) |

**Dış sınamalar (çoğu yalnız çıkarım)**
| # | Kaynak | İş |
|---|---|---|
| 17 | §9-D11·Ç-05·Ç-08·Ç-09 | ✅ **KAPANDI (2026-09-24, HaitiBRD/Noto hariç)** — HOTOSM (Adıyaman bina bulma), QQB (yanlış alarm/duyarlılık), MEDBFS (çözünürlük çöküşü) yeni "Dış sınamalar" paragrafıyla Bölüm 4.2'ye işlendi ([67]/[68] kaynakçaya eklendi). **HaitiBRD ve Noto hâlâ hiç yok** (veri setleri diskte de bulunmuyor — ayrı indirme gerekir). |
| 18 | Ç-03·§9-D12 | ✅ **KAPANDI (2026-09-24)** — mIoU-eşdeğerlik cümlesi ("0,653-0,708 ↔ TE23D 0,7445") Bölüm 5.2'ye (Çalışmanın Yazındaki Konumu) yeni paragraf olarak işlendi; gerçek TE23D-bölmesi yeniden eğitimi hâlâ yapılmadı (dürüstçe belirtiliyor). |

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
| 21 | D-01·J-21 | **Google Earth karoları → Maxar Open Data** — kodda gerçek bir Maxar sağlayıcı yok (yalnız Google/Esri Wayback/OAM); gerçek entegrasyon GB'larca yerel arşiv + tile indeksleme gerektirdiği için ⏸️ **bilinçli olarak ertelendi** (2026-09-23 kararı) |
| ~~23~~ | ~~D-06~~ | ✅ **KAPANDI (2026-09-23)** — docx XML denetimi: 17 denklem zaten gerçek Word Equation nesnesi (`m:oMath`, düzgün kesir/alt-üst simge/toplam yapısı); ham LaTeX metni yok. DURUM.md bayatlamış, `md2docx.py` script'i de repoda hiç yok/gerekmiyor. |
| 26 | C-02…C-05 | **Uygulanmamış yetenekler** — docx'te "gelecek çalışma" işaretli; kapsam büyük (4 ayrı özellik), ⏸️ **bilinçli olarak ertelendi** (2026-09-23 kararı) — istenirse tek tek ele alınabilir |

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
| 30 | §6.5-#4·Ç-05 | ✅ **KARAR (2026-09-24): yalnızca D4/D5 "hasarlı" sayılır**, D3 (orta hasar) dahil edilmez — mevcut etiket kümeleriyle tutarlı, ek iş gerekmiyor |
| 31 | Bölüm 3.3 V₀ | 🟡 **KISMEN (2026-09-24)** — `tile_quality_score()` yazıldı ve entegre edildi (`road_damage/utils/inference.py`: Laplacian varyansı + HSV bulut sezgiseli), örnek görsellerde işlevsel doğrulandı, docx'e işlendi (P102, Tablo 21). **IoU etkisi ölçülemedi** — etiketli ham karo kümesi (KATE-PD/QQB) yerelde yok. |
| 32 | F-01·F-02 | ✅ **KARAR (2026-09-24): şimdilik yalnız yerel commit**, upstream'e push edilmiyor; izlenmeyen dosya kararı push zamanı ayrıca verilecek |
| 33 | E-01 | ✅ **KARAR (2026-09-24): mevcut sentetik veri + dürüst sınırlılık notu korunuyor**, "Damaged=ceza" kuralı uygulanmıyor (yeniden koşum gerektirir, kapsam dışı bırakıldı) |

### B-7 · 📊⚪ AKADEMİK TAMLIK (düşük öncelik)
- **B-11** — ✅ **KISMEN KAPANDI (2026-09-24)**: Rota (Tablo 17/18, `06_rota/real_run/wilcoxon_test.py`) ve risk skoru (Tablo 23, `05_risk_skoru/local_run/wilcoxon_test.py`) için eşleştirilmiş Wilcoxon testi koşuldu ve docx'e işlendi (P362, P414). Rota: naif'e karşı tüm kısmi-bilgili referanslar ve EMSR648 karşılaştırmaları anlamlı (p<0,01). Risk skoru: lojistik regresyon ile CatBoost/MLP/RF arasındaki farkların hiçbiri anlamlı değil (n=5 kat, güç düşük). **Tablo 22 (NLP) için mümkün değil** — per-tohum/per-örnek ham veri diskte yok, yeniden koşum gerekir.
- **Yalnız ölçüm (GPU'suz, çoğu Furkan):** insan tavanı (2 etiketçi IoU); kümeler arası etiket uyumu (§6.5-#8a); protokol duyarlılık tablosu; bina düzeyi ölçütler; ShakeMap MMI katmanlaması; risk ağırlığı duyarlılığı; geometri/kayma denetimi.
- **IoU iyileştirme (§6.5, isteğe bağlı):** gerçek-sonrası negatifler, hasarlı fazla örnekleme, çok-ölçekli çıkarım, radyometrik uyum, hasar-yapıştırma, topluluk+TTA, SLIC+morfoloji, derin denetim, SegFormer-B5/UNet++/Mask2Former.
- **Denetlenmeyen (garanti yok):** `fastapi_app.py` (1700+ satır) satır satır; `quakemind-web`/`quakemind` (Flutter) sistematik; Kaynakça [1]-[64] atıf içerikleri (internet gerektirir).
- **Kapsam sınırı (eylem DEĞİL):** Xie 2022 (%62,43) ve Song 2020 kapalı erişim → yalnız yöntem düzeyinde anılır.

---

## 🖼️ BÖLÜM C — UYGULAMA GÖRSELLERİ ✅ TAMAMLANDI (2026-09-24)

4 görsel **güncel uygulama arayüzünden gerçek veriyle** üretildi ve docx'e **yeni
§4.12 "Uygulama Arayüzü" alt bölümü** olarak (§4.11 ile §5 TARTIŞMA arasına)
**gömüldü**. Yerleşim: **2×2 kenarlıksız ızgara** (Şekil 21|22 üst sıra, 23|24 alt
sıra; her görsel ~7,3 cm, altyazı 9 pt "Şekil NN." kalın) — 4 tam-genişlik görsel
peş peşe ~2 sayfa yer kapladığı için ızgaraya alındı, artık ~1 sayfaya sığıyor
(PDF s.60-61 ile doğrulandı). Gömme öncesi yedek:
`makale/arsiv/..._YEDEK_pre_sekil2124.docx`.

**Atıf rozeti temizliği (2026-09-24):** Şekil 22/23/24'teki harita köşe atıf/filigran
rozeti (Leaflet · "Zemin: Esri" · "© Google (Simülasyon)") ekran görüntüsünden
`.leaflet-control-attribution` CSS'i ile gizlenip yeniden çekildi; atıf makale
metninde verildiği için görsel temiz tutuldu. docx bu temiz sürümlerle yeniden gömüldü.

1. **`1_catlak_tespit.png`** — ✅ **Çekildi ve gömüldü (Şekil 21).** Gerçek `catlak.pt`+`bina.pt` hibrit YOLO çıkarımı: yüklenen duvar çatlağı fotoğrafı (`imacges.jpg`) üzerinde 4 tespit kutusu, duvar/kolon çatlağı %83,8/%76,8 güven, "taşıyıcı elemanda derin yapısal çatlak" uyarısı. → §4.12.
2. **`2_risk_skoru.png`** — ✅ **Çekildi ve gömüldü (Şekil 22).** Hatay, gerçek risk skoru (47,58/100 ORTA) + fay/deprem kümesi haritası. Filigran giderildi. → §4.12.
3. **`3_nlp_harita.png`** — ✅ **Çekildi ve gömüldü (Şekil 23).** Gerçek Hatay/Antakya örnek metni, %96 güven, P-5 aciliyet, geocoding pini. Filigran giderildi. → §4.12.
4. **`4_isi_haritasi_guzergah.png`** — ✅ **Çekildi ve gömüldü (Şekil 24).** Antakya gerçek Google uydu görüntüsü üzerinde açık (yeşil) / hasarlı (kırmızı) yol ağı, "Örnek Verilerle Simüle Et" senaryosuyla; ısı haritası katmanı aktif. Not: ısı glow'u uydu üstünde silik kalıyor, güvenli güzergâh yeşil açık yollarla temsil ediliyor. → §4.12.

**Filigran düzeltmesi (2026-09-24):** Harita zemin katmanı eskiden Carto'nun ücretsiz
API anahtarı istediği "API KEY REQUIRED" filigranını gösteriyordu. Web istemcisindeki
tile kaynakları anahtarsız/filigransız **Esri Dark Gray Canvas**'a çevrildi
(`quakemind-web/src/components/map/LeafletContainer.tsx` ve `SafeEvacuationMap.tsx`);
2/3/4 numaralı görseller bu düzeltmeden sonra yeniden çekildi ve artık temiz.

**Ortam kurulumu ve çekim script'i:** `makale/DEVAM_NOTU_2026-09-24.md` (bu makineye
özel Node.js/Python 3.12/Playwright kurulumu yeni makinede yeniden yapılmalı) ve
`QuakeMindBackend/capture_app_screenshots.py`.

**Bu turda kapsam dışı (GPU/Colab bekliyor):** yol hasarı segmentasyon overlay'i
(SegFormer checkpoint yerelde yok); bina hasarı segmentasyon overlay'i (aynı GPU
engeli). "Etiketlenmiş veri örneği" (2209 raporundaki Şekil 10/12) ayrıca ele alınıyor.
