# QuakeMind Makalesi — Eklenecek Görseller (2026-09-21)

Aşağıdaki 4 görsel, güncel uygulama arayüzünden üretilip bu isimlerle iletilmeli.
"Etiketlenmiş veri örneği" (2209 TÜBİTAK raporundaki Şekil 10/12) ayrıca ele alınıyor,
bunun için ek bir şey üretmeye gerek yok.

## 1. `1_catlak_tespit.png` — Çatlak + bina hasarı tespiti

- **Kaynak:** Uygulamanın "Çatlak Tespiti" / "Hasar Tespit" ekranı, gerçek bir fotoğraf
  üzerinde analiz çalıştırılmış sonuç görünümü.
- **Görünür olması gerekenler:** Tespit kutuları + sınıf etiketi + güven skoru.
- **Veri:** Gerçek bir çatlak/hasar fotoğrafı (demo/mock görsel değil).
- **Gideceği yer:** Bölüm 3.2 (yer seviyesi tespit).

## 2. `2_risk_skoru.png` — Deprem risk skoru

- **Kaynak:** Risk sayfası, **Hatay veya Kahramanmaraş** bölgesi (H-Z1/K-Z1 senaryosuyla
  tutarlı olsun — İstanbul/demo bölge OLMASIN).
- **Görünür olması gerekenler:** Hesaplanmış gerçek bir risk skoru + harita/ısı görünümü.
- **Gideceği yer:** Bölüm 4.11 (risk skorlama sonuçları).

## 3. `3_nlp_harita.png` — NLP çıktısı haritalı

- **Kaynak:** NLP sayfası, gerçek bir metin ihbarı girilmiş, sınıflandırma + konum
  çıkarımı sonucu.
- **Görünür olması gerekenler:** Mümkünse haritadaki pin/işaretle birlikte.
- **Gideceği yer:** Bölüm 3.6 / 4.10 (NLP sonuçları).

## 4. `4_isi_haritasi_guzergah.png` — Isı haritası + güvenli güzergâh

- **Kaynak:** Harita/komuta sayfası, ısı haritası katmanı açıkken, mümkünse güvenli
  güzergâh da çizili durumda, tam ekran.
- **Gideceği yer:** Sistem tanıtımı / Bölüm 4.5.

## Teknik notlar (4 görsel için de geçerli)

- Format: PNG, mümkün olduğunca yüksek çözünürlük (diğer şekiller 300dpi ile üretildi,
  ona yakın netlik hedeflenmeli — ekranı büyütüp/yakınlaştırıp alın).
- Tarayıcı araç çubuğu / adres çubuğu görünmesin, sadece uygulama arayüzü.
- **Demo/mock veri değil, gerçek veri** kullanılsın.
- Dosya adları yukarıdaki gibi olsun (`1_catlak_tespit.png` vb.) — hangi maddeye ait
  olduğu isimden belli olmalı.

## Bu turda kapsam dışı (GPU/Colab bekliyor, ayrı ele alınacak)

- Yol hasarı segmentasyon overlay'i (SegFormer, uydu görüntüsü üzerinde hasar maskesi) —
  checkpoint yerelde yok.
- Bina hasarı segmentasyon overlay'i (5 mimariden biri) — aynı GPU engeli.

Görseller iletildiğinde docx'e uygun bölümlere, Türkçe alt yazılarla (Şekil 21-24 olarak)
eklenip metinde referans verilecek.
