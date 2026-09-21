# QuakeMind — Arayüz ve Tasarım Kararları

Bu belge yeni konsolun tasarım sistemidir: token'lar, tipografi, bileşenler, hareket,
düzen ve panel kuralları. Mimari `MIMARI.md`'de, genel kurallar `CLAUDE.md`'de.

Son güncelleme: 20 Eylül 2026 · Prototip: `prototip/komuta-konsolu/`

---

## 1. Hedef ve referanslar

Hedef: modern, hızlı, kendine ait görünen bir **operasyon konsolu**. Şablon gibi durmayacak.

Referanslar: **Linear'ın uygulaması** (tanıtım sayfası değil) — sıkı düzen, klavyeyle hızlı
kullanım, ölçülü hareket. **Zoom Earth** — harita öncelikli düzen, zaman şeridi, koyu zemin
üzerinde veri.

Yöntem: referansın hesaplanmış stilleri (yazı tipi, renk, boşluk) tarayıcıdan okunur ve
token'a çevrilir. Göz kararı değer girilmez.

**Ders (ölçülmüş):** `cvo.com.tr` tanıtım sitesinde hiçbir animasyon kütüphanesi
kullanılmıyor — bütün hareket CSS ile yapılmış, her animasyonun "hareketi azalt" koruması
var. Göz alıcılık yığından değil işçilikten geliyor.

## 2. "Yapay zekâ yapmış" görüntüsü — ölçülen imza ve yasak listesi

Mevcut `quakemind-web`'de sayılan imza: 139 keyfi piksel yazı boyutu, cam efekti ve neon
parlama sınıfları, 22 gradyan, 18 sürekli yanıp sönen öğe, tanımlı olmayan yazı tipi
(Windows'ta Segoe UI'ye düşüyor), Tailwind'in hazır renkleri (`#3B82F6`, `#EF4444`, …).

Yasak:

- Gradyanlı yazı ve zemin, neon parlama (`glow-*`), cam efekti (`backdrop-blur`)
- Sürekli yanıp sönen öğe (nabız yalnız yeni ve kritik olayda, bir kez)
- Emoji, gökkuşağı renk skalası, hazır kütüphane renkleri
- Keyfi değer: `text-[13px]`, `bg-[#0b0f17]`, `p-[7px]` — CI bunu kontrol eder
- Haritanın üstünde bulanık panel: harita her kıpırdadığında arkası yeniden bulanıklaştırılır,
  zayıf ekran kartında kare düşürür. Paneller opaktır.

Token'lar tek dosyada durur: **`tasarim/token.css`**. Hem komuta konsolu (`konsol/`)
hem tanıtım sitesi (`tanitim/`) oradan beslenir; değer kopyalanmaz.

## 3. Renk token'ları (koyu tema — tek tema)

| Token | Değer | Kullanım |
|---|---|---|
| `--ground` | `#080A0E` | uygulama zemini, harita altı |
| `--panel` | `#0F131A` | paneller, üst çubuk |
| `--raised` | `#151A23` | seçili satır, açılır kutu |
| `--hover` | `#1C222D` | üzerine gelme |
| `--line` | `#1E2430` | ayırıcı çizgi |
| `--line-2` | `#2A3241` | kenarlık, belirgin ayırıcı |
| `--ink` | `#E8ECF4` | ana metin |
| `--ink-2` | `#A6B0C4` | ikincil metin, etiket |
| `--ink-3` | `#7E8AA0` | üçüncül metin, kaynak notu (küçük metinde alt sınır) |
| `--accent` | `#45C8E0` | vurgu, seçili durum, bağlantı |
| `--accent-deep` | `#1B6C7E` | vurgu zemini |
| `--accent-soft` | `rgba(69,200,224,.12)` | seçili arka plan |

**Durum renkleri** (yalnız hasar ve aciliyet için): kritik `#FF5C5C` · yüksek `#FF9152` ·
orta `#F2C14E` · iyi `#4ED08B`.

**Isı skalası** (algısal, koyu zemine göre): `#10131A → #2B0B4D → #7B2382 → #C43F66 →
#F0733F → #FCD968`. Kırmızı-yeşil kullanılmaz.

**Kanal renkleri:** uydu `#45C8E0` · SOS `#FF5C5C` · kamera `#F2C14E` · metin `#B08CFF`.
Renk tek başına ayırt edici sayılmaz; her kanalın ayrıca adı ve sayısı yazılır.

**Harita renkleri:** otoyol `#5C687E` · birinci derece `#465165` · ikinci derece `#343E4E` ·
yerel yol `#28303D` · patika `#222934` · su `#123641` · hasarsız yapı `#1A202A`.
Hasar dereceleri durum renklerini kullanır.

Vurgu rengi kararı: camgöbeği varsayılan. Alternatifler prototipte karşılaştırılabiliyor
(çivit `#8C93FF`, nötr `#DCE3F0`). **Nihai seçim ürün sahibinde.**

## 4. Tipografi

Aileler: **IBM Plex Sans** (arayüz) · **IBM Plex Sans Condensed** (büyük sayılar, kısa
etiketler) · **IBM Plex Mono** (koordinat, saat, kimlik, tablo sayıları).
Gerekçe: teknik ve ciddi durur, Türkçe karakterlerin tamamı var, mono kardeşi mevcut ve
Inter/Geist gibi yapay zekâ araçlarının varsayılanı değil. Alternatifler prototipte:
Instrument Sans + JetBrains Mono, Geist + Geist Mono. **Nihai seçim ürün sahibinde.**

Ölçek — **yalnız bu altı değer** kullanılır:

| Rol | Boyut / ağırlık |
|---|---|
| micro (bölüm etiketi, büyük harf, ls .07em) | 11 / 600 |
| small (kaynak notu, yardım metni) | 12 / 400 |
| body (arayüz metni, liste) | 13 / 400 |
| subtitle (panel başlığı) | 15 / 500 |
| title (mod başlığı) | 20 / 500 |
| metric (KPI sayısı, Condensed) | 30 / 600 |

Kurallar: sayılar her yerde eşit genişlikte (`font-variant-numeric: tabular-nums`);
büyük harf yalnız micro rolünde; iki ağırlık yeter (400, 500/600).
Prototipte birkaç yerde 10,5 / 11,5 / 12,5 kullanıldı — gerçek uygulamada bu altı değere
kilitlenecek.

## 5. Boşluk, köşe, kenarlık

- 4 px ızgara. Panel iç dolgusu 12–14 px, bölüm arası 12 px, satır arası 6–8 px.
- Köşe yarıçapı üç değer: 10 px (panel), 6 px (kontrol), 4 px (rozet).
- Yükseltme gölgeyle değil, zemin ve kenarlıkla anlatılır. Gölge yalnız üstte duran
  katmanda (komut paleti, bildirim).
- Kardeş kartların iç satırları hizalanır (`subgrid`); grid yalnız yüksekliği eşitler.

## 6. Bileşenler ve kütüphaneler

| İş | Seçim |
|---|---|
| Stil | Tailwind v4, `@theme` token'ları |
| Bileşen iskeleti | Radix (shadcn'den kaynak olarak alınır, görünüm bizim token'larımızla) |
| Harita | MapLibre GL JS + deck.gl |
| Grafik | `d3-scale` / `d3-shape` + kendi React bileşenlerimiz (hazır kütüphane görüntüsü yok) |
| Tablo | TanStack Table + TanStack Virtual |
| Komut paleti | cmdk (Ctrl K) |
| Bildirim | Sonner |
| İkon | Phosphor |
| Hareket | Önce CSS; gerekirse Motion yalnız yerleşim animasyonu için |

## 7. Hareket kuralları

- Süre 120–240 ms, çıkışta yumuşama (ease-out).
- Yalnız `transform` ve `opacity` animasyonu (GPU'da).
- Her animasyonun bir sebebi olur: yeni veri, durum değişikliği, mekânsal süreklilik.
  Dekoratif hareket yok, kaydırınca beliren öğe yok.
- `prefers-reduced-motion` her animasyonda gözetilir.
- Haritada seçim: `flyTo` ile 700–1100 ms; yeni kritik olay: bir kez halka dalgası.

## 8. Düzen

Tam ekran harita zemindir; üstünde opak paneller durur:

```
┌──────────────────────────────────────────────────────────────┐
│ üst çubuk: marka · modlar · arama (Ctrl K) · canlı · görünüm │
├───────────┬──────────────────────────────────┬───────────────┤
│ katmanlar │        harita (tek örnek)        │  durum /      │
│ ve        │                                  │  inceleme     │
│ filtreler │                                  │               │
├───────────┴──────────────────────────────────┴───────────────┤
│ zaman aralığı: histogram + pencere + hazır aralıklar         │
└──────────────────────────────────────────────────────────────┘
```

- Sayfalar yerine **modlar**: genel durum · SOS · yol ve rota · hasar analizi · metin · risk.
  Mod değişince harita yerinde kalır, paneller ve katmanlar değişir.
- Dar ekranda (≤ 980 px) harita üstte, paneller altında dikey sıralanır.
- Afetzede ekranı ayrıdır ve hafiftir: rota ve toplanma alanı; analiz ekranları yüklenmez.

## 9. Panel kuralı — her panel kendini anlatır

Bu kural iki kez ihlal edildiği için yazıldı (ısı kanalları ve zaman şeridi prototipte
"ne işe yarıyor?" sorusunu aldı).

Her panel şu sırayla kurulur:

1. **Tek cümlelik amaç.** Panel hangi soruyu cevaplıyor?
2. **Hazır seçenekler.** Gerçek iş sorularını temsil eden 3–5 düğme.
   Örnek (ısı): "Genel durum" · "Yalnız çağrılar" · "Sessiz bölgeler".
   Örnek (zaman): "Canlı" · "İlk 6 saat" · "İlk gün" · "İlk 3 gün" · "Tümü".
3. **İnce ayar en altta.** Kaydırıcı ve anahtarlar hazır seçeneklerin altında durur.
4. **Şu an ne görüyorum cümlesi.** Seçim değişince güncellenen tek satır.
5. **Teknik not varsa "Teknik:" diye işaretlenir** ve en alta iner.

Sayılar birimiyle yazılır ("394 nokta"), ham sayı bırakılmaz.

## 10. Canlı mod davranışı (kesin)

- Varsayılan **canlı**: zaman penceresi şimdiye kilitli, saatle birlikte kayar
  (varsayılan pencere: son 6 saat).
- Zaman şeridi her zaman durur; kullanıcı şeridi geri çekince mod **geçmişe** düşer:
  üstteki rozet "Geçmiş" olur, nokta griye döner, "Canlıya dön" düğmesi belirir.
- Oynat düğmesi yalnız geçmiş modunda çalışır.
- Canlı modda yeni çağrı geldiğinde: haritada bir kez halka, köşede bildirim, kuyruğa
  ekleme, sayıların güncellenmesi. Bildirim kendiliğinden kapanır.
- Zaman penceresi **her şeyi** süzer: harita katmanları, ısı haritasının çağrı kanalı,
  sayılar ve listeler. Aralık dışında kalan kayıt varsa panel bunu yazar.

## 11. Harita stili

- Altlık kendi verimizden çizilir; hazır karo servisine bağımlılık yok.
- Yol hiyerarşisi renk ve kalınlıkla verilir (bkz. bölüm 3), etiket az ve seçilidir.
- Veri katmanları altlıktan belirgin şekilde ayrılır: altlık soğuk ve sönük, veri sıcak ve
  doygun.
- Ölçek çubuğu ve kaynak künyesi her zaman ekranda durur.
- Hasar renkleri haritada ve panelde **aynıdır**; aynı olgu iki yerde farklı renkle gösterilmez.

## 12. Okunabilirlik

- Küçük metinde en düşük renk `--ink-3`; daha sönük gri kullanılmaz.
- Taban yazı boyutu 11 px; altına inilmez.
- Klavye odağı her zaman görünür.
- Renk tek başına anlam taşımaz: her durum renginin yanında ad veya sayı bulunur.

## 13. Prototip: ne kanıtladı, ne kanıtlamadı

Prototip `prototip/komuta-konsolu/` altında, yayın bağlantısı klasörün `README.md`'sinde.

Kanıtladı: bu düzen ve etkileşimler gerçek veriyle çalışıyor (Copernicus EMSR648 Antakya:
4.545 yol, 3.686 yapı, 73 hasarlı yol; 492 gerçek deprem; GEM fayları; 90 AFAD toplanma
alanı). Kanal ızgaraları bir kez hesaplanıp ekran kartında karışıyor; dış karo servisi
kullanılmadan harita çiziliyor; canlı mod ve zaman penceresi bütün katmanları süzüyor.

Kanıtlamadı: il ölçeğinde performans, çok kullanıcılı davranış, gerçek SSE akışı ve gerçek
kimlik akışı. Bunlar `MIMARI.md` bölüm 10'daki ölçümlerle kapatılacak.
