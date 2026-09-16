> ## 📌 DEVİR NOTU — 16 Eylül 2026
>
> Bu liste ve makale başka bir ekip üyesine devredilmek üzere güncellendi. Okumaya buradan başlayın.
>
> **Devralan kişi için:** Listede geçen "kullanıcı", Furkan Emre İnce'dir. Aşağıdaki tabloda adı geçen araçlar
> (`araclar/`), yedekler ve `QuakeMind_Proje_Repo` altındaki belgeler Furkan'ın bilgisayarındadır; **henüz depoya
> gönderilmedi** (commit/push yapılmadı). Gerekirse Furkan'dan isteyin.
>
> **Dosyalar (hepsi `Desktop\2209-A Afet\` altında):**
>
> | Dosya | Ne |
> |---|---|
> | `QuakeMind_makale\makale\MAKALE_TASLAK_TR (1).docx` | **Geçerli makale.** Kök dizindeki `MAKALE_TASLAK_TR.md/.docx` ve e-postayla dolaşan kopyalar eskidir. |
> | `QuakeMind_makale\makale\MAKALE_DUZELTME_LISTESI.md` | **Bu liste** (M-01…M-96, etiketli). Kök dizindeki 48 maddelik kopya eskidir. |
> | `QuakeMind_makale\makale\araclar\` | Belgeyi alan kodlarını bozmadan düzenleyen araçlar — önce `BENIOKU.md`. |
> | `QuakeMind_makale\makale\... - YEDEK_*_oncesi.docx` | Her düzenleme adımından önceki yedekler (geri dönmek için). |
> | `QuakeMind_Proje_Repo\MAKALE_KUNYE_BILGILERI.md` | Yazarlar, CRediT, donanım, yazılım sürümleri, başvuru no, drone görüntü künyesi. |
> | `QuakeMind_Proje_Repo\SIMULASYON_DEVIR_BELGESI.md` | Simülasyonun nasıl çalıştığı ve 16 Eylül sonuçları (Bölüm 12–15). |
> | `QuakeMind_Proje_Repo\EKSIKLER_VE_SORUNLAR.md` | Proje geneli takip (kod, depo, J-28…J-31 deney kayıtları). |
> | `QuakeMind_Proje_Repo\QuakeMindBackend\benchmark\runs\{multi_seed, multi_seed_refs, model_gercek_dunya}` | Makaledeki tüm senaryo sayılarının kaynağı. |
>
> **Durum:** 79 ✅ · 11 ⚠️ · 6 ☐ (M-44 bu gece tamamlandı — bkz. madde metni). Kalan işler, kim yapabilir ve önkoşulları → **"KALAN İŞLER"** bölümü.
>
> **Nereden başlamalı:** hemen aşağıdaki **🏷️ ETİKET DİZİNİ** maddeleri gruplara ayırır (kalanlar, sizin
> yapmanız gerekenler, soru bekleyenler, kimlik/ORCID gerekenler, eğitim gerekenler, simülasyondan doğanlar,
> sonradan eklenenler, yapılanlar). Her maddenin başlığının altında da aynı etiketler yazılı.
>
> **16 Eylül'de yapılanlar (özet):** simülasyon sonuçları işlendi (8 ilçe / 11 karargâh, 10 tohum,
> EMSR648 × üç kural, R1/R2/R1+R2, görev tabanlı değerlendirme — olumsuz sonuç); kural adları koşulan koda
> uyduruldu (M-76); Tablo 2, 4, 10, 12 ve 16–20 yeniden kuruldu (güncel numaralarla); Bölüm 3.8.1 ve 3.9 (Algoritma 2 ve 3) yazıldı; donanım,
> yazarlar, CRediT, başvuru numarası, depo adresi, kurumlar ve drone görüntü kaynağı eklendi; çapraz başvurular
> iki geçişte güncellendi ve 12 ek uyumu hatası düzeltildi.
>
> **16 Eylül akşamı (kullanıcı yokken, verdiği yetkiyle) yapılanlar:** M-87 (iki şekil gömüldü), M-65 (Algoritma 1
> koda hizalandı), M-66, M-86 (Tablo 2'ye eğitim ve metin kümeleri), M-74 (kaynakçada DOI/URL'siz kayıt kalmadı,
> tüm bağlantılar denetlendi), M-28 (Tablo 13'e GFLOPs ve CPU süresi, yerel ölçüm) kapandı. Doğrulama sırasında
> altı yeni sorun bulunup kapatıldı: **M-89** (4.2'deki karolama/eleme anlatımı gerçeğe uymuyordu), **M-90** (Şekil 7
> yanlış başlıklı ve karşılaştırılamaz bir çubuk içeriyordu; Şekil 7–8 yeniden çizildi), **M-91** (Tablo 6'daki
> DeepLabV3+ ve PSPNet ayarları koşulanla uyuşmuyordu), **M-92** (iki ek hatası; yeni `ek_uyumu_genis.py`), **M-93** (şekil başlıklarının yerleşimi), **M-94** (bayat şekil aralığı, yanlış yerde dipnot). Şekil 12 üretildi (M-43); Şekil 13, 14, 15, 16, 18 Türkçe karakterli ve 300 dpi yeniden çizildi (M-44).
> **Lisans uyarısı:** MEDBFS ve Maxar/Vantor açık verisi **CC BY-NC 4.0** (ticari olmayan kullanım); KATE-CD'nin
> lisansı veri kartında yok. Dergi/lisans seçiminde dikkate alınmalı.
>
> **Bilinmesi gereken kurallar:**
> - **Sarı vurgu = 16 Eylül'de değişen metin.** Önceki oturumun **kalın** işaretli cümleleri de ayrıca
>   gözden geçirilmeli. Onaydan sonra vurgu temizlenir (M-85).
> - **Tablo numaraları bir kaydı** (yeni Tablo 10). Madde başlıkları eski numarayı korur; karşılık tablosu
>   hemen aşağıda.
> - **Kural adları koddaki anlamdadır:** katı = yalnız Destroyed, orta = + Damaged, gevşek = + Possibly
>   damaged. "Dengeli kural" yoktur.
> - **Senaryodaki "önerilen sistem" kusursuz kapanma bilgisiyle çalışır (≙ R3)**; algılama hatasının etkisi
>   yalnız Tablo 19'dadır.
> - **Eski rakamlar geçersiz:** 206,6 / 1 641,0 / %87,4 / %94,8 / 74,4. Güncel değerler Tablo 17–18'de.
> - **Belge Word'de açıkken betik çalıştırmayın.** Word'le alan güncellemesi **iki kez** yapılmalı.
> - Ek denetimi için **iki araç birlikte** çalıştırılmalı: `ek_uyumu.py` (alan sonrası -DA/-DAn/-DAki) ve
>   `ek_uyumu_genis.py` (tüm ekler, tüm metin).
> - **Hiçbir şey commit/push edilmedi** (makale dalı `55a50d1` üzerinde yerel değişiklik; kullanıcı kararı).
> - **Özel Türkçe metin kümesi (M-47)** yazarlarca sonra konuşulacak; belgedeki işaret bilerek bırakıldı.
> - **Güvenlik:** `model_benchmarks/03_yer_seviyesi/local_colab_run/` içinde Roboflow API anahtarı açık yazılı
>   (`QuakeMind_Proje_Repo\EKSIKLER_VE_SORUNLAR.md`, D-08). Depo herkese açılmadan önce anahtar Roboflow'dan
>   **yenilenmeli**.

<!-- ETIKET-DIZINI-BASLA -->

## 🏷️ ETİKET DİZİNİ — maddeler gruplara göre (16 Eylül 2026)

> Bu bölüm `araclar/liste_etiketle.py` ile **otomatik** üretilir; elle düzenlemeyin. Grupları
> `araclar/veri/etiketler.json`'da değiştirip betiği yeniden çalıştırın. Her maddenin başlığının hemen
> altında da aynı etiketler yazılıdır. Bir madde birden fazla grupta olabilir.

| Etiket | Anlamı |
|---|---|
| ✔ YAPILDI | Madde tamamlandı (başlıkta ✅) |
| ◐ KISMEN | Bir kısmı yapıldı, kalan kısmı var (başlıkta ⚠️) |
| ✖ YAPILMADI | Hiç yapılmadı (başlıkta ☐) |
| ⏳ KALAN | KISMEN + YAPILMADI: hâlâ iş bekleyen maddeler |
| 🆕 SONRADAN EKLENDİ | 12 Eylül'deki ilk 48 maddelik listeden sonra eklenen madde (tarih grubuyla) |
| 👥 SİZ YAPMALISINIZ | Yazarların ya da danışmanın bilgisi, kararı, onayı ya da Colab koşumu gerekiyor |
| ❓ SORU/KARAR | Cevap bekleyen açık bir soru var (soru, maddenin altında yazılı) |
| 🪪 KİMLİK/İSİM/NUMARA | İsim, ORCID, e-posta, kişi, dergi adı gibi künye bilgisi gerekiyor |
| 🖥️ EĞİTİM/KOŞUM GEREKİR | Model eğitimi, GPU ya da senaryo/arka uç koşumu olmadan kapanmaz |
| 🧪 SİMÜLASYONDAN | Senaryo simülasyonundan doğan ya da onun sonuçlarıyla güncellenen madde |
| 🔍 KONTROL EDİN | Tamamlandı, ama bir yazarın gözle doğrulaması önerilir |

**Özet:**

| Grup | Adet |
|---|---|
| Toplam madde | 96 |
| ✔ Yapıldı | 79 |
| ◐ Kısmen | 11 |
| ✖ Yapılmadı | 6 |
| ⏳ Kalan (kısmen + yapılmadı) | 17 |
| 👥 Sizin yapmanız gereken | 15 |
| ❓ Soru / karar bekleyen | 12 |
| 🪪 Kimlik / isim / numara gereken | 7 |
| 🖥️ Eğitim / koşum gereken | 9 |
| 🧪 Simülasyondan doğan | 28 |
| 🆕 Sonradan eklenen | 48 |
| 🔍 Yapıldı, kontrol önerilen | 10 |

### ⏳ Kalan maddeler (yapılmadı + kısmen) — 17 madde

| Madde | Önem | Konu | Diğer etiketler |
|---|---|---|---|
| ☐ **M-21** | 🟠 | Tablo 5 — Etiketli yol hasarı eğitim kümesi künyesi | 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA · 🖥️ EĞİTİM/KOŞUM GEREKİR |
| ⚠️ **M-23** | 🔴 | Tablo 13 (belgede Tablo 14) — Kapanma katmanının yer gerçeğine göre değerlendirilmesi | 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🖥️ EĞİTİM/KOŞUM GEREKİR · 🧪 SİMÜLASYONDAN |
| ☐ **M-24** | 🟡 | Tablo 14 (belgede Tablo 15) — Bölgeler arası genelleme | 👥 SİZ YAPMALISINIZ · 🖥️ EĞİTİM/KOŞUM GEREKİR |
| ⚠️ **M-27** | 🟡 | Tablo 20 (belgede Tablo 21) — Bileşen çıkarma ve parametre duyarlılığı | 🖥️ EĞİTİM/KOŞUM GEREKİR · 🧪 SİMÜLASYONDAN |
| ⚠️ **M-30** | 🟡 | Gecikme ölçümleri n = 2 | 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🖥️ EĞİTİM/KOŞUM GEREKİR · 🧪 SİMÜLASYONDAN |
| ⚠️ **M-41** | ⚪ | Çapraz başvurular alan kodu değil, sabit metin |  |
| ☐ **M-42** | 🟠 | Hedef dergi seçilmemiş; Öz ve Abstract iki katından uzun | 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA |
| ⚠️ **M-43** | 🟠 | On bir şekil üretilmemiş | 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🖥️ EĞİTİM/KOŞUM GEREKİR · 🧪 SİMÜLASYONDAN |
| ⚠️ **M-45** | 🟠 | Sekiz `[EKLENECEK]` alanı | 👥 SİZ YAPMALISINIZ · 🪪 KİMLİK/İSİM/NUMARA |
| ⚠️ **M-47** | 🟠 | Veri erişilebilirliği beyanı — özel veri kümesi | 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA |
| ⚠️ **M-57** | 🟠 | Tablo 13'te (belgede Tablo 14) `τ` sütunu `[ÖLÇÜLECEK]` olarak yanlış etiketlenmiş | 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🖥️ EĞİTİM/KOŞUM GEREKİR |
| ⚠️ **M-59** | 🟡 | Eksik standart bölümler — Kısaltmalar/Simgeler | 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR |
| ⚠️ **M-62** | 🟠 | Bölüm 3.5 (YOLOv8) için veri kümesi ve eğitim protokolü tamamen yok | 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA · 🖥️ EĞİTİM/KOŞUM GEREKİR |
| ⚠️ **M-70** | ⚪ | Model ağırlığı adında yazım hatası + anonimlik riski | 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA |
| ☐ **M-85** | ⚪ | Sarı vurguların temizlenmesi | 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 👥 SİZ YAPMALISINIZ |
| ☐ **M-88** | ⚪ | Belge Word 2010 uyumluluk modunda | 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR |
| ☐ **M-96** | 🟠 | Tablo 13'te SegFormer satırının başarım hücreleri boş — aynı bölmede yeniden değerlendirme gerekiyor | 🆕 SONRADAN EKLENDİ (16 Eylül akşamı) · 👥 SİZ YAPMALISINIZ · 🖥️ EĞİTİM/KOŞUM GEREKİR |

### 👥 Sizin (yazarlar / danışman) yapmanız gerekenler — 15 madde

| Madde | Önem | Konu | Ne gerekiyor |
|---|---|---|---|
| ☐ **M-21** | 🟠 | Tablo 5 — Etiketli yol hasarı eğitim kümesi künyesi | etiketleme kararı ve künye |
| ⚠️ **M-23** | 🔴 | Tablo 13 (belgede Tablo 14) — Kapanma katmanının yer gerçeğine göre değerlendirilmesi | Tablo 14 kalsın mı, kaldırılsın mı |
| ☐ **M-24** | 🟡 | Tablo 14 (belgede Tablo 15) — Bölgeler arası genelleme | Colab'da yeniden eğitim |
| ⚠️ **M-30** | 🟡 | Gecikme ölçümleri n = 2 | arka uç koşumuna onay |
| ☐ **M-42** | 🟠 | Hedef dergi seçilmemiş; Öz ve Abstract iki katından uzun | hedef dergi |
| ⚠️ **M-43** | 🟠 | On bir şekil üretilmemiş | şema çizimleri, harita, Şekil 10 kararı |
| ⚠️ **M-45** | 🟠 | Sekiz `[EKLENECEK]` alanı | ORCID ve sorumlu yazar |
| ⚠️ **M-47** | 🟠 | Veri erişilebilirliği beyanı — özel veri kümesi | erişim politikası |
| ⚠️ **M-57** | 🟠 | Tablo 13'te (belgede Tablo 14) `τ` sütunu `[ÖLÇÜLECEK]` olarak yanlış etiketlenmiş | M-23 kararına bağlı |
| ⚠️ **M-59** | 🟡 | Eksik standart bölümler — Kısaltmalar/Simgeler | dergi isterse Öne Çıkanlar |
| ⚠️ **M-62** | 🟠 | Bölüm 3.5 (YOLOv8) için veri kümesi ve eğitim protokolü tamamen yok | modeli eğiten kişinin teyidi |
| ⚠️ **M-70** | ⚪ | Model ağırlığı adında yazım hatası + anonimlik riski | çift kör hakemlik kararı |
| ☐ **M-85** | ⚪ | Sarı vurguların temizlenmesi | sarı yerlerin onayı |
| ☐ **M-88** | ⚪ | Belge Word 2010 uyumluluk modunda | dergi şablonuna geçiş |
| ☐ **M-96** | 🟠 | Tablo 13'te SegFormer satırının başarım hücreleri boş — aynı bölmede yeniden değerlendirme gerekiyor | Colab'da değerlendirme |

### ❓ Soru / karar bekleyenler — 12 madde

| Madde | Önem | Konu | Soru |
|---|---|---|---|
| ☐ **M-21** | 🟠 | Tablo 5 — Etiketli yol hasarı eğitim kümesi künyesi | etiketlensin mi, başka küme mi, gelecek çalışma mı? |
| ⚠️ **M-23** | 🔴 | Tablo 13 (belgede Tablo 14) — Kapanma katmanının yer gerçeğine göre değerlendirilmesi | Tablo 14 kaldırılıp Tablo 19'a mı atıf yapılsın, diğer modeller mi ölçülsün? |
| ⚠️ **M-30** | 🟡 | Gecikme ölçümleri n = 2 | arka uç ve dış adres servisi çalıştırılsın mı? |
| ☐ **M-42** | 🟠 | Hedef dergi seçilmemiş; Öz ve Abstract iki katından uzun | hangi dergi? |
| ⚠️ **M-43** | 🟠 | On bir şekil üretilmemiş | Şekil 10 için rota geometrisini kaydeden kod değişikliği yapılsın mı? |
| ⚠️ **M-47** | 🟠 | Veri erişilebilirliği beyanı — özel veri kümesi | özel küme açık mı, istek üzerine mi, kapalı mı? |
| ⚠️ **M-57** | 🟠 | Tablo 13'te (belgede Tablo 14) `τ` sütunu `[ÖLÇÜLECEK]` olarak yanlış etiketlenmiş | Tablo 14 kalırsa τ tarama değerleri ne olsun? |
| ⚠️ **M-59** | 🟡 | Eksik standart bölümler — Kısaltmalar/Simgeler | dergi Öne Çıkanlar istiyor mu? |
| ⚠️ **M-62** | 🟠 | Bölüm 3.5 (YOLOv8) için veri kümesi ve eğitim protokolü tamamen yok | bina.pt / catlak.pt'yi kim eğitti, hangi Roboflow projesi ve sürümü? |
| ⚠️ **M-70** | ⚪ | Model ağırlığı adında yazım hatası + anonimlik riski | dergi çift kör mü? |
| ✅ **M-86** | 🟡 | Tablo 2'de eğitim kümeleri (KATE-CD, MEDBFS) ve Türkçe metin kümesi yok | CC BY-NC lisanslı veri kullanımı sorun mu; KATE-CD lisansı ne? |
| ☐ **M-88** | ⚪ | Belge Word 2010 uyumluluk modunda | dergi şablonu hangi Word biçimini istiyor? |

### 🪪 Kimlik / isim / numara bilgisi gerekenler — 7 madde

| Madde | Önem | Konu | Gereken bilgi |
|---|---|---|---|
| ☐ **M-21** | 🟠 | Tablo 5 — Etiketli yol hasarı eğitim kümesi künyesi | etiketleyici sayısı ve uzman bilgisi |
| ☐ **M-42** | 🟠 | Hedef dergi seçilmemiş; Öz ve Abstract iki katından uzun | dergi adı |
| ⚠️ **M-45** | 🟠 | Sekiz `[EKLENECEK]` alanı | üç yazarın ORCID numarası, sorumlu yazarın e-postası |
| ✅ **M-46** | 🟠 | Yazar listesi ve katkı beyanı güncellenmeli | yazar adları ve rolleri (tamam, kontrol edin) |
| ⚠️ **M-47** | 🟠 | Veri erişilebilirliği beyanı — özel veri kümesi | veri erişimi için iletişim kişisi |
| ⚠️ **M-62** | 🟠 | Bölüm 3.5 (YOLOv8) için veri kümesi ve eğitim protokolü tamamen yok | modeli eğiten kişi, Roboflow proje adı ve sürümü |
| ⚠️ **M-70** | ⚪ | Model ağırlığı adında yazım hatası + anonimlik riski | anonimleştirilecek adlar (depo sahibi, model adı) |

### 🖥️ Eğitim / koşum gerekenler — 9 madde

| Madde | Önem | Konu | Ne koşulmalı |
|---|---|---|---|
| ☐ **M-21** | 🟠 | Tablo 5 — Etiketli yol hasarı eğitim kümesi künyesi | yol hasarı kümesini etiketleyip eğitmek |
| ⚠️ **M-23** | 🔴 | Tablo 13 (belgede Tablo 14) — Kapanma katmanının yer gerçeğine göre değerlendirilmesi | diğer beş modelin yol maskelerini üretmek |
| ☐ **M-24** | 🟡 | Tablo 14 (belgede Tablo 15) — Bölgeler arası genelleme | bölgeler arası yeniden eğitim (GPU) |
| ⚠️ **M-27** | 🟡 | Tablo 20 (belgede Tablo 21) — Bileşen çıkarma ve parametre duyarlılığı | bileşen çıkarma koşumları |
| ⚠️ **M-30** | 🟡 | Gecikme ölçümleri n = 2 | arka uçta zamanlama ölçümü |
| ⚠️ **M-43** | 🟠 | On bir şekil üretilmemiş | Şekil 10 için rota geometrisi kaydeden senaryo koşusu |
| ⚠️ **M-57** | 🟠 | Tablo 13'te (belgede Tablo 14) `τ` sütunu `[ÖLÇÜLECEK]` olarak yanlış etiketlenmiş | τ eşiği taraması |
| ⚠️ **M-62** | 🟠 | Bölüm 3.5 (YOLOv8) için veri kümesi ve eğitim protokolü tamamen yok | YOLO modellerini sınama kümesinde ölçmek / kıyaslama defterini koşmak |
| ☐ **M-96** | 🟠 | Tablo 13'te SegFormer satırının başarım hücreleri boş — aynı bölmede yeniden değerlendirme gerekiyor | SegFormer'ı aynı bölmede değerlendirmek (GPU) |

### 🧪 Simülasyondan doğan maddeler — 28 madde

| Madde | Önem | Konu | Durum |
|---|---|---|---|
| ✅ **M-04** | 🔴 | Sentetik kapanma üreticisi Bölüm 3'te hiç tanımlanmamış | ✔ YAPILDI |
| ✅ **M-05** | 🔴 | Ekip–hedef atama kuralı tanımsız | ✔ YAPILDI |
| ✅ **M-20** | 🔴 | Tablo 18 (belgede Tablo 19) — Görev tabanlı değerlendirme | ✔ YAPILDI |
| ✅ **M-22** | 🟠 | Tablo 11 (belgede Tablo 12) — Donanım ve `v_ort` | ✔ YAPILDI |
| ⚠️ **M-23** | 🔴 | Tablo 13 (belgede Tablo 14) — Kapanma katmanının yer gerçeğine göre değerlendirilmesi | ◐ KISMEN |
| ✅ **M-25** | 🟠 | Tablo 16 (belgede Tablo 17) — R1 ve R2 ara referansları | ✔ YAPILDI |
| ✅ **M-26** | 🟠 | Tablo 19 (belgede Tablo 20) — Geçilebilirlik kuralı duyarlılığı | ✔ YAPILDI |
| ⚠️ **M-27** | 🟡 | Tablo 20 (belgede Tablo 21) — Bileşen çıkarma ve parametre duyarlılığı | ◐ KISMEN |
| ⚠️ **M-30** | 🟡 | Gecikme ölçümleri n = 2 | ◐ KISMEN |
| ✅ **M-31** | 🟠 | 18 eşleştirilmiş görev için istatistiksel test | ✔ YAPILDI |
| ⚠️ **M-43** | 🟠 | On bir şekil üretilmemiş | ◐ KISMEN |
| ✅ **M-49** | 🟠 | Giriş'teki 2. katkı iddiası, Bölüm 4'te karşılanmıyor | ✔ YAPILDI |
| ✅ **M-51** | 🟡 | ÖZ'deki `t_u` tanımı Bölüm 3.8'inkiyle çelişiyor | ✔ YAPILDI |
| ✅ **M-64** | 🔴 | Bölüm 4.5 sonuçları, Bölüm 3.6'daki düzeltilmiş kuralla değil eski kuralla üretilmiş | ✔ YAPILDI |
| ✅ **M-65** | 🟡 | Algoritma 1 sözde kodunda mantık boşlukları | ✔ YAPILDI |
| ✅ **M-66** | ⚪ | Dijkstra–A* eniyilik doğrulaması niceliksiz | ✔ YAPILDI |
| ✅ **M-67** | 🟡 | `k = 68` keşif olayı sayısı gerekçelendirilmeli | ✔ YAPILDI |
| ✅ **M-76** | 🔴 | Geçilebilirlik kuralı tanımları makale ile kodda **ters** | ✔ YAPILDI |
| ✅ **M-77** | 🔴 | Tek tohumlu senaryo sayıları geçersiz — 10 tohum ortalaması ± ss ile değişmeli | ✔ YAPILDI |
| ✅ **M-78** | 🟠 | Senaryo 9 → 8 ilçe, 12 → 11 karargâh (Göksun çıkarıldı) | ✔ YAPILDI |
| ✅ **M-79** | 🟠 | Gerçek hasarla (EMSR648) koşu makalede yok | ✔ YAPILDI |
| ✅ **M-80** | 🟠 | Bölüm 4.7 hipotezi desteklenmedi — metin ve Tablo 18 (belgede Tablo 19) buna göre yazılmalı | ✔ YAPILDI |
| ✅ **M-81** | 🟠 | Kazancın dağılımı ve R0'ın niteliği yazılmalı | ✔ YAPILDI |
| ✅ **M-82** | 🟡 | Senaryoda "önerilen sistem" kusursuz bilgiyle çalışıyor — açıkça yazılmalı | ✔ YAPILDI |
| ✅ **M-83** | 🟠 | Drone sahnelerinin veri kaynağı Tablo 2'de ve Veri Erişilebilirliği'nde yok | ✔ YAPILDI |
| ✅ **M-84** | 🟠 | Word'de alan güncellemesi ve ek uyumu kontrolü | ✔ YAPILDI |
| ✅ **M-87** | 🔴 | İki gömülü şekil eski veriyle üretilmiş — metinle çelişiyor | ✔ YAPILDI |
| ✅ **M-95** | 🟠 | Tablo 24'te ölçülmüş bir eksen hâlâ "[ÖLÇÜLECEK]" | ✔ YAPILDI |

### 🆕 Sonradan eklenenler — 12–13 Eylül, ikinci inceleme — 27 madde

| Madde | Önem | Konu | Durum |
|---|---|---|---|
| ✅ **M-49** | 🟠 | Giriş'teki 2. katkı iddiası, Bölüm 4'te karşılanmıyor | ✔ YAPILDI |
| ✅ **M-50** | 🟠 | Kodlayıcı sabitlemesi iddiası ile Tablo 6'daki gerçek durum uyuşmuyor | ✔ YAPILDI |
| ✅ **M-51** | 🟡 | ÖZ'deki `t_u` tanımı Bölüm 3.8'inkiyle çelişiyor | ✔ YAPILDI |
| ✅ **M-52** | 🟡 | Bölüm 4.2'de "hasarsız karoların %95'i elenmiştir" — sonuçlara etkisi tartışılmamış | ✔ YAPILDI |
| ✅ **M-53** | 🟡 | Tablo 12'de (belgede Tablo 13) iki değer birden kalın — okuyucu hangisinin ne olduğunu ayıramıyor | ✔ YAPILDI |
| ✅ **M-54** | 🟡 | Bölüm 3.4 "Ağırlık başlangıcı" paragrafı gelecek zamanda ama koşum yapılmış | ✔ YAPILDI |
| ✅ **M-55** | 🟠 | Bölüm 5.3'te iki sınırlılık eksik | ✔ YAPILDI |
| ✅ **M-56** | 🟡 | Tablo 2 ile Bölüm 3.1 arasındaki kanal uyumsuzluğu | ✔ YAPILDI |
| ⚠️ **M-57** | 🟠 | Tablo 13'te (belgede Tablo 14) `τ` sütunu `[ÖLÇÜLECEK]` olarak yanlış etiketlenmiş | ◐ KISMEN |
| ✅ **M-58** | ⚪ | ÖZ'de kısaltmalar açılmadan kullanılmış | ✔ YAPILDI |
| ⚠️ **M-59** | 🟡 | Eksik standart bölümler — Kısaltmalar/Simgeler | ◐ KISMEN |
| ✅ **M-60** | ⚪ | "et al." kullanımı tutarsız | ✔ YAPILDI |
| ✅ **M-61** | 🟡 | Yazılım kaynakları atıfsız | ✔ YAPILDI |
| ⚠️ **M-62** | 🟠 | Bölüm 3.5 (YOLOv8) için veri kümesi ve eğitim protokolü tamamen yok | ◐ KISMEN |
| ✅ **M-63** | 🟠 | Risk skorlamada pozitif sınıf tanımı yok | ✔ YAPILDI |
| ✅ **M-64** | 🔴 | Bölüm 4.5 sonuçları, Bölüm 3.6'daki düzeltilmiş kuralla değil eski kuralla üretilmiş | ✔ YAPILDI |
| ✅ **M-65** | 🟡 | Algoritma 1 sözde kodunda mantık boşlukları | ✔ YAPILDI |
| ✅ **M-66** | ⚪ | Dijkstra–A* eniyilik doğrulaması niceliksiz | ✔ YAPILDI |
| ✅ **M-67** | 🟡 | `k = 68` keşif olayı sayısı gerekçelendirilmeli | ✔ YAPILDI |
| ✅ **M-68** | 🟡 | Tablo 9 aciliyet sıralaması gerekçelendirilmeli | ✔ YAPILDI |
| ✅ **M-69** | ⚪ | "Senaryo v2" terimi açıklanmamış | ✔ YAPILDI |
| ⚠️ **M-70** | ⚪ | Model ağırlığı adında yazım hatası + anonimlik riski | ◐ KISMEN |
| ✅ **M-71** | 🟡 | Şekil 8'de alt şekil etiketleri yok | ✔ YAPILDI |
| ✅ **M-72** | ⚪ | Şekil 9 hem "üretilmemiştir" diyor hem altyazısı var | ✔ YAPILDI |
| ✅ **M-73** | 🟡 | 2026 tarihli dört kaynak teyit edilmeli | ✔ YAPILDI |
| ✅ **M-74** | ⚪ | DOI/URL bilgileri genel olarak eksik | ✔ YAPILDI |
| ✅ **M-75** | 🔴 | Tüm tabloların sütun genişlikleri patolojik derecede dar (yeni bulgu, kullanıcı bildirdi) | ✔ YAPILDI |

### 🆕 Sonradan eklenenler — 16 Eylül, simülasyon güncellemesi — 13 madde

| Madde | Önem | Konu | Durum |
|---|---|---|---|
| ✅ **M-76** | 🔴 | Geçilebilirlik kuralı tanımları makale ile kodda **ters** | ✔ YAPILDI |
| ✅ **M-77** | 🔴 | Tek tohumlu senaryo sayıları geçersiz — 10 tohum ortalaması ± ss ile değişmeli | ✔ YAPILDI |
| ✅ **M-78** | 🟠 | Senaryo 9 → 8 ilçe, 12 → 11 karargâh (Göksun çıkarıldı) | ✔ YAPILDI |
| ✅ **M-79** | 🟠 | Gerçek hasarla (EMSR648) koşu makalede yok | ✔ YAPILDI |
| ✅ **M-80** | 🟠 | Bölüm 4.7 hipotezi desteklenmedi — metin ve Tablo 18 (belgede Tablo 19) buna göre yazılmalı | ✔ YAPILDI |
| ✅ **M-81** | 🟠 | Kazancın dağılımı ve R0'ın niteliği yazılmalı | ✔ YAPILDI |
| ✅ **M-82** | 🟡 | Senaryoda "önerilen sistem" kusursuz bilgiyle çalışıyor — açıkça yazılmalı | ✔ YAPILDI |
| ✅ **M-83** | 🟠 | Drone sahnelerinin veri kaynağı Tablo 2'de ve Veri Erişilebilirliği'nde yok | ✔ YAPILDI |
| ✅ **M-84** | 🟠 | Word'de alan güncellemesi ve ek uyumu kontrolü | ✔ YAPILDI |
| ☐ **M-85** | ⚪ | Sarı vurguların temizlenmesi | ✖ YAPILMADI |
| ✅ **M-86** | 🟡 | Tablo 2'de eğitim kümeleri (KATE-CD, MEDBFS) ve Türkçe metin kümesi yok | ✔ YAPILDI |
| ✅ **M-87** | 🔴 | İki gömülü şekil eski veriyle üretilmiş — metinle çelişiyor | ✔ YAPILDI |
| ☐ **M-88** | ⚪ | Belge Word 2010 uyumluluk modunda | ✖ YAPILMADI |

### 🆕 Sonradan eklenenler — 16 Eylül akşamı — 8 madde

| Madde | Önem | Konu | Durum |
|---|---|---|---|
| ✅ **M-89** | 🟠 | Bölüm 4.2: karolama ve %95 eleme adımı fiilen hiçbir şey yapmamış, metin aksini söylüyordu | ✔ YAPILDI |
| ✅ **M-90** | 🟠 | Şekil 7 yanlış başlıklı ve karşılaştırılamaz bir SegFormer çubuğu içeriyordu; Şekil 8 yeniden çizildi | ✔ YAPILDI |
| ✅ **M-91** | 🟠 | Tablo 6 ve Bölüm 3.4, koşulan mimari ayarlarıyla uyuşmuyordu | ✔ YAPILDI |
| ✅ **M-92** | ⚪ | İki "Tablo 13'nin" ek hatası; ek denetimi genişletildi | ✔ YAPILDI |
| ✅ **M-93** | 🟡 | On iki şekilde atıf cümlesi görsel ile başlığı arasına girmişti | ✔ YAPILDI |
| ✅ **M-94** | ⚪ | "Şekil 16–21" aralığı ve yanlış yerdeki tablo dipnotu | ✔ YAPILDI |
| ✅ **M-95** | 🟠 | Tablo 24'te ölçülmüş bir eksen hâlâ "[ÖLÇÜLECEK]" | ✔ YAPILDI |
| ☐ **M-96** | 🟠 | Tablo 13'te SegFormer satırının başarım hücreleri boş — aynı bölmede yeniden değerlendirme gerekiyor | ✖ YAPILMADI |

### ✔ Yapılan maddeler (🔍 işaretliler gözle kontrol edilmeli) — 78 madde

| Madde | Önem | Konu | Kontrol notu |
|---|---|---|---|
| ✅ **M-01** | 🔴 | SegFormer satırı karşılaştırılabilir değil |  |
| ✅ **M-02** | 🔴 | Öz ve Abstract M-01'in kaydını taşımıyor |  |
| ✅ **M-03** | 🟠 | Bölüm 4.2 iddiayı önce olgu olarak kuruyor |  |
| ✅ **M-04** | 🔴 | Sentetik kapanma üreticisi Bölüm 3'te hiç tanımlanmamış |  |
| ✅ **M-05** | 🔴 | Ekip–hedef atama kuralı tanımsız |  |
| ✅ **M-06** | 🔴 | İç çelişki — artçı ayıklaması yapıldı mı yapılmadı mı? |  |
| ✅ **M-07** | 🔴 | Tek etiketli ↔ çok etiketli çelişkisi ve iki farklı eşik |  |
| ✅ **M-08** | 🔴 | Üç geçilebilirlik kuralı Bölüm 3'te yok, üstelik atıf yanlış |  |
| ✅ **M-09** | 🟠 | Vaat edilen iki naif risk tabanı Tablo 22'de (belgede Tablo 23) yok |  |
| ✅ **M-10** | 🔴 | On yedi denklemin tamamı Word'de ham LaTeX olarak duruyor |  |
| ✅ **M-11** | 🟠 | Model seçimi ortalama IoU ile yapılmış — makale ortalama IoU'yu eleştiriyor |  |
| ✅ **M-12** | 🟠 | Yakınlaştırma düzeyi seçiminde üç hata |  |
| ✅ **M-13** | 🟡 | λ(d)'nin ilk basamağı sert kapatma yarıçapıyla örtüşüyor |  |
| ✅ **M-14** | 🟡 | Kenar orta noktası ölçütü bir yerde reddedilip başka yerde kullanılıyor |  |
| ✅ **M-15** | 🟠 | Kip (zaman) tutarsızlıkları |  |
| ✅ **M-16** | 🟠 | Bölüm 4.1.1 kendisiyle çelişiyor |  |
| ✅ **M-17** | 🟡 | Bölüm 3.6'daki "belirsiz" durumu — kodda mı, kâğıtta mı? |  |
| ✅ **M-18** | 🟡 | Tablo 12'nin (belgede Tablo 13) ortalama IoU değerleri metinde, sütunda değil |  |
| ✅ **M-19** | ⚪ | Bölüm 4.10'daki "Tablo 23" (belgede Tablo 24) atfı dolaylı |  |
| ✅ **M-20** | 🔴 | Tablo 18 (belgede Tablo 19) — Görev tabanlı değerlendirme |  |
| ✅ **M-22** | 🟠 | Tablo 11 (belgede Tablo 12) — Donanım ve `v_ort` | 🔍 işlemci ölçülen i7-12700H yazıldı (bildirilen 14. nesil değil) |
| ✅ **M-25** | 🟠 | Tablo 16 (belgede Tablo 17) — R1 ve R2 ara referansları |  |
| ✅ **M-26** | 🟠 | Tablo 19 (belgede Tablo 20) — Geçilebilirlik kuralı duyarlılığı |  |
| ✅ **M-28** | 🟡 | Tablo 12 (belgede Tablo 13) — GFLOPs ve çıkarım süresi | 🔍 CPU süreleri dizüstünde oynak; metin bunu söylüyor |
| ✅ **M-29** | 🟡 | Tablo 15 (belgede Tablo 16) — Acil çağrı satırı |  |
| ✅ **M-31** | 🟠 | 18 eşleştirilmiş görev için istatistiksel test |  |
| ✅ **M-32** | 🟡 | Bölüm 3.3 — Kalite filtresi eşiği ve elenen karo oranı |  |
| ✅ **M-33** | 🟠 | Türkçe metin veri kümesinin kaynağı makalede hiç geçmiyor |  |
| ✅ **M-34** | ⚪ | Tablo 21'de (belgede Tablo 22) BiLSTM eğitim süresi boş |  |
| ✅ **M-35** | 🟠 | Altı kaynak yazarsız |  |
| ✅ **M-36** | 🟠 | ConvBERTurk ve DistilBERTurk için yanlış kaynak gösterilmiş |  |
| ✅ **M-37** | 🟡 | [1] hem AFAD raporu hem deprem kataloğu kaynağı olarak kullanılıyor |  |
| ✅ **M-38** | ⚪ | [56] ve [57] künye doğrulaması |  |
| ✅ **M-39** | 🟠 | Dokuz tablo metinde numarayla anılmıyor |  |
| ✅ **M-40** | 🟠 | On iki şekil metinde numarayla anılmıyor |  |
| ✅ **M-46** | 🟠 | Yazar listesi ve katkı beyanı güncellenmeli | 🔍 CRediT rolleri |
| ✅ **M-48** | 🟠 | Görüntü kaynağı lisansı |  |
| ✅ **M-49** | 🟠 | Giriş'teki 2. katkı iddiası, Bölüm 4'te karşılanmıyor |  |
| ✅ **M-50** | 🟠 | Kodlayıcı sabitlemesi iddiası ile Tablo 6'daki gerçek durum uyuşmuyor |  |
| ✅ **M-51** | 🟡 | ÖZ'deki `t_u` tanımı Bölüm 3.8'inkiyle çelişiyor |  |
| ✅ **M-52** | 🟡 | Bölüm 4.2'de "hasarsız karoların %95'i elenmiştir" — sonuçlara etkisi tartışılmamış |  |
| ✅ **M-53** | 🟡 | Tablo 12'de (belgede Tablo 13) iki değer birden kalın — okuyucu hangisinin ne olduğunu ayıramıyor |  |
| ✅ **M-54** | 🟡 | Bölüm 3.4 "Ağırlık başlangıcı" paragrafı gelecek zamanda ama koşum yapılmış |  |
| ✅ **M-55** | 🟠 | Bölüm 5.3'te iki sınırlılık eksik |  |
| ✅ **M-56** | 🟡 | Tablo 2 ile Bölüm 3.1 arasındaki kanal uyumsuzluğu |  |
| ✅ **M-58** | ⚪ | ÖZ'de kısaltmalar açılmadan kullanılmış |  |
| ✅ **M-60** | ⚪ | "et al." kullanımı tutarsız |  |
| ✅ **M-61** | 🟡 | Yazılım kaynakları atıfsız |  |
| ✅ **M-63** | 🟠 | Risk skorlamada pozitif sınıf tanımı yok |  |
| ✅ **M-64** | 🔴 | Bölüm 4.5 sonuçları, Bölüm 3.6'daki düzeltilmiş kuralla değil eski kuralla üretilmiş |  |
| ✅ **M-65** | 🟡 | Algoritma 1 sözde kodunda mantık boşlukları |  |
| ✅ **M-66** | ⚪ | Dijkstra–A* eniyilik doğrulaması niceliksiz |  |
| ✅ **M-67** | 🟡 | `k = 68` keşif olayı sayısı gerekçelendirilmeli |  |
| ✅ **M-68** | 🟡 | Tablo 9 aciliyet sıralaması gerekçelendirilmeli |  |
| ✅ **M-69** | ⚪ | "Senaryo v2" terimi açıklanmamış |  |
| ✅ **M-71** | 🟡 | Şekil 8'de alt şekil etiketleri yok |  |
| ✅ **M-72** | ⚪ | Şekil 9 hem "üretilmemiştir" diyor hem altyazısı var |  |
| ✅ **M-73** | 🟡 | 2026 tarihli dört kaynak teyit edilmeli |  |
| ✅ **M-74** | ⚪ | DOI/URL bilgileri genel olarak eksik | 🔍 kaynak [2] değişti (özgün bülten bulunamadı) |
| ✅ **M-75** | 🔴 | Tüm tabloların sütun genişlikleri patolojik derecede dar (yeni bulgu, kullanıcı bildirdi) |  |
| ✅ **M-76** | 🔴 | Geçilebilirlik kuralı tanımları makale ile kodda **ters** | 🔍 kural adları koda uyduruldu (katı/orta/gevşek) |
| ✅ **M-77** | 🔴 | Tek tohumlu senaryo sayıları geçersiz — 10 tohum ortalaması ± ss ile değişmeli |  |
| ✅ **M-78** | 🟠 | Senaryo 9 → 8 ilçe, 12 → 11 karargâh (Göksun çıkarıldı) |  |
| ✅ **M-79** | 🟠 | Gerçek hasarla (EMSR648) koşu makalede yok |  |
| ✅ **M-80** | 🟠 | Bölüm 4.7 hipotezi desteklenmedi — metin ve Tablo 18 (belgede Tablo 19) buna göre yazılmalı |  |
| ✅ **M-81** | 🟠 | Kazancın dağılımı ve R0'ın niteliği yazılmalı |  |
| ✅ **M-82** | 🟡 | Senaryoda "önerilen sistem" kusursuz bilgiyle çalışıyor — açıkça yazılmalı |  |
| ✅ **M-83** | 🟠 | Drone sahnelerinin veri kaynağı Tablo 2'de ve Veri Erişilebilirliği'nde yok | 🔍 Help.NGO görüntüleri, lisans ve teşekkür |
| ✅ **M-84** | 🟠 | Word'de alan güncellemesi ve ek uyumu kontrolü |  |
| ✅ **M-86** | 🟡 | Tablo 2'de eğitim kümeleri (KATE-CD, MEDBFS) ve Türkçe metin kümesi yok | 🔍 Tablo 2'ye eklenen üç satır ve lisans notları |
| ✅ **M-87** | 🔴 | İki gömülü şekil eski veriyle üretilmiş — metinle çelişiyor |  |
| ✅ **M-89** | 🟠 | Bölüm 4.2: karolama ve %95 eleme adımı fiilen hiçbir şey yapmamış, metin aksini söylüyordu | 🔍 4.2 veri kümesi anlatımı |
| ✅ **M-90** | 🟠 | Şekil 7 yanlış başlıklı ve karşılaştırılamaz bir SegFormer çubuğu içeriyordu; Şekil 8 yeniden çizildi |  |
| ✅ **M-91** | 🟠 | Tablo 6 ve Bölüm 3.4, koşulan mimari ayarlarıyla uyuşmuyordu | 🔍 Tablo 6 mimari ayarları |
| ✅ **M-92** | ⚪ | İki "Tablo 13'nin" ek hatası; ek denetimi genişletildi |  |
| ✅ **M-93** | 🟡 | On iki şekilde atıf cümlesi görsel ile başlığı arasına girmişti |  |
| ✅ **M-94** | ⚪ | "Şekil 16–21" aralığı ve yanlış yerdeki tablo dipnotu |  |
| ✅ **M-95** | 🟠 | Tablo 24'te ölçülmüş bir eksen hâlâ "[ÖLÇÜLECEK]" | 🔍 Tablo 24 görev tabanlı satırı |

### ✖ Hiç yapılmayan maddeler — 6 madde

| Madde | Önem | Konu | Diğer etiketler |
|---|---|---|---|
| ☐ **M-21** | 🟠 | Tablo 5 — Etiketli yol hasarı eğitim kümesi künyesi | 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA · 🖥️ EĞİTİM/KOŞUM GEREKİR |
| ☐ **M-24** | 🟡 | Tablo 14 (belgede Tablo 15) — Bölgeler arası genelleme | 👥 SİZ YAPMALISINIZ · 🖥️ EĞİTİM/KOŞUM GEREKİR |
| ☐ **M-42** | 🟠 | Hedef dergi seçilmemiş; Öz ve Abstract iki katından uzun | 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA |
| ☐ **M-85** | ⚪ | Sarı vurguların temizlenmesi | 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 👥 SİZ YAPMALISINIZ |
| ☐ **M-88** | ⚪ | Belge Word 2010 uyumluluk modunda | 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR |
| ☐ **M-96** | 🟠 | Tablo 13'te SegFormer satırının başarım hücreleri boş — aynı bölmede yeniden değerlendirme gerekiyor | 🆕 SONRADAN EKLENDİ (16 Eylül akşamı) · 👥 SİZ YAPMALISINIZ · 🖥️ EĞİTİM/KOŞUM GEREKİR |

---

<!-- ETIKET-DIZINI-BITIR -->

# Makale Taslağı — Birleşik Düzeltme Listesi

**İncelenen belge:** `MAKALE_TASLAK_TR (1).docx` — 481 paragraf, 23 tablo, 21 şekil,
17 denklem, 57 kaynak, 17 gömülü görsel, 18 169 kelime
**Son güncelleme:** 16 Eylül 2026 akşamı (devir notu, kalan işler, M-87…M-94)
**Amaç:** Bu listedeki maddeler tamamlandığında taslak nihai düzeye ulaşır.

> **Numaralandırma notu (16 Eylül 2026).** Bölüm 3.8.1'e yeni Tablo 10 eklendiği için belgede eski Tablo 10 ve
> sonrası **bir kaydı**. Bu listedeki madde başlıkları eski numaraları korur. Karşılık: eski 10 → 11
> (değerlendirme ölçütleri), 11 → 12 (donanım), 12 → 13 (bölütleme), 13 → 14 (kapanma–yer gerçeği),
> 14 → 15 (bölgeler arası), 15 → 16 (gecikmeler), **16 → 17 (referans karşılaştırması)**, **17 → 18 (t_u)**,
> **18 → 19 (görev tabanlı)**, **19 → 20 (geçilebilirlik)**, 20 → 21 (bileşen çıkarma), 21 → 22 (metin),
> 22 → 23 (risk), 23 → 24 (eksenler). Şekil numaraları değişmedi.

## Bu dosya neyin birleşimi

İki bağımsız inceleme tek listede toplanmıştır. Çakışan maddeler tekilleştirilmiş,
her maddeye tek bir kimlik (`M-01` …) verilmiştir.

| Kaynak imi | Anlamı |
|---|---|
| `[B]` | Bu oturumdaki inceleme (depo ↔ makale hizası, ölçüm eksikleri) |
| `[D]` | Diğer sohbetteki inceleme (makale iç tutarlılığı, dizgi, kaynakça) |
| `[B+D]` | İki incelemenin de bağımsız olarak bulduğu madde |

**Not.** `[D]` işaretli maddelerin **tamamı** bu oturumda belge ve depo üzerinde
tek tek doğrulanmıştır; hiçbiri olduğu gibi aktarılmamıştır. Doğrulanamayan ya da
yanlış çıkan iddialar **Bölüm 7**'de ayrıca listelenmiştir.

**Ek not (12 Eylül 2026).** `QuakeMind_Taslak_Duzeltme_Listesi.md` dosyasındaki
tüm maddeler bu listeyle karşılaştırıldı; daha önce buraya aktarılmamış olanlar
**M-49 – M-74** olarak eklendi (KİMLİK EŞLEME tablosunda işaretli). Bunlardan
✅ olanlar aynı oturumda `MAKALE_TASLAK_TR (1).docx` üzerinde uygulanmış ve
doğrudan belge içeriğiyle doğrulanmıştır; ☐ olanlar kaynak dosyadan
devralınmış olup ayrıca kod/depo doğrulaması yapılmamıştır. Zaten var olan bir
maddeyle içerik olarak çakışan üç madde (D2, D9, E4) yeni satır açılmadan
ilgili mevcut maddeye (sırasıyla M-45, M-44, M-38) not olarak işlendi.

## Önem dereceleri

| Kod | Anlamı |
|---|---|
| 🔴 | Hakem tek başına ret gerekçesi sayabilir; gönderimden önce mutlaka çözülmeli |
| 🟠 | Gönderimden önce çözülmeli; çözülmezse ciddi revizyon isteği gelir |
| 🟡 | Makaleyi güçlendirir; eksikliği savunulabilir ama zayıflatır |
| ⚪ | Biçim, adlandırma, düzen |

---

## Genel değerlendirme

Taslak **yapısal olarak sağlam**. Doğrulanan noktalar:

- Tablo numaraları 1–23 kesintisiz, çakışma ve boşluk yok ✓
- Şekil numaraları 1–21 kesintisiz, çakışma yok ✓
- Denklem numaraları 1–17, her biri tam bir kez ✓
- Kaynakça 57 kayıt, 1–57 arası boşluksuz; **listede olup metinde anılmayan yok,
  metinde anılıp listede olmayan yok** ✓
- Tablo 21 (metin) ve Tablo 22 (risk) değerleri depodaki ölçüm dosyalarıyla
  **birebir** tutuyor ✓
- Tablo 12'nin beş taban satırı `iou_fg` değerleriyle **birebir** tutuyor ✓
- Tablo 3 (EMSR648) değerleri yer gerçeği JSON'larıyla tutuyor ✓

Kalan sorunların ağırlığı iki yerde toplanıyor: **(i)** Bölüm 3 (Yöntem), Bölüm 4'te
raporlanan koşumu tarif etmiyor — sonucu üreten üç mekanizma (sentetik kapanma
üreticisi, ekip–hedef atama kuralı, üç geçilebilirlik kuralı) yöntemde hiç
tanımlanmamış; **(ii)** 187 ölçülmemiş hücre.

### Sayılarla kalan iş

**Güncel (16 Eylül 2026 akşamı, belgeden sayıldı):**

| | Adet |
|---|---|
| `[ÖLÇÜLECEK]` hücre | **86** (Tablo 5: 6 · Tablo 13: 5 · Tablo 14: 36 · Tablo 15: 28 · Tablo 21: 7 · Tablo 24: 4) + metinde 1 geçiş |
| `[TARANACAK]` hücre | **6** (Tablo 14, τ sütunu) |
| Doldurulacak künye / karar işareti | **2** (`[ORCID … EKLENECEK]`, `[ERİŞİM POLİTİKASI KARARLAŞTIRILACAK]`) |
| Yer tutucu şekil | **7** (Şekil 1, 2, 3, 4, 5, 6, 10) |
| Eski kalitede şekil | **0** (16 Eylül gece: Şekil 17, 19, 20 yeniden üretildi) |
| Metinde numarayla anılmayan tablo / şekil | **0 / 0** |
| Yazarsız / bağlantısız kaynak | **0 / 0** (64 kaynak) |
| Belge | 67 sayfa · 25 tablo (1 kısaltmalar + 24 numaralı) · 20 şekil · 17 denklem |

**İlk sayım (12 Eylül 2026, tarihsel):**

| | Adet |
|---|---|
| `[ÖLÇÜLECEK]` hücre | **187** |
| `[EKLENECEK]` alan | **8** |
| Üretilmemiş şekil | **11** (Şekil 1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13) |
| Metinde numarayla anılmayan tablo | **9** |
| Metinde numarayla anılmayan şekil | **12** |
| Yöntemde tanımsız, sonuçta kullanılan mekanizma | **3** |
| İç çelişki | **5** |
| Kip (zaman) tutarsızlığı | **3 bölüm** |
| Yazarsız kaynak | **6** |

---

# BÖLÜM 1 — YAYIN ENGELLEYİCİ

Bunlar çözülmeden makale hakeme gönderilmemelidir.

### ✅ M-01 🔴 SegFormer satırı karşılaştırılabilir değil `[B+D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (13 Eylül 2026) — Seçenek (b) uygulandı: Tablo 12'de SegFormer'ın IoU_hasar hücresindeki `0,4276` değeri `[KARŞILAŞTIRILAMAZ]*` ile değiştirildi (dipnot 255, Bölüm 4.2 "Gözlemler" paragrafı ve Bölüm 5.3(o) zaten bu değeri karşılaştırılamaz olarak nitelendiriyordu — artık tablo hücresi de bunu yansıtıyor). Seçenek (a) — SegFormer'ı üç katmanlı bölmeyle yeniden koşup gerçek test IoU_hasar değerini raporlamak — model eğitimi gerektirdiğinden bu oturumda yapılamadı; `02_bina_hasari` yerel dizini boş (ağırlıklar Colab'da, bkz. M-44), bu nedenle yeniden koşum bu ortamdan mümkün değil.

**Nerede:** Öz · Abstract · Bölüm 4.2 (Gözlemler) · Tablo 12 son satır

Tablo 12'deki beş taban **ayrılmış test kümesinde** ölçülmüştür
(`build_notebook.py`: %70/15/15 bölme, tohum 42, en iyi ağırlık geri yüklenip
`test_loader` üzerinde değerlendirme). SegFormer'ın 0,4276 değeri ise
`optimized_training_colab.ipynb` çıktısındaki **"En iyi Val IoU"** — iki katmanlı
bölme, erken durdurmanın seçtiği devirdeki **doğrulama** skoru.

En iyi doğrulama skoru seçim yanlılığı taşır ve sistematik olarak iyimserdir;
0,3700 → 0,4276 farkı modele atfedilemez.

**Yapılacak (biri):**
- **(a) Tercih edilen:** SegFormer'ı aynı üç katmanlı bölmeyle yeniden koştur,
  test kümesi IoU_hasar değerini raporla. Defter ve veri mevcut.
- **(b) Geçici:** Tablo 12'deki hücreyi `[KARŞILAŞTIRILAMAZ]` yap, satırı tablodan
  ayırıp dipnota taşı.

### ✅ M-02 🔴 Öz ve Abstract M-01'in kaydını taşımıyor `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — SegFormer iddiası ÖZ ve ABSTRACT'tan çıkarıldı, önerilen LinkNet tabanlı cümleyle değiştirildi.

**Nerede:** Öz, "en yüksek hasar sınıfı IoU değeri 0,4276 ile SegFormer
yapılandırmasında elde edilmiştir" · Abstract, "the highest damage-class IoU
(0.4276) obtained by the SegFormer configuration"

Gövdede (Bölüm 4.2 dipnotu ve sapma listesi) kayıt var, Öz'de yok. Hakem Öz ile
gövde arasındaki bu farkı "üstü örtülü iddia" olarak nitelendirir.

**Yapılacak.** M-01 çözülene kadar iddiayı Öz ve Abstract'tan çıkar. Önerilen metin:
> "Kıyaslama mimarileri arasında en yüksek hasar sınıfı IoU değeri LinkNet ile
> elde edilmiştir (0,3700); esas alınan yapılandırmanın aynı protokolde
> değerlendirilmesi sürmektedir."

İngilizcesi:
> "Among the comparison architectures, the highest damage-class IoU was obtained
> by LinkNet (0.3700); evaluation of the adopted configuration under the identical
> protocol is ongoing."

### ✅ M-03 🟠 Bölüm 4.2 iddiayı önce olgu olarak kuruyor `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — "Gözlemler" paragrafı yeniden sıralandı: çekince cümlesi artık SegFormer'ın 0,4276 değerinden önce geliyor.

**Nerede:** Bölüm 4.2, "Gözlemler" paragrafı

Mevcut sıra: *"Esas alınan SegFormer yapılandırması 0,4276 ile beş kıyaslama
mimarisinin tümünün üzerindedir. Ancak bu fark bir mimari üstünlüğü kanıtı olarak
sunulamaz…"* — olumlu iddia önce, kayıt sonra. Alıntılanan cümle ilki olur.

**Yapılacak.** Sırayı ters çevir. Önerilen:
> "Esas alınan SegFormer yapılandırması ayrı bir oturumda ve iki katmanlı bölmeyle
> eğitildiğinden, elde edilen 0,4276 değeri bir doğrulama skorudur ve beş
> kıyaslama mimarisinin test kümesi değerleriyle aynı ölçekte değildir; bu nedenle
> tabloda karşılaştırma dışı tutulmuştur."

### ✅ M-04 🔴 Sentetik kapanma üreticisi Bölüm 3'te hiç tanımlanmamış `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026, ikinci tur) — Bölüm 3.8.1 sekiz bölge ve on tohuma göre güncellendi:
Tablo 10 artık bölge başına toplam kenar, kapalı kenar aralığı, etkin oran (ortalama ± ss) ve yarılama
sayısını veriyor (toplam 209 196 kenar, %2,84 ± 0,20); Göksun satırı kaldırıldı ve not düşüldü; bölümün
başına üç kapanma kaynağı (sentetik / EMSR648 / SegFormer) eklendi; tohum 42–51 ve yeniden üretilebilirlik
notu güncellendi.
**16 Eylül 2026 — KISMEN YENİDEN AÇILDI.** 15 Eylül'de yazılan Bölüm 3.8.1 artık eski:
"dokuz bölge" ifadesi, Tablo 10'daki **K-Z4 Göksun** satırı (senaryodan çıkarıldı) ve tek
tohumlu (42) kapanma sayıları. Güncellenecek: 8 bölge; bölge başına kapalı kenar oranı
**10 tohum ortalaması ± ss** (`runs/multi_seed/multi_seed_tablo.md`, "Bölge başına kapalı
kenar oranı"); EMSR648 kapanma kaynağının da tanıtılması (3.8.1 artık üç kaynaktan biridir).

**Durum: TAMAMLANDI** (15 Eylül 2026) — Belgeye yeni **Bölüm 3.8.1 "Senaryo Koşumlarında Kullanılan Sentetik Kapanma Kümesi"** alt bölümü eklendi (Bölüm 3.8 sonu, 3.9 öncesi). İçerik koddan çıkarılmıştır: `apps/road_damage/utils/network.py → simulate_random_closures` ve `benchmark/full_scenario.py`. Yazılanlar: (i) gerekçe — senaryonun sınadığı şeyin bölütleme doğruluğu değil sevk zinciri davranışı olduğu; (ii) parametreler — ρ₀ = 0,18, tohum 42, yarıçap 3,0 km, çizge tipi walk, α = 0,92, en çok 6 deneme; (iii) üç tasarım kısıtı — fiziksel yol bazında kapatma (ters yönlü eş kusuru), belirlenimci sıralama (süreç-özgü karma tohumu sorunu), bağlantılılık korumalı yarılama; (iv) **Algoritma 2** sözde kodu; (v) **yeni Tablo 10** — dokuz bölgenin ölçülen etkin kapanma oranları; (vi) gerçekçilik denetimi; (vii) sınırlılık; (viii) yeniden üretilebilirlik notu.

**Ölçülen sonuç.** İstenen %18 hiçbir bölgede gerçekleşmemiş; bağlantılılık kısıtı oranı 2–5 kez yarılamıştır. Etkin oran %0,55–4,50, toplam **6 378 / 222 298 kenar = %2,87**. Bu aralık EMSR648 gerçek hasarlı yol oranlarını (Hatay %1,58; Kahramanmaraş %1,71) kapsamaktadır.

**Not.** Yeni tablo belge sırasında 10. sıradadır; sonraki tüm tablo numaraları bir kayar. Numaralar `SEQ TabloNo` alan koduyla üretildiği için Word'de **Ctrl+A → F9** ile otomatik düzelir.

**Yedek:** `MAKALE_TASLAK_TR (1) - YEDEK_m04_oncesi.docx`
**Nerede:** Bölüm 3 (tamamı) ↔ Bölüm 4.5, 4.6

**Ölçüm:** `sentetik` sözcüğü Bölüm 3'te (5 788 kelime, satır 62–301) **sıfır kez**
geçiyor; makalenin tamamında 13 kez geçiyor — hepsi Bölüm 4 ve 5'te.

Makalenin manşet sonucu (206,6 dk ↔ 1 641,0 dk) sentetik olarak üretilmiş bir
kapanma kümesi üzerinde elde edilmiştir. Bu kümenin **nasıl üretildiği hiçbir
yerde yazmıyor**: kaç kapanma, hangi olasılık dağılımı, hangi uzamsal kural,
hangi tohum, yol sınıfına göre ağırlıklandırma var mı. Yöntem bölümü yalnızca
gerçek kapanma katmanını (bölütleme → çizge) tarif ediyor; oysa raporlanan koşum
o katmanı kullanmıyor.

Bu, tek başına yeniden üretilebilirlik ret gerekçesidir: hakem sonucu üreten
girdinin tanımını bulamaz.

**Yapılacak.** Bölüm 3'e yeni bir alt bölüm (**3.10. Sentetik Kapanma Üretimi**)
ekle ve şunları yaz: üretici algoritma, kapanma sayısı ve yol ağına oranı,
uzamsal seçim kuralı (rastgele mi, yol sınıfına göre ağırlıklı mı, kümelenmiş mi),
rastgelelik tohumu, EMSR648 oranlarıyla (%1,58 / %1,71) nasıl kalibre edildiği.
Kod: `QuakeMindBackend/benchmark/` altındaki senaryo üreticisi referans verilmeli.

### ✅ M-05 🔴 Ekip–hedef atama kuralı tanımsız `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Kod yeniden okundu (`full_scenario.py → assign_zone`,
`_priority_key`; kural 15 Eylül özetiyle aynı, değişmemiş). Bölüm 3.9'a eklendi: "Atama kuralı" paragrafı
(durum önceliği + kanal sıralaması; kritik/mahsur için profil rolü, diğerleri için metin kategorisi → rol
eşlemesi ve gerekçesi; rol havuzu boşsa tüm havuz; karargâha haversine en yakın ekip; ekip başına tek hedef,
yeniden atama yok), **Algoritma 3** (sözde kod, Algoritma 2 ile aynı biçim), senaryo kurgusu paragrafı
(bölge başına ekip = ihbar; roller 10/4/4; başlangıç = karargâh; **R0/R1/R2 aynı atamayı ve aynı
başlangıç–hedef çiftlerini kullanır → farklar atamadan değil kapanma bilgisinden**; bilinçli çakışma testi).
Sınır paragrafı "Algoritma 3 yerel ve açgözlü bir kuraldır" diye güncellendi.
**Nerede:** Bölüm 3.9 (102 kelime) ↔ Bölüm 4.5

**Ölçüm:** Bölüm 3.9 "Görev Orkestrasyonu ve Çakışma Önleme" toplam **102
kelimedir** ve yalnızca **kilitlemeyi** tarif eder: hedef kilitlenir, ikinci istek
HTTP 409 ile reddedilir, üç rollü yetkilendirme. Bölüm kendi sınırını da dürüstçe
yazıyor: *"hedef kilitleme bir eşzamanlılık denetimidir, bir atama eniyilemesi
değildir."*

Ancak 206,6 dakikalık toplam süre **tamamen** atama kararına bağlıdır: hangi ekip
hangi ihbara gider, sıra neye göre belirlenir (aciliyet mi, mesafe mi, ikisinin
bileşimi mi), bir ekip görevi bitirince sonraki hedefi nasıl seçer. Bu kural
yazılmadan senaryo yeniden üretilemez ve "kapanma-farkındalığın kazancı" ile
"atama kuralının kazancı" birbirinden ayrılamaz.

**Yapılacak.** Bölüm 3.9'u genişlet: atama yordamını sözde kod ya da açık kuralla
yaz (**Algoritma 2** olarak numaralandırılabilir). En az şunlar: hedef sıralama
ölçütü, eşitlik bozma kuralı, ekip başına eşzamanlı görev sayısı, görev
tamamlandıktan sonraki yeniden atama. Naif referansın (R0) aynı atama kuralını
kullanıp kullanmadığı **açıkça** belirtilmeli — kullanmıyorsa karşılaştırma
adil değildir.

### ✅ M-06 🔴 İç çelişki — artçı ayıklaması yapıldı mı yapılmadı mı? `[B+D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Bölüm 3.7 düzeltildi: declustering'in bu sürümde uygulanmadığı ve etkisinin Bölüm 4.11'de tartışıldığı belirtildi; karşılaştırmanın koşulduğu ve sonuçların 4.11'de raporlandığı netleştirildi.

**Nerede:** Bölüm 3.7 ↔ Bölüm 4.11 (son paragraf)

- **Bölüm 3.7:** *"Katalog verisi üzerinde önce kümelenmeden arındırma
  uygulanarak artçı sarsıntılar ayıklanır."* → yapıldı
- **Bölüm 4.11:** *"(ii) katalogda artçı ayıklaması (declustering) yapılmamıştır,
  dolayısıyla ana şok–artçı dizilerinin zamansal özilintisi başarımı iyimser yönde
  sapmaya uğratıyor olabilir."* → yapılmadı

İkisi aynı anda doğru olamaz. Hakem bu çelişkiyi bulduğunda Tablo 22'nin tüm
değerleri sorgulanır.

**Yapılacak.** Koşulan kodu kontrol et
(`model_benchmarks/05_risk_skoru/local_run/run_all_risk.py`), hangisinin doğru
olduğunu belirle ve diğer bölümü düzelt. Yapılmadıysa Bölüm 3.7'yi
"uygulanacaktır" olarak değiştir.

### ✅ M-07 🔴 Tek etiketli ↔ çok etiketli çelişkisi ve iki farklı eşik `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Bölüm 3.6 çok etiketli sigmoid kurguyu (eşik 0,50) anlatacak biçimde yeniden yazıldı; 0,30'luk eşiğin bundan bağımsız, ikincil bir "belirsiz" güven kontrolü olduğu açıkça ayrıldı.

**Nerede:** Bölüm 3.6 ↔ Bölüm 4.10 ↔ Tablo 21

Yöntem ve sonuç iki farklı görev tanımlıyor:

| | Bölüm 3.6 (Yöntem) | Bölüm 4.10 (Sonuç) |
|---|---|---|
| Etiket uzayı | *"ihbarı 13 alt kategoriden **birine** atar"* → tek etiketli | *"bir ihbar **birden çok** etiket taşıyabilmekte"* → çok etiketli |
| Karar eşiği | 0,30 (altındaysa "belirsiz" kuyruğu) | 0,50 (sabit) |

Tablo 21'in başlığı da *"n_sınama = 305, çok etiketli, eşik 0,50"* diyor. Yani
raporlanan tüm metin başarımı çok etiketli kurguya aittir; yöntem bölümü ise tek
etiketli bir sınıflandırıcı tarif etmektedir. Mikro-F₁, makro-F₁ ve kesinlik
değerlerinin anlamı iki kurguda farklıdır.

**Yapılacak.** Bölüm 3.6'yı fiilen koşulan kurguya göre yeniden yaz: çok etiketli
sigmoid çıkış, etiket başına bağımsız karar, eşik 0,50. 0,30'luk eşiğin **ne için**
kullanıldığını ayrıca açıkla (muhtemelen "belirsiz" kuyruğu için ikinci bir alt
eşik) — iki eşik aynı paragrafta tanımlanmalı, aksi hâlde tutarsız görünüyor.

### ✅ M-08 🔴 Üç geçilebilirlik kuralı Bölüm 3'te yok, üstelik atıf yanlış `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Katı/Dengeli/Gevşek kurallarının formal tanımı Bölüm 3.2'ye eklendi (Destroyed/Damaged/Possibly damaged eşlemesiyle, düz metin olarak). Bölüm 4.3'teki "Bölüm 3.2'de tanımlanan üç kural" atfı artık doğru, çünkü tanım gerçekten oraya eklendi.

**Nerede:** Bölüm 4.3 ↔ Bölüm 3.2

**Ölçüm:** `Katı kural`, `Dengeli kural` ve `Gevşek kural` ifadelerinin her biri
makalenin tamamında **tam bir kez** geçiyor — üçü de Bölüm 4'te. Bölüm 3'te
**sıfır** kez geçiyorlar.

Buna karşın Bölüm 4.3 *"Bölüm 3.2'de tanımlanan üç kural"* diye atıf yapıyor.
Bölüm 3.2 "Çalışma Alanı ve Veri Kaynakları" bölümüdür ve böyle bir tanım
içermez. Bu hem **eksik yöntem** hem **yanlış çapraz başvuru**.

Tablo 19 (geçilebilirlik duyarlılığı) bu üç kural üzerine kuruludur; kurallar
tanımsız olduğu için tablo okunamaz durumdadır.

**Yapılacak.** Bölüm 3.8'e (ya da yeni 3.10'a) üç kuralın tanımını ekle —
hasar derecesi → geçilebilirlik eşlemesi tablo hâlinde:

| Kural | Destroyed | Damaged | Possibly damaged |
|---|---|---|---|
| Katı | kapalı | kapalı | ceza |
| Dengeli | kapalı | ceza | açık |
| Gevşek | kapalı | açık | açık |

*(Yukarıdaki eşleme öneridir; koşulan koddan doğrulanmalıdır.)* Ardından Bölüm
4.3'teki atfı doğru bölüm numarasına düzelt.

### ✅ M-09 🟠 Vaat edilen iki naif risk tabanı Tablo 22'de yok `[B+D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (13 Eylül 2026) — İki naif taban `model_benchmarks/05_risk_skoru`'nun yerel, tam koşulabilir veri/koduyla (`common_preprocessing.py`, `query.csv`, aynı beş katlı ileri yürüyen bölme) gerçekten koşuldu ve Tablo 22'ye eklendi: R0a (yalnızca `distance_to_fault`, ROC-AUC 0,6364, PR-AUC 0,7544, MCC 0,4755) ve R0b (yalnızca `rolling_mean_7d` — geçmiş yedi günlük ortalama büyüklük, ROC-AUC 0,5005, PR-AUC 0,7255, MCC −0,0411). Bölüm 4.11'e beşinci bir gözlem paragrafı eklenerek bu iki tabanın öğrenilmiş modellere kıyasla nerede durduğu tartışıldı ("Beş gözlem" olarak güncellendi). **Yan bulgu:** `event_count_7d` özniteliği kodda `rolling(window=7).count()` ile hesaplandığından veri kümesinde sabit değerdir (std = 0, her zaman 7) — "sismisite yoğunluğu" tabanı için bunun yerine gerçek bir değişkenlik taşıyan `rolling_mean_7d` kullanıldı; `event_count_7d`'nin kendisinin ayrıştırıcı gücü olmayan bir öznitelik olduğu ayrıca not edilmelidir (bu oturumda metne eklenmedi, ayrı bir gözden geçirme gerektirir).

**Nerede:** Bölüm 3.7 ↔ Tablo 22

Bölüm 3.7: *"Karşılaştırma tabanı olarak lojistik regresyon, rastgele orman ve
XGBoost'un yanı sıra **iki naif taban** da koşulacaktır: yalnızca fay mesafesine
dayalı sıralama ve yalnızca geçmiş sismisite yoğunluğuna dayalı sıralama."*

Tablo 22'de bu iki taban **yok**. Naif tabanlar, PR-AUC'nin temel oranla
karşılaştırılması argümanının tamamlayıcısıdır; yoklukları Bölüm 4.11'in birinci
gözlemini zayıflatır.

**Yapılacak.** İki tabanı koştur ve Tablo 22'ye ekle (her ikisi de tek öznitelikli
sıralama, dakikalar sürer), ya da Bölüm 3.7'deki vaadi kaldır.

### ✅ M-10 🔴 On yedi denklemin tamamı Word'de ham LaTeX olarak duruyor `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — `md2docx.py`/`.md` yolu yerine Word COM otomasyonuyla (UnicodeMath linear format + `BuildUp`) 17 denklemin tamamı gerçek `<m:oMath>` nesnesine çevrildi, sağa hizalı numaralandırmayla. PDF önizlemede tek tek görsel doğrulandı; `\tag`, `\frac`, `\begin{cases}`, `\left` kalıntısı kalmadı.

**Nerede:** Belgenin tamamı

**Ölçüm** (`word/document.xml` üzerinde doğrudan sayım):

| Aranan | Adet | Anlamı |
|---|---|---|
| `<m:oMath>` | **0** | Hiç Word denklem nesnesi yok |
| `w:val="subscript"` | **0** | Hiç gerçek alt simge yok |
| `w:val="superscript"` | **0** | Hiç gerçek üst simge yok |
| `\tag{` | 17 | 17 denklemin numarası ham LaTeX |
| `\frac` | 12 | Kesirler ham |
| `\begin{cases}` | 1 | λ(d) tanımı ham |
| `\left` | 4 | Parantezler ham |

Yani okuyucu Denklem (9) yerine şunu görüyor:

```
\lambda(d) = \begin{cases} 3{,}0 & d < 50\ \text{m} \\ ... \end{cases} \tag{9}
```

Hiçbir dergi bu hâliyle kabul etmez; hoca da okuyamaz.

**Yapılacak.** `.docx` dosyasını `MAKALE_TASLAK_TR.md`'den **`md2docx.py`
dönüştürücüsüyle** yeniden üret — bu betik LaTeX'i gerçek Word alt/üst simge
biçimlendirmesine çevirir (`font.subscript` / `font.superscript`, Cambria Math).
**Ön koşul:** Word üzerinde yapılmış içerik değişiklikleri önce `.md` dosyasına
işlenmeli, yoksa geri gider.

**Not.** Dergi "denklem editörü kullanın" şartı koyarsa bir adım daha gerekir:
denklemlerin Word denklem nesnesine (`<m:oMath>`) dönüştürülmesi. Bu, Word'de
her denklemi seçip **Alt + =** ile dönüştürmekle elle de yapılabilir (17 denklem).

### ✅ M-64 🔴 Bölüm 4.5 sonuçları, Bölüm 3.6'daki düzeltilmiş kuralla değil eski kuralla üretilmiş `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (12 Eylül 2026) — Bölüm 4.5'in yanlış negatif bulgusu paragrafının başına, bu koşumun düzeltilmiş kural öncesi sürümle yürütüldüğünü belirten önerilen cümle eklendi (seçenek 2).

**Nerede:** Bölüm 3.6 ↔ Bölüm 4.5

Bölüm 3.6, anahtar sözcük kurtarma kümesinin beş üst kategoriyi kapsayacak
şekilde "bu sürümde genişletildiğini" söylüyor. Bölüm 4.5'teki iki yanlış
negatif ise **düzeltme öncesi** kuralın sonucu. Yöntemde anlatılan sistem ile
sonuçları raporlanan sistem aynı sistem değil; bu durum şu an satır aralarında
kalıyor ve M-06/A4 tarzı bir "yöntem ↔ sonuç" çelişkisidir.

**Yapılacak (tercih sırası):** (1) Senaryoyu düzeltilmiş kuralla yeniden koşup
sonucu raporla — en temiz çözüm, tek ek koşum gerektirir. (2) Mümkün değilse
Bölüm 4.5'in başına açık bir not düş: *"Bu koşum, Bölüm 3.6'da tanımlanan
genişletilmiş kurtarma kuralı uygulanmadan önceki sürümle yürütülmüştür;
düzeltilmiş kuralla yeniden koşum gelecek sürümdedir."*

---

# BÖLÜM 2 — YÖNTEM VE İÇ TUTARLILIK

### ✅ M-11 🟠 Model seçimi ortalama IoU ile yapılmış — makale ortalama IoU'yu eleştiriyor `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Seçenek (b) uygulandı: Bölüm 4.2'nin sapma listesine önerilen açıklama cümlesi eklendi.

**Nerede:** `build_notebook.py` satır 278 ↔ Bölüm 4.2

Makale, arka plan baskınlığı nedeniyle ortalama IoU'nun yanıltıcı olduğunu
savunuyor ve bu yüzden IoU_hasar'ı esas ölçüt olarak seçiyor. Ancak koşulan kod:

```python
if val_metrics['mean_iou'] > best_val_iou:
    best_val_iou = val_metrics['mean_iou']; epochs_no_improve = 0
```

Yani **saklanan en iyi ağırlık ve erken durdurma kararı ortalama IoU üzerinden**
verilmiştir. Raporlanan test ölçütü IoU_hasar olsa da, o ölçütü üreten model
başka bir ölçüte göre seçilmiştir. Hakem bu noktayı ölçüt tartışmasının
inandırıcılığına karşı kullanır.

**Yapılacak (biri):**
- **(a)** Erken durdurmayı `iou_fg` üzerinden yapıp beş mimariyi yeniden koştur
  (aynı koşumda M-01 de kapatılabilir).
- **(b)** Bölüm 4.2'ye açık bir cümle ekle: *"Model seçimi ortalama IoU üzerinden
  yapılmış, raporlama ise IoU_hasar üzerinden verilmiştir; bu seçim tüm
  mimariler için aynı olduğundan karşılaştırmayı yanlı kılmaz, ancak mutlak
  IoU_hasar değerleri ölçüt-uyumlu bir seçimle elde edilebilecek olandan düşük
  olabilir."*

### ✅ M-12 🟠 Yakınlaştırma düzeyi seçiminde üç hata `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Formüle cos φ düzeltmesi eklendi, "harita karosu" ile "model karosu" terimleri ayrıldı, "altı" ifadesi bir kenardaki karo sayısı olarak netleştirildi (mozaik başına en fazla 36 karo) ve Hatay için sayısal bir örnek eklendi.

**Nerede:** Bölüm 3.3

Metin: *"yakınlaştırma düzeyi z, hedef karo sayısı altı olacak biçimde ve
z ∈ [13, 18] aralığında otomatik seçilmektedir."*

Üç sorun:

1. **Enlem düzeltmesi yok.** Web Mercator'da yer çözünürlüğü
   `156543,03 · cos φ / 2^z` m/piksel'dir. Hatay ≈ 36,2° K için `cos φ ≈ 0,807`;
   düzeltme uygulanmazsa hesaplanan alan gerçekte kapsanandan **%24 büyük**
   görünür. Formül metinde hiç verilmemiş.
2. **İki farklı "karo" karışmış.** Sağlayıcının döndürdüğü harita karosu
   256 × 256 (ya da 512 × 512) pikseldir; modelin işlediği karo 512 × 512'dir.
   "Hedef karo sayısı altı" hangisine ait belirsiz.
3. **"Altı" muhtemelen bir kenardaki sayı.** Altı karolu bir mozaik 6 × 6 = **36**
   karo demektir. Metin toplam sayı izlenimi veriyor; çıkarım süresi tahmini buna
   göre altı kat yanlış olur.

**Yapılacak.** Bölüm 3.3'e açık formülü yaz (enlem düzeltmesiyle birlikte),
"harita karosu" ile "model karosu" terimlerini ayır, altı sayısının kenar başına
mı toplam mı olduğunu netleştir ve bir sayısal örnek ver (ör. *r* = 2 km, φ = 36,2° →
z = ?, kaç karo, kaç piksel).

### ✅ M-13 🟡 λ(d)'nin ilk basamağı sert kapatma yarıçapıyla örtüşüyor `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Denklem (9)'un altına önerilen cümle eklendi: sert kapatma nedeniyle r_h = 25 m'den yakın kenarların zaten çizgeden çıkarıldığı, dolayısıyla ilk basamağın fiilen yalnızca r_h ≤ d < 50 m aralığında etkili olduğu belirtildi.

**Nerede:** Bölüm 3.8, Denklem (9)

Sert kapatma: *"kenar geometrisine en kısa dik uzaklığı r_h = 25 m'den küçük olan
tüm kenarlar çizgeden çıkarılır."*
Yumuşak ceza: `λ(d) = 3,0` için `d < 50 m`.

25 m'den yakın kenarlar zaten çizgeden çıkarıldığı için `λ = 3,0` basamağı
fiilen yalnızca **25 ≤ d < 50 m** bandında çalışır. Metin bunu söylemiyor; okuyucu
0–50 m bandının cezalandırıldığını sanıyor. Denklemin yazıldığı gibi okunması
sert kapatmayla çelişiyor.

**Yapılacak.** Denklem (9)'un altına bir cümle: *"İlk basamağın etkin aralığı
r_h = 25 m ≤ d < 50 m'dir; d < r_h olan kenarlar sert kapatma ile zaten
çizgeden çıkarılmıştır."* Alternatif olarak basamak sınırını 25 m'den başlat.

### ✅ M-14 🟡 Kenar orta noktası ölçütü bir yerde reddedilip başka yerde kullanılıyor `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Kullanıcının talimatıyla gerçek kod incelendi (`model_benchmarks/06_rota/common.py`). Sonuç, sorudan daha köklü çıktı: (i) hem sert kapatma hem yumuşak ceza, kenar geometrisi değil iki uç düğümün koordinat ortalaması ("orta nokta") kullanıyor — makalenin "kenar geometrisine dik uzaklık" iddiası her iki mekanizma için de yanlış; (ii) yumuşak ceza gerçekte Denklem (9)'un dört basamaklı yapısı değil, d≤150m için sürekli doğrusal bir azalma (1+4·(1−d/150), r_h=25m eşiği birebir doğru) kullanıyor. Bölüm 3.8(a), (b) ve Denklem (9) sonrası açıklama hedeflenen/koşulan ayrımıyla yeniden yazıldı; koşulan gerçek formül ve orta-nokta ölçütü açıkça belirtildi.

**Nerede (eski):**
**Nerede:** Bölüm 5 (sınırlılıklar) ↔ Tablo 4 / Bölüm 3.8

- **Sınırlılıklar:** *"Uzaklık ölçütünün kenar orta noktası yerine kenar geometrisi
  üzerinden tanımlanması gereklidir… orta nokta ölçütü, kenarın bir ucunda
  gerçekleşen bir kapanmayı sistematik olarak kaçırmaktadır."*
- **Yöntem (Tablo 4 notu):** *"'Damaged' derecesine karşılık gelen ceza, ilgili
  kesimin **orta noktası** hasar noktası kabul edilerek Denklem (9) üzerinden
  uygulanır."*

Yani makale, kendi eleştirdiği ölçütü yöntemin içinde kullanmaya devam ediyor.
Bu savunulabilir bir tasarım kararıdır ama **çelişki gibi okunuyor** çünkü iki
yerde bağlantı kurulmamış.

**Yapılacak.** Tablo 4 notuna açık bir gerekçe ekle: *"Bu sürümde 'Damaged'
cezası, hesap yükü nedeniyle kesim orta noktası üzerinden uygulanmıştır; ölçütün
kenar geometrisine taşınması Bölüm 5'te sınırlılık olarak kaydedilmiştir."*
Sert kapatmanın zaten kenar geometrisi kullandığını da belirt — asimetri
kasıtlıdır ve bunu söylemek gerekir.

### ✅ M-15 🟠 Kip (zaman) tutarsızlıkları `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Bölüm 3.4'teki üç satır düzeltildi ("kullanılacaktır"→"kullanılmıştır", "sabit tutulacaktır"→"sabit tutulmuştur", "raporlanacaktır"→"verilmektedir"). Bölüm 3.7'deki iki satır zaten A3/M-06 kapsamında daha önce düzeltilmişti. Tablodaki beş satırın tamamı artık kapalı.

Yapılmış işler gelecek zamanla anlatılıyor. Hakem bunu "yapılmamış deneyin
yapılmış gibi" ya da tersi olarak okur.

| Nerede | Mevcut | Olması gereken |
|---|---|---|
| Bölüm 3.4 | "…kullanılacaktır" (kayıp fonksiyonu) | "…kullanılmıştır" |
| Bölüm 3.4 | "…sabit tutulacaktır" (bileşim ağırlıkları) | "…sabit tutulmuştur" |
| Bölüm 3.4 | "…Bölüm 4.1.2'de raporlanacaktır" | "…Bölüm 4.1.2'de verilmektedir" |
| Bölüm 3.7 | "…koşulacaktır" (kıyas tabanları) | "…koşulmuştur" (Tablo 22 mevcut) |
| Bölüm 3.7 | "Bu karşılaştırma ve olasılık kalibrasyonu henüz yapılmamıştır" | Karşılaştırma **yapılmıştır** (Tablo 22); yalnızca kalibrasyon yapılmamıştır |

### ✅ M-16 🟠 Bölüm 4.1.1 kendisiyle çelişiyor `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (16 Eylül 2026) — Bölüm 4.1.1 M-22 kapsamında yeniden yazıldı: "nihai metinde doldurulacaktır" cümlesi kaldırıldı, senaryo ve eğitim ortamı Tablo 12'de (eski 11) dolduruldu, kaydedilmemiş alanlar açıkça işaretlendi.
**Durum: KISMEN TAMAMLANDI** (12 Eylül 2026) — Çelişkili cümle düzeltildi: artık Bölüm 4.2'deki karşılaştırmanın bu sürümde zaten yürütüldüğü, ancak grafik işlemci dışındaki donanım/yazılım bilgilerinin kayıt altına alınmadığı doğru biçimde ifade ediliyor. **Tablo 11'in eğitim ortamı alanlarının gerçek değerlerle doldurulması hâlâ açık** — bu iş ayrıca M-22'de izleniyor.

**Nerede:** Bölüm 4.1.1, Tablo 11 öncesi

Metin: *"Senaryo koşum ortamına ait alanlar hâlihazırda bilinmekte olup nihai
metinde doldurulacaktır; eğitim ortamına ait alanlar **Bölüm 4.2'deki karşılaştırma
yürütüldükten sonra** raporlanacaktır."*

Bölüm 4.2'deki karşılaştırma **zaten yürütülmüştür** — Tablo 12 dolu, beş
mimarinin sonuçları depoda. Dolayısıyla cümle, aynı makalenin bir sonraki
bölümünde sunduğu sonucu "henüz yapılmamış" saymaktadır.

**Yapılacak.** Cümleyi kaldır ve Tablo 11'in eğitim ortamı alanlarını doldur:
koşum Colab üzerinde yapıldıysa GPU modeli, RAM, sürücü ve kütüphane sürümleri
`local_colab_run` çıktılarından okunabilir.

### ✅ M-17 🟡 Bölüm 3.6'daki "belirsiz" durumu — kodda mı, kâğıtta mı? `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Kullanıcının talimatıyla gerçek kod incelendi (`apps/disaster_nlp/src/classification.py:118-119`, `pipeline.py:28-30`). Sonuç makalenin iddiasının **tam tersi**: 0,30 altındaki kayıtlar "belirsiz" bir kuyruğa değil, doğrudan ve geri döndürülemez biçimde "Alakasız" kategorisine atanıyor; coğrafi kodlama çalıştırılmıyor (atlanıyor), operatöre düşen ayrı bir durum yok. Bölüm 3.6 gerçek davranışa göre yeniden yazıldı.

**Nerede (eski):**
**Nerede:** Bölüm 3.6, ikinci aşama

Metin, düşük güvenli kayıtların "belirsiz" durumuna alınıp operatör kuyruğuna
düşürüldüğünü **şimdiki zamanla** anlatıyor. Ancak aynı paragraf bunun "bu sürümde
yapılan bir tasarım değişikliği" olduğunu söylüyor — bu ifade, değişikliğin
**makalede mi kodda mı** yapıldığını belirsiz bırakıyor.

**Yapılacak.** Kodda uygulanmışsa dosya/fonksiyon adını belirt. Uygulanmamışsa
kipi gelecek zamana çevir ve Bölüm 5.3'e bir sınırlılık maddesi ekle.

### ✅ M-18 🟡 Tablo 12'nin ortalama IoU değerleri metinde, sütunda değil `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Tabloya "Ortalama IoU (yardımcı)" sütunu eklendi (5 değer + SegFormer için boş hücre), dipnot metni korunarak kısaltıldı.

**Nerede:** Bölüm 4.2, Tablo 12 sonrası paragraf

LinkNet 0,6752; U-Net 0,6680; FPN 0,6638; DeepLabV3+ 0,6614; PSPNet 0,6603
değerleri düz metinde veriliyor. Gerekçe doğru (arka plan baskınlığı) ama beş
sayının metne gömülmesi okunurluğu düşürüyor.

**Yapılacak.** Tabloya "Ortalama IoU (yardımcı)" sütunu ekle, dipnotla uyarıyı
koru. **Uyarı:** SegFormer hücresi bu sütunda da boş kalmalı — 0,4276 ortalama
IoU değil, doğrulama ön plan IoU'sudur.

### ✅ M-19 ⚪ Bölüm 4.10'daki "Tablo 23" atfı dolaylı `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Cümle önerilen açık ifadeyle güncellendi.

**Nerede:** Bölüm 4.10, kısıtlar paragrafı — *"dolayısıyla Tablo 23'te hedeflenen
ölçüm bu tabloyla karşılanmamaktadır"*

Atıf doğru görünüyor ancak okuyucu için dolaylı.

**Yapılacak.** Açık yaz: "…beş üst kategori üzerindeki ölçüm (Tablo 23, üçüncü
satır) bu tabloyla karşılanmamaktadır."

### ✅ M-49 🟠 Giriş'teki 2. katkı iddiası, Bölüm 4'te karşılanmıyor `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (12 Eylül 2026) — Katkı 2 metni "ayrı ayrı raporlanmaktadır" yerine ölçülene indirgendi ve denetimin yalnızca kapanma oranının EMSR648 ile tutarlılığına ilişkin olduğu, uzamsal konum doğrulamasını kapsamadığı (Bölüm 5.3l) açıkça belirtildi.

**Nerede:** Giriş, katkı listesi 2. madde ↔ Tablo 19 (operasyonel sütunlar hâlâ boş, ayrıca bkz. M-26)

### ✅ M-50 🟠 Kodlayıcı sabitlemesi iddiası ile Tablo 6'daki gerçek durum uyuşmuyor `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — Bölüm 3.4'teki cümle düzeltildi: "ilk koşum kendi içinde tutarlıdır" ifadesi, neyin tutarlı olduğu (kademe sayısı) ve hedeflenen kurgudan (MiT-B4'te sabitlenmiş kodlayıcı) nasıl ayrıldığı açıkça belirtilerek yeniden yazıldı.

**Nerede:** Bölüm 3.4 ↔ Tablo 6

### ✅ M-51 🟡 ÖZ'deki `t_u` tanımı Bölüm 3.8'inkiyle çelişiyor `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (12 Eylül 2026) — ÖZ ve ABSTRACT'ta "keşif ve geri dönüş cezası" / "exploration-and-return penalty" ifadeleri "yeniden yönlendirme cezası" / "re-routing penalty" olarak değiştirildi; artık Bölüm 3.8'in `t_u` tanımıyla (kavşakta durum değerlendirmesi ve yeniden yönlenme süresi) çelişmiyor.

**Nerede:** ÖZ · ABSTRACT ↔ Bölüm 3.8

### ✅ M-52 🟡 Bölüm 4.2'de "hasarsız karoların %95'i elenmiştir" — sonuçlara etkisi tartışılmamış `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — Bölüm 4.2'ye bu elemenin sınama kümesindeki sınıf dağılımını gerçek dağılımdan uzaklaştırdığı, doğruluk/özgüllük/kesinliği iyimser yönde etkileyebileceği eklendi; sapma listesine (iv) maddesi olarak da işlendi.

**Nerede:** Bölüm 4.2, "Veri kümesi" paragrafı

### ✅ M-53 🟡 Tablo 12'de iki değer birden kalın — okuyucu hangisinin ne olduğunu ayıramıyor `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — LinkNet satırına `†` işareti eklendi ("kıyaslanabilir beş mimari içindeki en yüksek değer"), SegFormer'ın mevcut `*` dipnotu ayrı bırakıldı; iki işaretin anlamını ayıran açıklayıcı bir not eklendi.

**Nerede:** Tablo 12, IoU_hasar sütunu

### ✅ M-54 🟡 Bölüm 3.4 "Ağırlık başlangıcı" paragrafı gelecek zamanda ama koşum yapılmış `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — Paragraf hedeflenen/koşulan ayrımıyla yeniden yazıldı: hedeflenen kurguda aynı başlangıç/aynı tohum öngörüldüğü, ancak bu sürümde koşulan yapılandırmada başlangıç ağırlıklarının mimari başına farklı olduğu ve tek tohumla koşulduğu açıkça belirtildi.

**Nerede:** Bölüm 3.4, "Ağırlık başlangıcı" paragrafı ↔ Tablo 6

### ✅ M-55 🟠 Bölüm 5.3'te iki sınırlılık eksik `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — (n) ve (o) maddeleri eklendi: (n) risk sınıflandırmasında declustering'in uygulanmadığı; (o) SegFormer'ın diğer beş mimariden farklı bölme protokolüyle değerlendirildiği (Tablo 12 dipnotuna bağlantılı).

**Nerede:** Bölüm 5.3, (m)'den sonra

### ✅ M-63 🟠 Risk skorlamada pozitif sınıf tanımı yok `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (13 Eylül 2026) — `common_preprocessing.py`'deki `build_label_30d` fonksiyonu incelenerek pozitif sınıfın resmî tanımı Bölüm 3.7'ye eklendi: katalogdaki i. kayıt için, kayıt zamanından itibaren 30 gün içinde ve 100 km yarıçapta M ≥ 4,0 bir olay gerçekleşirse y_i = 1. Ayrıca birim tutarsızlığı da giderildi: Bölüm 3.7 "ızgara hücresi" diliyle yazılmıştı ama kod hiçbir uzamsal ızgara/hücre kullanmıyor — özellik/etiket hesaplaması her zaman katalogdaki bireysel deprem kaydı bazında yapılıyor. "Izgara hücresi" ifadeleri "katalog kayıtları/katalogdaki her kayıt" ile değiştirildi; bu artık Bölüm 4.11'in 454 kayıtlık kümesiyle birebir tutarlı.

**Nerede:** Bölüm 3.7 ↔ Bölüm 4.11

Tablo 22'nin tamamı "pozitif oran = 0,687" üzerine kurulu ama "pozitif" ne
demek hiçbir yerde tanımlanmamış (30 gün içinde M ≥ ? büyüklüğünde olay mı?
hücre bazında mı, olay bazında mı?). Ek tutarsızlık: Bölüm 3.7 ızgara hücresi
bazlı öznitelik anlatıyor, Bölüm 4.11 ise olay kaydı bazlı bir küme (454 kayıt)
anlatıyor — birim hangisi?

**Yapılacak.** Pozitif etiketin formal tanımını Bölüm 3.7'ye yaz; analiz
biriminin (hücre mi olay mı) 3.7 ve 4.11'de aynı olduğundan emin ol.

### ✅ M-65 🟡 Algoritma 1 sözde kodunda mantık boşlukları `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Algoritma 1, koddaki `simulate_naive_agent` (`network.py`) okunarak yeniden yazıldı: tek döngü + iç döngü, yol tamamlanınca doğrudan dönüş (satır 14), `I_max = 60` aşılınca ULAŞILAMAZ (satır 15), `ters(e)` tanımı (satır 10), paralel kenarın G_a üzerinden seçimi (satır 8), kavşakta öğrenme (satır 11), süre formülü ayrı satırda. Markdown'dan kalan iki "```" paragrafı silindi; satırlar Algoritma 2 ve 3 ile aynı eş aralıklı biçime getirildi. Metindeki "8. satır" ve "11. satır" atıfları yeni numaralarla örtüşüyor.
**Nerede:** Bölüm 3.8, Algoritma 1

15. satır iç döngüyü kırıyor ama dış döngü (3. satır) devam edip
`Dijkstra(G_a, g, g)` çağırıyor; hedefe varışta dış döngünün de sonlanması
gerekiyor. `I_max = 60` sınırına ulaşıldığında ne döneceği tanımsız. 16. satırın
döngü dışında olduğu girintiden anlaşılmıyor. `e_ters` tanımlanmadan
kullanılıyor.

**Yapılacak.** Sözde kodu girintili biçimde yeniden diz; çıkış koşullarını ve
`e_ters`'i açıkça tanımla; `ULASILAMAZ` durumunun toplam süreye nasıl
yansıdığını belirt.

### ✅ M-66 ⚪ Dijkstra–A* eniyilik doğrulaması niceliksiz `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — "Yol bulma" paragrafına sayı eklendi: Bölüm 4.7'deki deneyde ayrı yazılmış bir Dijkstra uygulaması, A* güzergâhlarının uzunluğunu **90 görevin tamamında en fazla 0,00 m farkla** yeniden üretmiştir (kaynak: `runs/model_gercek_dunya/tablo18.md`, Doğrulama bölümü). İddia "aynı yol" değil "aynı uzunluk" olarak daraltıldı.
**Nerede:** Bölüm 3.8, "Yol bulma" paragrafı

"Dijkstra yalnızca eniyilik denetimi amacıyla koşulmuş ve iki algoritmanın aynı
yolu ürettiği doğrulanmıştır" — kaç güzergâh çifti üzerinde? 18/18 mi? Sayıyı yaz.

### ✅ M-67 🟡 `k = 68` keşif olayı sayısı gerekçelendirilmeli `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (12 Eylül 2026) — Bölüm 4.6'ya, maddenin kendi önerdiği gerekçe (naif ajanın yeniden planlamasının aynı koridora yönlenmesi) eklendi.

**Nerede:** Bölüm 4.6

18 güzergâh için 68 keşif = güzergâh başına ~3,8 kapalı kenara çarpma. Kapanma
oranı %0,6–4,5 iken bu oran yüksek görünüyor.

**Yapılacak.** Bölüm 4.6'ya açıklama ekle (naif ajanın yeniden planlamasının
aynı koridora yönlendirmesi vb.) veya bölge bazında dağılımını ver.

### ✅ M-68 🟡 Tablo 9 aciliyet sıralaması gerekçelendirilmeli `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — Gerekçe 1 cümleden 4 cümleye genişletildi: enkaz altında sıkışmanın zaman baskısı ile diğer acil ihtiyaçlar arasındaki fark açıklandı, Bölüm 4.5'teki kaçırılan medikal çağrılara atıfla varsayımın saha sınaması gerektiği belirtildi.

**Nerede:** Tablo 9 ↔ Bölüm 4.5

"Enkaz kaldırma → 5" iken "Sağlık → 4". Bölüm 4.5'te kaçırılan iki ihbarın
hayati medikal çağrı olması, bu sıralamanın sorgulanmasını kaçınılmaz kılıyor.

**Yapılacak.** Sıralamanın gerekçesini ("hayat kurtarma penceresinin darlığı")
2–3 cümleye çıkar veya sağlık kategorisini yeniden konumlandır.

---

# BÖLÜM 3 — ÖLÇÜM EKSİKLERİ

187 `[ÖLÇÜLECEK]` hücre. Tablo bazında döküm:

### ✅ M-20 🔴 Tablo 18 — Görev tabanlı değerlendirme `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Bölüm 4.7 yeniden yazıldı. Tablo 18, `runs/model_gercek_dunya/tablo18.md`
dosyasından programla aktarıldı (R3 + 15 sert SegFormer ayarı + R0; kesim düzeyi IoU/duyarlılık/kesinlik,
kaçırılan/yanlış kapanma, görev başına süre, "model rota bulamadı", keşif, R0→R3 kazancının yakalanan payı).
Beş kıyaslama mimarisinin satırları çıkarıldı (yol maskeleri yok; metinde gerekçelendirildi). Eklenenler:
deney tasarımı (dünya ≠ planlayıcı bilgisi), drone sahneleri (Help.NGO, OpenAerialMap, 3,4–3,9 cm/px,
609 kesim, gerçek hasar yalnız K-D1), Bulgular (olumsuz sonuç; 30 yumuşak ayarın 2'si %18 ± 23, diğer 28'i
%−26…%+2 — dosyadan doğrulandı), Kısıtlar, R3 notu. Şekil 12 yer tutucusu yeni eksenlere göre güncellendi.
**16 Eylül 2026 — VERİ HAZIR, makaleye işlenecek (sonuç olumsuz).** Deney koşuldu:
`benchmark/model_in_real_world.py` — dünya EMSR648 (gevşek kod kuralı, 8 m tampon),
R3 kusursuz bilgi, R0 naif, model-bilgili QuakeMind SegFormer kapanmalarını bilir;
3 drone sahnesi × 3 görev × 10 tohum; 15 sert + 30 yumuşak ayar. Çıktı:
`runs/model_gercek_dunya/tablo18.md`, ayrıntı `EKSIKLER_VE_SORUNLAR.md` **J-30**.
Sonuç: R3 **2,05 ± 0,15** dk, R0 **6,52 ± 1,92** dk; SegFormer 15 sert ayarda
6,52–6,97 dk (R0→R3 kazancının **%0 ile %−11**'i), yumuşak ayarlarda tutarlı kazanç yok.
**Tablo 18'in yapısı değişmeli:** yalnız SegFormer (diğer 5 modelin yol maskesi yok),
IoU/duyarlılık/kesinlik **kesim düzeyinde** (piksel IoU_hasar değil), drone sahneleri
(gerçek yol hasarı yalnız K-D1'de). Bölüm 4.7 hipotezi desteklenmedi → bkz. **M-80**.

**Eksik:** neredeyse tamamı (8 satır × 8 sütun)

**Makalenin merkezî katkı iddiası budur.** Bölütleme kalitesinin operasyonel
sonuca etkisi ölçülmeden "katkı" olarak savunulması zordur.
**Ön koşul:** kapanma katmanının model çıkarımından türetilmesi (M-23).

### ☐ M-21 🟠 Tablo 5 — Etiketli yol hasarı eğitim kümesi künyesi `[B]`
🏷️ **Etiketler:** ✖ YAPILMADI · ⏳ KALAN · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA · 🖥️ EĞİTİM/KOŞUM GEREKİR
❓ **Soru:** etiketlensin mi, başka küme mi, gelecek çalışma mı?

**Eksik:** kaynak görüntü ve sürüm · toplam karo sayısı · hasarlı piksel oranı ·
etiketleyici sayısı · etiketleyiciler arası uyum · uzman doğrulaması (6 alan)

Bu tablo doldurulmadan Bölüm 4.2'deki karşılaştırma yol eksenine taşınamaz.
**Ön koşul:** yol hasarı için piksel etiketli küme oluşturulması.

**Karar gerekiyor:** (a) kendi kümemizi etiketle · (b) CAU-RoadDamage'ı harici
test kümesi olarak kullan · (c) yol eksenini açıkça gelecek çalışmaya bırak.

### ✅ M-22 🟠 Tablo 11 — Donanım ve `v_ort` `[B+D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🧪 SİMÜLASYONDAN · 🔍 KONTROL EDİN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Tablo 12 (eski 11) yeniden kuruldu. Senaryo ortamı **bu makineden
ölçülerek** yazıldı: Intel Core i7-12700H (14 çekirdek / 20 iş parçacığı), 16 GB, 512 GB SSD, Windows 11
(10.0.26200), GPU hesaplamada yok (Iris Xe tümleşik); yazılım sürümleri arka ucun `venv` ortamından: Python
3.12.6, PyTorch 2.13.0 (CPU), Ultralytics 8.4.116, Transformers 5.14.1, NetworkX 3.6.1, OSMnx 2.1.1,
pyrosm 0.13.1, FastAPI 0.141.1, smp 0.5.0. Eğitim ortamı: T4 (16 GB), diğer alanlar "Kayıt altına
alınmamıştır" (Colab defterlerinin çıktılarında ortam kaydı yok — arandı). `v_ort` = 15,0 km/sa ve
`t_u` = 20,0 dk tabloya "varsayım" olarak eklendi. Bölüm 3.8 "Süre hesabı" paragrafına v_ort değeri,
varsayım olduğu ve oranlara etkisi yazıldı; Bölüm 4.1.1'deki "nihai metinde doldurulacaktır" cümlesi
kaldırıldı. **Not:** kullanıcı işlemciyi "14. nesil" olarak bildirmişti; makinede ölçülen 12. nesil
(i7-12700H) — makaleye ölçülen değer yazıldı.
**16 Eylül 2026:** `v_ort` = 15,0 km/sa ve `t_u` = 20,0 dk **değişmedi** (çoklu tohum
koşularında da aynı). Donanım bilgisi `MAKALE_KUNYE_BILGILERI.md`'de. Madde açık —
yalnız makaleye işlenmesi kaldı.

**Eksik:** Senaryo koşum ortamı 5 alan (`[EKLENECEK]`) + eğitim ortamı 5 alan
(`[ÖLÇÜLECEK]`) + ortalama hız `v_ort`

Senaryo koşum ortamı **bugün bilinmektedir**, hemen doldurulabilir. `v_ort` süre
hesabının temel parametresidir ve makalenin hiçbir yerinde sayısal değeri yoktur —
bu, 206,6 dk / 1 641,0 dk sonuçlarının yeniden üretilmesini imkânsız kılar.
Ayrıca bkz. M-16.

### ⚠️ M-23 🔴 Tablo 13 — Kapanma katmanının yer gerçeğine göre değerlendirilmesi `[B]`
🏷️ **Etiketler:** ◐ KISMEN · ⏳ KALAN · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🖥️ EĞİTİM/KOŞUM GEREKİR · 🧪 SİMÜLASYONDAN
❓ **Soru:** Tablo 14 kaldırılıp Tablo 19'a mı atıf yapılsın, diğer modeller mi ölçülsün?

**16 Eylül 2026 — hâlâ KISMEN.** Tablo 13'ün "Kural" sütunu yeni adlarla güncellendi (Katı / Orta / Gevşek).
Hücreler hâlâ `[ÖLÇÜLECEK]`: SegFormer'ın kesim düzeyi değerleri Tablo 18'de (drone, gevşek kural) var, ama
Tablo 13'ün tasarımı (6 model × 3 kural × τ) bu veriyle doldurulamıyor. Karar gerekiyor: Tablo 13'ü
kaldırıp Tablo 18'e atıf mı yapılsın, yoksa diğer beş modelin yol maskeleri mi üretilsin.
**16 Eylül 2026 — KISMEN.** EMSR648 kapanma katmanı sisteme bağlandı (E-01): yol çizgisi →
OSM kenarı eşlemesi (`closures_from_lines`, 8 m tampon, ≥ %50 örtüşme),
`POST /api/road_damage/closures_from_emsr`. **Kapsam: 4 ilçe** (H-Z1, H-Z3, K-Z1, K-Z2);
diğer 4 ilçe EMSR AOI'lerinin dışında. SegFormer ↔ EMSR648 **kesim düzeyi** karşılaştırması
drone sahnelerinde var (J-26; Tablo 18 verisinin IoU/duyarlılık/kesinlik sütunları).
**Açık kalan:** Tablo 13'ün 6 model × 3 kural hücreleri — yalnız SegFormer ve yalnız drone
sahneleri doldurulabilir; diğer beş modelin yol maskesi üretilmedi. Ayrıca kural adları
makale ile kodda ters → **M-76** çözülmeden Tablo 13'ün "Kural" sütunu yazılamaz.

**Eksik:** tablo tamamen boş (6 model × 6 sütun = 36 hücre)

**Ön koşul:** vektör→piksel tampon kuralı ve τ eşiğinin uygulanması.
Bu iş aynı anda M-20'yi ve sentetik kapanma bağımlılığını (M-04) da hafifletir.

### ☐ M-24 🟡 Tablo 14 — Bölgeler arası genelleme `[B]`
🏷️ **Etiketler:** ✖ YAPILMADI · ⏳ KALAN · 👥 SİZ YAPMALISINIZ · 🖥️ EĞİTİM/KOŞUM GEREKİR

**Durum (13 Eylül 2026):** Denetlendi, **düzeltilemedi**. Bu maddenin önceki notu ("yeni veri gerektirmez, yalnızca coğrafi bölme yeterli") **yanlış** çıktı — Bölüm 4.4'ün gövde metni doğrudan okunduğunda bunun risk skorlama değil, Hatay↔Kahramanmaraş arası **bina hasarı bölütleme modeli genellemesi** olduğu görüldü ("Bu tablonun değerleri Bölüm 3.10'da tanımlanan protokolle üretilecektir"). Bu, eğitilmiş altı mimarinin (M-01/M-28 ile aynı model ailesi) bölge bazlı yeniden çıkarımını gerektirir; `model_benchmarks/02_bina_hasari` yerel dizini tamamen boş (ağırlıklar/veri Colab'da, bkz. M-44) — bu ortamdan koşulamaz.

**Eksik:** tablo tamamen boş (6 satır × 5 sütun)

### ✅ M-25 🟠 Tablo 16 — R1 ve R2 ara referansları `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — J-31 verisi (`runs/multi_seed_refs/`) işlendi. Tablo 16'ya R1, R2 ve ek
R1 + R2 satırları beş sütunun tamamı için eklendi (toplam süre, referansa göre kazanç, R0 farkının R1 + R2
karşısında kalan payı, R1 + R2'ye karşı yalnız yol farkı). Değerler tohum başına veriden hesaplandı ve J-31
tablosuyla birebir. Bölüm 3.8'deki R1/R2 tanımlarına uygulama kararları yazıldı (yol boyunca 100 m görüş,
kavşak başına tek ceza, telsizle öğrenilen kapanmanın cezasız olması, kafile kuralı); "R1 ve R2 koşulmamıştır"
cümleleri 3.8, 5.3(b) ve 5.4'ten kaldırıldı. 4.6'ya "Ara referanslar" ve "Referans tanımlarının etkisi"
paragrafları (sayım kuralı 272,0 / 218,6 dk; paylaşım paradoksu; kafile kuralı) eklendi. Öz, Abstract, 5.1 ve
Sonuç'a %80–90 / %55–77 kalan pay cümlesi eklendi.
**16 Eylül 2026 — KOŞU SÜRÜYOR.** `runs/multi_seed_refs/` (10 tohum); tahmini bitiş
~16:10. Sonuç `runs/multi_seed_refs/multi_seed_tablo.md` ve `EKSIKLER_VE_SORUNLAR.md`
**J-31** olarak gelecek. J-29 bulgu 4 bu maddeyi daha önemli kıldı: keşiflerin **%89'u
tek bölgede** (K-Z1) ve R0 her kapalı kenarı tek tek öğreniyor → R1/R2 olmadan toplam
kazanç abartılı okunur.

**Eksik:** iki satır tamamen boş

Bu, kazanç iddiasının en zayıf noktasını kapatan ölçümdür: R0 tek başına
"straw man" olarak okunur. Özellikle **R2 (bilgi paylaşan filo)** gerçek
operasyonel tabana en yakın referanstır.

### ✅ M-26 🟠 Tablo 19 — Geçilebilirlik kuralı duyarlılığı `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — M-76 çözüldükten sonra Tablo 19 yeniden kuruldu: kural × il (Hatay =
H-Z1 + H-Z3, Kahramanmaraş = K-Z1 + K-Z2), ilçe kutularındaki EMSR648 hasarlı kesim sayısı, kapalı OSM kenarı
(sayı ve %), önerilen sistem ve R0 için görev başına süre, keşif, ulaşılamayan ihbar. İl bazındaki değerler
koşu klasörlerinden hesaplandı; il toplamları Tablo 16 ile tutuyor (ör. orta: 57,7 + 96,3 = 154,0). Bölüm 4.8
metni yeni sonuçlara göre yeniden yazıldı.
**16 Eylül 2026 — VERİ HAZIR, ama M-76 çözülmeden işlenemez.** Üç kural 10 tohumla koşuldu
(J-28, J-29): kod `strict` 144,3 ± 23,0 / 197,1 ± 59,9 dk · `medium` 154,0 ± 23,2 /
1 406,2 ± 589,7 dk · `loose` 154,1 ± 23,3 / 1 433,0 ± 607,8 dk (4 ilçe, 13 afetzede).
**Engel:** Tablo 19'daki "Katı / Dengeli / Gevşek" tanımları koşulan `strict / medium /
loose` tanımlarıyla **aynı değil** (bkz. M-76). Ayrıca Tablo 19 il bazında kurgulanmış
(Hatay / Kahramanmaraş satırları); koşu çıktısı ilçe ve toplam bazında.

**Eksik:** operasyonel sütunlar (ortalama ulaşım süresi, ulaşılamayan ihbar) —
12 hücre. Kapalı kesim sayıları ve oranları **doldurulmuş** ✓
**Ön koşul:** M-08 (kuralların tanımlanması) — tanımsız kural duyarlılık
analizini okunmaz kılıyor.

### ⚠️ M-27 🟡 Tablo 20 — Bileşen çıkarma ve parametre duyarlılığı `[B]`
🏷️ **Etiketler:** ◐ KISMEN · ⏳ KALAN · 🖥️ EĞİTİM/KOŞUM GEREKİR · 🧪 SİMÜLASYONDAN

**16 Eylül 2026 — KISMEN.** İki eksen için veri var: (i) `t_u` = 0 / 5 / 10 / 20 / 30 dk,
10 tohum, dokuz yapılandırma (`runs/multi_seed/multi_seed_tablo.md`, son bölüm — Tablo 17
bununla güncellenecek); (ii) sert kapatma yarıçapı `r_h` = 0 / 5 / 10 / 15 / 25 m ve üç
zoom, yalnız SegFormer kapanmaları için, drone sahnelerinde (Tablo 18 verisi). Tablo 20'nin
`r_h` satırı "10 / 25 / 50 / 100 m" diyor — koşulan değerlerle uyuşmuyor. Diğer beş eksen
(harmanlama, morfoloji, kayıp ağırlıkları, V₀, risk ağırlıkları) açık.

**Eksik:** tablo tamamen boş (7 eksen)

Yedi eksenin tamamı elle seçilmiş parametrelerdir; hiçbirinin sonuca duyarlılığı
gösterilmemiştir. `r_h`, λ(d) basamakları ve morfoloji seviyesi öncelikli.

### ✅ M-28 🟡 Tablo 12 — GFLOPs ve çıkarım süresi `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🔍 KONTROL EDİN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Tablo 13'ün (eski Tablo 12) GFLOPs ve çıkarım süresi sütunları altı mimari için dolduruldu; SegFormer'ın parametre sayısı "~64" yerine ölçülen **61,4 M** yazıldı (eğitimdeki `smp.Segformer(encoder_name='mit_b4', classes=1)` kurucusu). "Ölçüt seçimi" paragrafına ölçüm yöntemi eklendi (sarı).
**Araç:** `araclar/verimlilik_olcum.py` (arka ucun venv'iyle çalışır), çıktı `araclar/veri/verimlilik.json`. Ağırlık indirilmez (`encoder_weights=None`); FLOPs ve süre ağırlığa bağlı değil. Diğer beş modelin parametre sayısı eğitim JSON'larıyla birebir aynı çıktı; bu, mimarilerin aynı kurulduğunu doğruluyor.
**Sonuç** (GFLOPs / CPU medyan ms): U-Net 43,2 / 309 · LinkNet 20,9 / 204 · FPN 35,5 / 241 · PSPNet 11,5 / 88 · DeepLabV3+ 111,9 / 657 · SegFormer 116,6 / 1 076.
**Yöntem notları (hakem sorarsa):**
- GFLOPs = 2 × çarpma (MAC) sayısı; `seg_common.efficiency_stats` ile aynı kural. PyTorch 2.13'ün `FlopCounterMode` sayacı zaten 2 × MAC veriyor (tek Conv2d ile denetlendi: elle 21 600, torch 43 200, thop 21 600). mmcv tarzı MAC sayımı bunun yarısını verir; metinde yazıldı.
- thop, SegFormer'daki dikkat matris çarpımlarını saymıyor (99,9 GFLOPs); tabloya torch değeri (116,6) yazıldı, thop değeri metinde.
- Süre: i7-12700H, PyTorch 2.13.0 CPU, 14 iş parçacığı, toplu boyut 1, 5 tur × (3 ısınma + 20 ölçüm), modeller dönüşümlü; 100 ölçümün medyanı. **Dizüstü işlemcide güç sınırı süreleri belirgin değiştiriyor:** ilk tek geçişli denemede U-Net 170 ms, LinkNet 137 ms ölçülmüştü; dönüşümlü koşuda U-Net'in ilk turu 185 ms, sonraki turları 307–312 ms. Metinde "gösterge niteliğinde, GPU'da ölçülmedi" dendi. GPU (T4) değeri istenirse Colab'da aynı betikle ölçülmeli.
**Bulundu:** 12 Eylül 2026
**Eksik:** altı mimarinin tamamı için iki sütun (12 hücre)

Mobil ve uç cihaz argümanı bunlarsız savunulamaz. `seg_common.py` içinde
`efficiency_stats` fonksiyonu mevcut; yeniden eğitim gerektirmez.

### ✅ M-29 🟡 Tablo 15 — Acil çağrı satırı `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (13 Eylül 2026) — Ölçüm yapılmadığı için `[ÖLÇÜLECEK]` hücresi "—" ile değiştirildi (fabrikasyon veri yerine dürüst boşluk); not sütununa "Model çıkarımı içermediğinden gecikme bu kanal için ayrıca ölçülmemiştir" eklendi, "Model çıkarımı içermez" notuyla artık çelişmiyor.

**Eksik:** gecikme hücresi

**Not:** Aynı satırın not sütununda "Model çıkarımı içermez" yazıyor. Model yoksa
gecikme ölçümü ne anlama geliyor? Ya uç nokta yanıt süresi olarak tanımla ya
hücreyi "—" yap.

### ⚠️ M-30 🟡 Gecikme ölçümleri n = 2 `[B]`
🏷️ **Etiketler:** ◐ KISMEN · ⏳ KALAN · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🖥️ EĞİTİM/KOŞUM GEREKİR · 🧪 SİMÜLASYONDAN
❓ **Soru:** arka uç ve dış adres servisi çalıştırılsın mı?

**16 Eylül 2026 — KISMEN.** Tablo 15 ve Bölüm 4.5 yeni ölçümlerle güncellendi: 180 koşu günlüğünden kanal başına
**n = 380** gözlem (YOLOv8 medyan 338,9 ms, p95 1 270,2, p99 1 809,4; BERTurk zinciri medyan 124,5 ms, p95 556,8,
p99 862,8). Gecikme tanımı (istemci tarafında HTTP yanıt süresi, görüntü aktarımı dahil) ve ısınma notu
yazıldı; eski 11 419,4 ms'lik değerin tekrarlanmadığı belirtildi. **Açık kalan:** BERTurk gecikmesinin
bileşenlerine ayrıştırılması.
**Nerede:** Tablo 15, Bölüm 4.5

YOLOv8 için iki gözlem, BERTurk için iki gözlem. Isınma sonrası **en az 100
tekrarla** medyan / p95 / p99 / standart sapma ölçülmelidir. BERTurk'ün
11 419,4 ms'si bileşenlerine ayrıştırılmalıdır (ısınma · biçimbilimsel çözümleme ·
ileri geçiş · varlık ismi tanıma · coğrafi kodlama ağ gecikmesi).

### ✅ M-31 🟠 18 eşleştirilmiş görev için istatistiksel test `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Bölüm 4.6'ya anlamlılık testinin neden raporlanmadığı yazıldı (986 görevin
hiçbirinde negatif fark yok → yapı gereği anlamlı); yerine tohum başına ortalama ± ss, %95 GA, görev düzeyi
medyan/çeyrekler ve kapanmaya çarpan görev oranı raporlandı (Tablo 16 ve "Kazancın dağılımı" paragrafı).
**16 Eylül 2026 — KARAR VERİLDİ: anlamlılık testi kullanılmayacak.** J-29 bulgu 6: klasik
ajan yalnız açık kenarda yürüdüğü için yolu kapanmaları bilen en kısa yoldan kısa
**olamaz**; 986 görevin hiçbirinde fark negatif değil → Wilcoxon p < 0,001 ve r = 1
**yapı gereği** çıkar ve bilgi taşımaz. Bunun yerine raporlanacak: tohum başına toplamların
ortalama ± ss'si ve %95 GA; görev düzeyinde kazanç ve yol farkı medyanı [Ç1; Ç3];
kapanmaya çarpan görev oranı (sentetik %79–82, EMSR gevşek-kod %43, orta-kod %40,
katı-kod %6). Veri hazır: `runs/multi_seed/multi_seed_tablo.md`. Madde makaleye
işlenince kapanacak. Ayrıca "18 görev" ifadesi artık yanlış: birim tohum başına toplamdır.

**Nerede:** Bölüm 4.6 son paragrafı

Sadece toplamlar veriliyor. 352,5 dakikalık uç değer dağılımın ağır kuyruklu
olduğunu gösteriyor. Eklenecekler: görev başına fark tablosu, medyan fark,
çeyrekler arası açıklık, Wilcoxon işaretli sıra testi *p* değeri, Cliff's delta
etki büyüklüğü. **Yeni koşum gerektirmez**, mevcut 18 gözlemden hesaplanır.

### ✅ M-32 🟡 Bölüm 3.3 — Kalite filtresi eşiği ve elenen karo oranı `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (13 Eylül 2026) — Modül bu sürümde uygulanmadığından (paragraf zaten bunu açıkça söylüyordu) değer ölçülemez; `[ÖLÇÜLECEK]` etiketi `[GELECEK ÇALIŞMA]` ile değiştirilip "bu sürümde ölçülmesi beklenen bir eksiklik değil, planlı bir gelecek çalışma bileşenidir" cümlesi eklendi — 187 `[ÖLÇÜLECEK]` sayacını yanlış şişirmesin diye.

**Eksik:** `V₀` eşik değeri ve elenen karo oranı

Modül bu sürümde uygulanmamıştır (makalede açıkça yazıyor). Uygulanırsa iki değer
de ölçülebilir; uygulanmayacaksa bölüm gelecek çalışmaya taşınmalıdır.

### ✅ M-33 🟠 Türkçe metin veri kümesinin kaynağı makalede hiç geçmiyor `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (13 Eylül 2026) — `model_benchmarks/04_turkce_metin/local_run/data_multilabel.py` ve önbelleğe alınmış `data_cache/labels.json` + parquet dosyaları incelenerek künye doğrulandı ve Bölüm 3.6'ya eklendi: kaynak `deprem-private/intent_test_v13_anonymized` (HuggingFace, private, HF_TOKEN gerekir), 2 028 kayıt, tohum 42 ile %70/%15/%15 bölme (1 418/305/305 — Tablo 21'in n_sınama=305 değeriyle birebir uyuşuyor), kayıt zaman damgaları 12–14 Şubat 2023 (6 Şubat depreminin hemen ardından). `labeler` alanı kümenin tamamında tek değer taşıyor ("system_consensus") — yani klasik anlamda çoklu-etiketleyici uyumu hesaplanamıyor; bu ve anonimleştirme yöntemi açık eksiklik olarak metne yazıldı (uydurulmadı). Ayrı bir Tablo eklenmedi (M-41'in SEQ/REF alan otomasyonunu bozma riski nedeniyle) — bilgi düz metin paragrafı olarak eklendi.
**Nerede:** Bölüm 3.6 · Bölüm 4.10 · Veri Erişilebilirliği

**Ölçüm:** `intent_test`, `deprem-private` ve `anonymized` sözcükleri makalede
**sıfır kez** geçiyor. `etiketleyici` üç kez geçiyor ama hepsi Tablo 5'in
(yol hasarı) boş hücrelerinde.

Tablo 21'de sekiz modelin karşılaştırıldığı 305 kayıtlık sınama kümesinin
**nereden geldiği, nasıl etiketlendiği ve erişilebilir olup olmadığı** yazılmamış.
Çok etiketli bir kümede etiketleme yönergesi ve etiketleyiciler arası uyum
olmadan makro-F₁ tartışması yorumlanamaz.

**Yapılacak.** Bölüm 3.6'ya kümenin künyesi için bir tablo ekle: kaynak
(`deprem-private/intent_test_v13_anonymized`), toplam kayıt, eğitim/sınama bölmesi,
kategori dağılımı, etiketleyici sayısı, etiketleme yönergesi, anonimleştirme
yöntemi, erişim koşulu. Erişim kapalıysa Veri Erişilebilirliği beyanında açıkça
belirt (bkz. M-47).

### ✅ M-34 ⚪ Tablo 21'de BiLSTM eğitim süresi boş `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Hücreye "†" işareti ve tablo sonrasına "ölçüm kaydı alınmamıştır" dipnotu eklendi.

Satır: `Çift yönlü UKSB + fastText | 0,5285 | 0,1533 | 0,5666 | 0,4852 | 0,6690 | 0,4368 | —`

Diğer yedi modelin eğitim süresi dolu. Ya ölç ya da "—" için dipnot düş
(ör. "ölçüm kaydı alınmamıştır").

### ⚠️ M-62 🟠 Bölüm 3.5 (YOLOv8) için veri kümesi ve eğitim protokolü tamamen yok `[D]`
🏷️ **Etiketler:** ◐ KISMEN · ⏳ KALAN · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA · 🖥️ EĞİTİM/KOŞUM GEREKİR
❓ **Soru:** bina.pt / catlak.pt'yi kim eğitti, hangi Roboflow projesi ve sürümü?

**16 Eylül 2026 — bilgi bulundu, makaleye henüz yazılmadı (yazarların teyidi bekleniyor).**
Üretimdeki model dosyalarının (`QuakeMindBackend/apps/camera_detection/models/{bina,catlak}.pt`) içinde Ultralytics'in kaydettiği eğitim ayarları ve doğrulama sonuçları var. Kod çalıştırılmadan okundu (`araclar/pt_meta.py`):

| | `bina.pt` | `catlak.pt` |
|---|---|---|
| Eğitim tarihi | 10 Mayıs 2025 | 11 Mayıs 2025 |
| Ultralytics | 8.2.103 | 8.2.103 |
| Başlangıç ağırlığı | YOLOv8s (COCO) | YOLOv8s (COCO) |
| Veri yolu (Colab) | `datasets/maras-2/data.yaml` | `datasets/crack-2/data.yaml` |
| Sınıflar | `0_NoDamage`, `1_ModerateDamage`, `2_VeryHeavyDamage` | `crack` |
| Devir | 40 planlı, sabır 5 → **21'de durdu**, en iyi 16 | 150 (sabır 20), en iyi 140 |
| Toplu boyut / görüntü | 32 / 640 | 32 / 640 |
| Eniyileyici, lr0 | auto, 0,01 | SGD, 0,001; `augment=True` |
| Tohum | 0 (deterministik) | 0 (deterministik) |
| **Doğrulama** kesinlik / duyarlılık | 0,596 / 0,585 | 0,831 / 0,647 |
| **Doğrulama** mAP@50 / mAP@50-95 | **0,592 / 0,394** | **0,731 / 0,584** |

**Dikkat:**
1. Bu değerler eğitim sırasındaki **doğrulama bölmesinden**; ayrı bir sınama kümesinde ölçülmüş değil. Makalede böyle yazılmalı.
2. **Veri kümesi kimliği kesin değil.** Makale dalındaki kıyaslama defteri (`model_benchmarks/03_yer_seviyesi/local_colab_run/`) Roboflow'da `ofgg/maras-tpx5p` **sürüm 4** ve `akash-roy-edivz/building-crack-detection-ys4zf` **sürüm 3** kullanıyor. Model dosyaları ise `maras` projesinin **2. sürümü** ve `crack` adlı bir projenin **2. sürümüyle** eğitilmiş. Görüntü sayısı ve bölme oranları model dosyasında yok. → Modelleri eğiten kişi hangi Roboflow projesi/sürümü olduğunu teyit etmeli.
3. Kıyaslama defteri (YOLOv8 n/s/m/l, YOLO11s, RT-DETR, SimAM, Faster R-CNN) **hiç çalıştırılmamış** (çıktı ve sonuç dosyası yok).
4. Makaledeki sınıf adı "ağır hasarlı"; modelde `VeryHeavyDamage` (çok ağır hasar). Tablo 7 ve Tablo 8 buna göre gözden geçirilmeli.
5. Defterde Roboflow API anahtarı açık yazılı → `EKSIKLER_VE_SORUNLAR.md` D-08.
**Bulundu:** 12 Eylül 2026
**Nerede:** Bölüm 3.5

İki YOLOv8 modeli tarif ediliyor ama şunların hiçbiri yok: eğitim veri kümesi
(kaynak, boyut, etiketleme), sınıf dağılımı, eğitim hiperparametreleri, bölme
stratejisi, mAP değeri. Tablo 23'te `[ÖLÇÜLECEK]`, ama **yöntem tarafı da boş**.

**Yapılacak.** En azından veri kümesi künyesi ve eğitim ayarlarını Bölüm 3.5'e
yaz; mAP sonradan doldurulabilir. (M-21'in yol hasarı eğitim kümesi eksiğiyle
karıştırılmamalı — bu madde yer seviyesi hasar tespiti içindir.)

### ⚠️ M-57 🟠 Tablo 13'te `τ` sütunu `[ÖLÇÜLECEK]` olarak yanlış etiketlenmiş `[D]`
🏷️ **Etiketler:** ◐ KISMEN · ⏳ KALAN · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🖥️ EĞİTİM/KOŞUM GEREKİR
❓ **Soru:** Tablo 14 kalırsa τ tarama değerleri ne olsun?

**Durum: KISMEN TAMAMLANDI** (12 Eylül 2026) — `τ` hücreleri `[ÖLÇÜLECEK]`'ten
`[TARANACAK]`'a çevrildi (τ bir ölçülecek sonuç değil, taranacak bir
parametredir); Bölüm 3.10'daki yanlış "Tablo 12" atfı "Tablo 13" olarak
düzeltildi. **Somut tarama değerlerinin ({0,1; 0,3; 0,5} gibi) girilmesi ve
tablonun operasyonel sütunlarının doldurulması hâlâ açık** — bkz. M-26.

**Nerede:** Tablo 13, τ sütunu ↔ Bölüm 3.10

---

# BÖLÜM 4 — KAYNAKÇA

### ✅ M-35 🟠 Altı kaynak yazarsız `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — [23], [24], [25], [29], [31]'in yazar listeleri web aramasıyla doğrulanıp eklendi (Qu vd.; Zhang vd.; Cha vd.; Al Shafian vd.; Kowsari — bu sonuncusu tek yazarlı). [24]'te ayrıca hatalı cilt/madde numarası (133/104123) düzeltildi (doğrusu 131/103985, iki bağımsız kaynakla doğrulandı). [57] için M-38'de ayrıca işlendi.
**Kaynaklar:** [23], [24], [25], [29], [31], [57]

Bu altı kayıt doğrudan tırnak içinde başlıkla başlıyor, yazar alanı yok. Örnek:

> [23] "Vector-guided post-earthquake damaged road extraction using diffusion-augmented
> remote sensing imagery", *Remote Sensing*, 18 (4): 613, (2026).

[57] ve [56] zaten `[KÜNYE DOĞRULANACAK]` notu taşıyor; diğer dördünde not bile
yok. Hiçbir dergi yazarsız kaynak kabul etmez; ayrıca hakem "bu kaynaklar
gerçekten okundu mu?" sorusunu sorar.

**Yapılacak.** Altı kaydın yazar listelerini DOI üzerinden tamamla. Aynı geçişte
[56] KATE-CD künyesini de doğrula (varsa eşlik eden makaleyi ekle).

### ✅ M-36 🟠 ConvBERTurk ve DistilBERTurk için yanlış kaynak gösterilmiş `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Seçenek (a) uygulandı: metinde ve Tablo 20'de "ConvBERTurk [32,51]" ve "DistilBERTurk [32,52]" olarak güncellendi; [32] gerçek Türkçe ağırlığa, [51]/[52] ise yalnızca dayandıkları mimari makalelerine işaret ettiği açıkça belirtildi.

**Nerede:** Bölüm 4.10, model listesi

Metin: *"…dört önceden eğitilmiş dönüştürücü (BERTurk [32], DistilBERTurk [52],
ConvBERTurk [51]…)"*

Ancak:
- **[51]** = Jiang, Z. ve ark., *"ConvBERT: Improving BERT with span-based dynamic
  convolution"*, NeurIPS 2020 → **mimari** makalesi, Türkçe model değil.
- **[52]** = Sanh, V. ve ark., *"DistilBERT, a distilled version of BERT"*,
  arXiv:1910.01108 → **yöntem** makalesi, Türkçe model değil.

ConvBERTurk ve DistilBERTurk, Stefan Schweter'in Türkçe önceden eğitilmiş
modelleridir — yani **[32]** ile aynı kaynağa aittir. Şu anki hâliyle makale,
kullandığı ağırlıkların kaynağını yanlış göstermektedir.

**Yapılacak.** İki seçenekten biri:
- **(a)** Her iki modeli de [32]'ye atıfla ver, mimari kaynaklarını ikincil
  olarak belirt: *"DistilBERTurk [32] (damıtma yöntemi [52]), ConvBERTurk [32]
  (mimari [51])"*.
- **(b)** Schweter'in model kartlarına ayrı birer kaynak ekle
  (`dbmdz/distilbert-base-turkish-cased`, `dbmdz/convbert-base-turkish-cased`).

### ✅ M-37 🟡 [1] hem AFAD raporu hem deprem kataloğu kaynağı olarak kullanılıyor `[D]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Katalog için ayrı bir kaynak eklendi: [58] AFAD Deprem Dairesi Başkanlığı, "Deprem Kataloğu (Event Catalog)", https://deprem.afad.gov.tr/event-catalog (URL web aramasıyla doğrulandı). Tablo 2'deki "AFAD deprem kataloğu" satırı [1]'den [58]'e güncellendi.

[1] = AFAD *Ön Değerlendirme Raporu* (2023). Bu bir olay raporudur; Bölüm 3.7'de
risk modelinin eğitildiği **deprem kataloğu** için de aynı numara kullanılıyor.
İkisi farklı veri ürünleridir.

**Yapılacak.** Katalog için ayrı bir kaynak ekle (AFAD Deprem Kataloğu / TDVMS,
erişim tarihi ve sorgu aralığıyla birlikte). Tablo 2'deki satırla tutarlı olmalı.

### ✅ M-38 ⚪ [56] ve [57] künye doğrulaması `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — [56] için gerçek bir eşlik eden makale bulundu (Musaoğlu vd., Journal of Applied Remote Sensing 2025) ve kaynak buna güncellendi; veri kümesi URL'si ayrıca korundu. [57] için yazar listesi (Gao vd.) eklendi. İki `[KÜNYE DOĞRULANACAK]` notu da kaldırıldı.

İki kayıt `[KÜNYE DOĞRULANACAK]` notu taşıyor. M-35 ile aynı geçişte kapatılmalı.

### ✅ M-60 ⚪ "et al." kullanımı tutarsız `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — [5] ve [12], çoğunluk kuralına (tam yazar listesi) uydurularak düzeltildi; tam yazar listeleri web aramasıyla doğrulandı ve bu sırada iki hatalı bilgi de (cilt/madde no ve sayfa aralığı) düzeltilip DOI eklendi. Artık makalede "et al." kullanan tek referans kalmadı.

**Nerede:** Kaynakça [5], [12]

### ✅ M-61 🟡 Yazılım kaynakları atıfsız `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — PyTorch, Transformers ve NetworkX referanslarına DOI eklendi. Ayrıca Transformers referansındaki ([61]) yanlışlıkla eklenmiş 11 fazladan yazar adı (gerçek ACL Anthology kaydıyla karşılaştırılarak) kaldırıldı — bu, önceki bir oturumda tanıtılmış bir hataydı.

**Önceki not:** (12 Eylül 2026) — Bölüm 4.1.3'teki PyTorch, segmentation_models_pytorch, HuggingFace Transformers ve NetworkX'e yeni kaynaklar eklendi ([59]-[62]); PostGIS için de [63] eklendi. **Bu referansların DOI/URL ve erişim tarihi eksiksizliği ayrıca M-73/M-74 kapsamında denetlenmeli** — hızlı eklenen kayıtlar için tam biçim kontrolü yapılmadı.

**Nerede:** Bölüm 4.1.3

### ✅ M-73 🟡 2026 tarihli dört kaynak teyit edilmeli `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — Dördü de gerçekten var/yayımlanmış bulundu: [7] Springer'da çevrimiçi erken yayın (DOI eklendi, basılı cilt/sayfa henüz atanmamış), [23] Remote Sensing'de basılmış (DOI eklendi), [26] AAAI-26'da sunulmuş (arXiv kimliği eklendi), [31] engrXiv'de gerçek bir preprint (tek yazarlı, doğrulandı).
**Nerede:** Kaynakça [7], [23], [26], [31]

Hepsi 2026 tarihli. Yayımlanmış / baskıda / preprint durumları doğrulanmalı,
DOI eklenmeli, gerekiyorsa "(baskıda)" belirtilmeli. [7] cilt/sayfa bilgisi de
eksik.

### ✅ M-74 ⚪ DOI/URL bilgileri genel olarak eksik `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 🔍 KONTROL EDİN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Kaynakçada DOI/URL'si olmayan kayıt kalmadı (64/64). Bu oturumda belgedeki **tüm bağlantılar tek tek açıldı** (curl; bot engeli verenler tarayıcıyla), erişim tarihi bu yüzden dürüstçe "16.09.2026" yazıldı. Biçim: URL'den hemen sonra `(Erişim tarihi: 16.09.2026)`; dergi seçilince (M-42) dergi biçimine çevrilmeli.
- **[1] AFAD raporu:** `deprem.afad.gov.tr/assets/pdf/Kahramanmaras%20%20Depremleri_%20On%20Degerlendirme%20Raporu.pdf` (HTTP 200, PDF, 2,4 MB; başlık arama sonucunda birebir).
- **[2] Kandilli:** özgün kayıttaki "06 Şubat 2023 Depremleri Basın Bülteni" adlı belge **bulunamadı**. Yerine merkezin aynı gün yayımladığı iki gerçek basın bülteni yazıldı: "06 Şubat 2023 Mw=7.7 Sofalaca Şehitkamil Gaziantep Depremi" (05:37'de yayımlandı, PDF adı 20230206_0117 → 04:17 yerel) ve "06 Şubat 2023 Mw=7.6 Ekinözü Kahramanmaraş Depremi" (13:52'de yayımlandı, 10:24 UTC → 13:24 yerel). **Dikkat:** Kandilli dış merkezi AFAD'dan farklı adlandırıyor (Sofalaca–Şehitkamil / Ekinözü; AFAD: Pazarcık / Elbistan). Giriş'e bunu söyleyen bir cümle eklendi (sarı).
- **[6] EMS-98:** DataCite'tan `doi:10.2312/EMS-98.full.en`, seri cilt 15 eklendi.
- **[46] Maxar:** eski adres artık `vantor.com/company/open-data-program/`'a yönleniyor (Maxar Intelligence 1 Ekim 2025'te **Vantor** adını aldı). Sayfa lisansı **CC BY-NC 4.0** olarak veriyor; kayda, Tablo 2'nin Maxar satırına ve Veri Erişilebilirliği'ne yazıldı.
- **[60]** depo `qubvel-org` altına taşınmış; adres güncellendi.
- [4], [8], [30], [40], [44], [45], [47], [56], [58], [63], [64]: erişim tarihi eklendi ya da "2026" → "16.09.2026" yapıldı. [4] FEMA ve [57] Zenodo curl'e 403 veriyor (bot engeli); FEMA tarayıcıda dosyayı sundu, Zenodo API'si yanıt veriyor.
**Bulundu:** 12 Eylül 2026
**Önceki durum: KISMEN TAMAMLANDI** (13 Eylül 2026) — Web taramasıyla doğrulanan 9 kayda DOI/URL eklendi: [4] FEMA HAZUS (doğrudan PDF URL'si), [8] Copernicus EMSR648 (aktivasyon sayfası URL'si), [26] EIDSeg (arXiv DOI), [30] HeiGIT (blog URL'si), [31] Kowsari (engrXiv DOI 10.31224/7979), [40] Ultralytics YOLOv8 (GitHub deposu URL'si), [48] CatBoost (ACM DL DOI 10.5555/3327757.3327770), [49] Decoupled Weight Decay/AdamW (arXiv DOI), [55] LightGBM (ACM DL DOI 10.5555/3294996.3295074) — hepsi arama sonuçlarında doğrudan görülen bağlantılardan alındı, uydurulmadı. **[1] AFAD raporu, [2] Kandilli basın bülteni ve [6] EMS-98** için güvenilir/doğrulanabilir bir URL bulunamadı (bir aday AFAD URL'si WebFetch ile denendi, geçersiz çıktı) — bu üçü kasıtlı olarak değiştirilmedi; tahmini/kırık bağlantı eklemek doğrulanamayan bilgi eklemekten daha kötü olur.

**Nerede:** Kaynakçanın tamamı

[57], [5], [12] dışında (M-60'ta DOI eklendi) hiçbir kaynakta DOI yok. Web
kaynaklarında ([44]–[47], yeni eklenen [58]-[63]) erişim tarihi tutarlı
verilmemiş. Çoğu dergi ikisini de ister.

---

# BÖLÜM 5 — BİÇİM VE DERGİ KURALLARI

### ✅ M-39 🟠 Dokuz tablo metinde numarayla anılmıyor `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Tablo 7, 11, 13, 14, 15, 16, 19, 21, 22'nin her birine, ilgili caption'dan hemen önce bir referans cümlesi eklendi.

**Anılmayanlar:** Tablo 7, 11, 13, 14, 15, 16, 19, 21, 22

Hemen her dergi "her tablo metinde numarasıyla anılmalıdır" kuralını biçim
denetiminde uygular. Anılmayan tablo, hakem gözünde gereksiz tablodur.

**Yapılacak.** Her tablonun önüne en az bir cümle: "…Tablo 15'te verilmiştir",
"Tablo 22'de görüldüğü üzere…" vb.

### ✅ M-40 🟠 On iki şekil metinde numarayla anılmıyor `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (12 Eylül 2026) — Şekil 2, 3, 4, 5, 6, 11, 12, 16, 18, 19, 20, 21'in her birine caption'dan hemen önce bir referans cümlesi eklendi.

**Anılmayanlar:** Şekil 2, 3, 4, 5, 6, 11, 12, 16, 18, 19, 20, 21

Özellikle Şekil 16–21 (metin ve risk bölümlerinin grafikleri) hiç çağrılmıyor.

### ⚠️ M-41 ⚪ Çapraz başvurular alan kodu değil, sabit metin `[D]` — TABLO/ŞEKİL TAMAMLANDI
🏷️ **Etiketler:** ◐ KISMEN · ⏳ KALAN

**Durum: KISMEN TAMAMLANDI** (12 Eylül 2026) — Tablo 1–23 ve Şekil 1–8, 10–21
başlıkları gerçek `SEQ` alanına, bunlara yapılan tüm metin içi atıflar (46 Tablo
+ 18 Şekil = 64 adet) gerçek `REF` alanına çevrildi; artık bir tablo eklenip
numaralar kayarsa hepsi otomatik güncellenir. Word COM otomasyonuyla yapıldı;
üretim dosyası üzerinde doğrulandı (0 bozuk referans, alan/paragraf sayıları
tutarlı, PDF çıktısında görsel olarak kontrol edildi). Şekil 9'un başlığı
M-72'de kaldırıldığı için ona atıf içeren tek cümle düz metin olarak bırakıldı
(bozuk referans oluşturmamak için bilinçli tercih). **Bölüm N ve Denklem (N)
atıfları bu turda kapsam dışı bırakıldı** — alt bölüm harfleri (ör. 5.3(g)) ve
denklem numaralarının zaten metin olarak eklenmiş olması nedeniyle çok daha
kırılgan bir dönüşüm gerektiriyor; ayrı bir onay ve tur ister.

**Ölçüm:** `<w:fldChar>` = **0**, `<w:instrText>` = **0**.

Belgedeki tüm "Tablo 12", "Şekil 7", "Bölüm 3.2" atıfları elle yazılmış sabit
metindir. Bir tablo eklenip numaralar kaydığında **hiçbiri güncellenmez** —
M-08'deki yanlış atıf (`Bölüm 3.2`) bunun somut sonucudur.

**Yapılacak.** Kritik değil ama revizyon döngüsünde zaman kazandırır: Word'de
tablo/şekil başlıklarına **Ekle → Başvuru → Resim Yazısı**, metin içinde
**Çapraz Başvuru** kullan. En azından numaraları her düzenlemeden sonra elle
denetleyen bir kontrol adımı tanımla.

### ☐ M-42 🟠 Hedef dergi seçilmemiş; Öz ve Abstract iki katından uzun `[B+D]`
🏷️ **Etiketler:** ✖ YAPILMADI · ⏳ KALAN · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA
❓ **Soru:** hangi dergi?


**Ölçüm:** Öz ≈ **390 kelime** (anahtar kelime satırı hariç; dahil 405),
Abstract ≈ **470 kelime** (dahil 513). Dergilerin tamamı 150–250 aralığında.

Biçim kuralları dergiye göre değişiyor ve şu an hiçbirine tam uymuyor:

| Dergi | Öz | Anahtar kelime | Kaynak | Tablo başlığı | Başlık dili |
|---|---|---|---|---|---|
| Politeknik | ≤200 kelime | 3–5 | `[1]` numaralı | Üstte | Çift dilli |
| GAZİMMFD | ≤200 kelime | ≤5, alfabetik | `[1]`, listede numara noktayla | Üstte | Çift dilli |
| DACD | 150–200 | 3–6 | Yazar-yıl (APA) | Üstte, `Tablo 1:` | Tek dil |
| Afet ve Risk | 150–250 | 4–6 | Yazar-yıl (APA 7) | Üstte, `Tablo 1.` | Tek dil |

**Mevcut durum:** anahtar kelime 5 ✓, kaynak numaralı `[1]` biçiminde, tablo
başlığı üstte ✓, başlıklar tek dilli.

**Yapılacak.**
1. Hedef dergiyi seç.
2. **Öz'ü 200–250 kelimeye indir**, Abstract'ı aynı oranda kısalt.
3. Dergi yazar-yıl istiyorsa tüm atıfları dönüştür.
4. GAZİMMFD seçilirse: anahtar kelimeleri alfabetik sırala, genişletilmiş
   İngilizce özet (ayrı dosya, ≤1 sayfa, Highlights + Graphical Abstract +
   Purpose/Theory and Methods/Results/Conclusion) hazırla, bölüm başlıklarını çift
   dilli yap.

### ⚠️ M-43 🟠 On bir şekil üretilmemiş `[B]`
🏷️ **Etiketler:** ◐ KISMEN · ⏳ KALAN · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🖥️ EĞİTİM/KOŞUM GEREKİR · 🧪 SİMÜLASYONDAN
❓ **Soru:** Şekil 10 için rota geometrisini kaydeden kod değişikliği yapılsın mı?

**Durum (16 Eylül 2026 akşamı): 20 şeklin 13'ü üretilmiş; 7'si yer tutucu (Şekil 1, 2, 3, 4, 5, 6, 10).** Bu oturumda **Şekil 12** üretildi (`araclar/sekil12.py`, `runs/model_gercek_dunya/summary.json`): yatayda kesim düzeyi duyarlılık, düşeyde R0→R3 kazancının yakalanan payı (15 sert ayar, ort ± ss), yakınlaştırma düzeyi renk ve işaret biçimiyle kodlu, R0/R3 referans çizgili. Betik beş noktayı Tablo 19 ile `assert` ederek denetliyor. Palet doğrulayıcıdan geçti (yeşilin zemin kontrastı 2,74 → işaret biçimi, lejant ve Tablo 19 ikincil kodlama sağlıyor). Yer tutucunun yerine gömüldü, başlığı yazıldı, 4.7 "Bulgular"a "(Şekil 12)" atfı eklendi (şekil daha önce metinde hiç anılmıyordu). Şekil 7 ve 8 de yeniden çizildi (M-90).
**Hâlâ yer tutucu:** Şekil 1, 2, 6 (çizim), 3 (GIS haritası), 4–5 (şema / kod çıktısı), 10 (güzergâh haritası; senaryo koşusunun rota geometrisi gerekir, `runs/` altında yok). Eski "Şekil 9 — bölütleme görsel karşılaştırması" M-72 kararıyla sunulmuyor; başlıksız kalmış yer tutucusu bu oturumda kaldırıldı (M-93).
**Bulundu:** 12 Eylül 2026
**16 Eylül 2026:** Şekil 10–12 (güzergâh karşılaştırması, süre ayrıştırması,
IoU–süre ilişkisi) eski tek tohumlu koşudan üretilecekti; artık `runs/multi_seed/` ve
`runs/model_gercek_dunya/` verisinden üretilmeli. Şekil 12/13, Tablo 18'in yeni yapısına
(kesim düzeyi, yalnız SegFormer, 15 + 30 ayar) göre yeniden tasarlanmalı.

**Durum: KISMEN TAMAMLANDI** (12 Eylül 2026) — Şekil 10 (kapanma oranı karşılaştırması, il düzeyinde) ve Şekil 12 (süre farkı ayrıştırması + t_u taraması, Tablo 17 verisiyle) matplotlib ile üretilip belgeye gömüldü, yer tutucular kaldırıldı. Şekil 10'da dokuz bölgenin ayrı dökümü mevcut olmadığından il (AOI) düzeyinde özetlendiği açıkça not edildi. **Kalan 9 şekil (1,2,3,4,5,6,9,11,13) gerçek veri/GIS/model çıkarımı gerektirir, yapılmadı.**

**Üretilmiş (10 şekil, 17 gömülü görsel):** Şekil 7, 8, 14, 15, 16, 17, 18, 19, 20, 21 ✓

| Şekil | İçerik | Üretim zorluğu |
|---|---|---|
| 1 | Yazının algılama/karar eksenlerinde konumlandırılması | Kolay — çizim |
| 2 | Sistem mimarisi ve veri akışı | Kolay — çizim |
| 3 | Çalışma alanı haritası (fay zonu, dış merkezler, 9 bölge) | Orta — GIS |
| 4 | Karolama, harmanlama, son işleme şeması | Orta — kod çıktısı + çizim |
| 5 | Kapanma katmanının çizgeye işlenmesi (4 panel) | Orta — kod çıktısı |
| 6 | Üç düzeyli değerlendirme protokolü şeması | Kolay — çizim |
| 9 | Bölütleme sonuçlarının görsel karşılaştırması | **Kolay — modeller eğitilmiş, çıkarım yeter** |
| 10 | Kapanma oranı karşılaştırma çubuğu | Kolay — veri hazır |
| 11 | Güzergâh karşılaştırması (harita) | Orta — senaryo çıktısı |
| 12 | Kazanç ayrıştırma yığılmış çubuk | **Kolay — veri hazır (Tablo 17)** |
| 13 | IoU–ulaşım süresi ilişkisi | Tablo 18'e bağlı (M-20) |

**Öncelik:** Şekil 9, 10, 12 hemen üretilebilir. Şekil 1, 2, 6 çizim işidir.

### ✅ M-44 ⚪ Şekil çözünürlüğü ve dili `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (16 Eylül 2026, gece) — `05_risk_skoru/local_run/run_all_risk.py` ve `plots_risk.py` yeniden koşuldu (catboost/xgboost/lightgbm/scikit-learn yerel ortama kuruldu); tüm eksen/başlık/legend metinleri düzgün Türkçe diyakritiklerle yeniden yazıldı ve `dpi=160` → `dpi=300` yapıldı. Şekil 20 için ayrı bir betik (`shap_figure.py`) yazıldı: aynı son walk-forward katında (`splits[-1]`) 08_calibration_and_shap.ipynb ile birebir aynı hiperparametrelerle (iterations=800, depth=8, learning_rate=0.03, seed=42) CatBoost eğitilip native öznitelik önemi (üst panel) ve `shap.TreeExplainer` ile SHAP özet grafiği (alt panel) üretildi; öznitelik adları Türkçeleştirildi (SHAP kütüphanesinin kendi "SHAP value / High / Low / Feature value" iç metinleri hariç — bunlar üçüncü parti kütüphane varsayılanı, referans defterde de çevrilmemişti).
Üretilen 5 görsel (`roc_overlay.png`, `pr_overlay.png`, `calibration_overlay.png`, `shap_top_importance.png`, `shap_bottom_summary.png`) `QuakeMind_Makale_Taslak_2026-09-16.docx` içine `word/media/image14–19.png` olarak gömüldü (ham zip/XML düzenlemesiyle; metin ve paragraf sayısı değişmedi — 565 paragraf, 21 238 kelime doğrulandı). Şekil 20'nin alt panelinin en-boy oranı eskisinden farklı olduğu için (0,90 → 1,09) çerçeve yüksekliği (`wp:extent`/`a:xfrm` cy) orantılı güncellendi, diğer dördü zaten orijinal çerçeveyle birebir aynı en-boy oranında üretildiği için çerçeveye dokunulmadı. Değişiklik öncesi `QuakeMind_Makale_Taslak_2026-09-16.BACKUP_before_sekil17_19_20.docx` olarak yedeklendi.
**Sonuç: belgedeki 19 gömülü görselin tamamı artık ≥300 dpi ve Türkçe karakterli.**

**Durum (16 Eylül 2026 akşamı, eski — artık geçersiz): belgedeki 19 gömülü görselin 14'ü yeniden üretildi (≥300 dpi, Türkçe karakterli, aynı palet); 3 şekil (5 görsel: Şekil 17, 19, 20) eski.**
- Yeniden çizilenler: Şekil 7, 8 (`sekil7_8.py`, M-90), 9, 11 (`sekiller_0916.py`, M-87), 12 (`sekil12.py`), **13, 14, 15, 16, 18** (`sekil13_18.py`). Her betik değerleri makaledeki tabloyla (`assert`) denetliyor.
- Şekil 14 artık **tek karşılaştırmalı grafik** (iki model yan yana, kategoriler sınama kümesi destek sayısına göre sıralı, n etiketli); başlık veriye göre düzeltildi. Eski başlık "klasik taban çizgisi aynı kategorilerde sıfırdan farklı" diyordu, oysa en seyrek üç kategoride iki model de 0. Şekil 16'ya ROC-AUC = 0,5 çizgisi eklendi. Şekil 18'de kutu grafiği yerine 5 nokta + medyan var (n = 5 için kutu yanıltıcı); "yedi modelin tamamında en düşük kat 1. kat" bulgusu başlığa eklendi (betikte doğrulanıyor). Şekil 18'deki ss değerleri Tablo 23 ile aynı kuralla (ddof = 0) hesaplandı.
- **Eski kalanlar:** Şekil 17 (ROC/PR), 19 (kalibrasyon), 20 (öznitelik önemi + SHAP). Bunlar katlama dışı (OOF) tahminler ya da eğitilmiş model gerektiriyor; `05_risk_skoru/local_run/results/*.json` bu tahminleri **içermiyor**. Yeniden üretmek için `05_risk_skoru/local_run/run_all_risk.py` yeniden koşulmalı (veri kaynağı ayrıca denetlenmeli).
- **Düzeltme:** Aşağıdaki "kaynak koda erişim olmadığı için düzeltilemedi" notu kısmen yanlıştı: `05_risk_skoru/local_run/plots_risk.py` ve `04_turkce_metin/local_run/` betikleri makale dalında var.
- Dergi "yalnız siyah, Times 10 pt" isterse (ör. GAZİMMFD) tüm betiklerde yalnız `rcParams` ve renk sabitleri değiştirilip yeniden çalıştırılabilir.
**Bulundu:** 12 Eylül 2026
Dergiler genellikle ≥300 dpi ister; GAZİMMFD ayrıca şekil üzerindeki yazıların
Times 10 pt, **yalnız siyah** ve **Türkçe** olmasını şart koşar. Mevcut 17
görselin bu ölçütlere uygunluğu denetlenmemiştir.

**Durum: KISMEN TAMAMLANDI — denetlendi, iki ayrı sorun tespit edildi, kaynak
koda erişim olmadığı için düzeltilemedi.**

**Bulgu 1 — Çözünürlük.** Belgedeki 19 gömülü görselin PIL ile DPI metadatası
okundu: orijinal 17 görselin tamamı 150–160 dpi'de (≥300 dpi hedefinin
altında); yalnızca bu oturumda eklenen 2 yeni şekil (Şekil 10, Şekil 12 —
`image7.png`, `image8.png`) 300 dpi'de üretilmiştir.

**Bulgu 2 — Dil.** 8 temsilî görsel (`img1, img2, img9, img10, img13, img14,
img17, img18` — Bölüm 3.1 mimari karşılaştırma, eğitim/doğrulama eğrileri,
sınıf bazlı F1, risk skoru model karşılaştırması, ROC eğrileri, öznitelik önem
sıralaması) tek tek görsel olarak incelendi. Hepsinde aynı sorun var: eksen
başlıkları ve etiketler Türkçe fakat **noktalama işaretsiz (ASCII) yazılmış**
— Türkçe özel karakterler (ı/İ, ğ, ş, ç, ö, ü) hiçbirinde kullanılmamış.
Örnekler: "Turkce Metin - Model Karsilastirmasi" (→ olması gereken: "Türkçe
Metin – Model Karşılaştırması"), "Alakasiz" (→ "Alakasız"), "Saglik" (→
"Sağlık"), "Isinma" (→ "Isınma"), "Dogrulama" (→ "Doğrulama"), "Oznitelik
Onem Siralamasi" (→ "Öznitelik Önem Sıralaması"), "Ortalama Tahmin Olasiligi"
(→ "Olasılığı"), "Gercek Pozitif Orani" / "Dogru/Yanlis Pozitif Orani" (→
"Gerçek/Doğru/Yanlış … Oranı"), "Birlestirilmis OOF tahminler" (→
"Birleştirilmiş"). Bu, kaynak Colab defterlerinde büyük olasılıkla matplotlib
varsayılan fontunun (DejaVu Sans) Türkçe diyakritikleri düzgün
basamaması/tutarlılık kaygısıyla baştan ASCII'ye indirgenmiş olmasından
kaynaklanıyor — tüm 17 orijinal grafikte sistematik olarak aynı desen.

**Neden düzeltilemedi.** Bu 17 görsel, `makale/` klasörünün dışındaki ayrı
Colab defterlerinde (`berturk_multilabel_intent_colab.ipynb`,
`optimized_training_colab.ipynb`, `model_benchmarks/**/*.ipynb`) üretilmiş
PNG çıktılarıdır; bu oturumda kaynak çizim koduna erişim yok. Görseli olduğu
gibi yapay olarak upscale etmek (interpolasyon) gerçek çözünürlüğü artırmaz
ve yazıları Türkçeleştirmez — yalnızca yanıltıcı bir görünüm sonucu doğurur,
bu nedenle uygulanmadı. Gerçek düzeltme, ilgili notebook'larda
`plt.rcParams` ile Türkçe diyakritik destekleyen bir font (örn. "DejaVu
Sans" yerine sistemde kurulu bir Unicode font) ayarlanıp grafiklerin
`dpi=300` ile yeniden kaydedilmesini ve PNG'lerin belgede değiştirilmesini
gerektirir — bu, kullanıcının kendi ortamında (Colab/yerel) yapması gereken
bir yeniden-üretim adımıdır, doğrudan .docx düzenlemesiyle çözülemez.

**Yapılacak (kullanıcı tarafından, kaynak defterler üzerinde).** (1) Grafik
üretim hücrelerine Türkçe diyakritik destekleyen bir font ayarla; (2)
`savefig(..., dpi=300)` ile yeniden üret; (3) eksen/başlık metinlerini düzgün
Türkçe diyakritiklerle yaz; (4) yeni PNG'leri `MAKALE_TASLAK_TR (1).docx`
içindeki ilgili `word/media/imageN.png` dosyalarıyla değiştir.

### ✅ M-56 🟡 Tablo 2 ile Bölüm 3.1 arasındaki kanal uyumsuzluğu `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — Tablo 2'nin başlığına "dış (harici) veri kaynakları" niteleyicisi ve bir açıklama eklendi: beş kanaldan yalnızca uydu görüntüsü ve sismik katalog kanallarının bu tabloda listelendiği, yer seviyesi görüntü/Türkçe metin/acil çağrı kanallarının senaryo içi üretilen veriler olduğu için tabloya dahil edilmediği belirtildi.

**Nerede:** Tablo 2 başlığı ↔ Bölüm 3.1

### ✅ M-58 ⚪ ÖZ'de kısaltmalar açılmadan kullanılmış `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — ÖZ'de IoU, mAP, F₁ ve TF-IDF ilk kullanımlarında açık karşılıklarıyla birlikte verildi (kesişimin birleşime oranı; ortalama kesinlik; kesinlik/duyarlılık dengeli ölçüt; terim sıklığı–ters belge sıklığı).

**Nerede:** ÖZ

### ⚠️ M-59 🟡 Eksik standart bölümler — Kısaltmalar/Simgeler `[D]`
🏷️ **Etiketler:** ◐ KISMEN · ⏳ KALAN · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR
❓ **Soru:** dergi Öne Çıkanlar istiyor mu?

**Durum: KISMEN TAMAMLANDI** (12 Eylül 2026) — Giriş'ten önce 26 satırlık bir "Kısaltmalar ve Simgeler" tablosu eklendi (AFAD, IoU, mAP, F₁, DP/YP/YN/DN, r_h, τ, t_u, v_ort vb.). **Öne Çıkanlar (Highlights) bölümü hâlâ yok** — dergi isterse ayrıca eklenmeli; bkz. M-45 (proje numarası, depo adresi gibi diğer `[EKLENECEK]` alanlarla birlikte).

**Nerede:** Giriş öncesi (yeni bölüm) · Teşekkür · Veri Erişilebilirliği

### ✅ M-69 ⚪ "Senaryo v2" terimi açıklanmamış `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — Tablo 11 sütun başlığı "Senaryo v2 koşum ortamı" → "Koşum ortamı" olarak sadeleştirildi.

### ✅ M-75 🔴 Tüm tabloların sütun genişlikleri patolojik derecede dar (yeni bulgu, kullanıcı bildirdi)
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — Kullanıcı belgeyi incelerken tabloların "çok sıkıntılı" göründüğünü bildirdi. İnceleme sonucu: belgeyi üreten dönüştürme aracı, 24 tablonun tamamında sütun düzenini `fixed` (sabit) yapmış ve her sütuna görev/içerikten bağımsız olarak **236 twip (~4 mm)** genişlik atamış. Sonuç: çok kelimeli başlıklar ("Duyarlılık", "Özgüllük" vb.) sütuna sığmadığından harf harf alt alta diziliyor, tablolar sayfanın küçük bir şeridine sıkışıyor ve devasa, gereksiz dikey uzuyor (bu tek kusur belge sayfa sayısının 160'tan 54'e inmesine yol açtı). Word COM ile her tabloya `AutoFitBehavior(wdAutoFitWindow)` uygulanarak sütunlar sayfa genişliğine göre yeniden dağıtıldı; 24 tablonun tamamı düzeltildi ve görsel olarak doğrulandı. Daha önceki tüm düzeltmeler (17 denklem, çapraz başvuru alanları, kaynakça) sağlam kaldı.

**Nerede:** Belgedeki tüm 24 tablo

**Nerede:** Tablo 11 başlığı

Terim Tablo 11'de geçiyor, başka hiçbir yerde geçmiyor.

**Yapılacak.** Ya tanımla ya da sadeleştir (ör. yalnızca "koşum ortamı" yaz).

### ⚠️ M-70 ⚪ Model ağırlığı adında yazım hatası + anonimlik riski `[D]` — KISMEN TAMAMLANDI
🏷️ **Etiketler:** ◐ KISMEN · ⏳ KALAN · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme) · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA
❓ **Soru:** dergi çift kör mü?

**Durum: KISMEN TAMAMLANDI** (12 Eylül 2026) — Yazım hatası düzeltildi ("dispath"→"dispatch", `[sic]` notuyla kaynaktaki hâli de korundu). **Anonimleştirme (depo sahibi adının kaldırılması) çift-kör hakemlik kararına bağlı olduğundan uygulanmadı** — bkz. C17/Grup 2.

**Nerede:** Bölüm 3.4, "Ağırlık başlangıcı" paragrafı — `Utbird/dispath_optimized_mitb4_focal_dice30`

`dispath` muhtemelen `dispatch` yazım hatası. Ayrıca depo sahibi adı yazar
kimliğini ele veriyor.

**Yapılacak.** Yazım hatasını düzelt veya kaynakta da hatalıysa `[sic]` düş.
Çift kör hakemlik varsa bu satırı ve Veri Erişilebilirliği'ndeki depo adresini
anonimleştir (bkz. M-47).

### ✅ M-71 🟡 Şekil 8'de alt şekil etiketleri yok `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — Görsel incelendiğinde, altyazının zaten "yukarıdan aşağıya LinkNet, U-Net, FPN, DeepLabV3+, PSPNet" sırasını belirttiği ve her alt grafiğin kendi başlığında mimari adını taşıdığı (ör. "pspnet_resnet18") görüldü; bu, (a)-(e) harf etiketinin sağlayacağı ayırt ediciliği zaten karşılıyor. Görsele ayrıca harf eklenmedi, kullanıcıya sorulmadan çözüldü.

**Nerede:** Şekil 8, 15, 18, 21

Beş ayrı görsel tek bir "Şekil 8" altında toplanmış, harf etiketi yok. Aynı
sorun Şekil 15 (2 görsel), Şekil 18 (2 görsel), Şekil 21 (2 görsel) için de
geçerli.

**Yapılacak.** (a)–(e) etiketleri ekle, altyazıda hangi harfin hangi mimariye
ait olduğunu belirt.

### ✅ M-72 ⚪ Şekil 9 hem "üretilmemiştir" diyor hem altyazısı var `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (12–13 Eylül, ikinci inceleme)

**Durum: TAMAMLANDI** (12 Eylül 2026) — Yer tutucu ve altyazı kaldırılıp Bölüm 4.2'ye "niteliksel karşılaştırma bu sürümde sunulmamıştır" cümlesi eklendi (seçenek 2). Şekil üretilirse bu not geri alınmalı — bkz. M-43.
> **16 Eylül 2026 eki (M-93):** Yalnız altyazı kaldırılmıştı; "[ŞEKİL 9 — … Bu şekil üretilmemiştir.]" yer tutucusu 4.2'de başlıksız duruyordu. Ayrıca eklenen cümle "(Şekil 9)" diye bugün başka bir şekli (sentetik kapanma oranı) gösteren bir numara içeriyordu. İkisi de düzeltildi.

**Nerede:** Şekil 9 (bkz. M-43)

Yer tutucu metni şeklin üretilmediğini söylerken altyazı zaten yazılmış —
okuyucu kafası karışır.

**Yapılacak.** Ya şekli üret (M-43'te zaten "hemen üretilebilir" olarak
işaretli) ya da hem yer tutucuyu hem altyazıyı kaldırıp Bölüm 4.2'ye
"niteliksel karşılaştırma bu sürümde sunulmamıştır" cümlesini koy.

---

# BÖLÜM 6 — KÜNYE VE İDARİ ALANLAR

### ⚠️ M-45 🟠 Sekiz `[EKLENECEK]` alanı `[B]`
🏷️ **Etiketler:** ◐ KISMEN · ⏳ KALAN · 👥 SİZ YAPMALISINIZ · 🪪 KİMLİK/İSİM/NUMARA

**16 Eylül 2026 (ikinci tur) — NEREDEYSE TAMAM.** Kullanıcı bilgileri işlendi: TÜBİTAK 2209-A
**başvuru numarası 1919B012547445** (Teşekkür; belgede "başvuru numaralı proje" olarak yazıldı, kullanıcının
gönderdiği ekran görüntüsündeki etiket "BAŞVURU NUMARASI"); **depo adresi https://github.com/UtBird/QuakeMind**
(Veri Erişilebilirliği; cümle "erişime açılacaktır" kipinde); **kurumlar** başlık altına üst simgeli olarak
eklendi: ¹ KTO Karatay Üniversitesi, Bilgisayar Mühendisliği Bölümü, Konya (Furkan Emre İnce, Utku Ceylan);
² KTO Karatay Üniversitesi, İnşaat Mühendisliği Bölümü, Konya (Esra Uray). **Açık kalan:** ORCID numaraları
ve sorumlu yazar (belgede `[ORCID NUMARALARI VE SORUMLU YAZAR BİLGİSİ EKLENECEK]`). **Uyarı:**
`UtBird/QuakeMind` şu an **özel** depodur; yayından önce herkese açılmalı ya da yayına uygun bir kopyası
açılmalıdır. Çift kör hakemlik uygulayan dergide depo adresi, yazar bloğu ve M-70'teki model adı
anonimleştirilmelidir.
**16 Eylül 2026 — KISMEN.** Yapılanlar: başlığın altına yazar bloğu eklendi (Furkan Emre İnce, Utku Ceylan,
Esra Uray); katkı beyanındaki dört şablon yazar gerçek adlarla değiştirildi (M-46); senaryo koşum ortamı
alanları M-22'de dolduruldu. **Kullanıcıdan beklenen üç bilgi:** (1) TÜBİTAK 2209-A **proje numarası**
(Teşekkür); (2) **depo adresi** (Veri Erişilebilirliği) — `UtBird/QuakeMind` **özel**, `Femrei/QuakeMindDev`
herkese açık ama bugünkü commit'lenmemiş çalışmaları içermiyor; (3) yazarların **kurum, ORCID ve sorumlu
yazar** bilgisi (başlık altında `[KURUM, ORCID VE SORUMLU YAZAR BİLGİSİ EKLENECEK]`). Unvan ("Dr. Öğr.
Üyesi") yazar satırında yazılmadı; kurum satırında verilebilir.

| Alan | Nerede |
|---|---|
| Yazar adları (4 kişi) | Yazarların Katkıları |
| TÜBİTAK proje numarası | Teşekkür |
| Depo adresi | Veri Erişilebilirliği |
| Senaryo koşum ortamı (5 alan) | Tablo 11 |

**Ek not `[D]`:** Yazar alanı yalnızca isim değil; kurum/bölüm adresleri,
e-posta, **ORCID numaraları** ve sorumlu yazar işareti de eksik. Belge şu an
başlıktan doğrudan ÖZ'e geçiyor — bu künye bloğu ayrı bir gereksinim olarak
unutulmamalı.

### ✅ M-46 🟠 Yazar listesi ve katkı beyanı güncellenmeli `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🪪 KİMLİK/İSİM/NUMARA · 🔍 KONTROL EDİN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Katkı beyanı CRediT sınıflamasıyla yeniden yazıldı; kullanıcı
talimatına birebir uyuldu: **Esra Uray: denetim, finansman temini**; **Furkan Emre İnce ve Utku Ceylan:**
diğer tüm roller (kavramsallaştırma, yöntem, yazılım, doğrulama, biçimsel çözümleme, araştırma, kaynaklar,
veri düzenleme, özgün taslağın yazımı, gözden geçirme ve düzenleme, görselleştirme, proje yönetimi) ve
"rolleri ortaklaşa yürütmüştür" cümlesi. Dördüncü şablon yazar kaldırıldı. **Not:** danışman taslağı gözden
geçirirse "gözden geçirme ve düzenleme" rolü ona da eklenebilir; görüntü işleme uzmanı hocalar katılınca beyan
yeniden düzenlenecek.
Görüntü işleme uzmanı hocalar projeye katılacağından, yazar sırası ve CRediT
katkı beyanı buna göre yeniden düzenlenmelidir. Mevcut taslakta dört genel rol
tanımlı; uzman katkısı (yöntem danışmanlığı, deney tasarımı denetimi) için ayrı
satır gerekir.

### ⚠️ M-47 🟠 Veri erişilebilirliği beyanı — özel veri kümesi `[B+D]`
🏷️ **Etiketler:** ◐ KISMEN · ⏳ KALAN · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR · 🪪 KİMLİK/İSİM/NUMARA
❓ **Soru:** özel küme açık mı, istek üzerine mi, kapalı mı?

**16 Eylül 2026 — SONRA KONUŞULACAK (kullanıcı kararı).** Kullanıcı: "özel Türkçe metin kümesi de not edilsin,
onu sonra konuşacağız." Erişim politikası (açık / istek üzerine / kapalı) henüz belirlenmedi; belgedeki
`[ERİŞİM POLİTİKASI KARARLAŞTIRILACAK — açık/istek üzerine/kapalı]` işareti bilerek bırakıldı. Bu madde
kapatılmadan makale gönderilmemelidir (hakem yeniden üretilebilirlik açısından sorar).
**Durum: KISMEN TAMAMLANDI** (13 Eylül 2026) — `deprem-private/intent_test_v13_anonymized` kümesi Veri Erişilebilirliği beyanına eklendi (bkz. M-33 künyesiyle çapraz referanslı). **Erişim politikası kararı (açık/istek üzerine/kapalı) kullanıcıya bırakıldı** — metinde `[ERİŞİM POLİTİKASI KARARLAŞTIRILACAK]` olarak işaretlendi; bu bir kod/veri incelemesiyle değil yalnızca yazarların kararıyla kapatılabilir.

Beyan yalnızca açık kaynakları listeliyor. Ancak Türkçe metin karşılaştırması
`deprem-private/intent_test_v13_anonymized` adlı **özel** bir küme kullanıyor
(bkz. M-33).

**Yapılacak.** Kümenin erişim koşulunu beyana ekle. Erişim kapalıysa bunu açıkça
belirt; hakem yeniden üretilebilirlik açısından sorar.

### ✅ M-48 🟠 Görüntü kaynağı lisansı `[B]`
🏷️ **Etiketler:** ✔ YAPILDI

**Durum: TAMAMLANDI** (13 Eylül 2026) — `fetcher.py` doğrulandı: `provider='google'` varsayılan, `mt1.google.com/vt/lyrs=s` karo sunucusuna istek atıyor (ayrıca `esri`/Wayback ve `custom` sağlayıcı seçenekleri de var). Veri Erişilebilirliği beyanına, eğitim/yer gerçeği görüntülerinin (Maxar Open Data, Esri Wayback) canlı sistemin çalışma anında çektiği Google karolarından **farklı ve ayrı bir kaynak** olduğunu açıkça belirten bir paragraf eklendi.

Kodda Google uydu karoları çekiliyor
(`QuakeMindBackend/apps/road_damage/utils/fetcher.py`, `mt1.google.com/vt/lyrs=s`).
Makale koşumlarının **Maxar Open Data** ile yapıldığı Veri Erişilebilirliği
beyanında açıkça belirtilmeli; aksi hâlde kod paylaşıldığında çelişki doğar.

---

# BÖLÜM 7 — İNCELENİP KAPATILANLAR

Bu maddeler iki listede sorun olarak yer aldı ama **doğrulama sonucunda sorun
olmadıkları** ya da **yanlış oldukları** anlaşıldı. Yeniden gündeme gelmemeleri
için kayda geçiriliyor.

### ✔ K-01 Tablo 12'deki 0,4276 ile Tablo 22'deki ROC-AUC 0,4276 çakışması
**Durum:** KAPALI — gerçek rastlantı, kopyala-yapıştır hatası **değil**.

İki değer iki bağımsız kaynaktan geliyor:
- Tablo 12 → `optimized_training_colab.ipynb` çıktısı, *"En iyi Val IoU: 0.4276"*
- Tablo 22 → `05_risk_skoru/.../leaderboard.csv`, ÇKA satırı
  `0.42759818884895767`

Aynı dört haneye yuvarlanmaları tesadüftür. **Düzeltme gerekmiyor.**
*(İsteğe bağlı: Tablo 22'de bu değeri beş haneye yazmak okuyucuda şüphe
uyandırmasını önler.)*

### ✔ K-02 Karolama adımının örtüşmesiz olduğu şüphesi
**Durum:** KAPALI — şüphe **yanlış çıktı**.

`build_notebook.py`: `tile_size, tile_stride = 512, 256`. Yani %50 örtüşme
gerçektir ve makalenin veri sızıntısı uyarısı **geçerlidir**.

> **16 Eylül 2026 eki (M-89):** Kodda örtüşme var, ama **girdide yok**. KATE-CD ve MEDBFS görüntüleri zaten
> 512 × 512 olduğundan her görüntüden tek karo çıkıyor (SegFormer defteri: 842 görüntü → 842 karo). Aynı piksellerin
> iki bölmeye düşmesi bu koşumda olmadı; komşu karoların mekânsal sızıntısı ise hâlâ denetlenmemiş. Makalenin
> Tablo 13 notu (ii) buna göre düzeltildi. Bölüm 3.2.1'deki uyarı (gelecekteki büyük yol hasarı görüntüleri için) geçerli.

### ✔ K-03 Sayısal sapmalar (diğer incelemedeki küçük hatalar)
| İddia | Ölçülen | Not |
|---|---|---|
| Abstract 499 kelime | **≈470** (anahtar kelimeler dahil 513) | Sonuç değişmiyor: iki katından uzun |
| Toplam ≈17 280 kelime | **18 169** (gövde ≈15 326) | Sonuç değişmiyor: çok uzun |
| Öz 389 kelime | **389** ✓ | Birebir doğru |

Bu sapmalar hiçbir maddenin geçerliliğini etkilemiyor; yalnızca sayılar
alıntılanırken bu dosyadaki ölçümler kullanılmalıdır.

---


# BÖLÜM 8 — 16 EYLÜL SİMÜLASYON GÜNCELLEMESİNDEN DOĞAN MADDELER

Kaynak: `SIMULASYON_DEVIR_BELGESI.md` Bölüm 12–15; `EKSIKLER_VE_SORUNLAR.md` J-25, J-26,
J-28, J-29, J-30, E-01, E-02, E-06; `runs/multi_seed/multi_seed_tablo.md`;
`runs/model_gercek_dunya/tablo18.md`. Tüm maddeler bu oturumda belge ve kod üzerinde
doğrulanmıştır.

### ✅ M-76 🔴 Geçilebilirlik kuralı tanımları makale ile kodda **ters** `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 🧪 SİMÜLASYONDAN · 🔍 KONTROL EDİN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Kullanıcı tercih belirtmedi; önerilen yol uygulandı: **makale koşulan koda
uyduruldu.** Bölüm 3.2 (P83, P86, P87) yeniden yazıldı: katı = yalnız Destroyed, orta = + Damaged, gevşek = +
Possibly damaged; kural adının "kapanma ilan etmek için aranan kanıtın katılığı" olduğu tanımlandı; EMSR648 →
OSM eşleme kuralı (2 m örnekleme, 8 m tampon, ≥ %50) koddan yazıldı. Tablo 4 üç kural sütunuyla yeniden kuruldu.
Bölüm 4.3'teki üç madde yeni tanımlarla düzeltildi (katı 39/0, orta 70/134, gevşek 73/134). "Dengeli kural"
makaleden tamamen kaldırıldı; Damaged'ı yumuşak cezayla işleyen ara kural "tasarlandı ama koşulmadı" diye
3.2, 5.3(l) ve 5.4'e yazıldı. Tablo 13'teki kural etiketleri güncellendi. Doğrulama: makalede "dengeli kural"
geçmiyor.
**Bulundu:** 16 Eylül 2026 · **Nerede:** Bölüm 3.2 (P86–P87), Tablo 4 (eşleme çizelgesi),
Bölüm 4.3 (P299–P302), Bölüm 4.6 (P337), Bölüm 4.8 (P354–P359), Tablo 13, Tablo 19,
Bölüm 5.1 (P421–P422), Sonuç (P452)

| Makalede | Makaledeki tanım | Kodda (`copernicus_ground_truth.py:158`) | Koddaki tanım |
|---|---|---|---|
| **Katı** | Destroyed + Damaged **kapalı** | `strict` | **yalnız** Destroyed kapalı |
| **Dengeli** (esas kural) | Destroyed kapalı, Damaged **yumuşak ceza** | `medium` | Destroyed + Damaged kapalı |
| **Gevşek** | yalnız Destroyed kapalı | `loose` | Destroyed + Damaged + Possibly damaged kapalı |

Adların yönü de ters: makalede "katı" **en çok** kapanmayı, kodda `strict` **en az**
kapanmayı üretiyor. Kapanan kesim kümeleri:

| Küme | Hatay | Kahramanmaraş | Makalede adı | Kodda adı |
|---|---|---|---|---|
| yalnız Destroyed | 39 | 0 | Gevşek | `strict` |
| Destroyed + Damaged | 70 | 134 | Katı | `medium` |
| + Possibly damaged | 73 | 134 | **yok** | `loose` |
| Destroyed kapalı + Damaged cezalı | — | — | Dengeli (**esas**) | **koşulmadı** |

**Sonuç:** Devir belgesi ve J-28/J-29'daki "EMSR gevşek 154,1 / 1 433,0 dk" sonucu
makalenin tanımıyla "gevşek" değildir; makaledeki "gevşek" (yalnız Destroyed) kodun
`strict` koşusuna karşılık gelir (144,3 / 197,1 dk). Makalenin **esas aldığı dengeli
kural hiç koşulmamıştır** (E-01: "Damaged = ağırlık cezası uygulanmadı").
Kod adlarıyla sayı yazılırsa makale bir kurala ait sonucu başka bir kurala atfeder.

**Karar gerekiyor (kullanıcı):** makalenin kural tanımları koda mı uydurulacak, yoksa
dengeli kural kodda uygulanıp koşulacak mı? Karar verilene kadar Tablo 19, Tablo 13'ün
"Kural" sütunu, Bölüm 4.8 ve EMSR satırları yazılmayacak.

### ✅ M-77 🔴 Tek tohumlu senaryo sayıları geçersiz — 10 tohum ortalaması ± ss ile değişmeli `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Öz, Abstract, Giriş, 3.8.1, 4.3, 4.5, 4.6 (Tablo 16–17), 4.7, 4.8 (Tablo 19),
5.1, 5.3, 5.4 ve Sonuç'taki eski tek tohumlu değerler 10 tohumlu değerlerle değiştirildi. Tablo 16–17 değerleri
tohum başına veriden yeniden hesaplandı (toplamların ss'si toplanamadığı için); `multi_seed_tablo.md` ile
birebir. Tablo 17'de t_u = 2 dk satırı aynı koşulardan türetilerek korundu. Tarama yeniden koşuldu: kalan
eşleşmelerin tamamı ya yanlış alarm (Tablo 3'teki 68 bina, arXiv numarası) ya da bilinçli metin (Göksun'un
çıkarılma gerekçesi).
**Bulundu:** 16 Eylül 2026 · **Kaynak:** J-29, E-06 (kapandı)

Makaledeki **206,6 / 1 641,0 / 1 434,4 dk, %87,4, %94,8, 281,0, 74,4, %26,5, 1 360,0,
k = 68, 352,5 / 16,9 dk** değerlerinin tamamı tek tohumlu, dokuz bölgeli eski koşuya aittir.
Bu oturumdaki tarama **71 eşleşme** buldu. Başlıca yerler:

| Yer | Eski | Not |
|---|---|---|
| Öz (P4), Abstract (P9) | 1641,0 → 206,6; 1434,4; %94,8; 74,4 | "dokuz bölge, 12 karargâh" da |
| Giriş (P20) | dokuz bölge, 12 karargâh | M-78 |
| 3.8.1 (P230–P232, Tablo 10) | dokuz bölge, Göksun, tohum 42, %2,87 | M-04 yeniden açık |
| 4.3 (P302) | "dokuz bölge genelinde %0,6–4,5" | 10 tohumla: bölge ortalamaları %0,55–4,50 |
| 4.5 (P316–P319) | "EMSR648 türevli kümeyle koşulmamıştır"; dokuz bölge; 12 karargâh; 18/18 atama; 9/9 çakışma; 18 güzergâh | 8 ilçe sentetikte rotalanan **17,8 ± 0,4 / 18** |
| 4.6 Tablo 16 (T18) | 206,6 · 1641,0 · 1434,4 · 87,4 · 281,0 · 74,4 · 26,5 | → 203,5 ± 18,9 · 1 552,0 ± 252,0 · 1 348,5 ± 241,7 · … |
| 4.6 P332–P333 | payda açıklaması, %94,8, k = 68 | U-dönüşü 64,7 ± 11,4; payı %96 |
| 4.6 Tablo 17 (T19) | T_naif = 281,0 + 68·t_u; t_u = 0/2/5/10/20/30 | koşulan tarama t_u = 0/5/10/20/30 (2 yok) |
| 4.6 P336–P337, P344 | %26,5; 16,9 / 352,5 dk; "medyan … raporlanmamıştır" | M-31, M-79 |
| 4.7 P349 | "68 değeri" | R0 keşfi artık Tablo 18'de: 2,0 ± 0,8 / tohum |
| 5.1 P420–P421 | 206,6; 1641,0; 1360,0; 74,4; %26,5; %0,6–4,5 | |
| 5.3(g) P434 | "dokuz bölge; tek koşumdan güven aralığı türetilememektedir" | artık yanlış — 10 tohum ve GA var |
| Sonuç P451 | 206,6; 1641,0; 1434,4; 1360,0; 74,4 | |

**Yeni değerler (8 ilçe, sentetik, 10 tohum):** QuakeMind 203,5 ± 18,9 dk · klasik
1 552,0 ± 252,0 dk · kazanç 1 348,5 ± 241,7 dk, %95 GA [1 175,6; 1 521,4] · yalnız yol
farkı 54,5 ± 15,2 dk · U-dönüşü 64,7 ± 11,4 · U-dönüşü payı %96 · klasik ek yol
%26,7 ± 6,9. **Payda notu:** "Kazanç %" artık tohum başına oranların ortalaması mı, oranı
ortalamaların oranı mı — makalede tanımlanmalı.

### ✅ M-78 🟠 Senaryo 9 → 8 ilçe, 12 → 11 karargâh (Göksun çıkarıldı) `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Öz, Abstract, Giriş, 3.8.1, 4.5, 5.1, 5.3(g) ve Sonuç "sekiz ilçe / 11
karargâh" olarak güncellendi. 4.5'e Göksun'un çıkarılma gerekçesi ve iki karargâhın çıkmaz yoldan kavşağa
taşınması yazıldı.
**Bulundu:** 16 Eylül 2026 · **Kaynak:** devir belgesi Bölüm 12

K-Z4 Göksun'da deprem sonrası görüntü olmadığı için çıkarıldı; afetzedesi KMS-06 ve
ekibi MARAS-AK5 K-Z1'e taşındı. Yeni kurgu: **8 bölge (5 Hatay, 3 Kahramanmaraş) /
18 afetzede / 18 ekip / 11 karargâh**. Ayrıca HQ-K1 ve HQ-HD2 çıkmaz yoldan ~40 m ötedeki
kavşağa taşındı. **Yerler:** Öz (P4), Giriş (P20), 3.8.1 (P230, Tablo 10), 4.3 (P302),
4.5 (P317), 5.3(g) (P434). Göksun'un çıkarılma gerekçesi ve karargâh taşıması 3.2 ya da
4.5'te bir cümleyle yazılmalı.

### ✅ M-79 🟠 Gerçek hasarla (EMSR648) koşu makalede yok `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Gerçek hasar sonuçları Tablo 16'nın ikinci bloğu (4 ilçe: sentetik / katı /
orta / gevşek), Tablo 17'nin EMSR sütunları ve Tablo 19 olarak eklendi; 4.5'teki "EMSR648 türevli kümeyle
koşulmamıştır" cümlesi kaldırıldı; 4.6'ya eşleştirilmiş fark (+142,9 / +169,6 / −1 056,5 dk), değişkenlik ve
AOI dışı %6 kenar kayıtları yazıldı.
**Bulundu:** 16 Eylül 2026 · **Kaynak:** J-28, J-29

Bölüm 4.5 hâlâ *"Senaryo … EMSR648 türevli kapanma kümesiyle koşulmamıştır"* diyor —
artık yanlış. 4 ilçede (13 afetzede) üç kuralla 10 tohum koşuldu. Makalenin sistem
iddiasını gerçek hasara dayandıran en güçlü sonuç budur; Tablo 16'ya ayrı bir blok ya da
yeni bir tablo olarak eklenmeli. Yazılacak kayıtlar: (i) kazancın %96–99'u t_u
varsayımından; (ii) aynı tohumda EMSR − sentetik farkı sıfırdan ayırt edilemiyor
(+169,6 ± 586,8 dk, kod `loose`); (iii) gerçek hasarda değişkenlik ~3 kat (ss 597 ↔ 209 dk);
(iv) EMSR AOI dışındaki ~%6 kenar açık kabul edildi; (v) kural adları **M-76**'ya bağlı.

### ✅ M-80 🟠 Bölüm 4.7 hipotezi desteklenmedi — metin ve Tablo 18 buna göre yazılmalı `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Bölüm 4.7'deki hipotez paragrafı "Sınanan hipotez" olarak geçmiş zamana
çevrildi ve sonucu eklendi (desteklenmedi; alternatif açıklamayla uyumlu). "Doldurulduğunda sınanacaktır"
ifadeleri kaldırıldı. Olumsuz sonuç en iyi ayar seçilmeden raporlandı.
**Bulundu:** 16 Eylül 2026 · **Kaynak:** J-30

P352 "duyarlılığın kesinlikten daha belirleyici olması beklenmektedir" diyor. Sonuç:
duyarlılık 0,92'ye çıkınca kesinlik ~0,10'da kaldı, yanlış alarmlar 9 görevin 9'unda
hedefi ağdan kopardı, kazanç %0. Makalenin kendi öngördüğü alternatif ("kapanmaların ağ
topolojisindeki konumu sayısından belirleyici") veriyle uyumlu. P352 önceden kayıtlı bir
hipotez olarak kalmalı, ardına sonuç paragrafı eklenmeli; "doldurulduğunda sınanacaktır"
ifadeleri (P346, P349, P352) geçmiş zamana çevrilmeli. Olumsuz sonuç olduğu gibi
raporlanmalı; en iyi yumuşak ayarı (%18 ± 23) seçip öne çıkarmak çoklu karşılaştırma
hatası olur (J-30 sonuç 2).

### ✅ M-81 🟠 Kazancın dağılımı ve R0'ın niteliği yazılmalı `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — 4.6'ya "Kazancın dağılımı" paragrafı (sentetik %79 çarpma, medyan 60,3 dk;
EMSR %57–60 çarpmama; keşiflerin %89–91'i K-Z1'de; tek görevde 38 keşif; ss 597,1 ↔ 209,3) ve R0'ın niteliği
eklendi. 4.5'teki "18/18 güzergâh" ifadesi "atama 18/18, rotalanan 17–18" olarak düzeltildi. 5.1 ve 5.3(g)
buna göre güncellendi.
**Bulundu:** 16 Eylül 2026 · **Kaynak:** J-29 bulgu 4–5, 7

Toplam kazanç birkaç görevde ve tek bölgede toplanıyor: sentetikte görevlerin %79'u
kapanmaya çarpıyor ama görev kazancının medyanı 60,3 dk [20,0; 104,8]; EMSR'de (kod
`loose`) görevlerin **%57'si hiç kapanmaya çarpmıyor** (medyan 0 dk); keşiflerin **%89'u
K-Z1'de**; tek görevde 38 keşif (760 dk ceza). R0 her kapalı kenarı tek tek öğrenen,
bilgi paylaşmayan bir ajandır — yoğun hasar kümesinde gerçekçi değil. Bölüm 4.6 ve 5.1'de
bu açıkça yazılmalı; R1/R2 (M-25) gelince karşılaştırma bununla tamamlanmalı. Ayrıca
sentetik kapanma bazen afetzedeyi ağdan koparıyor (rotalanan 17,8 / 18) — 4.5'teki "18/18"
ifadesi düzeltilmeli.

### ✅ M-82 🟡 Senaryoda "önerilen sistem" kusursuz bilgiyle çalışıyor — açıkça yazılmalı `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — 4.6'ya "önerilen sistem ≙ R3" paragrafı, Tablo 16 satır adına "≙ R3" ve tablo
notu eklendi; 5.3(a) "süre farkları kusursuz kapanma bilgisinin değerinin ölçüsüdür" olarak yeniden yazıldı.
**Bulundu:** 16 Eylül 2026

Sentetik ve EMSR648 koşularında planlayıcı kapanma kümesini **eksiksiz** biliyor
(`safe_G` = çizge − kapalı kenarlar). Yani Tablo 16'daki "Önerilen sistem" satırı fiilen
**R3 (kusursuz bilgi)** referansıdır; algılama hatasının etkisi yalnız Tablo 18'de
(drone, model-bilgili ajan) ölçülmüştür. Bu, Bölüm 4.6'da tek cümleyle yazılmazsa hakem
Tablo 16'yı "algılama dahil sistem kazancı" diye okur. J-30'un ilk paragrafı aynı
tespiti yapıyor.

### ✅ M-83 🟠 Drone sahnelerinin veri kaynağı Tablo 2'de ve Veri Erişilebilirliği'nde yok `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 🧪 SİMÜLASYONDAN · 🔍 KONTROL EDİN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Sahne bilgileri OpenAerialMap meta veri servisinden **doğrulandı**
(`api.openaerialmap.org/meta/<kimlik>`): üç sahne de **CC BY 4.0**, platform İHA, çekim 9 Şubat 2023
16:00–17:00 UTC, yükleme 14 Şubat 2023; sağlayıcı Help.NGO, H-D2'de "Help.NGO, Portugese GRU". Eklenenler:
**kaynak [64]** (sahne başlıkları, üç görüntü kimliği, lisans); **Tablo 2**'ye yeni satır (OpenAerialMap
satırının altına) ve tablo başlığındaki yanlış "yalnızca uydu görüntüsü ve sismik katalog" ifadesinin
kaldırılması; **Bölüm 4.7**'de [64] atfı, lisans ve ortak sağlayıcı; **Veri Erişilebilirliği**'nde [64] ve
yanlış cümlenin düzeltilmesi ("model başarımı Maxar/Esri üzerinde ölçülmüştür" → bölütleme KATE-CD [56] ve
MEDBFS [57], görev tabanlı değerlendirme Help.NGO [64]); **Teşekkür**'e CC BY atfı. Not: [64] Tablo 2'de
([48]–[63]'ten önce) ilk kez anıldığı için dergi "ilk anılma sırası" isterse kaynakça yeniden
numaralandırılmalı (M-42 kapsamında).
**Bulundu:** 16 Eylül 2026

Bölüm 4.7'de Help.NGO / OpenAerialMap drone görüntüleri (9 Şubat 2023, 3,4–3,9 cm/px) kullanıldığı yazıldı,
ancak bu kaynak Tablo 2'de (veri kaynakları), kaynakçada ve Veri Erişilebilirliği beyanında yok. Lisans
(OpenAerialMap görüntüleri çoğunlukla CC BY 4.0) ve sahne kimlikleri doğrulanıp üç yere de eklenmeli.

### ✅ M-84 🟠 Word'de alan güncellemesi ve ek uyumu kontrolü `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Belge Word ile açılıp alanlar **iki kez** güncellendi (tek geçişte
başlıktan önce gelen 12 atıf eski numarada kalıyordu). Sonra otomatik denetim: 40 REF hedefinin tamamı
başlık numarasıyla aynı, tablo numaraları 1–24 kesintisiz. Ek uyumu denetleyicisi (`'da/'de/'ta/'te`,
`-ki`, `-n`) **12 hata** buldu ve düzeltti — 8'i numara kaymasından, **4'ü önceden vardı** (ör. "Şekil 10'de").
Alan kodu olmayan tek eskimiş atıf ("Tablo 21'deki n_sınama", Bölüm 3.6) REF alanına çevrildi. Son dosya
Word'de hatasız açılıyor: 25 tablo, 114 alan, 17 denklem, 63 sayfa, 0 hatalı alan sonucu.
**Kullanıcının F9 yapmasına gerek yok.**
**Bulundu:** 16 Eylül 2026

Belgeye iki yeni tablo eklendiği (Tablo 10) ve tablolar yeniden kurulduğu için SEQ/REF alanlarının önbellek
numaraları eski. Word'de **Ctrl+A → F9** yapılmalı. Ardından REF alanlarının arkasındaki Türkçe ekler
kontrol edilmeli: numara değişince "Tablo 16'da" → "Tablo 17'de" gibi ek uyumu bozulabilir (alan yalnız
numarayı günceller, eki değil).

### ☐ M-85 ⚪ Sarı vurguların temizlenmesi `[B]`
🏷️ **Etiketler:** ✖ YAPILMADI · ⏳ KALAN · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 👥 SİZ YAPMALISINIZ

**Bulundu:** 16 Eylül 2026

16 Eylül 2026 oturumunda değiştirilen/eklenen her metin ve tablo hücresi **sarı vurgulu** bırakıldı (önceki
oturumun kalın işaretleme yönteminin yerine; kalın biçim son belgede anlam taşıdığı için). Kullanıcı
değişiklikleri onayladıktan sonra Word'de **Ctrl+A → Giriş → Metin Vurgu Rengi → Renk Yok** ile temizlenmeli.
Önceki oturumdan kalan **kalın** işaretli cümleler (ör. 4.5 "Model gecikmeleri" paragrafının içindekiler)
ayrıca gözden geçirilmeli.

### ✅ M-86 🟡 Tablo 2'de eğitim kümeleri (KATE-CD, MEDBFS) ve Türkçe metin kümesi yok `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · ❓ SORU/KARAR · 🔍 KONTROL EDİN
❓ **Soru:** CC BY-NC lisanslı veri kullanımı sorun mu; KATE-CD lisansı ne?

**Durum: TAMAMLANDI** (16 Eylül 2026, kullanıcı yokken verdiği yetkiyle) — Tablo 2'nin sonuna üç satır eklendi (KATE-CD [56], MEDBFS [57] Türkiye alt kümesi, Türkçe afet metni kümesi); başlıktan "Türkçe metin" çıkarıldı ve "Son üç satır, model eğitimi ve değerlendirmesinde kullanılan kümeleri gösterir." cümlesi eklendi. Veri Erişilebilirliği'ndeki "Bu kaynaklar, model eğitiminde … kapsar" cümlesi düzeltildi (eğitim kümeleri o listede yoktu) ve iki kümenin lisans durumu eklendi. [57]'ye Zenodo DOI'si eklendi.
**Doğrulanan bilgiler ve kaynakları:**
- KATE-CD: Hugging Face `CSCRS/kate-cd` README — Maxar Open Data + Airbus Pléiades, 0,3–0,5 m, 8 bit, EPSG:32637, yedi il (Adıyaman, Gaziantep, Hatay, Kahramanmaraş, Kilis, Osmaniye, Malatya), 512×512, 486 çift (404/44/38). **Lisans veri kartında yok** (CSCRS sayfasında da yok). Eğitim defteri yalnız `train` bölümünü (404) kullanıyor.
- MEDBFS: MDPI makalesi (Data 9(7):88; tarayıcıdan okundu, WebFetch 403 veriyor), GitHub `ziwen-hash/MEDBFS` README, Zenodo API. Türkiye alt kümesi: Kahramanmaraş + Gaziantep, deprem öncesi WorldView, sonrası Jilin-1, 0,5 m, 876 görüntü. Zenodo'da `Turkey.zip` HTTP Range ile indirilmeden okundu: 438 öncesi + 438 sonrası + 438 etiket, hepsi 512×512. **Lisans CC BY-NC 4.0** (makale CC BY 4.0). Eğitim defteri **11647956** kaydını ("AIR-DERSL-Earthquake Feature Set", 2. sürüm, 14 Haziran 2024) kullanıyor; makalenin verdiği 11241134 ilk sürüm. İkisi aynı concept kaydı (11241133), `Turkey.zip` iki sürümde aynı boyutta (3 328 157 848 bayt).
- Türkçe küme: Bölüm 3.6 künyesinden (2 028 kayıt, 1 418/305/305, 12–14 Şubat 2023). Bölge alanı bilinmediği için "Belirtilmemiş" yazıldı.
**Açık kalan:** KATE-CD lisansı (yazarlara/CSCRS'ye sorulabilir); CC BY-NC koşulu dergi/lisans seçiminde dikkate alınmalı.
Bu doğrulama sırasında iki yeni sorun bulundu: **M-89** ve **M-90**.
**Bulundu:** 16 Eylül 2026

Tablo 2 "dış veri kaynakları" başlığını taşıyor ama Bölüm 4.2'deki bölütleme karşılaştırmasının eğitildiği
KATE-CD [56] ve MEDBFS [57] ile Bölüm 3.6'daki Türkçe metin kümesi tabloda yok. Ayrıca Esri Wayback ve Maxar
satırlarının bu sürümdeki ölçümlerin hangisinde kullanıldığı belirsiz (Veri Erişilebilirliği cümlesi bu
oturumda düzeltildi). Kümelerin çözünürlük, tarih ve lisans bilgileri doğrulanıp satır olarak eklenmeli.

### ✅ M-87 🔴 İki gömülü şekil eski veriyle üretilmiş — metinle çelişiyor `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 🧪 SİMÜLASYONDAN

**Durum: TAMAMLANDI** (16 Eylül 2026, kullanıcı Word'ü kapattıktan sonra) — İki yeni görsel belgeye gömüldü (`image7.png` ve `image8.png` yerine; SHA-1 ile doğrulandı), Şekil 9'un çerçeve yüksekliği yeni en-boy oranına göre ayarlandı, iki başlık güncellendi, Bölüm 4.3'te "verilecektir" → "verilmektedir". Word iki geçişli alan güncellemesi, `ref_kontrol` (40/40) ve `ek_uyumu` (0 hata) temiz.
**Bulundu:** 16 Eylül 2026

12 Eylül'de üretilip belgeye gömülen iki görsel eski tek tohumlu koşuya ve eski kural tanımlarına aitti; metin
taraması resimlerin içini görmediği için 71 yerlik taramada çıkmamıştı:
- **Şekil 9 (Bölüm 4.3, `word/media/image7.png`):** "Katı 1,52/1,71 · Dengeli 0,85/0,00 · Gevşek 0,85/0,00"
  — eski kural adları ve tanımları; notunda "dokuz operasyon bölgesi".
- **Şekil 11 (Bölüm 4.6, `word/media/image8.png`):** "Toplam 1434,4 dk · 1360,0 dk (%94,8) · 74,4 dk" ve eski
  t_u taraması (%26,5 → %87,4).

**Yapılan:** İki şekil 10 tohumlu veriyle yeniden üretildi (`araclar/sekiller_0916.py`, çıktılar
`araclar/gorseller/`): Şekil 9 = (a) bölge başına sentetik kapalı kenar oranı (ort ± ss, tohum noktaları),
(b) EMSR648'den üç kuralla aynı ilçe kutularında kapalı kenar oranı; Şekil 11 = (a) Denklem (11)
ayrıştırması beş yapılandırmada (± ss, ceza payı), (b) t_u duyarlılığı (sentetik bant ± ss; katı / orta /
gevşek). Palet doğrulayıcıdan geçti; görsel olarak çakışma denetlendi.
**Uygulanmadı:** belge o sırada kullanıcının Word penceresinde açıktı (kaydetme "Permission denied").
**Yapılacak:** Word'ü kapatıp `python araclar/sekil_gom.py` çalıştırmak (görselleri değiştirir, çerçeve
yüksekliğini ayarlar, iki başlığı günceller, 4.3'te "verilecektir" → "verilmektedir"); ardından
`araclar/BENIOKU.md`'deki zincir (iki geçişli alan güncellemesi → `ref_kontrol` → `ek_uyumu`).

### ☐ M-88 ⚪ Belge Word 2010 uyumluluk modunda `[B]`
🏷️ **Etiketler:** ✖ YAPILMADI · ⏳ KALAN · 🆕 SONRADAN EKLENDİ (16 Eylül, simülasyon güncellemesi) · 👥 SİZ YAPMALISINIZ · ❓ SORU/KARAR
❓ **Soru:** dergi şablonu hangi Word biçimini istiyor?

**Bulundu:** 16 Eylül 2026

`word/settings.xml`: `compatibilityMode = 14`. Word başlıkta "Uyumluluk Modu" gösteriyor. Zararsız; ancak
dergi şablonuna geçerken **Dosya → Bilgi → Dönüştür** ile güncel biçime çevrilmesi önerilir (çevirme
sayfa düzenini az da olsa değiştirebilir, bu yüzden dergi biçimine geçişle birlikte yapılmalı).

### ✅ M-89 🟠 Bölüm 4.2: karolama ve %95 eleme adımı fiilen hiçbir şey yapmamış, metin aksini söylüyordu `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül akşamı) · 🔍 KONTROL EDİN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Bölüm 4.2 "Veri kümesi" paragrafı ve Tablo 13'ün altındaki
"hedef protokolden ayrılma" paragrafının (ii) ve (iv) maddeleri gerçek duruma göre yeniden yazıldı (sarı vurgulu).
**Bulundu:** 16 Eylül 2026 (M-86 doğrulaması sırasında)

**Kanıt** (`QuakeMind_makale/optimized_training_colab.ipynb` çıktıları + Zenodo `Turkey.zip` dizini):
- KATE-CD görüntüleri de MEDBFS görüntüleri de **zaten 512 × 512**. 512 pencere / 256 adımlı karolama bu yüzden
  her görüntüden **tek karo** üretiyor; "örtüşmeli karolama" fiilen örtüşme yaratmıyor.
- SegFormer defterinin çıktısı: `Toplam: 842 tile — Hasarlı: 842 (100.0%) — Hasarsız: 0`. Yani **842 karonun
  tamamı hasar pikseli içeriyor**, "hasarsız karoların %95'i elendi" adımı hiçbir karoyu çıkarmamış.
- MEDBFS makalesi: hasarlı bina içermeyen karolar küme kurulurken zaten çıkarılmış.
- MEDBFS etiket anlamı (makaleden): 0 = belirgin hasar görmemiş bina ve bina dışı alan, 1 = ağır hasar,
  2 = tam yıkılma. Kod `mask > 0` ile 1 ve 2'yi birleştiriyor; bu **doğru** (sağlam binalar hasar sayılmamış).
  Örnek 63 etikette piksel dağılımı: %99,36 sıfır, %0,55 bir, %0,09 iki.
- Beş kıyaslama mimarisinin defteri (`model_benchmarks/01_yol_hasari/local_colab_run/build_notebook.py`)
  aynı girdi ve aynı karolama kodunu kullanıyor ama karo sayısını kaydetmemiş; metinde bu açıkça yazıldı.

**Metindeki eski ifadeler:** "Görüntüler … 256 piksel adımla örtüşmeli karolara bölünmüş, … hasarsız karoların
%95'i rastgele elenmiştir"; (ii) "karolama 256 piksel adımla örtüşmeli olduğundan, örtüşen karoların farklı
bölmelere dağılmasından doğan sızıntı"; (iv) "sınama kümesindeki hasarsız karoların %95'i elenmiştir";
"KATE-CD … 404 görüntü–maske çiftinden oluşan" (küme 486 çift; 404 yalnız eğitim bölümü).
**Yeni ifade özeti:** sınama kümesi yalnız hasar içeren karolardan oluşur. Hasarsız sahnelerdeki yanlış pozitifler
ölçülmediği için özellikle **kesinlik iyimser** sapabilir. Eski metin doğruluk ve özgüllüğü de "iyimser" diyordu;
bunların yönü belirsiz olduğundan yalnız "gerçek değeri yansıtmaz" denildi. (ii) maddesinde aynı piksellerin iki
bölmeye düşmediği, ama komşu karoların mekânsal sızıntısının denetlenmediği yazıldı.
**İnceleyen dikkat etsin:** Bölüm 3.2.1'deki (hedef protokol, yol hasarı) örtüşmeli karolama sızıntısı uyarısı
gelecekteki yol hasarı kümesi için hâlâ geçerli; değiştirilmedi.

### ✅ M-90 🟠 Şekil 7 yanlış başlıklı ve karşılaştırılamaz bir SegFormer çubuğu içeriyordu; Şekil 8 yeniden çizildi `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül akşamı)

**Durum: TAMAMLANDI** (16 Eylül 2026) — `araclar/sekil7_8.py` ile iki şekil `results/*.json` verisinden yeniden
üretildi ve belgeye gömüldü (eski görseller SHA-1 ile eşleştirilerek değiştirildi). Şekil 7 başlığı ve 4.2
"Gözlemler" paragrafı güncellendi.
**Bulundu:** 16 Eylül 2026

**Eski Şekil 7'deki sorunlar** (`results/00_comparison_chart.png`, belgede `image1.png`):
1. Grafik başlığı **"01 Yol Hasari - Mimari Karsilastirmasi"**; oysa karşılaştırma bina hasarı görevinde yapıldı.
2. Başlıkta "beş kıyaslama mimarisi" yazıyordu, grafikte **altı çubuk** vardı. SegFormer'in 0,4276 değeri
   diğerlerinin **ortalama IoU**'suyla (≈0,66) aynı eksende çizilmişti ve SegFormer en kötü model gibi görünüyordu.
   Oysa 0,4276 (a) doğrulama kümesinde, (b) **her grupta (batch) ayrı hesaplanıp ortalanan ikili hasar IoU'su**
   (`compute_iou`, `optimized_training_colab.ipynb`). Beş mimarinin `iou_fg` değeri ise tüm sınama pikselleri
   üzerinden tek seferde hesaplanmış.
   Aynı hata depodaki `results/00_comparison_table.csv` dosyasında da var: 0,4276 `mean_iou` sütununa yazılmış.
   **Bu, kod/sonuç deposunda düzeltilmeli** (bu oturumda kod değiştirilmedi).
3. Türkçe karakter yok, makalenin şekil biçimiyle uyumsuz.

**Yeni Şekil 7:** yalnız beş mimari, birincil ölçüt IoU_hasar (Tablo 13'le birebir; betik 4 basamakta
`assert` ile denetliyor), 0–0,5 ekseni, değer etiketli. SegFormer'in neden alınmadığı başlıkta yazıyor.
**Yeni Şekil 8:** aynı veriler (eğitim kaybı; doğrulama ortalama IoU ve F₁), Türkçe etiketler, beş panelde ortak
x ekseni (0–38 devir) ve ortak y aralığı. Böylece PSPNet'in daha uzun eğitimi doğrudan görülüyor. Çerçeve
boyutu değişmedi. M-71'deki "her alt grafik kendi başlığında mimari adını taşır" notu hâlâ geçerli
(ör. "PSPNet (ResNet-18) — eğitim kaybı").

### ✅ M-91 🟠 Tablo 6 ve Bölüm 3.4, koşulan mimari ayarlarıyla uyuşmuyordu `[B]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül akşamı) · 🔍 KONTROL EDİN

**Durum: TAMAMLANDI** (16 Eylül 2026) — Tablo 6'nın üç hücresi, 3.4'teki kademe sayısı paragrafı ve 4.2
"Gözlemler"deki PSPNet yorumu düzeltildi (sarı).
**Bulundu:** 16 Eylül 2026 (M-28 ölçümü sırasında)

Beş kıyaslama modeli `smp.<Mimari>(encoder_name=…, encoder_weights='imagenet', in_channels=3, classes=1)` ile
**başka ayar verilmeden** kurulmuş (`build_notebook.py`), yani kütüphane varsayılanları geçerli. Colab'da smp sürümü
sabitlenmemiş, ancak yerel smp 0.5.0 ile kurulan modellerin parametre sayıları eğitim JSON'larıyla birebir aynı
(DeepLabV3+ 45,67 M, PSPNet 11,33 M …). Varsayılanlar (`inspect.signature`):
- **DeepLabV3+:** `decoder_atrous_rates=(12, 24, 36)`, ayrılabilir ASPP. Tablo 6 **(6, 12, 18)** diyordu; bu, özgün
  makalenin çıkış adımı 16 için verdiği değer.
- **PSPNet:** `encoder_depth=3`, `upsampling=8`. Model kodlayıcının **yalnız ilk üç kademesini** kullanıyor. Tablo 6
  "4 / 5" diyordu, "4 / 3" yapıldı. 3.4'teki "kademe sayısı beştir ve altı mimari arasında eşittir" cümlesi de iki
  yönden yanlıştı: PSPNet 3 kademe kullanıyor, SegFormer ise ResNet değil, 4 kademeli MiT-B4. PSPNet'in en düşük
  GFLOPs değeri (11,5) ve en düşük IoU_hasar değeri de bununla ilişkili olabilir; 4.2'ye not düşüldü.
- **U-Net:** `decoder_channels=(256, 128, 64, 32, 16)`. Tablo yalnız hedeflenen dört kademeli değeri veriyordu; iki
  değer birlikte yazıldı.
**İnceleyen dikkat etsin:** Hedeflenen kurguda (MiT-B4 sabit) PSPNet'in kademe sayısı açıkça belirlenmeli; aksi
hâlde aynı fark yeniden oluşur.

### ✅ M-92 ⚪ İki "Tablo 13'nin" ek hatası; ek denetimi genişletildi `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül akşamı)

**Durum: TAMAMLANDI** (16 Eylül 2026) — 3.4 ve 4.2'deki iki "Tablo 13'nin" → "Tablo 13'ün" (sarı). Bunlar büyük
olasılıkla eski "Tablo 12'nin" numarası kaydırılırken kalmıştı.
**Bulundu:** 16 Eylül 2026

`araclar/ek_uyumu.py` yalnız alan sonucundan sonraki -DA / -DAn / -DAki eklerine bakıyordu; ilgi, belirtme, yönelme,
araç ve iyelik ekleri denetlenmiyordu. Yeni `araclar/ek_uyumu_genis.py` paragraf ve hücre metninin tamamında
"Tablo/Şekil/Bölüm/Denklem/Algoritma N'<ek>" kalıplarını tarar ve yalnız rapor verir. Tüm belgede bu iki hata
çıktı, düzeltmeden sonra 0. **Zincire eklenmeli:** her numara kaymasından sonra iki denetim birlikte çalıştırılmalı.

### ✅ M-93 🟡 On iki şekilde atıf cümlesi görsel ile başlığı arasına girmişti `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül akşamı)

**Durum: TAMAMLANDI** (16 Eylül 2026) — Cümleler görsel bloğunun önüne taşındı; artık her şekil başlığı doğrudan
görselin (ya da yer tutucunun) altında. Taşınan cümlelerin metni değişmediği için **sarı vurgu yok**.
**Bulundu:** 16 Eylül 2026 (Şekil 12 gömülürken)

M-39 düzeltmesi "her tabloya/şekle başlıktan hemen önce bir atıf cümlesi" eklemişti. Tablolarda başlık tablonun
üstünde olduğu için bu doğru. Şekillerde ise başlık görselin altında olduğundan cümle görsel ile başlığı arasına
girmişti. Etkilenen şekiller: 2, 3, 4, 5, 6, 10 (yer tutucu – cümle – başlık) ve 11, 15, 17, 18, 19, 20
(görsel – cümle – başlık). Aynı düzeltmede:
- M-72'de kaldırıldığı yazılan eski Şekil 9 yer tutucusu başlıksız duruyordu; kaldırıldı.
- 4.2'deki "görsel bölütleme karşılaştırması (Şekil 9) bu sürümde sunulmamıştır" cümlesinden bayat numara silindi.
- Şekil 10'un yer tutucusu kendi içinde "[ŞEKİL 11 —" diyordu; "[ŞEKİL 10 —" yapıldı.
Denetim betiği (her başlığın önündeki öğe) `uygulanan_duzeltmeler/duzelt_m93.py` içinde; sonuç: 20/20 başlık
görsel ya da yer tutucunun hemen altında.

### ✅ M-94 ⚪ "Şekil 16–21" aralığı ve yanlış yerdeki tablo dipnotu `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül akşamı)

**Durum: TAMAMLANDI** (16 Eylül 2026)
**Bulundu:** 16 Eylül 2026

- 4.9: "Yukarıdaki beş gözlem Şekil 16–21 üzerinde izlenebilmektedir." Belgede 20 şekil var. Aralığın ilk sayısı
  alan koduydu, "–21" ise düz metindi (şekil sayısı bir azaldığında güncellenmemişti). İkinci sayı da Şekil 20'ye
  REF alanı yapıldı (sarı).
- Tablo 22'nin "† Çift yönlü UKSB + fastText satırının eğitim süresi için ölçüm kaydı alınmamıştır." dipnotu, tablodan
  birkaç paragraf sonraki "Sıralamanın ölçüte göre değişmesi Şekil 13'te…" cümlesinin sonuna yapışmıştı. Dipnot,
  Tablo 13'ün dipnot biçimiyle tablonun hemen altına taşındı (metin değişmediği için vurgusuz).

### ✅ M-95 🟠 Tablo 24'te ölçülmüş bir eksen hâlâ "[ÖLÇÜLECEK]" `[D]`
🏷️ **Etiketler:** ✔ YAPILDI · 🆕 SONRADAN EKLENDİ (16 Eylül akşamı) · 🧪 SİMÜLASYONDAN · 🔍 KONTROL EDİN

**Durum: TAMAMLANDI** (16 Eylül 2026 akşamı, kullanıcı isteğiyle) — Tablo 24'ün "Görev tabanlı değerlendirme" satırı dolduruldu (sarı): değer hücresi "Ölçülmüştür (Tablo 19 — REF alanı; üç drone sahnesi, 90 görev, 10 tohum): … 15 sert ayarın hiçbirinde R0'dan iyi değil (yakalanan pay %0 ile %−11) … yalnız SegFormer ve üç küçük sahne; diğer mimarilerle yinelenecektir". Referans veri hücresi "Model türevli kapanma katmanı" → "SegFormer türevli kapanma katmanı (planlama) ve EMSR648 [8] kapanmaları (yürüyüş)". Word iki geçiş, `ref_kontrol` temiz, iki ek denetimi 0.
**Hâlâ açık (bu maddenin dışında):** Tablo 24'ün yer seviyesi satırı M-62 teyidini bekliyor; yol bölütlemesi, yol kıyaslaması ve bölgeler arası genelleme satırları M-21/M-24'e bağlı.
**Bulundu:** 16 Eylül 2026
**Bulundu:** 16 Eylül 2026

Tablo 24 ("Tamamlanacak başarım değerlendirmesinin eksenleri"), **görev tabanlı değerlendirme** satırında
değeri `[ÖLÇÜLECEK]` olarak veriyor; oysa bu eksen Bölüm 4.7'de ölçüldü (Tablo 19, olumsuz sonuç). Aynı
tablonun **yer seviyesi hasar tespiti** satırı da, model dosyalarındaki doğrulama mAP'ı (M-62) makaleye
yazılırsa güncellenmeli. Tablo 24'ün geri kalan `[ÖLÇÜLECEK]` satırları (yol bölütlemesi, yol kıyaslaması,
bölgeler arası genelleme) gerçekten ölçülmemiş durumda; M-21/M-24 kararlarıyla birlikte ele alınmalı.
**Yapılacak:** görev tabanlı satırını Tablo 19'a atıfla doldur; M-62 teyidinden sonra yer seviyesi satırını güncelle.


### ☐ M-96 🟠 Tablo 13'te SegFormer satırının başarım hücreleri boş — aynı bölmede yeniden değerlendirme gerekiyor `[D]`
🏷️ **Etiketler:** ✖ YAPILMADI · ⏳ KALAN · 🆕 SONRADAN EKLENDİ (16 Eylül akşamı) · 👥 SİZ YAPMALISINIZ · 🖥️ EĞİTİM/KOŞUM GEREKİR

**Bulundu:** 16 Eylül 2026 (devir hazırlığında; hiçbir maddede açık iş olarak görünmüyordu)

Tablo 13'ün SegFormer satırında doğruluk, kesinlik, duyarlılık, F₁ ve özgüllük `[ÖLÇÜLECEK]`, IoU_hasar
`[KARŞILAŞTIRILAMAZ]*` duruyor. M-01 bu satırı "karşılaştırılamaz" diye işaretleyerek kapatmıştı; hücrelerin
doldurulması ise hiçbir maddede yapılacak iş olarak yazılmamıştı. Sorun iki katmanlı (M-90): SegFormer ayrı
bir oturumda, iki katmanlı bölmeyle eğitildi ve IoU'su grup başına ortalanarak hesaplandı.
**Yapılacak:** SegFormer (MiT-B4) diğer beş mimariyle aynı bölmede (%70/%15/%15, tohum 42) ve aynı IoU
hesabıyla (tüm sınama pikselleri üzerinden) değerlendirilmeli. Bunun için
`model_benchmarks/01_yol_hasari/local_colab_run/build_notebook.py`'deki `ARCHS` sözlüğüne SegFormer eklenip
aynı `train_one_arch` ile koşulabilir. Sonra Tablo 13, Şekil 7, Bölüm 4.2 "Gözlemler" ve 5.3(o) güncellenir.
**Ortam:** GPU (Colab T4); yerel makinede GPU yok.
---

# KALAN İŞLER (16 Eylül 2026 akşamı itibarıyla)

> 12 Eylül'de yazılan üç aşamalı öncelik tablosunun maddelerinin çoğu kapandığı için bu bölüm yeniden yazıldı.
> Tablo numaraları **belgedeki güncel** numaralardır (madde başlıkları eski numarayı korur).

## A. Hemen yapılabilir — yazım ve dizgi (koşum gerektirmez)

| Öncelik | Madde | İş | Not |
|---|---|---|---|
| ⚪ | M-41 | "Bölüm N" ve "Denklem (N)" atıflarını alan koduna çevir | İsteğe bağlı |

## B. Bilgi ya da karar bekleyen

| Kimden | Madde | Beklenen |
|---|---|---|
| Yazarlar | M-45 | Üç yazarın **ORCID** numarası ve **sorumlu yazar** (e-posta) |
| Yazarlar | M-47 | Özel Türkçe metin kümesinin erişim politikası — *"sonra konuşulacak"* |
| Yazarlar / danışman | M-42 | **Hedef dergi** → ardından Öz/Abstract kısaltma, atıf biçimi, M-88 dönüştürme |
| Yazarlar / danışman | M-21 | Yol hasarı etiketli kümesi: etiketle / CAU-RoadDamage / gelecek çalışma |
| Yazarlar / danışman | M-23 | Tablo 14 (kapanma–yer gerçeği): SegFormer verisi yalnız Tablo 19'da var; tabloyu kaldırıp Tablo 19'a atıf mı, diğer beş modelin yol maskeleri mi? |
| Yazarlar / danışman | M-57 | Tablo 14'ün τ sütunu `[TARANACAK]`: tarama değerleri — M-23 kararına bağlı (tablo kalırsa doldurulur, kaldırılırsa düşer) |
| Yazarlar | M-62 | Eğitim ayarları ve doğrulama mAP'ı model dosyalarından **bulundu** (bkz. madde). Beklenen: `bina.pt` / `catlak.pt`'yi kim eğitti, hangi Roboflow projesi ve sürümü (`maras` v2, `crack` v2), görüntü sayısı ve bölme oranları |
| Danışman | M-70 | Çift kör hakemlik → depo adresi, yazar bloğu ve model adının anonimleştirilmesi |

## C. Ölçüm ya da koşum gerektiren

| Madde | İş | Ortam |
|---|---|---|
| M-96 | Tablo 13: SegFormer satırını diğer beş mimariyle aynı bölmede değerlendir | GPU (Colab) |
| M-24 | Tablo 15: bölgeler arası genelleme | GPU (Colab) — yeniden eğitim |
| M-27 | Tablo 21: bileşen çıkarma ve parametre duyarlılığı | Kısmen veri var (t_u, r_h); diğer eksenler koşum ister |
| M-30 | BERTurk gecikmesinin bileşenlere ayrıştırılması | Yerel arka uç, zamanlama ölçümü |
| M-43 | Üretilmemiş şekiller: 1, 2, 6 (çizim), 3 (GIS haritası), 4–5 (şema), 10 (güzergâh haritası) | Şekil 12 16 Eylül'de üretildi. Şekil 10 için senaryo koşusundan rota geometrisi kaydedilmeli (`runs/` altında yok) |
| M-44 | Şekillerin çözünürlüğü ve dili | 19 görselin 14'ü yenilendi. Kalan Şekil 17, 19, 20 katlama dışı tahmin / eğitilmiş model ister → `05_risk_skoru/local_run/run_all_risk.py` yeniden koşulmalı |
| E-04 | Genişletilmiş kurtarma kuralını kodda uygula ve yeniden ölç | **Kod geliştirme** — iki kritik medikal ihbar hâlâ kategorisiz |

## D. Son adım

| Madde | İş |
|---|---|
| M-85 | Onaydan sonra sarı vurguları temizle (Ctrl+A → Vurgu yok) |
| — | Word'de son bir iki geçişli alan güncellemesi + `ref_kontrol` + `ek_uyumu` |

---

# KİMLİK EŞLEME

Eski listelerdeki numaralarla arama yapılabilmesi için:

| Bu dosya | Bu oturumun listesi | Diğer inceleme | `EKSIKLER_VE_SORUNLAR.md` |
|---|---|---|---|
| M-01 | A-1 | B8 / B9 | A-01 |
| M-02 | A-2 | — | A-02 |
| M-03 | A-3 | — | A-03 |
| M-04 | — | A1 | A-06 |
| M-05 | — | A2 | A-07 |
| M-06 | A-4 | A3 | A-04 |
| M-07 | — | A4 | A-08 |
| M-08 | — | B6 | A-09 |
| M-09 | A-5 | A3-ek | A-05 |
| M-10 | — | D1 | D-06 |
| M-11 | — | C4 | D-07 |
| M-12 | — | C5 | A-10 |
| M-13 | — | C2 | A-11 |
| M-14 | — | C3 | A-12 |
| M-15 | C-1 | — | — |
| M-16 | — | C14 | A-13 |
| M-17 | C-2 | — | E-04 |
| M-18 | C-4 | — | — |
| M-19 | C-3 | — | — |
| M-20 | B-8 | — | B-01 |
| M-21 | B-1 | — | B-02 |
| M-22 | B-2 | B4 | B-09 |
| M-23 | B-4 | — | B-05 |
| M-24 | B-5 | — | B-06 |
| M-25 | B-7 | — | B-04 |
| M-26 | B-9 | — | — |
| M-27 | B-10 | — | B-07 |
| M-28 | B-3 | — | B-08 |
| M-29 | B-6 | — | — |
| M-30 | B-12 | — | B-10 |
| M-31 | B-13 | — | B-11 |
| M-32 | B-11 | — | C-02 |
| M-33 | — | B2 | B-13 |
| M-34 | — | C12 | — |
| M-35 | — | E1 | G-01 |
| M-36 | — | E2 | G-02 |
| M-37 | — | E6 | G-03 |
| M-38 | — | — | G-01 |
| M-39 | D-1 | — | — |
| M-40 | D-2 | — | — |
| M-41 | — | D3 | — |
| M-42 | D-3 | D4 / D5 / D6 | — |
| M-43 | E-1 | — | B-12 |
| M-44 | E-2 | — | — |
| M-45 | F-1 | — | — |
| M-46 | F-2 | — | — |
| M-47 | F-3 | — | — |
| M-48 | F-4 | — | D-01 |
| M-49 | — | B7 | — |
| M-50 | — | B9 | — |
| M-51 | — | C1 | — |
| M-52 | — | C9 | — |
| M-53 | — | C10 | — |
| M-54 | — | C16 | — |
| M-55 | — | C18 | — |
| M-56 | — | C19 | — |
| M-57 | — | C20 | — |
| M-58 | — | C21 | — |
| M-59 | — | D10 | — |
| M-60 | — | E3 | — |
| M-61 | — | E8 | — |
| M-62 | — | B1 | — |
| M-63 | — | B3 | — |
| M-64 | — | B5 | — |
| M-65 | — | C6 | — |
| M-66 | — | C7 | — |
| M-67 | — | C8 | — |
| M-68 | — | C13 | — |
| M-69 | — | C15 | — |
| M-70 | — | C17 | — |
| M-71 | — | D7 | — |
| M-72 | — | D8 | — |
| M-73 | — | E5 | — |
| M-74 | — | E7 | — |
| M-75 | — | — | — |
| *(D2 → M-45 notuna işlendi)* | | | |
| *(D9 → M-44 ile aynı kapsam, ayrı madde açılmadı)* | | | |
| *(E4 → M-38 ile aynı kapsam, ayrı madde açılmadı)* | | | |
| K-01 | — | C11 | H-01 |
| K-02 | — | — | H-02 |

---

# NE ZAMAN NİHAİ SAYILIR

Taslak şu dört koşul sağlandığında nihai düzeydedir:

1. **Bölüm 1'in tamamı kapalı** — yayın engelleyici hiçbir madde kalmamış.
2. **Bölüm 3'te tanımlanmamış hiçbir mekanizma Bölüm 4'te kullanılmıyor.**
   Bugün üç tane var: sentetik üretici (M-04), atama kuralı (M-05), üç
   geçilebilirlik kuralı (M-08). Bir hakem için bu, eksik ölçümden daha ağır bir
   kusurdur: eksik ölçüm "henüz yapılmadı" demektir, tanımsız mekanizma
   "yapılanın ne olduğu bilinmiyor" demektir.
3. **Her tablo ya doludur ya da tabloda değildir.** İskelet tablolar makaleden
   çıkarılıp "Gelecek Çalışmalar" bölümünde metin olarak anlatılmalıdır; dergiler
   boş tablo kabul etmez. Şu an 187 boş hücre var.
4. **Her şekil üretilmiştir** ve metinde numarayla anılmaktadır.

**Stratejik not.** 187 boş hücrenin tamamının doldurulması gerekmiyor olabilir.
Alternatif bir yol: makalenin kapsamını **ölçülmüş olanla sınırla** — bina hasarı
çok mimarili kıyaslaması, Türkçe metin kıyaslaması, risk kıyaslaması ve uçtan uca
senaryo. Ölçülmemiş eksenleri (yol bölütlemesi, görev tabanlı değerlendirme,
bölgeler arası genelleme) tablo iskeleti olarak değil, "Gelecek Çalışmalar"da
paragraf olarak sun. Bu, makaleyi bugün gönderilebilir hâle getirir; görev tabanlı
değerlendirme ise ikinci bir makalenin çekirdeği olur.

Hangi yolun seçileceği bir **kapsam kararıdır** ve danışman görüşü gerektirir.

---

*İlgili belgeler: `EKSIKLER_VE_SORUNLAR.md` (proje geneli takip — kod, depo, git
maddeleri dahil), `PROJE_DOSYASI.md` (uzman ortak yazarlar için teknik tanıtım)*
