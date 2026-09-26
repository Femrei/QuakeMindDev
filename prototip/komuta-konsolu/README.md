# Komuta konsolu prototipi

Yeni arayüzün tek ekranlık prototipi. Amacı tasarım yönünü ve mimariyi **gerçek veriyle**
göstermek; ürün kodu değildir, olduğu gibi taşınmaz.

Yayın (özel bağlantı): https://claude.ai/artifact/Mmkd2K9g1UV2QSx1CzwB1U

## Çalıştırma

Tek dosyalık sayfa, derleme gerektirmez. Klasörde basit bir sunucu yeter:

```bash
python -m http.server 8777 --bind 127.0.0.1
# http://127.0.0.1:8777/index.html
```

`file://` ile açmak da çalışır, ancak bazı tarayıcılar yerel dosyada betik kısıtı uygular.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html` | Sayfanın tamamı: tasarım token'ları, düzen, deck.gl katmanları, ısı hesabı, zaman şeridi, komut paleti |
| `qm-data.js` | Gömülü veri paketi (`window.QM`), ~0,53 MB |
| `veri_cikar.py` | `qm-data.js`'i depodaki gerçek verilerden yeniden üretir |

Veriyi yeniden üretmek için (depo kökünden):

```bash
python prototip/komuta-konsolu/veri_cikar.py
```

## Veri kaynakları

| Katman | Kaynak | Gerçeklik |
|---|---|---|
| Yol ağı, yapılar, hasar dereceleri, kamplar, engeller | Copernicus EMS **EMSR648**, AOI11 (Antakya), grading/monit01 | gerçek |
| Depremler (492 kayıt, Şubat 2023) | `apps/earthquake_risk/data/query.csv` | gerçek |
| Fay hatları | GEM aktif fay veri tabanı | gerçek |
| Toplanma alanları (90 kayıt) | AFAD toplanma alanları listesi | gerçek |
| SOS çağrıları (12) ve ekipler (6) | `benchmark/scenarios/hatay_orta.json` | **senaryo** |
| SOS çağrılarının saatleri | prototip için ana sarsıntıdan itibaren dağıtıldı | **üretilmiş** |

Senaryo ve üretilmiş veriler arayüzde de "senaryo verisi" diye etiketlidir
(bkz. `CLAUDE.md` kural 1).

## Ne kanıtlıyor

- Düzen ve etkileşimler gerçek veriyle çalışıyor: 4.545 yol, 3.686 yapı (68 yıkık,
  212 hasarlı, 114 şüpheli), 73 hasarlı yol segmenti.
- Dört kanallı ısı haritası: her kanalın yoğunluk ızgarası bir kez hesaplanıyor, ağırlıklı
  karışım ekran kartında yapılıyor, ölçek mutlak. Negatif ağırlık "sessiz bölgeler"
  sorusunu mümkün kılıyor.
- Harita dış karo servisi olmadan çiziliyor; altlık kendi verimizden.
- Canlı mod: pencere şimdiye kilitli, çağrılar saat geldikçe düşüyor, şerit geri çekilince
  geçmiş moduna geçiyor.
- Zaman penceresi bütün katmanları, sayıları ve listeleri süzüyor.

## Ne kanıtlamıyor

İl ölçeğinde performans, çok kullanıcılı davranış, gerçek SSE akışı, gerçek kimlik akışı.
Bunlar `MIMARI.md` bölüm 10'daki ölçümlerle kapatılacak.

## Üründe değişecekler

- Veri gömülü değil, uçlardan gelecek (ikili format, gerekirse vektör karo).
- Isı ızgaraları sunucuda üretilecek; tarayıcı yalnız karıştıracak.
- Kimlik, yetki ve SSE gerçek uçlara bağlanacak.
- Bileşenler React bileşenlerine bölünecek; token'lar Tailwind `@theme` dosyasına taşınacak.
- Yazı ölçeği `ARAYUZ_KARARLARI.md` bölüm 4'teki altı değere kilitlenecek
  (prototipte birkaç ara boyut var).
