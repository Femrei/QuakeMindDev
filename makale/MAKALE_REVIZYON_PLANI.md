# Makale Revizyon Planı — yeni tatbikata göre

_27 Eylül 2026. Bu belge; makale metninin (`QuakeMind_Makale_Taslak_..._LOCAL_2026-09-21.docx`)
taranması, yeni simülasyon kodunun `file:line` düzeyinde doğrulanması ve mevcut
`MAKALE_DEGISIM_LISTESI.md` + `SIMULASYON_OLCUM_KAYDI.md` belgelerinin
birleştirilmesiyle üretildi. **Sayıların tek kaynağı `SIMULASYON_OLCUM_KAYDI.md`dir.**_

---

## 0. Durum — neden bu revizyon

- **Makalenin şu anki hali "eski" simülasyonu (Eylül ortası v2) anlatıyor:** 8 bölge ×
  6 çift × 10 tohum = 48/480 atama, **sentetik kapanma üreteci** (Algoritma 2),
  **R0–R3** referansları, **t_u = 20 dk** ceza (farkın %97,4'ü), **184,9 → 12,8 dk**
  manşeti, **EMSR648** yer gerçeği (§4.3, §4.6, §4.8), **v_ort = 15 km/sa** sabit,
  **r_h = 25 m**.
- **Kod artık "yeni" tatbikatı çalıştırıyor (26–27 Eylül'de baştan kuruldu) ve
  doğrulandı:** 3 gerçek mahalle × 3 model × 5 tohum, mahalle başına tur-döndürmeyle
  25 çift; kapanma **kendi hasar modelimizin gerçek drone ortofotosu üzerindeki
  çıktısı ∩ OSM**; 3 kol (bilmeyen / telsizle paylaşan / QuakeMind); ceza **1,42 dk
  ayrışık**; sağdan trafik + dönüş maliyeti; yerel OSM; r_h = 0. **EMSR648 atıldı.**

### Kod doğrulaması (27 Eylül, tamamlandı — hepsi CONFIRMED)

| İddia | Kanıt |
|---|---|
| 3 kol | `apps/road_damage/utils/tatbikat.py:544-548` |
| Tur-döndürme 5×5=25 (atama değil) | `tatbikat.py:533-542`; varsayılan `--ekip 5` (`araclar_tatbikat_kos.py:168`) |
| Atama (Algoritma 3) ayrı/bağımsız | `benchmark/full_scenario.py:380`; tatbikat yolu çağırmıyor |
| Dönüş maliyeti 0/3/10/25 sn, kenar-tabanlı, tek yön | `donus.py:31`; `yerel_yol.py:113-114` |
| Hız maxspeed/sınıftan | `yerel_yol.py:67-72` — kentsel 20–70; **otoyol 90** (nota yaz) |
| Ceza 1,42 dk (1,0 + 25 sn), 20 dk kaldırıldı | `network.py:26-31, 735-738`; `kapanmaCezasiDk`/`cezadanGelenDk` var |
| Yerel OSM, Overpass'a bağlı değil | `network.py:344-369`; `yerel_yol.py:79`; `araclar_yerel_osm_kur.py` |
| r_h = 0 varsayılan (tatbikat) | `tatbikat.py:217,265` (paylaşılan fonksiyon 25, canlı uç istekten alır) |
| Kapsama oranı | `network.py:1092-1101`; kullanıcıya `araclar_tatbikat_kos.py:209` |
| 4 dönüş sınaması | `testler/test_donus.py:40,55,68,78` |
| `POST /api/simulasyon/kos` aynı kodu sürüyor | `uclar/simulasyon.py:256,432-492` |

**Not:** 756.623 kenar / 3.083 tek yön / %19–46 kapsama / 480/480 gibi sayılar koddan
değil koşumdan gelir — mekanizma doğrulandı, sayı `SIMULASYON_OLCUM_KAYDI.md`den alınır.

### Çok kanal kod doğrulaması (27 Eylül, 2. güncelleme — hepsi CONFIRMED)

Tatbikat artık **üç kanal** koşturuyor (J-108): uydu + **kamera (YOLO `catlak.pt`+`bina.pt`)** + **metin (BERTurk)**.

| İddia | Kanıt |
|---|---|
| Kamera + metin kanalı tatbikatta koşuyor | `tatbikat_kanallar.py:169 kamera_kanali`, `:263 metin_kanali`; `uclar/simulasyon.py:535-549` |
| Kamera: 13 gerçek deprem fotoğrafı, lisans + SHA-256 | `apps/camera_detection/data/tatbikat_foto/KUNYE.json` (13 kayıt) |
| Metin: 18 **sentetik** (elle yazılmış) ihbar | `apps/disaster_nlp/data/tatbikat_metinleri.json` (`_not`: "hiçbiri gerçek çağrı değil") |
| Konumlar **sentetik**, her kayıt `sentetikKonum: true` | `tatbikat_kanallar.py:61 _hasar_konumlari`, `:230,:344`; depoya `simulasyon.py:613` |
| Coğrafi kodlama tatbikatta **çağrılmıyor** (yavaş) | `tatbikat_kanallar.py:263,328` (`cografi_kodla=False`) |
| Üç kanal ortak sözleşmeye (kaynak etiketi) yazıyor | `worker.py:653` (uydu), `simulasyon.py:606-617` (kamera/metin) |
| `ek.tatbikat` işareti + `hasar_sil_tatbikat` temizliği | `worker.py:650-652`; `depo/sqlite_surucu.py:404`; `simulasyon.py:661` |
| Ölçüm = tespit sayısı + gecikme, **mAP/F1 DEĞİL** | `araclar_kanal_olc.py` (`ortusmeNotu` diskleymeri); F1/accuracy hiçbir yerde yok |
| Üç kanal şekli, alan başına `zlib.crc32` tohumlu foto seçimi | `araclar_makale_uc_kanal.py:330,350`; `tatbikat_kanallar.py:152,190` |
| Fotoğraflar Hatay/Adıyaman'dan, o mahallenin değil — kodda uyarı | `tatbikat_kanallar.py:253-257 not`; `araclar_makale_uc_kanal.py:326-327` |

**Sayılar (`SIMULASYON_OLCUM_KAYDI.md` §17):** Kamera 13/13 foto tespit verdi (47 çatlak, 65 bina),
hibrit çıkarım medyan **307,9 ms**. Metin 18 ihbar, yazar niyetiyle örtüşen **9/18**, sınıflandırma
medyan **36,6 ms**; tam hatta (coğrafi kodlamayla) 2 metin 3,3 ve 4,4 sn (tatbikat coğrafi kodlamayı çağırmıyor).

### Şekil/çıktı denetimi

- 14 şeklin tamamı `QuakeMindBackend/benchmark/makale_sekilleri/` altında hazır
  (4 grafik + 3 mahalle tatbikat + 3 öncesi/sonrası).
- ⚠️ **Grafik şekilleri (`araclar_makale_sekilleri.py`) sayıları SABİT KODLU** —
  run JSON'larından okumuyor. Şekil değerleri `runs/`/`reports/` ile elle kontrol edilecek.
- ⚠️ **İslahiye ve Nurdağı, `tatbikat_alanlari.json`'da bağımsız girdi değil** (yalnız
  Defne-Elektrik var). Tekrar-üretilebilirlik cümlesi buna göre yazılacak.
- **YENİ üç kanal şekilleri** (`sekil_uc_kanal_{defne,islahiye,nurdagi}.png`) + kamera foto şekli
  (`sekil_kamera_kanali_fotograflar.jpg`) eklendi. §F kararı: **`sekil_uc_kanal_nurdagi.png`** kullanılacak
  (Furkan, 27 Eylül; 26 kapalı kenar, en okunaklı + kazancın en yüksek olduğu alan).
- ⚠️ Üç kanal şekli altyazısı: fotoğraflar **Hatay/Adıyaman**'dan, gösterilen mahallenin değil; ihbar
  metinleri ve kamera/metin harita konumları **üretilmiş** — altyazıda açıkça yazılacak (§F önerisi).
- Şekil 4 demo modunda çekilmiş (`capture_app_screenshots.py:94`) — §E'ye bak.

---

## 1. KARAR BEKLEYEN MADDELER (planın geri kalanı bunlara bağlı)

> **Güncelleme (27 Eylül, 2. tarama):** Eski 4. karar (çok kanal) **çözüldü** — kanallar
> tatbikata eklendi. Geriye **3 açık karar** (1–3) + bir **çerçeveleme alt-kararı** (4-a/b) kaldı.

1. **🔴 EMSR648 / §4.3 / Tablo 14 — atılsın mı, kalsın mı?**
   İki iş kolu çelişiyor: `makale` dalı Tablo 14'ü EMSR648 ile 7 model için doldurmaya
   çalışıyordu (checkpoint indirme, Overpass koşumu); simülasyon dalı 26 Eylül'de
   "EMSR kullanılmayacak" kararı verdi. Yeni tatbikat EMSR'siz. **Öneri: EMSR'ı at**
   (§4.3 ve Tablo 14 çıkar, §5.3'e "yer gerçeği doğrulaması yok" sınırlılığı girer;
   yerine isteğe bağlı §13'teki kendi-yer-gerçeğimiz denemesi). Alternatif: EMSR'ı
   koru → yeni tatbikatla iki ayrı kapanma anlatısı olur (tutarsızlık riski).
2. **🟠 Tablo 8 (bina sınıfları ↔ EMS-98 / HAZUS) — HAZUS gidince eşleme?**
   HAZUS yalnız atılan zincirde kullanılıyor. **Öneri: yalnız EMS-98 bırak, HAZUS sütununu çıkar.**
3. **🟠 §3.9 / §4.7 görev ataması (Algoritma 3) — tatbikata eklensin mi, "gelecek çalışma" mı?**
   Atama tatbikat yolunda yok (tur-döndürme var). **Öneri: "gelecek çalışma"ya taşı**
   (480/480 iddiası ve TaskLock/eşzamanlılık ölçümü kalkar ya da ayrı, dar iddia olur).
4. **✅ ÇÖZÜLDÜ (27 Eylül, J-108) — §4.5 çok kanal.** Kanallar tatbikata **eklendi**: uydu +
   kamera (YOLO) + metin (BERTurk). Artık tatbikat üç kanallı. **Kalan alt-karar (a/b):**
   ölçümler tespit sayısı + gecikme, **mAP/F1 değil**. (a) §4.5 "uçtan uca çalıştığının gösterimi"
   olarak yazılır, başarım iddiası kurulmaz; (b) metin kanalı için etiketli kümeyle (DepremKit/TSEqD)
   ayrı F1 ölçülür. **Öneri: (a) + metin için (b)** — özgünlük iddiasının yarısı Türkçe ihtiyaç
   çıkarımında, orada ölçülmüş sayı gerekli. **§F kararı:** şekil `sekil_uc_kanal_nurdagi.png`.

---

## 2. Bölüm bölüm revizyon planı

Kaynak sayılar: `SIMULASYON_OLCUM_KAYDI.md` §8.2 (ana tablo), §9 (duyarlılık),
§10 (r_h), §13.2 (model seçimi), §14 (başarım).

### ÖZ ve ABSTRACT — manşet iddialarının tamamı değişiyor
Çıkacak/değişecek cümleler (mevcut metinde birebir var):
- "sekiz bölgede … 48 … on tohum" → "üç gerçek mahalle (Hatay/Gaziantep), mahalle başına
  25 ekip–afetzede çifti, beş tohum, üç model".
- "sentetik bir üreticiden ve … EMSR648 …" → "tek kaynak: açık drone ortofotosu üzerinde
  kendi hasar modelimizin çıktısının OSM yol ağıyla piksel kesişimi".
- "184,9 ± 200,2 dk'dan 12,8 ± 8,3 dk'ya … %97,4'ü … 20 dakikalık ceza" → "kapanmaları
  önceden bilmek erişim süresini **%13–66** kısaltmıştır (alan+modele göre); en sağlam
  alan Nurdağı üç model × beş tohum **%59–66**. Ceza **20 dk → 1,42 dk** indirilip ayrıştırıldı."
- "(%2,3 ve %5,1)" R0–R3 → "telsizle paylaşan kol Nurdağı 4,58 → 3,80 dk".
- "EMSR648 … 44,4 dakika" → **cümle kalkar**; yerine sınırlılık: kapanma katmanı için
  yer gerçeği doğrulaması yapılmamıştır.
- "15 ayarın hiçbiri …" → **kalkar**; yerine "bölütleme başarımı ile operasyonel fayda
  doğru orantılı değil".
- "48 atamanın 48'i" → **kalkar** (karar 3'e bağlı).
- **ABSTRACT** aynı cümlelerin İngilizcesi; birebir aynı değişiklikler.

### 3.2 Çalışma Alanı ve Veri Kaynakları
- Copernicus EMS / EMSR648 veri kaynağı olarak **çıkar** (karar 1).
- **Tablo 4** (EMS derecesi → HAZUS → geçilebilirlik) **çıkar**.
- Yerine: üç drone alanının künyesi (`SIMULASYON_OLCUM_KAYDI.md` §8.1) — sahne adı,
  sağlayıcı, çekim tarihi, uçuş izi doluluğu, pencere boyu, OSM yol oranı.
- Eklenecek: yol verisi yerel OSM bölge dosyasından (756.623 kenar, tek geçiş); Overpass yok.

### 3.2.1 Etiketli Yol Hasarı Eğitim Kümesi — **DEĞİŞMEZ** (KATE-CD + KATE-PD, Protokol P2)

### 3.5 / Tablo 8 (bina sınıfları ↔ EMS-98/HAZUS) — **karar 2**

### 3.8 Kapanma-Farkında Güzergâh Planlaması
- R0/R1/R2/R3 adlandırması **çıkar** → "Kapanmayı bilmeyen ekip / Telsizle paylaşan filo /
  QuakeMind" (+ isteğe bağlı "Görüş mesafeli ekip").
- t_u = 20 dk **çıkar** → değerlendirme 1,0 dk + manevra 25 sn = 1,42 dk (ayrışık, beyan edilmiş).
- v_ort = 15 km/sa sabit **çıkar** → hız maxspeed/yol sınıfından (kentsel 20–70, otoyol 90).
- r_h = 25 m → r_h = 0 (uygulamanın kuralı, taban çizgi).
- **YENİ alt bölüm: sağdan trafik** — kenar tabanlı arama (satır grafiği); dönüş maliyeti
  düz 0 / sağ 3 / sol 10 / U 25 sn; tek yön (3.083 tek yönlü kenar). Sınama: `test_donus.py`.

### 3.8.1 Sentetik Kapanma Kümesi — **BÖLÜM TAMAMEN ÇIKAR**
- Tablo 10, Tablo 11 (sentetik oranlar), Algoritma 2 **çıkar**.
- Yerine "Dünyanın ölçeği" (`OLCUM_KAYDI` §2): neden mahalle — ekipler gerçek tesislerdeyken
  model rota ağının %0,64'ünü görüyordu, üç kol birebir aynı çıkıyordu.
- ⚠️ **P234/P316/P447** "%0,55–4,50 / %2,84±0,20" sentetik oran iddiaları — bu bölümle çıkar.

### 3.9 Görev Orkestrasyonu — **karar 3** (Algoritma 3 + TaskLock)

### 3.10 Değerlendirme Ölçütleri ve Protokolü
- EMSR referanslı ölçütler (τ, tampon, vektör–piksel kuralları) **çıkar** (karar 1).
- Yeni protokol: 3 alan × 3 model × 5 tohum; mahalle başına 5 giriş ağzı × 5 afetzede,
  5 turda döndürülerek 25 çift; ortalamalar **yalnız bütün kolların ulaştığı ortak görevlerden**.
- Eklenecek: **kapsama oranı** (%19–46) — modelin görmediği kenar "açık" sayılır ama ölçülmemiştir.

### 4.1.1 Donanım ve Yazılım Ortamı
- 20 çekirdekli CPU, **GPU yok**, PyTorch 2.10 CPU, 6 iş parçacığı. Tatbikat **15,0 sn** (soğuk 35 sn).

### 4.3 Kapanma Katmanının Yer Gerçeğine Göre Değerlendirilmesi — **karar 1**
- Öneri: **bölüm + Tablo 14 çıkar**; §5.3'e sınırlılık girer. (İsteğe bağlı: §13 kendi yer gerçeğimiz.)

### 4.5 Uçtan Uca Senaryo Değerlendirmesi — **üç kanal (yeni)**
- 8 bölge/48/10 tohum → 3 mahalle/25 çift/5 tohum/3 model.
- **Tatbikat artık üç kanallı** (uydu + kamera YOLO + metin BERTurk; `OLCUM_KAYDI` §17). Bölüm
  "üç kanalın tek mahalleye inip zincirin sonunda güzergâha dönmesinin gösterimi" olarak yazılır.
- **Kritik çerçeveleme (karar 4-a):** kanal ölçümleri **tespit sayısı + gecikme**, mAP/F1 DEĞİL.
  Kamera: 13/13 foto, 47 çatlak + 65 bina, medyan 307,9 ms. Metin: 18 ihbar, yazar niyetiyle 9/18,
  medyan 36,6 ms. Fotoğraflarda kutu-düzeyi yer gerçeği, metinlerde bağımsız etiket **yok** →
  başarım iddiası kurulmaz (kural 8). Konumlar ve ihbar metinleri **üretilmiş** (`sentetikKonum`).
- **Tablo 16–17** (eski YOLOv8 338,9 ms / BERTurk 124,5 ms senaryo gecikmeleri) → yeni §17.2/§17.3
  sayılarıyla **değiştirilir**; "tespit sayısı + gecikme, doğruluk değil" notuyla.
- Coğrafi kodlama tatbikatta çağrılmıyor (2 metin tam hatta 3,3/4,4 sn) — sınırlılık olarak yazılır.
- **Yeni şekil (§F):** `sekil_uc_kanal_nurdagi.png` + §F'deki önerilen altyazı (fotoğraf ili + üretilmiş konum uyarısıyla).
- Toplanma alanı yönlendirmesi tatbikatta yok → çıkar ya da tek-vaka gözlemi olarak not düşülür.

### 3.6 / 4.10 Metin Sınıflandırma — J-111 uyarısı
- **J-111 bulgusu:** 13 alt kategoriyi 5 üst kategoriye indiren eşleme modelin cevabını bozuyor;
  tatbikat metin kanalında model aciliyet taşıyan metinlerin çoğunu (örtüşmeyen 9'un 8'i) yüksek
  güvenle "Acil Yardım İhtiyacı"na çekiyor. §3.6'daki eleme/eşleme kuralı ve §4.10 sonuçları buna
  göre gözden geçirilmeli; makalede F1 iddiası için etiketli küme (DepremKit/TSEqD) gerekli (karar 4-b).

### 4.6 Karşılaştırma Referanslarıyla Değerlendirme
- **Tablo 18** (R0–R3 × sentetik/EMSR) → **§8.2 ana tablosu** (3 alan × 3 model, üç kol,
  ortalama ± ss, keşif, küme). Şekil: `sekil_kiyas_kollari.png`.
- Ana bulgu cümlesi (`OLCUM_KAYDI` §9 sonu): kazanç %7–66; en sağlam Nurdağı %59–66;
  kapanma rotaya düşmezse fark yok.

### 4.7 Görev Tabanlı Değerlendirme
- 480 atama iddiası **kalkar** (karar 3).
- Tablo 19 (SegFormer × EMSR dünya, 15/30 ayar) — karar 1'e bağlı; EMSR gidince bu deney
  yeni tatbikatın "kapanma rotaya düşmezse fayda yok" bulgusuyla değişir/sadeleşir.

### 4.8 Geçilebilirlik Kuralının Duyarlılığı — **çıkar → r_h duyarlılığı gelir**
- EMSR'ın üç kuralı (katı/orta/gevşek), Tablo 20 **çıkar**.
- Yerine **r_h duyarlılığı** (`OLCUM_KAYDI` §10): 3 alan × 4 yarıçap. **Bulgu:** r_h büyüdükçe
  "kazanç" yükseliyor (%41→56, %9→59, %64→81) ama iyileşme değil — ortak görev çöküyor
  (6→3, 20→5, 25→7), iki alanda r_h=25'te sıfır. Varsayılan r_h=0 değişmedi.

### 4.9 Bileşen Çıkarma ve Parametre Duyarlılığı
- Tablo 21 → §9 duyarlılık: ceza 0,5–2,0 dk, dönüş maliyeti açık/kapalı, eski 20 dk sabitinin
  etkisi (taralı, "kullanılmıyor"). Şekil: `sekil_duyarlilik.png`.

### YENİ ALT BÖLÜM — model seçimi (`OLCUM_KAYDI` §13.2)
- 5,5 kat çıkarım süresi (1,91→10,50 sn) yalnız +0,051 IoU; orta boy model (MiT-B2) İslahiye'de
  %40,9, en büyük %9,9. Saniye başına en iyi değer orta boy. Şekil: `sekil_model_secimi.png`,
  `sekil_sure_dagilimi.png`.

### 4.12 Uygulama Arayüzü — Şekil 4 altyazısı (§E): "simüle veri" + atıf taşınacak.

### 5.1 / 5.3 / 5.4 / 6. SONUÇ
- EMSR, sentetik, R0–R3, t_u=20, 480/480, 184,9→12,8 dayanan bütün cümleler yeniden yazılır.
- **5.3'e yeni sınırlılıklar:** (a) kapanma katmanı için yer gerçeği doğrulaması yok;
  (b) kapsama %19–46, görülmeyen kenar "açık" sayılıyor;
  (c) ~~tatbikat tek kanallı~~ **DÜZELTİLDİ: tatbikat üç kanallı ama kamera/metin kanallarının
  başarımı ölçülmedi** — ölçülen tespit sayısı + gecikme, mAP/F1 değil (kutu-düzeyi yer gerçeği +
  bağımsız metin etiketi yok); kamera/metin harita konumları ve ihbar metinleri üretilmiş;
  fotoğraflar aynı depremden ama gösterilen mahallenin değil;
  (d) üç alan 11'den **seçildi** (kalan 8'de kollar ayrışmadı — bu cümle yazılmazsa kiraz toplama);
  (e) Defne'de beş tohum tek kurulum (küme 1/5), sıfır yayılım sağlamlık değil;
  (f) Nurdağı sahnesinde sağlayıcının "Low Quality" uyarısı var;
  (g) metin sınıflandırmada 13→5 katman çökmesi cevabı bozuyor, aciliyet metinleri tek sınıfa çekiliyor (J-111).

### KISALTMALAR / KAYNAKLAR / VERİ ERİŞİLEBİLİRLİĞİ
- EMSR, Copernicus EMS, HAZUS kısaltmaları + FEMA HAZUS ve Copernicus atıfları **çıkar** (karar 1/2).
- Veri erişilebilirliği: yeni tatbikat verisi + şekiller; yerel OSM depoya girmiyor, komutla üretiliyor.

---

## 3. Tablo envanteri

| Tablo | İşlem |
|---|---|
| Tablo 4 (EMS→HAZUS→geçilebilirlik) | **ÇIKAR** (karar 1/2) |
| Tablo 8 (bina ↔ EMS-98/HAZUS) | **karar 2** (öneri: HAZUS sütunu çıkar) |
| Tablo 10, 11 (sentetik kapanma) | **ÇIKAR** |
| Tablo 14 (§4.3 EMSR kapanma değerlendirmesi) | **karar 1** (öneri: ÇIKAR) |
| Tablo 16, 17 (gecikmeler) | **DEĞİŞTİR** → §17.2/§17.3 kanal ölçümleri (tespit sayısı+gecikme, doğruluk değil) |
| Tablo 18 (R0–R3 kıyas) | **DEĞİŞTİR** → §8.2 ana tablo |
| Tablo 19 (SegFormer × EMSR) | karar 1'e bağlı |
| Tablo 20 (geçilebilirlik kuralı) | **ÇIKAR** → r_h duyarlılık tablosu |
| Tablo 21 (bileşen çıkarma) | **DEĞİŞTİR** → §9 ceza/dönüş duyarlılığı |
| YENİ: model seçimi tablosu | **EKLE** (§13.2) |

## 4. Şekil envanteri

| Şekil | İşlem | Dosya |
|---|---|---|
| Şekil 4 (arayüz ısı haritası) | altyazı düzelt (simüle veri + atıf) | mevcut |
| Şekil 9 (sentetik vs EMSR oran) | ÇIKAR | — |
| Şekil 10/11/12 (senaryo/ayrıştırma) | DEĞİŞTİR | yeni tatbikat şekilleri |
| YENİ: kıyas kolları | EKLE | `sekil_kiyas_kollari.png` |
| YENİ: duyarlılık | EKLE | `sekil_duyarlilik.png` |
| YENİ: model seçimi | EKLE | `sekil_model_secimi.png` |
| YENİ: süre dağılımı | EKLE | `sekil_sure_dagilimi.png` |
| YENİ: mahalle tatbikatları (3) | EKLE | `sekil_tatbikat_{defne,islahiye,nurdagi}.png` |
| YENİ: öncesi/sonrası (3) | EKLE | `sekil_oncesi_sonrasi_{...}.png` |
| YENİ: üç kanal (§4.5, §F kararı) | EKLE | **`sekil_uc_kanal_nurdagi.png`** (+ defne/islahiye yedek) |
| YENİ: kamera foto şekli | EKLE (isteğe bağlı, kamera kanalı) | `sekil_kamera_kanali_fotograflar.jpg` |

⚠️ Grafik şekilleri sabit-kodlu sayı kullanıyor → §8.2/§9/§13.2 tablolarıyla çapraz kontrol.

---

## 5. Önerilen sıra

1. **Karar 1–3 + 4-a/b kapansın** (özellikle EMSR/Tablo 14). Plan bunlara göre kesinleşir.
2. ÖZ + ABSTRACT (manşet) — en görünür, en çok atıf.
3. 3.8 + 3.8.1 + 3.10 (yöntem çekirdeği) — yeni tatbikatı tanımla.
4. 4.5 + 4.6 + 4.8 + 4.9 + model-seçimi (sonuçlar) — §8.2/§9/§10/§13.2/§17'den sayılarla.
5. 4.5 üç kanal + Tablo 16–17 + üç kanal şekli (§17, §F) — "doğruluk değil" çerçevesiyle.
6. 4.3 (karar 1) ve 3.9/4.7 (karar 3) — çıkar/taşı; 3.6/4.10 metin (J-111).
7. 5.x + 6 (tartışma/sonuç) — yeni sınırlılıklar.
8. Kısaltmalar/Kaynaklar/Veri erişilebilirliği temizliği.
9. Şekil altyazıları + çapraz kontrol.
