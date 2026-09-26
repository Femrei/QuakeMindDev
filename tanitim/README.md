# QuakeMind Tanıtım Sitesi

Tek sayfalık tanıtım sitesi. Astro + Tailwind v4; **sıfır istemci JavaScript'i** üretir,
statik dosyalara derlenir. Hedef kitle: kurum ve karar vericiler, halk; akademik taraf
"Ölçülen sonuçlar" ve "Neyi henüz ölçmedik" bölümlerinde karşılanır.

## Çalıştırma

```bash
npm --prefix tanitim install
npm --prefix tanitim run dev     # http://127.0.0.1:3300
npm --prefix tanitim run build   # dist/ — statik çıktı
```

## Yapı

| Dosya | İçerik |
|---|---|
| `src/icerik/tr.ts` | **Sayfadaki bütün metin.** İkinci dil eklenince yanına `en.ts` yazılır, bileşenler değişmez |
| `src/icerik/tipler.ts` | İçerik sözleşmesi (tip) |
| `src/duzen/Temel.astro` | HTML kabuğu, meta etiketleri |
| `src/bilesenler/` | Marka, üst menü, bölüm iskeleti, altbilgi |
| `src/pages/index.astro` | Bölümlerin dizilişi |
| `src/stil/site.css` | Siteye özel taban stil; token'lar `../../tasarim/token.css`'ten gelir |

## Kurallar

- **Token'lar ortak**: renk, yazı ve köşe değerleri `tasarim/token.css`'te. Konsol ile site
  aynı kaynaktan beslenir; buraya değer kopyalanmaz. Sitenin fazladan üç yazı boyu
  (`display`, `section`, `lead`) da o dosyada tanımlıdır.
- **Her sayının koşulu yazar.** İçerikteki ölçümler `PROJE_DOSYASI.md` §6 ve §9'dan gelir;
  ölçülmemiş iddia sayfaya girmez. "Neyi henüz ölçmedik" bölümü bilerek vardır.
- **Hareket kütüphanesi yok.** Bütün geçişler CSS; `prefers-reduced-motion` gözetilir.
  Kaydırınca beliren öğe, gradyan, cam efekti, neon parlama yok.

## Sıradaki işler

- Ekran görüntüleri ve kısa video (şu an "eklenecek" yazan yerler). Görüntüler gerçek
  veriyle çalışan ekrandan alınacak, senaryo verisi olan yerler etiketlenecek.
- İngilizce içerik dosyası (`src/icerik/en.ts`) ve `/en` yönlendirmesi.
- Yayın yeri kararı (şimdilik depoda durur).
