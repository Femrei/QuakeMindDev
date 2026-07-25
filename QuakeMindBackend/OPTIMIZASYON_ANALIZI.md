# QuakeMind Backend — Optimizasyon ve Mimari Analiz Raporu

> **Revizyon notu:** Bu dokümanın ilk versiyonu backend'i "bir yerlerde çalışan Python
> servisi" varsayımıyla incelemişti. Asıl dağıtım hedefinin **Raspberry Pi** olduğu,
> Pi'nin hem **kendi WiFi yayınıyla (AP modu) yakındaki telefonlara offline hizmet**
> vereceği hem de **internet üzerinden merkezi bir sunucuya bağlı** çalışacağı ve amacın
> "afet öncesi/sonrası, internet olsun olmasın kullanıcıya hizmet" olduğu öğrenilince,
> tüm rapor bu bağlamda yeniden değerlendirildi. Madde numaraları korunmuştur (birebir
> referans vermeye devam edebiliriz); ilgili maddelerin altına **"📡 Pi/Offline Notu"**
> eklendi, yeni bölümler (9-12) eklendi, öncelik sırası bu gerçeğe göre yeniden yazıldı.

Durum lejantı: 🔴 Kritik · 🟠 Önemli · 🟡 Orta · ⚪ Düşük · **Durum:** Bekliyor / Devam Ediyor / Tamamlandı / Reddedildi

---

## Bölüm 0 — Dağıtım Bağlamı (yeni: bunu bilmeden yapılan her analiz eksik kalır)

**Hedef mimari (konuşmamızdan çıkardığım özet — yanlışsa düzelt):**

```
                     ┌─────────────────────────┐
                     │   Merkezi Sunucu (Cloud) │  ← internet varsa senkron
                     │  (tüm Pi'lerden veri     │
                     │   toplar, model/veri     │
                     │   günceller, koordinasyon)│
                     └────────────┬─────────────┘
                                  │ internet (aralıklı, garantisiz)
                    ┌─────────────┴─────────────┐
                    │                           │
             ┌──────▼──────┐             ┌──────▼──────┐
             │ Raspberry Pi │             │ Raspberry Pi │   ← afet bölgesinde
             │  (Bölge A)   │             │  (Bölge B)   │     saha ekipmanı
             │ WiFi AP+FastAPI            │ WiFi AP+FastAPI
             └──┬───────┬──┘             └─────────────┘
                │       │
          ┌─────▼──┐ ┌──▼─────┐
          │Telefon 1│ │Telefon 2│  ← hotspot'a bağlanan afetzedeler/gönüllüler
          └────────┘ └────────┘
```

Bunun kod/mimari üzerindeki etkileri, aşağıdaki maddelerde tek tek işleniyor, ama
üst düzey ilkeler şunlar:

1. **"Offline-first" bir zorunluluk, opsiyon değil.** Pi, internet olmadan da bölgesindeki
   telefonlara tam hizmet verebilmeli (madde 3, 16, 21, 33 ile ilişkili).
2. **Raspberry Pi = sınırlı CPU/RAM, GPU yok, ARM mimarisi, SD kart I/O yavaş/aşınmaya
   hassas.** Şu ana kadarki analiz büyük ölçüde "geliştirici PC'sinde x86_64 + muhtemelen
   GPU" varsayımıyla yapılmıştı — bu artık geçersiz (bkz. Bölüm 10).
3. **Streamlit, bu senaryoda yanlış araç.** Hem kaynak ağırlığı hem çoklu-kullanıcı
   modeli (her tarayıcı sekmesi = ayrı tam Python script rerun'u) Pi'de birden fazla
   telefonun aynı anda bağlandığı bir ortamda ciddi darboğaz (bkz. Bölüm 12 — somut
   öneri var).
4. **Senkronizasyon mimarisi eksik/hiç düşünülmemiş.** Şu an kod, "internet var" veya
   "internet yok" ikiliğini bazı yerlerde (offline OSM modu) ele alıyor ama "internet
   geldiğinde merkezi sunucuyla veri alışverişi yap" diye bir mekanizma hiç yok
   (bkz. Bölüm 9 — yeni).

---

## Bölüm 1 — Kritik: Şu an gerçekten kırık veya çalışmayan şeyler

### 1. 🔴 Kamera Tespiti modülü `ultralytics` eksikliğinden çöküyor
**Durum:** Bekliyor
Kök `requirements.txt` içinde `ultralytics` hiç yok, ama `apps/camera_detection/camera_manager.py`
`from ultralytics import YOLO` import ediyor ve hem `main.py` (unified arayüz →
"Kamera Tespiti" sekmesi) hem `apps/camera_detection/app.py` bunu çağırıyor. Şu an kurulu
venv'de doğruladım: `import ultralytics` → `ModuleNotFoundError`.
**Öneri:** `ultralytics`'i kök `requirements.txt`'e ekle (versiyon pinle, madde 23).
**📡 Pi/Offline Notu:** Eklemeden önce madde 10 (Bölüm 10) kararını ver — iki YOLO
modelini gerçek zamanlı Pi CPU'sunda aynı anda koşturmak muhtemelen gerçekçi değil;
"eklemek" tek başına yeterli çözüm olmayabilir, modelin Pi'de gerçekten kullanılabilir
olup olmadığını önce ölç.

### 2. 🔴 Earthquake Risk masaüstü GUI'si (`customtkinter`) kök requirements'ta yok
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Bu madde artık **önemsiz/kaldırılabilir** — `customtkinter`
bir masaüstü (X11/Wayland) GUI kütüphanesi. Pi başsız (headless) bir sunucu olarak
çalışacaksa (muhtemel senaryo: Pi'ye monitör/klavye takılı değil, sadece kutu içinde
WiFi yayını yapan bir cihaz), bu GUI'nin Pi'de hiç çalıştırılma ihtimali yok. **Öneri
değişti:** `apps/earthquake_risk/gui_app.py` + `main.py` (tkinter masaüstü giriş noktası)
prod kapsamından tamamen çıkarılmalı, sadece "geliştirici kendi PC'sinde debug ediyor"
senaryosunda kalmalı — kök requirements'a hiç eklenmemeli.

### 3. 🔴 `QUAKEMIND_OFFLINE_ONLY` process-genelinde global env var — çoklu kullanıcıda birbirini eziyor
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Bu madde artımızda kritik seviyeye çıktı. Pi senaryosunda
"offline mi online mu" **her istekte otomatik algılanması gereken bir sistem durumu**
olmalı — kullanıcının elle işaretlediği bir checkbox değil. Bir telefon hotspot'a
bağlanıp uygulamayı kullanırken Pi'nin internet'i gidip gelebilir (mobil şebeke/uydu
üzerinden aralıklı bağlantı gibi düşünülebilir). **Öneri (genişletildi):**
- Global env var'ı tamamen kaldır.
- Pi'de arka planda çalışan basit bir "connectivity monitor" (ör. her 15-30 saniyede
  bir bilinen bir merkezi sunucu endpoint'ine ping/HEAD isteği) internet durumunu bir
  paylaşılan duruma (in-memory + gerekiyorsa `/api/status`'ta expose edilen bir alan)
  yazsın.
- Her istek bu anlık durumu okusun, kullanıcı bir şey işaretlemek zorunda kalmasın
  ("Offline OSM modu" checkbox'ı "zorla offline'a geç" anlamına gelen bir override'a
  dönüşebilir, varsayılan davranış otomatik olmalı).

### 4. 🔴 Aynı Python modülü iki farklı "qualified name" ile import ediliyor → state paylaşılmıyor, model iki kez yüklenebilir
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Pi'de RAM son derece kısıtlı (bkz. Bölüm 10) — aynı Segformer
modelinin **iki kez** belleğe yüklenmesi ihtimali, x86_64 geliştirici makinesinde
"israf ama tolere edilebilir" iken Pi'de **OOM (out-of-memory) kilitlenmesine** yol
açabilecek somut bir risk haline geliyor. Bu maddenin önceliği yükseldi.

### 5. 🔴 Risk motoru (CatBoost) ilk `/api/risk/predict` isteğinde senkron eğitiliyor — diğer modüller gibi ön-ısıtılmıyor
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Pi CPU'su (ör. Cortex-A72/A76, GPU yok) geliştirici PC'sinden
kat kat yavaş. 800 iterasyonluk CatBoost eğitimi + declustering/label-building
(madde 16'daki O(n·k) döngüler) Pi'de saniyeler değil **onlarca saniye/dakikalar**
sürebilir. Bu, ilk kullanıcıyı (belki de afet anında acil bir sorgu yapan biri) uzun
süre bekletir. **Öneri güçlendirildi:** Sadece "açılışta eager çağır" yetmez —
**eğitilmiş modeli Pi imajına önceden gömülü olarak dahil et** (bkz. madde 15 ve
Bölüm 9), Pi ilk açılışında sıfırdan eğitim yapmasın.

### 6. 🔴 `nlp_bridge_server.py` (port 8766) muhtemelen kullanılmayan, unutulmuş ikinci bir NLP sunucusu
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Pi'de her MB RAM ve her CPU cycle değerli — kullanılmayan bir
BERT modeli instance'ının yanlışlıkla ayağa kalkması (ör. bir systemd servisi olarak
otomatik başlatılırsa) Pi'nin kaynaklarının önemli bir kısmını boşuna tüketebilir.
**Öneri:** Sadece kod tabanından silmek yetmez — Pi provisioning/deployment script'lerinde
(varsa) bu servisin hiçbir yerde systemd unit/autostart olarak tanımlanmadığından emin ol.

---

## Bölüm 2 — Mimari: Kod tekrarı ve tutarsızlık

### 7. 🟠 Aynı iş mantığı 3-4 yerde birbirinden bağımsız kopyalanmış
**Durum:** Bekliyor
(İçerik değişmedi — bkz. önceki analiz.)
**📡 Pi/Offline Notu:** Pi'ye kod deploy ederken (muhtemelen `git pull` + servis
restart şeklinde bir dağıtım olacak) her kopyanın senkron kalması gerekiyor — sahada,
internet kısıtlı bir Pi'ye "hatalı/eksik güncellenmiş" bir kopya gitme riski, ofis
ortamındaki bir sunucudan çok daha maliyetli (saha ziyareti gerektirebilir). Bu tek
başına, kod tekrarını **acilen** ortadan kaldırmak için ekstra bir gerekçe.

### 8. 🟠 `main.py` (unified Streamlit) açılışta TÜM modelleri eager-load ediyor
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Bölüm 12'deki karara bağlı olarak muhtemelen tamamen
**tartışmasız hale gelecek** — Streamlit prod'dan kalkarsa bu madde de kendiliğinden
çözülür. Ama FastAPI tarafında da benzer bir prensip geçerli: Pi'nin RAM bütçesi
muhtemelen "4 modülün hepsini aynı anda belleğe almaya" yetmeyebilir (Bölüm 10).
Prod FastAPI için de **modül bazlı lazy-load + LRU tahliye** (kullanılmayan modelin
belirli bir süre sonra bellekten atılıp tekrar gerektiğinde yüklenmesi) değerlendirilmeli.

### 9. 🟠 main.py / fastapi_app.py / apps/*/app.py — üç paralel "gerçek backend" adayı, hangisi asıl belli değil
**Durum:** Bekliyor
**📡 Pi/Offline Notu (karar netleşti):** Artık netlik var — **Pi'ye deploy edilecek
tek şey `fastapi_app.py` (+ ortak iş mantığı modülleri) olmalı.** Streamlit dosyaları
(`main.py`, `apps/*/app.py`) ve tkinter GUI (`apps/earthquake_risk/gui_app.py`)
Pi imajına hiç dahil edilmemeli — sadece geliştirici masaüstünde model/algoritma
denemesi için bir `dev-tools/` klasörüne taşınmalı. Bkz. Bölüm 12 için Streamlit'in
tam olarak neyle/nasıl değiştirileceği.

### 10. 🟡 `main.py`'daki road_damage ekranı, `apps/road_damage/app.py`'den geride
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Madde 9 kararı uygulanırsa (Streamlit prod'dan kalkarsa) bu
madde otomatik olarak anlamsızlaşır — ekstra iş gerektirmez.

---

## Bölüm 3 — FastAPI performans / eşzamanlılık

### 11. 🟠 Sync endpoint'ler + `reload=True` + tek worker
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Pi'de `reload=True`'nun dosya-izleme overhead'i, zaten kısıtlı
CPU'da orantısız pahalı. Ayrıca "kaç worker" sorusu Pi'de dikkatli düşünülmeli: çok
worker açmak (her biri kendi model kopyasını RAM'e yüklerse) RAM'i katlar; **tek worker
+ CPU-bound işler için ayrı bir process havuzu** (ör. `ProcessPoolExecutor`, sadece
inference için, modelin kendisi ana process'te bir kez yüklü kalacak şekilde
paylaşılan bellek/IPC ile) muhtemelen Pi'de "N worker" yaklaşımından daha az bellek
yakar. Ayrıca **backpressure şart:** Pi aynı anda 10-20 telefonun isteğini
karşılayamayabilir; sınırı aşan istekleri 503/429 ile nazikçe reddet, sunucuyu
çökertme/thermal-throttle'a sürükleme.

### 12. 🟠 Aynı bbox için OSM verisi iki ayrı yoldan iki kez çekiliyor
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Online modda gereksiz ağ trafiği zaten kötüydü; offline modda
(local `roads.gpkg` okuma) bu iki kez **SD kart I/O** demek — SD kart hem yavaş hem
sınırlı yazma/okuma ömrüne sahip. Tek okumaya indirmek burada iki kat önemli.

### 13. 🟠 Satellite tile indirme seri (sıralı) yapılıyor
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Bu özellik **sadece internet varken anlamlı** (uydu görüntüsü
indirme). Paralel indirme önerisi geçerliliğini koruyor ama daha önemlisi: bu tür
"sadece online'da işe yarayan" özellikler kod içinde **açıkça** işaretlenmeli
(bkz. madde 33 — yeni, "özellik matrisi") ki offline modda kullanıcıya "şu an bu
özellik yok" net biçimde söylensin, sessizce/yarım hata vermesin.

### 14. 🟡 Hata detayları (`str(e)`) doğrudan istemciye sızdırılıyor
**Durum:** Bekliyor
(Pi bağlamı bu maddeyi değiştirmiyor, öneri aynı kalıyor.)

---

## Bölüm 4 — Model / Inference optimizasyonu

### 15. 🟠 CatBoost modeli diske persist edilmiyor, her process açılışında sıfırdan eğitiliyor
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Artık sadece "performans iyileştirmesi" değil, **dağıtım
gereksinimi**: Eğitilmiş `model.cbm` dosyası, Pi'nin SD kart imajına (veya provisioning
adımında) **önceden yerleştirilmiş** olarak gelmeli. Pi ilk açıldığında (belki hiç
internet olmadan) modelin zaten hazır olması gerekiyor — sıfırdan eğitim, hem yavaş
hem "ilk kurulumda internet lazım mı?" gibi gereksiz bir bağımlılık yaratıyor
(veri `query.csv` da yerelde gömülü olmalı zaten, bkz. Bölüm 9).

### 16. 🟠 `query.csv` hiç budanmıyor — declustering/label üretimi zamanla yavaşlar
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** SD kart I/O ve sınırlı RAM göz önüne alınca bu daha da önemli:
(a) CSV yerine **SQLite** kullan (tek dosya, indeksli, kısmi okuma yapılabilir, flat
CSV'yi her seferinde tamamen belleğe okumak zorunda kalmazsın); (b) periyodik olarak
(ör. cron/systemd timer ile, düşük öncelikli bir arka plan görevi olarak — Pi'nin CPU'su
meşgulken değil) eski veriyi arşivle; (c) declustering/label üretimini **sadece Pi'ye
ilk kurulumda / cloud'da bir kez** çalıştırıp sonucu (hazır eğitilmiş model + işlenmiş
feature tablosu) Pi'ye dağıtmayı düşün — Pi'nin bunu kendi başına yeniden hesaplaması
hiç gerekmeyebilir (bkz. Bölüm 9, "cloud'da eğit, Pi'ye dağıt" modeli).

### 17. 🟠 `_nearest_graph_node` (local_osm.py) tüm graph düğümlerini O(n) lineer tarıyor
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Bu, tam olarak "offline modda Pi'nin CPU'suna en çok yük
bindirecek" türden bir fonksiyon — internet yokken (yani KDTree'ye en çok ihtiyaç
duyulacağı an) devrede. Öncelik yükseltildi.

### 18. 🟡 GPU/CPU inference'ta fp32 kullanılıyor, fp16/autocast değerlendirilmemiş
**Durum:** Bekliyor
**📡 Pi/Offline Notu (önemli revizyon):** Pi'de **GPU/CUDA yok**, dolayısıyla
`torch.autocast("cuda", ...)` önerisi bu bağlamda **geçersiz**. Asıl yapılması gereken:
- **INT8 kuantizasyon + ARM'a özel bir runtime**: `onnxruntime` (ARM64 için resmi
  wheel'leri var) veya `openvino` (Intel dışı ARM desteği sınırlı, dikkatli
  değerlendirilmeli) ya da YOLO modelleri için `ncnn`/`TFLite` export'u — bunlar Pi'de
  saf PyTorch CPU inference'ından kayda değer ölçüde (2-4x) hızlı olabiliyor.
- Segformer (mit_b4 encoder, patch-based 512x512 + %50 overlap) gibi ağır bir model
  Pi CPU'sunda muhtemelen **tek görüntü için onlarca saniye** sürecektir — gerçek Pi
  donanımında erken bir benchmark şart (bkz. Bölüm 10, madde 31).
- BERTurk sınıflandırma + NER modelleri için `distilbert`/daha küçük bir Türkçe model
  varyantına geçmek (mümkünse) veya mevcut modeli `optimum`/ONNX ile kuantize etmek
  ciddi kazanç sağlar.

### 19. 🟡 Zeyrek lemmatization kelime bazlı cache'lenmiyor
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Pi CPU'sunda her cycle değerli — bu ucuz ve kolay bir kazanım,
Pi bağlamında önceliği hafifçe yükseldi (düşük efor / yüksek+ kazanç oranı iyi).

### 20. 🟡 Nominatim rate-limit + çok sayıda query varyasyonu → analiz gecikmesi ve ban riski
**Durum:** Bekliyor
**📡 Pi/Offline Notu (kritik ek):** Nominatim **internet gerektirir** — offline modda
bu adım tamamen devre dışı kalmalı ve **yerel bir geocoding tablosuna** (il/ilçe/mahalle
merkez koordinatları — zaten `tr_locations.py`'de il/ilçe isim listesi var ama
koordinat yok, bunu eklemek gerekiyor) düşmeli. Bu, hem online'daki Nominatim
ban/gecikme riskini azaltır hem de **offline çalışmayı gerçekten mümkün kılar** —
şu anki haliyle offline modda NLP pipeline "konum bulamadı" diye boş dönecektir,
bu da temel bir kullanılabilirlik eksikliği.

---

## Bölüm 5 — Dış servis güvenilirliği

### 21. 🟡 Overpass cache'i sadece process-memory'de, disk'e yazılmıyor
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Bu maddenin çözümü artık **zorunlu ön-koşul**: Pi'ye
dağıtılmadan önce, hedeflenen bölgeler (Hatay, Kahramanmaraş, Gaziantep, Malatya,
Adıyaman — kodda zaten bu 5 şehir hardcoded) için Overpass/OSM verisi **önceden
indirilip Pi imajına gömülmeli** (`build_local_osm_dataset.py` / `download_cities_osm.py`
/ `download_turkey_overpass.py` script'leri tam olarak bunun için var, ama bunların
"Pi provisioning pipeline"ının resmi bir parçası olması gerekiyor, elle bir kerelik
çalıştırılan yardımcı script olarak kalmamalı — bkz. Bölüm 9).

### 22. 🟡 Dış servis çağrılarında tutarlı retry/backoff yok
**Durum:** Bekliyor
(Pi bağlamı önceliği değiştirmiyor, öneri aynı.)

---

## Bölüm 6 — Bağımlılık yönetimi

### 23. 🟠 Hiçbir requirements.txt'te versiyon pin'i yok
**Durum:** Bekliyor
**📡 Pi/Offline Notu — bu madde artık 🔴 KRİTİK'e yükseltilmeli:** Windows'ta
`cykhash` derleme hatasıyla bizzat karşılaştığımız şeyin **aynısı, çok daha yüksek
ihtimalle Raspberry Pi'nin ARM64 (aarch64) mimarisinde de yaşanır.** PyPI'da birçok
paketin (özellikle bilimsel hesaplama/geo yığını: `numpy`, `pandas`, `scipy`,
`shapely`, `pyproj`, `opencv-python`, `torch`) x86_64 için hazır wheel'i olsa da
ARM64 için ya hiç yok ya da farklı/eski bir sürümde var — bu da Pi üzerinde
**saatlerce süren kaynak derlemesi denemeleri veya doğrudan kurulum hatası**
anlamına gelir (SD kart + sınırlı RAM ile derleme büyük ihtimalle pratik değil/
imkânsız). Özellikle **PyTorch**, Raspberry Pi için resmi PyPI yerine
`https://download.pytorch.org/whl/cpu` gibi ayrı bir index'ten veya topluluk
(`piwheels.org` — Raspberry Pi'ye özel önceden derlenmiş wheel deposu) üzerinden
kurulmalı.
**Öneri (genişletildi):**
- Sürüm pinlemeyi Pi'de **fiilen test edilmiş** bir sürüm setiyle yap (masaüstünde
  çalışan sürümler değil).
- `pip install` öncesi **piwheels.org**'u ek index olarak kullanmayı değerlendir
  (`--extra-index-url https://www.piwheels.org/simple`), birçok ağır paket için
  ARM'a özel önceden derlenmiş wheel sağlıyor.
- Pi imajını "altın imaj" (golden image) olarak hazırlayıp SD kart klonlamak,
  her Pi'de sıfırdan `pip install` yapmaktan çok daha güvenilir olur (bkz. Bölüm 9).
- **Bunu erken bir aşamada, gerçek bir Raspberry Pi üzerinde bizzat doğrula** —
  şu an bu risk teorik, ama masaüstünde her şey "sorunsuz" göründüğü için Pi'ye
  geçilene kadar fark edilmeme ihtimali yüksek (tıpkı Windows/cykhash gibi).

### 24. 🟡 4 ayrı requirements.txt birbiriyle senkron değil, "kaynak of truth" belirsiz
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Madde 9 kararıyla (Streamlit/tkinter prod'dan çıkınca) bu
zaten büyük ölçüde sadeleşir — Pi'nin ihtiyaç duyduğu tek bir "prod requirements"
listesi kalır (road_damage'ın eğitim-amaçlı `rasterio`/`albumentations`/`datasets`
paketleri Pi'ye hiç gitmemeli, onlar sadece cloud'daki eğitim ortamında olmalı).

---

## Bölüm 7 — Güvenlik

### 25. 🟡 FastAPI'de CORS/kimlik doğrulama yok, `0.0.0.0:8000`'de açık
**Durum:** Bekliyor
**📡 Pi/Offline Notu:** Artık senaryo netleşti — Pi kendi WiFi'ini yayınlıyor ve
"bağlanan herkese" hizmet verecek. Bu, kısmen **bilinçli bir tasarım** (afet anında
kimlik doğrulama engeliyle insanları geciktirmek istemezsiniz) ama iki risk kalıyor:
(1) Pi'nin hotspot'una bağlanan kötü niyetli biri **ağır endpoint'leri** (road-damage
analizi, risk hesaplama) spam'leyip Pi'nin kısıtlı CPU/RAM'ini tüketip **gerçek
afetzedelerin** hizmete erişimini engelleyebilir (yerel DoS) — bu senaryoda normal
internet güvenliğinden farklı olarak **kaynak korumalı rate-limiting** kritik hale
geliyor (kimlik doğrulama değil, ama "kişi/IP başına dakikada N istek" sınırı şart).
(2) Pi aynı zamanda internet'e bağlıysa, `0.0.0.0:8000`'in yanlışlıkla WAN tarafına
da açık kalmaması için firewall/iptables kuralı gerekiyor (sadece hotspot arayüzünde
dinlemeli, WAN arayüzünde değil — bu bir deployment/infra maddesi, kod değil, ama
mutlaka provisioning checklist'ine girmeli).

### 26. 🟡 Hata mesajı sızıntısı
**Durum:** Bekliyor
(Değişmedi.)

---

## Bölüm 8 — Kod kalitesi / küçük iyileştirmeler

### 27-30. ⚪ (Değişmedi — bkz. önceki analiz: camera_manager thread overhead, logging eksikliği,
map_visualizer.py kopyala-yapıştır, TimeSeriesSplit döngü israfı.)
**📡 Pi/Offline Notu (madde 27 için):** camera_manager.py'deki "her frame yeni thread"
deseni Pi'de daha da pahalı (ARM'da thread oluşturma maliyeti orantısız değil ama
zaten kıt olan CPU bütçesinden çalıyor) — Pi bağlamında bu maddenin önceliği hafifçe
yükseliyor.

---

## Bölüm 9 — (YENİ) Offline/Online Hibrit Mimari ve Senkronizasyon

Şu anki kod, "internet var/yok" ikiliğini **sadece road_damage'ın offline-OSM
checkbox'ında** kısmen ele alıyor. Geri kalan her şey (NLP konum çözümleme, risk
motoru, model eğitimi) internet olduğunu varsayıyor ya da internet yokken sessizce
bozuluyor. Sıfırdan tasarlanması gereken parçalar:

### 31. 🔴 (yeni) "Outbox" desenli senkronizasyon katmanı yok
**Durum:** Bekliyor
Bir telefon, Pi'nin hotspot'una bağlıyken bir afet ihbarı/NLP analizi gönderdiğinde,
bu kayıt **sadece o Pi'nin yerel diskinde** kalıyor. Pi internete çıktığında bu
kayıtların merkezi sunucuya iletilmesi gerekiyor ama böyle bir mekanizma yok.
**Öneri:**
- Pi'de yerel SQLite'ta bir `outbox` tablosu: her yerel olayda (NLP raporu, risk
  sorgusu, road-damage analiz sonucu) bir satır eklenir, `synced=false` ile işaretlenir.
- Arka planda çalışan bir görev (systemd timer / basit bir `asyncio` task), belirli
  aralıklarla internet durumunu kontrol eder; varsa `synced=false` kayıtları merkezi
  sunucuya toplu (batch) gönderir, başarılı olanları `synced=true` yapar.
- Merkezi sunucu tarafında, farklı Pi'lerden gelen benzer/çakışan raporların
  (ör. aynı binanın iki farklı telefon tarafından bildirilmesi) **dedup/birleştirme**
  mantığı gerekiyor — bu Pi'de değil, merkezi sunucuda yapılmalı (Pi'nin görevi
  sadece "gördüğünü ilet", karar merkezi sunucuda).

### 32. 🟠 (yeni) "Cloud'da eğit, Pi'ye dağıt" modeli resmileştirilmeli
**Durum:** Bekliyor
Model eğitimi (CatBoost risk modeli, gelecekte fine-tune edilecek BERT/Segformer/YOLO
modelleri) **Pi üzerinde değil, cloud/geliştirici makinesinde** yapılmalı; Pi sadece
**eğitilmiş, dondurulmuş model dosyalarını** çalıştırmalı. Bunun için:
- Model + işlenmiş-veri artefaktları (`.cbm`, `.pth`, `.pt`, işlenmiş `safety_areas.geojson`/
  `roads.gpkg`, offline geocoding tablosu) için bir **versiyonlama ve dağıtım kanalı**
  gerekiyor (zaten Hugging Face kullanılıyor bazı modeller için — bunu tüm "Pi'ye
  gömülecek statik varlıklar" için standart pratik yap).
- Pi, internet bulduğunda bu kanaldan **"yeni model/veri versiyonu var mı?"** diye
  sorup varsa indirip yerel kopyayı günceller (ama mevcut eski kopya asla silinmemeli/
  bozulmamalı ki güncelleme yarıda kesilirse Pi çalışır durumda kalsın — atomik
  dosya değişimi: yeni dosyayı `.tmp` olarak indir, tamamlanınca `rename` ile değiştir).

### 33. 🟡 (yeni) "Özellik matrisi" — hangi özellik offline'da çalışır, hangisi çalışmaz?
**Durum:** Bekliyor
Şu an kodda hangi özelliğin internete bağımlı olduğu **örtük** (bazı fonksiyonlar
`try/except` ile sessizce boş dönüyor, kullanıcı neden bir şey görmediğini anlamıyor).
Açıkça tanımlanmış bir tablo faydalı olur, örnek:

| Özellik | Internetsiz çalışır mı? | Notlar |
|---|---|---|
| NLP sınıflandırma (BERTurk) | ✅ Evet | Model yerelde |
| NLP konum çözümleme | ⚠️ Kısmi | Nominatim internet ister → madde 20'deki yerel geocoding tablosu şart |
| Risk motoru (CatBoost) | ✅ Evet | Model + veri yerelde (madde 15, 32) |
| Risk verisi güncelleme (Kandilli API) | ❌ Hayır | Sadece internet varken |
| Road damage — uydu görüntüsü | ❌ Hayır | Google/Esri/OAM internet ister |
| Road damage — yol maskesi | ⚠️ Kısmi | Local `roads.gpkg` varsa evet, yoksa Overpass ister |
| Toplanma alanı bulma | ⚠️ Kısmi | Local `safety_areas.geojson` varsa evet |
| Kamera tespiti (YOLO) | ✅ Evet (donanım yeterse) | Tamamen yerel, internet gerekmez |

Bu tablo hem geliştirmeye rehberlik eder hem de (istenirse) `/api/status` endpoint'i
üzerinden mobil uygulamaya döndürülüp Flutter tarafında "şu an bu özellik kullanılamaz"
uyarısı göstermek için kullanılabilir.

---

## Bölüm 10 — (YENİ) Raspberry Pi Kaynak Bütçesi ve Model Uygunluğu

### 34. 🔴 (yeni) Gerçek Pi donanımında erken benchmark yapılmadı (varsayım: yapılmadı)
**Durum:** Bekliyor
Şu ana kadarki tüm performans varsayımları muhtemelen x86_64 geliştirici makinesinde
ölçüldü/varsayıldı. **Öncelik #1 olmalı:** Hedef Pi modelini (Pi 4 4GB/8GB mi, Pi 5 mi?)
netleştirip üzerinde şu ölçümleri erken yap:
- BERTurk sınıflandırma + NER: tek istek başına gerçek gecikme (ms).
- Segformer mit_b4: tek 512x512 patch başına ve tam bir uydu görüntüsü (birden fazla
  patch, %50 overlap) için gerçek süre.
- YOLO x2 (catlak.pt + bina.pt): frame başına gerçek FPS.
- CatBoost eğitimi: mevcut `query.csv` boyutuyla gerçek süre.
- Aynı anda 3-5 telefon bağlıyken RAM/CPU/sıcaklık (thermal throttling var mı?).
Bu ölçümler olmadan Bölüm 4'teki (madde 18) kuantizasyon/ONNX önerilerinin ne kadar
gerekli olduğu bile netleşmez — belki bazı modeller Pi'de zaten kabul edilebilir
hızda çalışır, belki hiçbiri çalışmaz. **Varsayımla ilerlemek yerine ölç.**

### 35. 🟠 (yeni) RAM bütçesi planlaması yok
**Durum:** Bekliyor
Pi 4 (4GB varsayımıyla, işletim sistemi + diğer servisler ~500MB-1GB alır) kullanılabilir
RAM ~3-3.5GB civarı. Yüklenmesi düşünülen modeller: BERTurk sınıflandırma (~500MB-1GB
fp32), BERTurk/harici NER modeli (~500MB-1GB), Segformer mit_b4 (encoder büyük, muhtemelen
300-500MB+), YOLO x2 (küçük modellerse ~50-100MB her biri). Toplamı kolayca 2-3GB'ı bulur
— **hepsi aynı anda belleğe yüklüyse Pi 4 4GB modelinde swap'a düşme/OOM-kill riski
yüksek.**
**Öneri:** Madde 8'deki lazy-load + LRU tahliye burada zorunlu hale geliyor; ayrıca
düşük-RAM Pi modelleri için "hangi modüller aktif" konusunda bir yapılandırma
(ör. `.env` ile `ENABLE_CAMERA_DETECTION=false` gibi) sunmayı düşün — her Pi'nin her
özelliği aynı anda çalıştırması şart olmayabilir (saha ihtiyacına göre bir Pi sadece
"NLP + Risk", başka bir Pi "+ Road Damage" çalıştırabilir).

### 36. 🟡 (yeni) SD kart aşınması ve I/O yavaşlığı
**Durum:** Bekliyor
Şu an kodda SD kart'a sık/gereksiz yazan noktalar var: `catboost_info/` (proje kökünde
zaten oluşmuş, her eğitimde ayrıntılı log/event dosyaları yazıyor — `verbose=False`
olsa da CatBoost bazı meta dosyaları hâlâ yazabilir, kontrol edilmeli), sürekli büyüyen
`query.csv`, process-memory olmayan her türlü dosya-tabanlı cache (madde 21'in çözümü
dahil — dikkatli tasarlanmalı, "her istekte diske yaz" değil "toplu/aralıklı yaz").
**Öneri:** Mümkünse Pi'ye harici bir USB SSD bağlanıp gerçek veritabanı/cache orada
tutulmalı (SD kart sadece OS + salt-okunur statik varlıklar için); en azından sık
yazılan geçici veriler (`/tmp` benzeri) `tmpfs` (RAM-disk) üzerinde tutulmalı.

---

## Bölüm 11 — (YENİ) Ağ/Erişim Mimarisi (WiFi AP + Keşif)

### 37. 🟡 (yeni) Mobil uygulama Pi'yi IP tahmin ederek buluyor — kırılgan
**Durum:** Bekliyor
`quakemind/lib/services/api_config.dart`, sabit bir IP listesi deniyor
(`10.42.0.1:8000`, `192.168.137.1:8000` vb.) — bu, "hangi işletim sistemi hotspot
açtıysa o IP" varsayımına dayanıyor, kırılgan.
**Öneri:** Pi üzerinde **mDNS/Bonjour** (Avahi, Raspberry Pi OS'ta genelde hazır gelir)
ile `quakemind.local` gibi sabit bir hostname yayınla; Flutter tarafında IP tahmini
yerine (ya da ona ek olarak) mDNS keşfi kullan. Bu, Pi'nin hangi ağ yapılandırmasıyla
hotspot açtığından bağımsız, çok daha sağlam bir çözüm.

### 38. 🟡 (yeni) Uygulamayı yüklememiş kullanıcılar için tarayıcı erişimi / captive portal
**Durum:** Bekliyor
Amaç "afet öncesi/sonrası herkese hizmet" ise, Flutter uygulamasını **yüklememiş**
biri de Pi'nin hotspot'una bağlanıp bir şeyler görebilmeli. **Öneri (bkz. Bölüm 12):**
Pi, FastAPI üzerinden statik olarak **Flutter Web build'ini** serve etsin; isteğe
bağlı olarak bir **captive portal** (telefonun "bu WiFi'ye bağlandın, giriş yapmak
için tıkla" bildirimini otomatik açması) kurulumu, bağlanan herkesin uygulamayı hiç
aramadan doğrudan arayüzle karşılaşmasını sağlar. Bu bir altyapı (hostapd/dnsmasq
+ DNS-yönlendirme) konusu, kod değil, ama ürün hedefiyle doğrudan ilgili.

---

## Bölüm 12 — (YENİ) Streamlit Kararı — Ne İle Değiştirelim?

Sorduğun soruya doğrudan cevap: **Evet, Streamlit'i prod/Pi dağıtımından tamamen
çıkarmanı öneririm.** Gerekçe ve alternatif:

**Neden Streamlit bu senaryoda yanlış araç:**
- Her tarayıcı sekmesi/kullanıcısı için **tam bir Python script'i yeniden çalıştırma**
  modeli var (rerun-on-interaction) — Pi'nin kısıtlı CPU'sunda birden fazla telefon
  aynı anda bağlıyken bu model orantısız pahalı.
- Session-state yönetimi tek-process, tek-worker'a göre tasarlanmış; yatay ölçekleme
  ya da "N kullanıcıyı hafif şekilde ağırlama" için değil.
- Zaten mobil uygulama (Flutter) gerçek istemci — Streamlit'in insan kullanıcıya
  gösterdiği arayüz, prod akışında **hiç kullanılmıyor** (madde 9'da tespit edildiği
  gibi zaten main.py ile apps/*/app.py arasında drift var, bakımı da ihmal ediliyor).

**Somut öneri — iki parça:**

1. **Backend:** Sadece `fastapi_app.py` (+ ortak modüller). Zaten mobil istemci bunu
   kullanıyor, ekstra bir şey gerekmiyor — sadece Streamlit'i devre dışı bırakmak
   yeterli.

2. **Tarayıcıdan erişim (uygulamayı yüklememiş kullanıcılar için, madde 38):**
   Flutter zaten **web'e derlenebiliyor** (`flutter build web`). Yani ayrı bir
   frontend teknolojisi öğrenmeye/yazmaya gerek yok — **aynı Flutter kod tabanını
   web'e derleyip statik dosyalar olarak FastAPI'nin kendisinden
   (`fastapi.staticfiles.StaticFiles`) serve edebilirsin.** Bu şu avantajları sağlar:
   - Sıfır ekstra sunucu/servis (Node.js gerekmez), sadece FastAPI zaten çalışıyor.
   - UI mantığı **tek yerde** yaşar (bugün main.py/apps/*/app.py arasındaki drift
     sorununun web tarafında hiç yaşanmayacağı anlamına gelir).
   - Statik dosya servisi, Streamlit'in aksine Pi'de neredeyse sıfır ek CPU/RAM
     maliyetiyle çalışır (dosya okuyup gönderiyor, Python script koşturmuyor).
   - Aynı anda bağlanan çok sayıda telefon için doğal olarak çok daha hafif.

   *Alternatif (Flutter Web istenmezse):* Çok basit, framework'süz bir statik
   HTML/JS sayfası (fetch ile `fastapi_app.py` endpoint'lerini çağıran) da yeterli
   olur — durumun karmaşıklığına göre.

**Streamlit'i tamamen atmak istemiyorsan (geliştirme/demo amaçlı elde tutmak
istiyorsan):** O zaman en azından **açıkça "sadece geliştirici masaüstü için,
asla Pi'ye deploy edilmez"** diye işaretleyip `dev-tools/` gibi ayrı bir klasöre
taşı; kök `requirements.txt`'ten Streamlit'i çıkarıp `requirements-dev.txt`'e taşı
ki Pi imajı yanlışlıkla Streamlit'i de kurmasın.

---

## Öncelik Sırası (Pi/offline-first bağlamına göre yeniden yazıldı)

1. **Madde 34** — Gerçek Pi donanımında erken benchmark. Bunu yapmadan diğer birçok
   karar (madde 18 kuantizasyon, madde 35 RAM bütçesi, hatta madde 1'in "ultralytics
   ekle" kararı) varsayıma dayalı kalır.
2. **Madde 23** — Bağımlılık/ARM wheel riski. Pi'ye geçmeden önce doğrulanmazsa,
   cykhash/Windows tekrarı ama saha ortamında yaşanır.
3. **Madde 9 + 12** — Streamlit/tkinter'ı prod kapsamından çıkarma kararı ve
   Flutter Web ile değiştirme. Bu karar netleşince madde 8, 10, 24'ün çoğu
   kendiliğinden sadeleşiyor.
4. **Madde 31 + 32** — Senkronizasyon mimarisi ve "cloud'da eğit, Pi'ye dağıt"
   modeli. Bunlar olmadan "afet öncesi/sonrası, internet olsun olmasın" hedefi
   kâğıt üzerinde kalır.
5. **Madde 3 + 20 + 33** — Offline/online geçişinin otomatik algılanması, yerel
   geocoding, özellik matrisi. Kullanıcı deneyiminin "internet yokken de tutarlı"
   olmasını sağlayan üçlü.
6. **Madde 5 + 15 + 16** — Risk motorunun Pi'de sıfırdan eğitilmemesi (önceden
   eğitilmiş model + budanmış veri seti gömülü gelmeli).
7. **Madde 4 + 35** — RAM bütçesi ve modül tekilleştirme (OOM riskini azaltmak).
8. Geri kalan performans/güvenlik/kod-kalitesi maddeleri (11-14, 17-22, 25-30,
   36-38) bu temeller oturunca çok daha az riskli ve hızlı ilerler.
