import { TileLayer } from '@deck.gl/geo-layers'
import { BitmapLayer } from '@deck.gl/layers'
import type { Layer } from '@deck.gl/core'
import { erisimJetonu } from '@/veri/istemci'

/* ---------------------------------------------------------------------------
   Seçilen görüntü kaynağının haritada gösterilmesi.

   Hasar analizi modunda soldan bir görüntü kaynağı (Google / Esri Wayback /
   OpenAerialMap) seçiliyor ama harita yalnız altlığı çiziyordu: kullanıcı
   modelin NE GÖRDÜĞÜNÜ göremiyordu; analiz bitince de çizgiler boşlukta
   duruyordu.

   Katman MAPLIBRE'ye değil DECK'e verilir. Önce maplibre raster kaynağı
   denendi (bağımlılık eklememek için) ve çalışmadı: karolar iniyordu, katman
   stile giriyordu, ekranda hiçbir şey görünmüyordu — altlık ve analiz deck ile
   çizildiği için maplibre katmanı onların altında kalıyor. Deck'in kendi
   TileLayer'ı aynı çizicide, doğru sırada ve aynı görünüm dönüşümüyle çalışır.
--------------------------------------------------------------------------- */

export type GoruntuKarosu = {
  /** Karo adresi; `{z}`, `{x}`, `{y}` yer tutucularıyla. */
  url: string
  /** Kaynak künyesi — ekranda yazılır (kural 1). */
  kunye: string
  /** 0–1; görüntünün altlığı ne kadar örttüğü. */
  ortuculuk?: number
  /** Sahnenin kapsamı [batı, güney, doğu, kuzey]. Verilirse bunun DIŞINDA
      karo İSTENMEZ: drone uçuş izi küçük, harita bir ızgara kadar karo
      istiyor ve çoğu izin dışında kalıp 404 dönüyordu (tek koşuda 342 istek,
      hepsi boşa). İstek hiç yapılmazsa ne ağ trafiği ne konsol gürültüsü olur. */
  kapsam?: [number, number, number, number] | null
}

/** Deck katmanı: altlığın ÜSTÜNDE, analiz çizgilerinin ALTINDA çizilsin diye
    katman listesinin başına konur (`katmanlar.ts` sıralaması). */
function jetonBasligi(): Record<string, string> {
  const j = erisimJetonu()
  return j ? { authorization: `Bearer ${j}` } : {}
}

export function goruntuKatmani(karo: GoruntuKarosu | null, gorunur: boolean): Layer[] {
  if (!karo || !gorunur) return []
  return [
    new TileLayer({
      id: 'analiz-goruntusu',
      data: karo.url,
      // 19 üstü karo çoğu kaynakta yok; ileride son karo büyütülerek gösterilir.
      maxZoom: 19,
      minZoom: 0,
      tileSize: 256,
      ...(karo.kapsam ? { extent: karo.kapsam } : {}),
      opacity: karo.ortuculuk ?? 1,
      // Vekil uç yetki istiyor; deck kendi `fetch`'ini kullandığı için başlık
      // buradan geçer (istemcinin ortak başlık sarmalayıcısını görmez).
      loadOptions: { fetch: { headers: jetonBasligi() } },
      // KAPSAMA DIŞI KARO SESSİZ GEÇER. Drone uçuş izi küçük; harita bir ızgara
      // kadar karo ister ve çoğu izin dışında kalır. Uç bunlara 404 döner
      // (doğru davranış: harita orayı boş bırakır) ama deck her birini konsola
      // hata olarak basıyordu — tek koşuda 342 satır, aralarında GERÇEK hata
      // görünmez oluyordu (ölçüldü, 26 Eylül; J-90 tam da bu gürültünün içinde
      // gözden kaçtı). Kapsama dışı karo `null` döner, gerisi hata olarak kalır.
      getTileData: async (parca) => {
        const { x, y, z } = parca.index
        const adres = karo.url
          .replace('{z}', String(z))
          .replace('{x}', String(x))
          .replace('{y}', String(y))
        const yanit = await fetch(adres, { headers: jetonBasligi(), signal: parca.signal })
        if (yanit.status === 404) return null
        if (!yanit.ok) throw new Error(`Karo alınamadı: HTTP ${yanit.status}`)
        return createImageBitmap(await yanit.blob())
      },
      renderSubLayers: (parcalar) => {
        if (!parcalar.data) return null            // kapsama dışı karo
        const kutu = parcalar.tile.boundingBox as [[number, number], [number, number]]
        return new BitmapLayer({
          id: `${parcalar.id}-resim`,
          image: parcalar.data as ImageBitmap,
          bounds: [kutu[0][0], kutu[0][1], kutu[1][0], kutu[1][1]],
        })
      },
    }) as unknown as Layer,
  ]
}

/** Seçime göre karo adresi — hepsi KENDİ API'mizden geçer.

    Doğrudan kaynağa gidilmiyor: OpenAerialMap ve Esri karo sunucuları
    `Access-Control-Allow-Origin` göndermiyor, deck.gl ise karoyu `fetch` ile
    indirdiği için tarayıcı hepsini CORS kuralıyla engelliyordu (ölçüldü,
    26 Eylül: 12 istek gidiyor, hiçbiri çizilmiyordu). Vekil uç `/api/goruntu/karo`
    yalnız bilinen karo sunucularına gider (SSRF'e kapalı) ve künyeyi korur.

    Kaynak seçili ama görüntü belli değilse `null`: uydurma adres denenmez. */
export function karoAdresi(secim: {
  kaynak: 'google' | 'esri' | 'oam'
  waybackId?: string | null
  waybackTarihi?: string | null
  oamTmsUrl?: string | null
  oamBasligi?: string | null
  oamTarihi?: string | null
}): GoruntuKarosu | null {
  const vekil = (sorgu: string) => `/api/goruntu/karo/{z}/{x}/{y}?${sorgu}`

  if (secim.kaynak === 'google') {
    return { url: vekil('kaynak=google'), kunye: 'Google uydu görüntüsü (güncel)' }
  }
  if (secim.kaynak === 'esri') {
    if (!secim.waybackId) return null
    return {
      url: vekil(`kaynak=esri&surum=${encodeURIComponent(secim.waybackId)}`),
      kunye: `Esri Wayback${secim.waybackTarihi ? ` · sürüm ${secim.waybackTarihi}` : ''}`,
    }
  }
  if (!secim.oamTmsUrl) return null
  // OAM'in `tms` adresi ÇOĞU ZAMAN `{z}/{x}/{y}` yer tutucularını kendisi taşır;
  // körlemesine eklemek adresi ikiye katlıyordu.
  const temel = secim.oamTmsUrl.replace(/\/$/, '')
  const sablon = /\{z\}/.test(temel) ? temel : `${temel}/{z}/{x}/{y}.png`
  return {
    url: vekil(`kaynak=oam&adres=${encodeURIComponent(sablon)}`),
    kunye: `OpenAerialMap${secim.oamBasligi ? ` · ${secim.oamBasligi}` : ''}${
      secim.oamTarihi ? ` · çekim ${secim.oamTarihi.slice(0, 10)}` : ''
    }`,
  }
}
