# QuakeMind — Backend onarımı ve konsola taşıma planı

Bu belge, mevcut backend + eski web'in yeni konsola taşınmasını ve yol boyunca
düzeltilecek bozuklukları sıraya koyar. Kurallar `CLAUDE.md`'de, mimari
`MIMARI.md`'de, tasarım `ARAYUZ_KARARLARI.md`'de.

Başlangıç: 20 Eylül 2026 · Yöntem: her fazın ölçülebilir bir çıkış ölçütü var,
ölçüm yapılmadan "düzeldi" denmez (kural 8).

---

## Faz 0 — Envanter ve taban çizgi (20 Eylül, yapıldı)

Bugün ölçülenler:

| Bulgu | Ölçüm | Kaynak |
|---|---|---|
| Uç sayısı | 44 uç, tek dosyada 2.633 satır | `fastapi_app.py` |
| **Yetki kontrolü hiç yok** | `Depends(` sayısı: **0** | `fastapi_app.py` |
| **Giriş, bilinmeyen e-postayı otomatik kaydediyor** | `auth_login` → kullanıcı yoksa oluşturur | `:2321` |
| **Rol istemciden geliyor** | `"role": req.role` (kayıt ve girişte) | `:2284`, `:2321` |
| Token imzasız, süresiz | `token-<rastgele hex>`, kullanıcı kaydında duruyor | `:2284` |
| Kalıcı olmayan durum | 6 bellek içi kap: SOS çağrıları, ekip atamaları, enkaz bildirimleri, NLP konumları, bildirimler, sohbet | `:238–2562` |
| PostGIS | **çevrimdışı** (makinede PostgreSQL servisi yok), sistem fallback modunda | `/api/postgis/status` |
| Analiz sonucu ucu | 17,6 MB (16 MB base64 görsel) → seçenek eklendi, özet 2 KB | J-32 |
| Eski web yoklaması | sekme başına ~65 istek/dk | `MIMARI.md` §11 |
| Canlı akış | `/api/live` kuruldu, iş durumu + yeni analiz + yeni SOS yayında | 20 Eyl |

Sonuç: backend'in **iş mantığı** (çıkarım, güzergâh, ısı) çalışıyor; kırık olan
**kimlik, yetki ve kalıcılık** katmanı ile veri taşıma biçimi.

---

## Faz 1 — Kalıcı depo (yerelde SQLite, üretimde PostGIS) — **YAPILDI (20 Eyl)**

**Sorun.** Sunucu yeniden başlayınca SOS çağrıları, ekip atamaları ve kullanıcılar
siliniyor. Bu makinede PostgreSQL kurulu değil, bu yüzden bugün her şey bellekte.

**Yapılacak.** Tek bir depo arayüzü (`depo/`): `kullanicilar`, `damage_points`,
`sos_cagrilari`, `ekipler`, `yol_kapanmalari`, `isler`. Uygulama arayüze bağlanır;
sürücü PostGIS varsa PostGIS, yoksa yerel SQLite dosyası olur. Mekânsal sorgular
(bbox, yakınlık) iki sürücüde de aynı imzayla durur.

**Çıkış ölçütü.** Sunucu yeniden başlatıldıktan sonra açılan SOS çağrısı, atanan
ekip ve kayıtlı kullanıcı **kayıp değil**. Ölçüm: 5 kayıt yaz → yeniden başlat →
5 kaydı oku.

**Sonuç.** `depo/` yazıldı (`sqlite_surucu.py`): kullanıcılar, oturumlar, hasar
noktaları, SOS çağrıları, ekipler, yol kapanmaları; WAL kipi, tek yazar kilidi,
zaman/konum indeksleri. Üç kullanıcı komut satırından açıldı, sunucu iki kez
yeniden başlatıldı, kayıtlar duruyor ve girişte kullanılıyor. Mükerrer sevk
`UPDATE ... WHERE durum='bekliyor'` ile veritabanı düzeyinde engelleniyor.

---

## Faz 2 — Kimlik ve yetki (yeni uçlar; eskiye dokunulmaz) — **YAPILDI (20 Eyl)**

**Sorun.** Bugün herkes, herhangi bir e-posta ve şifreyle, istediği rolde girebiliyor;
44 ucun hiçbirinde yetki kontrolü yok.

**Yapılacak.**
- `/api/oturum/giris`, `/api/oturum/yenile`, `/api/oturum/cikis`, `/api/oturum/ben`
- Kısa ömürlü imzalı erişim token'ı + httpOnly çerezde yenileme token'ı; token URL'de taşınmaz
- Şifre bcrypt; **rol yalnız depodan** okunur, kayıt ucu rol kabul etmez
- `Depends(kullanici)` ve `Depends(rol_gerektir(...))` her yeni uçta
- Kayıt düzeyinde kontrol: afetzede yalnız kendi çağrısını görür, ekip yalnız kendi görevini bırakır
- Eski `/api/auth/*` uçları **olduğu gibi** kalır (eski web bozulmasın), "kullanımdan kalkacak" diye işaretlenir

**Çıkış ölçütü.** Token'sız istek 401, yanlış rol 403; kayıt ucuna `"role":"admin"`
göndermek rolü değiştirmiyor. Ölçüm: üç uç için istek/yanıt kaydı.

**Ölçülen sonuç (20 Eyl, `/api/oturum/*`):**

| Deneme | Sonuç |
|---|---|
| Doğru şifreyle giriş | 200 · imzalı erişim jetonu + httpOnly yenileme çerezi |
| Yanlış şifre | 401 |
| Bilinmeyen e-posta (eskiden otomatik hesap açıyordu) | 401 |
| Jetonsuz `/ben` | 401 |
| Kayıt isteğine `"rol":"yonetici"` eklemek | Hesap **afetzede** açıldı |
| Koordinatörün rol değiştirme denemesi | 403 |
| Tarayıcıda jeton saklama | localStorage/sessionStorage **0 anahtar**, çerez JS'ten görünmüyor |
| Sayfa yenileme | Oturum korunuyor, tek `/yenile` isteği |

Yenileme jetonu her kullanımda döndürülüyor (eskisi iptal). Bu yüzden istemcide
tek-uçuş kuralı var: aynı anda iki yenileme isteği gitmiyor.

Eski `/api/auth/*` uçları dokunulmadı ve çalışmaya devam ediyor (ölçüldü).

---

## Faz 3 — Ortak sözleşme uçları — **YAPILDI (20 Eyl)**

**Sorun.** Konsolun beklediği uçlar yok; paneller "veri yok" yazıyor.

**Yapılacak.** `(konum, skor, güven, zaman, kaynak)` sözleşmesine oturan uçlar:
`/api/hasar-noktalari`, `/api/sos`, `/api/ekipler`, `/api/ozet` — hepsi zaman
penceresiyle süzülür, sayılar sunucuda hazırlanır.

**Çıkış ölçütü.** Konsolun genel durum ve SOS panelleri gerçek sayı gösteriyor;
`/api/ozet` yanıtı < 5 KB ve p95 < 200 ms.

**Yazılan uçlar** (`uclar/sozlesme.py`, hepsi `Depends` ile korumalı):
`GET /api/hasar-noktalari` · `GET|POST /api/sos` · `POST /api/sos/{id}/ata` ·
`POST /api/sos/{id}/kapat` · `GET /api/sos/{id}/en-yakin-ekip` · `GET /api/ekipler` ·
`PUT /api/ekipler/{id}` · `POST /api/ekipler/{id}/konum` · `GET /api/ozet`

Birim kararı: API dışarıya **milisaniye** verir/alır (JavaScript'in zamanı), depo
saniye tutar; çevirme yalnız uç katmanında.

**Ölçülen sonuç (20 Eyl, 20 istek):**

| Uç | Ortanca | p95 | Yanıt |
|---|---|---|---|
| `/api/ozet` | 4,7 ms | 8,9 ms | 0,1 KB |
| `/api/sos` | 5,2 ms | 5,9 ms | 0,4 KB |
| `/api/ekipler` | 4,3 ms | 5,8 ms | 0,1 KB |
| `/api/hasar-noktalari` | 5,9 ms | 6,3 ms | 0,3 KB |

| Davranış denemesi | Sonuç |
|---|---|
| Jetonsuz `/hasar-noktalari`, `/ozet` | 401 |
| Afetzede `/ozet` çağırıyor | 403 |
| Afetzede `/sos` çağırıyor | Yalnız kendi çağrıları (boş liste) |
| Aynı çağrıya ikinci sevk | 409 (veritabanı düzeyinde engel) |
| En yakın ekip | AKUT 1 · 1.356 m (haversine, sunucuda) |

**Konsol tarafı.** SOS kuyruğu gerçek çağrıları listeliyor, süzgeçler (bekleyen /
kritik / atanan / tümü) çalışıyor, seçili çağrıda en yakın ekip ve **Ekip gönder**
düğmesi var; sevk sonrası liste ve sayılar canlı akışla tazeleniyor. Veri
kaynakları paneli artık her kaynağın o anki durumunu yazıyor.

Yol boyunca bulunan hata: ısı kanalı sayımı iki kaynaktan toplanıyordu (aynı çağrı
hem nokta hem çağrı olarak), sayım tek kaynağa (`/api/ozet`) indirildi.

---

## Faz 4 — Doğru çalışmayanları düzeltme — **YAPILDI (20-21 Eyl)**

| Bulgu | Düzeltme | Ölçülen sonuç |
|---|---|---|
| CatBoost her süreçte ilk risk isteğinde eğitiliyor, diske yazılmıyor | Eğitim ayrı komut (`araclar_risk_egit.py`), model + künye dosyaya yazılıyor, API yalnız yüklüyor | Eğitim 5,1 sn (tek sefer), model 3,2 MB |
| Risk isteği her seferinde motoru baştan kuruyordu (`risk_bridge` yeni motor açıyordu) | Tek motor paylaşılıyor; hazırlanmış çerçeveler diske önbelleklendi | **38,8 sn → ortanca 168 ms** (ilk soğuk istek 1,7 sn) |
| Her istekte sunucu tarafında Folium HTML haritası üretiliyordu (kimse kullanmıyor) | `harita_html=False` varsayılan; Streamlit isterse açıyor | ~0,7 sn/istek kazanç |
| Fay GeoJSON'u her istekte yeniden ayrıştırılıyordu | Dosya başına önbellek + süzme önbelleği | 0,45 sn × 2 → 0 |
| Isı haritası nokta başına tüm ızgarayı geziyordu | Bilinear dağıtım + tek ayrılabilir Gauss | **20 bin noktada 15,8 sn → 14,7 ms (1.079×)**; hücre başına en büyük fark tepe değerin %0,5-1,3'ü |
| Isı, istek başına maksimuma göre ölçekleniyordu | Mutlak ölçek; referans yanıtta yazıyor | `olcek: {tip: "mutlak", referans: 3.0}` |
| Isı ucu PostGIS yoksa boş dönüyordu | Yerel depodan okuyor | 2 SOS noktası → 158 hücre |
| PostGIS yoklaması istek yolunda 2 sn zaman aşımına düşüyordu | Sonuç 30 sn önbellekli + açılışta ayrı iş parçacığında | **4,0 sn → 11 ms** |
| YOLO modelleri açılışta API sürecine yükleniyordu | Tembel yükleme (ilk kamera isteğinde) | API süreci **932 MB → 571 MB** |
| Tanı görselleri JSON içinde base64, iş deposunda bellekte (20 iş × ~16 MB) | Diske yazılıyor, `GET /api/road_damage/gorsel/{id}/{ad}` ile alınıyor; eski istemci için base64 istenince diskten üretiliyor | Özet yanıtı **1,3 KB**; tek görsel 69 ms |

---

## Faz 5 — API'yi bölme ve olayları yayma — **YAPILDI (21 Eyl)**

`fastapi_app.py` (2.859 satır) → `APIRouter` modülleri. Yeni SOS, ekip konumu,
iş durumu ve yeni analiz olayları canlı akışta.

**Çıkış ölçütü.** Tek dosyada 500 satırdan fazla uç kalmaz; her modülün kendi testi.

**Yöntem.** Bölme elle değil bir AST betiğiyle yapıldı: uç fonksiyonları yol
önekine göre modüllere taşındı, paylaşılan duruma yapılan her serbest başvuru
`ck.<isim>` olarak yeniden yazıldı (`from cekirdek import x` değeri import anında
dondurur; lifespan ve tembel yükleyiciler sonradan değiştirdiğinde uç eski değeri
görürdü). Yorumlar ve biçim korundu.

**Yeni yapı:**

| Dosya | Satır | İçerik |
|---|---|---|
| `fastapi_app.py` | 61 | Uygulamayı kurar, router'ları bağlar |
| `cekirdek.py` | 1.323 | Paylaşılan durum, yardımcılar, veri modelleri, lifespan (uç yok) |
| `uclar/rota.py` | 393 | Rota, güvenli rota, toplanma alanları, enkaz |
| `uclar/kapanma.py` | 328 | Kapanma simülasyonu, EMSR/maske, karşılaştırmalar |
| `uclar/hasar_analiz.py` | 306 | Analiz işi, durum, görseller, segmentler, ısı |
| `uclar/sozlesme.py` | 299 | Ortak sözleşme uçları |
| `uclar/kamera.py` | 207 | Kamera tespiti |
| `uclar/risk.py` | 167 | Deprem riski |
| `uclar/eski_kimlik.py` | 148 | Eski `/api/auth/*` (konsol devralınca silinecek) |
| diğer 7 modül | 79-102 | canlı, genel, metin, bildirim, ekip, eski SOS, oturum |

**Ölçülen sonuç:**

| Denetim | Sonuç |
|---|---|
| Uç kümesi (OpenAPI: yöntem, yol, parametre, gövde) | 61 = 61, fark yok |
| Duman testi (57 istek, durum kodu + yanıt anahtarları) | **0 fark** |
| Statik denetim (pyflakes, tanımsız isim) | 0 |
| Gerçek analiz işi uçtan uca | 202 → 56 ilerleme olayı → bitti → segment + görsel; kapalı segment sayısı bölme öncesiyle aynı (14) |

Referans imza depoda: `testler/uc_imzalari.json`; araç `araclar_uc_duman_testi.py`.
Not: "her modülün kendi testi" ölçütü duman testiyle karşılanıyor (her modülün
uçları kapsamda); birim testleri henüz yok.

**Yol boyunca bulunan (J-33):** sağlık kontrolü `/api/status`, `nlp` alanı için
tembel yükleyiciyi çağırıyordu — ilk sağlık kontrolü BERTurk'ü belleğe alıyordu;
`camera` alanı ise kontrol edilmeden `true` dönüyordu. Artık hiçbir model
yüklenmiyor (13 ms), alanlar dosya/bellek durumundan hesaplanıyor, hangi modelin
bellekte olduğu ayrı `yuklu` alanında.

---

## Faz 6 — Kalan ekranların konsola taşınması

| Eski ekran | Yeni konsol karşılığı | Durum |
|---|---|---|
| `/command/road-damage` | **Hasar analizi modu** | 20 Eyl'de taşındı (alan seçimi, Wayback tarihi, OAM arama, sonuç haritada) |
| `/command/map` | Genel durum modu | **Taşındı** (21 Eyl): KPI'lar, dört kanallı ısı haritası, kapalı yol katmanı |
| `/command/sos` | SOS kuyruğu modu | **Taşındı**: kuyruk, süzgeçler, en yakın ekip, sevk |
| `/command/road-damage` (2. sekme) | Toplanma alanları katmanı | Bekliyor (AFAD ucu) |
| `/command/camera` | Kamera modu | **Taşındı**: fotoğraf yükleme, tespit listesi, işaretli görsel |
| `/command/nlp` | Metin modu | **Taşındı**: kategori, konum, aciliyet, adres adayları |
| `/command/risk` | Risk modu | **Taşındı**: skor, üç bileşen, yakın faylar, son depremler |
| `/survivor`, `/survivor/camera` | Afetzede ekranı | **Taşındı**: konumla çağrı açma, kendi çağrılarının durumu (kamera bekliyor) |
| `/login`, `/onboarding` | Giriş ekranı | **Taşındı**: gerçek JWT akışı (Faz 2) |

Kalan: toplanma alanları katmanı (AFAD ucu), yol ve rota modu (A* uçları hazır,
konsol paneli bekliyor), afetzede kamera ekranı.

---

## Faz 7 — Performans ve ölçüm bütçeleri

ONNX Runtime'a geçiş, BERT int8, SegFormer toplu pencere, ızgaranın ikili taşınması,
vektör karo eşikleri. `MIMARI.md` §10'daki bütçeler ölçülür: INP < 200 ms, mod
geçişi < 200 ms, 10 bin noktada 60 fps, LCP < 2,5 s, sekme başına istek ≈ 0.

---

## Sıra ve gerekçe

1. **Faz 1 (depo)** — kimlik de, SOS de kalıcı bir yere yazmadan doğru çalışamaz.
2. **Faz 2 (kimlik)** — bugün sistemde kimlik yok; ürün konuşulacaksa ilk kapatılacak açık.
3. **Faz 3 (sözleşme uçları)** — konsolun boş panelleri ancak bununla dolar.
4. **Faz 4 (bozuk davranışlar)** — ölçülebilir, tek tek kapatılır.
5. Sonrası: bölme, kalan ekranlar, performans.

Karar bekleyen: yerelde **SQLite** sürücüsü (kurulum gerektirmez) kabul mü, yoksa
PostgreSQL/PostGIS kurulumu mu şart koşulsun? Plan SQLite'ı geçici sürücü olarak
alıyor; PostGIS yolu kapanmıyor.
