# QuakeMind Konsol

Yeni komuta konsolu. Vite + React + TypeScript + Tailwind v4, tek kalıcı harita
(MapLibre + deck.gl), tek SSE akışı. Mevcut `quakemind-web/` (Next.js) olduğu gibi durur;
onay verilene kadar ikisi yan yanadır (CLAUDE.md kural 7).

Kaynak belgeler: `../CLAUDE.md` · `../MIMARI.md` · `../ARAYUZ_KARARLARI.md`
Referans prototip: `../prototip/komuta-konsolu/`

## Çalıştırma

```bash
npm --prefix konsol install
npm --prefix konsol run dev      # http://127.0.0.1:3200
```

Geliştirmede `/api/*` istekleri `http://127.0.0.1:8000` adresine (FastAPI) vekillenir.
Başka bir adres için: `QM_API=http://127.0.0.1:8001 npm --prefix konsol run dev`.

> Aynı anda iki backend çalışıyorsa (biri `0.0.0.0:8000`, diğeri `127.0.0.1:8000`)
> istekler ikisi arasında bölünür: bir uçta açılan iş öbür uçta "bilinmeyen kimlik"
> olur. Böyle bir durumda backend'i ayrı bir porta alıp `QM_API` ile göster.

```bash
npm --prefix konsol run build          # dist/ — statik dosyalar, Node sunucusu gerekmez
npm --prefix konsol run kontrol:token  # keyfi değer denetimi (CI bunu koşacak)
```

## Bu iskelette ne var

| Parça | Yer | Not |
|---|---|---|
| Tasarım token'ları | `src/stil/token.css` | **Tek kaynak.** Renk, yazı ölçeği (6 değer), köşe, boşluk. Tailwind'in hazır renk/yazı ölçekleri `initial` ile kapatıldı |
| Giriş + rol yönlendirmesi | `src/kimlik/` | Oturum **sahte**; rol istemciden gelmez, "sunucu" döndürür (kural 5) |
| Kalıcı harita kabuğu | `src/harita/HaritaKabugu.tsx` | Tek MapLibre örneği + deck.gl `MapboxOverlay`; mod değişince yeniden kurulmaz |
| Modlar | `src/modlar/modlar.ts` | Sayfa yok: genel durum · SOS kuyruğu · hasar analizi · kamera tespiti · metin analizi · deprem riski · yol ve rota |
| Kabuk | `src/kabuk/` | Üst çubuk, sol katman paneli, sağ durum paneli, alt zaman şeridi, Ctrl+K paleti |
| Panel kuralı | `src/kabuk/Panel.tsx` | `Amac` → `HazirSecenekler` → `InceAyar` → `SuAn` → `Teknik` (ARAYUZ §9) |
| Zaman aralığı | `src/durum/zamanDurumu.ts` | Varsayılan canlı; şerit geri çekilince geçmiş; oynat yalnız geçmişte |
| Tek canlı akış | `src/canli/canliAkis.ts` | `/api/live`, üstel geri çekilme; **yoklama yok** |
| Sunucu verisi | `src/veri/` | TanStack Query; tazeleme yalnız SSE mesajıyla (`staleTime: Infinity`) |
| Afetzede ekranı | `src/afetzede/` | Ayrı ve hafif; harita motorunu indirmez |

## Bu iskelette ne yok (bilerek)

Uçlar bağlanmadığı için **hiçbir veri üretilmez** (kural 1). Paneller sayı yerine `—` ve
"uç bağlı değil" yazar; örnek/uydurma kayıt konmaz.

Bağlanacak uçlar:

| Uç | Ne döndürecek |
|---|---|
| `GET /api/live` | **Bağlandı** — SSE: `yeni-sos`, `is-durumu`, `yeni-analiz`, `isi-surumu`, `ekip-konumu` |
| `POST /api/road_damage/analyze` | **Bağlandı** — HTTP 202 + iş kimliği; ilerleme canlı akıştan gelir |
| `GET /api/road_damage/wayback_versions` | **Bağlandı** — tarihli uydu arşivi; varsayılan seçim 6 Şubat 2023'ten sonraki ilk görüntü |
| `GET /api/hasar-noktalari?baslangic&bitis` | Ortak sözleşme: konum, skor, güven, zaman, kaynak tipi |
| `GET /api/sos?baslangic&bitis` | Çağrı kuyruğu |
| `GET /api/ekipler` | Saha ekipleri |
| `GET /api/ozet?baslangic&bitis` | KPI sayıları (sunucuda hazır) |
| ısı ızgarası (ikili) | Kanal başına ızgara; karışım tarayıcıda, GPU'da |
| harita karoları | Kendi altlığımız (OSM + Copernicus); şimdilik zemin boş |

Hasar analizi modunda görüntü kaynağı **Esri Wayback** varsayılanıdır ve tarih listesi
uçtan gelir; çalışma alanımız 6 Şubat 2023 olduğu için varsayılan tarih depremden sonraki
ilk kayıttır. Seçilen tarih sonucun künyesine yazılır.

Ayrıca sıradaki işler: gerçek JWT akışı (`src/kimlik/sahteSunucu.ts` silinecek), ısı
`BitmapLayer`'ı, zaman şeridi histogramı, komut paletine çağrı/mahalle araması.

## Kurallar (kısa)

- **Keyfi değer yasak.** `text-[13px]`, `bg-[#0b0f17]`, `p-[7px]` yazılmaz; değer token
  dosyasına eklenir. `npm run kontrol:token` bunu denetler.
- Cam efekti, neon parlama, gradyan zemin, sürekli yanıp sönen öğe yok. Paneller opaktır.
- Kırmızı/turuncu/sarı yalnız hasar ve aciliyet için.
- Her panel kendini anlatır: amaç cümlesi → hazır seçenekler → ince ayar → "şu an ne
  görüyorum" → teknik not.
- Veri yoksa uydurulmaz; eksik olduğu yazılır.
