# QuakeMind — Eksikler ve Sorunlar Takip Dosyası

Bu dosya, makale ve proje üzerinde tespit edilen her eksik, hata ve açık konuyu
tek yerde tutar. Amaç hiçbir sorunun gözden kaçmaması ve sonradan geri dönülebilmesidir.

**Son güncelleme:** 12 Eylül 2026 (ikinci tur — bkz. değişiklik günlüğü)
**Nasıl kullanılır:** Her maddenin bir kimliği var (örn. `M-01`). Kapatınca durumu
`KAPALI` yapın ve kapanış tarihini yazın; satırı silmeyin — geçmiş kalsın.

## Önem dereceleri

| Kod | Anlamı |
|---|---|
| 🔴 KRİTİK | Hakem tek başına ret gerekçesi sayabilir; gönderimden önce mutlaka çözülmeli |
| 🟠 YÜKSEK | Gönderimden önce çözülmeli; çözülmezse ciddi revizyon isteği gelir |
| 🟡 ORTA | Makaleyi güçlendirir; eksikliği savunulabilir ama zayıflatır |
| ⚪ DÜŞÜK | Biçim, adlandırma, düzen |

## Durumlar

`AÇIK` · `DEVAM EDİYOR` · `KAPALI` · `KARAR BEKLİYOR` (kullanıcı kararı gerekiyor)

---

# A. MAKALE — KRİTİK BULGULAR

## A-01 🔴 SegFormer satırı diğer beş mimariyle karşılaştırılabilir değil
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026

**Sorun.** Tablo 12'deki beş taban mimari **ayrılmış test kümesinde** ölçülmüştür:
`model_benchmarks/01_yol_hasari/local_colab_run/build_notebook.py` üç katmanlı bölme
yapıyor (%70/15/15, tohum 42), en iyi ağırlığı geri yüklüyor, sonra `test_loader`
üzerinde değerlendiriyor. SegFormer'ın 0,4276 değeri ise `optimized_training_colab.ipynb`
çıktısındaki **"En iyi Val IoU"** — iki katmanlı bölme, erken durdurmanın seçtiği
devirdeki **doğrulama** skoru. Ayrılmış test kümesi yok.

En iyi doğrulama skoru seçim yanlılığı taşır ve sistematik olarak iyimserdir.
Dolayısıyla 0,3700 → 0,4276 farkı modele atfedilemez.

**Nerede.** Öz; Abstract; Bölüm 4.2 satır "Esas alınan SegFormer yapılandırması
0,4276 ile beş kıyaslama mimarisinin tümünün üzerindedir"; Tablo 12 SegFormer satırı.

**Yapılacak.** SegFormer'ı aynı üç katmanlı bölmeyle (%70/15/15, tohum 42) yeniden
koştur ve test kümesi IoU_hasar değerini raporla. Defter ve veri mevcut.

---

## A-02 🔴 Öz ve Abstract, A-01'deki kaydı taşımıyor
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026

**Sorun.** Öz'de *"en yüksek hasar sınıfı IoU değeri 0,4276 ile SegFormer
yapılandırmasında elde edilmiştir"*, Abstract'ta *"the highest damage-class IoU
(0.4276) obtained by the SegFormer configuration"* geçiyor. Makalenin gövdesinde
(dipnot ve sapma listesi) kayıt var, ancak Öz'de yok. Hakem Öz ile Bölüm 4.2
arasındaki bu farkı "üstü örtülü iddia" olarak nitelendirir.

**Yapılacak.** A-01 çözülene kadar iddiayı Öz ve Abstract'tan çıkar. Yerine:
"kıyaslama mimarileri arasında en yüksek IoU_hasar LinkNet'te (0,3700) elde
edilmiştir; esas alınan yapılandırmanın aynı protokolde değerlendirilmesi
sürmektedir."

---

## A-03 🟠 Bölüm 4.2 iddiayı önce olgu olarak kuruyor
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026

**Sorun.** *"Esas alınan SegFormer yapılandırması 0,4276 ile beş kıyaslama
mimarisinin tümünün üzerindedir. Ancak bu fark bir mimari üstünlüğü kanıtı olarak
sunulamaz..."* — olumlu iddia önce, kayıt sonra geliyor. Alıntılanan cümle ilki olur.

**Yapılacak.** Sırayı ters çevir: önce protokol farkını söyle, sonra sayıyı ver.

---

## A-04 🔴 İç çelişki — artçı ayıklaması yapıldı mı yapılmadı mı?
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026

Bölüm 3.7 "kümelenmeden arındırma uygulanarak artçı sarsıntılar ayıklanır" diyor;
Bölüm 4.11 son paragrafı "katalogda artçı ayıklaması yapılmamıştır" diyor. İkisi
aynı anda doğru olamaz. Çözülmezse Tablo 22'nin tüm değerleri sorgulanır.

**Yapılacak.** `model_benchmarks/05_risk_skoru/local_run/run_all_risk.py` kontrol
edilip hangisinin doğru olduğu belirlenecek, diğer bölüm düzeltilecek.

---

## A-05 🟠 Vaat edilen iki naif risk tabanı Tablo 22'de yok
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026

Bölüm 3.7 "yalnızca fay mesafesine dayalı" ve "yalnızca geçmiş sismisite
yoğunluğuna dayalı" iki naif taban vaat ediyor; Tablo 22'de yoklar. Bu tabanlar,
PR-AUC'nin temel oranla karşılaştırılması argümanının tamamlayıcısıdır.

**Yapılacak.** İkisini koştur ve tabloya ekle (tek öznitelikli sıralama,
dakikalar sürer) ya da Bölüm 3.7'deki vaadi kaldır.

---

## A-06 🔴 Sentetik kapanma üreticisi Bölüm 3'te hiç tanımlanmamış
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-04

`sentetik` sözcüğü Bölüm 3'te (5 788 kelime, satır 62–301) **sıfır kez** geçiyor;
makalenin tamamında 13 kez, hepsi Bölüm 4–5'te. Manşet sonucu (206,6 ↔ 1 641,0 dk)
üreten kapanma kümesinin nasıl üretildiği hiçbir yerde yazmıyor: kaç kapanma,
hangi dağılım, hangi uzamsal kural, hangi tohum.

**Yapılacak.** Bölüm 3'e "3.10. Sentetik Kapanma Üretimi" alt bölümü ekle; üretici
algoritmayı, kapanma sayısını/oranını, uzamsal seçim kuralını, tohumu ve EMSR648
oranlarıyla (%1,58 / %1,71) kalibrasyonu yaz. Kod referansı: `QuakeMindBackend/benchmark/`.

---

## A-07 🔴 Ekip–hedef atama kuralı tanımsız
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-05

Bölüm 3.9 toplam **102 kelime** ve yalnızca kilitlemeyi tarif ediyor (HTTP 409,
üç rollü yetkilendirme). Oysa 206,6 dakika tamamen atama kararına bağlı: hedef
sıralama ölçütü, eşitlik bozma, ekip başına eşzamanlı görev, görev sonrası
yeniden atama. Naif referansın (R0) aynı atama kuralını kullanıp kullanmadığı da
belirsiz — kullanmıyorsa karşılaştırma adil değil.

**Yapılacak.** Bölüm 3.9'a atama yordamını sözde kodla ekle (Algoritma 2).

---

## A-08 🔴 Tek etiketli ↔ çok etiketli çelişkisi ve iki farklı eşik
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-07

Bölüm 3.6: *"ihbarı 13 alt kategoriden **birine** atar"* (tek etiketli), eşik 0,30.
Bölüm 4.10 ve Tablo 21: *"çok etiketli"*, eşik 0,50. Raporlanan tüm metin başarımı
çok etiketli kurguya ait; yöntem tek etiketli sınıflandırıcı tarif ediyor.

**Yapılacak.** Bölüm 3.6'yı fiilen koşulan kurguya göre yeniden yaz; iki eşiğin
hangisinin ne için kullanıldığını aynı paragrafta tanımla.

---

## A-09 🔴 Üç geçilebilirlik kuralı Bölüm 3'te yok; üstelik atıf yanlış
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-08

`Katı kural`, `Dengeli kural`, `Gevşek kural` ifadelerinin her biri makalede **tam
bir kez** geçiyor, üçü de Bölüm 4'te; Bölüm 3'te **sıfır**. Buna karşın Bölüm 4.3
*"Bölüm 3.2'de tanımlanan üç kural"* diyor — Bölüm 3.2 "Çalışma Alanı ve Veri
Kaynakları" bölümüdür, böyle bir tanım içermez. Tablo 19 bu kurallar üzerine
kurulu olduğu için okunamaz durumda.

**Yapılacak.** Hasar derecesi → geçilebilirlik eşlemesini tablo hâlinde Bölüm 3'e
ekle; 4.3'teki atfı düzelt.

---

## A-10 🟠 Yakınlaştırma düzeyi seçiminde üç hata
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-12

Bölüm 3.3: (i) Web Mercator yer çözünürlüğünde `cos φ` düzeltmesi yok — Hatay için
`cos 36,2° ≈ 0,807`, düzeltmesiz alan %24 büyük görünür; (ii) sağlayıcının harita
karosu (256/512 px) ile modelin karosu (512 px) karışmış; (iii) "hedef karo sayısı
altı" muhtemelen kenar başına — toplam 36 karo demek, çıkarım süresi tahmini altı
kat sapıyor.

---

## A-11 🟡 λ(d)'nin ilk basamağı sert kapatma yarıçapıyla örtüşüyor
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-13

`r_h = 25 m` altındaki kenarlar çizgeden çıkarıldığı için Denklem (9)'un
`λ = 3,0` basamağı (`d < 50 m`) fiilen yalnızca 25 ≤ d < 50 m bandında çalışır.
Metin bunu söylemiyor.

---

## A-12 🟡 Kenar orta noktası ölçütü bir yerde reddedilip başka yerde kullanılıyor
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-14

Bölüm 5 orta nokta ölçütünü eleştiriyor ("kenarın bir ucundaki kapanmayı
sistematik olarak kaçırır"); Tablo 4 notu ise "Damaged" cezasını **orta nokta**
üzerinden uyguluyor. Savunulabilir bir tasarım kararı ama iki yer bağlanmamış.

---

## A-13 🟠 Bölüm 4.1.1 kendisiyle çelişiyor
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-16

*"eğitim ortamına ait alanlar Bölüm 4.2'deki karşılaştırma yürütüldükten sonra
raporlanacaktır"* — oysa 4.2 zaten yürütülmüş, Tablo 12 dolu.

---

## A-14 🔴 Geçilebilirlik kuralı adları ve tanımları makale ile kodda ters
**Durum:** KAPALI (16 Eylül 2026) — kullanıcı tercih belirtmedi; makale koşulan koda uyduruldu (M-76) · **Bulundu:** 16 Eylül 2026 · **Birleşik liste:** M-76 · **İlgili:** E-01, J-28, J-29, M-26

Makale (Bölüm 3.2 P87, Tablo 4, 4.3, 4.8, Tablo 19): **katı** = Destroyed + Damaged kapalı;
**dengeli** (esas) = Destroyed kapalı, Damaged yumuşak ceza; **gevşek** = yalnız Destroyed kapalı.
Kod (`benchmark/copernicus_ground_truth.py:158`): `strict` = yalnız Destroyed; `medium` =
Destroyed + Damaged; `loose` = + Possibly damaged. Yani makaledeki **gevşek = kodun strict**'i,
makaledeki **katı = kodun medium**'u; kodun `loose`'u makalede yok; makalenin **esas aldığı
dengeli kural hiç koşulmadı** (E-01: "Damaged = ağırlık cezası uygulanmadı").
J-28, J-29 ve devir belgesi Türkçe "katı/orta/gevşek" adlarını **kod anlamında** kullanıyor.
Bu adlarla sayılar makaleye taşınırsa bir kurala ait sonuç başka bir kurala atfedilir.

**Yapılacak.** Kullanıcı kararı: (a) makalenin tanımlarını koşulan kodla hizala, ya da
(b) dengeli kuralı (Damaged = yumuşak ceza) kodda uygulayıp 10 tohumla koş. Karar verilene
kadar Tablo 13 "Kural" sütunu, Tablo 19, Bölüm 4.8 ve EMSR satırları yazılmayacak.

---

## A-15 🔴 Tablo 13'teki SegFormer ile beş mimari aynı koşullarda karşılaştırılmamış
**Durum:** KARAR BEKLİYOR — hangi mimarilerle yeniden koşulacağı kullanıcıya soruldu · **Bulundu:** 19 Eylül 2026 · **Birleşik liste:** M-96, M-90 (ayrıntı) · **İlgili:** KALAN_ISLER.md madde 6

Kaynaklar (yalnız `makale` dalında var; `main` ve diğer dallarda `model_benchmarks/` yok):
beş mimari `model_benchmarks/01_yol_hasari/local_colab_run/build_notebook.py`, SegFormer depo kökündeki
`optimized_training_colab.ipynb` (çıktılarıyla birlikte). Eğitim tarifi ortak: aynı 842 görüntü (KATE-CD `train`
404 + MEDBFS Türkiye 438), focal + dice (0,5/0,5), AdamW 2e-4, kosinüs yeniden başlatmalı çizelge, aynı
artırımlar, parti 8, en çok 50 dönem, sabır 8, gradyan kırpma 1,0, ImageNet ağırlıkları.

Farklar (sonucu karşılaştırılamaz kılıyor):
1. **Bölme:** beş mimari %70/15/15 (sınama kümesi var); SegFormer %85/15, **sınama kümesi yok**. 0,4276 doğrulama
   kümesinden, en iyi dönem de aynı kümeyle seçilmiş (iyimser).
2. **Ölçüt:** SegFormer'ın 0,4276'sı yalnız hasar sınıfının IoU'su, **parti başına ortalanmış**; beş mimarininki
   tüm sınama pikselleri üzerinden. `results/00_comparison_table.csv` bu değeri `mean_iou` (hasar + arka plan
   ortalaması, 0,66–0,68) sütununa yazmış — elma ile armut.
3. **Kapasite:** SegFormer MiT-B4 61,4 M parametre; ResNet-18'li dört mimari 11,3–14,3 M. Yakın olan yalnız
   DeepLabV3+ ResNet-101 (45,7 M).
4. **Makalenin kendi sözü tutulmamış:** Tablo 6 tüm mimariler için "kodlayıcı (hedeflenen): MiT-B4", Tablo 24
   "kodlayıcı sabitlemesi, mekânsal blok bölmesi ve çoklu tohum" diyor; hiçbiri yapılmadı. Ayrıca
   **smp 0.5.0'da LinkNet ve UNet++ MiT kodlayıcısını desteklemiyor** (yerel deneme) → Tablo 6'daki LinkNet +
   MiT-B4 hedefi uygulanamaz; PSPNet + MiT-B4 yalnız ilk üç kademeyi kullanıyor (26,5 GFLOPs).
5. KATE-CD'nin resmî `validation` (44) ve `test` (38) bölmeleri hiç kullanılmamış.
6. `01_yol_hasari/0*.ipynb` ve `02_bina_hasari/0*.ipynb` (Mask2Former dahil) defterleri hiç koşulmamış
   (çıktısız şablonlar).

Yerel ölçüm (19 Eylül, smp 0.5.0, 1×3×512×512, `FlopCounterMode`; SegFormer değerleri Tablo 13 ile birebir):
MiT-B4 kodlayıcıyla Segformer 61,4 M / 116,6 GFLOPs · U-Net 64,1 / 129,1 · FPN 62,7 / 123,5 · DeepLabV3+ 62,0 /
134,5 · UPerNet 69,2 / 212,4 · PAN 61,1 / 131,0 · MAnet 71,6 / 132,1 · DeepLabV3 65,6 / 1 249,1 (pratik değil).
Başka kodlayıcıyla: DeepLabV3+ ResNet-101 45,7 / 111,9 · UPerNet ConvNeXt-S 58,7 / 197,0 · U-Net ConvNeXt-S
53,6 / 115,6 · UPerNet ResNet-101 56,3 / 191,6 · U-Net HRNet-W48 72,2 / 202,5. Ölçek: SegFormer B0 3,7 / 15,5 ·
B2 24,7 / 50,1 · B5 82,0 / 148,5.

**Yapılacak.** Seçilen mimarilerin tamamı aynı bölme (veri seti incelemesinden sonra karar), aynı ölçüt
(hasar IoU'su tüm sınama pikselleri üzerinden + kesinlik/duyarlılık/F₁) ve aynı tohumlarla Colab'da yeniden
eğitilmeli; Tablo 6, 13, 24 ve Şekil 7 buna göre güncellenmeli.

**İlk sonuç — SegFormer MiT-B4 (19 Eylül 2026, Colab T4, tohum 42; ayrıntı `QuakeMind_veri/cikti/sonuclar/`):**
Koşu A (ortak mekânsal bölme): en iyi dönem 15/23 (erken durdurma), doğrulama IoU_hasar 0,421; **sınama (103 sonrası karo)
IoU_hasar 0,401**, kesinlik 0,534, duyarlılık 0,618, F1 0,573; KATE-PD 0,410 · MEDBFS 0,086 (n = 12) · Hatay 0,398 ·
Kahramanmaraş 0,407; 53 öncesi karoda yanlış alarm 0 (eşik 0,2'de bile 0 → büyük olasılıkla görünüm kestirmesi, gerçek
hasarsız sonrası alanı temsil etmez). Maliyet 61,37 M / 116,6 GFLOPs / T4'te 70 ms. Koşu B (KATE-PD resmî bölmesi):
doğrulama 0,469, sınama (79) 0,481 (F1 0,650); yayımlanmış U-Net ResNet-152 doğrulama 0,36 (IoU hesap yöntemi doğrulanmalı).
Tanı: çözünürlük etkisi belirgin — Maxar 0,375 m 0,486 (n = 16) · Pléiades 0,5 m 0,395 (n = 75) · MEDBFS 0,75 m 0,086;
3 piksel sınır toleransı IoU'yu yalnız 0,401 → 0,466 yapıyor (hataların çoğu kenar kayması değil); bina/bileşen düzeyi:
>200 m² hasar kümelerinin %74'ü (KATE-PD'de %78) bulunuyor, 50–200 m²'nin %32'si; tahmin edilen 189 bileşenin 63'ü yanlış
alarm (bileşen kesinliği 0,67); eşik 0,2–0,8 arasında sınama IoU'su değişmiyor (0,397–0,402); parlaklık etkisi zayıf
(Spearman r = 0,18, p = 0,08). Protokol notu: erken durdurma sabrı (8) kosinüs döngüsünden (10–20 dönem) kısa; ikinci
döngü tamamlanmadan duruyor.

**Deneme 2 (19 Eylül 2026, kullanıcı isteği; mevcut model korunarak ayrı klasöre):** MEDBFS eğitimden ve ölçümden çıkarıldı
(sonrası + öncesi), SABIR = 20 (en çok 50 dönem), diğer her şey aynı. En iyi dönem 30/50 (doğrulama 0,465; 23. dönemde
durulsaydı en iyi 0,444 kalacaktı). **Aynı 91 KATE-PD sınama karosunda: yeni 0,434 (P 0,591 · R 0,620 · F1 0,605), eski model
0,410 (P 0,543 · R 0,627 · F1 0,582)** → kazanç büyük ölçüde kesinlikte (daha az yanlış alarm). Tek tohum; fark tohum
değişkenliği içinde olabilir. İki değişiklik aynı anda yapıldığı için katkıları ayrılamıyor. Süre 73 dk (T4).

**Ek veri — QuickQuakeBuildings (19 Eylül 2026, kullanıcı onayıyla):** TeraBox hesap istediği için veri kaynaklarından
yeniden kuruldu: Maxar ARD katalog 1040010082698700 (2023-02-07, 0,305 m, CC BY-NC 4.0; 4 karo, 314 MB) + OSM bina
poligonları 2023-03-01 tarihli attic sorgusuyla (4 029 kimlik; 169 yıkık; 1 kayıt Teksas'ta çıktı → çıkarıldı).
`araclar/qqb_osm.py`, `araclar/qqb_karola.py`: 0,375 m'ye örneklenmiş 425 karo (512²); 63'ü yıkık bina içeriyor, 362'si
yalnız sağlam bina (deprem sonrası gerçek negatif). Mevcut bölmeyle uyum: doğrulama/sınama bloklarındaki ya da o karolarla
örtüşen 86 karo dışarıda → **339 karo eğitime girebilir**, sınama kümesi değişmedi. Önizleme: `cikti/qqb_onizleme.jpg`.
Uyarılar: etiket yalnız tamamen yıkık binalar (kısmi hasar "sağlam" sayılmış olabilir; önizlemede birkaç örnek); OSM
çizimleri deprem öncesi görüntüden, 1–2 m kayma var. TE23D (YTÜ) için yazarlarla iletişim sonraya bırakıldı.

**Karar (19 Eylül 2026, kullanıcı):** üç grup, 9 model — MiT-B4 kodlayıcıyla SegFormer, U-Net, FPN, DeepLabV3+,
UPerNet; aynı kapasitede DeepLabV3+ ResNet-101 ve UPerNet ConvNeXt-S; ölçek için SegFormer B0 ve B2. Eğitime
geçilmeden önce parametreler ve veri hazırlığı sabitlenecek (tohum sayısı sonra).

**Devir (19 Eylül 2026 akşam, kullanıcı kararı):** 9 modelin eğitimi **Utku'ya devredildi**. Paket:
`Desktop\2209-A Afet\QuakeMind_Devir_Utku_Egitim_2026-09-19\` (+ aynı adlı `.zip`, 6,3 MB; `BENIOKU.md` devir notu),
web sürümü https://claude.ai/artifact/DUDdsRkgACUA4xPs1hgtWC (özel; kullanıcı paylaşacak). Yeni defter
`QuakeMind_veri/defterler/02_dokuz_model_protokol.ipynb` (`araclar/defter_dokuz_model.py` üretir): P1/P2 protokol
seçimi (P2 = MEDBFS yalnız dış sınama + SABIR 20, önerilen), tohum döngüsü ve tamamlananı atlama, QQB eğitime ekleme
(A3) ve **74 karoluk QQB dış sınaması** (deprem sonrası sağlam binalarda bina düzeyinde yanlış alarm; `araclar/qqb_bolme.py`
→ `qqb/qqb_bolme.csv`, `qqb_paket.json`: 339 eğitim / 74 dış sınama / 12 dışarıda), bölge kısıtlı eğitim (Tablo 15),
kayıp ağırlığı (Tablo 21), morfoloji 0/1/2, Koşu B, özet hücresi (Tablo 13 ort. ± ss, Tablo 15, iki şekil). Yerelde CPU
duman testiyle bütün kombinasyonlar denendi; QQB karoları Colab kodu ile yerel `qqb_karola.py` çıktısı 55 yıkık binalı
karoda birebir aynı. Önerilen sıra: P2 SegFormer → P2+QQB kıyası → 9 model tek tohum → en iyi 3 model × 3 tohum →
Tablo 15 (3 koşu) → Tablo 21 (4 koşu).

---

## A-16 🔴 Bölütleme eğitim verisinde sızıntı ve hiç negatif örnek yok
**Durum:** AÇIK — veri hazırlığı önerisi kullanıcıya sunuldu · **Bulundu:** 19 Eylül 2026 · **İlgili:** A-15, M-96, M-24

Ölçülenler (Hugging Face kart/API, KATE-CD GitHub, Zenodo kaydı ve MEDBFS arşivinin uzaktan okunması):
- **KATE-CD** (Nayir vd., SAMCD makalesi, JARS): 7 il (Adıyaman, Gaziantep, Hatay, Kahramanmaraş, Kilis, Osmaniye,
  Malatya), Maxar Open Data + Airbus Pléiades, 0,3–0,5 m, EPSG:32637, 512×512, 486 öncesi/sonrası çifti; resmî bölme
  404/44/38; etiket = hasarlı bina poligonları (ikili). **Lisans CC0 1.0** (`CITATION.cff`) — "lisans veri
  kartında yok" notu böylece kapanıyor. Hugging Face sürümünde karoların konumu/adı yok.
- **MEDBFS** = Zenodo 11647956 "AIR-DERSL-Earthquake Feature Set", **CC BY-NC 4.0**; `Turkey.zip` 3,33 GB, 438 karo
  (512×512, ~0,75 m), öncesi + sonrası + etiket (0/1). Karolar 6 büyük sahneden (`part0`…`part5`: 26/28/66/146/137/35).
  GeoTIFF'lerde yalnız **sahnenin** başlangıç noktası var (karonun değil), CRS etiketi yok. **Düzeltme (19 Eylül,
  aynı gün):** ilk hesap 512 piksel adım varsaydığı için yanlıştı; karolar **256 piksel adımla, yarı örtüşmeli**
  kesilmiş. EPSG:32637 + 256 adım, KATE-PD'nin Maxar karolarıyla şablon eşleştirmesiyle doğrulandı (16 güçlü eşleşme,
  konum farkı ≤ 4,5 piksel ≈ 3 m; görsel: `QuakeMind_veri/cikti/dogrulama_medbfs_katepd_duzeltilmis.png`).
  Gerçek konumlar (geoBoundaries il/ilçe sınırlarıyla): Kahramanmaraş/Türkoğlu 283, Gaziantep/İslahiye 94,
  Gaziantep/Nurdağı 35, Hatay/Hassa 26. `PreCloud.txt`'teki 386 bulutlu öncesi görüntünün hepsi Fas'a ait.
- **Envanter (19 Eylül, `QuakeMind_veri/araclar/envanter.py`):** KATE-CD'nin 486 sonrası görüntüsünün **tamamı KATE-PD'de
  piksel piksel aynı** ve aynı resmî bölmede (404/44/38 ↔ train/val/test) → KATE-CD yeni sonrası görüntü getirmiyor,
  katkısı öncesi görüntüleri. KATE-PD'de aynı ızgara hücresinden 32 neredeyse aynı çift var (hepsi aynı bölmede).
  KATE-PD'de hasarsız karo yok (ort. hasar oranı %3,0); MEDBFS'te 1 (ort. %0,66). MEDBFS'in kendi içinde **1 953 örtüşen
  karo çifti** var (rastgele bölmede büyük sızıntı); KATE-PD'nin 27 karosu MEDBFS'in 45 karosuyla aynı yerde
  (İslahiye) → ikisi aynı bölmeye düşmeli. İl dağılımı: KATE-PD Hatay 340, Kahramanmaraş 199, Gaziantep 180,
  Malatya 63, Adıyaman 24, Osmaniye 23, Kilis 3; Tablo 15 için Hatay 366, Kahramanmaraş 482 karo.

Sorunlar:
1. **Sızıntı:** her iki eğitimde de bölme karo düzeyinde rastgele; aynı sahnenin komşu karoları eğitim ve sınamaya
   dağılıyor → sonuçlar iyimser.
2. **Negatif örnek yok:** 842/842 karo hasarlı (SegFormer defteri çıktısı). Model hasarsız bir sahneyi hiç görmedi;
   yanlış alarm davranışı ne öğretildi ne ölçüldü (J-30'daki yanlış alarm sorunuyla doğrudan ilgili).
3. KATE-CD'nin resmî doğrulama/sınama bölmeleri kullanılmadı (A-15/5).
4. Çözünürlük karışık: KATE-CD 0,3–0,5 m, MEDBFS 0,75 m; simülasyon için düşünülen Help.NGO drone 3–8 cm.

**Yapılacak (öneri):** KATE-CD resmî bölmesi + MEDBFS sahne bazlı bölme (ör. eğitim part3+4, doğrulama part0+1,
sınama part2+5); olay öncesi görüntüler (bulutlu olanlar hariç) aynı bölmede tüm-sıfır etiketli negatif örnek
olarak eklenir; sonuçlar iki küme için ayrı raporlanır.

**Durum (19 Eylül 2026, DEVAM EDİYOR):** Ortak bölme listesi kuruldu (`QuakeMind_veri/araclar/bolme.py` →
`cikti/bolme_listesi.csv`, 2 194 satır): 2 km UTM blokları, il bazında %80/%10/%10 (kare sapması en küçük atama),
tampon kuralı (örtüşen karolardan düşük öncelikli olan kullanılmaz; 28 MEDBFS karosu), doğrulama/sınamada
küme içi örtüşmesiz alt küme ölçüte girer (62 karo dışarıda). Sonuç: KATE-PD 636/105/91, MEDBFS 359/17/34 (+28 tampon),
öncesi (negatif) 736/85/75; bölmeler arası örtüşen çift **0**. Örtüşen blokları birleştirme denendi, MEDBFS sahneleri tek
parça olup Maraş doğrulamasını %27'ye çıkardığı için bırakıldı. SegFormer defteri (`araclar/defter_segformer.py`,
liste gömülü) yerelde duman testinden geçti ve Colab'da (T4) koşuluyor; çıktılar Drive `QuakeMind_egitim/`.

**Karar (19 Eylül 2026, kullanıcı):** veri setleri kesin — **KATE-CD, KATE-PD, MEDBFS**.
**KATE-PD** (Musaoğlu vd., IGARSS 2025; HF `CSCRS/kate-pd`, CodeOcean DOI 10.24433/CO.8064763.v1): yalnız deprem
sonrası görüntü (bizim modelin girdisiyle aynı), aynı 7 il, Maxar + Pléiades 0,3–0,5 m, 832 karo, resmî bölme
675/78/79 (karo kimlikleri bölmeler arasında iç içe → karo düzeyinde rastgele, mekânsal değil). **Veri lisansı CC0 1.0**
(CodeOcean `data/LICENSE`, 19 Eylül'de görüldü). Yayımlanmış taban: SMP U-Net ResNet-152, Jaccard kaybı, doğrulama
IoU 0,36. CodeOcean'da karoların konumunu veren `data/preprocessing/grid_maxar.geojson` (1 013 KB),
`grid_pleidas.geojson` (725 KB), `katepd_polygons.geojson` (1,78 MB) var — Hatay/Maraş ayrımı ve mekânsal blok
bölmesi için gerekli; indirmek için kullanıcı izni bekleniyor.
**Yeni risk:** KATE-CD de aynı ekibin, aynı görüntü ve ızgaradan (834 etiketli sonrası görüntünün 486'sı çiftlenmiş;
KATE-PD 832 karo). KATE-CD sonrası görüntüleri büyük olasılıkla KATE-PD'nin alt kümesi → iki küme birlikte
kullanılırsa aynı görüntü bir kümede eğitimde, ötekinde sınamada olabilir. Görüntü özetleriyle (hash) denetlenmeli.

---

## A-17 🟠 Makaledeki yer tutucuların doldurma haritası
**Durum:** AÇIK · **Bulundu:** 19 Eylül 2026 · **İlgili:** A-15, A-16, KALAN_ISLER.md 6–10

v3'te (kullanıcının 19 Eylül dosyası) 88 `[ÖLÇÜLECEK]`, 6 `[TARANACAK]`, 1 `[KARŞILAŞTIRILAMAZ]`, 1 `[GELECEK ÇALIŞMA]`:
Tablo 5 (6), Tablo 13 (5 + 1), Tablo 14 (36 + 6 τ), Tablo 15 (28), Tablo 21 (7), Tablo 24 (4), 5.3(q) ve Bölüm 4
girişindeki "iskelet" cümlesi. Doldurma yolu:
- **Tablo 5** → v3'ün yeni çerçevesinde "yol hasarı kümesi" değil, üç eğitim kümesinin künyesi olmalı; veriden ve
  küme makalelerinden ölçülür (eğitim gerekmez).
- **Tablo 13** → 9 model aynı protokolle (A-15 kararı), Colab.
- **Tablo 15** → karoların il bilgisi gerekir (KATE-PD ızgara dosyaları; MEDBFS hesaplandı); SegFormer Hatay / Maraş /
  birleşik eğitim, Colab.
- **Tablo 14** → eğitilen modeller EMSR648 AOI04/AOI11 üzerindeki deprem sonrası uydu görüntüsünde koşulur, kapanma
  kesim düzeyinde EMSR648 ile karşılaştırılır; τ taraması yerelde.
- **Tablo 21** → harmanlama ve morfoloji yalnız çıkarım (ucuz); kayıp ağırlıkları ek eğitim; r_h ve λ(d) yeni
  simülasyonda; V₀ modülü yok (gelecek çalışma olarak kalmalı); risk ağırlıkları yerelde.
- **Tablo 24** → satırlar yukarıdakilerden dolar; "çok mimarili kıyaslama — yol" satırı yeni çerçevede Tablo 13 ile
  birleşmeli; YOLO mAP ayrı iş.
- **Bölüm 3.10** 2 km × 2 km mekânsal blok (%80/10/10), ikincil rastgele bölme ve **model başına 10 tohum** vaat
  ediyor → koşulacak protokolle metin eğitimden önce hizalanmalı.

---

## A-18 🟠 Yeniden kurulan QuickQuakeBuildings verisinde etiket ve bölme sorunları
**Durum:** AÇIK · **Bulundu:** 19 Eylül 2026 (QQB makalesinin incelemesi, `Furkan--Utku--Model_ve_veriseti_aktarımı/AKTARIM_BELGESI.md` Ç-02) · **İlgili:** A-15, A-16

1. **"Sağlam" listesinde hasar etiketli binalar:** 1 Mart 2023 OSM verisinde 3 859 sağlam binanın 95'inde
   `earthquake:damage` (49 "yes", 18 "possible") ya da `damaged:building=yes` (27) etiketi var. 49'u eğitim, 43'ü dış sınama,
   3'ü dışlanan karolarda (dış sınamadaki 1 109 sağlam poligonun %3,9'u). **Yapılacak:** maskede 255 = yok say; dış
   sınamada yanlış alarm sayımından çıkar.
2. **Dış sınamanın 23/74 karosu doğrulama bloklarında** → model seçimi o bölgeyi görmüş olabilir. **Yapılacak:** sınama
   bloklarındaki 51 karo ayrıca raporlanmalı.
3. **Dışlanan dağlık kesim:** QQB batıdaki dağlık kesimi (SAR belirsizliği yüzünden) veri setine almamış; bizim karo zarfımız
   (dışbükey zarf − 30 m) orayı içeriyorsa listede olmayan binalar maskede 0 sayılıyor olabilir. **Yapılacak:** zarf ile QQB
   kapsamını karşılaştır.
4. **Lisans çelişkisi:** makale uydu verisine CC BY 4.0 diyor; Maxar Open Data kaydımız CC BY-NC 4.0. BY-NC varsayımıyla,
   atıf vererek kullanılıyor (ticari olmayan proje).

Ek bilgi: QQB'nin 5 katı rastgele (1. katta en yakın komşunun %81,4'ü başka katta); yayımlanmış bina düzeyi sonuçları
(optik F1 0,605) bizim piksel IoU'muzla kıyaslanamaz.

---

## A-19 🟡 Focal kaybın α = 0,25 ayarı hasar piksellerine arka plandan daha az ağırlık veriyor
**Durum:** AÇIK (deney önerisi) · **Bulundu:** 19 Eylül 2026 (DA-SegFormer incelemesi, `AKTARIM_BELGESI.md` Ç-11) · **İlgili:** A-15, Tablo 21

smp 0.5.0 `losses/_functional.py` satır 83–84: `loss *= alpha * target + (1 - alpha) * (1 - target)`. Bütün
eğitimlerimizde kullanılan `FocalLoss(mode="binary", alpha=0.25, gamma=2.0)` hasar piksellerini 0,25, arka planı 0,75 ile
çarpıyor (RetinaNet varsayılanı; γ = 2 kolay negatifleri ayrıca bastırıyor, Dice terimi de hasar sınıfına odaklı). Hata
değil ama "azınlığa odaklan" mantığının tersi ve hiç sınanmadı. **Yapılacak:** SegFormer-B4 / P2 ile α ∈ {0,25 · 0,5 · 0,75}
taraması (Tablo 21'deki kayıp ağırlığı taramasına kol olarak). Seçim doğrulama kümesinde; varsayılan değişmeden önce çoklu
tohumla doğrulanmalı.

---

## A-20 🟠 Tablo 15 (bölgeler arası genelleme) tasarımı il ile veri kümesini karıştırıyor ve gerçek aktarım testi içermiyor
**Durum:** AÇIK (tasarım önerisi) · **Bulundu:** 20 Eylül 2026 (Valentijn vd. 2020 incelemesi, `AKTARIM_BELGESI.md` Ç-16) · **İlgili:** A-15, A-16, Tablo 15

1. **Kaynak küme karışıklığı:** Hatay'ın karoları ağırlıkla KATE-PD (340 KATE-PD + 26 MEDBFS), Kahramanmaraş'ınkiler ağırlıkla
   MEDBFS (199 KATE-PD + 283 MEDBFS; 0,75 m, farklı etiket protokolü). Hatay ↔ Maraş farkı il değil veri kümesi farkı olabilir.
   **Yapılacak:** yalnız KATE-PD karolarıyla kontrol koşusu ya da sonuçların kaynak kümeye göre ayrı raporlanması.
2. **"Birleşik" satırı hedef ili de içerdiği için aktarım testi değil.** **Yapılacak:** "hedef il hariç diğer iller → hedef"
   (il-dışarıda-bırakma) satırı ve IoU(kaynak→hedef)/IoU(hedef→hedef) oran sütunu.
3. İsteğe bağlı: tek il eğitimlerini eşit eğitim miktarına alt-örnekleyen kontrol; az etiketle ince ayar eğrisi (1/2/5/10
   blok); eşik kayması (kaynak eşiği / kâhin eşik / AP) ayrı raporlanmalı.

---

# B. MAKALE — HENÜZ ÖLÇÜLMEMİŞ

## B-01 🔴 Görev tabanlı değerlendirme (Bölüm 4.7) — makalenin merkezî katkısı
**Durum:** AÇIK

Bölütleme kalitesinin operasyonel sonuca etkisi. Tablo 18 tamamen iskelet.
Makalenin özgünlük iddiası bu; ölçülmeden "katkı" olarak savunulması zor.
Gerekli: kapanma katmanının model çıkarımından türetilmesi (bkz. E-01).

## B-02 🟠 Gerçek yol hasarı bölütlemesi ölçülmedi
**Durum:** AÇIK

Tablo 12 bina hasarı görevinde koşuldu; yol hasarı için piksel etiketli Türkiye
kümesi yok. Tablo 5 (eğitim kümesi künyesi) tamamen `[ÖLÇÜLECEK]`.
Seçenekler: (a) kendi kümemizi etiketle, (b) CAU-RoadDamage'ı harici test kümesi
olarak kullan, (c) yol eksenini açıkça gelecek çalışmaya bırak.

## B-03 🟠 YOLO tespit başarımı (mAP) ölçülmedi
**Durum:** AÇIK

`model_benchmarks/03_yer_seviyesi/` altında 8 defter hazır (YOLOv8, YOLOv8 ölçek,
YOLOv11, YOLOv11-seg, Faster R-CNN, RT-DETR, YOLOv8+SimAM, Mask R-CNN) ama
**hiç sonuç yok**. Makalede yer seviyesi için tek ölçülen şey gecikme.

## B-04 🟠 Rota kıyaslaması ölçülmedi
**Durum:** AÇIK

`model_benchmarks/06_rota/` boş (sonuç yok). R1 (görüş mesafeli ajan) ve
R2 (bilgi paylaşan filo) ara referansları tanımlı ama koşulmamış. R0 tek başına
"straw man" olarak okunur ve %87,4 kazancı savunulamaz kılar.

## B-05 🟠 Kapanma katmanının yer gerçeğine göre değerlendirilmesi (Bölüm 4.3)
**Durum:** AÇIK

Tablo 13 iskelet. Vektör–piksel tampon kuralı ve τ eşiği tanımlı ama uygulanmamış.

## B-06 🟡 Bölgeler arası genelleme (Bölüm 4.4)
**Durum:** AÇIK

Tablo 14 iskelet. Hatay ↔ Kahramanmaraş çapraz koşum. Yeni veri gerekmiyor,
yalnızca bölmenin coğrafi yapılması yeterli.

## B-07 🟡 Bileşen çıkarma / parametre duyarlılığı (Bölüm 4.9)
**Durum:** AÇIK

Tablo 20 iskelet: harmanlama var/yok, morfoloji seviyesi 0/1/2, kayıp ağırlıkları,
`r_h` ∈ {10, 25, 50, 100} m, λ(d) basamakları, kalite eşiği, risk ağırlıkları.

## B-08 🟡 GFLOPs ve çıkarım süresi
**Durum:** AÇIK

Tablo 12'de iki sütun `[ÖLÇÜLECEK]`. Mobil/uç cihaz argümanı bunlarsız savunulamaz.

## B-09 🟡 Donanım künyesi ve `v_ort`
**Durum:** KAPALI (16 Eylül 2026) — Tablo 12'ye ve Bölüm 3.8'e işlendi (M-22); önceki durum: KISMEN KAPALI (15 Eylül 2026) — üç bilginin üçü de artık elde:
· **`v_ort` = 15,0 km/sa** (`benchmark/naive_baseline.py:48`; kodda "afet sonrası
molozlu sokakta ortalama saha ilerleme hızı varsayımı" olarak yorumlanmış — bir
**ölçüm değil varsayımdır**, makalede öyle sunulmalıdır)
· **Eğitim ortamı:** Google Colab, NVIDIA Tesla T4
· **Senaryo ortamı:** Intel Core i7 14. nesil, 16 GB RAM, 512 GB SSD, Intel Iris Xe
(tümleşik, GPU hızlandırma yok)
Kalan iş: bu değerlerin Tablo 11'e ve Bölüm 3.8'e işlenmesi (M-22).

Tablo 11'de senaryo koşum ortamı ve eğitim ortamı boş. Ortalama hız `v_ort`
süre hesabının temel parametresi ama sayısal değeri makalede hiç verilmemiş.

## B-10 🟡 Gecikme ölçümleri n = 2
**Durum:** AÇIK

YOLOv8 için iki gözlem (153,6 ms; 173,3 ms), BERTurk için iki gözlem
(48,8 ms; 11 419,4 ms). Isınma sonrası ≥100 tekrarla medyan/p95/p99 ölçülmeli.
BERTurk'ün 11,4 saniyesi bileşenlerine ayrıştırılmamış (ısınma / biçimbilim /
ileri geçiş / NER / coğrafi kodlama).

## B-11 🟡 18 eşleştirilmiş görev için istatistiksel test yok
**Durum:** AÇIK

Sadece toplamlar veriliyor. 352,5 dk'lık uç değer dağılımın ağır kuyruklu olduğunu
gösteriyor. Görev başına fark tablosu + medyan + çeyrekler arası açıklık +
Wilcoxon işaretli sıra testi + etki büyüklüğü eklenmeli.

## B-12 🟡 Şekil 9 üretilmemiş
**Durum:** AÇIK

Görsel bölütleme karşılaştırması. Makalede "Bu şekil üretilmemiştir" notu var.

---

## B-13 🟠 Türkçe metin veri kümesinin künyesi makalede hiç geçmiyor
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-33

`intent_test`, `deprem-private` ve `anonymized` sözcükleri makalede **sıfır kez**
geçiyor. Tablo 21'deki 305 kayıtlık sınama kümesinin kaynağı, etiketleme yönergesi,
etiketleyici sayısı ve erişim koşulu yazılmamış. Çok etiketli bir kümede bunlar
olmadan makro-F₁ tartışması yorumlanamaz. F-3 ile birlikte kapatılmalı.

---

# C. MAKALE — UYGULANMAMIŞ YETENEKLER

## C-01 🟠 Kapanma katmanı sentetik
**Durum:** AÇIK

Senaryo, kapanmaları bölütleme çıkarımından değil sentetik üreticiden alıyor.
Oranı EMSR648 ile tutarlı (%0,6–4,5 ↔ %1,52–1,71 katı kural) ama **uzamsal dağılım
modelden gelmiyor**. Makale bunu Öz'de açıkça söylüyor — bu doğru davranış.
Kapanması B-01'e bağlı.

## C-02 🟡 Karo kalite filtresi uygulanmamış
**Durum:** AÇIK

Bölüm 3.3'teki Laplacian varyans filtresi tanımlı ama kodda yok. Makalede
"bu sürümde uygulanmamıştır" diye işaretli. Elenen karo oranı `[ÖLÇÜLECEK]`.

## C-03 🟡 Çok kipli füzyon uygulanmamış
**Durum:** AÇIK

`S = w₁·P_seg + w₂·P_nlp` formülü kodda yok. Gelecek çalışma olarak sunuluyor.

## C-04 🟡 BLE mesh taşıma katmanı uygulanmamış
**Durum:** AÇIK

`commsStatus` bir veri alanı, protokol değil. 81–85 baytlık paket ölçümü
makaleden çıkarıldı (doğru karar). Ya gerçekten uygulanmalı ya tasarım önerisi
olarak kalmalı.

## C-05 🟡 Risk modülü sevk zincirine bağlı değil
**Durum:** AÇIK

Denklem (7) tanımlı, Tablo 22'de ölçülmüş, ama Bölüm 4.5'teki senaryoda
kullanılmıyor. Hakem "bu bölüm çıkarılsa makale ne kaybeder?" diye sorar.
Ya zincire bağla ya afet öncesi planlama olarak ayrı konumlandır (şu an ikincisi
yapılmış, kabul edilebilir).

---

# D. DEPO VE KOD

## D-01 🟠 Google Earth karoları yayında kullanılamaz
**Durum:** AÇIK

`QuakeMindBackend/apps/road_damage/utils/fetcher.py` içinde
`mt1.google.com/vt/lyrs=s` üzerinden Google uydu karosu çekiliyor. Toplu indirme
ve akademik yayında kullanım izne tabi. Makale koşumları **Maxar Open Data** ile
yapılmalı (hem ücretsiz hem 17 408² çözünürlükte).

## D-02 🟡 Karşılaştırma CSV'si SegFormer'ın değerini yanlış sütuna koymuş
**Durum:** AÇIK

`model_benchmarks/01_yol_hasari/local_colab_run/results/00_comparison_table.csv`
SegFormer'ın 0,4276'sını `mean_iou` sütununa yazmış. Oysa
`optimized_training_colab.ipynb` içindeki `compute_iou` ikili **ön plan** IoU'su
hesaplıyor. Buna bağlı olarak `00_comparison_chart.png` ön plan IoU'sunu ortalama
IoU'yla yan yana çiziyor ve SegFormer'ı haksız yere çok kötü gösteriyor.
Makalenin Şekil 7'si SegFormer'ı dışarıda bırakarak bundan kaçınmış, ama depo
dosyası ileride yanıltır.

## D-03 ⚪ Klasör adı yanıltıcı
**Durum:** AÇIK

`model_benchmarks/01_yol_hasari/` içindeki deney KATE-CD + MedBFS ile, yani
**bina** verisiyle koşulmuş. Klasör adı `01_bina_hasari_kate_medbfs` gibi
düzeltilmeli veya README'ye açık not düşülmeli.

## D-05 🟠 Defter şablonu ile fiilen koşulan hiperparametreler uyuşmuyor
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026

**Sorun.** `model_benchmarks/01_yol_hasari/seg_common.py` içindeki `CONFIG`
öğrenme oranını 6 × 10⁻⁵, yığın boyutunu 4, devir sayısını 30 olarak tanımlıyor.
Buna karşılık sonuçların üretildiği `local_colab_run/build_notebook.py`
lr = 2 × 10⁻⁴, yığın 8, en çok 50 devir, sabır 8 kullanıyor. Makale ikincisini
raporluyor (doğru olan bu), ancak `01_yol_hasari/*.ipynb` defterleri
`seg_common.py`'yi çağırdığı için bunlardan yeniden koşan biri **farklı sonuç
alır**.

**Yapılacak.** `seg_common.py` CONFIG'ini fiilen koşulan değerlere eşitle veya
defterlerin hangi yapılandırmayı kullandığını README'de açıkça belirt.
Tekrarlanabilirlik açısından gereklidir.

---

## D-04 ⚪ Akış diyagramlarındaki adlandırmalar koddaki gerçekle uyuşmuyor
**Durum:** AÇIK

"GNN Rota Motoru" → gerçekte Dijkstra/A*. "Multimodal Füzyon" formülü → kodda yok.
Makaleden çıkarıldı ama diyagramlar hâlâ eski; sunum/rapor materyalleri
güncellenmeli.

---

## D-06 🔴 Word belgesindeki 17 denklemin tamamı ham LaTeX
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-10

`MAKALE_TASLAK_TR (1).docx` → `word/document.xml` üzerinde sayım:
`<m:oMath>` = **0**, `w:val="subscript"` = **0**, `w:val="superscript"` = **0**;
buna karşılık ham `\tag{` = 17, `\frac` = 12, `\begin{cases}` = 1, `\left` = 4.
Okuyucu Denklem (9) yerine ham LaTeX kaynağını görüyor.

**Neden oldu.** `.docx`, bu oturumda yazılan `md2docx.py` dönüştürücüsü yerine
başka bir araçla yeniden üretilmiş; o araç LaTeX'i düz metne düşürmüş.

**Yapılacak.** Word üzerindeki içerik değişikliklerini `MAKALE_TASLAK_TR.md`'ye
işle, sonra `.docx`'i `md2docx.py` ile yeniden üret (gerçek alt/üst simge üretir).
Dergi denklem editörü şart koşarsa 17 denklem Word'de **Alt + =** ile denklem
nesnesine çevrilir.

---

## D-07 🟠 Model seçimi `mean_iou` ile yapılmış, raporlama `iou_fg` ile
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-11

`model_benchmarks/01_yol_hasari/local_colab_run/build_notebook.py` satır 278:
`if val_metrics['mean_iou'] > best_val_iou:` — en iyi ağırlık ve erken durdurma
**ortalama IoU** üzerinden seçiliyor. Oysa makale ortalama IoU'nun arka plan
baskınlığı nedeniyle yanıltıcı olduğunu savunup IoU_hasar'ı esas ölçüt yapıyor.
Ölçüt tartışmasının inandırıcılığını zedeliyor.

**Yapılacak.** Erken durdurmayı `iou_fg`'ye taşıyıp yeniden koştur (A-01 ile aynı
koşumda kapanır) ya da Bölüm 4.2'ye açık bir kayıt cümlesi ekle.

## D-08 🔴 Roboflow API anahtarı makale dalında açık metin olarak duruyor
**Durum:** AÇIK · **Bulundu:** 16 Eylül 2026 (M-62 incelemesi)

`model_benchmarks/03_yer_seviyesi/local_colab_run/build_notebook.py` ve aynı klasördeki
`00_catlak_bina_yolo.ipynb`, Roboflow hesabının API anahtarını kodun içinde açıkça taşıyor (değer bu
dosyaya bilerek yazılmadı). Depo şu an özel, ancak makale "kaynak kod erişime açılacaktır" diyor; depo
açıldığında anahtar herkese görünür olur ve git geçmişinde kalır.

**Yapılacak.** (1) Roboflow panelinden anahtarı **iptal edip yenisini üret** (asıl koruma budur; dosyadan
silmek geçmişteki kopyayı kaldırmaz). (2) Kodda anahtarı ortam değişkeninden ya da Colab "Secrets"ten oku.
(3) Depo açılmadan önce geçmişte başka gizli bilgi olup olmadığını tara.

## D-09 🟡 Risk yeniden koşumu `leaderboard.csv`'den iki naif taban satırını sildi
**Durum:** AÇIK · **Bulundu:** 17 Eylül 2026 (`UtBird/QuakeMind` makale dalı, commit `7024d64` incelemesi)

`model_benchmarks/05_risk_skoru/local_run/run_all_risk.py` yeniden koşulunca `results/leaderboard.csv` yalnız yedi
modelle baştan yazıldı; 13 Eylül'de (M-09) eklenen **"Naif — Yalnızca fay mesafesi (r0a)"** ve **"Naif — Yalnızca
sismisite yoğunluğu (r0b)"** satırları düştü. Makaledeki Tablo 23 bu iki satırı içeriyor, yani tablonun kaynak
dosyası artık tabloyla uyuşmuyor. Satırların JSON'ları (`naive_fault_distance.json`, `naive_seismicity.json`)
değişmedi; `naive_baselines.py` leaderboard'a yazmıyor.
Ayrıca yeniden koşumda **eğitim süreleri** değişti (CatBoost 14,61 → 14,97 sn, RO 6,32 → 5,21, XGBoost 10,31 → 11,00,
LR 0,32 → 0,14, topluluk 33,88 → 36,46, LightGBM 1,45 → 1,23, ÇKA 0,40 → 0,33). Tablo 23 eski süreleri taşıyor.
Başarım değerleri ise birebir aynı (katlama kayıtları dahil; fark < 10⁻¹²).

**Yapılacak.** (1) İki naif satırı `leaderboard.csv`'ye geri ekle ya da `run_all_risk.py`'nin naif JSON'ları da
okumasını sağla. (2) Tablo 23'teki eğitim sürelerini yeni koşuma göre güncelle ya da "süreler ilk koşumdan; makineye
bağlıdır" notu düş.

---

# E. SENARYO VE ÖLÇÜM

## E-01 🔴 Kapanma katmanı EMSR648'e bağlanmadı
**Durum:** KISMEN KAPALI (16 Eylül 2026) — EMSR kapsamındaki 4 ilçede bağlandı (J-12, J-28)

`benchmark/data/copernicus/` altında EMSR648 paketleri indirilmiş, açılmış ve
`*_copernicus_ground_truth.json` üretilmiş durumda. Kapanma üretimine bağlanmayı
bekliyor. Bu iş B-01, B-05 ve C-01'i aynı anda kapatır.

**Karar gerekiyor:** derece → geçilebilirlik kuralı. Kahramanmaraş'ta hiç
"Destroyed" yol yok, 134'ü de "Damaged". Önerilen: Destroyed = kapalı,
Damaged = ağırlık cezası, Possibly damaged = açık.

**16 Eylül 2026 güncellemesi.** Bağlandı: EMSR yol çizgisi → OSM kenarı eşlemesi
(`closures_from_lines`, 8 m tampon, ≥ %50 örtüşme), `POST /api/road_damage/closures_from_emsr`,
`full_scenario.py --closure-source emsr --emsr-rule {strict,medium,loose}`.
Kural **üç seçenekli ikili kapanma** olarak uygulandı (katı = Destroyed, orta = +Damaged,
gevşek = +Possibly damaged) ve üçü de koşuldu (J-28). Yukarıdaki öneri
("Damaged = ağırlık cezası") **uygulanmadı** — makalede duyarlılık olarak üç kural
birlikte raporlanmalı (M-26). **Açık kalan:** EMSR kapsamı dışındaki 4 ilçe
(H-Z2 İskenderun, H-Z4 Samandağ, H-Z5 Belen, K-Z3 Pazarcık) hâlâ yalnız sentetik
kapanmayla koşulabiliyor; EMSR AOI'lerinin dışında kalan ~%6 kenar açık kabul ediliyor.

## E-02 🟠 U-dönüşü cezası bir model parametresi
**Durum:** KISMEN KAPALI

`t_u = 20 dk` ölçülmüş değil, varsayım. Kazancın %94,8'ini bu üretiyor
(16 Eylül 2026 koşularında %96; EMSR648 gevşek kuralda 13 atamada 87 keşif — J-28).
Makalede iki paydayla raporlanıyor ve Tablo 17'de tarama var — **bu yeterli
çözüm**. Açık kalan: cezanın Algoritma 1'deki fiziksel karşılığı
(kavşakta yeniden yönlenme) 20 dk için gerekçelendirilmeli.

## E-03 🟠 Rota geçerliliği denetimi totolojik
**Durum:** KISMEN KAPALI

"18 rotanın hiçbiri kapalı segmentten geçmedi" — sert kapatma kenarları çizgeden
çıkardığı için bu matematiksel zorunluluk. Makale bunu açıkça söylüyor (doğru
davranış). Gerçek bir geçilebilirlik doğrulaması için saha verisi gerekir.

## E-04 🟡 NLP yanlış negatifi: 6 ihbarın 2'si elendi
**Durum:** KISMEN KAPALI

Her ikisi de hayati medikal çağrıydı. Neden teşhis edildi: eleme kuralı kategori
bakımından asimetrikti (kurtarma yalnızca yol/ulaşım terimleri için tanımlıydı).
Bölüm 3.6'da kural düzeltildi (kurtarma kümesi beş kategoriye genişletildi,
düşük güvenli kayıtlar "belirsiz" kuyruğuna alınıyor).
**Açık kalan:** düzeltilmiş kuralın kodda uygulanması ve yeniden ölçülmesi.

## E-05 🟡 Telafi iddiası kurgu gereği
**Durum:** KAPALI (12 Eylül 2026)

Elenen iki çağrının SOS üzerinden kurtarılması, senaryoda paralel SOS kaydı
bulunduğu için kurgu gereğiydi. Makalede "yedeklilik potansiyeline işaret eder,
gerçekleştiğini göstermez" olarak düzeltildi.

## E-06 🟡 Örneklem büyüklüğü
**Durum:** KAPALI (16 Eylül 2026) — 10 tohum koşuldu (J-29)

18 afetzede, 9 bölge, tek tohum. Çoklu tohum protokolü tanımlı ama koşulmamış.
Öneri: 10 tohum × kaynak, ortalama ± standart sapma.

**16 Eylül 2026:** Göksun çıkarıldı → 8 bölge, 18 afetzede. Eşleştirilmiş deney
(J-28) EMSR kapsamındaki 4 ilçede 13, drone sahnelerinde 9 afetzedeyle koşuldu;
hepsi yine **tek tohum (42)**. Madde açık.

**16 Eylül 2026 — kapanış.** J-28'in dokuz yapılandırması 10 tohumla (42–51) koşuldu:
`benchmark/multi_seed.py`, 90 koşu, hatasız; tohum 42 tek tohumlu koşuları afetzede
yerleşimi dahil birebir yeniden üretti. Sonuçlar ortalama ± ss ve %95 GA olarak
`runs/multi_seed/multi_seed_tablo.md` içinde; yorum **J-29**'da. Afetzede sayısı
(13 / 18 / 9) değişmedi — tohum yalnız yerleşimi ve sentetik kapanmayı değiştiriyor.

---

# F. GİT VE SÜREÇ

## F-01 KARAR BEKLİYOR — 15 commit upstream'e gönderilmedi
**Durum:** KARAR BEKLİYOR

Yerel `main`, `upstream/main`'in (UtBird/QuakeMind) 15 commit ilerisinde.
`origin/main` (Femrei/QuakeMindDev) ile birebir aynı.
Kullanıcı şu an gönderim istemiyor.

## F-02 KARAR BEKLİYOR — 123 commit edilmemiş dosya
**Durum:** KARAR BEKLİYOR

14 değiştirilmiş + 109 izlenmeyen dosya. İçinde makale taslakları, senaryo
koşuları, benchmark çıktıları var. Hangisinin depoya gireceği karar bekliyor.

## F-03 ⚪ `makale` dalı yerele alındı
**Durum:** KAPALI (12 Eylül 2026)

`git worktree` ile `Desktop\2209-A Afet\QuakeMind_makale\` klasörüne alındı.
Ana çalışma ağacına dokunulmadı. Kaldırmak için:
`git worktree remove "C:/Users/femre/Desktop/2209-A Afet/QuakeMind_makale"`

---

# G. KAYNAKÇA

## G-01 🟠 Altı kaynak yazarsız
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-35

[23], [24], [25], [29], [31] ve [57] doğrudan tırnak içinde başlıkla başlıyor,
yazar alanı yok. [56] ve [57] `[KÜNYE DOĞRULANACAK]` notu taşıyor, diğer dördünde
not bile yok. Hiçbir dergi yazarsız kaynak kabul etmez.

**Yapılacak.** Altı kaydın yazar listelerini DOI üzerinden tamamla; aynı geçişte
[56] KATE-CD künyesini doğrula.

---

## G-02 🟠 ConvBERTurk ve DistilBERTurk için yanlış kaynak gösterilmiş
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-36

Bölüm 4.10: *"DistilBERTurk [52], ConvBERTurk [51]"*. Ancak [51] = Jiang ve ark.,
*ConvBERT* (NeurIPS 2020) ve [52] = Sanh ve ark., *DistilBERT* (arXiv:1910.01108)
— ikisi de genel mimari/yöntem makalesi, Türkçe model değil. Kullanılan
ağırlıklar Schweter'in Türkçe modelleridir, yani [32] ile aynı kaynağa aittir.

**Yapılacak.** Ya [32]'ye atıfla ver ve mimariyi ikincil belirt, ya da model
kartlarına (`dbmdz/distilbert-base-turkish-cased`,
`dbmdz/convbert-base-turkish-cased`) ayrı kaynak ekle.

---

## G-03 🟡 [1] hem AFAD olay raporu hem deprem kataloğu için kullanılıyor
**Durum:** AÇIK · **Bulundu:** 12 Eylül 2026 · **Birleşik liste:** M-37

[1] = AFAD Ön Değerlendirme Raporu (2023), bir olay raporudur; Bölüm 3.7'de risk
modelinin eğitildiği **katalog** için de aynı numara kullanılıyor. İkisi farklı
veri ürünleridir.

**Yapılacak.** Katalog için ayrı kaynak ekle (AFAD Deprem Kataloğu / TDVMS,
erişim tarihi ve sorgu aralığıyla). Tablo 2 ile tutarlı olmalı.

---

# H. İNCELENİP KAPATILAN ŞÜPHELER

## H-01 ✔ Tablo 12'deki 0,4276 ile Tablo 22'deki ROC-AUC 0,4276 çakışması
**Durum:** KAPALI (12 Eylül 2026)

Kopyala-yapıştır hatası **değil**, gerçek rastlantı. Tablo 12 →
`optimized_training_colab.ipynb` "En iyi Val IoU: 0.4276"; Tablo 22 →
`05_risk_skoru/.../leaderboard.csv` ÇKA satırı `0.42759818884895767`. İki bağımsız
kaynak. Düzeltme gerekmiyor; isteğe bağlı olarak Tablo 22'de beş hane yazılabilir.

---

## H-02 ✔ Karolama adımının örtüşmesiz olduğu şüphesi
**Durum:** KAPALI (12 Eylül 2026)

`build_notebook.py`: `tile_size, tile_stride = 512, 256`. %50 örtüşme gerçektir,
makalenin sızdırma uyarısı geçerlidir.

> **16 Eylül 2026 eki (makale listesi M-89):** Kodda örtüşme var, girdide yok. KATE-CD ve MEDBFS görüntüleri zaten
> 512 × 512 (MEDBFS `Turkey.zip` dizini Zenodo'dan HTTP Range ile okundu; SegFormer defteri 842 görüntüden 842 karo
> üretmiş, **842'sinin tamamı hasarlı**). Bu koşumda örtüşen karo ve %95 elemeyle çıkarılan karo **yok**. Makale düzeltildi.

---


# I. ÖNERİLEN SIRA

| # | İş | Kapattığı maddeler | Tahmini süre |
|---|---|---|---|
| 0 | **Yazım işleri** — Bölüm 3'teki üç tanımsız mekanizmayı yaz, denklemleri yeniden üret, kaynakçayı düzelt | A-06, A-07, A-08, A-09, D-06, G-01, G-02 | 2–3 gün |
| 1 | SegFormer'ı üç katmanlı bölmeyle yeniden koştur (erken durdurmayı `iou_fg`'ye taşıyarak) | A-01, A-02, A-03, D-07 | 1 gün |
| 2 | EMSR648'i kapanma katmanına bağla | E-01, B-05, C-01 | 2–3 gün |
| 3 | Görev tabanlı değerlendirmeyi koştur | B-01 | 2–3 gün |
| 4 | YOLO defterlerini koştur | B-03 | 2–3 gün |
| 5 | R1 ve R2 ara referanslarını ekle | B-04 | 1–2 gün |
| 6 | Bölgeler arası genelleme | B-06 | 1–2 gün |
| 7 | Gecikmeleri yeniden ölç (n ≥ 100) | B-10 | yarım gün |
| 8 | Donanım künyesi ve `v_ort`'u doldur | B-09 | yarım gün |
| 9 | Depo düzeltmeleri (CSV sütunu, klasör adı) | D-02, D-03 | yarım gün |
| 10 | Görüntü kaynağını Maxar'a taşı | D-01 | 1 gün |

0 numaralı iş **koşum gerektirmez** ve hocaya gönderilecek taslağın önkoşuludur;
Bölüm 3'te tanımlanmamış bir mekanizmanın Bölüm 4'te kullanılması, eksik ölçümden
daha ağır bir kusurdur. Ardından ilk üç iş bittiğinde makalenin en kırılgan
noktaları kapanır.

**Not.** Makale özelindeki tüm maddeler tek bir dosyada birleştirilmiştir:
`MAKALE_DUZELTME_LISTESI.md` (kimlikler `M-01` … `M-48`, öncelik sırası ve iki
listenin kimlik eşlemesi orada).

---

# J. PERFORMANS VE SİSTEM (gecikme / kaynak yönetimi)

> Bu bölümdeki her madde **ölçülmüştür**. Ölçüm makinesi: kullanıcının kendi PC'si
> (Intel Core i7 14. nesil, 16 GB RAM, GPU hızlandırma yok — bkz. B-09). Graf
> ölçümleri `osm_graph_cache/b93e549b00f9debf.pkl` (18 004 düğüm / 39 285 kenar,
> Kahramanmaraş Merkez ölçeği) üzerinde yapıldı. Tarih: 15 Eylül 2026.

## J-13 🟠 Geocoding hala aga bagli — yerel cozum yok
**Durum:** AÇIK · **Bulundu:** 15 Eylül 2026 · **J-03'ten ayrildi**

J-03'te kalici onbellek eklendi ve TEKRAR eden sorgular 0,3 sn'ye dustu, ancak
**ilk** (onbellekte olmayan) sorgu hala canli Nominatim'e gidiyor — olculdu:
7–10 sn, en kotu durumda ~28 sn. Bu, offline-first hedefiyle dogrudan celisiyor:
internet yoksa NLP metinden konum cikaramiyor.

**Yapilacak.** `tr_locations.py` su an yalnizca il/ilce **adlarini** tutuyor,
koordinat yok. Il/ilce/mahalle merkez koordinatlarini iceren yerel bir
sozlugu birinci siraya koy, Nominatim yalnizca son care olsun. Ayrica
`_build_queries` tek metinden 23 sorgu adayi uretiyor; bu ~4'e indirilebilir.

**DIKKAT — bu bir davranis degisikligidir.** Cozulen konumlar degisebilir,
dolayisiyla makalede raporlanan NLP konum-cikarim sonuclarini etkiler; senaryo
yeniden kosulmadan yapilmamali (bkz. E-04).

---

## J-18 🟡 `/status/{id}` tek seferde 17 MB dönüyor — 15,5 MB'ı base64 görsel
**Durum:** AÇIK · **Bulundu:** 15 Eylül 2026

**Ölçüm.** Tamamlanmış bir `/analyze` işinin durum yanıtı **17 159 639 bayt**;
bunun 15,5 MB'ı altı adet base64 gömülü PNG (`imageOriginalB64`,
`imageDamageOverlayB64`, `imageDamageMaskB64`, `imageRoadMaskB64`,
`imageIntersectionB64`, `imageSegmentationOverlayB64`).

**J-01 ile aynı sınıf DEĞİL — daha hafif.** `pollRoadDamageStatus` (api.ts:299)
`done` görünce döngüden çıkıyor, yani ağır yük **bir kez** çekiliyor; kuyrukta
bekleyen turlar hafif. Yine de base64 ham baytı %33 şişiriyor (~4 MB fazladan)
ve 17 MB'lık tek bir JSON ayrıştırması tarayıcıyı bir an dondurur.

**Yapılacak.** Görselleri JSON gövdesine gömmek yerine
`/api/road_damage/image/{analysisId}/{kind}` gibi ikili uçlardan sun; `/status`
yalnızca adlarını döndürsün. Tarayıcı bunları paralel ve önbellekli çeker.

---

## J-22 🔴 r_h kalibre edilmemiş — 25 m'de model gerçeğin ~8 katı yol kapatıyor
**Durum:** AÇIK · **Bulundu:** 16 Eylül 2026 · **İlgili:** J-19, M-26, M-27

**Ölçüm.** J-19'un yarıçap kuralı, **gerçek model çıktısı** üzerinde (Antakya
merkezi, Maxar Open Data 2023-02-11, z=18 / 0,48 m/px, 389 yol kenarı) farklı
r_h değerleriyle koşturuldu ve **aynı alanın** EMSR648 AOI11 MONIT01 yer
gerçeğiyle karşılaştırıldı:

| Kural | Kapalı kenar | Oran |
|---|---|---|
| Eski kural (hasar yol pikselinde) | 0 | %0,0 |
| r_h = 5 m | 30 | %7,7 |
| r_h = 10 m | 46 | %11,8 |
| r_h = 15 m | 76 | %19,5 |
| **r_h = 25 m (makaledeki değer)** | **100** | **%25,7** |
| r_h = 50 m | 188 | %48,3 |
| **EMSR648 — aynı alan, yollar** | 5 / 156 | **%3,2** |
| EMSR648 — aynı alan, binalar | 21 / 150 | %14,0 |

Karşılaştırma aynı 0,3 km'lik alan üzerinden yapıldı; EMSR648'in AOI geneli
ortalaması (%1,58) bu alan için adil değil çünkü burası Antakya'nın en çok
yıkılan merkezi.

**Sonuç.** Makalede belgelenen r_h = 25 m bu örneklemde gerçeğin **~8 katı**
kapanma üretiyor. En yakın değer (5 m) bile ~2,4 kat fazla. Eğilim r_h ≈ 2-3 m
civarını işaret ediyor, ama bu **tek bir 389 kenarlık örneklem** — kalibrasyon
için yetersiz.

**Dürüst kayıt — iki olası sebep ayrıştırılmadı.** (a) r_h fazla büyük;
(b) model %1,26 piksel hasar buluyor ama bunların ne kadarı gerçek hasar
bilinmiyor (A-01: SegFormer'ın IoU_hasar'ı 0,37-0,43 arası, yani yanlış pozitif
oranı yüksek olabilir). İkisi birlikte de olabilir.

**Yapılacak.** r_h'yi EMSR648'in kapsadığı 4 bölgede (H-Z1, H-Z3, K-Z1, K-Z2)
çok sayıda örnek alan üzerinden, yer gerçeğiyle hatayı en aza indiren değere
kalibre et. Bu aynı zamanda M-26 (Tablo 19) ve M-27 (Tablo 20) için gereken
duyarlılık verisini üretir.

---

## J-23 🔴 `/naive_compare`, `/analyze` oturumlarıyla çalışmıyor — senaryo modele bağlanamaz
**Durum:** KAPALI (16 Eylül 2026) · **Bulundu:** 16 Eylül 2026

**Sorun.** `/analyze` işi bitince oturuma yalnız `{"safe_G", "bounds"}`
yazılıyor (`fastapi_app.py`, `_on_road_damage_job_done`). `/naive_compare` ise
`"G"` ve `"closedEdgeKeys"` istiyor; bunlar yalnız `/simulate_closures`
oturumlarında var. `benchmark/full_scenario.py` de hâlâ `/simulate_closures`
çağırıyor.

**Sonuç.** Senaryoyu model tabanlı kapanmalara (`/analyze`) geçirmek, R0 naif
karşılaştırmasını — yani makalenin manşet sayılarını (206,6 dk / 1 641,0 dk) —
**kırar**.

**Yapılacak.** İşçi, `safe_G` kopyası yerine tam `G` + kaldırılan kenar
kümesini döndürsün; ana süreç `safe_G`'yi `nx.restricted_view` ile kursun
(`/simulate_closures` zaten böyle yapıyor). Bu hem uyumluluğu sağlar hem de
süreçler arası taşınan pickle'ı küçültür (bugün `G.copy()` gönderiliyor).
Ardından `full_scenario.py` bölge başına `/analyze` + Maxar sahnesi kullanacak
şekilde değiştirilmeli.


**Kapandı.** Yeni uç: `POST /api/road_damage/closures_from_mask` — hazır bir
hasar maskesinden (Colab'da üretilir) canlı `/analyze` ile **aynı kural ve aynı
örneklemeyle** kapanma çıkarır; oturuma `G` + `safe_G` (görünüm) +
`closedEdgeKeys` yazar, yanıt biçimi `/simulate_closures` ile birebir aynıdır.
`/naive_compare`, `/route`, `/recent`, `/segments` model oturumlarında çalışıyor
(canlı doğrulandı). `full_scenario.py` artık `--closure-source {synthetic,model}`,
`--mask-suffix`, `--blockage-radius-m`, `--dataset {v2,drone}` alıyor; her çıktıya
`closureSource` yazılıyor. Güvenlik: `maskId` yalnız
`benchmark/data/model_masks/` altında çözülür (yol gezinme denemeleri 422).

`analyze_road_network_graph`'in iç döngüsü `_classify_edges`'e taşındı; refaktör
öncesi/sonrası gerçek model maskesinde **her alt segmentin geometrisi dahil
birebir aynı** (r_h=0 ve 25).

**Regresyon:** tüm bu değişikliklerden sonra sentetik Hatay (tohum 42) referans
koşuyla (`runs/canli-gosterim-hatay`) **birebir aynı**: 5 bölgenin kapanma
sayıları, 9 atamanın rota/naif mesafeleri, keşif sayıları ve 98,5 / 650,0 dk.

---

## J-24 ⚪ (bilgi) Model tabanlı kapanma için gereken EMSR648 değil, Maxar kapsaması
**Durum:** KAPALI — bilgi kaydı · **Bulundu:** 16 Eylül 2026

J-12'de "9 bölgenin 5'inde veri yok" diye kaydedilen kısıt **yalnız doğrulama**
içindir. Kapanmaları modelin üretmesi için gereken şey deprem sonrası görüntü;
EMSR648 ise karnedir. `/oam_search` ile dokuz bölge merkezinde (1 km yarıçap)
ölçülen deprem sonrası (2023-02-06 … 2023-06-30) görüntü kapsaması:

| Bölge | Maxar | Diğer | En erken | EMSR648 doğrulama |
|---|---|---|---|---|
| H-Z1 Antakya | 2 | 2 | 2023-02-08 | var |
| H-Z2 İskenderun | 3 | 0 | 2023-02-12 | yok |
| H-Z3 Kırıkhan | 1 | 0 | 2023-02-28 | var |
| H-Z4 Samandağ | 3 | 0 | 2023-02-08 | yok |
| H-Z5 Belen | 3 | 0 | 2023-02-12 | yok |
| K-Z1 Maraş Merkez | 4 | 1 | 2023-02-08 | var |
| K-Z2 Elbistan | **0** | 1 | 2023-02-15 | var |
| K-Z3 Pazarcık | 4 | 0 | 2023-02-08 | yok (yol katmanı analiz edilmemiş) |
| K-Z4 Göksun | **0** | **0** | — | yok |

**Yani:** model tabanlı kapanma **8 bölgede** mümkün (Elbistan'ın Maxar-dışı
kaynağı kalite bakımından kontrol edilmeli), doğrulama **4 bölgede** mümkün.
Yalnız **Göksun**'da hiçbir deprem sonrası görüntü yok.

**Dikkat:** arama bölge merkezinin 1 km çevresinde yapıldı; sahnelerin 3 km'lik
bölgenin tamamını kaplayıp kaplamadığı ayrıca kontrol edilmeli.

---

## J-29 🔴 Çoklu tohum (10 tohum): tek tohumlu sonuç kazancı yukarı çekiyordu
**Durum:** AÇIK — sonuçlar makaleye işlenmeli · **Bulundu:** 16 Eylül 2026 · **İlgili:** E-06 (kapandı), E-02, J-28, J-30, M-20, M-25, M-26

**Tasarım.** `benchmark/multi_seed.py` — J-28'in dokuz yapılandırması × tohum 42–51 =
90 koşu (180 il yarısı), toplam ~49 dk, hatasız. Tohum afetzede yerleşimini (tüm
kaynaklarda) ve sentetik kapanma kümesini (yalnız sentetikte) değiştirir; EMSR648 ve
model kapanmaları sabittir. **Tohum 42, J-28 koşularını afetzede konumları dahil birebir
yeniden üretti** (koşular deterministik). Süreler **aynı küme** üzerinden, tohum başına
toplamların ortalama ± standart sapmasıdır. Çıktılar: `runs/multi_seed/`
(`multi_seed_tablo.md`, `multi_seed_summary.json`, koşu başına klasör ve günlük).

| Yapılandırma (afetzede) | Rotalanan | QuakeMind (dk) | Klasik (dk) | Kazanç (dk) | Kazanç %95 GA | Yol farkı (dk) | Klasik ek yol | U-dönüşü payı | Tohum 42 kazancı | 10 tohum aralığı |
|---|---|---|---|---|---|---|---|---|---|---|
| v2 sentetik, 8 ilçe (18) | 17,8 ± 0,4 | 203,5 ± 18,9 | 1 552,0 ± 252,0 | **1 348,5 ± 241,7** | [1 175,6; 1 521,4] | 54,5 ± 15,2 | %26,7 ± 6,9 | %96 | 1 522,6 | 978,1–1 678,0 |
| v2 sentetik, 4 ilçe (13) | 13,0 | 153,4 ± 17,8 | 1 262,7 ± 219,9 | 1 109,3 ± 209,3 | [959,6; 1 259,0] | 35,3 ± 12,7 | %22,8 ± 6,7 | %97 | 1 420,0 (en yüksek) | 829,6–1 420,0 |
| EMSR648 katı (13) | 13,0 | 144,3 ± 23,0 | 197,1 ± 59,9 | 52,8 ± 47,1 | [19,1; 86,5] | 0,8 ± 1,1 | %0,5 ± 0,8 | %99 | 60,4 | 0,0–121,9 |
| EMSR648 orta (13) | 13,0 | 154,0 ± 23,2 | 1 406,2 ± 589,7 | 1 252,2 ± 579,5 | [837,7; 1 666,8] | 50,2 ± 30,6 | %32,2 ± 18,5 | %96 | 1 735,6 | 304,5–2 248,0 |
| **EMSR648 gevşek (13)** | 13,0 | **154,1 ± 23,3** | **1 433,0 ± 607,8** | **1 278,9 ± 597,1** | [851,7; 1 706,1] | **50,9 ± 31,1** | %32,5 ± 18,7 | %96 | 1 817,2 | 304,5–2 309,8 |
| Drone sentetik (9) | 8,7 ± 0,9 | 16,5 ± 2,9 | 81,3 ± 59,9 | 64,8 ± 58,4 | [23,1; 106,6] | 0,8 ± 0,8 | %5,3 ± 4,7 | %98 | 141,4 | 0,0–181,8 |
| Drone EMSR648 gevşek (9) | 9,0 | 18,4 ± 1,4 | 58,7 ± 17,3 | 40,3 ± 16,4 | [28,5; 52,0] | 0,3 ± 0,1 | %1,5 ± 0,7 | %99 | 40,2 | 0,0–60,4 |
| Drone model z18, r_h = 0 (9) | 9,0 | 16,7 ± 1,6 | 20,7 ± 8,1 | 4,0 ± 8,4 | [−2,0; 10,0] | 0,0 | %0,0 | %100 | 0,0 | 0,0–20,0 |
| Drone model z19, r_h = 15 (9) | **2,1 ± 0,6** | 1,9 ± 0,9 | 3,9 ± 6,3 | 2,0 ± 6,3 | [−2,5; 6,5] | 0,0 | %0,0 | %100 | 0,0 | 0,0–20,0 |

"Klasik ek yol" = klasik ekibin U-dönüşü cezası hariç yürüdüğü fazladan yol / QuakeMind yolu.

**Bulgular.**
1. **Tohum 42 iyimser uçtaydı.** 4 ilçe sentetikte on tohumun en yükseği; EMSR gevşekte
   1 817,2 dk'ya karşı ortalama 1 278,9 dk (%42 fazla); 8 ilçe sentetikte 1 522,6'ya karşı
   1 348,5 dk. Makale tek koşu yerine ortalama ± ss (ve GA) vermeli; J-28'in tek tohum
   tablosu en fazla "örnek koşu" olarak kalabilir.
2. **Kazancın %95 GA'sı sıfırı içermiyor** — sentetik (v2 ve drone) ve EMSR648 (üç kural,
   v2 ve drone) için. **İki model koşusunda GA sıfırı içeriyor**: model kapanmalarıyla kazanç
   gösterilemiyor (J-25, J-26; ayrıca J-30).
3. **U-dönüşü payı her yapılandırmada %96–100.** Yalnız gerçek yol farkı: 8 ilçe sentetik
   54,5 ± 15,2 dk (klasik ekip %27 daha uzun yol), EMSR gevşek 50,9 ± 31,1 dk (%33). t_u
   duyarlılığı aynı koşulardan: 8 ilçe için t_u = 0 / 5 / 10 / 20 / 30 dk → 54,5 / 378,0 /
   701,5 / 1 348,5 / 1 995,5 dk (tablo `multi_seed_tablo.md`'de).
4. **Kazanç birkaç görevde ve tek bölgede toplanıyor.** EMSR orta/gevşekte görevlerin
   %57–60'ı hiç kapanmaya çarpmıyor (medyan görev kazancı 0 dk, üst çeyrek 142,3 dk);
   keşiflerin **%89'u K-Z1'de** (Maraş merkez, 614'ün 545'i); en çok keşifli %10 görev
   keşiflerin %59'unu üretiyor; **tek görevde 38 keşif** (KMS-01, tohum 46: 760 dk = 12,7
   saat ceza). Sentetikte de K-Z1 baskın (647'nin 400'ü; görev başına en çok 16). R0 ajanı
   her kapalı kenarı tek tek öğreniyor; yoğun hasar kümesinde bu gerçekçi değil →
   **R1/R2 (M-25) olmadan toplam kazanç abartılı** okunmalı.
5. **Gerçek hasarda değişkenlik ~3 kat.** EMSR gevşekte kazancın ss'si 597 dk, sentetikte
   209 dk: gerçek hasar kümeli; afetzede kümenin içine düşerse kazanç büyük, dışına düşerse
   sıfıra yakın. Aynı tohumda EMSR gevşek − sentetik (4 ilçe, %88 aynı yerleşim):
   **+169,6 ± 586,8 dk** — gerçek hasarla kazanç sentetikten sistematik olarak farklı değil;
   katı kuralda −1 056,5 ± 195,3 dk.
6. **Görev düzeyi anlamlılık testi yapı gereği anlamlı.** Klasik ajan yalnız açık kenarda
   yürüdüğü için (`simulate_naive_agent`) yolu kapanmaları bilen en kısa yoldan kısa olamaz:
   986 görevin **hiçbirinde** yol farkı negatif değil. Wilcoxon p < 0,001 ve r = 1 bu yüzden
   bilgi taşımaz — makalede kazancın kanıtı olarak **sunulmamalı** (E-03'ün istatistik
   karşılığı). Anlamlı ölçüler büyüklük (ortalama ± ss, GA) ve sıklıktır: kapanmaya çarpan
   görev oranı sentetik %79–82, EMSR gevşek %43, orta %40, katı %6.
7. **Rastgele kapanma bazen afetzedeyi ağdan koparıyor:** 8 ilçede 17,8 / 18, drone
   sentetikte 8,7 / 9 rota (yerleşim 12 denemede ulaşılabilir nokta bulamayınca son adayla
   sürüyor, `_sample_reachable_point`). Model z19 / r_h = 15: 10 tohumda da 2,1 / 9 → J-25
   çok tohumla doğrulandı.

**Yapılacak (makale).** Tablo 16–19'daki tek koşu değerleri 10 tohum ortalaması ± ss ile
değiştirilmeli; sınırlılık (b) ve (g) maddeleri güncellenmeli ("tek koşumdan güven aralığı
türetilememektedir" artık geçersiz); görev düzeyi p değeri kullanılmamalı; kazancın K-Z1'de
toplandığı ve R0'ın öğrenmeyen ajan olduğu açıkça yazılmalı.

---

## J-46 🟠 Konsol canlı modda dakikada bir bütün pencere sorgularını yeniden istiyor
**Durum:** AÇIK · **Bulundu:** 21 Eylül 2026 (J-43'ün ağ kaydında) · **İlgili:** kural 4, ARAYUZ §10, J-11

**Sorun.** Canlı modda zaman penceresi saatle birlikte kayıyor (varsayılan: son 6 saat) ve
pencere, sorgu anahtarının parçası. Dakika değişince anahtarlar değişiyor ve pencereye bağlı
her sorgu yeniden gidiyor. Hiçbir şey değişmese bile bu böyle.

**Ölçüldü.** Genel mod, boşta, tek sekme: **dakikada 7 istek.** Bunlar `hasar-noktalari`,
`sos`, `ozet` ve dört `heatmap` (uydu, sos, kamera, metin). Eski webin ~65 isteğinden az,
ama kural 4 "yalnızca değişiklik olduğunda" diyor.

**Öneri.**
- Sorguyu kaba bir çapaya bağla: pencere başlangıcı 15 dakikaya yuvarlanır ya da canlıya
  geçerken sabitlenir.
- Tam pencereyi istemci süzsün. Yeni veri zaten canlı akışla geliyor.
- Isı ızgarası sunucuda üretiliyor; onu da aynı çapaya bağla.

---

## J-45 🔴 Eski demo hesaplarının jetonu kodda sabit; herkes acil bildirim yayınlayabiliyor
**Durum:** KARAR BEKLİYOR · **Bulundu:** 21 Eylül 2026 (J-43 sınanırken) · **İlgili:** J-43, CLAUDE.md kural 5

**Sorun.**
- `cekirdek.py::_demo_user` sekiz demo hesap tanımlıyor. Jetonları kodda sabit:
  `token-<kimlik>`, ör. `token-responder-101`. Şifreleri `password123`. Eski webin giriş
  sayfası bu şifreyi ekranda gösteriyor. Depo açık (upstream).
- `POST /api/notifications/send_emergency` bu jetonu kabul ediyor. Jetonu bilen herkes bütün
  afetzedelerin ekranına acil bildirim düşürebilir, ör. "Baraj yıkıldı, tahliye edin".
  Afetzede ekranı bildirimi en üstte gösterdiği için etkisi arttı.
- Aynı jetonlar `_require_role` kullanan öteki eski uçları da açıyor: ekip sohbeti, görev
  kilidi vb.
- Yeni kimlikle bildirim gönderen bir uç yok. Konsoldan henüz bildirim yayınlanamıyor.
- J-43 sınanırken test bildirimi bu yoldan gönderildi. Açığın gerçek olduğu böyle
  doğrulandı.

**Öneri.** Karar gerekiyor, çünkü eski webin demo girişini etkiliyor.
1. `POST /api/bildirimler` ucu: yeni kimlik,
   `Depends(rol_gerektir('koordinator', 'yonetici'))`. Konsola bir gönderme paneli.
2. Eski demo hesapları bir ortam bayrağının arkasına alınsın, ör. `QUAKEMIND_ESKI_DEMO=1`.
   Geliştirmede açık, dağıtımda kapalı olur. Varsayılanı değiştirmek eski webin demo girişini
   kapatır.

---

## J-44 🟠 Afetzedeye hasar bilgili yol tarifi verilemiyor
**Durum:** AÇIK · **Bulundu:** 21 Eylül 2026 · **İlgili:** J-43, J-34, J-17, ARAYUZ §8 ("rota ve toplanma alanı")

**Sorun.**
- Kapanma bilgisi yalnız analiz oturumunda duruyor: bellekte ve 30 dakika
  (`ROAD_DAMAGE_SESSION_TTL_SEC`). Rota ucu `/api/road_damage/route` bu oturumu istiyor.
  Afetzedenin isteği geldiğinde çoğu zaman oturum yok.
- Oturumsuz `safe_route` her istekte yol ağını Overpass'tan indiriyor. Bu kural 3'ü çiğniyor,
  dakikalar sürüyor ve bölgeyi üçüncü tarafa gönderiyor.
- Kapanmalar `yol_kapanmalari` tablosuna yalnız segmentin orta noktası olarak yazılıyor.
  Yönlendirilebilir yol ağı hiçbir yerde saklanmıyor.
- Bu yüzden yeni ekran toplanma alanını kuş uçuşu uzaklık ve yönle veriyor, yol tarifi yok.
  Ekranda da bu açıkça yazıyor.

**Öneri.**
1. Bölge yol ağını yerel OSM kopyasından bir kez üret (altlık gibi) ve dosyaya yaz. API ya da
   rota işçisi onu belleğe bir kez yüklesin.
2. `yol_kapanmalari` noktalarını en yakın kenara oturt. Kaynağı ve zamanı kenarda dursun.
3. `GET /api/afetzede/rota?hedef=…` ucu: yumuşak maliyetli A* (J-34 bayrağı), birkaç on ms.
   Yanıtta sokak adlarıyla adım listesi, uzunluk, geçilen riskli kenar ve kullanılan kapanma
   verisinin tarihi olsun.
4. Ekranda harita motoru olmadan adım listesi. İstenirse küçük bir SVG çizimi.

---

## J-43 🟠 Afetzede ekranı: eski webdeki portal yeni konsolda yeniden yazıldı
**Durum:** KAPALI (21 Eylül 2026, ilk sürüm; açık kalanlar J-44, J-45) · **Bulundu:** 21 Eylül 2026 (kullanıcı isteği) · **İlgili:** J-42, ARAYUZ §8, MIMARI §7

**Eski webde bulunanlar** (`quakemind-web/src/app/survivor`). Bunlar ya taşınmadı ya
düzeltilerek taşındı:
- Gönderim başarısız olunca da "SOS sinyaliniz alındı" yazıyordu
  (`catch { setSosSent(true) }`). Yardım talebi de hatada "kayıtlara eklendi" diyordu.
- Konum alınamazsa çağrı sessizce Antakya merkezine düşüyordu (`ANTAKYA_COORDS`).
- Kişi sayısı ve aciliyet mesajın içine metin olarak gömülüyordu ("[KİŞİ SAYISI: 3]").
  Ekipler bunlara göre süzemiyordu.
- Bütün toplanma alanları "🟢 Güvenli" etiketliydi. Oysa liste depremden önceki resmi
  listedir, alanın bugünkü durumu bilinmiyor.
- Rota dış OSRM demo sunucusundan isteniyordu. Kullanıcının tam konumu üçüncü tarafa
  gidiyordu, rota da yıkık ya da kapalı yolu bilmiyordu. `allowOnlineFallback=false`
  adının söylediğini yapmıyordu.
- Bildirim bandı 10 saniyede bir yokluyordu (kural 4).
- Gönderen yazmasa da bildirimlere 6,8 büyüklük ve "Hatay" varsayılan olarak ekleniyordu.
- Kamera sayfası analiz başarısız olunca sahte sonuç gösteriyordu. Yapıya "güvenli" hükmü de
  veriyordu.

**Yeni ekran** (`konsol/src/afetzede/`): telefonda tek sütun, harita motoru yok.
- **Bildirim bandı.** `GET /api/bildirimler/aktif` ile gelir, canlı akıştaki `bildirim`
  mesajıyla tazelenir.
- **Yardım çağrısı.**
  - Durum seçilir: Mahsur kaldım / Yaralı var / Yardım gerekli. Ayrıca kişi sayısı,
    ihtiyaçlar (su, gıda, barınma, ısınma, ilaç, tuvalet) ve en çok 500 karakterlik not.
  - Konum cihazdan alınır. Kısa bir izlemeyle en iyi doğruluk tutulur ve "±m" yazılır.
  - Cihaz konum veremezse mahalle seçilir: altlığın yer adları, 5 bölgede 496 ad. Böyle
    gelen konum "yaklaşık" diye işaretlenir. Hiç konum yoksa çağrı gönderilemez ve ekran bunu
    söyler.
  - Başarı mesajı ancak sunucu 201 dönünce çıkar. Hatada sebep yazılır, bilgiler silinmez.
  - Açık çağrısı olan afetzedeye ikinci çağrıdan önce hatırlatılır.
- **Çağrılarım.** Son 7 gün; her çağrıda durum rozeti ve açıklaması. Canlı akışla tazelenir.
  Bağlantı koparsa ekran bunu yazar ve elle yenileme düğmesi çıkar.
- **En yakın toplanma alanları.** AFAD veri setinden; kuş uçuşu uzaklık ve sekiz yönlü yön.
  "Haritada aç" bağlantısı yalnız alanın konumunu götürür. Kaynak ve sınırlar Teknik notunda
  yazılı.
- **Sözleşme.** `POST /api/sos` artık `kisiSayisi`, `ihtiyaclar`, `konumKaynagi`
  (`gps` | `mahalle`) ve `konumDogrulukM` alıyor (`ek` JSON sütunu). `GET /api/sos` bunları
  geri veriyor.
- **Ekip ekranları.** SOS kuyruğu, seçili çağrı ve harita ipucu kişi ve ihtiyaç satırını
  gösteriyor. Mahalle merkezinden gelen çağrıda "Dikkat: yaklaşık konum" uyarısı çıkıyor.
- **`apiPost`.** 401 alınca jetonu bir kez yeniliyor. Erişim jetonu 15 dakikalık; sayfayı açık
  bırakan afetzedenin çağrısı bu yüzden düşmesin.
- **Bildirim.** `send_emergency` canlı akışa `bildirim` yayınlıyor. Büyüklük ve konum
  varsayılanları kaldırıldı.
- **Toplanma ucu.** `allowOnlineFallback=false` iken OSRM'e gitmiyor. Varsayılan (`true`)
  değişmedi; eski web aynı çalışıyor.
- Koordinatör ve yönetici ekranı "önizleme" notuyla açabiliyor.

**Ölçüldü.**
- **Rota başına indirilen JS** (üretim derlemesi, gzip):

  | Rota | Önce | Sonra |
  |---|---|---|
  | afetzede | 637,6 KB | 107,8 KB |
  | giriş ekranı | 626,6 KB | 96,9 KB |
  | konsol | 658,4 KB | 664,6 KB (harita burada, tembel yüklenir) |

  Sebep `vite.config.ts`'teki `manualChunks` nesne biçimiydi: Vite'ın ön-yükleyicisini ve
  CommonJS yardımcısını harita parçasına çekiyordu. Giriş dosyası da bu yüzden 2 MB'lık
  parçayı statik olarak içe aktarıyordu. Parça ayarı işlev biçimine çevrildi, yardımcılar ayrı
  bir parçaya alındı. Önizleme sunucusunda doğrulandı: /afetzede yalnız 5 dosya indiriyor,
  konsol haritayla açılıyor.
- **İstek sayısı.** Afetzede ekranı açılışta 5 istek atıyor: oturum yenileme, akış,
  bildirimler, çağrılarım, toplanma. Sonrasında yalnız canlı akış mesajı gelince tazeleniyor.
- **Toplanma ucu.** 5 istekte 172–198 ms, yanıt 20 KB. Sürenin ~122 ms'si 15,7 MB'lık AFAD
  JSON'unu her istekte yeniden ayrıştırmaktan geliyor. Veri bellekte tutulursa süre düşer; bu
  yapılmadı.

**Denetlendi** (tarayıcı, 375 × 812).
- **GPS yolu.** Tarayıcı konumu test için Ankara'ya sabitlendi. Ekran ±15 m doğruluk ve en
  yakın 5 AFAD alanını gösterdi (Cumhuriyet 20 m, Kızılay 60 m…).
- **Gönderim.** Ekran "Çağrın alındı · 19:03 · Bekliyor" dedi. Koordinatör çağrıyı kapatınca
  başarı kutusu ve liste yoklama olmadan "Kapandı" oldu.
- **Mahalle yolu.** "akev" yazınca Akevler (Antakya) çıktı. Toplanma listesi mahalle merkezine
  göre hesaplandı ve "yaklaşık" yazdı.
- **Duman testi.** 63 ucun 61'i aynı. İki fark bilerek yapıldı: `/api/sos` dört alan kazandı
  ve yeni uçlar eklendi. Referans imza güncellendi.

**Taşınmayan: kamera / fotoğraf.** Güvenli yeniden tasarım önerisi:
- Fotoğraf saklanır ve ihbar olarak kuyruğa girer.
- Yapıya "güvenli" hükmü verilmez.
- Model sonucu ekip ekranında "modelin tahmini" diye görünür.

**Test kayıtları.** Geliştirme veritabanında duruyorlar, "TEST J-43" etiketli ve kapatıldılar:
- SOS: `sos-af570c07`, `sos-9212d9f0`, `sos-4166b7a2`
- Test afetzedeleri: `kul-a1b1670f81`, `kul-28d8597e7f`
- Test bildirimi bellekte duruyor; arka uç yeniden başlayınca silinir.

---

## J-42 🔴 Canlı akış (SSE) kimliksizdi: herkes her SOS konumunu ve ekip konumlarını alıyordu
**Durum:** KAPALI (21 Eylül 2026) · **Bulundu:** 21 Eylül 2026 (afetzede ekranı incelenirken) · **İlgili:** J-43, CLAUDE.md kural 5, MIMARI §9

**Sorun.**
- `/api/live` kimlik istemiyordu. Giriş yapmamış biri akışı açıp her yeni SOS çağrısının
  konumunu, önceliğini ve mahallesini alabiliyordu; ekip konumlarını da.
- Afetzede de aynı akışı alıyordu, başkalarının çağrı konumları dahil. MIMARI §9 "afetzede yalnız
  kendi çağrısını görür" diyor. Liste ucu bunu uyguluyordu, akış uygulamıyordu.
- Konsolda akış giriş ekranında da açılıyordu. Çıkış yapılınca sekmede önceki kullanıcının
  kimliğiyle sürüyordu.
- Sorgu önbelleği çıkışta temizlenmiyordu (`staleTime` sonsuz). Koordinatörden sonra aynı
  sekmede giren afetzede önceki oturumun bütün çağrı listesini görebilirdi.

**Yapıldı.**
- Akış kimliği httpOnly yenileme çerezinden okuyor (`kimlik.cerezden_kullanici`).
  EventSource başlık gönderemediği için bu yol seçildi; jeton URL'ye yazılmıyor (kural 5).
  Çerez okunurken yenilenmiyor. Çerez yoksa ya da oturum iptal edilmişse 401.
- Afetzedeye yalnız iki tip mesaj gidiyor (`uclar/canli.py::_afetzede_icin`):
  - kendi çağrısının durum değişikliği: yalnız `{id, durum}`, konum ve öncelik gitmez;
  - acil bildirim.

  Başkasının çağrısı, ekip konumu ve analiz olayları gitmiyor.
- Konsolda akış yalnız oturum varken açılıyor ve kullanıcı değişince yeniden kuruluyor. Giriş
  ve çıkışta sorgu önbelleği temizleniyor.

**Denetlendi.**
- **Duman testi.** Çerezsiz `/api/live` 401 dönüyor. Bu istek `testler/uc_imzalari.json`'a
  eklendi.
- **Uçtan uca.** İki test afetzedesi (A, B) ve koordinatör akışı aynı anda dinledi:
  - A yalnız kendi çağrısının "bekliyor" ve "kapandi" olaylarını ve bildirimi aldı. B'nin
    çağrısını almadı.
  - Afetzede olaylarında `lon`, `lat` ve `ekipId` yok.
  - Koordinatör iki çağrıyı da konumlarıyla aldı.

---

## J-41 🟠 Haritada ad yoktu, şehre gitme yoktu, noktalar ne olduğunu söylemiyordu
**Durum:** KAPALI (21 Eylül 2026) · **Bulundu:** 21 Eylül 2026 (kullanıcı) · **İlgili:** J-40, ARAYUZ §7, §11

**Sorun.** Prototipte olup konsola taşınmayanlar:
- Haritada şehir, mahalle ve sokak adı yoktu.
- Şehre gitme düğmeleri yoktu (prototipte "Antakya / Bölge" vardı).
- Haritadaki SOS noktasına tıklayınca seçme ve yakınlaşma yoktu.
- Noktaların üstüne gelince ne oldukları görünmüyordu (prototipte `getTooltip` vardı).
- Genel durum ekranında tıklanıp konuma gidilecek bir ihbar listesi yoktu.

**Yapıldı.**
- **Adlar.**
  - `araclar_altlik_uret.py` paketlere OSM yer adlarını (şehir, ilçe, köy, mahalle) ve sokak
    adı yerleşimlerini ekliyor: adlı yolun ortası, yol yönünde açı; 80 m'den kısa yola ad
    yazılmıyor, aynı ad 250 m'den sık tekrarlanmıyor.
  - Yer adı / sokak adı: Antakya 91 / 1 492, Kahramanmaraş 111 / 657, Gaziantep 141 / 1 036,
    Malatya 101 / 509, Adıyaman 52 / 1 459. Beş bölgenin yeniden üretimi ~13 dk.
  - Konsolda deck.gl `TextLayer` ile yakınlaştırmaya göre yazılıyor: z<9 bölge adı, z9 şehir
    ve ilçe, z12 köy, z13 mahalle, z15 sokak.
  - Çakışan ad yazılmıyor (`CollisionFilterExtension`, öncelik şehir > mahalle > sokak).
    Adlar zemin renginde haleyle çiziliyor; renk ve boy token dosyasından.
- **Şehir düğmeleri.** Haritanın üst ortasında: Antakya, Kahramanmaraş, Gaziantep, Malatya,
  Adıyaman, "Tüm bölge". Görünümdeki şehir seçili görünüyor.
- **Tıklama.** Haritadaki SOS, hasar noktası ya da ekibe tıklayınca oraya yakınlaşılıyor;
  SOS seçiliyor.
- **Üstüne gelince bilgi.**
  - SOS: kimlik, aciliyet, durum, mahalle, metin, zaman.
  - Hasar noktası: kaynak, skor, güven, zaman.
  - Ekip: ad, durum, görev.
  - Kapalı yol: "modelin tahmini, sahada doğrulanmadı".
  - Metin HTML'e kaçırılıyor.
- **Genel durum sağ paneli.**
  - "Son ihbarlar" listesi (SOS ve öteki kaynaklar, en yeni önce). Tıklayınca haritada
    oraya gidiyor.
  - "Seçili çağrı" künyesi ve "SOS kuyruğunda aç" düğmesi.
- **Önbellek.** Paket adresi üretim zamanını taşıyor (`?v=`). Paket günlük önbellekte
  kalsa da yeniden üretilen paket eski hâliyle gelmiyor.

**Tarayıcıda denetlendi (21 Eylül).**
- Antakya z12'de şehir, ilçe ve köy adları; Kahramanmaraş düğmesiyle z13'te mahalle adları
  (Osman Gazi, Dulkadir, Hacı Bayram…); sokak ölçeğinde yol yönünde sokak adları.
- "Tüm bölge" beş şehri panellerin arasındaki açık alana sığdırıyor. İlk hâlinde Antakya zaman
  şeridinin altında kalıyordu; kutuya sığdırma artık panel ve şerit ölçülerini token
  dosyasından alıyor.
- Ekip noktasında "AKUT 1 · Müsait · konum saati" bilgisi çıkıyor. SOS noktasında "kimlik ·
  kritik aciliyet · Bekliyor · metin · saat · Tıkla: seç ve yakınlaş" çıkıyor.
- "Son ihbarlar"da bir SOS'a tıklayınca harita oraya yakınlaşıyor, çağrı seçiliyor ve
  künyesi görünüyor.

**Denerken düzeltilenler.**
- Isı haritası sokak ölçeğinde zemini mora boyuyordu. Örtücülüğü artık yakınlaştırmaya bağlı:
  z13'e kadar 0,72, z16'da 0,30.
- Adlar veri noktalarının üstünde çiziliyordu, bir sokak adı SOS noktasını örtüyordu. Adlar
  artık noktaların altında.
- Ekip durumu ham yazılıyordu ("musait"); artık "Müsait".
- Bölge paketi adresine sürüm eklendi (üretim zamanı), yeniden üretilen paket önbellekten
  eski hâliyle gelmiyor.

**Ölçüldü.** Sayfa açıldıktan sonra harita `load` olayı 437 ms'de geliyor, Antakya paketinin
isteği 469–504 ms'de bitiyor. Bir kez görülen 8 sn'lik gecikme, yeni eklenen
`@deck.gl/extensions` için Vite'ın bağımlılıkları yeniden paketlemesinden geliyordu; geliştirme
ortamına özgü ve tek seferlik.

---

## J-40 🟠 Konsolun haritasında altlık yoktu: zemin boştu
**Durum:** KAPALI (21 Eylül 2026) · **Bulundu:** 21 Eylül 2026 (kullanıcı: "hani bir harita yok, hiçbir şey belli değil") · **İlgili:** ARAYUZ §11, MIMARI §8

**Sorun.** Konsolu kurarken altlığı bağlamamıştım. `haritaStili.ts` yalnız siyah zemindi ve
"karo ucu henüz bağlı değil" notu düşülmüştü. "Yol ağı" katmanının çizim kodu yoktu,
"Hasarlı yollar" boş dizi çiziyordu, "Yapılar" bayrağı hasar noktalarını açıyordu. Prototip
Antakya'yı EMSR648 verisiyle çiziyordu; konsola taşınmamıştı.

**Yapıldı.**
- `araclar_altlik_uret.py`: yerel OSM kopyasından (Türkiye PBF, 12 Ağustos 2026) GDAL'ın OSM
  sürücüsüyle bölge başına yollar (5 sınıf), yapılar, su alanları ve nehirler. Sadeleştirme,
  1e-5 derece tamsayı-delta kodlama, gzip. Çıktı `veri/altlik/<bölge>.json.gz` (git dışı,
  yeniden üretilebilir). Bölge başına ~2 dk.
- `GET /api/altlik` (katalog) ve `GET /api/altlik/{bölge}` (hazır dosya; istek yolunda iş yok).
  Giriş gerekli.
- Konsol: harita durunca (`moveend`) görünen alanla kesişen bölgelerin paketleri bir kez
  iner. deck.gl ikili verisiyle en alta çizilir: su, yapılar, nehirler, yollar.
  - Renkler token dosyasından okunuyor (`--color-map-*`), yol genişlikleri prototipteki gibi.
  - "Yol ağı" bayrağı yolları, "Yapılar" bayrağı yapıları açıyor.
  - Hasar noktaları artık ısı bayrağıyla açılıyor; tek görünür fark metin modunda noktaların
    da görünmesi.
  - Künye notu altlığın kaynağını ve tarihini yazıyor: "© OpenStreetMap katkıcıları
    (ODbL 1.0) · yerel kopya 12 Ağustos 2026 · Antakya (Hatay)". Görünen alanda altlık yoksa
    bunu da yazıyor.
- **Ölçüldü (±8 km):**

  | Bölge | Yol | Yapı | Su alanı | Nehir | Paket (gzip) |
  |---|---|---|---|---|---|
  | Antakya | 10 216 | 59 225 | 14 | 9 | 0,96 MB |
  | Kahramanmaraş | 11 483 | 66 659 | 23 | 38 | 1,03 MB |
  | Gaziantep | 19 521 | 171 980 | 46 | 1 | 2,41 MB |
  | Malatya | 9 689 | 52 370 | 31 | 54 | 0,90 MB |
  | Adıyaman | 5 254 | 29 961 | 9 | 2 | 0,50 MB |
- Tarayıcıda denetlendi (Antakya): z12'de şehrin yol ağı ve Asi nehri, z15'te yol
  hiyerarşisi, kavşaklar, köprüler ve yapılar okunuyor. Tip ve token denetimleri temiz.
- Paketler z9'dan itibaren iner. O yakınlıkta ekran birkaç bölgeyi birden kapsayabilir.
  Bu yüzden yapı katmanı yalnız z13 ve üstünde kurulur; yoksa 300 bini aşan çokgen aynı anda
  üçgenlenirdi. Gaziantep'te (172 bin yapı) z13'e geçişin ana iş parçacığında ne kadar
  sürdüğü **ölçülmedi**.

**Sınır.** Yalnız konsolun beş bölgesi (şehir merkezi ±8 km) üretildi; dışında zemin boş ve
künye bunu söylüyor. Adlar J-41'de eklendi. Bölge sayısı büyüyünce aynı veri
vektör karoya (MVT / PMTiles) taşınmalı (MIMARI §8).

---

## J-39 🟡 Büyük alan çizilince görüntü sessizce 8 × 8 karoya kırpılıyor
**Durum:** AÇIK · **Bulundu:** 21 Eylül 2026 (kod okuması; gerçek koşuyla ölçülmedi) · **İlgili:** J-20, J-35

**Sorun.**
- `apps/road_damage/utils/fetcher.py` (`_try_fetch`): istenen kutu 64 karoyu aşarsa kutunun
  ortasındaki 8 × 8 karoya kırpıyor.
- İşçi yakınlaştırmayı kutudan değil `radiusKm`'den seçiyor (`zoom_for_radius`), kutu
  gönderilse bile.
- Örnek: konsolda "Alan çiz" ile 10 km'lik kutu ve varsayılan 2,5 km yarıçap → z15, ~10 × 10
  karo → ortadaki ~7,9 km analiz ediliyor, kenarlar hiç girmiyor. Sonuç bunu söylemiyor.
- Konsolda OAM görüntüsü seçilince alan görüntünün tüm kutusuna (40 × 30 km'lik Maxar
  şeritleri) oturuyordu; bu J-35'te kaldırıldı ama kırpmanın kendisi duruyor.

**Yapılacak.** İşçi istenen kutuyu ve fiilen analiz edilen sınırları sonuca yazsın; konsol
fark varsa söylesin. Yakınlaştırma çizilen kutunun boyundan seçilsin; bütçeyi aşan alanda
kırpmak yerine süre ya da çözünürlük uyarısı verilsin (J-20 kararıyla birlikte).

---

## J-38 🟠 Yol ağı zaman aşımına uğrayınca sonuç "0 kapalı yol, bölge erişilebilir" diyor
**Durum:** AÇIK · **Bulundu:** 21 Eylül 2026 · **İlgili:** J-21, kural 1

**Ölçüm.** Antakya, Wayback 57965, r = 0,75 km: OSM grafı 45 sn sınırını aştı
(`lojistik=49,1 sn`), işçi "Lojistik analiz opsiyonel - OSMnx zaman asimina ugradi"
satırını yazıp `openRoads = 0`, `blockedRoads = 0` döndü; `/route` oturumu hiç açılmadı.
Konsol (`konsol/src/modlar/hasar.tsx`, Sonuç bölümü) bunu "Kapalı yol 0 segment · Açık yol
0 segment" diye gösteriyor; o koşunun öneri metni de **"Bolge genel olarak erisilebilir
durumda."** oldu (öneri, graftan değil yol rasterından hesaplanan `blockedRoadPct =
0,0019`'a bakıyor). Yani yol ağı **hiç çözümlenmemişken** sonuç "kapanma yok, bölge
erişilebilir" diye okunuyor.

**Sıklık.** 21 Eylül'deki dört uçtan uca koşunun üçünde yol ağı zaman aşımına uğradı
(49,0–49,1 sn); yalnız OAM r = 0,35 km koşusunda graf 4,9 sn'de geldi. Yani bu
koşulların çoğunda canlı analiz kapanma hiç çıkarmıyor.

**Yapılacak.** İşçi sonuca `roadNetwork: "ok" | "timeout" | "error"` yazsın; konsol
zaman aşımında sayıları göstermesin, "yol ağı alınamadı, kapanma çıkarılamadı" desin;
öneri metni bu durumda erişilebilirlik iddia etmesin. Grafı yerel PBF önbelleğinden
okuma yolu var (`load_local_graph_from_cache`) ama yalnız önceden ısıtılmış kutular için.

---

## J-37 🟡 Sert rotanın 422 mesajı ağ kopukluğunu kapanma sanıyor
**Durum:** AÇIK · **Bulundu:** 21 Eylül 2026 · **İlgili:** J-34

**Ölçüm.** J-34 uçtan uca koşusunda 20 rastgele çiftin 4'ünde iki modda da yol yok. Tam
grafta (hiç kenar gizlenmeden) de yok; dört çiftin dördünde ters yönde rota bulunuyor.
Sebep: araç ağı yönlü (tek yön sokaklar) ve analiz kutusunun kenarında kesiliyor. Sert
mod buna "Bu iki nokta arasinda guvenli bir baglanti bulunamadi. Yol tamamen kapali
olabilir." diyor (`uclar/rota.py`) — kapanmayı suçluyor.

**Yapılacak.** 422'den önce tam grafta yol olup olmadığına bak: yoksa "ağda bu yönde yol
yok (tek yön / kutu sınırı)", varsa "kapanmalar yüzünden yol yok" de. Mesaj değişikliği
yanıt metnini değiştirdiği için duman imzası yeniden kaydedilmeli.

---

## J-36 🟠 Eğitilen modeller ürüne takılmaya hazır değil
**Durum:** DEVAM EDİYOR — 1, 2 ve 4 yapıldı ve ölçüldü; 3 uyarıyla sınırlı; 5 ve 6 açık · **Bulundu:** 21 Eylül 2026 · **İlgili:** J-20, kural 1, kural 8

**Soru (kullanıcı):** eğitimden sonra modelleri verdiğimizde proje onlarla doğru çalışacak mı?
Kod okundu; bugünkü hâliyle **hayır**. Sebepler:

1. **Yükleyici tek mimariye sabit.** `apps/road_damage/utils/inference.py:39`
   `smp.Segformer(encoder_name="mit_b4", classes=1)`; dosya yolu `cekirdek.py:691`'de sabit.
   Eğitim defterinde 11 aday var (`QuakeMind_veri/araclar/defter_dokuz_model.py:397-407`);
   yalnız `segformer_mitb4` yüklenir. Öbürleri `load_state_dict`'te düşer, işçi havuzu
   kurulamaz, **bütün analizler hata verir**. İyi haber: defter düz `state_dict` kaydediyor
   (satır 584-585) ve Colab'daki sürümler (smp 0.5.0, torch 2.11) yereldekiyle aynı; bir
   SegFormer-B4 yüklenmeli (gerçek dosyayla henüz denenmedi). Ağırlık yalnız
   `AGIRLIK_SAKLA` açıksa Drive'a yazılıyor.
2. **Eşik uyuşmuyor.** Makaledeki IoU, sigmoid çıktısında 0,5 eşiğiyle ölçülüyor
   (`ESIK = 0.5`, defter satır 111). Ürün olasılığı 3,5 ile çarpıp 0,40'ta kesiyor
   (etkin eşik 0,40 / 3,5 = **0,114**) ve üstüne 2. düzey morfoloji uyguluyor. Üründeki
   çıktı ölçülen modelin çıktısı değil. Değerler dört yere dağılmış: `RoadDamageRequest`
   varsayılanları, konsol hazırları (`hasar.tsx` HAZIRLAR: 0,45 / 0,40 / 0,28; güçlendirme
   3,5 / 4,5), `make_model_masks.py` INFERENCE_PARAMS, işçi varsayılanları.
3. **Çözünürlük (J-20).** Eğitim 0,375–0,5 m/px. Ürün yakınlaştırmayı yarıçaptan seçiyor:
   konsol hazırları 1,5 / 2,5 / 4 km → z16 / z15 / z14 → 36° enlemde 1,9 / 3,9 / 7,7 m/px.
   z18 (0,48 m/px) yalnız r ≤ 0,46 km'de. Defterin kendi tanısı: MEDBFS 0,75 m'de IoU 0,086.
4. **Sonuç hangi modelden çıktığını yazmıyor.** Künyede görüntü var, model adı / sha256 /
   eşik yok (kural 1).
5. **Kıyas hattı eski modele sabit.** `make_model_masks.py` model ağırlığını SHA-256 ile
   doğruluyor (`7d7fb8d8…`); yeni model yeni iz ister.
6. **Metin sınıflandırıcı** (`apps/disaster_nlp/src/classification.py`): yeni modelin
   etiketleri `CATEGORY_MAPPING`'deki 13 adla eşleşmezse sonuç "Diğer"e düşer;
   `DISASTER_MODEL_NAME` ortam değişkeni yerel varsayılan model varken hiç okunmuyor;
   anahtar kelime kuralı `max(score, 0.50)` döndürüyor — modelin üretmediği bir güven
   değeri (kural 1). YOLO eğitilmeyecek (21 Eylül kararı); risk CatBoost'u
   `araclar_risk_egit.py` ile eğitildiği sürece takılır.

**Önerilen çözüm (model kaydı).** Her model için `kunye.json`: mimari, kodlayıcı, sınıf
sayısı, karo boyu, eğitim GSD'si, normalizasyon, doğrulamada seçilen eşik, son işlem,
sha256, eğitim deneyi / tohum, sınama ölçütleri. Yükleyici `smp.create_model` ile mimariyi
künyeden kurar, sha256'yı açılışta doğrular; eşik ve son işlem künyeden gelir, istek
yalnız açıkça ezerse değişir; yakınlaştırma eğitim GSD'sinden seçilir; sonuç model adını
ve izini yazar; kıyas hattı aynı kaydı okur. Defter `model_en_iyi.pth`'nin yanına
`kunye.json` yazar. **Teslim testi:** (1) yükleme, (2) defterin sınama karolarının bir
kısmında defterdeki IoU'nun yeniden üretilmesi (aynı ön işlemenin kanıtı), (3) bilinen bir
Maxar alanında canlı koşu.

**Yapıldı (21 Eylül).**
- **Künye ve yükleyici (madde 1).**
  - `modeller/uydu/<ad>.json` ve `apps/road_damage/utils/model_kunyesi.py`. Etkin modeli
    `QM_UYDU_MODELI` seçer; varsayılan bugünkü model. Mimari künyeden kurulur, SHA-256
    tutmazsa ağırlık yüklenmez, anahtarlar katı (strict) eşleşir.
  - Bugünkü modelin künyesi (`segformer_mitb4_dice30`) bilinmeyenleri açıkça yazıyor:
    eğitim kaydı yok, sınama ölçümü yok (A-01).
  - *Ölçüldü:*
    - Künyeden yükleme eski yükleyiciyle birebir aynı çıktıyı veriyor (en büyük fark 0).
    - Defterin 11 mimarisinin 11'i yükleniyor, 1×1×512×512 çıktı veriyor.
    - Yanlış parmak izi reddediliyor.
    - Eski yükleyici U-Net ResNet-18'i yükleyemiyor.
    - CPU'da 512² ileri geçiş: MiT-B4 1,19 sn, U-Net R18 0,29 sn.
- **Karar ayarı künyeden (madde 2).**
  - `RoadDamageRequest` eşik, güçlendirme, normalizasyon ve son işleme alanları artık
    isteğe bağlı; gönderilmezse künyeden gelir.
  - Bugünkü künye eski sabitleri taşıyor, davranış değişmedi: duman testi 57 istekte
    0 fark.
  - Defterden gelen modellerin künyesi defterin ölçtüğü ayarı taşır: eşik, güçlendirme 1,
    son işleme yok.
  - Konsol hazırları artık yalnız alanı seçiyor. Hassas tarama eşiği modelinkinin %70'ine
    indiriyor.
  - **Değişen davranış:** "Hızlı tarama" eskiden eşiği 0,45, son işlemeyi 1 yapıyordu; artık
    modelin ayarıyla (0,40 / 2) koşuyor.
  - *Ölçüldü (QQB dış sınama, 74 karo, ürünün kendi `run_inference`'ı, bugünkü model):*

    | Ayar | IoU | Kesinlik | Duyarlılık |
    |---|---|---|---|
    | Ürün ayarı 0,40 / ×3,5 / son işleme 2 | 0,208 | 0,319 | 0,372 |
    | Ham ayar 0,5 / ×1 / son işleme yok | 0,222 | 0,402 | 0,332 |
- **Çözünürlük (madde 3), yalnız uyarı.** Yakınlaştırma otomatik değiştirilmedi.
  - Sebep: 2,5 km'de z18 CPU'da saatler sürer (J-20). Ayrıca indirici 64 karoyu aşan alanı
    sessizce kırpar (J-39).
  - Bunun yerine sonuç `model.kullanilanGsdM` ve `model.gsdUyarisi` alanlarını taşıyor
    (eğitim üst sınırının 1,5 katından kaba ise uyarı). Konsol uyarıyı gösteriyor.
  - Karar kullanıcıda (J-20 seçenekleri).
- **Sonuç künyesi (madde 4).**
  - Her sonuç `model` alanını (ad, mimari, ağırlık izi, karar ayarı, eğitim çözünürlüğü,
    ölçüm) ve `postProcessLevel`'ı taşıyor.
  - Yeni uç `GET /api/road_damage/model`: konsol varsayılanları buradan alıyor.
- **Araçlar.**
  - `araclar_model_kunye.py` defter koşusundan (`sonuc.json` + `model_en_iyi.pth`) künye
    üretiyor. Yerelde gerçek koşu klasörü olmadığı için yalnız defter şemasına uyan test
    klasörüyle mekanik olarak sınandı; ölçüm değil.
  - `araclar_model_teslim.py` teslim testini koşuyor.
  - Rehber: `modeller/README.md`.
- **Açık.** Madde 5 (`make_model_masks.py` eski modele sabit) ve madde 6 (metin
  sınıflandırıcı) yapılmadı.

---

## J-35 🟠 Konsolun Wayback "deprem sonrası" varsayılanı Antakya'da deprem öncesi görüntü
**Durum:** KAPALI (21 Eylül 2026) · **Bulundu:** 21 Eylül 2026 · **İlgili:** J-21, D-01, kural 1

**Sorun.** Bu oturumda yazılan konsol (`konsol/src/modlar/hasar.tsx`) "Deprem sonrası"
düğmesiyle 6 Şubat'tan sonraki ilk Wayback sürümünü (57965, 2023-02-23) seçiyor,
"hasarı bu görüntüde ararız" diyor ve sonuç künyesinde "23 Şubat 2023 tarihli Esri
Wayback arşiv görüntüsü" yazıyor. Sürüm tarihi çekim tarihi gibi sunuluyor.

**Yeniden ölçüldü (21 Eylül).** J-21'deki karo (z17, x 78701, y 51378): 11475
(2023-01-11) ve 57965 (2023-02-23) isteklerinin **ikisi de 301 ile 48232 sürümüne
yönleniyor**, dönen karo aynı (sha1 `fa0263438072c2f8`, J-21'deki değer). Wayback bir
karoyu güncellemeyen sürümde onu son güncellendiği sürüme yönlendiriyor. Yani konsolun
varsayılanı Antakya merkezinde **deprem öncesi** görüntüyü çözümletiyor; bulunan her
"hasar" yanlış alarm.

**Yapılacak.** (a) Arka uç karonun gerçekte hangi sürümden geldiğini 301'i izleyerek
çözsün (ya da Esri World Imagery metadata katmanından çekim tarihini okusun) ve sonuca
yazsın; (b) konsol "arşiv sürüm tarihi ≠ çekim tarihi" desin, çözülen karo deprem
öncesiyse uyarsın ve OAM'ı önersin; (c) deprem bölgesinde varsayılan kaynak OAM Maxar
olsun (D-01, J-21 zaten bunu söylüyor).

**Ölçüm: üç şehirde Wayback'in gerçekte gösterdiği görüntü (21 Eylül).** Esri'nin
`tilemap` ucu karonun hangi sürümden geldiğini (`select`), her sürümün metadata katmanı
(katman = 23 − z) çekim tarihini (`SRC_DATE`) veriyor. z15 / z17 / z18'de sonuç aynı:

| Şehir | Şubat–Mart 2023 sürümlerinin gösterdiği çekim | Deprem sonrası ilk çekim | O çekimi getiren ilk sürüm |
|---|---|---|---|
| Antakya | 27 Eylül 2021 | 4 Nisan 2023 (57 gün sonra) | 8 Şubat 2024 |
| Kahramanmaraş | 27 Haziran 2021 (23 Şubat sürümü), 15 Temmuz 2022 (15 Mart sürümü) | 22 Şubat 2023 (16 gün sonra) | 8 Şubat 2024 |
| Adıyaman | 30 Temmuz 2021 | 21 Nisan 2024 (440 gün sonra) | 24 Nisan 2025 |

Deprem sonrası ilk bir yılın hiçbir Wayback sürümü bu üç merkezde depremi göstermiyor.
Ayrıca 23 Şubat 2023 sürümünde Antakya'nın z18 karosu hiç yok (404); indirici bu durumda
sessizce z17'ye iniyordu.

**Yapıldı (21 Eylül).**
- `apps/road_damage/utils/wayback.py`: konumun görüntü geçmişi (sürüm → gerçek sürüm →
  çekim tarihi, uydu, çözünürlük); yeni uç `GET /api/road_damage/wayback_goruntuler`
  (saha ve üstü; soğuk 1,4–5,7 sn, önbellekten 26 ms).
- İşçi sonuca `imageryZoom`, `imageryRequestedZoom`, `imageryCaptures` ve
  `imageryEventTiming` ("pre" / "post" / "mixed" / "unknown") yazıyor. Yakınlaştırmanın
  düşürülmesi de artık günlükte ve sonuçta görünüyor.
- Konsol:
  - Varsayılan kaynak OAM. Öneri, analiz alanını en çok kapsayan en erken Maxar çekimi;
    Antakya'da 8 Şubat 2023, z16'da gözle bakıldı: bulutsuz, deprem sonrası.
  - OAM görüntüsü seçmek analiz alanını değiştirmiyor. Eskiden alan görüntünün tüm
    kutusuna (40 × 30 km'lik şeritler) oturuyordu; bkz. J-39.
  - OAM'da görüntü seçilmeden analiz başlamıyor. Sunucu seçimsiz istekte görüntüyü kendi
    seçiyor ya da Google'a düşüyordu.
  - Wayback düğmeleri çekim tarihine göre çalışıyor ("Deprem sonrası ilk çekim"). Listede
    her sürümün çekim tarihi yazıyor. Açıklama deprem öncesi ve sonrası durumu ve depremden
    kaç gün geçtiğini söylüyor; bu konumda deprem sonrası görüntü yoksa uyarı çıkıyor.
  - Sonuçta çekim tarihleri ve çözünürlük görünüyor. Görüntü deprem öncesiyse uyarı
    sayılardan önce çıkıyor ve "bölge erişilebilir" önerisi gizleniyor.
- **Uçtan uca:** Wayback 57965 ile Antakya, r = 0,35 km. Sonuç z18 istendiğini, karo
  olmadığı için z17 kullanıldığını ve çekimin 27 Eylül 2021 (`pre`) olduğunu yazıyor. Model
  bu deprem öncesi görüntüde piksellerin %0,16'sını hasar işaretledi; hepsi yanlış alarm.
- Tip denetimi ve token denetimi temiz. Duman testi 57 istekte 0 fark.

**Tarayıcıda denetlendi (21 Eylül).** Varsayılan kaynak OAM; öneri "Maxar, 8 Şubat 2023 (depremden 2 gün
sonra), alanın ~%100'ü", listede her görüntünün kapsama oranı. Wayback'e geçince varsayılan "8 Şubat 2024
sürümü · çekim 4 Nisan 2023" ve "depremden 57 gün sonra"; "Deprem öncesi" düğmesi "15 Mart 2023 sürümü ·
çekim 27 Eylül 2021" ve kalın uyarı: "görüntüde depremin hasarı yok, bulunan her hasar yanlış alarmdır".

---

## J-34 🟠 Sürekli yumuşak maliyet ve simetrik kural — bölgeler arası görev tabanlı sınama
**Durum:** KOŞULDU (21 Eylül 2026); canlı sistemde bayrak arkasında, varsayılan değişmedi · **Açıldı:** 21 Eylül 2026 · **İlgili:** J-30, B-01, B-06, M-20

**Soru.** J-30'da modelin ikili kapanmaları sert (kenar silinir) ve kaba yumuşak (×3,
×10) kullanıldı; hiçbir ayarda tutarlı kazanç çıkmadı. İki yöntemsel fark hiç
denenmedi: (1) ikili kapanma yerine **sürekli olasılık** p(e) = kenar boyunca
örneklerin hasarlı piksele düşen oranı; (2) **simetrik kural**: yer gerçeği bir
kenarı örneklerinin %50'si hasarlı çizgiye yakınsa kapalı sayıyor, bugünkü model
kuralı ise TEK hasarlı pikselle tüm kenarı kapatıyor. J-30'daki düşük kesinliğin
(~0,10-0,18) bir kısmı bu asimetriden gelebilir.

**Ön kayıt (sonuç görülmeden, 21 Eylül 2026 — `benchmark/yumusak_maliyet_deneyi.py`):**
- Veri: EMSR648'in hasarlı yol işaretlediği 1 km'lik hücreler (Hatay AOI11 13 hücre,
  K.Maraş AOI04 20 hücre; hücre ızgarası hasar kümesine göre değil sabit ızgaraya
  göre). Maskeler z18, OpenAerialMap Maxar deprem sonrası (en erken tarihli sahne
  önce), canlı sistemle aynı SegFormer ve eşikler (`make_model_masks.py`).
- Dünya: EMSR gevşek kural, tampon 8 m, en az örtüşme 0,5 (J-30 ile aynı).
- Ajanlar: R0, R3, M-sert (p > 0; bugünkü sistem), M-simetrik (p ≥ 0,5),
  M-y(λ) maliyet = uzunluk × (1 + λp), λ ∈ {0,5; 1; 2; 4; 8; 16}.
- λ seçimi: bir ilde (ayar) ortalama görev süresini en aza indiren λ; öbür ilde
  (sınama) YALNIZ o λ raporlanır; iki yön. Tüm eğri şeffaflık için yazılır, iddia
  yalnız sınama değerine dayanır.
- Görevler: hücre × tohum (42-51) × 3; ekip hücre sınırına 150 m içinden, afetzede
  EMSR hasarlı yol çizgisine 60 m içinden; kusursuz bilgiyle ulaşılabilir olmalı.
- t_u 20 dk (5 dk duyarlılık). Ölçütler: ortalama görev süresi, R0→R3 kazancının
  yakalanan payı, keşif, "rota bulunamadı", kesim düzeyi kesinlik/duyarlılık/IoU.

**Bilinen sınırlar (şimdiden):** hücreler hasarlı yol içeren yerlerden seçildiği için
kesinlik şehir geneline göre iyimser olabilir; ağ "walk" (J-30 ile karşılaştırılabilir
olsun diye); EMSR hasar derecesi = geçilemezlik bir varsayım (J-28, M-26).

**Sonuç (21 Eylül 2026).** 33 hücre (Hatay 13, K.Maraş 20), 976 görev, 10 tohum.
Kod: `benchmark/yumusak_maliyet_deneyi.py`; maskeler `benchmark/data/model_masks_emsr/`
(33/33 hücrede görüntü kapsaması %100, hücre başına ~75 sn CPU); graf yerel PBF'ten.

*Algılama (kesim düzeyi):*

| Kural | Hatay kesinlik / duyarlılık / IoU | K.Maraş kesinlik / duyarlılık / IoU |
|---|---|---|
| M-sert (bugünkü, p > 0) | 0,159 / 0,071 / 0,052 | 0,181 / 0,085 / 0,062 |
| M-simetrik (p ≥ 0,5) | 0,189 / 0,021 / 0,019 | 0,191 / 0,028 / 0,025 |

*Görev (t_u = 20 dk, R0→R3 kazancının yakalanan payı):*

| Ajan | Hatay | K.Maraş |
|---|---|---|
| R0 / R3 süresi | 14,47 / 2,99 dk | 14,70 / 3,23 dk |
| M-sert | %4,4 (39 "rota bulunamadı") | %15,9 (26) |
| M-simetrik | %−3,5 | %−1,7 |
| M-y λ = 0,5 · 1 · 2 · 4 · 8 · 16 | %2,8 · 3,7 · 3,7 · 10,5 · 13,6 · 22,3 | %1,5 · 1,8 · 4,8 · 10,5 · 16,7 · 14,1 |

*Ön kayıtlı çapraz sınama:* λ Hatay'da seçildi (16) → K.Maraş'ta **%14,1**, hücre
düzeyi bootstrap %95 GA **[%0,8; %27,9]**. λ K.Maraş'ta seçildi (8) → Hatay'da
**%13,6**, GA **[%−0,4; %22,2]**. t_u = 5 dk: %12,9 [−0,6; 26,3] ve %12,2 [−2,2; 20,1].
Görev bazında (R0'a göre) sınama ajanı K.Maraş'ta 53 görevde iyi, 54'ünde kötü,
484'ünde eşit; Hatay'da 19 iyi, 25 kötü, 341 eşit — ortalama kazanç, pahalı geri
dönüşlerin önlendiği az sayıda görevden geliyor.

*Değerlendirme.*
1. **Simetrik kural hipotezi desteklenmedi.** Kesinliği yalnız 0,16 → 0,19'a çıkardı,
   duyarlılığı 0,07 → 0,02'ye düşürdü; görevde R0'dan kötü. Düşük kesinliğin kaynağı
   kenar kuralı değil maskenin kendisi.
2. **Sürekli yumuşak maliyet, iki yönde de pozitif sınama değeri veren ilk
   varyant** (~%13-14) ve ağı hiç koparmıyor (sert kurallarda 26-39 "rota
   bulunamadı"). Ancak güven aralıkları geniş: bir yönde alt sınır sıfırın hemen
   üstünde (%0,8), öbür yönde sıfırı içeriyor. **Anlamlı kazanç iddia edilemez;
   yönü tutarlı bir işaret olarak raporlanmalı.**
3. Hatay'da en iyi λ ızgaranın sınırında (16): daha büyük λ denenmedi; denenirse ayrı
   ve yeniden ön kayıtlı bir koşu olmalı (sonuca bakıp ızgara genişletmek çatallı yol).
4. Darboğaz J-30'daki gibi algılama kalitesi (IoU 0,05-0,06).

**Ürün için karar (kullanıcıda):** canlı sistemde kapanmaları sert silmek yerine
yumuşak maliyet kullanmak kazanç açısından belirsiz ama **sağlamlık açısından**
avantajlı (yanlış alarmlar hedefi ağdan koparamaz). Varsayılan sessizce
değiştirilmez; bayrak arkasında eklenmesi önerilir.

**Güven aralıklarının kaynağı.** `benchmark/yumusak_maliyet_ga.py` (hücre düzeyi
bootstrap, 2 000 örnek, tohum 7; girdi `runs/yumusak_maliyet/satirlar.json`). Yukarıdaki
dört aralık ve görev sayıları bu betikle yeniden üretildi, birebir aynı. Aynı betiğe göre
bugünkü kural (M-sert) K.Maraş'ta %15,9 [0,8; 30,9], Hatay'da %4,4 [−10,6; 24,2]:
yumuşak maliyetin sert kurala üstünlüğü de gösterilmiş değil.

**Canlı sistemde bayrak (21 Eylül 2026, kullanıcı: "bayrak arkasında ekle").**

- `POST /api/road_damage/route` iki isteğe bağlı alan aldı: `costModel`
  (`"hard"` varsayılan = bugünkü kural, `"soft"`) ve `softLambda` (varsayılan 8,
  0–64). λ = 8, K.Maraş'ta seçilip Hatay'da sınanan değer; Hatay'da seçilen 16 ızgaranın
  kenarına dayandığı için daha az güvenilir sayıldı. Yumuşak yanıt ek olarak
  `closureExposureMeters` (rotadaki Σ uzunluk × p) ve `riskyEdgeCount` döner. Sert
  yanıt birebir eski biçimde.
- p, işçide **genişletilmemiş** model maskesinden hesaplanır (deneydeki tanım, r_h'den
  bağımsız); oturumda yalnız p > 0 kenarlar tutulur. Konsol bu ucu henüz çağırmıyor.
- `/analyze` oturumu artık tam grafı ve kapalı kenar kümesini tutuyor; sert rota grafın
  kopyası yerine `restricted_view` üzerinde koşuyor (bellek aynı: bir graf). Anahtarlar
  bilerek `G`/`closedEdgeKeys` değil — o ikisi `/naive_compare` ve `/reference_compare`'in
  "yer gerçeği olan oturum" işareti.
- **Eşdeğerlik ölçüldü:** 33 EMSR hücresinde, modelin gerçek maskesinden çıkan
  kapanmalarla (734 kapalı kenar), hücre başına 50 rastgele çift: kopya ile görünümde
  A* rotaları **1 650 / 1 650 birebir aynı**.
- `edge_closure_probability` vektörleştirildi: döngülü sürümle 33 hücre × (geçerli maske
  var / yok) **66 / 66** ve 31 596 kenarlı 5 × 5 km grafta **2 / 2** karşılaştırmada
  birebir aynı; o grafta 5,9 sn → 0,78 sn. J-34 sonuçları bu değişiklikten etkilenmez.
- **Varsayılan değişmedi:** uç duman testi 57 istekte `testler/uc_imzalari.json` ile
  **0 fark**.
- *Uçtan uca (Antakya, OAM Maxar `10300100E18CB600` 2023-02-11, r = 0,35 km, z18):*
  analiz 154 sn (çıkarım 92,9 sn), `damageRate` 0,0126 (J-19'daki ölçümle aynı),
  396 açık / 11 kapalı parça, p > 0 olan 13 kenar, olasılık hesabı 0,0 sn. 20 rastgele
  çift: 14'ünde üç ayar da (sert, λ = 8, λ = 0) aynı mesafe; 1'inde yumuşak rota kısa (465,7 → 346,0 m, 1 riskli
  kenar, 5,5 m beklenen kapalı metre); 1'inde λ = 8 sert kuralın dolambacını korudu
  (846,5 m), λ = 0 riskli kenardan geçti (658,1 m, 26,6 m); 4'ünde iki modda da yol yok —
  sebebi kapanma değil ağ (bkz. J-37). Yanıtta graf nesnesi sızmadı.

---

## J-33 🟡 Sağlık kontrolü model yüklüyordu ve kamera durumunu uyduruyordu
**Durum:** KAPALI (21 Eylül 2026) · **Bulundu:** 21 Eylül 2026

**Sorun.** `GET /api/status` içinde `"nlp": _get_nlp_pipeline() is not None`
satırı tembel yükleyiciyi çağırıyordu: sunucu açıldıktan sonraki ilk sağlık
kontrolü BERTurk'ü (sınıflandırma + NER) belleğe alıyordu (log: "NLP Pipeline
loaded lazily" sağlık kontrolüyle tetiklendi). `"camera": True` ise hiçbir
kontrol yapmadan sabit dönüyordu — model dosyası olmasa da "var" diyordu
(CLAUDE.md kural 1).

**Düzeltme.** Alanlar yükleme tetiklemeden hesaplanıyor: model bellekteyse ya da
dosyası diskteyse kullanılabilir. Bellekteki modeller ayrı `yuklu` alanında.
Ölçüm: ilk sağlık kontrolü 13 ms, NLP yükleme sayısı 0.

---

## J-32 🟠 Analiz sonucu ucu 17,6 MB dönüyor; 16 MB'ı tanı görseli
**Durum:** KISMEN KAPALI · **Bulundu:** 20 Eylül 2026

**Ölçüm.** `GET /api/road_damage/status/{id}` biten bir analiz için (Antakya, 1 km
yarıçap) **17,59 MB** JSON döndürüyor. Dağılım: `imageOriginalB64` 5,5 MB ·
`imageSegmentationOverlayB64` 5,5 MB · `imageDamageOverlayB64` 5,3 MB ·
`imageRoadMaskB64` 117 KB · `safeRoadSegments` 1,69 MB · `blockedRoadSegments`
12 KB · geri kalan bütün sayılar ve künye toplam ~1 KB.

**Neden sorun.** Eski web bu ucu yoklamayla çağırıyor ve her çağrıda tam gövde
iniyor; sonucu yalnız sayı olarak gösteren bir istemci de 17 MB indirmek zorunda
kalıyor. Büyük veriyi JSON ile taşımak MIMARI §8'de zaten kırılma noktası olarak
yazılı: asıl maliyet ayrıştırma.

**Yapılan (20 Eyl).** Uca `?gorseller=0&segmentler=0` seçeneği eklendi; varsayılan
davranış değişmedi (eski web etkilenmiyor). Yeni konsol özeti bu seçenekle ~1 KB
olarak çekiyor, yol geometrisini ise zaten var olan ve ETag ile önbelleklenen
`GET /api/road_damage/segments/{id}` ucundan alıyor.

**Yapılan (21 Eyl).** Görseller artık JSON'da değil diskte: iş bitince
`veri/analiz_gorselleri/{isId}/{ad}.png` olarak yazılıyor, `GET
/api/road_damage/gorsel/{isId}/{ad}` ile tek tek ve önbelleklenebilir şekilde
alınıyor. Bellekteki iş deposu görsel tutmuyor (20 iş × ~16 MB tavanı kalktı).
Eski web base64 beklediği için `gorseller=1` (varsayılan) çağrısında dosyadan
okunup kodlanıyor — davranışı değişmedi.

**Kalan.** (1) Görseller PNG; WebP'ye çevrilirse dosya boyutu düşer (tek görsel
bugün ~10 MB).
(2) `safeRoadSegments` 1,69 MB JSON: MIMARI §8'deki eşiğe göre ikili ya da vektör
karo olmalı. (3) Eski web yoklamayı bırakıp SSE'ye geçtiğinde bu uç tamamen
sayı-özeti hâline gelebilir.

---

## J-31 🔴 Ara referanslar R1/R2 (Tablo 16, M-25): güçlü referanslara karşı kazancın %55–90'ı kalıyor
**Durum:** AÇIK — sonuçlar makaleye işlenmeli · **Bulundu:** 16 Eylül 2026 · **İlgili:** M-25, E-02, J-29, J-30

**Tasarım.** `simulate_reference_fleet` (`network.py`; zaman sıralı, R0/R1/R2 tek fonksiyonda),
`POST /api/road_damage/reference_compare` (aynı oturum, aynı kapanma kümesi, aynı atamalar),
`full_scenario.py --references` (varsayılan kapalı — canlı gösterim betikleri değişmedi),
`multi_seed.py run --references --out multi_seed_refs --compare-with multi_seed`.
- **R0:** Algoritma 1, değişmedi.
- **R1:** her kavşakta planlı yolun önündeki 100 m'yi görür (yol boyunca ölçülür; köşe
  dönüşleri görüşü kesmez — R1 için iyimser); aynı kavşaktaki gözlemler **tek** t_u.
- **R2:** bölge içi filo aynı anda yola çıkar; bir ekibin öğrendiği kapanma o anda telsizle
  herkese yayılır; telsizle öğrenilen kapanma **cezasız** yeniden planlanır, kendi keşfi R0 gibi
  cezalı. Aynı karargâhtan çıkan kafilede öndeki keşfeder, arkadakiler cezasız yön değiştirir
  ("anında yayılır"). **R2e** (duyarlılık): kafile kuralı yok, aynı anda varan her ekip kendisi
  keşfeder. **R1+R2**: ikisi birlikte (makalede tanımlı değil, ek).
- **Doğrulama:** yeni simülatörün R0 modu **986/986** görevde naive_compare ile birebir;
  QuakeMind/R0 toplamları ve afetzede yerleşimleri J-29 taramasıyla **90/90** koşuda aynı;
  ağırlık fonksiyonlu yol bulucu, görünümlü olanla bütün varyantlarda birebir (~5× hızlı).
  90 koşu, 62 dk, hatasız. Kafile kuralı eklenmeden önceki yarım tarama:
  `runs/_superseded/2026-09-16-r2-kafile-kurali-oncesi/`.

**Tablo 16 (t_u = 20 dk, 10 tohum, ortalama ± ss; fark = referans − QuakeMind; kazanç % = fark / referans):**

| Yaklaşım | 8 ilçe sentetik: toplam (dk) | fark | kazanç | EMSR648 gevşek, 4 ilçe: toplam (dk) | fark | kazanç |
|---|---|---|---|---|---|---|
| QuakeMind (kusursuz bilgi, R3) | 203,5 ± 18,9 | — | — | 154,1 ± 23,3 | — | — |
| R0 — naif (t_u = 20) | 1 552,0 ± 252,0 | 1 348,5 | %86,7 | 1 433,0 ± 607,8 | 1 278,9 | %86,8 |
| R0 — yalnız yol (t_u = 0) | 258,0 | 54,5 | %21 | 205,0 | 50,9 | %23 |
| **R1 — görüş mesafeli** | 1 357,1 ± 185,2 | 1 153,7 | %84,9 | 942,4 ± 340,5 | 788,2 | %81,6 |
| **R2 — bilgi paylaşan filo** | 1 409,5 ± 251,0 | 1 206,0 | %85,3 | 1 062,6 ± 297,5 | 908,5 | %84,1 |
| R1 + R2 (ek) | 1 264,1 ± 203,2 | 1 060,7 | %83,7 | 763,8 ± 175,0 | 609,7 | %78,7 |

R0'a karşı ölçülen kazancın referansa karşı **kalan payı**: R1 %86 / %64, R2 %90 / %77,
R1+R2 %80 / %55 (8 ilçe / EMSR). Yalnız yol farkı (t_u'dan bağımsız, t_u = 0 simülasyonu):
R1 33,7 / 34,2 dk, R2 52,8 / 45,4 dk, R1+R2 32,6 / 32,9 dk (%14 / %17). Diğer yapılandırmalar,
t_u taraması ve R2e: `runs/multi_seed_refs/multi_seed_tablo.md`.

**Bulgular.**
1. **Kazanç güçlü referanslara karşı da büyük** (t_u = 20'de %78–85) — "R0 samandan adam"
   eleştirisine cevap. Ama bu büyüklük hâlâ t_u'dan geliyor: en güçlü referansa (R1+R2) karşı
   yalnız yol farkı 8 ilçede 32,6 dk (%14), EMSR'de 32,9 dk (%17).
2. **Gerçek hasarda erime daha büyük:** sentetikte R1+R2'ye karşı kazancın %80'i kalıyor,
   EMSR'de %55'i. Gerçek hasar kümeli olduğu için görüş ve telsiz orada çok daha etkili.
3. **R1'in avantajının bir kısmı sayım kuralından:** R0 aynı kavşaktaki ardışık keşifleri ayrı
   ayrı cezalandırıyor (Algoritma 1). EMSR gevşekte R0 − R1 = 490,6 dk'nın **272,0 dk**'sı bu
   sayımdan, **218,6 dk**'sı görüşten; sentetikte 20,0 + 174,8 dk. R0'ı durak başına sayan satır
   tabloda ayrıca var.
4. **Bilgi paylaşımı her zaman kısaltmıyor:** bilinmeyen yolu açık sayan ekip, telsizle erken
   yön değiştirip daha kötü bir koridora sapabiliyor. R2 sentetikte 10 tohumun 1'inde, EMSR
   katı kuralda 1'inde R0'dan yavaş; EMSR orta/gevşekte hiç. Ortalama R2 − R0: sentetik
   −142,5 ± 149,0, EMSR gevşek −370,4 ± 364,7, katı +2,1 ± 6,7 dk. R1 hiçbir tohumda R0'dan
   yavaş değil.
5. **Kafile kuralı önemli:** kuralsız (R2e) sentetikte R2'nin R0'a karşı kazancının yarısı
   kayboluyor (−77,4'e karşı −142,5 dk); drone sahnelerinde R2e neredeyse R0'ın aynısı
   (EMSR'de 10/10, sentetikte 9/10 tohumda eşit — aynı karargâhtan çıkan ekipler hep birlikte
   keşfediyor). v2 EMSR koşularında R2 ile R2e arasında fark yok.
6. **Drone sahneleri:** EMSR'li K-D1'de paylaşım belirleyici (R0 58,7 → R2 36,7 dk, kalan pay
   %47); model koşularında referanslar R0'dan farksız (J-30: bu koşular modelin hatasını
   zaten ölçmüyor).

**Yapılacak (makale).** Tablo 16'nın R1/R2 satırları (isteğe bağlı R1+R2) 10 tohum
ortalamasıyla doldurulmalı; Bölüm 3.8'deki R1/R2 tanımlarına uygulama kararları eklenmeli
(yol boyunca 100 m görüş, durak başına ceza, kafile kuralı, telsizle öğrenilen kapanmanın
cezasız olması); sınırlılık (b)'deki "R1 ve R2 koşulmamıştır" cümlesi kaldırılmalı; bulgu 3
(sayım kuralı) ve 4 (paylaşım paradoksu) açıkça yazılmalı.

---

## J-30 🟠 Model kapanma koşuları algılama hatasını ölçmüyor — klasik ajan modelin kapanmalarını "gerçek" sayıyor
**Durum:** KAPALI (16 Eylül 2026) — deney kuruldu ve koşuldu; sonuç aşağıda ("Çözüm"). Tablo 18 verisi hazır, makaleye işlenmeli · **Bulundu:** 16 Eylül 2026 · **İlgili:** M-20, M-23, J-25, J-26, J-29

`/api/road_damage/naive_compare`, gerçek kapalı kenar kümesi olarak oturumun **kendi**
kapanmalarını kullanıyor (`simulate_naive_agent(G, real_closed_edges, …)`). Model
koşularında bu küme SegFormer'ın çıktısı; yani hem QuakeMind hem klasik ekip "model
haklı" varsayımıyla değerlendiriliyor. **Yanlış alarm** (açık yolu kapalı sanıp gereksiz
dolanma) ve **kaçırma** (kapalı yolu açık sanıp QuakeMind ekibinin de U-dönüşü yapması)
hiç ölçülmüyor. J-25 ve J-29'daki model satırları bu yüzden "modelin kapanmaları doğru
olsaydı bilgi ne kazandırırdı" sorusunu yanıtlar; M-20'nin sorusunu (bölütleme kalitesinin
operasyonel etkisi) yanıtlamaz. Aynı durum sentetik koşular için de geçerli ama orada
kasıtlı (kusursuz bilgi referansı R3, makale Bölüm 3.8).

**Önerilen tasarım.** Planlayıcı modelin kapanmalarını bilir, dünya EMSR648 kapanmalarıdır.
`simulate_naive_agent`'a bir başlangıç bilgisi (`prior_closed`) eklenirse tek fonksiyonla
üç ajan kurulur: R0 (başlangıç bilgisi boş), model-bilgili (model kapanmaları), R3/kâhin
(EMSR kapanmaları). Üçü de EMSR kümesinde yürür; model-bilgili ajanın U-dönüşleri
kaçırmaları, R3'e göre fazladan yolu yanlış alarmları ölçer.

**Kısıtlar.** Drone sahnelerinde EMSR yol hasarı yalnız K-D1'de var (H-D1 ve H-D2'de %0)
→ anlamlı test şimdilik tek sahne. v2 ilçeleri için model maskesi üretilmedi (Colab
defterinde isteğe bağlı z=18 adımı var; J-20). EMSR648 de geçilebilirlik değil hasar
derecesi veriyor (J-28, M-26) — "dünya" olarak kullanılması da bir varsayım.

**Çözüm (16 Eylül 2026).** `benchmark/model_in_real_world.py` (backend gerektirmez).
Dünya = EMSR648 gevşek kural, tampon 8 m. Aynı dünyada üç ekip türü yürür (hepsi kapalı
kenara girmez, kavşakta öğrenir, keşif başına t_u = 20 dk):
**R3** yola EMSR kapanmalarını bilerek çıkar; **model-bilgili QuakeMind** yola SegFormer'ın
kapanmalarını bilerek çıkar (yanlış alarmları sorgulamaz, kaçırdığı gerçek kapanmaya varınca
keşfeder); **R0** hiçbir bilgiyle çıkmaz. Yanlış alarmlar hedefi bağlantısız bırakırsa
("rota bulunamadı") ekip modeli bırakıp R0 gibi devam eder — sayısı ayrıca raporlanır.
Model kapanmaları canlı sistemle aynı kuralla (`closures_from_damage_mask`) hazır
maskelerden, 3 zoom (18/19/20) × 5 r_h (0/5/10/15/25 m) = 15 ayarla üretildi; ayrıca
yumuşak kullanım (kenar silinmez, uzunluğu ×3 / ×10) = 30 ayar daha. Görevler:
`runs/multi_seed/drone-emsr-loose-s42…51` atamaları (3 sahne × 3 görev × 10 tohum = 90).
Kod: `simulate_reference_fleet(..., prior_closed, prior_fallback, prior_penalty_factor)`.
Çıktı: `runs/model_gercek_dunya/tablo18.md`, `summary.json`.

**Doğrulama.** R0 = önceki koşuların naive_compare sonucu **90/90** görev birebir; R3
mesafesi = QuakeMind'ın A* rotası (en büyük fark **0,00 m**); EMSR ve model kapanma
sayıları önceki koşularla aynı (0 uyuşmazlık); yeni yol bulucu ↔ görünümlü yol bulucu
tüm varyantlarda birebir.

**Tablo 18 (sert kullanım = bugünkü sistem; kesim düzeyi, 3 sahne toplamı; süre görev başına, 10 tohum):**

| Kaynak | IoU | Duyarlılık | Kesinlik | Kaçırılan | Yanlış | Ort. ulaşım süresi (dk) | Model rota bulamadı (9 görevde) | Keşif / tohum | R0→R3 kazancının yakalanan payı |
|---|---|---|---|---|---|---|---|---|---|
| R3 — kusursuz bilgi | — | — | — | 0 | 0 | **2,05 ± 0,15** | 0 | 0 | %100 |
| SegFormer z18, r_h 0 (uygulama) | 0,019 | 0,021 | 0,167 | 47 | 5 | 6,52 ± 1,92 | 0 | 2,0 | %0 |
| SegFormer z18, r_h 15 | 0,029 | 0,062 | 0,051 | 45 | 56 | 6,97 ± 2,15 | 6,1 | 2,2 | **%−11** |
| SegFormer z19, r_h 10 | 0,114 | 0,333 | 0,148 | 32 | 92 | 6,52 ± 1,92 | 8,7 | 2,0 | %0 |
| SegFormer z20, r_h 0 | 0,079 | 0,125 | 0,176 | 42 | 28 | 6,57 ± 1,92 | 0 | 2,0 | %−1 |
| SegFormer z20, r_h 25 | 0,100 | **0,917** | 0,101 | 4 | 390 | 6,52 ± 1,92 | **9,0** | 2,0 | %0 |
| R0 — naif ajan | — | 0 | — | 48 (tümü) | 0 | **6,52 ± 1,92** | 0 | 2,0 | %0 |

(15 ayarın tamamı `tablo18.md`'de.) Gerçek hasarlı tek sahne K-D1'de (197 kesimin 48'i
kapalı) görev başına R3 **2,46** dk, R0 **15,88** dk — kazanılabilecek süre büyük; H-D1 ve
H-D2'de EMSR hiç yol hasarı işaretlememiş (R0 = R3 = 1,84 dk), orada modelin her
kapanması yanlış alarm.

**Sonuç.**
1. **Bugünkü SegFormer kapanmalarıyla planlama, klasik ekipten hiçbir ayarda iyi değil**
   (15 sert ayarda yakalanan pay %0 ile %−11 arası). İki başarısızlık biçimi var:
   küçük r_h'de model gerçek kapanmaların çoğunu **kaçırıyor** (duyarlılık ≤ 0,13 → aynı
   keşifler); r_h büyüdükçe duyarlılık 0,92'ye çıkıyor ama kesinlik ~0,10'da kalıyor ve
   **yanlış alarmlar hedefleri ağdan koparıyor** (9 görevin 9'unda "rota bulunamadı" → ekip
   modeli bırakıyor → R0).
2. **Yumuşak kullanım da tutarlı kazanç vermiyor:** 30 ayarın 2'si (z19/15 m ×3, z20/25 m ×3)
   %18 ± 23 yakalıyor; diğer 28 ayar %+2 ile %−26 arasında, bu iki ayarın komşuları bile
   %−12 ile %+2 arasında. En iyi ayarı seçip raporlamak çoklu karşılaştırma hatası olur.
3. **Makalenin hipotezi (Bölüm 4.7, "duyarlılık kesinlikten belirleyici") bu düzende
   desteklenmiyor:** duyarlılığı 0,92'ye çıkarmak kazanç getirmedi, çünkü kesinlik düşük
   kaldıkça yanlış alarmlar ağı kilitledi. Makalenin öngördüğü alternatif —
   kapanmaların **ağ topolojisindeki konumu** sayılarından belirleyici — veriyle uyumlu.
4. Bu sonuç J-25/J-26 ile tutarlı ve Tablo 18'in SegFormer satırı için **olumsuz sonuç**
   olarak raporlanmalı; algılama katmanı (alan kayması, KATE-CD eğitimi) iyileşmeden model
   tabanlı kazanç iddia edilemez.

**Kısıtlar (makaleye yazılmalı).** Yalnız SegFormer (diğer beş model eğitilmedi); 3 küçük
drone sahnesi (~200 kesim), gerçek hasar yalnız K-D1'de (sürenin farkını K-D1'in 3 görevi
belirliyor); IoU/duyarlılık/kesinlik **kesim düzeyinde**, piksel IoU_hasar değil; dünya
EMSR648 gevşek kural (hasar derecesi = geçilemezlik varsayımı); "rota bulunamadı"
durumunda R0'a dönme bir tasarım seçimi (alternatifi görevi ulaşılamaz saymak).

---

## J-28 🔴 Eşleştirilmiş deney: kapanma kaynağına göre sistem kazancı (sentetik / EMSR648 / model)
**Durum:** AÇIK — sonuçlar makaleye işlenmeli; tek tohum, **10 tohumlu sürümü J-29'da** · **Bulundu:** 16 Eylül 2026 · **İlgili:** E-01, E-02, M-20, M-26, J-29

**Tasarım.** Aynı afetzede, ekip, karargâh, rota motoru, atama, BERTurk, YOLOv8
ve naif ajan; değişen **yalnız hangi yolların kapalı olduğu**. Tohum 42.
Karşılaştırma `benchmark/compare_closure_sources.py` ile **aynı küme** (naif
ajanın da ulaşabildiği atamalar) üzerinden yapılır ve kazanç iki bileşene
ayrılır: gerçek yol farkı + U-dönüşü ceza varsayımı (E-02). Koşular:
`benchmark/runs/{v2-*, drone-*}`, tablo `runs/closure_source_comparison.json`.

**Senaryo v2 — EMSR kapsamındaki 4 ilçe (H-Z1, H-Z3, K-Z1, K-Z2; 13 afetzede):**

| Kapanma kaynağı | Rotalanan | QuakeMind | Klasik | Kazanç | yol farkı | U-dönüşü | U-dönüşü payı |
|---|---|---|---|---|---|---|---|
| Sentetik (%18 istenen) | 13/13 | 180,3 dk | 1 600,3 dk | 1 420,0 | 60,0 | 1 360,0 | %96 |
| **EMSR648 katı** (Destroyed) | 13/13 | 177,6 | 238,0 | 60,4 | 0,4 | 60,0 | %99 |
| **EMSR648 orta** (+ Damaged) | 13/13 | 189,1 | 1 924,7 | 1 735,6 | 75,6 | 1 660,0 | %96 |
| **EMSR648 gevşek** (+ Possibly) | 13/13 | 189,5 | 2 006,7 | **1 817,2** | **77,2** | 1 740,0 | %96 |

**Senaryo v2 — 8 ilçe, sentetik (yeni taban, Göksun çıkarılmış):**
QuakeMind 222,2 dk · Klasik 1 744,8 dk · kazanç 1 522,6 dk (yol 62,6 + U-dönüşü 1 460,0).
Hatay yarısı referansla **birebir aynı** (98,5 / 650,0 dk). Makaledeki 206,6 /
1 641,0 dk bu değerlerle değişmeli (Maraş'taki değişiklik Göksun'un
çıkarılmasından ve HQ-K1'in taşınmasından).

**Drone sahneleri (H-D1, H-D2, K-D1; 9 afetzede):**

| Kapanma kaynağı | Rotalanan | QuakeMind | Klasik | Kazanç |
|---|---|---|---|---|
| Sentetik | 9/9 | 20,4 | 161,8 | 141,4 (U-dönüşü %99) |
| EMSR648 gevşek | 9/9 | 20,7 | 60,9 | 40,2 (U-dönüşü %100) |
| Model z=18, r_h=0 (uygulama kuralı) | 9/9 | 19,5 | 19,5 | 0 |
| Model z=19, r_h=15 | **1/9** | — | — | ağ parçalanıyor (J-25) |

**Yorum.**
1. **Gerçek hasarla (EMSR648) sistem kazancı var ve sentetiğe benzer büyüklükte**
   (gevşek/orta kurallarda sentetikten de büyük — gerçek hasar Maraş merkezinin
   ana eksenlerinde toplanmış). Bu, makalenin sistem iddiasını gerçek veriye
   dayandırmayı mümkün kılıyor.
2. **Ama kazancın %96–100'ü U-dönüşü ceza varsayımından geliyor** (keşif başına
   20 dk). Yalnız gerçek yol farkından gelen kazanç 4 ilçede **77,2 dk**.
   Makale iki bileşeni ayrı raporlamalı; t_u duyarlılığı (Tablo 17) bu yüzden kritik.
3. **Geçilebilirlik kuralı sonucu belirliyor** (M-26 / Tablo 19): katı kuralda
   kazanç 60 dk, orta/gevşekte ~1 700–1 800 dk. EMSR "Damaged" dereceli yolun
   gerçekten kapalı olup olmadığı bir varsayım; makalede açıkça yazılmalı.
4. **Model koşulu darboğazı gösteriyor:** SegFormer'ın bugünkü kapanmaları ya
   rotaları hiç etkilemiyor (uygulama kuralı) ya da ağı kilitliyor (yarıçap
   kuralı). Algılama katmanı iyileşmeden model tabanlı kapanmayla kazanç iddia
   edilemez (J-25, J-26).

**Dürüst kayıtlar.** Tek tohum; 13 + 9 afetzede (E-06). Drone sahnelerinde
afetzedeler arası 700 m ayrım sağlanamıyor. EMSR AOI dışındaki ~%6 kenar açık
kabul edildi. `--zones` süzgeci rastgele sayı dizisini değiştirdiği için 4 ilçe
koşularının bölge sonuçları 8 ilçe koşusunun aynı bölgeleriyle birebir
karşılaştırılmamalı (4 ilçe koşuları kendi aralarında eşleştirilmiş).

---

## J-25 🔴 Model kapanmaları drone sahnelerinde yol ağını kilitliyor
**Durum:** AÇIK · **Bulundu:** 16 Eylül 2026 · **İlgili:** J-22, J-26

**Bağlam.** Kullanıcının modeli uygulamada test ettiği üç Help.NGO drone sahnesi
(9 Şubat 2023, 3,4–3,9 cm/px) için ayrı bir senaryo kuruldu
(`benchmark/scenario_dataset_drone.py`: H-D1 Defne–Elektrik Mah., H-D2 Defne–
Turunçlu/Akdeniz/Armutlu, K-D1 Maraş–12 Şubat Stadyumu; 9 afetzede / 9 ekip /
3 karargâh). Yol grafikleri H-Z1 ve K-Z1'in önbellekteki 3 km yaya grafiğinin
sahne kutusuna kırpılmış hâli (`benchmark/warm_drone_scene_cache.py`) —
Overpass'a gidilmiyor.

**Ölçüm** (`runs/drone-model-z19-r15-*`, tohum 42, z=19, r_h=15):

| Sahne | Kapalı kenar | Görülen kenar | Rotalanan atama |
|---|---|---|---|
| H-D1 | 98 / 382 (%25,7) | %69 | **0 / 3** |
| H-D2 | 80 / 442 (%18,1) | %71 | **0 / 3** |
| K-D1 | 118 / 394 (%29,9) | %87 | **1 / 3** |

Olay günlüğü: 9 afetzedenin 8'i için `victim_point_unreachable` (12 deneme) —
karargâhın giriş yolu kesiliyor, karargâhtan ulaşılabilir nokta kalmıyor.
Aynı tohumla **sentetik** (%18) koşuda (`runs/drone-sentetik-r018-*`) 9/9 atama
rotalanıyor (Hatay 12,0 / 153,3 dk; Maraş 8,2 / 8,2 dk).

EMSR648'e göre gerçek yol hasarı: H-D1 %0, H-D2 %0, K-D1 %30. Model Antakya
sahnelerinde hiç hasar yokken yolların beşte birini kapatıyor; K-D1'de oran
tutuyor ama çoğunlukla **farklı** yolları kapatıyor (J-26).

**Sonuç.** Altyapı gerçek yerde, gerçek görüntüyle uçtan uca çalışıyor; fakat
modelin bugünkü kapanma tahminleri küçük mahalle ağlarını parçalıyor ve
simülasyon anlamlı rota verisi üretemiyor. Bu bir **model kalitesi** sorunu.

---

## J-26 🔴 Model–EMSR648 doğrulaması: yüksek zoom daha çok hasar buluyor ama daha çok uyduruyor
**Durum:** AÇIK · **Bulundu:** 16 Eylül 2026 · **İlgili:** M-20 (Tablo 18), J-22, A-01

**Yöntem.** `benchmark/validate_model_masks.py`. Bina düzeyi: EMSR648 binası
görülen alandaysa, poligon içinde (Hatay, `builtUpA`) ya da noktanın 10 m
çevresinde (Maraş, `builtUpP`) hasar pikseli varsa "model hasarlı dedi".
Yol düzeyi: EMSR yol çizgisi ~2 m arayla örneklenir; r_h ile genişletilmiş
maskeye düşen nokta varsa "model kapalı dedi" — canlı sistemle aynı kural,
EMSR'in kendi geometrisine uygulanmış. Hasarlı dereceler: Destroyed / Damaged /
Possibly damaged. Sonuçlar: `benchmark/data/model_masks/validation_drone.json`.

**Bina düzeyi (sahne bazında):**

| | z=18 (48 cm/px) | z=19 (24 cm/px) | z=20 (12 cm/px) |
|---|---|---|---|
| K-D1 (ağır hasar): duyarlılık / kesinlik | %3,7 / %100 | %19,5 / %100 | **%33,3 / %96** |
| H-D1 (hafif): yanlış alarm | 2 / 39 | 9 / 39 | **22 / 38** |
| H-D2 (hasarsız): yanlış alarm | 5 / 22 | 7 / 22 | **14 / 22** |

**Üç sahne toplamı (mikro):**

| | Bina F1 | Bina özgüllük | Yol en iyi dengeli doğruluk |
|---|---|---|---|
| z=18 | 8,4 | %89 | %57,0 (r_h=25) |
| z=19 | 27,6 | %75 | **%59,1 (r_h=15)** |
| z=20 | 37,8 | **%41** | %53,3 (r_h=10) |

Yol düzeyinde kesinlik tüm yapılandırmalarda **%14–20**: modelin kapattığı
yolların ~%80'i EMSR'e göre açık.

**Yorum.**
1. Zoom arttıkça model gerçek hasarı daha iyi buluyor (K-D1 bina F1: 7 → 33 → 50),
   ama hasarsız binaları da giderek daha çok hasarlı sayıyor (H-D2'de z=20'de
   22 binanın 14'ü). **En yüksek zoom en iyi sonuç değil**; yol kararı için en
   iyi denge z=19'da ve o da şansa (%50) yakın.
2. Olası sebep **alan kayması**: model KATE-CD ile (Maxar/Pléiades, 0,3–0,5 m/px)
   eğitildi; drone görüntüsünde nesneler eğitimdekinden 2–15 kat büyük.
   Göz kontrolü (K-D1 z=19 önizleme) bunu destekliyor: geniş bitişik moloz
   alanlarının çoğu kaçırılıyor, sağlam çatıların üstünde dağınık küçük
   "hasar" lekeleri var.
3. Eğilim, z=21–22'nin (Colab) daha da fazla yanlış alarm üreteceğini gösteriyor.

**Dürüst kayıtlar.** (a) Örneklem küçük: 146 bina, 152 yol, 3 sahne.
(b) EMSR648 uydu görüntüsünden (~50 cm) yorumlandı; 3 cm'lik drone görüntüsünde
modelin gördüğü bazı "yanlış alarmlar" EMSR'in göremediği moloz olabilir —
elimizdeki veriyle ayrıştırılamaz. (c) Parametreler (zoom, r_h) bu üç sahnede
seçilirse, aynı sahnelerde raporlanan başarım iyimser olur; makalede ayrı bir
test kümesi ya da bu kaydın açıkça yazılması gerekir.

**Ek ölçüm — uygulamanın her zamanki kuralı (r_h = 0), üç sahne toplamı:**

| | Yol kesinlik | Yol duyarlılık | Yol özgüllük | Dengeli doğruluk |
|---|---|---|---|---|
| z=18, r_h=0 | %14,3 | **%4,5** | **%95,4** | %50,0 |
| z=19, r_h=0 | %8,3 | %9,1 | %83,1 | %46,1 |
| z=20, r_h=0 | %13,3 | %27,3 | %70,0 | %48,6 |

Eski kural **temkinli**: sağlam yolların %95'ini açık bırakıyor (bu yüzden
uygulamada hasarsız bölgelerde "doğru" görünüyor), ama ağır hasarlı K-D1'de
EMSR'in işaretlediği 22 hasarlı yoldan **yalnız 1'ini** kapatıyor. Dengeli
doğruluk %50 — şans düzeyi. Yani ne eski ne yeni kural, bu modelle drone
görüntüsünde yol kapanmasını güvenilir biçimde tahmin etmiyor.

---

## J-27 ⚪ (bilgi) Drone sahnelerinin gerçek en yüksek zoom'u z=22
**Durum:** KAPALI — bilgi kaydı · **Bulundu:** 16 Eylül 2026

OpenAerialMap karo sunucusu üç sahnede z=24'e kadar dolu karo döndürüyor, ama
sahnelerin doğal çözünürlüğü 3,4–3,9 cm/px; bu **z=22'ye (3,0 cm/px)** karşılık
geliyor. z=23–24 yeni bilgi katmadan yalnız büyütüyor. CPU maliyeti (yama başına
~1,3–1,8 sn ölçüldü): üç sahne toplamı z=20 ~20 dk, z=21 ~70–95 dk, z=22 ~5–6 saat;
z=22'de tek sahne ~370 MP ve ~9 GB RAM ister — bu yüzden Colab'a bırakıldı.

---

## J-19 🔴 Kapanma kuralı yolun MERKEZ ÇİZGİSİ pikselini istiyor — model kaynaklı kapanma üretilemiyor
**Durum:** KAPALI (16 Eylül 2026) — kalibrasyon J-22'de açık

**Sorun.** Model tabanlı kapanma yolu şöyle çalışıyor:
`inference.py:171` → `intersection = cv2.bitwise_and(pred_mask_binary, road_mask_binary)`,
ardından `network.py:analyze_road_network_graph` her kenar boyunca nokta örnekleyip
`blockage_mask[py, px] > 0` diye bakıyor. Yani bir yolun kapalı sayılması için
modelin hasarı **yolun çizilmiş merkez çizgisinin üstünde** tespit etmesi gerekiyor.

Gerçekte baskın kapanma mekanizması bu değil: **yanındaki bina çöküp molozu
sokağa döküyor.** Yolun kendi yüzeyinde hasar nadir. OSM merkez çizgisi 1-2
piksel genişliğinde olduğu için kesişim pratikte hep boş çıkıyor.

**Ölçüm (Antakya, Maxar Open Data 2023-02-11, gerçek deprem sonrası görüntü):**

| | z=16 · 1,93 m/px | z=18 · 0,48 m/px |
|---|---|---|
| Görüntü | 1 280 px | 2 048 px |
| `damageRate` | 0,0005 | **0,0126** (25 kat) |
| **`blockedRoads`** | **0** | **0** |
| Çıkarım süresi | 94,9 sn | **306,8 sn** |

Yani çözünürlük düzeltilse bile (model 25 kat daha fazla hasar buluyor)
**kapanma sayısı sıfır kalıyor**. `simulate_random_closures`'ın (E-01/J-12)
var olma sebebi büyük olasılıkla budur: bu duvara çarpılıp rastgele kapanmaya
dönülmüş.

**Yapılacak.** Kapanma ölçütünü "yol pikselinde hasar" yerine **"yola r metre
içinde hasar"** yap. Mekanizma zaten var ve çalışıyor:
`apply_risk_penalties`'in `blockage_hard_radius_m = 25` sert-kapatma yarıçapı
(J-08'de vektörize edildi, 40× hızlandı). Eksik olan, bu kuralı `/analyze`
boru hattına da bağlamak. Makaledeki `r_h` = 25 m parametresi zaten bunu
tarif ediyor.

**Kapandı.** Kapanma kuralına yarıçap eklendi:

- `network.py`: yeni `dilate_mask_by_metres()` — hasar maskesini metre
  cinsinden bir daireyle genişletir; metre→piksel dönüşümü görüntünün kendi
  sınırlarından hesaplanır, zoom'dan bağımsızdır (birim kontrolü: 0,48 m/px'te
  5 m → 10 px, 25 m → 52 px).
- `analyze_road_network_graph(..., blockage_radius_m=0.0)` — varsayılan 0,
  yani `main.py` / `apps/road_damage/app.py` (Streamlit) **değişmedi**.
- `worker.py`: yarıçap > 0 iken grafa `intersection` (yalnız yol üstündeki
  hasar) yerine **tüm** hasar maskesi (`pred_mask_binary`) gidiyor.
- `RoadDamageRequest.blockageRadiusM` (varsayılan 25,0 = makaledeki r_h) —
  istek başına ayarlanabilir; M-26 duyarlılık taraması bununla yapılabilir.
- Sonuca `blockageRadiusM` ve `closureRule` (`"radius"` / `"on_road_pixel"`)
  yazılıyor: aynı görüntü farklı r_h ile çok farklı sayıda kapanma verdiği için
  sonuç bu bilgi olmadan yorumlanamaz.

**Doğrulama.**

1. *Teşhis:* z=18 çıktısında model **52 641 piksel** (%1,26) hasar buldu;
   bunların **yol rasterının üstüne düşeni: 0**. Eski kuralın hep sıfır
   vermesinin sebebi tam olarak bu.
2. *Yeni kural, gerçek model çıktısı üzerinde:* aynı maskeyle r_h = 5 / 10 /
   15 / 25 / 50 m → 30 / 46 / 76 / 100 / 188 kapalı kenar (389 kenardan).
   Kapanmalar artık **modelden** geliyor. Tablo J-22'de.
3. *Canlı `/analyze` boru hattı:* r_h=0 ve r_h=25 iki ayrı istek; çıktıda
   `closureRule` sırasıyla `"on_road_pixel"` ve `"radius"`, `blockageRadiusM`
   0,0 ve 25,0 — parametre istekten işçiye, oradan sonuca doğru akıyor.
4. *Canlı = çevrimdışı:* canlı z=16 sonucunun hasar maskesi çevrimdışı aynı
   fonksiyona verildi — **birebir aynı sonuç** (3 924 kenar, 0 kapalı).
   Bağlantıda hata yok.

**Dürüst kayıt.** z=16'da (1,93 m/px) yeni kural bile **0** kapanma verdi:
model o çözünürlükte yalnız 779 piksel hasar görüyor ve bunlar sürülebilir yol
kenarlarının 25 m'sine düşmüyor. Yani J-19 tek başına yetmiyor — **J-20
(çözünürlük) çözülmeden senaryo ölçeğinde model tabanlı kapanma çıkmaz.**
Ayrıca r_h = 25 m gerçeğin ~8 katı kapanma üretiyor — **J-22**.

**Not.** Projede `pytest` kurulu değil; `tests/test_road_damage_api.py`
koşturulamadı. Etkilenen yollar eski/yeni karşılaştırmalı testlerle doğrudan
doğrulandı (J-05, J-08).

**16 Eylül 2026 — varsayılan GERİ ALINDI.** `blockageRadiusM` varsayılanı 25'ten
**0'a** (uygulamanın her zamanki kuralı) çekildi. Sebep: web uygulaması bu alanı
göndermiyor; varsayılanı 25 yapmak, uygulamanın yol hasarı sonuçlarını
kullanıcıya sorulmadan değiştirmişti. r_h=0 yolu (maske = hasar ∩ yol maskesi,
aynı örnekleme) değişiklik öncesiyle birebir aynı çalışıyor; yarıçap kuralı
yalnızca açıkça istenirse kullanılıyor. `/closures_from_mask` (araştırma ucu)
ve `full_scenario.py --blockage-radius-m` kendi parametrelerini açıkça taşıyor.

---

## J-20 🟠 Senaryo modele Maxar'ın sekizde bir çözünürlüğünü veriyor
**Durum:** DEVAM EDİYOR (16 Eylül 2026) · **Bulundu:** 16 Eylül 2026

**Sorun.** `tiling.py:zoom_for_radius` çıkarım maliyetini sabit tutmak için
yarıçap büyüdükçe zoom'u düşürüyor. Senaryo `radiusKm = 3.0` kullanıyor:

| Yarıçap | Zoom | Çözünürlük |
|---|---|---|
| **3,0 km (senaryo)** | z=15 | **3,86 m/piksel** |
| 1,0 km | z=16 | 1,93 m/piksel |
| 0,3 km | z=18 | 0,48 m/piksel |

Maxar Open Data doğal çözünürlüğü **0,3–0,5 m/piksel**. Senaryo, kaynaktaki
çözünürlüğün ~1/8'ini (alan olarak ~1/64) modele veriyor. 3,86 m/pikselde
çökmüş bir bina 2-3 piksel, yoldaki moloz piksel altı.

**Ölçülen etki:** aynı konum ve aynı modelde z=16 → z=18 geçişi `damageRate`'i
**25 kat** artırdı (0,0005 → 0,0126).

**Çatışma.** Çözünürlüğü artırmanın bedeli ağır: r=0,3 km'de z=18 çıkarımı
**306,8 sn** sürdü (49 yama). Alan r² ile büyüdüğü için r=3,0 km'de z=18
yaklaşık **100 kat** alan = binlerce yama demek — bu makinede (GPU yok,
bkz. J-15) bölge başına saatler eder. Dokuz bölge pratikte imkânsız.

**Seçenekler.** (a) bölge yarıçapını küçült; (b) çıkarımı Colab/GPU'ya taşı
(model eğitimi zaten orada); (c) yalnız yol çevresindeki karoları işle
(karo düzeyinde ön filtre); (d) makalede mevcut çözünürlüğü ve sonucunu
açıkça raporla.


**Uygulanan çözüm yolu (GPU yok → Colab).** `benchmark/colab/make_model_masks.py`
bölge/sahne için OpenAerialMap karolarını istenen zoom'da indirip mozaikler,
backend'in **kendi** `run_inference`'ıyla hasar maskesi üretir; model ağırlığı
SHA-256 ile doğrulanır (`7d7fb8d8…`), farklıysa durur. Çıktı:
`damage_mask.png`, `valid_mask.png` (gerçekten görülen pikseller),
`preview.jpg`, `meta.json` (sınırlar, zoom, sahneler, model izi, süreler).
`benchmark/colab/build_colab_notebook.py` bunları depodan **birebir** gömen
Colab defterini üretir; gömülü dosyaların parmak izleri Colab'da doğrulanır.
Colab kod yolu depo dışında taklit edilerek sınandı — yerel sonuçla aynı çıktı.

**Durum.** Drone sahneleri (J-25) için z=18/19/20 yerelde üretildi (CPU, yama
başına ~1,3-1,8 sn; en büyük sahne z=20'de 548 sn). z=21 ve z=22 Colab defterinde
hazır, kullanıcı çalıştıracak. **Ancak J-26'daki eğilim, daha yüksek zoom'un
sonucu iyileştirmeyeceğini gösteriyor.**

---

## J-21 🟡 Esri Wayback'te Antakya'nın deprem sonrası görüntüsü YOK
**Durum:** AÇIK · **Bulundu:** 16 Eylül 2026

**Ölçüm.** Wayback'in 196 sürümü tarandı. Antakya merkezinin z=17 karosu
(x=78701, y=51378) için:

| Sürüm | Tarih | sha1 |
|---|---|---|
| 11475 | 2023-01-11 (deprem **öncesi**) | `fa0263438072c2f8` |
| 57965 | 2023-02-23 (deprem sonrası olmalıydı) | `fa0263438072c2f8` — **birebir aynı** |
| 44873 | 2023-03-15 | farklı, ama gözle bakıldı: binalar hâlâ ayakta, deprem izi yok |

Yani "2023-02-23" sürümü bu karoyu hiç güncellememiş. Wayback sürümleri
**karo bazlıdır**; listede sürümün görünmesi o karonun yenilendiği anlamına
gelmez.

**Sonuç:** deprem sonrası görüntü için Esri Wayback kullanılamaz.
**Maxar Open Data (OpenAerialMap) kullanılmalı** — D-01'in zaten söylediği şey.
Doğrulanan sahneler: `10300100E18CB600` (2023-02-11, Antakya'yı ortalıyor),
`10300100E3D52E00` (2023-02-22), `10300100E32F7A00` (2023-03-05). Gözle
doğrulandı: aynı karo, çökmüş binalar, moloz yığınları, yola birikmiş araçlar.
`/analyze` bunları `oamTileUrl` ile sorunsuz kullanıyor
(`satelliteSource: "OpenAerialMap (Event Specific)"`).

---

## J-01 🔴 `/api/road_damage/recent` her 20 saniyede tüm segment dizilerini yeniden gönderiyor
**Durum:** KAPALI (15 Eylül 2026) · **Bulundu:** 15 Eylül 2026

**Sorun.** `fastapi_app.py:1538` her çağrıda son 60 dakikadaki **tüm** analizlerin
`safeRoadSegments` + `blockedRoadSegments` dizilerini eksiksiz döndürüyor.
Frontend (`quakemind-web/src/app/command/map/page.tsx:48`, `ROAD_DAMAGE_POLL_MS = 20000`)
bunu 20 saniyede bir çekiyor ve **yalnızca kümenin değişip değişmediğine** bakıyor
(`if (changed)`), yani gelen verinin neredeyse tamamı atılıyor.

**Ölçüm.** Tek bölge = 39 285 kenar → 78 570 koordinat noktası → **2,10 MB JSON**
(`json.dumps` 0,066 s, `serialize_segments` 0,550 s). Dokuz bölgeli senaryoda
oturumda 9 analiz birikiyor → **her 20 saniyede ~19 MB** üretiliyor, serileştiriliyor,
ağdan geçiriliyor ve tarayıcıda ayrıştırılıyor. Serileştirme tek başına ~5 s CPU
demek ve bu süre boyunca GIL tutulduğu için **diğer tüm uç noktalar bekliyor** (bkz. J-07).

**Yapılacak.** `/recent` yalnız hafif özet döndürsün (`analysisId`, `createdAt`,
`bounds`, `segmentCount`); segmentler ayrı bir `/api/road_damage/segments/{analysisId}`
ucundan **analiz başına bir kez** çekilsin. Ek olarak `ETag`/`If-None-Match` ile
304 dönülebilir.

**Kapandi.** `/recent` artik yalnizca ozet doner
(`analysisId`, `createdAt`, `bounds`, `safeSegmentCount`, `blockedSegmentCount`);
agir diziler yeni `GET /api/road_damage/segments/{analysisId}` ucundan gelir ve
`ETag` + `Cache-Control: private, max-age=3600` tasir. Istemci tarafinda
`getRoadDamageSegments` (api.ts) ucus-halindeki istegi de paylasan kalici bir
onbellek tutar, yani bir analiz sekme omru boyunca bir kez cekilir.
Ayni degisiklige gore guncellenen uc tuketici: `command/map/page.tsx`,
`command/page.tsx`, `SafeEvacuationMap.tsx`. Python tarafinda `/recent`'i
kullanan tek script `benchmark/prepare_demo.py` yalnizca `len(analyses)`
okudugu icin etkilenmedi.

**Olculen sonuc (canli backend, Antakya r=3km):**

| | Once | Sonra |
|---|---|---|
| `/recent` yanit boyutu | 1 272 288 bayt (tek bolge) | **264 bayt** |
| `/recent` sure | ~0,4 sn | **0,0023 sn** |
| 20 sn'de bir, 9 bolge | ~19 MB | **~2,4 KB** |

Agir veri kaybolmadi, yalnizca yerini degistirdi: `/segments` 0,40 sn'de
1 272 288 bayt donuyor ve analiz basina **bir kez** cagriliyor.

---

## J-02 🔴 `simulate_naive_agent` döngünün içinde `G.copy()` yapıyor
**Durum:** KAPALI (15 Eylül 2026) · **Bulundu:** 15 Eylül 2026

**Sorun.** `apps/road_damage/utils/network.py`, `simulate_naive_agent` içindeki
keşif döngüsü her yinelemede `G_view = G.copy()` çağırıyor (en çok
`MAX_NAIVE_ITERATIONS = 60` kez, atama başına). `simulate_random_closures` içinde
**aynı hata zaten `nx.restricted_view` ile düzeltilmiş** ve koda "kopya almaya geri
dönülmemeli" uyarısı yazılmış — ama bu fonksiyon atlanmış.

**Ölçüm.** `G.copy()` = **0,91 s** (39 285 kenarlık MultiDiGraph); `nx.restricted_view`
= **0,0001 s**, yani ~9 000 kat. Mevcut koşumda 18 atama + 68 keşif ≈ 86 yineleme →
**~78 saniye saf kopyalama**. Hatay grafında (40 950 kenar) daha da fazla. Bellek
riski de aynı: Antakya grafında MemoryError'a düşüren desenin ta kendisi.

**Yapılacak.** `G_view = nx.restricted_view(G, [], known_closed)`. Davranış birebir
aynı (görünüm salt-okunur, döngü zaten yazmıyor).

**Kapandi.** `G.copy()` yerine `nx.restricted_view(G, [], known_closed)`.

**Esdegerlik dogrulandi:** eski davranis (G.copy) bagimsiz bir referans
uygulama olarak yeniden yazilip yenisiyle 6 farkli rota uzerinde
karsilastirildi -- `routeCoords` dahil **6/6 birebir ayni sonuc**
(basarili ve "yol bulunamadi" durumlarinin ikisi de kapsandi).

**Olculen sonuc** (18 004 dugum / 39 285 kenar, %2 kapanma, 6 rota):
toplam **19,59 sn -> 1,10 sn (18x)**. %10 kapanmada (daha cok kesif dongusu)
**56,07 sn -> 9,80 sn (6x)**. Canli backend'de `/naive_compare` 29 kesifli bir
rotayi 1,78 sn'de tamamliyor.

---

## J-03 🔴 NLP gecikmesinin %89'u Nominatim geocoding'i; önbellek yok
**Durum:** KAPALI (15 Eylül 2026) · **Bulundu:** 15 Eylül 2026

**Sorun.** `apps/disaster_nlp/src/ner_extraction.py:68` geocoding'i
`RateLimiter(min_delay_seconds=1.2)` ardına koyuyor ve `get_coordinates`
**aday × sorgu** iç içe döngüsüyle canlı `nominatim.openstreetmap.org`'a gidiyor.
Hiçbir önbellek yok — aynı metin ikinci kez gelse aynı bedel yeniden ödeniyor.

**Ölçüm** (metin: *"Hatay Antakya Cebrail mahallesi bina yıkıldı enkaz altında 3 kişi var acil yardım"*):

| Aşama | Süre |
|---|---|
| Zeyrek lemmatizasyon (sonucu kullanılmıyor, bkz. J-04) | 0,28 s |
| BERTurk sınıflandırma | 0,75 s |
| BERTurk NER | 0,81 s |
| **Nominatim geocoding** | **6,45 s** |
| **Uçtan uca `process_tweet`** | **7,28 s** |

`_build_queries` bu tek metinden **23 sorgu adayı** üretiyor. Yukarıdaki 6,45 s
*şanslı* durum (ikinci sorgu tutmuş); hiçbir sorgu tutmazsa 23 × 1,2 s ≈ **28 s**.
Ayrıca offline-first hedefiyle doğrudan çelişiyor: internet yoksa NLP konum
çıkaramıyor.

**Yapılacak.** (a) Sorgu → sonuç disk önbelleği. (b) Türkiye il/ilçe/mahalle
tablosundan **yerel** çözüm birinci sıraya, Nominatim yalnız son çare
(`tr_locations.py` zaten var). (c) Sorgu adayı sayısını 23'ten ~4'e indir.

**Kapandi.** Iki degisiklik:
1. **Kalici geocoding onbellegi** (`apps/disaster_nlp/data/geocode_cache.json`,
   .gitignore'a eklendi). Sorgu metnine gore anahtarlanir ve **basarisiz**
   sonuclari da saklar -- asil maliyet zaten tutmayan sorgulari taramaktir.
2. **Adaylar arasi dedupe:** `get_coordinates` ayni sorgu metnini farkli
   adaylar icin tekrar aga gondermiyor. Sonucu degistirmez: tutan bir sorgu
   zaten aninda donerdi, dolayisiyla atlanan her sorgu daha once basarisiz
   olmus bir sorgudur.

**Olculen sonuc.** Ayni metnin tekrari: **7,28 sn -> 0,55 sn**; canli
backend'de `/api/nlp/analyze` ikinci cagri **0,32 sn**. Cikti birebir ayni
(dogrulandi: `results[0] == results[2]`).

**Acik kalan kisim -> J-13.** Ilk (onbelleksiz) sorgu hala aga bagli; yerel
il/ilce/mahalle tablosundan cozum offline-first hedefi icin ayrica gerekli.

---

## J-04 🟠 `zemberek_lemmatize` çağrılıyor ama sonucu hiç kullanılmıyor
**Durum:** KAPALI (15 Eylül 2026) · **Bulundu:** 15 Eylül 2026

**Sorun.** `apps/disaster_nlp/src/pipeline.py:24` içinde
`lemmatized_text = zemberek_lemmatize(clean_tx_lower)` atanıyor; değişken
dosyanın hiçbir yerinde okunmuyor. Sınıflandırma `clean_tx_cased` ile,
NER de `clean_tx_cased` ile çalışıyor.

**Ölçüm.** İstek başına **0,28 s** tamamen boşa. Ayrıca Zeyrek her çağrıda
stdout'a onlarca `APPENDING RESULT: ...` satırı basıyor — log kirliliği ve
gereksiz I/O.

**Yapılacak.** Ya satırı kaldır, ya da lemmatize edilmiş metni gerçekten
sınıflandırıcıya ver. İkincisi **davranış değişikliğidir** ve makalede raporlanan
sınıflandırma skorlarını etkiler; bu yüzden güvenli olan satırı kaldırmaktır.

**Kapandi.** Olu cagri kaldirildi; ayrica `preprocessing.py`'de
`zeyrek.MorphAnalyzer()` modul yuklenirken degil **ilk gercek lemmatizasyon
cagrisinda** kuruluyor (lemmatizasyon su an hicbir yerde kullanilmadigi icin
pratikte hic kurulmuyor).

**Olculen yan kazanc:** `disaster_nlp` import suresi **60,8 sn -> 20,6 sn**.
Zeyrek'in her cagrida stdout'a bastigi `APPENDING RESULT` kirliligi de
ortadan kalkti.

---

## J-05 🟠 `calculate_route` her rotayı iki kez hesaplıyor, birini atıyor
**Durum:** KAPALI (15 Eylül 2026) · **Bulundu:** 15 Eylül 2026

**Sorun.** `network.py:calculate_route` hem `nx.shortest_path` (Dijkstra) hem
`nx.astar_path` çalıştırıyor. `/api/road_damage/route` yalnızca Dijkstra sonucunu
kullanıyor, A* sonucunu `_astar_coords` adıyla atıyor.

**Ölçüm.** Dijkstra 0,039 s · A* 0,013 s — yani **A\* üç kat hızlı** ve aynı yolu
buluyor (ikisi de 99 düğüm). Şu an rota başına 0,052 s ödeniyor, 0,013 s yeterdi.

**Yapılacak.** Tek algoritma. `/safe_route` ikisini bilinçli olarak karşılaştırdığı
için oradaki davranış korunmalı; `/route` için yalnız A* yeterli.

**Kapandi.** `calculate_route` artik `algorithms` parametresi
aliyor; `/route` yalnizca `('astar',)` gecer. `/safe_route` ikisini bilerek
karsilastirdigi icin varsayilan degismedi.

**Esdegerlik dogrulandi:** ayni rota icin Dijkstra ve A* maliyet farki
**0,000000 m** -- A*'in haversine sezgisi kabul edilebilir oldugu icin
optimalligi garantili, dolayisiyla `/route`'un dondurdugu mesafe degismez.

---

## J-06 🟠 `ox.distance.nearest_nodes` her çağrıda KD-ağacını sıfırdan kuruyor
**Durum:** KAPALI (15 Eylül 2026) · **Bulundu:** 15 Eylül 2026

**Sorun.** `calculate_route` ve `simulate_naive_agent`, başlangıç/bitiş düğümünü
bulmak için her seferinde `ox.distance.nearest_nodes(G, ...)` çağırıyor; osmnx bu
çağrıda grafın tüm düğümlerinden yeni bir dizi + KD-ağacı üretiyor.

**Ölçüm.** İlk çağrı 0,265 s, sonraki 0,088 s. Senaryo başına ~70 çağrı ≈ **6 s**.

**Yapılacak.** Graf başına bir kez `scipy.spatial.cKDTree` kur ve session'da sakla
(`road_damage_sessions[analysisId]["kdtree"]`).

**Kapandi.** `network.py`'ye onbellekli `nearest_node(G, lat, lon)`
eklendi; BallTree zayif referansli bir sozlukte (graf cop toplandiginda
kendiliginden dusen) graf basina **bir kez** kurulur. Metrik osmnx'in
projeksiyonsuz-graf yolunun birebir aynisi (radyan haversine BallTree).

**Esdegerlik dogrulandi:** 20 rastgele nokta, **20/20 ayni dugum**.
**Olculen sonuc:** 20 sorgu **1,918 sn -> 0,0035 sn (541x)**.

---

## J-07 🟠 Tüm uç noktalar senkron `def` — ağır iş GIL'i tutup her şeyi bekletiyor
**Durum:** AÇIK · **Bulundu:** 15 Eylül 2026

**Sorun.** `fastapi_app.py`'deki uç noktaların tamamı `def` (`async def` değil).
FastAPI bunları anyio iş parçacığı havuzunda koşturur; ancak NetworkX, JSON
serileştirme ve haversine döngüleri saf Python olduğu için **GIL'i bırakmaz**.
Sonuç: tek bir `/recent` (J-01) veya `/naive_compare` (J-02) çağrısı sürerken
`/api/sos/alerts`, `/api/team/claims`, `/api/chat/messages` gibi hafif pollingler
de kuyrukta bekliyor. Kullanıcının gördüğü "veriler geç geliyor" tablosunun
doğrudan sebebi budur.

**Yapılacak.** CPU-bağımlı uçları (rota, naif karşılaştırma, segment serileştirme)
`road_damage_pool` benzeri bir **ProcessPoolExecutor**'a taşı; hafif okuma uçlarını
`async def` yap. J-01 ve J-02 çözülünce bu maddenin aciliyeti düşer ama ortadan
kalkmaz.

---

## J-08 🟠 `apply_risk_penalties` O(kenar × hasar noktası) saf Python
**Durum:** KAPALI (15 Eylül 2026)

**Sorun.** `network.py:apply_risk_penalties` her kenar için **her** hasar noktasına
ve **her** kapanma noktasına tek tek `haversine` hesaplıyor.

**Ölçüm/projeksiyon.** Şu an hasar noktası sayısı düşük olduğu için gizli kalıyor.
EMSR648 bağlandığında (E-01) hasar noktası = 394 + 927 = 1 321 olacak →
39 285 × 1 321 ≈ **52 milyon** Python-seviyesi haversine → dakikalar mertebesi.
Yani bu madde **E-01 kapanır kapanmaz patlayacak** bir zaman bombası.

**Yapılacak.** Hasar noktalarından bir `cKDTree` kur, kenar orta noktaları için
toplu (vektörize) en-yakın-komşu sorgusu yap.

**Kapandı.** Mesafe araması vektörize edildi: kenar orta noktaları bir kez
hesaplanıp `numpy` dizisine alınıyor, hasar noktalarından ve kapanma
noktalarından birer `sklearn.neighbors.BallTree` (radyan haversine) kuruluyor
ve tüm kenarlar **tek toplu sorguda** işleniyor. Metrik `haversine()` ile aynı
küre yarıçapını (6 371 000 m) kullanır.

**Ölçüm — bu maddenin varlık sebebi olan gerçek yük ile.** Hasar noktaları
uydurma değil: EMSR648'in Hatay + Kahramanmaraş katmanının tamamı
(**1 321 hasarlı bina, 207 hasarlı yol segmenti**), en büyük bölge grafında
(20 643 düğüm / 49 666 kenar):

| | Süre |
|---|---|
| Eski (saf Python, O(kenar × nokta)) | **139,49 sn** |
| Yeni (BallTree, toplu sorgu) | **3,49 sn** |
| | **40× hızlı** |

Kaçınılan haversine çağrısı: **75 889 648**.

**Eşdeğerlik — bit düzeyinde aynı.** Eski davranış bağımsız bir referans
uygulama olarak yeniden yazılıp aynı graf ve aynı EMSR648 verisiyle
karşılaştırıldı:

- Sert kapatılan kenar kümesi **birebir aynı** (49 666 → 49 036, 630 kenar).
- `risk_cost` değeri farklı olan kenar sayısı: **0** (en büyük fark 0,00e+00).
  `risk_weight` basamaklı bir fonksiyon olduğu için asıl kritik nokta basamak
  seçimiydi; 49 036 kenarın tamamında aynı basamak seçildi.
- `risk_cost` tipi saf Python `float` — numpy skaleri JSON'a serileştirilemez
  ve bu değer `/safe_route`'un döndürdüğü `riskScore`'a kadar taşınıyor.
  Dönüşüm olmasaydı uç nokta 500 verirdi.

**Sınır durumları ayrıca sınandı:** hasar yok + kapanma yok (PostGIS kapalıyken
`/safe_route`'un fiili durumu) → ceza uygulanmıyor, `risk_cost == length`;
yalnız hasar; yalnız kapanma. Üçünde de atanmayan veya yanlış tipte değer yok.

**J-12/E-01 önündeki engel kalktı.** EMSR648 kapanma katmanı bağlandığında bu
fonksiyon artık dakikalar değil saniyeler sürüyor.

---

## J-09 🟡 `_nearest_graph_node` O(n) lineer tarama
**Durum:** AÇIK · **Bulundu:** 15 Eylül 2026

`apps/road_damage/utils/local_osm.py:_nearest_graph_node` tüm düğümleri Python
döngüsüyle tarıyor; `shortest_route_from_local_roads` bunu çağrı başına iki kez
çağırıyor. J-06 ile aynı çözüm (KD-ağacı).

---

## J-10 🟡 Soğuk başlangıç dakikalar sürüyor
**Durum:** KISMEN KAPALI (15 Eylül 2026)

**Ölçüm.** `import networkx + osmnx` = **31,0 s**; `disaster_nlp` zincirinin
(`torch` + `transformers` + `zeyrek`) import'u = **60,8 s**. Buna SegFormer
yüklemesi, CatBoost'un ilk istekte senkron eğitilmesi (`OPTIMIZASYON_ANALIZI.md`
madde 5 ve 15) ve Windows'ta ProcessPool worker doğuşu (~10–15 s) ekleniyor.

**Yapılacak.** Ağır import'ları gerçekten tembel yap (modül üstü değil fonksiyon
içi), CatBoost modelini diske persist et, ölçülen açılış süresini makalenin
donanım künyesine yaz (B-09).

**Kismen kapandi.** J-04 kapsaminda Zeyrek tembel hale getirildi:
`disaster_nlp` import suresi **60,8 sn -> 20,6 sn**. Geri kalan maddeler
(osmnx import'unun 31 sn'si, CatBoost'un diske persist edilmemesi, Windows
ProcessPool worker dogusu) hala acik.

---

## J-11 🟡 Harita sayfasında beş ayrı polling döngüsü
**Durum:** AÇIK · **Bulundu:** 15 Eylül 2026

`command/map/page.tsx` aynı anda beş `setInterval` çalıştırıyor (TEAM 2,5 s ·
SOS 6 s · NLP 6 s · DEBRIS 6 s · ROAD_DAMAGE 20 s), ayrıca Sidebar 8 s, chat 4 s,
bildirim 10 s. Dakikada ~50 HTTP isteği. J-07 ile birleşince backend'i sürekli
meşgul tutuyor.

**Yapılacak.** Tek bir `/api/live/state` birleşik ucu veya SSE/WebSocket ile
sunucu-itmeli akış. Kısa vadede: pollingleri tek bir zamanlayıcıda birleştir.

---

## J-12 🔴 Senaryo verisi gerçek değil — kapanmalar `rng.sample` ile rastgele
**Durum:** KAPALI (16 Eylül 2026) — kapsam dışı 4 ilçe için kısıt sürüyor · **Bulundu:** 15 Eylül 2026 · **Kök madde:** E-01 / C-01 / M-23

Bu madde E-01'in **sistem tarafındaki** yüzüdür ve burada tekrar kaydedilmiştir
çünkü performans işiyle **aynı dosyalara** dokunuyor (`network.py`,
`full_scenario.py`), dolayısıyla birlikte planlanmalıdır.

**Eldeki gerçek veri (doğrulandı, 15 Eylül 2026):**

| | Hatay (AOI11) | Kahramanmaraş (AOI04) |
|---|---|---|
| Kaynak paketi | `EMSR648_AOI11_GRA_MONIT01_r1_RTP01_v2` | `EMSR648_AOI04_GRA_MONIT01_r1_RTP01_v1` |
| Toplam yol segmenti | 4 613 | 7 843 |
| **Hasarlı yol segmenti** | **73** (tam çizgi geometrisi + `damageGrade`) | **134** |
| Toplam bina | 3 689 | 4 619 |
| **Hasarlı bina** | **394** (lat/lon + `damageGrade` + `objType`) | **927** |

Veri `benchmark/data/*_copernicus_ground_truth.json` içinde **ayrıştırılmış ve
kullanıma hazır**; `simulate_random_closures`'ın `rng.sample` satırının yerine
geçecek eşleme (EMSR çizgisi → OSM kenarı) yazılmamış durumda.

---

### J-12 ek bulgu — EMSR648 kapsama analizi (15 Eylül 2026, ölçülmüş)

**Erişim sorunu YOK — doğrulandı.** Paketler Copernicus EMS'in public S3'ünden
kayıt/giriş/token olmadan iniyor (`curl -I` → **HTTP 200**). Makalede kaynak
gösterimi: aktivasyon kimliği + AOI + geçiş + sürüm + teslim tarihi. Hakem aynı
dosyayı indirebilir. Sürümlü ve dondurulmuş olduğu için Google/Esri karolarının
aksine zamanla değişmez.

**EMSR648'de 20 AOI var.** Üçü daha indirildi (AOI08 Pazarcık, AOI18 Kırıkhan,
AOI20 Elbistan; toplam 3,7 MB). AOI18'in MONIT01 geçişi **yok** (HTTP 403),
yalnız PRODUCT var. İskenderun, Samandağ, Belen ve Göksun için bu aktivasyonda
**hiç AOI yok**.

**Ölçülen bölge kapsaması (3 km yarıçap içinde, hasarlı kayıt sayısı):**

| Bölge | AOI | Hasarlı **yol** | Hasarlı **bina** |
|---|---|---|---|
| H-Z1 Antakya–Defne | AOI11 MONIT01 | 30 | 112 |
| H-Z3 Kırıkhan | AOI18 **PRODUCT** | 16 (*hepsi yalnız "Possibly damaged"*) | 1 505 |
| K-Z1 Maraş Merkez | AOI04 MONIT01 | 119 | 744 |
| K-Z2 Elbistan | AOI20 MONIT01 | 26 | 289 |
| K-Z3 Pazarcık | AOI08 MONIT01 | **0** (*yol katmanının 424 kaydının tamamı "Not Analysed"*) | 79 |
| H-Z2 İskenderun · H-Z4 Samandağ · H-Z5 Belen · K-Z4 Göksun | **yok** | — | — |
| **TOPLAM** | | **191 (4 bölge)** | **2 729 (5 bölge)** |

**İki katmanın kapsaması FARKLI — bu ayrım makalede korunmalı:**

- **Yol kapanma katmanı** (`simulate_random_closures`'ın `rng.sample`'ının yerine
  geçecek olan): yalnız **4 bölgede** veri var. Pazarcık'ta yol katmanı hiç
  analiz edilmemiş; Kırıkhan'daki 16 kayıt en zayıf derecede ve PRODUCT
  geçişinden — kodun kendi notu PRODUCT'ın MONIT01'e göre çok fakir olduğunu
  söylüyor.
- **Hasar noktası katmanı** (λ(d) cezası + model doğrulaması): **5 bölgede**
  veri var ve zengin (2 729 kayıt).

**Açık kalan karar.** 9 bölgenin 4'ünde (İskenderun, Samandağ, Belen, Göksun)
ve yol katmanı bakımından 5'inde yer gerçeği yok. Seçenekler: (a) hibrit —
kapsanan bölgelerde gerçek, kalanlarda sentetik ve **açıkça etiketli**;
(b) senaryoyu kapsanan bölgelere indir (örneklem küçülür, E-06 ağırlaşır);
(c) bölge kümesini AOI'lere göre yeniden seç. Kullanıcı kararı bekleniyor.

---


### J-12 kapanış — EMSR648 kapanma katmanı bağlandı (16 Eylül 2026)

**Uygulama.**
- `apps/road_damage/utils/network.py` → `closures_from_lines()`: yer gerçeği
  hasarlı yol çizgilerini OSM grafına eşler. Bir kenar, boyunca ~2 m arayla
  alınan noktalarının **en az %50'si** hasarlı bir çizginin **8 m** yakınındaysa
  kapanır (kavşakta değen sokaklar kapanmaz). Tampon ölçüme dayanıyor: EMSR
  köşe noktalarının en yakın OSM kenarına medyan uzaklığı 0,1–2,2 m, %75'i 3–6 m.
- `benchmark/copernicus_ground_truth.py` → `damaged_road_lines()`,
  `road_grade_counts()`, `aoi_rings()`; üç geçilebilirlik kuralı
  (`strict` = Destroyed · `medium` = + Damaged · `loose` = + Possibly damaged).
- `POST /api/road_damage/closures_from_emsr` — `/simulate_closures` ile aynı
  yanıt ve oturum; `closureSource: "emsr648"`.
- `full_scenario.py --closure-source emsr --emsr-rule … --zones …`.
- Veri setlerinde bölge başına `emsrPackage`: H-Z1 (AOI11), H-Z3 (AOI18,
  yalnız PRODUCT), K-Z1 (AOI04), K-Z2 (AOI20); drone sahneleri H-D1/H-D2
  (AOI11), K-D1 (AOI04). H-Z2, H-Z4, H-Z5 için AOI yok; K-Z3'ün yol katmanı
  "Not Analysed".

**Göz kontrolü (K-D1):** kapatılan OSM kenarları EMSR "Damaged" çizgileriyle
örtüşüyor; birkaç EMSR çizgisinin OSM'de karşılığı yok (grafta o sokak yok ya
da 8 m'den fazla kayık) — onlar kapanmıyor.

**Kapsam kaydı:** 3 km'lik ilçe graflarında kenarların %92,7–94,4'ü EMSR AOI'si
içinde; kalan ~%6 hakkında yer gerçeği yok ve **açık kabul edildi**.

**Kapanma oranları (gevşek kural):** K-Z1 %1,80 (EMSR il geneli Maraş %1,71 ile
uyumlu) · H-Z1 %0,84 · K-Z2 %0,53 · H-Z3 %0,32 · K-D1 %24,4 · H-D1/H-D2 %0.

**Bulunan ve düzeltilen yerleşim hatası:** EMSR koşusunda HQ-K1 (Maraş) "ağdan
kopmuş" göründü — gerçek sebep, karargâh koordinatının grafta **12 m'lik çıkmaz
bir bağlantı yoluna** düşmesi ve o parçanın kapanmasıydı (ağın geri kalanı,
20 641 düğüm, açıktı). Tüm karargâhlar tarandı; çıkmaz düğüme düşen iki tane
(HQ-K1, HQ-HD2) en yakın gerçek kavşağa (~40 m) taşındı ve veri setine
gerekçesiyle yazıldı. Önceki koşular `runs/_superseded/2026-09-16-karargah-duzeltmesi-oncesi/`.

## J-14 🔴 SegFormer, HTTP sunucu sürecinde boşuna yükleniyor
**Durum:** KAPALI (15 Eylül 2026)

**Sorun.** `fastapi_app.py:170` (`_load_road_runtime`) SegFormer ağırlıklarını
sunucu sürecine yükleyip `runtime["model"]` / `runtime["device"]` /
`runtime["run_inference"]` / `runtime["analyze_road_network_graph"]` anahtarlarına
koyuyor. Bu anahtarların **hiçbiri `fastapi_app.py` içinde okunmuyor** — dosyadaki
tek `runtime[...]` okumaları `get_wayback_versions`, `search_oam_images`,
`bbox_from_center` ve `calculate_route`. Gerçek çıkarım `apps/road_damage/worker.py`
içinde, **ayrı süreçte**, o sürecin **kendi** model kopyasıyla çalışıyor
(`_init_worker` → `load_simple_model`).

**Ölçüm** (bileşen bileşen, aynı süreçte RSS artışı):

| Aşama | İş parçacığı | RSS |
|---|---|---|
| Boş yorumlayıcı | 4 | 19 MB |
| `import torch` | 26 | 205 MB |
| İlk torch matris çarpımı | 39 | 211 MB |
| `ultralytics` + YOLO catlak + YOLO bina | 39 | 365 MB |
| **SegFormer (sunucuda kullanılmıyor)** | 39 | **983 MB** |
| `osmnx` | 39 | 1 119 MB |

Yani **+618 MB ve +5,3 sn açılış**, hiç okunmayan bir sözlük girdisi için.
Ayakta duran sistemde ölçülen: sunucu süreci 1 183 MB, havuz işçisi 1 030 MB,
toplam ~2,2 GB — bunun ~618 MB'ı doğrudan bu maddedir.

**Yapılacak.** `_load_road_runtime`'dan `load_simple_model` çağrısını ve
`model`/`device`/`run_inference`/`analyze_road_network_graph` anahtarlarını
çıkar. **Yan etki (olumlu):** şu an model dosyası eksikse `_get_road_runtime`
patlıyor ve `/route`, `/wayback_versions`, `/oam_search` 503 dönüyor; bu
bağımlılık da kalkar.

**Dikkat.** `main.py` (Streamlit) ve `apps/road_damage/app.py` bu anahtarları
kendi kopyalarında kullanıyor — onlara dokunulmamalı.

**Kapandı.** `_load_road_runtime`'dan `load_simple_model` çağrısı ve
`model` / `device` / `run_inference` / `analyze_road_network_graph` anahtarları
çıkarıldı; `apps.road_damage.utils.inference` artık sunucu sürecine hiç import
edilmiyor. `main.py` ve `apps/road_damage/app.py` (Streamlit) dokunulmadı.

**Ölçülen sonuç** (aynı makine, aynı koşullar, ayakta duran sistem):

| | Önce | Sonra |
|---|---|---|
| Sunucu süreci RSS | 1 183 MB | **681 MB** (−502 MB) |
| Havuz işçisi RSS | 1 030 MB | 1 030 MB (değişmedi — doğrusu bu) |
| **Toplam** | **2 218 MB** | **1 716 MB** |
| Sunucu iş parçacığı | 49 | 51 |

**Dürüst kayıt.** (a) Bellek kazancı, izole ölçümdeki 618 MB tahmininin altında
çıktı: gerçek değer **502 MB**. (b) İş parçacığı sayısı **düşmedi** — torch
YOLO modelleri için sunucuda kalmaya devam ediyor, dolayısıyla J-15
(iş parçacığı aşırı-aboneliği) bu maddeyle kapanmadı. (c) Ayrıca önceden
ölçülen 5,3 sn'lik SegFormer yüklemesi artık açılışta hiç yapılmıyor.

**İşlevsel doğrulama (canlı backend, beş uç nokta):**

| Uç nokta | Sonuç |
|---|---|
| `/wayback_versions` | HTTP 200 · 1,54 sn |
| `/oam_search` | HTTP 200 · 1,03 sn |
| `/route` | HTTP 200 · **7 645,2 m / 405 nokta — değişiklik öncesiyle birebir aynı** |
| `/naive_compare` | HTTP 200 · 10 166,5 m / 29 keşif |
| `/analyze` | HTTP 202 → **done**; SegFormer işçi süreçte 16 parçayı işledi (inference 41,2 sn, toplam 66,3 sn), 3 924 yol segmenti + 6 sonuç görseli üretildi |

---

## J-15 🟠 torch iş parçacığı aşırı-aboneliği — hiçbir yerde sınırlanmamış
**Durum:** AÇIK · **Bulundu:** 15 Eylül 2026

**Sorun.** Kod tabanında `torch.set_num_threads`, `OMP_NUM_THREADS` veya
`MKL_NUM_THREADS` **hiç geçmiyor**. torch varsayılan olarak fiziksel çekirdek
sayısı kadar intra-op iş parçacığı açıyor.

**Ölçüm.** Makine: 14 fiziksel / 20 mantıksal çekirdek. `torch.get_num_threads()
= 14`, interop = 14. `import torch` tek başına **+22 iş parçacığı**, ilk matris
çarpımı **+13 daha** — yani 39 iş parçacığının 35'i torch'un. Ayakta duran
sunucuda ölçülen 49 iş parçacığının büyük çoğunluğu budur.

İki torch süreci (sunucu + havuz işçisi) aynı anda çalıştığında 2 × 14 = 28
hesap iş parçacığı 14 fiziksel çekirdeği paylaşmaya çalışıyor. YOLO çıkarımı
(`/api/camera/analyze`, sunucu sürecinde) ile SegFormer çıkarımı (işçi süreçte)
çakıştığında bu aşırı-abonelik ikisini de yavaşlatır.

**Yapılacak.** İşçi sürecine çıkarım için makul bir pay (ör. 8), sunucu sürecine
küçük bir pay (ör. 2–4) ver. J-14 uygulanırsa sunucudaki torch yükü zaten
YOLO'ya iner ve bu ayarlama daha da kolaylaşır.

**Not.** Bu bir **doğrulanmamış varsayım değil, ölçülmüş bir yapılandırma
eksikliği** — ancak kazancın ne kadar olacağı ölçülmedi; çakışan çıkarım
senaryosu henüz koşulmadı.

---

## J-16 🟡 Graf pickle'ları 1,23 milyon kullanılmayan öznitelik taşıyor
**Durum:** AÇIK · **Bulundu:** 15 Eylül 2026

**Sorun.** `warm_local_graph_cache.py`'nin ürettiği graflar pyrosm'un **ham OSM
etiket kümesini** olduğu gibi taşıyor: düğüm başına 9, kenar başına **30**
öznitelik. Rotalama yalnızca düğümde `x`/`y`, kenarda `length`/`geometry`/`osmid`
kullanıyor; geri kalanı (`access`, `bicycle`, `bridge`, `lit`, `maxspeed`,
`sidewalk`, `tracktype`, `changeset`, `timestamp`, `version`, `tags`, düğüm
başına ayrı bir shapely `POINT` …) hiç okunmuyor ve büyük çoğunluğu `nan`.

**Ölçüm** (18 060 düğüm / 40 950 kenar, Hatay-Antakya):
kullanılmayan öznitelik girdisi düğümlerde **126 420**, kenarlarda **1 105 650**.

| | Şimdi | Budanmış |
|---|---|---|
| Pickle boyutu | 21,3 MB | **4,5 MB** (4,8×) |
| `pickle.load` | 0,61 sn | **0,36 sn** |
| Bellekte | 135 MB | 123 MB |

**Dürüst kayıt: bu bir DİSK/AÇILIŞ kazancı, bellek kazancı değil.** Bellekte
yalnızca %9 fark var, çünkü `nan` değerleri tek bir nesneye işaret ediyor
(girdi başına 8 bayt) ve ağırlığın çoğu korunması gereken shapely
`LineString` geometrilerinde. Toplam 16 önbelleklenmiş graf 130 MB disk
tutuyor; budama bunu ~27 MB'a indirir.

**Yapılacak.** `warm_local_graph_cache.py` / `warm_scenario_v2_cache.py`
grafı yazmadan önce budasın. Mevcut `.pkl` dosyaları yeniden üretilmeli.

---

## J-17 🟠 Oturum deposu 20 tam graf tutabiliyor — 2,7 GB tavan
**Durum:** KAPALI (15 Eylül 2026)

**Sorun.** `ROAD_DAMAGE_SESSION_LIMIT = 20` (`fastapi_app.py:263`) ve her oturum
bir **tam** `G` tutuyor (`safe_G` bir görünüm olduğu için ek yer kaplamıyor —
bu doğru yapılmış).

**Ölçüm.** Tek bölge grafı bellekte **135 MB** → 20 oturum = **2,70 GB**.
Makine 16,9 GB ve ölçüm sırasında %91 doluydu. Dokuz bölgeli senaryo koşumu
tek başına 9 × 135 MB ≈ 1,2 GB oturum verisi bırakıyor ve bu veri, sınır
dolana kadar **hiç boşalmıyor** (zaman aşımı yok, yalnızca FIFO taşması var).

**Yapılacak.** Yaşa göre tahliye ekle (ör. 30 dakika) ve sınırı senaryo
ihtiyacına göre (9–12) düşür. J-16 uygulanırsa graf başına 123 MB'a iner ama
asıl çözüm tahliyedir.

**Kapandı.** Tahliye artık **üç ölçüte** birden bakıyor (`fastapi_app.py`,
`_evict_road_damage_sessions_locked`), üçü de ortam değişkeniyle ayarlanabilir:

| Ölçüt | Varsayılan | Değişken |
|---|---|---|
| Süre aşımı | 30 dk | `QUAKEMIND_SESSION_TTL_SEC` |
| Sayı sınırı | 20 | `QUAKEMIND_SESSION_LIMIT` |
| **Bellek bütçesi** | **1024 MB** | `QUAKEMIND_SESSION_BUDGET_MB` |

Bütçe tahmini ölçülmüş bir sabite dayanıyor: beş gerçek bölge grafında
(2 535 – 70 309 eleman) RSS artışı eleman başına **792 – 1 855 bayt**; oran graf
büyüdükçe arttığı için hesapta ortalama değil **üst değer (1 900)** kullanılıyor.
Ayrıca `_sweep_road_damage_sessions` adlı bir arka plan iş parçacığı dakikada
bir süpürüyor — tahliyeyi yalnızca istek anlarına bağlamak yetmiyordu.

**Senaryo bozulmuyor.** Dokuz bölgeli Senaryo v2'nin tamamı ~97 300 düğüm +
222 300 kenar = ~319 600 eleman ≈ **607 MB tahmin**, yani 1024 MB'lik bütçe tam
bir koşumu ~1,7× paylayla taşır.

**Bulunan ve düzeltilen hata.** İlk uygulamada bütçeden tek başına büyük bir
graf, saklanırken `protect` ile korunuyor ama **ilk okumada** tahliye ediliyordu
— `/route` hemen 422 dönerdi. Bütçe döngüsü artık hiçbir zaman son oturumu
düşürmüyor. (Bunu yakalayan test: "Tek başına bütçeden BÜYÜK graf yine de
saklanır".) Ayrıca aynı kimlik iki kez saklandığında sıra listesinde mükerrer
girdi oluşup canlı bir oturumu düşürebilen eski hata da kapatıldı.

**Doğrulama.** 12/12 birim kontrolü (süre aşımı, sayı sınırı, bütçe, görünümün
iki kez sayılmaması, mükerrer kimlik, süpürücü) + canlı sistemde gerçek
Antakya grafıyla uçtan uca:

| Adım | Ölçüm |
|---|---|
| Başlangıç | 681 MB |
| 3 oturum + her birine `/route` | 854 MB · rotalar 8 413,1 / 7 448,1 / 7 987,8 m |
| 60 sn sessiz bekleme (hiç istek yok) | süpürücü 3 oturumu düşürdü |
| Süresi dolmuş oturuma `/route` | **HTTP 422** — "oturum bulunamadi veya suresi doldu" |
| 3 oturum daha | 854 → **898 MB (+44 MB)**, ilk üçü +173 MB'dı |

**Dürüst kayıt — RSS DÜŞMÜYOR.** Tahliyeden sonra RSS 854 MB'da kaldı: CPython
serbest bıraktığı arena'ları işletim sistemine geri vermiyor. Kazanç bellek
*iadesi* değil, **büyümenin sınırlanması**: boşalan arena'lar yeniden kullanılıyor
(yukarıdaki son satır bunu kanıtlıyor — ikinci üç oturum ilkinin dörtte biri
kadar yer kapladı). Yani tavan 2,7 GB'a tırmanmak yerine platoya oturuyor.

**Not.** Bütçe tahmini gerçek kullanımın ~2 katı kadar temkinli çıkıyor (canlı
ölçümde oturum başına ~58 MB, tahmin ~112 MB). Bu güvenli yön: bütçe gerçek
tavana varmadan tetikleniyor.

---

# DEĞİŞİKLİK GÜNLÜĞÜ

| Tarih | Değişiklik |
|---|---|
| 12 Eylül 2026 | Dosya oluşturuldu. Makale incelemesinden A-01…A-03, B-01…B-12, C-01…C-05, D-01…D-04, E-01…E-06, F-01…F-03 kaydedildi. E-05 ve F-03 kapalı olarak açıldı. |
| 12 Eylül 2026 | Makalenin **tam metni** incelendi; `MAKALE_DUZELTME_LISTESI.md` oluşturuldu. A-04 (artçı ayıklaması çelişkisi) ve A-05 (eksik naif tabanlar) eklendi. Yapısal kontroller temiz çıktı: tablo 1–23, şekil 1–21, denklem 1–17 kesintisiz; kaynakça 57 kayıt, anılmayan/eksik kaynak yok. |
| 12 Eylül 2026 | `PROJE_DOSYASI.md` hazırlandı (uzman ortak yazarlar için teknik tanıtım). D-05 eklendi: defter şablonu ile fiilen koşulan hiperparametreler uyuşmuyor. Karolama adımının 512 olduğu yönündeki ilk şüphe **yanlış çıktı** — `tile_size, tile_stride = 512, 256`, yani %50 örtüşme gerçektir ve makalenin sızıntı uyarısı geçerlidir. |
| 12 Eylül 2026 | Başka bir oturumda yapılan bağımsız inceleme madde madde **doğrulandı** ve bu dosyaya işlendi: A-06 (sentetik üretici Bölüm 3'te tanımsız), A-07 (atama kuralı tanımsız), A-08 (tek/çok etiketli çelişkisi), A-09 (üç kural tanımsız + yanlış atıf), A-10 (yakınlaştırma hesabı), A-11 (λ(d) ↔ r_h), A-12 (orta nokta ölçütü), A-13 (4.1.1 çelişkisi), B-13 (metin kümesi künyesi), D-06 (ham LaTeX denklemler), D-07 (erken durdurma ölçütü), G-01…G-03 (kaynakça). İki şüphe kapatıldı: H-01 (0,4276 çakışması gerçek rastlantı), H-02 (karolama örtüşmesi gerçek). |
| 12 Eylül 2026 | İki inceleme listesi **tek dosyada birleştirildi**: `MAKALE_DUZELTME_LISTESI.md` yeniden yazıldı — 48 madde (`M-01`…`M-48`), kapatılan şüpheler, üç aşamalı öncelik sırası ve kimlik eşleme tablosu. |
| 15 Eylül 2026 | **M-04 kapatıldı** — belgeye Bölüm 3.8.1 "Senaryo Koşumlarında Kullanılan Sentetik Kapanma Kümesi" eklendi (Algoritma 2 + yeni Tablo 10). Koddan çıkarılan ölçüm: istenen ρ₀ = %18 hiçbir bölgede gerçekleşmemiş, bağlantılılık kısıtı oranı 2–5 kez yarılamış; etkin oran %0,55–4,50, toplam %2,87 (6 378 / 222 298 kenar). Bu aralık EMSR648 gerçek oranlarını (%1,58 / %1,71) kapsıyor. Eski "kapanma oranı hedefin altında, bug olabilir" şüphesi **kesin olarak kapandı**: bug değil, bağlantılılık kısıtının tasarım gereği yan etkisi. |
| 15 Eylül 2026 | **`v_ort` = 15,0 km/sa bulundu** (`naive_baseline.py:48`) — B-09 kısmen kapandı. 206,6 dk ve 1 641,0 dk değerlerinin tamamı bu varsayımdan türüyor; makalede hiçbir yerde geçmiyor. |
| 15 Eylül 2026 | **Karar:** simülasyon güncellemesi **ayrı bir sohbette** yapılacak (kullanıcı kararı). Bölünmenin yarattığı bilgi kaybını önlemek için `SIMULASYON_DEVIR_BELGESI.md` hazırlandı: depo durumu, kod haritası, atama kuralının koddan çıkarılmış tam hâli, ölçülmüş parametreler, açık maddeler, güncelleme yapılırsa makalede değişecek yerler ve geri dönüşte bu sohbete getirilecek bilgiler. |
| 15 Eylül 2026 | **Performans incelemesi** yapıldı (ölçümlü): J-01…J-12 eklendi. En ağır üçü: /recent her 20 sn’de ~19 MB segment gönderiyor (J-01); simulate_naive_agent döngü içinde G.copy() yapıyor, ~78 s (J-02); NLP gecikmesinin %89’u önbeleksiz Nominatim (J-03, uçtan uca 7,28 s). J-12, E-01’in sistem tarafındaki yüzü olarak kaydedildi. |
| 15 Eylül 2026 | **Hızlı kazanç paketi uygulandı ve ölçüldü.** KAPALI: J-01 (`/recent` 1 272 288 → **264 bayt**, 0,4 sn → **0,0023 sn**; ayrı `/segments/{id}` ucu + ETag), J-02 (naif ajan `G.copy()` → `restricted_view`: **18×** hızlı, 6/6 birebir aynı sonuç), J-03 (geocoding önbelleği + adaylar arası dedupe: tekrar eden metin **7,28 → 0,55 sn**, çıktı aynı), J-04 (ölü lemmatizasyon çağrısı + tembel Zeyrek: NLP import **60,8 → 20,6 sn**), J-05 (`/route` artık yalnız A*: Dijkstra ile maliyet farkı **0,000000 m**), J-06 (önbellekli `nearest_node`: **541×**, 20/20 aynı düğüm). KISMEN: J-10. YENİ: J-13 (geocoding'in ağa bağlı ilk sorgusu, J-03'ten ayrıldı). Tüm değişiklikler canlı backend üzerinde uçtan uca doğrulandı. |
| 15 Eylül 2026 | **Süreç/iş parçacığı/bellek incelemesi** (ölçümlü): J-14 (SegFormer HTTP sunucusunda boşuna yükleniyor — **+618 MB, +5,3 sn**, hiç okunmayan bir sözlük girdisi için; gerçek çıkarım zaten ayrı işçi süreçte), J-15 (torch iş parçacığı sayısı hiç sınırlanmamış — `import torch` tek başına +22, ilk matmul +13; iki torch süreci × 14 intra-op thread, 14 fiziksel çekirdek), J-16 (graf pickle'larında **1,23 milyon** kullanılmayan öznitelik — 21,3 → 4,5 MB, yükleme 0,61 → 0,36 sn; **bellek kazancı değil, disk/açılış kazancı**), J-17 (oturum deposu 20 × 135 MB = **2,70 GB** tavan, yaşa göre tahliye yok). Ölçülen ayakta duran sistem: 2 ağır süreç, 56 iş parçacığı, ~2,2 GB RSS. |
| 15 Eylül 2026 | **J-14 kapatıldı** — SegFormer artık HTTP sunucu sürecine yüklenmiyor. Ölçülen: sunucu süreci **1 183 → 681 MB (−502 MB)**, toplam 2 218 → 1 716 MB; 5,3 sn'lik model yüklemesi açılıştan kalktı. İş parçacığı sayısı **düşmedi** (torch YOLO için sunucuda kalıyor) — J-15 açık. Beş uç noktada işlevsel doğrulama yapıldı; `/route` sonucu birebir aynı (7 645,2 m / 405 nokta), `/analyze` işçi süreçte baştan sona tamamlandı (16 parça çıkarım, 3 924 yol segmenti, 6 görsel). YENİ: J-18 (`/status` tek seferde 17 MB, 15,5 MB'ı base64 görsel). |
| 15 Eylül 2026 | **J-17 kapatıldı** — oturum deposuna süre aşımı (30 dk), bellek bütçesi (1024 MB, ölçülmüş 1 900 bayt/eleman sabitiyle) ve arka plan süpürücüsü eklendi; üçü de ortam değişkeniyle ayarlanabilir. 12/12 birim kontrolü + canlı doğrulama. Uygulama sırasında **iki hata bulunup düzeltildi**: (a) bütçeden büyük tek graf ilk okumada tahliye edilip /route'u 422'ye düşürüyordu, (b) aynı kimlik iki kez saklanınca sıra listesinde mükerrer girdi oluşuyordu. **Dürüst kayıt:** RSS düşmüyor (CPython arena'ları işletim sistemine iade etmiyor); kazanç büyümenin sınırlanması — tahliye sonrası 3 yeni oturum +44 MB ekledi, ilk üçü +173 MB'dı. Dokuz bölgeli senaryo (~607 MB tahmin) bütçeye rahat sığıyor. |
| 15 Eylül 2026 | **J-08 kapatıldı** — `apply_risk_penalties` vektörize edildi (BallTree, radyan haversine). Gerçek EMSR648 yüküyle (1 321 hasar noktası, 207 kapanma, 49 666 kenar) **139,49 → 3,49 sn (40×)**; 75,9 milyon haversine çağrısı elendi. Sonuçlar **bit düzeyinde aynı**: kaldırılan kenar kümesi birebir, `risk_cost` farkı 0,00e+00. numpy skaleri → saf float dönüşümü eklendi (aksi halde `/safe_route` JSON serileştirmede 500 verirdi). Sınır durumları (hasar/kapanma yok) ayrıca sınandı. Gerçek veriye geçişin (J-12/E-01) teknik ön koşulu kalktı. |
| 15 Eylül 2026 | **J-12 kapsama analizi** (kod değişikliği YOK). EMSR648'in açık erişim olduğu doğrulandı (public S3, HTTP 200, kayıt/token yok) — hakem sorusuna karşı güçlü kaynak. Aktivasyonda 20 AOI var; üçü daha indirildi (AOI08 Pazarcık, AOI18 Kırıkhan, AOI20 Elbistan; 3,7 MB). **Kritik bulgu:** yol kapanma katmanı yalnız **4 bölgede** kullanılabilir (Pazarcık'ın yol katmanı 'Not Analysed', Kırıkhan yalnız 'Possibly damaged' + PRODUCT geçişi); hasar noktası katmanı **5 bölgede** zengin (2 729 kayıt). İskenderun/Samandağ/Belen/Göksun için AOI yok. Ayrıca doğrulandı: EMSR648 vektör paketlerinde **hiç görüntü dosyası yok** (5 pakette raster sayısı 0) — modeller bu veri üzerinde çalışmaz, ona karşı **doğrulanır**. Kapsam kararı kullanıcıda. |
| 16 Eylül 2026 | **Model tabanlı kapanma zinciri uçtan uca denendi** (kod değişikliği YOK). Üç bulgu: **J-21** Esri Wayback'te Antakya'nın deprem sonrası görüntüsü yok (2023-02-23 karosu öncesiyle bayt bayt aynı) — Maxar Open Data'da var ve `/analyze` onu sorunsuz kullanıyor; **J-20** senaryo modele 3,86 m/px veriyor, Maxar doğalı 0,3-0,5 m/px, z=18'e çıkınca tespit edilen hasar **25 kat** artıyor (ama çıkarım 94,9 → 306,8 sn); **J-19** çözünürlük düzelse bile kapanan yol **sıfır** kalıyor, çünkü kural hasarın yolun MERKEZ ÇİZGİSİ pikselinde olmasını istiyor; gerçekte moloz yan binadan sokağa dökülüyor. `simulate_random_closures`'ın var olma sebebi büyük olasılıkla bu. Çözüm mekanizması zaten mevcut: `apply_risk_penalties`'in r_h=25 m sert-kapatma yarıçapı. |
| 16 Eylül 2026 | **J-19 kapatıldı** — kapanma kuralına metre cinsinden yarıçap eklendi (`blockageRadiusM`, varsayılan 25 = r_h; 0 = eski kural, Streamlit tarafı değişmedi). Gerçek model çıktısında eski kural 0, yeni kural r_h=5/25/50 m'de 30/100/188 kapalı kenar (389'dan) — kapanmalar artık modelden geliyor. Canlı boru hattı ile çevrimdışı sonuç birebir aynı. **Yeni:** J-22 (r_h=25 m, aynı alanda EMSR648'in %3,2'sine karşı %25,7 — ~8 kat fazla kapanma, kalibrasyon gerekli), J-23 (`/naive_compare` `/analyze` oturumlarını desteklemiyor — senaryo modele bağlanamaz), J-24 (model tabanlı kapanma için Maxar kapsaması önemli: **8/9 bölge** kapsanıyor, yalnız Göksun'da görüntü yok; doğrulama 4/9 bölgede). |
| 16 Eylül 2026 | **Drone sahneleri senaryosu kuruldu ve ölçüldü.** Kullanıcının modeli test ettiği üç Help.NGO sahnesi (H-D1, H-D2, K-D1; 3,4–3,9 cm/px) bulundu; veri seti, kırpılmış graf önbelleği, `--dataset drone`, bbox destekli uçlar eklendi. z=18/19/20 maskeleri yerelde üretildi; z=21/22 için Colab defteri hazır (J-20 DEVAM). **J-23 KAPALI** (`/closures_from_mask`). Sentetik Hatay regresyonu birebir aynı. **Yeni:** J-25 (model kapanmaları ağı kilitliyor: 9 atamadan 1'i rotalandı), J-26 (EMSR648 doğrulaması: zoom arttıkça gerçek hasar tespiti artarken yanlış alarm daha hızlı artıyor; yol dengeli doğruluğu en iyi %59,1 — şansa yakın; en yüksek zoom en iyi değil), J-27 (gerçek en yüksek zoom z=22). |
| 16 Eylül 2026 | **J-19 varsayılanı geri alındı** (r_h 25 → 0): uygulamanın yol hasarı sonuçları değişiklik öncesiyle aynı. J-26'ya eski kuralın ölçümü eklendi: özgüllük %95, duyarlılık %4,5, dengeli doğruluk %50 — temkinli ama hasarı bulmuyor. |
| 16 Eylül 2026 | **J-12 KAPALI — EMSR648 kapanma katmanı bağlandı** (`closures_from_lines`, `/closures_from_emsr`, `--closure-source emsr`, üç geçilebilirlik kuralı). Çıkmaz düğüme düşen iki karargâh (HQ-K1, HQ-HD2) en yakın kavşağa taşındı. **J-28** (eşleştirilmiş deney): EMSR kapsamındaki 4 ilçede gerçek hasarla QuakeMind 189,5 dk / klasik 2 006,7 dk (gevşek kural, 13/13 rota); kazancın %96'sı U-dönüşü varsayımından, gerçek yol farkı 77,2 dk; katı kuralda kazanç 60 dk. 8 ilçe sentetik yeni taban 222,2 / 1 744,8 dk (Hatay yarısı referansla birebir aynı). |
| 16 Eylül 2026 | **E-01 KISMEN KAPALI** — EMSR648 kapsamındaki 4 ilçede bağlı; kural üç seçenekli ikili kapanma olarak uygulandı (önerilen "Damaged = ağırlık cezası" uygulanmadı). E-02 ve E-06 metinleri yeni koşularla güncellendi (U-dönüşü payı %96; 8 bölge, hâlâ tek tohum). |
| 16 Eylül 2026 | **E-06 KAPALI** — J-28'in dokuz yapılandırması 10 tohumla koşuldu (`benchmark/multi_seed.py`, 90 koşu, ~49 dk, hatasız; tohum 42 birebir tekrar). **J-29**: 8 ilçe sentetik 203,5 ± 18,9 / 1 552,0 ± 252,0 dk, EMSR gevşek 154,1 ± 23,3 / 1 433,0 ± 607,8 dk; tohum 42 iyimser uçtaydı; U-dönüşü payı %96–100; keşiflerin %89'u Maraş merkezde, tek görevde 38 keşif; görev düzeyi p değeri yapı gereği anlamlı (kullanılmamalı); model koşularında GA sıfırı içeriyor. **J-30** (yeni): model koşuları algılama hatasını ölçmüyor — önerilen tasarım yazıldı. |
| 16 Eylül 2026 | **J-30 KAPALI** — "modelle planla, EMSR648'de yürü" deneyi kuruldu (`benchmark/model_in_real_world.py`, backend'siz; `simulate_reference_fleet`'e `prior_closed` / `prior_fallback` / `prior_penalty_factor`). 3 drone sahnesi × 10 tohum, SegFormer 15 sert + 30 yumuşak ayar. Doğrulama: R0 90/90 birebir, R3 = A* (0,00 m). Sonuç: görev başına R3 2,05 / R0 6,52 dk; hiçbir sert ayar R0'dan iyi değil (yakalanan pay %0 … %−11) — küçük r_h kaçırıyor (duyarlılık ≤ 0,13), büyük r_h'de duyarlılık 0,92'ye çıkıyor ama yanlış alarmlar 9 görevin 9'unda hedefi koparıyor; yumuşak kullanımda tutarlı kazanç yok. Tablo 18'in SegFormer satırı olumsuz sonuç; Bölüm 4.7 hipotezi bu düzende desteklenmiyor. |
| 16 Eylül 2026 | **J-31 (yeni) — R1/R2 koşuldu (M-25 verisi hazır).** `simulate_reference_fleet` + `POST /api/road_damage/reference_compare` + `full_scenario.py --references` (varsayılan kapalı). 90 koşu, 62 dk, hatasız; R0 986/986 birebir, taban J-29 ile 90/90 aynı. 8 ilçe sentetik: QuakeMind 203,5 / R0 1 552,0 / R1 1 357,1 / R2 1 409,5 / R1+R2 1 264,1 dk; EMSR gevşek: 154,1 / 1 433,0 / 942,4 / 1 062,6 / 763,8 dk. Güçlü referanslara karşı kazancın %55–90'ı kalıyor ama yalnız yol farkı R1+R2'ye karşı %14–17. R1 avantajının EMSR'de yarısından fazlası sayım kuralından; paylaşım bazen süreyi uzatıyor (sentetikte 10 tohumun 1'i). Kafile kuralı eklenmeden önceki yarım tarama `_superseded/` altına taşındı. |
| 16 Eylül 2026 | Makale oturumu simülasyon sonuçlarını okudu (devir belgesi 12–15, J-28/29/30, E-01/02/06, `multi_seed_tablo.md`, `tablo18.md`). `MAKALE_DUZELTME_LISTESI.md` (makale dalı) güncellendi: M-20/M-22/M-23/M-25/M-26/M-27/M-31/M-43 durum notları, M-04 kısmen yeniden açıldı, yeni Bölüm 8 (M-76…M-82). Makalede eski senaryo rakamlarının geçtiği **71 yer** tarandı. **A-14 eklendi:** geçilebilirlik kuralı tanımları makale ile kodda ters. |
| 16 Eylül 2026 | **Makaleye işlendi** (makale oturumu): J-28, J-29, J-30, J-31 ve E-01/E-02/E-06 sonuçları. Bölüm 3.2 (kural tanımları, Tablo 4), 3.8 (R1/R2 uygulama kararları), 3.8.1 (8 bölge, 10 tohum), 4.3, 4.5 (Tablo 15: n = 380 gecikme), 4.6 (Tablo 16 beş sütun + R1/R2/R1+R2, Tablo 17), 4.7 (Tablo 18, olumsuz sonuç), 4.8 (Tablo 19), 5.1, 5.3, 5.4, Sonuç, Öz, Abstract, Giriş. **A-14 kapandı** (makale koda uyduruldu). Belge Word'de iki geçişle güncellendi; 12 ek uyumu hatası düzeltildi. Yeni tablo eklendiği için belgede eski Tablo 10 ve sonrası bir kaydı (J maddelerindeki "Tablo 16/17/18/19" = belgede 17/18/19/20). |
| 16 Eylül 2026 | **M-05 ve M-22 makaleye işlendi.** Bölüm 3.9'a atama kuralı + Algoritma 3 (kod yeniden okundu, değişmemiş); Tablo 12 makineden ölçülen donanım ve `venv` sürümleriyle dolduruldu; `v_ort` = 15,0 km/sa Bölüm 3.8'e yazıldı. **B-09 kapandı.** Düzeltme: senaryo makinesinin işlemcisi **i7-12700H (12. nesil)**, kullanıcının bildirdiği 14. nesil değil. **Yan etki:** sürüm denetimi sırasında sistem Python'uyla (3.10) `ultralytics` içe aktarıldı ve kullanıcı klasöründeki `Ultralytics/settings.json` varsayılanlara sıfırlandı (uyarı mesajıyla); dosya şu an geçerli, ancak önceden özel bir ayar (ör. `sync`) varsa kaybolmuş olabilir. |
| 16 Eylül 2026 | **M-46 ve M-83 tamamlandı, M-45 kısmen.** Başlık altına yazar bloğu; CRediT beyanı (Esra Uray: denetim, finansman temini; Furkan Emre İnce ve Utku Ceylan: diğer roller, ortaklaşa). Help.NGO İHA ortofotoları OpenAerialMap meta verisinden doğrulandı (CC BY 4.0) ve kaynak [64], Tablo 2, 4.7, Veri Erişilebilirliği, Teşekkür'e işlendi; Veri Erişilebilirliği'ndeki "model başarımı Maxar/Esri üzerinde ölçülmüştür" yanlışı düzeltildi. **Kullanıcıdan beklenen:** proje numarası, depo adresi (`UtBird/QuakeMind` özel — kamuya açık değil), kurum/ORCID/sorumlu yazar, özel metin kümesinin erişim politikası. Künye dosyasındaki CRediT tablosu kullanıcı talimatına birebir uyduruldu (ilk sürüm iki rolü fazladan danışmana yazmıştı). Yeni: M-86 (Tablo 2'de eğitim kümeleri yok). |
| 16 Eylül 2026 | **Künye bilgileri işlendi (M-45):** TÜBİTAK 2209-A başvuru numarası 1919B012547445, depo https://github.com/UtBird/QuakeMind (şu an özel — yayından önce açılmalı), kurumlar (KTO Karatay Üniversitesi; Bilgisayar Müh. ve İnşaat Müh.). Açık: ORCID ve sorumlu yazar. **M-47 sonra konuşulacak** (kullanıcı kararı; belgedeki işaret bilerek bırakıldı). |
| 16 Eylül 2026 | **Devir hazırlığı.** Makale listesinin başına devir notu, sonuna güncel "Kalan İşler" bölümü (A: yazım, B: bilgi/karar, C: koşum, D: son adım) eklendi; eskimiş 12 Eylül öncelik tablosu kaldırıldı. Düzenleme araçları `QuakeMind_makale/makale/araclar/` altına kopyalandı (`BENIOKU.md` ile). **M-87 (yeni, 🔴):** 4.3 ve 4.6'daki iki gömülü şekil eski veri ve eski kural adlarıyla üretilmişti (metin taraması resimleri göremez); 10 tohumlu verilerle yeniden üretildi, **belge kullanıcının Word penceresinde açık olduğu için henüz gömülmedi** (`araclar/sekil_gom.py` hazır). **M-88:** belge Word 2010 uyumluluk modunda. M-16 kapandı. |
| 16 Eylül 2026 | **M-87 gömüldü, M-65 ve M-66 kapandı** (kullanıcı Word'ü kapattıktan sonra). Algoritma 1 koddaki `simulate_naive_agent` ile birebir hizalandı (15 satır; ters kenar da bilinen kapalılara ekleniyor, ajan kavşakta öğreniyor); "Yol bulma" paragrafına Dijkstra–A* denetiminin kanıtı yazıldı (90 görev, en fazla 0,00 m fark). Word iki geçiş, `ref_kontrol` 40/40, `ek_uyumu` 0. **Araç hatası bulundu ve giderildi:** liste işaretleme betiği (`isaretle.py`) "KALAN İŞLER" satırlarını silerken aynı kimlikli **KİMLİK EŞLEME** satırlarını da silmişti (M-65, M-66); satırlar git'teki sürümden geri kondu, betik silmeyi yalnız KALAN İŞLER bölümüyle sınırlayacak şekilde yeniden yazıldı. |
| 16 Eylül 2026 | **M-86 kapandı; M-89 ve M-90 (yeni) bulunup kapandı** (kullanıcı yokken verdiği yetkiyle). Tablo 2'ye KATE-CD, MEDBFS (Türkiye alt kümesi) ve Türkçe metin kümesi satırları eklendi; bilgiler HF veri kartı, MDPI makalesi, GitHub README ve Zenodo API'den doğrulandı. **Lisans:** MEDBFS **CC BY-NC 4.0** (ticari olmayan kullanım); KATE-CD'nin veri kartında lisans **yok**. Eğitim defteri MEDBFS'in **2. sürümünü** (Zenodo 11647956) kullanıyor, makale 1. sürümü (11241134) veriyordu; [57]'ye doğru DOI eklendi. **M-89:** kaynak görüntüler zaten 512 × 512 olduğundan örtüşmeli karolama tek karo üretmiş; 842 karonun tamamı hasarlı olduğu için %95 eleme hiçbir karoyu çıkarmamış. Makale "eleme yapıldı" diyordu, düzeltildi (H-02'ye ek düşüldü). MEDBFS etiketleri 0 = hasarsız/bina dışı, 1 = ağır hasar, 2 = yıkılma; kodun `mask>0` birleştirmesi doğru. **M-90:** Şekil 7'nin başlığı "01 Yol Hasari" idi ve SegFormer'in grup başına ortalanmış doğrulama IoU'su (0,4276) diğer beşinin ortalama IoU'suyla aynı eksende çizilmişti. Şekil 7 (beş mimari, IoU_hasar) ve Şekil 8 (Türkçe etiketli eğitim eğrileri) `araclar/sekil7_8.py` ile yeniden çizildi. **Depoda düzeltilmesi gereken (kod değiştirilmedi):** `model_benchmarks/01_yol_hasari/local_colab_run/results/00_comparison_table.csv` 0,4276'yı `mean_iou` sütununa yazıyor; `build_notebook.py` grafiği de aynı hatayla çiziyor. Word iki geçiş (66 sayfa), `ref_kontrol` 40/40, `ek_uyumu` 0. |
| 16 Eylül 2026 | **M-74 kapandı** — kaynakçada DOI/URL'siz kayıt kalmadı; belgedeki tüm bağlantılar bugün açılarak denetlendi ve erişim tarihi 16.09.2026 yazıldı. [1] AFAD raporunun PDF adresi bulundu; [2]'deki "06 Şubat 2023 Depremleri Basın Bülteni" **bulunamadı**, yerine Kandilli'nin aynı gün yayımladığı iki gerçek bülten yazıldı (Kandilli dış merkezleri Sofalaca–Şehitkamil / Ekinözü diye adlandırıyor, AFAD Pazarcık / Elbistan; Giriş'e not düşüldü); [6] EMS-98 DOI'si (DataCite); [46] Maxar adresi Vantor'a yönleniyor (Maxar Intelligence → Vantor, 1 Ekim 2025), lisans **CC BY-NC 4.0** Tablo 2'ye ve Veri Erişilebilirliği'ne yazıldı; [60] depo `qubvel-org`'a taşınmış. Word iki geçiş, `ref_kontrol` 40/40, `ek_uyumu` 0. **Not:** FEMA PDF'i tarayıcı bölmesinde denetlenirken site dosyayı indirme olarak sundu ve bölmede bir kaydetme penceresi açıldı; kabul edilmedi. AFAD PDF'inin ilk 400 KB'ı doğrulama için geçici klasöre alındı, kullanılmadan silindi. |
| 16 Eylül 2026 | **M-28 kapandı; M-91 ve M-92 bulunup kapandı.** Tablo 13'e GFLOPs ve CPU çıkarım süresi yerel olarak ölçülüp yazıldı (`araclar/verimlilik_olcum.py`, backend venv, ağırlıksız; ~5 dk): U-Net 43,2 GFLOPs / 309 ms, LinkNet 20,9 / 204, FPN 35,5 / 241, PSPNet 11,5 / 88, DeepLabV3+ 111,9 / 657, SegFormer 116,6 / 1 076 (SegFormer parametre sayısı ~64 → ölçülen 61,4 M). GFLOPs = 2 × MAC (torch 2.13 `FlopCounterMode` bunu doğrudan veriyor; tek katmanla denetlendi). **Dizüstünde süreler güç sınırına göre oynuyor** (U-Net 170–312 ms); metinde gösterge niteliğinde dendi. **M-91:** eğitim defteri smp modellerini varsayılan ayarlarla kurmuş; Tablo 6 DeepLabV3+ atrous oranlarını (6, 12, 18) veriyordu, koşulan (12, 24, 36); PSPNet varsayılanı `encoder_depth=3` (tablo 5 diyordu); 3.4'teki "kademe sayısı altı mimaride beş ve eşit" cümlesi yanlıştı. **M-92:** `ek_uyumu.py` ilgi/belirtme/yönelme eklerini denetlemiyordu; iki "Tablo 13'nin" hatası `ek_uyumu_genis.py` ile bulundu ve düzeltildi. Word iki geçiş (67 sayfa), `ref_kontrol` 40/40, iki ek denetimi 0. **Yan etki yok:** ölçüm yalnız okuma ve CPU hesabı yaptı; ağ bağlantısı ve dosya indirme olmadı. |
| 16 Eylül 2026 | **Şekil 12 üretildi (M-43); M-93 bulunup kapandı.** Şekil 12: kesim düzeyi duyarlılık × R0→R3 kazancının yakalanan payı (J-30 verisi, 15 sert ayar; hiçbir nokta R0 çizgisinin üzerine çıkmıyor). Şekil daha önce metinde hiç anılmıyordu; 4.7'ye atıf eklendi. **M-93:** M-39'un eklediği şekil atıf cümleleri, şekil başlıkları görselin altında olduğu için 12 şekilde görsel ile başlık arasına girmişti; cümleler görselin önüne taşındı. M-72'de kaldırıldığı yazılan eski Şekil 9 yer tutucusu hâlâ duruyordu (kaldırıldı); 4.2'deki bayat "(Şekil 9)" atfı silindi. `ek_uyumu_genis.py` ek-fiil (-DAdIr) biçimini tanıyacak şekilde genişletildi. Word iki geçiş, `ref_kontrol` 41/41, iki ek denetimi 0; belge 67 sayfa, 20 gömülü görsel. |
| 16 Eylül 2026 | **M-44 büyük ölçüde; M-94 kapandı.** Şekil 13, 14, 15, 16, 18 kayıtlı sonuç dosyalarından Türkçe karakterli ve ≥300 dpi yeniden çizildi (`araclar/sekil13_18.py`, değerler Tablo 22/23 ile denetleniyor). Şekil 14 tek karşılaştırmalı grafiğe indirildi ve başlığı veriyle uyumlu hâle getirildi (eski başlık TF-IDF'in seyrek kategorilerde sıfırdan farklı olduğunu genelliyordu; en seyrek üç kategoride iki model de 0). Şekil 18'e "yedi modelin hepsinde en düşük kat 1. kat" bulgusu eklendi. **Kalan:** Şekil 17, 19, 20 katlama dışı tahmin/eğitilmiş model ister; `05_risk_skoru` sonuç JSON'larında yok → `run_all_risk.py` yeniden koşulmalı. M-44'teki "kaynak koda erişim yok" notu kısmen yanlıştı (betikler makale dalında). **M-94:** 4.9'daki "Şekil 16–21" (belgede 20 şekil) düzeltildi; Tablo 22'nin † dipnotu tablonun altına taşındı. Word iki geçiş, `ref_kontrol` temiz, iki ek denetimi 0, 67 sayfa. |
| 16 Eylül 2026 | **M-62 için bilgi bulundu (makaleye henüz yazılmadı); D-08 ve M-95 eklendi.** Kullanıcı "M-62 makale dalında yok mu" diye sordu. Makale dalındaki YOLO kıyaslama defteri veri kümelerini (Roboflow `ofgg/maras-tpx5p` v4, `akash-roy-edivz/building-crack-detection-ys4zf` v3) ve protokolü veriyor ama hiç çalıştırılmamış. Üretimdeki `bina.pt` / `catlak.pt` dosyalarının içinden (kod çalıştırılmadan) eğitim ayarları ve **doğrulama** metrikleri okundu: bina mAP@50 0,592 / mAP@50-95 0,394 (40 devir planlı, 21'de erken durdu); çatlak 0,731 / 0,584 (150 devir). Veri yolları `maras-2` ve `crack-2` → defterdeki sürümlerle aynı değil; yazarların teyidi gerekiyor. **D-08 (🔴):** defterde Roboflow API anahtarı açık yazılı; anahtar yenilenmeli. **M-95:** Tablo 24'te ölçülmüş görev tabanlı eksen hâlâ `[ÖLÇÜLECEK]`. |
| 16 Eylül 2026 | **M-95 kapandı** (kullanıcı isteğiyle). Tablo 24'ün görev tabanlı değerlendirme satırı Tablo 19'a REF alanıyla atıf yapılarak dolduruldu; referans veri hücresi deneyin gerçek düzenine göre (SegFormer ile planlama, EMSR648'de yürüyüş) düzeltildi. Word iki geçiş, `ref_kontrol` temiz, iki ek denetimi 0. Yedek: `YEDEK_m95_oncesi`, `YEDEK_m95_alan_oncesi`. |
| 16 Eylül 2026 | **Devir paketi hazırlandı.** Makale düzeltme listesindeki 96 maddenin her birine etiket satırı eklendi (yapıldı / kısmen / yapılmadı, kalan, sonradan eklendi, sizin yapmanız gereken, soru/karar, kimlik/isim/numara, eğitim/koşum, simülasyondan, kontrol edin) ve listenin başına otomatik **Etiket dizini** kondu (`araclar/liste_etiketle.py`, gruplar `araclar/veri/etiketler.json`). Durum tutarsızlıkları düzeltildi: M-57 ve M-59 başlıkta ✅/☐ görünüyordu, notları "kısmen" diyordu → ⚠️. M-43/M-44'teki şekil sayıları düzeltildi (13/20 şekil üretilmiş, 7 yer tutucu; 19 görselin 14'ü yenilendi). "Sayılarla kalan iş" güncel sayımla yenilendi (86 `[ÖLÇÜLECEK]` hücresi). **M-96 (yeni):** Tablo 13'teki SegFormer satırının boş hücreleri hiçbir maddede açık iş olarak yoktu. Madde işaretleme aracı etiket satırını koruyacak şekilde `araclar/liste_isaretle.py` olarak yeniden yazıldı. Teslim klasörü: `Desktop9-A Afet\QuakeMind_Devir_2026-09-16\` (makale + liste; hassas bilgi taraması temiz). Durum: 78 ✅ · 12 ⚠️ · 6 ☐. |
| 16 Eylül 2026 | **Düzeltme listesinin web sayfası sürümü hazırlandı** (kullanıcı isteğiyle): `araclar/liste_html.py` listeden süzülebilir tek dosyalık sayfa üretiyor (durum, etiket, bölüm, arama; her madde açılır-kapanır; kalan işler, sayılar ve devir notu bölümleri). Çıktı `makale/MAKALE_DUZELTME_LISTESI.html` ve devir klasöründe `QuakeMind_Makale_Duzeltme_Defteri_2026-09-16.html`; ayrıca özel Claude sayfası olarak yayımlandı. Yerel sunucuyla denendi: yatay taşma yok, 96 madde ve etiket sayıları doğru. Denemede `.claude/launch.json`'a eklenen geçici sunucu kaydı geri alındı. |
| 17 Eylül 2026 | **Utku'nun `7024d64` commit'i incelendi** (`UtBird/QuakeMind`, makale dalı; yalnız fetch, yerel dosyalara dokunulmadı). M-44 kapanmış: Şekil 17, 19, 20 yeniden üretilip doğru yerlere gömülmüş; metin birebir aynı, çapraz başvuru ve ek denetimleri temiz; başarım değerleri aynı. Yerel makale listesi senkronize edildi (M-44 ✅). **Yeni bulgular:** M-97 (🟠 PR-AUC tabanı 0,687 değil 0,731; ÇKA aslında tabanın altında), M-98 (yeni şekillerde nokta ondalık, tabloyla uyumsuz model adları, İngilizce SHAP etiketleri), M-99 (Şekil 18: 1. katta yalnız 3 negatif; Şekil 20: yalnız son kat), D-09 (leaderboard.csv'den naif satırlar düştü; eğitim süreleri değişti). **Karar bekleyen:** depoda artık iki makale dosyası var (eski izlenen `makale/MAKALE_TASLAK_TR (1).docx` ve Utku'nun `makale/QuakeMind_Makale_Taslak_2026-09-16.docx`); yereldeki asıl dosya Utku'nunkinin 5 görsel eksik hâli. |
| 19 Eylül 2026 | **A-15 eklendi** — model karşılaştırması denetlendi: SegFormer ile beş mimari farklı bölme (sınama kümesi yok), farklı IoU hesabı ve farklı kapasiteyle karşılaştırılmış; MiT-B4 kodlayıcıyla kurulabilen mimarilerin parametre/GFLOPs değerleri yerelde ölçüldü (LinkNet ve UNet++ MiT desteklemiyor). Karar kullanıcıda. |
| 19 Eylül 2026 | **A-16 eklendi; A-15 kararı işlendi** (9 model, eğitim öncesi hazırlık). Veri setleri incelendi: KATE-CD lisansı CC0 1.0 (CITATION.cff), MEDBFS = AIR-DERSL (CC BY-NC 4.0), 438 karo 6 sahneden, konumlar hesaplandı (Hassa–İslahiye, Şekeroba–Türkoğlu); rastgele karo bölmesi sızıntısı ve negatif örnek yokluğu (842/842 hasarlı) kaydedildi. |
| 19 Eylül 2026 | **Veri setleri kesinleşti (KATE-CD, KATE-PD, MEDBFS); A-17 eklendi.** KATE-PD bulundu ve incelendi (CC0 1.0, 832 karo, resmî bölme 675/78/79, konum ızgaraları CodeOcean'da). KATE-CD ile KATE-PD arasında olası görüntü tekrarı riski A-16'ya yazıldı. Makaledeki 96 yer tutucunun doldurma haritası A-17. |
| 19 Eylül 2026 | **A-16 düzeltildi:** MEDBFS konumları 256 piksel adımla yeniden hesaplandı ve KATE-PD ile şablon eşleştirmesiyle doğrulandı (önceki "Hassa–İslahiye, Şekeroba–Türkoğlu" hesabı yanlıştı). Envanter sonuçları (KATE-CD ⊂ KATE-PD, MEDBFS'te 1 953 örtüşen çift, KATE-PD–MEDBFS çakışması) eklendi. |
| 19 Eylül 2026 | **A-16 DEVAM EDİYOR:** ortak bölme listesi (2 194 satır, bölmeler arası örtüşme 0) ve SegFormer Colab defteri hazırlandı; defter yerelde duman testinden geçti, Colab T4'te Koşu A (ortak bölme) ve Koşu B (KATE-PD resmî bölmesi) başlatıldı. |
| 19 Eylül 2026 | **A-15: SegFormer ilk sonuçları ve tanı işlendi** (Koşu A sınama IoU_hasar 0,401; Koşu B 0,481; çözünürlüğe göre 0,486 / 0,395 / 0,086; bina düzeyi büyük hasar kümelerinde %74 bulma, %33 yanlış alarm). |
| 19 Eylül 2026 | **A-15: deneme 2 işlendi** (MEDBFS'siz + sabır 20): aynı KATE-PD sınamasında IoU 0,410 → 0,434, kazanç kesinlikte; mevcut model Drive'da korunuyor. |
| 19 Eylül 2026 | **QuickQuakeBuildings eklendi (hazır, eğitime girmedi):** 425 karo, 339'u eğitime uygun (63 yıkık binalı, çoğu gerçek negatif); TE23D iletişimi bekliyor. |
| 19 Eylül 2026 | **Eğitim Utku'ya devredildi (A-15):** devir paketi `QuakeMind_Devir_Utku_Egitim_2026-09-19` (+ zip, BENIOKU.md) ve web sürümü hazırlandı; 9 model defteri `02_dokuz_model_protokol.ipynb` (P1/P2, tohum döngüsü, QQB eğitim + 74 karoluk QQB dış sınama, bölge / kayıp / morfoloji deneyleri, özet tabloları) yerelde duman testinden geçti. |
| 19 Eylül 2026 | **A-18 eklendi** — yeniden kurulan QuickQuakeBuildings verisinde: 95 hasar etiketli "sağlam" bina (43'ü dış sınamada), dış sınamanın 23/74 karosu doğrulama bloklarında, dışlanan dağlık kesimde etiketsiz bina riski, Maxar lisans çelişkisi. Kaynak: `Furkan--Utku--Model_ve_veriseti_aktarımı/AKTARIM_BELGESI.md` (Ç-02). |
| 19 Eylül 2026 | **A-19 eklendi** — smp focal kaybında α = 0,25 hasar piksellerini arka plandan az ağırlıklandırıyor (doğrulandı: `_functional.py` 83–84); α taraması önerisi. Kaynak: `AKTARIM_BELGESI.md` Ç-11 (DA-SegFormer). |
| 20 Eylül 2026 | **A-20 eklendi** — Tablo 15 tasarımı il ile veri kümesini karıştırıyor (Hatay ağırlıkla KATE-PD, Kahramanmaraş ağırlıkla MEDBFS) ve "Birleşik" satırı aktarım testi değil; il-dışarıda-bırakma satırı, oran sütunu ve yalnız KATE-PD kontrolü önerildi. Kaynak: `AKTARIM_BELGESI.md` Ç-16 (Valentijn vd. 2020). |
