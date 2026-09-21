# QuakeMind Makalesi — Kalan İşler

_Son güncelleme: 2026-09-19 (üçüncü tur: önceki turda "doğrulama bekliyor" bırakılan 6
maddenin 5'i araştırılıp kapatıldı — ikisi gerçek sayısal hata çıktı (bölge bazlı süreler,
Tablo 23 eğitim süresi), 1 tanesi bilinçli olarak açık bırakıldı (veri erişim politikası,
kullanıcı tercihi). Toplam: 3 denetim turunda 13 docx + 3 kod hatası düzeltildi, GPU/Colab
gerektirenler dışında bilinen tüm mantıksal tutarsızlıklar kapatıldı). Bu dosya,
`QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3.docx` üzerinde yapılan kod-vs-makale denetimi
ve rota/görev-orkestrasyonu yeniden inşası sonrasında geriye kalan açık maddeleri listeler.
Tamamlanan işler (yol hasarı bölütlemesi/kesişim düzeltmesi, Algoritma 1-3'ün gerçek OSM+EMSR648
verisiyle yeniden koşulması, Tablo 10/17/18/20 güncellemesi) bu listede yer almıyor — onlar zaten
docx'e işlendi.

**Denetim kapsamı:** `main`/`makale` dalındaki kod. Isı haritası, risk-ağırlıklı güvenli güzergâh ve
`damage_points` birleşik tablosunu getiren `feature/ip4-heatmap-safe-route` dalı 2026-09-19'da
`main`'e merge edildi (artık `main`'in bir parçası, ayrı dal olarak yok — remote'tan silindi).

## 📋 YAPILACAKLAR — özet kontrol listesi (2026-09-19)

Bu bölüm, aşağıdaki uzun denetim geçmişinde dağınık duran TÜM açık/eksik/sorunlu maddeleri
tek yerde topluyor. Her madde nereye ait olduğunu gösteren bir referansla aşağıdaki ilgili
bölüme bağlanıyor; ayrıntı için oraya bakın.

### 🔴 Güvenlik — dış eylem gerektiren (ben yapamam)
- [ ] **Roboflow API anahtarını (`VjVe…UAs [redakte — iptal edilecek]`) Roboflow hesabından iptal edip
  yenisini üretmek.** Kod tarafı temizlendi ama anahtar `origin/makale`'ye push edilmiş 2
  commit'in git geçmişinde hâlâ açık duruyor; geçmişi temizlemek anahtarı geçersiz kılmaz.
  (bkz. madde 5)
- [ ] **İsteğe bağlı:** `git filter-repo`/BFG ile geçmişten temizleyip `origin/makale`'ye
  force-push — yıkıcı işlem, ayrı onay gerektirir. (bkz. madde 5)
- [ ] **`QUAKEMIND_DEMO_TOKEN` ortam değişkenini gerçek üretim dağıtımında `false` yapmak.**
  Kod artık bunu destekliyor (varsayılan `true` — demo bozulmadı), ama dağıtım anında
  kapatılması gerekiyor, aksi hâlde `"demo-token"` ile kimlik doğrulama atlanabiliyor.
  (bkz. madde 22)

### 🟡 GPU/Colab bekleyen — ölçülmesi gereken (henüz ölçülmedi)
- [ ] **Tablo 13** — SegFormer (yol hasarı) satırının aynı 3'lü mekânsal blok bölmesiyle
  yeniden değerlendirilmesi. Checkpoint yerelde hazır, yalnızca GPU koşumu gerekiyor.
  (bkz. madde 6)
- [ ] **Tablo 14** — Kapanma katmanının EMSR648 karşısında kesim-düzeyi değerlendirmesi (36
  boş hücre) — bina-hasarı SegFormer ağırlığı yalnız Colab'da olduğundan bloklu. (bkz. madde 9)
- [ ] **Tablo 15** — Hatay↔Kahramanmaraş bölgeler arası genelleme (28 boş hücre) — bina hasarı
  bölütleme ağırlıkları yalnız Colab'da, yerelde yok. (bkz. madde 7)
- [ ] **Tablo 24** — YOLOv8 çatlak+bina mAP@0,5/mAP@0,5:0,95 — notebook hazır ve anahtar
  sorunu çözüldü, sadece gerçek bir Roboflow anahtarıyla Colab'da çalıştırılması gerekiyor.
  (bkz. madde 8)

### 🟠 Kaynağı bulunamayan / yeniden üretilmesi gereken kod
- [ ] **Tablo 16'nın "dokuz senaryo yapılandırması" ölçümünü üreten istemci betiği repoda
  yok.** Çalışmanın diğer her yeniden koşulan bileşeninin (rota, risk skoru, NLP) aksine, bu
  HTTP-gecikme ölçümünün kaynağı bulunamadı — sayı (dokuz/sekiz) bu yüzden doğrulanamadı.
  **Yapılacak:** ya bu ölçümü üreten script bulunup/yeniden yazılıp gerçek uç noktalara karşı
  yeniden koşulmalı, ya da tablo kalıcı olarak "bu sürümde yeniden üretilemedi" diye
  işaretlenmeli (Tablo 13/15/24'teki gibi dürüst bir kısıt notuyla). (bkz. madde 27)
- [ ] **`model_benchmarks/06_rota/real_run/analyze4.py` yalnızca H-Z1+K-Z1 BİRLEŞİK çıktı
  veriyor, bölge-ayrımlı değil.** P382'deki bölge bazlı sayılar bu turda `full_run.json`'dan
  elle/bağımsız yeniden hesaplanıp doğrulandı ve docx'e işlendi, ama bunu üreten resmî,
  tekrar-çalıştırılabilir bir script hâlâ yok. **Yapılacak:** `analyze4.py` bölge-ayrımlı
  çıktı da verecek şekilde genişletilmeli (düşük risk, veri zaten `full_run.json`'da mevcut).
  (bkz. madde 24)

### ⚫ Kullanıcı kararı bekleyen (bilinçli olarak açık bırakıldı)
- [x] **Veri Erişilebilirliği — NLP kümesi erişim politikası** — ✅ KARAR (2026-09-20): **istek üzerine**.
  Docx'teki `[ERİŞİM POLİTİKASI KARARLAŞTIRILACAK]` placeholder'ı "araştırma amaçlı olarak, sorumlu yazara
  yapılacak makul bir başvuru üzerine (istek üzerine) erişime açıktır" ile dolduruldu. (bkz. madde 28)
- [ ] **Tablo 5 kararının (c) — gelecek çalışmaya bırakma — pratik sonucu:** yol hasarı için
  piksel-etiketli bir eğitim kümesi oluşturulmadan Tablo 5, Tablo 14 ve Tablo 24'ün ilgili
  satırı kalıcı olarak boş kalacak. Bu bir hata değil, bilinçli bir kapsam sınırı — ama
  makale yayına hazırlanırken bu kümenin gerçekten oluşturulup oluşturulmayacağına karar
  verilmesi gerekiyor. (bkz. madde 9)

### 🔵 Akademik tamlık — eksik ama "hata" sayılmayan
- [ ] **İstatistiksel anlamlılık testi / güven aralığı hiçbir karşılaştırma tablosunda yok**
  (Tablo 17, 18, 22, 23 — yalnız ortalama±std). n=10 tohumlu karşılaştırmalar için özellikle
  hakem sürecinde sorulması muhtemel bir eksiklik. (bkz. madde 29)
- [ ] **Ayrı bir "Finansman" başlığı yok** — TÜBİTAK 2209-A desteği yalnızca Teşekkür
  içinde geçiyor; çoğu dergi formatında kabul edilebilir ama bazı dergiler ayrı başlık ister.
  Düşük öncelik, stil tercihi.

### ⚪ Denetimin KAPSAMADIĞI alanlar (bilinen bilinmeyenler — "hiçbir şey kaçmadı" garantisi yok)
- [ ] **`QuakeMindBackend/fastapi_app.py` (1700+ satır) satır satır incelenmedi** — yalnızca
  hedefli desen taraması yapıldı (TODO, hardcoded secret, auth mantığı, bare-except). Daha
  derin bir backend code review (özellikle PostGIS sorguları, dosya/yol işleme, girdi
  doğrulama) ayrı bir geçiş gerektiriyor.
- [ ] **`quakemind-web/src` (Next.js/React) ve `quakemind/lib` (Flutter) derinlemesine
  incelenmedi** — yalnızca yüzeysel/hedefli bakıldı, göze çarpan kritik bir hata bulunmadı ama
  sistematik bir tarama (state yönetimi, null-safety, API hata yönetimi) yapılmadı.
- [ ] **Kaynakça'daki [1]-[64] atıfların gerçek içeriği doğrulanmadı** (yalnızca numaralandırma
  ve kullanım tutarlılığı kontrol edildi — atıf edilen makalelerin gerçekten o iddiaları
  içerip içermediği internet erişimi gerektirir, bu oturumda yapılmadı).

## ✅ Denetimde doğrulandı (önceki listede "bulunamadı" denmişti, düzeltildi)

1. **Isı haritası (Bölüm 3.1)** — ÖNCEKİ BULGU YANLIŞTI. Denetim sırasında `main` dalında karşılığı
   yoktu, ama `feature/ip4-heatmap-safe-route` dalında tam karşılığı vardı (bu dal artık `main`'e
   merge edildi, bkz. aşağı): `QuakeMindBackend/apps/road_damage/utils/heatmap.py`
   (`build_gaussian_heatmap`) gerçek bir
   Gauss çekirdeği yoğunluk kestirimi uyguluyor; `/api/road_damage/heatmap` uç noktası
   (`fastapi_app.py:910-949`) bunu SOS alarmı, Twitter/NLP geocode edilmiş ihbar, kamera
   (çatlak/bina YOLO) tespiti ve uydu/SegFormer hasar noktalarının **hepsini** tek bir
   `damage_points` tablosunda birleştirerek besliyor — yani makalenin "çekirdek yoğunluk
   kestirimine dayalı ısı haritası" ifadesi doğru. Web tarafında `HeatmapLayer.tsx` +
   `command/map/page.tsx`'teki "Birleşik Isı Haritası" katmanı aynı fikri SOS/NLP/deprem/yol
   hasarı noktalarını istemci tarafında birleştirerek ikinci kez uyguluyor. **Docx'te değişiklik
   gerekmiyor** — mevcut cümle zaten bu koda karşılık geliyor. Dal artık `main`'e merge edildiği
   için "henüz merge edilmemiş kod" notuna da gerek kalmadı.
   _Not (denetim sırasında görülen, makaleyi etkilemeyen bir ayrıntı):_ Bölüm 3.8'in "hedeflenen
   tasarım" olarak tanımladığı basamaklı ceza fonksiyonu (Denklem 9: <50 m→3,0 / <150 m→1,5 /
   <400 m→1,1) makalenin kendi ifadesine göre `model_benchmarks/06_rota/common.py`'de
   kullanılmıyor (sürekli doğrusal çekirdek kullanılıyor, `penalty_radius_m: 150.0`) — bu doğru,
   doğrulandı. Ayrıca bu dalın canlı API'sindeki `QuakeMindBackend/.../network.py::risk_weight()`
   tam olarak Denklem 9'daki basamaklı fonksiyonu (aynı 50/150/400 ve 3,0/1,5/1,1 değerleriyle)
   uyguluyor — ama bu üretim API'si makalenin akademik değerlendirmesinde (Tablo 10 vb.)
   kullanılmıyor, Bölüm 3.8 açıkça `model_benchmarks/06_rota/` dosyalarına atıf yapıyor, o yüzden
   çelişki yok. Sert kapatma tarafında ise iki kod da (`common.py` ve `network.py`) hâlâ kenar
   ortasına (midpoint) uzaklık kullanıyor, makalenin "hedeflenen tasarım" dediği kenar
   geometrisine dik uzaklık hiçbirinde yok — Bölüm 3.8'deki dürüst "uygulanmadı" notu geçerliliğini
   koruyor.

## ✅ Düzeltildi (2026-09-19)

2. **Risk skorlama declustering çelişkisi (Sınırlılık (n), Tablo 23)** — DÜZELTİLDİ. Docx'teki
   "declustering uygulanmadı" ifadeleri (Bölüm 3.7, Tablo 23 başlığı, Bölüm 4.11 paragrafları,
   Sınırlılık (n)) kodun gerçek davranışını (`simple_declustering`, 1 gün/50 km sabit pencere)
   yansıtacak şekilde yeniden yazıldı; kalan sınırlılık artık "sabit/kısa pencere dışındaki
   artçıları yakalayamayabilir" olarak ifade ediliyor. n=454/pozitif oran 0,687 → gerçek
   `leaderboard.csv` değerleri olan n=375/pozitif oran 0,731 ile değiştirildi (7 yerde: Bölüm 3.7,
   Tablo 23 başlığı, taban çizgisi paragrafı, Bölüm 4.11'deki iki paragraf, Sınırlılık (n)).
   Ayrıca Bölüm 4.11'deki "en düşük PR-AUC (MLP, 0,7108) tabanın 0,024 üzerinde" cümlesi, doğru
   tabanla (0,731) yeniden hesaplanınca aslında **tabanın altında** kaldığı ortaya çıktı — bu artık
   metne düzeltilmiş olarak yansıtıldı (MLP'nin diğer metriklerde de taban çizgisini geçemediği
   bulgusuyla tutarlı).
3. **YOLO Tablo 7** — DENETİMDE ZATEN DÜZELTİLMİŞ BULUNDU. Bu v3(1) sürümünde bina modelinin
   "Kritik işaretleme" hücresi zaten "Sınıf = ağır hasarlı (VeryHeavy) veya orta hasarlı
   (Moderate)" olarak doğru yazılmış (kod: `fastapi_app.py:1124`), "—" değil. Hibrit kip
   paragrafı da (P133) iki modelin bağımsız çalışıp kesişim/içine-yerleştirme yapılmadan
   birleştirildiğini doğru şekilde anlatıyor. Docx'te ek değişiklik gerekmedi.
4. **NLP ölü kod iddiası (Bölüm 3.6)** — DENETİMDE ZATEN DÜZELTİLMİŞ BULUNDU. P144 zaten
   "üretilen kök biçimleri bu sürümde ne sınıflandırıcıya ne de anahtar sözcük kurallarına
   aktarılır ... hesaplanıp kullanılmadan atılan bir ara çıktıdır" diyor — kodla tutarlı. Docx'te
   ek değişiklik gerekmedi.
5. **Güvenlik — Roboflow API anahtarı** — KISMEN DÜZELTİLDİ.
   `model_benchmarks/03_yer_seviyesi/local_colab_run/00_catlak_bina_yolo.ipynb` içindeki açık
   yazılı anahtar (`VjVe…UAs [redakte — iptal edilecek]`) koddan kaldırıldı; hücre artık anahtarı Colab
   `userdata` sırrından veya `ROBOFLOW_API_KEY` ortam değişkeninden/`getpass` ile okuyor.
   **HÂLÂ YAPILMASI GEREKENLER (elle, benim yapamayacağım işler):**
   - Anahtar `origin/makale` dalına push edilmiş 2 commit'in (`9d4cc22`, `55a50d1`) geçmişinde hâlâ
     açık şekilde duruyor — sadece çalışma kopyasından silmek bunu temizlemiyor. Anahtarı
     **Roboflow hesabından iptal edip yenisini üretmek şart** (geçmişi temizlemek anahtarı
     geçersiz kılmaz, sadece görünürlüğü azaltır).
   - İstenirse `git filter-repo` / BFG ile geçmişten temizlenip `origin/makale`'ye force-push
     yapılabilir — bu yıkıcı bir işlem olduğu için ayrıca onay gerektirir.

## 🟡 GPU/Colab bekleyen

6. **Tablo 13** — SegFormer satırının aynı 3'lü (eğitim/doğrulama/sınama) mekânsal blok
   bölmesiyle yeniden değerlendirilmesi (mevcut checkpoint:
   `QuakeMindBackend/apps/road_damage/models/optimized_mitb4_focal_dice30.pth`).
7. **Tablo 15** — Hatay↔Kahramanmaraş bölgeler arası genelleme (bina hasarı bölütleme modeli;
   `model_benchmarks/02_bina_hasari` ağırlıkları yalnız Colab'da, yerelde yok).
8. **Tablo 24** — YOLOv8 çatlak+bina mAP@0,5 / mAP@0,5:0,95
   (`model_benchmarks/03_yer_seviyesi/local_colab_run/00_catlak_bina_yolo.ipynb`, gerçek
   Roboflow projelerine atıf yapıyor ama hiç çalıştırılmamış — Roboflow API anahtarı gerekiyor).

## ✅ Karar verildi (2026-09-19)

9. **Tablo 5** — yol hasarı için piksel-etiketli eğitim kümesi kararı **(c) gelecek çalışmaya
   bırak** olarak netleştirildi. Gerekçe: (a) kendi küme — manuel piksel etiketleme bu oturumda
   yapılamaz (insan etiketleyici gerektirir); (b) CAU-RoadDamage'ı dış test kümesi kullan —
   veri kümesi bu repoda yok, indirilmesi onay gerektiren harici bir eylem; ayrıca değerlendirme
   için gereken bina-hasarı SegFormer ağırlıkları da yalnızca Colab'da (madde 7 ile aynı engel).
   Aslında docx'in kendi metni (Bölüm 3.4 P28, Sınırlılık (m) P466, (r) P471) zaten (c)'yi
   örtük olarak benimsemişti; yalnızca iki paragraf (P93, P292) hâlâ "bu çalışma kapsamında
   oluşturulacak" gibi gelecek-vaadi diliyle çelişiyordu — bu ikisi düzeltilip "gelecek
   çalışmaya bırakıldı" çerçevesiyle tutarlı hâle getirildi. Bu karar Tablo 14'ü de kapsar
   (zaten aynı Colab-only bina-hasarı ağırlığına bağımlı, madde 7/8 ile aynı GPU engeli).

## ⚫ Kısmen tamamlandı / GPU bekleyen kalıntı

10. **Tablo 21** — bileşen çıkarma ve parametre duyarlılığı (iskelet). **r_h/λ(d) satırları
    ✅ TAMAMLANDI (2026-09-19)**: H-Z1 (Antakya), EMSR648 orta kural kapalı kenarlarının orta
    noktaları hasar noktası olarak verilip üretim kodundaki `apply_risk_penalties`/`risk_weight`
    (`QuakeMindBackend/apps/road_damage/utils/network.py`) doğrudan çalıştırıldı
    (`model_benchmarks/06_rota/real_run/table21_sensitivity.py`; 6 görev × 3 tohum 42–44).
    Bulgu: ortalama ulaşım süresi test edilen r_h (10–100 m) ve λ(d) ölçeği (×0,5–×2)
    aralığında göreli olarak duyarsız (en büyük fark 0,18 dk); r_h'nin asıl etkisi süre değil
    ağdan kaldırılan kenar sayısı (194→588, ~3 kat). Docx'e (Bölüm 4.9, Tablo 21 satır 4-5)
    işlendi. **Kalan 5 satır** (ağırlıklı pencere harmanlama, morfolojik son işleme seviyesi,
    kayıp bileşim ağırlıkları, karo kalite eşiği V₀, risk skoru ağırlıkları) ilgili modellerin
    yeniden eğitilmesini gerektiriyor — GPU/Colab bekliyor.
11. **Şekil 3 (çalışma alanı haritası) — ✅ TAMAMLANDI (2026-09-19).** `scenario.py`'deki 8
    bölge merkezi (OSM/Nominatim, önbellekten offline), Pazarcık/Elbistan ilçe merkezleri
    (6 Şubat 2023 depremlerinin yaklaşık dış merkezi olarak, aynı geocode yöntemiyle — kesin
    sismolojik koordinat değil, bu docx'te açıkça belirtildi) ve Doğu Anadolu Fay Zonu ana kolu
    (`earthquake_risk/common_preprocessing.py::FAULT_LINES[1]`, aynı veri) tek haritada
    birleştirildi (`model_benchmarks/06_rota/real_run/make_figure3.py`, 300dpi). Bu sırada
    metinde bulunan bir tutarsızlık da düzeltildi: Bölüm 4.1 ve önceki Şekil 3 metni "dokuz
    operasyon bölgesi" diyordu, ama gerçek yeniden inşa edilen sahne (`scenario.py`,
    `full_run.json`, Bölüm 4.5 P334) her yerde sekiz bölge (5 Hatay + 3 Kahramanmaraş)
    kullanıyor — muhtemelen orijinal (kayıp) senaryodan kalma eski bir sayı. P76 ve Şekil 3
    alt yazısı "sekiz" olarak düzeltildi.

    **Şekil 10 (güzergâh karşılaştırma haritası) — ✅ TAMAMLANDI (2026-09-19).** H-Z1
    (Antakya), tohum 51, EMSR648 orta kural, örnek görev 2 için gerçek R0 (naif ajan) ve R3
    (önerilen sistem / kusursuz bilgi) güzergâhları yeniden koşuldu
    (`model_benchmarks/06_rota/real_run/make_figure10.py` — aynı `scenario.py`/`assignment.py`/
    `naive_agent.py`/`emsr648_closures.py` koduyla, önbellekteki OSM grafı kullanılarak, ağ
    erişimi gerekmeden tekrarlanabilir); `full_run.json`'daki toplu sayılarla birebir eşleşti
    (R0: 6936 m / 30 keşif, R3: 2064 m / 0 keşif). Harita `plot_figure10.py` ile üretildi
    (`results/figure10.png`, 300dpi, Türkçe etiketli — kapalı yol kesimleri, keşif noktaları,
    her iki güzergâh işaretli) ve docx'teki `[ŞEKİL 10 — ...]` yer tutucusu bu görselle
    değiştirildi.

## ✅ İkinci denetim turu (2026-09-19) — makale baştan sona + kod tabanı taraması

Bu turda makalenin TAMAMI (Giriş/Özet'ten Kaynakça'ya) 5 paralel denetimle yeniden
tarandı (Bölüm 1-2, Bölüm 3 yöntem, Bölüm 4 sonuçlar, Bölüm 5+akademik tamlık, genel kod
taraması) ve bulunan somut hatalar düzeltildi.

**Docx'te düzeltilen 10 madde:**

12. **Özet (P8) ve Abstract (P13) — sayısal hata.** İkisi de "Kahramanmaraş'ta orta/gevşek
    kuralda fark 39,1 dakikadır" diyordu; bu sayı aslında Kahramanmaraş'a değil, H-Z1+K-Z1
    **birleşimine** ait, üstelik YANLIŞ hesaplanmıştı (iki bölgenin kendi ortalamalarının
    basit ortalaması: (25,1+53,4)/2≈39,25 — ağırlıklı/havuzlanmış gerçek değer değil).
    Tablo 17'nin kendi "H-Z1+K-Z1 · EMSR648" sütunundaki gerçek değer **7,3 dk (katı) /
    78,9 dk (orta-gevşek)**. Özet/Abstract'ta bu ikisi düzeltildi; Kahramanmaraş'ın kendi
    katı-kural sıfır farkı (doğru olan kısım) ayrıca ve doğru şekilde korundu.
13. **P383 — aynı kök hata.** "(Tablo 17)" diye atıf yapılan 3,6/39,1 rakamları Tablo 17'de
    yoktu (gerçek: 7,3/78,9) — düzeltildi.
14. **P173 vs P336 — doğrudan çelişki.** P173 (Bölüm 3.8, Yöntem) "A* ile Dijkstra'nın
    90 görevin tamamında en fazla 0,00 m farkla eşleştiği" doğrulandı diyordu; P336
    (Bölüm 4.5, Sonuçlar) ise aynı iddianın "bu sürümde koşulmadığını ve kaldırıldığını"
    söylüyordu. P173, P336'nın dürüst çerçevesiyle tutarlı hâle getirildi (doğrulamanın bu
    sürümde ayrıca koşulmadığı belirtildi).
15. **P185 — iki ayrı hata.** (a) "R1+R2 birleşimi... koşulmuştur" iddiası yanlıştı: Tablo
    17'nin R1+R2 satırı tamamen "—" ve `model_benchmarks/06_rota/real_run/analyze2.py:31`
    kod yorumu bunun ayrı koşulmadığını açıkça söylüyor — düzeltildi (R2 en güçlü tek
    referans olarak raporlanıyor artık). (b) "simülatörün R0 kipi... 986 görevin tamamında
    önceki hesabı yeniden üretti" cümlesi kodda doğrulanamadı, "986" hiçbir yerde geçmiyor
    ve "önceki hesap" ifadesi makalenin başka yerlerinde "kayıp/geçersiz" dediği eski
    simülatöre atıf gibi duruyordu — kaldırıldı.
16. **P205/P208 — Denklem (11) çakışması.** Aynı "(Denklem 11)" etiketi hem Algoritma 1
    kutusu içindeki T=L/v+k·t_u formülüne hem de Bölüm 4'te asıl referans verilen
    ΔT ayrıştırma formülüne verilmişti. Algoritma kutusu içindeki etiket kaldırıldı, asıl
    numara yalnızca ayrıştırma formülünde kaldı.
17. **P400 — yazım artığı.** Cümle sonunda başıboş bir "n" karakteri vardı, silindi.
18. **P420 — eski tabana göre hesaplanmış fark.** "PR-AUC = 0,7544 (temel oranın 0,067
    üzerinde)" ifadesi hâlâ eski (yanlış) taban 0,687 ile hesaplanmıştı
    (0,7544−0,687≈0,067). Doğru tabanla (0,731): 0,7544−0,731≈**0,023** — düzeltildi.
19. **P427 (Şekil 17 alt yazısı)** — "0,687'lik pozitif sınıf oranı" → "0,731'lik pozitif
    sınıf oranı" (declustering/Tablo 23 düzeltme turunda unutulmuş bir yer).
20. **P430 (Şekil 18 alt yazısı)** — "454 kayıtlık kümede" → "375 kayıtlık kümede" (aynı
    unutulmuş yer).

**Kodda düzeltilen 3 madde:**

21. **Roboflow anahtarı GERİ GELİYORDU.** Önceki turda `00_catlak_bina_yolo.ipynb`'den
    temizlenen anahtar (`VjVe…UAs [redakte — iptal edilecek]`), onu üreten kaynak script'te
    (`model_benchmarks/03_yer_seviyesi/local_colab_run/build_notebook.py`) hâlâ hardcoded
    duruyordu — script tekrar çalıştırılırsa anahtar yeniden gömülürdü. `DATASETS` sözlüğünden
    `api_key` alanı kaldırıldı, üretilen defter artık Colab `userdata`/env var/`getpass` ile
    okuyor (notebook'un kendisiyle aynı desen). Defter yeniden üretilip anahtarın gerçekten
    gittiği doğrulandı.
22. **Kritik güvenlik açığı — kimlik doğrulama atlaması.** `QuakeMindBackend/fastapi_app.py`
    (`/api/auth/me`): `token == "demo-token"` koşulu, bu değeri gönderen HERHANGİ bir
    istemcinin `USER_DATABASE`'deki ilk kullanıcı olarak, hiçbir doğrulama yapılmadan oturum
    açmasına izin veriyordu. Kod içindeki mevcut TODO ("production'a çıkmadan kaldır/env
    flag'e bağla") uygulanarak `QUAKEMIND_DEMO_TOKEN` ortam değişkenine bağlandı (varsayılan
    `true` — mevcut demo davranışı bozulmadı, ama üretime çıkarken `false` yapılabilir bir
    kapatma anahtarı artık var). **Gerçek üretim dağıtımından önce bu değişken `false`
    yapılmalı** — bunu ben yapamam, ortam/dağıtım kararı.
23. **Bare except.** `QuakeMindBackend/apps/disaster_nlp/src/ner_extraction.py:79`:
    çıplak `except:` → `except Exception:` (dosyanın geri kalanıyla tutarlı hâle getirildi).

## ✅ Üçüncü denetim turu (2026-09-19) — açık maddelerin çözümü

Önceki turda "doğrulama bekliyor" diye bırakılan 6 maddenin 5'i bu turda araştırılıp
kapatıldı; 1'i (veri erişim politikası) kullanıcı tercihiyle bilinçli olarak açık bırakıldı.

24. **P382/P383/P358/P448 — bölge bazlı R0/R3 süreleri GERÇEKTEN YANLIŞTI (doğrulandı ve
    düzeltildi).** `full_run.json`'dan H-Z1 ve K-Z1'i EMSR648 kuralı başına bağımsız olarak
    yeniden hesapladım (`R0`/`R3`'ün `time_min_raw` alanları üzerinden, n=58-60 görev/kural).
    Sonuç, metindeki eski sayıların yaklaşık **yarısı** çıktı (ör. H-Z1 katı fark: metin 7,3
    dk / gerçek 14,6 dk; K-Z1 orta-gevşek fark: metin 53,4 dk / gerçek 108,7 dk). Bunu kesin
    doğrulamak için görev-sayısı ağırlıklı ortalamasını aldım: H-Z1 (n=60) ve K-Z1 (n=58-60)
    yeni değerlerinin ağırlıklı ortalaması, **Tablo 17'nin zaten doğrulanmış havuzlanmış
    değerleriyle (7,3 katı / 78,9 orta-gevşek) ondalık basamağına kadar birebir eşleşti** —
    yani eski bölge-bazlı sayılar yanlış, yeni hesaplanan sayılar doğru. Düzeltilen 4 yer:
    P382 (H-Z1: R0=25,2±47,0/R3=10,6±6,3, fark 14,6 dk katı; R0=61,0±122,8/R3=10,8±6,3,
    fark 50,2 dk orta-gevşek — K-Z1: R0=R3=12,6±5,8 katı; R0=121,7±185,2/R3=13,0±6,1,
    fark 108,7 dk orta-gevşek), P383 (R3'ün kendi süre aralığı "10,0-11,5" → "10,6-13,0"),
    P358 (K-Z1 orta-gevşek fark "53,4 dk" → "108,7 dk"), P448 (K-Z1 katı→orta-gevşek geçişi
    "11,3→64,9 dk" → "12,6→121,7 dk").
25. **Tablo 23 "Eğitim süresi (sn)"** — DÜZELTİLDİ. `leaderboard.csv`'deki gerçek wall-clock
    değerleriyle (14,97/5,21/11,00/0,14/36,46/1,23/0,33) değiştirildi.
26. **P24 vs P27-28 — "iki bölge"/"dört ilçe" belirsizliği** — DÜZELTİLDİ. P24'e kısa bir
    açıklayıcı cümle eklendi: EMSR648'in sorguladığı dört ilçeden (H-Z1, H-Z3, K-Z1, K-Z2)
    yalnızca ikisinin (H-Z1, K-Z1) 3 km yarıçapının derecelendirilmiş kesim içerdiği, diğer
    ikisinin boş çıktığı artık P24'ün kendisinde de açık.
27. **P337/P339 — "dokuz senaryo yapılandırması" (Tablo 16)** — KAYNAĞI BULUNAMADI, sayı
    DEĞİŞTİRİLMEDİ ama bu artık metinde AÇIKÇA belirtiliyor. Geniş bir arama yapıldı
    (`model_benchmarks/`, `QuakeMindBackend/` içinde "gecikme/latency/380 gözlem/9 senaryo"
    için) — bu ölçümü üreten istemci betiği repoda bulunamadı (çalışmanın diğer tüm yeniden
    koşulan bileşenlerinin aksine — rota, risk skoru, NLP, hepsinin `model_benchmarks/`
    içinde çalıştırılabilir karşılığı var, bu tablonunki yok). "Dokuz" sayısını körlemesine
    "sekiz" yapmak yanlış olabilirdi (neyi saydığı belirsiz — bölge mi, kanal×kaynak
    kombinasyonu mu); bunun yerine P337'ye bu belirsizliği açıkça itiraf eden bir cümle
    eklendi. Bu, makalenin "kayıp/doğrulanamayan" konularda zaten kullandığı dürüst
    çerçeveyle tutarlı — mantıksal bir çelişki değil, ama artık okuyucuya gizlenmiyor.
28. **Veri Erişilebilirliği (P500) — açık placeholder.** Kullanıcıya soruldu, **bilinçli
    olarak açık bırakılmasına karar verildi** ("kendim karar veririm"). Dokunulmadı.
29. **İstatistiksel anlamlılık testi / güven aralığı eksikliği** — bu bir "hata" değil, bir
    akademik-tamlık eksikliği (yalnız ortalama±std var, p-değeri/CI yok). Düzeltmesi yeni bir
    analiz eklemek anlamına geliyor, mevcut bir hatayı düzeltmek değil — gelecek çalışma /
    hakem yanıtı kalemi olarak kayıtlı kalıyor, otomatik uygulanmadı.

## Referans: bu sürümde eklenen gerçek kod

- `model_benchmarks/06_rota/real_run/` — Algoritma 1 (`naive_agent.py`), Algoritma 2
  (`synthetic_closures.py`), Algoritma 3 (`assignment.py`), EMSR648 eşleme
  (`emsr648_closures.py`), görev kilitleme (`task_locking.py`), sahne/bölge tanımları
  (`scenario.py`), orkestrasyon (`run_full.py`), analiz (`analyze*.py`).
- Gerçek EMSR648 MONIT01 verisi: `QuakeMindBackend/apps/road_damage/data/emsr648/{AOI04,AOI11}/`
  (Copernicus EMS'ten indirildi, 2026-09-17).
- Ham koşum çıktısı: `model_benchmarks/06_rota/real_run/results/full_run.json` ve
  `analysis_summary.json` (8 bölge × 10 tohum × 6 görev, R0/R1/R2/R3).
- `feature/ip4-heatmap-safe-route` (2026-09-19'da `main`'e merge edildi, dal remote'tan silindi) —
  `QuakeMindBackend/apps/road_damage/utils/heatmap.py` (Gauss KDE ısı haritası),
  `.../utils/network.py::apply_risk_penalties`/`risk_weight` (risk-ağırlıklı güvenli güzergâh),
  `.../utils/postgis_manager.py` (birleşik `damage_points` tablosu), `/api/road_damage/heatmap`
  ve ilgili uç noktalar (`fastapi_app.py`), web tarafı `HeatmapLayer.tsx` + `command/map/page.tsx`
  "Birleşik Isı Haritası" katmanı.
