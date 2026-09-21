import { ScatterplotLayer, PathLayer, PolygonLayer, BitmapLayer } from '@deck.gl/layers'
import type { Layer } from '@deck.gl/core'
import type { KatmanId } from '@/durum/konsolDurumu'
import type { Ekip, HasarNoktasi, SosCagrisi } from '@/veri/sorgular'
import type { Kutu, Nokta } from '@/durum/secimDurumu'
import type { Yol } from '@/veri/analiz'

/* Veri katmanları altlıktan belirgin şekilde ayrılır: altlık soğuk ve sönük,
   veri sıcak ve doygun (ARAYUZ §11). Hasar renkleri haritada ve panelde aynıdır. */

const ONCELIK_RENK: Record<SosCagrisi['oncelik'], [number, number, number, number]> = {
  kritik: [255, 92, 92, 240],
  yuksek: [255, 145, 82, 235],
  orta: [242, 193, 78, 225],
}

const KAYNAK_RENK: Record<HasarNoktasi['kaynak'], [number, number, number, number]> = {
  uydu: [69, 200, 224, 220],
  sos: [255, 92, 92, 220],
  kamera: [242, 193, 78, 220],
  metin: [176, 140, 255, 220],
}

export type KatmanGirdisi = {
  katmanlar: Record<KatmanId, boolean>
  hasar: HasarNoktasi[]
  sos: SosCagrisi[]
  ekipler: Ekip[]
  seciliSos: string | null
  /** Bitmiş hasar analizinin yol geometrisi. */
  analiz?: { kapali: Yol[]; acik: Yol[] } | null
  /** Kanalların ağırlıklı karışımından çıkan ısı dokusu. */
  isi?: { goruntu: ImageData; sinirlar: [number, number, number, number] } | null
  /** Analiz alanı seçimi: kesinleşmiş şekil ve çizim sürerken taslak. */
  secim?: {
    kutu: Kutu | null
    cokgen: Nokta[] | null
    taslak: { kutu?: Kutu; nokta?: Nokta[] } | null
  }
}

function kutuHalkasi(k: Kutu): Nokta[] {
  return [
    [k[0], k[1]],
    [k[2], k[1]],
    [k[2], k[3]],
    [k[0], k[3]],
  ]
}

export function katmanlariKur(g: KatmanGirdisi): Layer[] {
  const L: Layer[] = []

  // Isı haritası: kanal ızgaraları sunucudan gelir, karışım istemcide yapılır
  // ve doku olarak çizilir. İkinci bir bulanıklaştırma YOK (MIMARI §5).
  if (g.katmanlar.isi && g.isi) {
    L.push(
      new BitmapLayer({
        id: 'isi',
        image: g.isi.goruntu,
        bounds: g.isi.sinirlar,
        opacity: 0.72,
        textureParameters: { minFilter: 'linear', magFilter: 'linear' },
      }),
    )
  }


  // Analiz sonucu: önce açık yollar (sönük), sonra kapalı olanlar (kırmızı),
  // böylece kapalı segmentler her zaman üstte kalır.
  if (g.katmanlar.analizSonucu && g.analiz) {
    L.push(
      new PathLayer<Yol>({
        id: 'analiz-acik',
        data: g.analiz.acik,
        getPath: (d) => d,
        getColor: [92, 104, 126, 150],
        getWidth: 2,
        widthUnits: 'pixels',
        widthMinPixels: 1,
        capRounded: true,
        jointRounded: true,
      }),
    )
    L.push(
      new PathLayer<Yol>({
        id: 'analiz-kapali',
        data: g.analiz.kapali,
        getPath: (d) => d,
        // Kapalı yol = kritik durum rengi; panelde de aynı kırmızı kullanılır.
        getColor: [255, 92, 92, 255],
        getWidth: 5,
        widthUnits: 'pixels',
        widthMinPixels: 3,
        capRounded: true,
        jointRounded: true,
        pickable: true,
      }),
    )
  }

  if (g.katmanlar.hasarliYollar) {
    L.push(
      new PathLayer<{ path: [number, number][]; derece: number }>({
        id: 'hasarli-yollar',
        data: [],
        getPath: (d) => d.path,
        getColor: [255, 145, 82, 255],
        getWidth: 4,
        widthUnits: 'pixels',
        widthMinPixels: 2.5,
        capRounded: true,
        pickable: true,
      }),
    )
  }

  if (g.katmanlar.yapilar) {
    L.push(
      new ScatterplotLayer<HasarNoktasi>({
        id: 'hasar-noktalari',
        data: g.hasar,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: (d) => 18 + d.skor * 22,
        radiusUnits: 'meters',
        radiusMinPixels: 2.5,
        radiusMaxPixels: 12,
        getFillColor: (d) => KAYNAK_RENK[d.kaynak],
        pickable: true,
      }),
    )
  }

  if (g.katmanlar.ekipler) {
    L.push(
      new ScatterplotLayer<Ekip>({
        id: 'ekipler',
        data: g.ekipler,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: 30,
        radiusMinPixels: 4,
        radiusMaxPixels: 10,
        getFillColor: [69, 200, 224, 235],
        stroked: true,
        lineWidthMinPixels: 1.4,
        getLineColor: [8, 12, 18, 255],
        pickable: true,
      }),
    )
  }

  L.push(
    new ScatterplotLayer<SosCagrisi>({
      id: 'sos',
      data: g.sos,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => (g.seciliSos === d.id ? 52 : 34),
      radiusUnits: 'meters',
      radiusMinPixels: 4.5,
      radiusMaxPixels: 14,
      getFillColor: (d) => ONCELIK_RENK[d.oncelik],
      stroked: true,
      lineWidthMinPixels: 1.6,
      getLineColor: (d) => (g.seciliSos === d.id ? [232, 236, 244, 255] : [10, 14, 20, 220]),
      updateTriggers: { getRadius: g.seciliSos, getLineColor: g.seciliSos },
      pickable: true,
    }),
  )

  // Seçim şekilleri en üstte: veri katmanlarını gizlemesin diye içi çok soluk,
  // kenarı vurgu renginde.
  const secim = g.secim
  if (secim) {
    const taslakHalka = secim.taslak?.kutu
      ? kutuHalkasi(secim.taslak.kutu)
      : (secim.taslak?.nokta ?? null)
    const kesinHalka = secim.cokgen ?? (secim.kutu ? kutuHalkasi(secim.kutu) : null)
    const halka = taslakHalka ?? kesinHalka

    if (halka && halka.length >= 2) {
      L.push(
        new PolygonLayer<{ halka: Nokta[] }>({
          id: 'secim-alani',
          data: [{ halka }],
          getPolygon: (d) => d.halka,
          filled: true,
          stroked: true,
          getFillColor: [69, 200, 224, 26],
          getLineColor: [69, 200, 224, 235],
          getLineWidth: 2,
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 2,
        }),
      )
      L.push(
        new ScatterplotLayer<Nokta>({
          id: 'secim-koseleri',
          data: halka,
          getPosition: (d) => d,
          getRadius: 4,
          radiusUnits: 'pixels',
          getFillColor: [232, 236, 244, 255],
          stroked: true,
          lineWidthMinPixels: 1.5,
          getLineColor: [27, 108, 126, 255],
        }),
      )
    }
  }

  return L
}
