# 📡 QuakeMind P2P (İnternetsiz) Haberleşme Modülü Test Rehberi

Afet durumlarında GSM operatörlerinin ve internet altyapısının çökmesi durumunda sahadaki ekiplerin kendi aralarında haberleşebilmesi için **Mesh/P2P yerel ağ mimarisi** geliştirilmiştir.

Bu modül, merkezi bir internet bağlantısına ihtiyaç duymadan, Raspberry Pi (veya test ortamında bir bilgisayar) üzerinden açılan yerel Wi-Fi ağı (Hotspot) sayesinde cihazların doğrudan birbiriyle iletişim kurmasını, fotoğraf ve konum paylaşmasını ve bu verilerin Edge cihaz üzerinde **Yapay Zeka (YOLO) / NLP** ile analiz edilmesini sağlar.

Aşağıdaki adımları takip ederek internetinizi tamamen kapatsanız bile sistemin kusursuz çalıştığını test edebilirsiniz.

---

## 🛠️ Adım 1: Bilgisayarı Ana İstasyon (Hotspot) Yapmak
Sistemin kalbi, etrafa internetsiz bir Wi-Fi yayını yapan Ana Düğüm'dür (Edge Node).
1. Bilgisayarınızın Ayarlar > Ağ ve İnternet sekmesine gidin.
2. **Mobil Etkin Nokta (Mobile Hotspot)** özelliğini açın.
3. *İpucu: Gerçek test için bilgisayarınızın asıl internet bağlantısını (Wi-Fi veya Ethernet) tamamen kesebilirsiniz. Sadece Hotspot açık kalsın.*

## ⚙️ Adım 2: P2P Sunucusunu Başlatmak
Telefon tarayıcılarının kamera ve GPS kullanabilmesi için sistemin güvenli (HTTPS) çalışması gerekir.
1. Proje dizininde bir terminal (CMD) açın.
2. Eğer daha önce sertifika üretmediyseniz şu komutla SSL sertifikalarını üretin:
   ```bash
   .\venv\Scripts\python.exe generate_cert.py
   ```
3. P2P Sunucusunu başlatın:
   ```bash
   .\venv\Scripts\uvicorn.exe apps.p2p_mesh.server:app --host 0.0.0.0 --port 8000 --ssl-keyfile key.pem --ssl-certfile cert.pem
   ```
4. Terminalde yeni bir sekme açarak yerel IP adresinizi öğrenin:
   ```bash
   ipconfig
   ```
   *(Wireless LAN adapter kısmındaki IPv4 adresini not alın. Örn: `192.168.137.1`)*

## 📱 Adım 3: Telefonları Ağa Bağlamak ve Giriş
Uygulama indirmeye gerek yoktur (PWA Mimarisi).
1. Test için kullanacağınız telefonları (birden fazla olursa daha iyi olur) bilgisayarın açtığı Hotspot ağına bağlayın.
2. Telefonların tarayıcısına (Chrome/Safari) bilgisayarın IP adresini **başına https:// koyarak** yazın.
   👉 **Örnek:** `https://192.168.137.1:8000/app`
3. *Not:* Yerel SSL sertifikası kullandığımız için tarayıcı "Bağlantınız Gizli Değil" uyarısı verir. Gelişmiş -> Devam Et diyerek sayfaya giriş yapın.
4. Sayfa açıldığında tarayıcının istediği **Kamera ve Konum** izinlerini onaylayın.

## 🧪 Adım 4: Canlı Test Senaryoları
Şu an cihazlar internet olmadan aynı yerel ağda birbirine bağlıdır!

### Senaryo A: Görüntülü Enkaz Bildirimi (YOLO AI)
1. Telefon ekranının altındaki **Bildir (Kamera)** menüsüne girin.
2. Durum Tipi olarak **"Enkaz / Yıkım Bildirimi"** seçin.
3. Kamera Aç butonuna basıp bir nesnenin veya ortamın fotoğrafını çekin.
4. **"Ağa Gönder (P2P)"** butonuna basın.
5. **Sonuç:** Bildirim anında ağdaki diğer telefonlara düşer. Bilgisayar (Edge Node) fotoğrafı anında işler ve telefonlara **"🤖 Yapay Zeka Sonucu: Yıkılmış Bina (%85)"** şeklinde geri bildirim fırlatır.

### Senaryo B: Acil İhtiyaç Çağrısı (NLP)
1. Yine Bildir menüsünde Durum Tipini **"Acil İhtiyaç / Çağrı"** olarak değiştirin.
2. Kamera kapanacak ve bir metin kutusu açılacaktır.
3. Kutunun içine *"Enkaz altında 2 kişi var, acil kan ve su gerekiyor"* yazın ve Ağa Gönder deyin.
4. **Sonuç:** Bildirim diğer telefonlara düşerken, bilgisayardaki NLP modülü yazıyı analiz edip **"🧠 NLP Analiz Sonucu: Acil Sağlık İhtiyacı"** etiketiyle tüm ağı bilgilendirir.

---
*Bu sistem, QuakeMind projesinin internet altyapısına bağımlı olmadan sahada hayat kurtarmaya devam edebileceğinin en büyük teknolojik kanıtıdır.*
