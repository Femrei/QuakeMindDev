import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type Map as MlMap } from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import type { Layer } from '@deck.gl/core'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@/stil/harita.css'
import { ANTAKYA, haritaStili } from './haritaStili'

/* ---------------------------------------------------------------------------
   TEK harita örneği (MIMARI §7, CLAUDE.md kural 6).
   Harita uygulama iskeletinde bir kez kurulur; mod değişince yeniden kurulmaz.
   Bileşenler katmanlarını `useHarita().katmanlariYaz()` ile verir.
--------------------------------------------------------------------------- */

type HaritaApi = {
  hazir: boolean
  katmanlariYaz: (katmanlar: Layer[]) => void
  ucus: (lon: number, lat: number, zoom?: number) => void
  haritaAl: () => MlMap | null
}

const Baglam = createContext<HaritaApi | null>(null)

export function useHarita(): HaritaApi {
  const api = useContext(Baglam)
  if (!api) throw new Error('useHarita, HaritaKabugu içinde çağrılmalı.')
  return api
}

export function HaritaKabugu({ children }: { children: React.ReactNode }) {
  const kutu = useRef<HTMLDivElement>(null)
  const harita = useRef<MlMap | null>(null)
  const ortu = useRef<MapboxOverlay | null>(null)
  const [hazir, setHazir] = useState(false)

  useEffect(() => {
    if (!kutu.current || harita.current) return

    const m = new maplibregl.Map({
      container: kutu.current,
      style: haritaStili(),
      center: [ANTAKYA.lon, ANTAKYA.lat],
      zoom: ANTAKYA.zoom,
      pitch: 0,
      bearing: 0,
      dragRotate: false,
      attributionControl: false,
      // Kaynak künyesi ve ölçek ekranda ayrıca duruyor (ARAYUZ §11).
    })
    m.touchZoomRotate.disableRotation()
    m.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 96 }), 'bottom-right')

    const o = new MapboxOverlay({ interleaved: false, layers: [] })
    m.addControl(o)

    harita.current = m
    ortu.current = o
    m.on('load', () => setHazir(true))

    return () => {
      setHazir(false)
      ortu.current = null
      harita.current = null
      m.remove()
    }
  }, [])

  const api = useMemo<HaritaApi>(
    () => ({
      hazir,
      katmanlariYaz: (katmanlar) => ortu.current?.setProps({ layers: katmanlar }),
      ucus: (lon, lat, zoom = 15) => {
        const azalt = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        harita.current?.flyTo({
          center: [lon, lat],
          zoom,
          duration: azalt ? 0 : 900, // seçimde 700-1100 ms (ARAYUZ §7)
        })
      },
      haritaAl: () => harita.current,
    }),
    [hazir],
  )

  return (
    <Baglam.Provider value={api}>
      {/* Dar ekranda harita üstte durur; geniş ekranda paneller haritanın üstüne biner.
          Yerleşim sınıfları DIŞ kutuda: MapLibre kendi kabına `position: relative`
          yazıyor ve doğrudan verilen `absolute` sınıfını eziyor. */}
      <div className="h-72 w-full shrink-0 genis:absolute genis:inset-0 genis:h-auto">
        <div ref={kutu} className="h-full w-full" aria-label="Durum haritası" role="application" />
      </div>
      {children}
    </Baglam.Provider>
  )
}
