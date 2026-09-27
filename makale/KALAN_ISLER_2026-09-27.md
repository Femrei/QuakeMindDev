# Kalan İşler — makale (27 Eylül 2026, 4. tur sonrası)

Bu dosya makalenin **gönderilebilir hâle gelmesi için kalan** işleri tutar. Bu
makinede yapılabilen her şey yapıldı; aşağıdakiler karar, başka makine ya da
başka kişi gerektiriyor. Ayrıntılar: `EKSIKLER_VE_SORUNLAR.md` J-111…J-123,
`SIMULASYON_OLCUM_KAYDI.md`.

**Güncel dosya:** `makale/QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3_LOCAL_2026-09-21.docx`
(69 sayfa · 24 şekil · 22 tablo · 68 kaynak · 17 denklem; bütün atıflar çözülüyor)

**Yedekler (`makale/arsiv/`, yalnız yerel — depoda değil):** `..._pre_simulasyon_revizyonu_...` (1. tur öncesi) ·
`..._pre_tarama_revizyonu_...` (2. tur öncesi) · `..._pre_revize3/4/5_...` (3. tur adımları) ·
`..._pre_revize6/7/8/9_...` (4. tur adımları)

**Betikler (`makale/analiz_arsivi/`):** `revize2*.py`, `revize3.py` … `revize9.py`,
`yardimci.py` — her biri kendi yedeğinden başlar, yeniden çalıştırılabilir
(yollar oturumun scratchpad'ine göre yazılı; başka yerde çalıştırmak için `sys.path` ve
`SRC/DST` satırlarını düzeltin).

---

## Bu turda yapılanlar (4. tur)

- **Metin sınıflandırma katmanı düzeltildi ve yeniden ölçüldü (J-111/J-116):** model
  eminse anahtar sözcük onu ezmiyor; eşleşme sözcük sınırında ("araç" artık "aç"
  sayılmıyor); Türkçe küçük harf; gösterilen güven gösterilen kategorinin. Eşik ve
  13→5 eşlemesi değişmedi (test metnine ayar yapılmadı). Örtüşme **9/18 → 11/18**;
  kararın kaynağı model 15, anahtar sözcük 3 (eskiden 12'si anahtar sözcük). Rapor:
  `QuakeMindBackend/benchmark/reports/kanal_olcumu_metin_duzeltilmis.json` (i7 raporu
  `kanal_olcumu.json`'a dokunulmadı). Sınama: `testler/test_siniflandirma.py` 7/7.
- **Yeni bulgu (J-123):** model yol kapanması metinlerini tanımıyor (4/4'ünde ulaşım
  etiketi yok); yol bilgisi bugün yalnız anahtar sözcükten geliyor. Makaleye yazıldı.
- **Makale (revize7):** §3.6 (normalleştirme — sınıflandırıcı küçük harf görmüyordu,
  metin yanlıştı; karar sırası; kurtarma katmanı; NER paragrafı; Tablo 8 dipnotu), §3.9
  atama örneği ("hilti ve jeneratör lazım" gerçekte Elektrik Kaynağı → Acil Yardım),
  §4.5 + Tablo 14, §5.3(c), §6 gelecek işler ve sonuç, Denklem (8) atfı.
- **Güvenlik (J-119) kodda kapandı:** eski kayıt/giriş uçları rolü istemciden almıyor,
  varsayılan kapalı; `/api/team/*` 409 kilidi de aynı bağımlılığın arkasında. Sınandı.
- **Şekil 1 yeniden çizildi (J-124):** eski şeklin üreticisi yoktu, ~42 noktanın hiçbiri bir
  kaynağa bağlı değildi ve sağ üstteki üç nokta §2.3'teki "rastlanmamıştır" ifadesiyle
  çelişiyordu; eksen yazıları da üst üste biniyordu. Yeni şekilde her kutu §2'deki bir
  kaynak numarası (19 kaynak), yeri betikte gerekçesiyle yazılı
  (`QuakeMindBackend/araclar_makale_yazin_konumu.py`); §2.5'teki atıf cümlesi ve altyazı
  güncellendi (revize8). **Bakmanızı isterim:** sınıflama niteliksel bir karardır.
- **Şekil 5 üreticisi:** künye satırı artık sarmalanıyor (`araclar_makale_haritalari.py`);
  yeniden üretim i7'de (B0).
- **Sayfa düzeni okuması (revize9):** PDF'te taşma, sayfa sonunda kalan tablo başlığı ve
  görselinden ayrılmış altyazı tarandı. Şekil 11'in altyazısı sonraki sayfadaydı → görseller
  altyazılarıyla, tablo başlıkları tablolarıyla birlikte tutuluyor; kısa tablolar (≤ 15
  satır) bölünmüyor, uzun tablolarda başlık satırı yineleniyor. Tablo hücreleri iki yana
  yaslıydı (dar sütunlarda "Defne   /   Elektrik") → sola yaslandı. Tablo 21'in ROC-AUC
  sütunu genişletildi. Sayfa sayısı 67 → 69 (tabloların bölünmemesinden).
- **Tatbikat koşucusuna `--rh`:** Tablo 18 (r_h duyarlılığı) artık depodaki betikle
  üretiliyor; `araclar_tatbikat_ozet.py` tabloyu yazıyor.

## Önceki tur (3. tur)

- **Boş tablolar metne çevrildi:** Tablo 5 (oluşturulmamış yol hasarı kümesinin künyesi)
  ve Tablo 15 (koşulmamış il-ayrık genelleme). Tablolar 1–22 olarak yeniden
  numaralandı; kaydırmadan bozulan 17 Türkçe ek ("Tablo 12'ün" → "Tablo 12'nin")
  otomatik düzeltildi. Kalan tek `[ÖLÇÜLECEK]`: §4.6 ceza payı (aşağıda B1).
- **R0b risk tabanı düzeltildi (J-120):** sabit öznitelikle koşulmuştu; doğru öznitelikle
  ölçüldü → CatBoost'u geçiyor. §4.11 beşinci gözlem tersine döndü; Sonuç'a eklendi.
  Tablo 21'deki yanlış kalın işaretler düzeltildi.
- **Şekiller:** Şekil 2 (mimari), 4 (karolama/morfoloji), 6 (protokol) koda göre yeniden
  çizildi (`QuakeMindBackend/araclar_makale_semalar.py`); Şekil 20 "7 olaylık" etiketiyle
  aynı veriden yeniden üretildi.
- **Kaynakça (J-121):** 53 DOI doğrulandı; 4 hatalı DOI düzeltildi ([9] başka makaleyi
  gösteriyordu); 13 URL'nin erişim tarihi güncellendi.
- **Okuma turu:** tekrarlar (katkı 1–2, "Tablo 15'te verilmektedir" ×2), "25 çift" → "en
  çok 25", ölçülmüş çıkarım süresi, "yol maskesi" → "hasar maskesi", kod yolu
  parantezleri, keşif–kazanç ilişkisinin kısmen yapısal olduğu uyarısı (§4.6, Şekil 12,
  §5.1, §6), mobil istemci geri eklendi, teşekkür cümlesi.

---

## Alınan kararlar (27 Eylül, kullanıcı)

| Konu | Karar | Durum |
|---|---|---|
| Üç kod kusuru (J-112/113/114) | **Düzelt + yeniden koş** | Kod düzeltildi, sınamalar geçiyor (7/7); yeniden koşu i7'de (B0) |
| Tablo 15 "Keşif" sütunu | **Yeniden koşuda her kol için ayrı çıksın** | Koşucu + yeni `araclar_tatbikat_ozet.py` kol başına keşif ve ölçülmüş ceza payı yazıyor |
| Türkçe metin kümesi erişimi | **İstek üzerine** | Makaleye işlendi (Veri Erişilebilirliği + Tablo 2) |
| Hedef dergi | Henüz belli değil | Biçim şimdilik olduğu gibi |
| ORCID / sorumlu yazar | Sonra eklenecek | Yer tutucu duruyor |

**Kodda yapılan düzeltmeler (27 Eylül):**
- `network.py` — dönüş maliyeti açıkken kapanma sabiti yalnız değerlendirme (1,0 dk);
  manevrayı ekibin fiilen yaptığı dönüş ödüyor (eskiden U dönüşü iki kez sayılıyordu).
- `yerel_yol.py` — `oneway=-1` artık ters yönde (v → u) kuruluyor.
- `donus.py` — A* sezgiseli sabit 80 km/sa yerine çizgenin gerçek en yüksek hızını
  kullanıyor (sınamada eski sezgisel 44,4 sn'lik yolu, doğrusu 41,5 sn).
- `tatbikat.py` — kol ortalamaları 3 basamak; ortak görevler üzerinden `toplamSureDk`,
  `toplamCezaDk` eklendi. `araclar_tatbikat_kos.py` — `elenen` hatası giderildi, tohum
  başına afetzede sayacı. Yeni: `araclar_tatbikat_ozet.py` (tohum birleştirici).
- `testler/test_donus.py` — üç kusur için birer sınama eklendi.

---

## KALAN İŞLER

### A. 🔴 Sizin karar ya da bilgi vermeniz gerekenler
- [ ] **ORCID numaraları ve sorumlu yazar** (başlık altındaki yer tutucu, P5) — sonra.
- [ ] **Hedef dergi** — seçilince biçim (kaynak stili, sayfa sınırı, çift kör başlık
  sayfası) ayarlanır.

### B0. 🔴 i7 iş paketi — düzeltilmiş kodla yeniden koşu (sırayla)
`QuakeMindBackend/` içinden, kök `venv/` ile:
```
venv/Scripts/python.exe testler/test_donus.py
```
(7/7 GECTI görülmeli.) `apps/road_damage/data/osm_graph_cache/` içinde eski çizge
önbelleği varsa silin (tek yön düzeltmesi çizgeyi değiştirir). Sonra üç model:
```
python araclar_tatbikat_kos.py --alanlar apps/road_damage/data/tatbikat_alanlari.json --sec "Defne - Elektrik" "Islahiye" "Nurdagi" --model segformer_mitb0_p2_t42 --tohum 42 43 44 45 46 --cikti sonuc_b0.json
```
```
python araclar_tatbikat_kos.py --alanlar apps/road_damage/data/tatbikat_alanlari.json --sec "Defne - Elektrik" "Islahiye" "Nurdagi" --model segformer_mitb2_p2_t42 --tohum 42 43 44 45 46 --cikti sonuc_b2.json
```
```
python araclar_tatbikat_kos.py --alanlar apps/road_damage/data/tatbikat_alanlari.json --sec "Defne - Elektrik" "Islahiye" "Nurdagi" --model unet_mitb4_p2_t42 --tohum 42 43 44 45 46 --rh 0 10 15 25 --cikti sonuc_unet.json
```
```
python araclar_tatbikat_ozet.py sonuc_b0.json sonuc_b2.json sonuc_unet.json --cikti tatbikat_ozet.json
```
Duyarlılık (Tablo 19) bu kez U-Net ile, tek tohum: ana koşu `sonuc_unet.json`'dan; ek
olarak `--donussuz`, `--degerlendirme-dk 0.5`, `--degerlendirme-dk 2.0` ve eski sabit için
`--degerlendirme-dk 20` ile `--model unet_mitb4_p2_t42 --tohum 42`. Çıktı JSON'larını
ve `tatbikat_ozet.json`'u bu oturuma getirin; makale tarafını ben güncellerim.

Aynı makinede iki kısa iş daha (metin katmanı düzeltmesinden sonra):
```
python araclar_kanal_olc.py
```
(Tablo 14'ün iki satırı; gecikme bugün düzeltme öncesi hatla ölçülmüş diye yazılı.
Beklenen kategori sonucu 11/18 — farklı çıkarsa bana bildirin.)
```
python araclar_makale_uc_kanal.py --hepsi
```
(Şekil 10: metin işaretlerinin boyu aciliyete bağlı ve 5 Gaziantep metninin 3'ü Acil
Yardım → Enkaz Bildirimi'ne geçti; ayrıca "Hatay ve Adıyaman" notu düzeltildi. U-Net
ağırlığı bu makinede yok.)
```
python araclar_makale_haritalari.py --alan Nurdagi
```
(Şekil 5: künye satırı artık sarmalanıyor — 27 Eylül'de düzeltildi; makaledeki
şimdilik künyesi kırpılmış sürüm, `makale/sekiller_hazir/sekil05_tatbikat_nurdagi_kunyesiz.png`.
Çıktı `benchmark/makale_sekilleri/sekil_tatbikat_nurdagi.png`.)

**Yeniden koşudan sonra makalede değişecek yerler:** ÖZ/ABSTRACT (1,42 dk → 1,0 dk +
fiilî dönüş; %7–66 ve %59–66 bantları; ceza payı), Kısaltmalar (t_u), §3.8 (A* sezgiseli,
ceza teriminin niteliği, Algoritma 1 son satırı), Tablo 11 (t_u satırı), Tablo 15 (kol
başına keşif + ölçülmüş ceza payı; §4.6'daki [ÖLÇÜLECEK]), Tablo 16, Tablo 18 (r_h —
U-Net koşusunun `--rh 0 10 15 25` çıktısından), Tablo 19 (U-Net), Şekil
11–12 (`araclar_makale_sekilleri.py` sabit sayıları), §5.1, §5.3(b) (kusur cümlesi
kalkar), §6, `SIMULASYON_OLCUM_KAYDI.md`; kanal ölçümünden sonra §4.5 "Kanal
ölçümleri" paragrafı ve Tablo 14 (gecikme + "düzeltme öncesi" notları), Şekil 10 ve Şekil 5 görselleri.

### B. 🟠 Aynı makinede ek işler
- [ ] **B2 — Tablo 11 sürümleri:** `pip freeze` ile Python/PyTorch/Ultralytics/Transformers
  sürümlerini doğrula (makaledeki sürümler bu makinedeki ortamla ve ölçüm kaydıyla
  tutmuyor; J-118).
- [ ] **B6 — Ham sonuçları depoya koy:** B0'daki `sonuc_*.json` ve `tatbikat_ozet.json`
  `benchmark/reports/` altına (birleştirici artık depoda: `araclar_tatbikat_ozet.py`).

### C. 🟡 Ekip içi / GPU
- [ ] **İl-ayrık genelleme (isteğe bağlı):** yapılırsa §4.4'e tablo olarak geri eklenir;
  Furkan'ın 25 Eylül iş paketindeki "İŞ 2" (veri il etiketiyle yeniden bölünmeli).
- [ ] **Çoklu tohum:** Tablo 12'deki on mimari tek tohumlu; en az 3 tohum sınırlılık
  (o)'yu kapatır.
- [ ] **YOLO mAP ve metin F₁:** etiketli saha/metin kümesi olmadan ölçülemiyor (Tablo 22).
  Metin katmanı düzeltildi (J-111/J-116); F₁ 13 etiket düzeyinde ve 5 üst kategori
  düzeyinde ayrı ölçülmeli. Aynı kümede yol kapanması örneği sayısına bakılmalı (J-123).

### D. ⚪ Gönderim öncesi
- [x] Sayfa düzeni okuması (revize9, 27 Eylül). Kalan: Tablo 15'in sütun genişlikleri
  yeniden koşudan sonra ayarlanacak (sütunlar değişecek: keşif iki kola ayrılıyor, ceza payı
  ekleniyor); yazar gözüyle içerik okuması sizde.
- [x] Şekil 1 eksen çakışması — şekil kaynağa bağlı olarak yeniden çizildi (J-124).
- [ ] Roboflow API anahtarı iptali + yenileme (git geçmişinde açık: `9d4cc22`/`55a50d1`).
- [x] J-119 güvenlik: eski kayıt/giriş uçları rolü istemciden almıyor, varsayılan kapalı
  (27 Eylül). Kalan: eski `/api/auth/me` belirteci URL'de taşıyor — eski web kalkınca
  uçla birlikte kaldırılacak.
- [x] Yeni sürüm GitHub'da (`makale` dalı) — Drive yerine GitHub kullanılıyor (kullanıcı
  kararı, 27 Eylül).
- [x] Değişiklikler konu başına commit'lendi ve `makale` dalı push edildi (27 Eylül).
  Revizyon yedekleri (`makale/arsiv/..._pre_revize*`, toplam ~240 MB) depoya girmedi,
  yalnız bu makinede; aynı sürümler git geçmişinde.
