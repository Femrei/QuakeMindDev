# QuakeMind - Proje Mimari Yol Haritası ve PostGIS Geçiş Planı

> **Doküman Türü:** Mimari Tasarım ve Yol Haritası (Roadmap)  
> **Durum:** 📌 *Phase 1 Aktif (Çalışıyor) - Phase 2 Gelecek Sürüm Planı*

---

## 🟢 1. Mevcut Sistem Mimarisi (Phase 1 - Aktif Sürüm)

Şu an yerelde çalışan sistem bileşenleri:
- **Backend Servisi:** FastAPI (`fastapi_app.py` - Port 8000) & Uvicorn
- **Yönetici/Analiz Paneli:** Streamlit (`main.py` - Port 8501)
- **Güvenli Rota Hesabı:** NetworkX + OSMnx (In-Memory A* / Dijkstra)
- **SOS Yönetimi:** In-Memory / REST API Repository
- **Afet Metin NLP:** BERTurk + NER modelleri
- **Uydu Yol Hasarı:** Segformer (`optimized_mitb4_focal_dice30.pth`)
- **Mobil Uygulama:** Flutter (`quakemind/`)

---

## 🚀 2. Gelecek Sürüm: PostGIS Mimarisi ve Entegrasyonu (Phase 2 Planı)

### 📱 2.1. Mobil (Flutter) & Sunucu İlişkisi
- **PostGIS Nereye Kurulacak?:** PostgreSQL + PostGIS veritabanı **yalnızca ana Backend Sunucusuna (PC / Gateway)** kurulur. Mobil cihazlara (telefonlara) herhangi bir veritabanı kurulmaz.
- **İletişim Yapısı:**
  - Mobil uygulama (Flutter), sunucudaki `FastAPI` endpoint'lerine (`/api/route`, `/api/sos`) hafif HTTP istekleri atar.
  - Tüm ağır GIS ve yapay zeka hesaplamalarını sunucu PostGIS üzerinde yapar ve telefona saf JSON yanıtı (koordinat listesi) döner.
  - **Avantajı:** Mobil cihazların şarjı ve hafızası korunur.

---

### 📴 2.2. İnternetsiz (P2P Mesh) ve İnternetli Çalışma Uyum Sertifikası

PostGIS yapısı QuakeMind'ın **çift modlu (Hybrid)** çalışma prensibiyle %100 uyumludur:

1. **İnternetsiz (Offline / Mesh Ağı) Modu:**
   - PostGIS dış bulut servislerine (Google Maps, Mapbox vb.) **bağımlı değildir**.
   - Tüm harita, fay hattı ve yol verileri yerel sunucu bilgisayarındaki PostgreSQL veritabanında saklanır.
   - İnternet tamamen kesildiğinde, Mesh ağındaki veya Hotspot'a bağlı cihazlar `10.42.0.1:8000` üzerinden yerel PostGIS'e erişerek kesintisiz yönlendirme ve acil durum hizmeti almaya devam eder.

2. **İnternetli (Online / Bulut) Modu:**
   - İnternet erişimi sağlandığında, AFAD/Kandilli canlı deprem verileri ve güncel uydu görüntüleri PostGIS katmanlarına otomatik senkronize edilir.

---

### 🛠️ 2.3. Uygulama Adımları (Teknik Görevler)

İlerleyen süreçte PostGIS geçişi başlatıldığında gerçekleştirilecek adımlar:

1. **Sunucu PostGIS Kurulumu:** PostgreSQL 16+ ve PostGIS 3+ eklentilerinin sunucuya kurulması.
2. **Bağımlılıklar:** `GeoAlchemy2`, `psycopg2-binary` ve `SQLAlchemy` kütüphanelerinin eklenmesi.
3. **Veri Katmanı (`QuakeMindBackend/db/`):**
   - `SOSAlertModel`: `GEOMETRY(Point, 4326)` (En yakın SOS ihbarları için `<->` KNN operatörü).
   - `RoadSegmentModel`: `GEOMETRY(LineString, 4326)` (pgRouting ile dinamik engel/hasar maliyetli rotalama).
   - `FaultLineModel`: `GEOMETRY(MultiLineString, 4326)` (Fay hattı mesafe analizleri).
4. **Hibrit Fallback (Yedek Mekanizma):** PostGIS sunucusu kapalı olduğunda sistemin otomatik olarak varsayılan `NetworkX (In-Memory)` moduna geçmesi.
