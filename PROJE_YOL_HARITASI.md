# QuakeMind - Proje Mimari Yol Haritası ve Planlama

> **Doküman Türü:** Mimari Tasarım ve Yol Haritası (Roadmap)  
> **Durum:** 📌 *Phase 1 Aktif (Çalışıyor) - Phase 2 Geliştirme Notları*

---

## 🔐 1. Kayıt Olma (Register) & Kimlik Doğrulama Katmanı

### ⚙️ FastAPI Backend Endpoints
- `POST /api/auth/register`: 
  - Gelen Veri: `fullName`, `email`, `password`, `role` (`survivor` | `responder`), `city`, `phone`.
  - İşlem: Şifrenin güvenli hash'lenmesi (`passlib`/`bcrypt`), veritabanına kayıt ve JWT token üretimi.
- `POST /api/auth/login`:
  - E-posta/Şifre doğrulama ve JWT erişim token'ı döndürme.
- `GET /api/auth/me`:
  - Token ile aktif kullanıcı profil bilgilerini getirme.

### 🖥️ Next.js Frontend Entegrasyonu
- **`/register` Sayfası:** Rol seçimi (`Afetzede` veya `Arama-Kurtarma Ekibi`), Telefon Numarası, Şehir ve Şifre içeren modern Shadcn UI kayıt formu.
- **`/login` Sayfası:** Kayıt olma sayfasına bağlantı ve JWT / Firebase Auth entegrasyonu.

---

## ⚡ 2. Backend Performans & Hız Optimizasyonları

1. **API Önbellekleme (`lru_cache`):** Sık çağrılan fay hatları GeoJSON ve tarihsel deprem verilerinin RAM'den anında sunulması.
2. **Async Paralel İşlem:** Harita indirme ve yapay zeka model tahmini adımlarının eşzamanlı çalıştırılması.

---

## 🐘 3. PostGIS & Mekânsal Veritabanı Katmanı (Phase 2)

- PostgreSQL 16 + PostGIS 3 + `pgRouting` entegrasyonu.
- `pgr_dijkstra` ile milisaniyelik çevrimdışı rota hesabı ve `<->` KNN en yakın SOS sorguları.
