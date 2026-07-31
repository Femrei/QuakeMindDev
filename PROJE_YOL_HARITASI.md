# QuakeMind - Proje Mimari Yol Haritası ve Planlama

> **Doküman Türü:** Mimari Tasarım ve Yol Haritası (Roadmap)  
> **Durum:** 📌 *Phase 1 Aktif (Çalışıyor) - Phase 2 Geliştirme Notları*

---

## 🧠 1. Geliştirici & Admin MLOps Modülü (Model Registry & Versiyonlama)

### ⚙️ Çalışma Prensipleri & Özellikler
- **Developer Admin Paneli (`/command/admin`):** Yapay zeka mühendislerinin ve sistem yöneticilerinin modelleri yönettiği panel.
- **Eğitim Hiperparametreleri Takibi:** Learning Rate, Batch Size, Loss Fonksiyonları, Epoch sayıları.
- **Başarım Metrikleri Grafikleri (Recharts):** 
  - Segformer: **mIoU %**, **Dice Skoru**, F1-Score.
  - BERTurk NLP: **Accuracy %**, **Macro F1**, **Precision**, **Recall**.
  - CatBoost Risk: **RMSE**, **R² Score**, Feature Importance.
- **Canlı Model Versiyonlama & Değiştirme:** Sunucuyu yeniden başlatmadan önceki sürüm modeller (v1.0, v1.2, v2.1-latest) arasında geçiş yapma (`POST /api/admin/models/activate`).

---

## 💬 2. Çift Modlu (Online / Offline P2P) Ekip Mesajlaşma Sistemi

- **Taktik Sohbet Ekranı (`/command/chat`):** Hotspot (`10.42.0.1:8000`) veya P2P Mesh menzilinde biriken mesajların otomatik senkronizasyonu (Store-and-Forward).

---

## 🔐 3. Kayıt Olma (Register) & Kimlik Doğrulama Katmanı

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` endpoints & Next.js `/register` arayüzü.

---

## ⚡ 4. Backend Performans & Hız Optimizasyonları

- API önbellekleme (`lru_cache`) ve async paralel işlem adımları.

---

## 🐘 5. PostGIS & Mekânsal Veritabanı Katmanı (Phase 2)

- PostgreSQL 16 + PostGIS 3 + `pgRouting` entegrasyonu (`pgr_dijkstra` çevrimdışı rota hesabı ve `<->` KNN sorguları).
