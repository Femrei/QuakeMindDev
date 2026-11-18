import { useEffect, useMemo, useRef } from 'react'
import maplibregl, { type Map as MlMap } from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers'
import type { Layer } from '@deck.gl/core'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@/stil/harita.css'
import { haritaStili } from '@/harita/haritaStili'
import { altlikKatmanlari } from '@/harita/katmanlar'
import { tokenRenk } from '@/harita/tokenRenk'
import { YAPI_EN_AZ_ZOOM } from '@/harita/altlikGorunumu'
import type { KatmanId } from '@/durum/konsolDurumu'
import type { Kutu } from '@/durum/secimDurumu'
import { kutularKesisir, useAltlikKatalogu, useAltlikPaketleri } from '@/veri/altlik'
import { useKapanmalar, type Kapanma } from '@/veri/katman'
import { sayi } from '@/lib/bicim'

/* ---------------------------------------------------------------------------
   Görev haritası (J-162): saha ekibinin telefonunda ekip → olay rotası.

   Rota sunucuda kapanmalardan kaçınarak hesaplanıyor (arac_rotasi.py) ama
   ekip ekranı yalnız mesafe ve süreyi yazıyordu. "Telefonun haritasında aç"
   telefonun kendi haritasını açar; o harita bizim kapanmalarımızı bilmez ve
   ekibi kapalı sokağa sokabilir. Bu harita rotayı, kapalı yolları, ekibi ve
   olayı aynı yerde gösterir.

   Ağırlık: bu dosya ayrı yüklenir (React.lazy). Görev ekranı harita motorunu
   yalnız "Haritada göster"e basılınca indirir; telefon açılışı hafif kalır.
   Altlık konsoldakiyle aynı: kendi OSM paketlerimiz, dış karo servisi yok.
--------------------------------------------------------------------------- */

type LonLat = [number, number]

/** Yalnız altlık için gereken katman anahtarları (konsolun katman menüsü yok). */
const ALTLIK_ANAHTARLARI = new Proxy({} as Record<KatmanId, boolean>, {
  get: (_h, ad) => ad === 'yollar' || ad === 'yapilar',
})

function sinirKutusu(noktalar: LonLat[], payKm = 0.25): Kutu | null {
  if (!noktalar.length) return null
  let [b, g, d, k] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const [lon, lat] of noktalar) {
    b = Math.min(b, lon)
    g = Math.min(g, lat)
    d = Math.max(d, lon)
    k = Math.max(k, lat)
  }
  const dLat = payKm / 111
  const dLon = payKm / (111 * Math.max(Math.cos((((g + k) / 2) * Math.PI) / 180), 0.2))
  return [b - dLon, g - dLat, d + dLon, k + dLat]
}

export default function GorevHaritasi({
  rota,
  ekip,
  olay,
}: {
  rota: LonLat[] | null | undefined
  ekip: LonLat | null
  olay: LonLat
}) {
  const kap = useRef<HTMLDivElement>(null)
  const harita = useRef<MlMap | null>(null)
  const ortu = useRef<MapboxOverlay | null>(null)
  const zoomRef = useRef(14)

  const noktalar = useMemo<LonLat[]>(
    () => [...(rota ?? []), ...(ekip ? [ekip] : []), olay],
    [rota, ekip, olay],
  )
  const kutu = useMemo(() => sinirKutusu(noktalar), [noktalar])

  // Altlık: yalnız rotanın geçtiği bölgelerin paketleri iner.
  const katalog = useAltlikKatalogu()
  // Operasyon bölgesi (ayrıntılı paket) varsa yalnız o iner; yoksa il altlığı.
  // Hepsi birden inseydi telefonda gereksiz megabaytlar inerdi.
  const bolgeler = useMemo(() => {
    if (!kutu) return []
    const kesisen = (katalog.data ?? []).filter((b) => kutularKesisir(b.kutu, kutu))
    const operasyon = kesisen.filter((b) => (b.tur ?? 'operasyon') === 'operasyon')
    return operasyon.length ? operasyon : kesisen.slice(0, 1)
  }, [katalog.data, kutu])
  const paketler = useAltlikPaketleri(bolgeler)
  const kapanmalar = useKapanmalar(true)
  const yakinKapanmalar = useMemo(() => {
    if (!kutu) return []
    return (kapanmalar.data?.kayitlar ?? []).filter(
      (x: Kapanma) => x.lon >= kutu[0] && x.lon <= kutu[2] && x.lat >= kutu[1] && x.lat <= kutu[3],
    )
  }, [kapanmalar.data, kutu])

  // Harita bir kez kurulur.
  useEffect(() => {
    if (!kap.current) return
    const m = new maplibregl.Map({
      container: kap.current,
      style: haritaStili(),
      center: olay,
      zoom: 14,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    })
    m.touchZoomRotate.disableRotation()
    const o = new MapboxOverlay({ interleaved: false, layers: [] })
    m.addControl(o)
    m.on('zoomend', () => {
      zoomRef.current = m.getZoom()
    })
    harita.current = m
    ortu.current = o
    return () => {
      m.remove()
      harita.current = null
      ortu.current = null
    }
    // olay değişse de harita yeniden kurulmaz; aşağıdaki etki uçar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rotanın tamamı görünsün.
  useEffect(() => {
    const m = harita.current
    if (!m || !kutu) return
    m.fitBounds(
      [
        [kutu[0], kutu[1]],
        [kutu[2], kutu[3]],
      ],
      { padding: 24, duration: 0, maxZoom: 17 },
    )
    zoomRef.current = m.getZoom()
  }, [kutu])

  useEffect(() => {
    const o = ortu.current
    if (!o) return
    const L: Layer[] = [
      ...altlikKatmanlari(paketler, ALTLIK_ANAHTARLARI, zoomRef.current >= YAPI_EN_AZ_ZOOM),
    ]
    const cizgili = yakinKapanmalar.filter((d) => (d.cizgi?.length ?? 0) >= 2)
    const noktali = yakinKapanmalar.filter((d) => (d.cizgi?.length ?? 0) < 2)
    if (cizgili.length) {
      L.push(
        new PathLayer<Kapanma>({
          id: 'gorev-kapanma-cizgi',
          data: cizgili,
          getPath: (d) => (d.cizgi ?? []).map(([enlem, boylam]) => [boylam, enlem] as LonLat),
          getColor: [...tokenRenk('--color-crit'), 235],
          getWidth: 4,
          widthUnits: 'pixels',
          capRounded: true,
        }),
      )
    }
    if (noktali.length) {
      L.push(
        new ScatterplotLayer<Kapanma>({
          id: 'gorev-kapanma-nokta',
          data: noktali,
          getPosition: (d) => [d.lon, d.lat],
          getRadius: 5,
          radiusUnits: 'pixels',
          getFillColor: [...tokenRenk('--color-crit'), 235],
        }),
      )
    }
    if (rota && rota.length >= 2) {
      L.push(
        new PathLayer<{ yol: LonLat[] }>({
          id: 'gorev-rota-zemin',
          data: [{ yol: rota }],
          getPath: (d) => d.yol,
          getColor: [...tokenRenk('--color-ground'), 255],
          getWidth: 9,
          widthUnits: 'pixels',
          capRounded: true,
          jointRounded: true,
        }),
        new PathLayer<{ yol: LonLat[] }>({
          id: 'gorev-rota',
          data: [{ yol: rota }],
          getPath: (d) => d.yol,
          getColor: [...tokenRenk('--color-accent'), 255],
          getWidth: 5,
          widthUnits: 'pixels',
          capRounded: true,
          jointRounded: true,
        }),
      )
    }
    L.push(
      new ScatterplotLayer<{ p: LonLat; tur: 'ekip' | 'olay' }>({
        id: 'gorev-uclar',
        data: [...(ekip ? [{ p: ekip, tur: 'ekip' as const }] : []), { p: olay, tur: 'olay' as const }],
        getPosition: (d) => d.p,
        getRadius: (d) => (d.tur === 'olay' ? 9 : 7),
        radiusUnits: 'pixels',
        getFillColor: (d) =>
          d.tur === 'olay' ? [...tokenRenk('--color-crit'), 255] : [...tokenRenk('--color-accent'), 255],
        stroked: true,
        getLineColor: [...tokenRenk('--color-ink'), 255],
        lineWidthUnits: 'pixels',
        getLineWidth: 2,
      }),
    )
    o.setProps({ layers: L })
  }, [paketler, yakinKapanmalar, rota, ekip, olay])

  const altlikYok = !katalog.isPending && bolgeler.length === 0

  return (
    <div className="mt-2">
      <div
        ref={kap}
        role="img"
        aria-label="Görev haritası: ekipten olaya rota ve kapalı yollar"
        className="h-72 w-full overflow-hidden rounded-control border border-line-2 bg-ground"
      />
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-small text-ink-2">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-1 w-4 rounded-badge bg-accent" />
          Rota (kapanmalardan kaçınır)
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-1 w-4 rounded-badge bg-crit" />
          Kapalı yol{yakinKapanmalar.length ? ` · ${sayi(yakinKapanmalar.length)}` : ''}
        </li>
        {ekip && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent" />
            Ekip
          </li>
        )}
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-crit" />
          Olay
        </li>
      </ul>
      <p className="mt-1 text-small text-ink-3">
        {!rota || rota.length < 2
          ? ekip
            ? 'Rota çizgisi yok: ekip ya da olay yol ağının dışında; yalnız konumlar gösteriliyor.'
            : 'Rota çizmek için konumunu paylaş.'
          : 'Rota ekibin son paylaşılan konumundan çizilir.'}{' '}
        {altlikYok ? 'Bu bölgenin altlığı yok; yalnız rota ve noktalar çiziliyor. ' : ''}
        Altlık: © OpenStreetMap katkıcıları. Kapalı yollar: uydu ve drone analizleri.
      </p>
    </div>
  )
}
