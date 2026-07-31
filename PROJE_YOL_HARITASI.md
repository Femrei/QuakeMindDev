# QuakeMind - Proje Mimari Yol Haritası ve Planlama

> **Doküman Türü:** Mimari Tasarım ve Yol Haritası (Roadmap)  
> **Durum:** 📌 *Phase 1 Aktif (Çalışıyor) - Phase 2 Geliştirme Notları*

---

## 💬 1. Çift Modlu (Online / Offline P2P) Ekip Mesajlaşma Sistemi

### 🛰️ Çalışma Prensipleri
- **Taktik Sohbet Ekranı (`/command/chat`):** Arama-kurtarma ekiplerinin, komutanların ve saha devriyelerinin anlık haberleşme kanalı.
- **İnternetsiz (Offline Store-and-Forward Mimarisi):**
  - İnternet veya bağlantı olmadığında mesajlar cihaz hafızasında güvenle saklanır.
  - Cihaz bir Hotspot noktasına (`10.42.0.1:8000`) veya yakındaki başka bir P2P Mesh düğümüne bağlandığı an biriken mesajlar arka planda **otomatik senkronize (Sync)** edilir.
- **İnternetli (Online WebSockets / Firebase) Mimarisi:**
  - Canlı sesli not gönderme, anlık konum paylaşımı ve kanal yönetimi (`#sahagenel`, `#acil-sevk`).

---

## 🔐 2. Kayıt Olma (Register) & Kimlik Doğrulama Katmanı

### ⚙️ FastAPI Backend Endpoints
- `POST /api/auth/register`: Kullanıcı Kaydı (Ad Soyad, E-posta, Şifre, Rol [`survivor` | `responder`], Şehir, Telefon).
- `POST /api/auth/login`: E-posta/Şifre doğrulama ve JWT erişim token'ı döndürme.
- `GET /api/auth/me`: Token ile aktif profil çekme.

---

## ⚡ 3. Backend Performans & Hız Optimizasyonları

1. **API Önbellekleme (`lru_cache`):** Fay hatları GeoJSON ve deprem verilerinin RAM'den milisaniyede sunulması.
2. **Async Paralel İşlem:** Harita indirme ve yapay zeka çıkarım adımlarının eşzamanlı çalıştırılması.

---

## 🐘 4. PostGIS & Mekânsal Veritabanı Katmanı (Phase 2)

- PostgreSQL 16 + PostGIS 3 + `pgRouting` entegrasyonu (`pgr_dijkstra` çevrimdışı rota hesabı ve `<->` KNN sorguları).
