import { Crosshair } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef } from 'react'
import { HaritaKabugu, useHarita } from '@/harita/HaritaKabugu'
import { useAltlikGirdisi } from '@/harita/altlikGorunumu'
import type { SosCagrisi } from '@/veri/sorgular'
import { afetzedeIpucu, afetzedeKatmanlari, type HaritaKonumu } from './haritaKatmanlari'
import type { YakinYer } from './veri'

/* ---------------------------------------------------------------------------
   Afetzede haritası (J-50): "Nereye gidebilirim?" kartının yanında, küçük.
   Tembel yüklenir; SOS ve liste harita motoru inmeden çalışır (MIMARI §7).
   Konsolun harita kabuğunu ve kendi altlığımızı kullanır; dış karo servisi
   yok (ARAYUZ §11).
--------------------------------------------------------------------------- */

export type AfetzedeHaritasiProps = {
  konum: HaritaKonumu | null
  /** Seçili türün yerleri (sunucudan, uzaklığa göre). */
  yerler: YakinYer[]
  secili: YakinYer | null
  sec: (y: YakinYer) => void
  cagrilar: SosCagrisi[]
  rota: [number, number][] | null
}

export default function AfetzedeHaritasi(p: AfetzedeHaritasiProps) {
  const baslangic = p.konum ? { lon: p.konum.lon, lat: p.konum.lat, zoom: 15 } : undefined
  return (
    <div className="relative h-full w-full">
      {/* isolate: harita kendi katman bağlamında kalır. Yoksa deck.gl tuvali
          (z-index'li) "Konumuma dön" düğmesinin üstüne boyanıyor, sokak adları
          düğmeyi örtüyordu (J-51, kullanıcı). */}
      <HaritaKabugu className="absolute inset-0 isolate" ipucu={afetzedeIpucu} baslangic={baslangic}>
        <Kopru {...p} />
        <Ustyazi {...p} />
      </HaritaKabugu>
    </div>
  )
}

/** Veri → katmanlar; seçim ve konum değişince harita oraya uçar. */
function Kopru(p: AfetzedeHaritasiProps) {
  const { hazir, katmanlariYaz, tiklamaYaz, ucus, haritaAl } = useHarita()
  const { altlik, altlikYapiGorunur, bolgeAdlari, adSeviyesi } = useAltlikGirdisi()

  const katmanlar = useMemo(
    () =>
      afetzedeKatmanlari({
        altlik,
        altlikYapiGorunur,
        bolgeAdlari,
        adSeviyesi,
        yerler: p.yerler,
        secili: p.secili,
        konum: p.konum,
        cagrilar: p.cagrilar,
        rota: p.rota,
      }),
    [altlik, altlikYapiGorunur, bolgeAdlari, adSeviyesi, p.yerler, p.secili, p.konum, p.cagrilar, p.rota],
  )

  useEffect(() => {
    if (hazir) katmanlariYaz(katmanlar)
  }, [hazir, katmanlar, katmanlariYaz])

  // Haritada bir yere tıklanınca seçilir (liste de o yere geçer).
  const sec = useRef(p.sec)
  sec.current = p.sec
  useEffect(() => {
    if (!hazir) return
    tiklamaYaz((bilgi) => {
      if (bilgi.layer?.id === 'yerler' && bilgi.object) sec.current(bilgi.object as YakinYer)
    })
  }, [hazir, tiklamaYaz])

  // Konum ilk kez gelince ya da değişince (mahalle seçimi) oraya git; her
  // doğruluk güncellemesinde uçmasın.
  const konumAnahtari = p.konum ? `${p.konum.lon.toFixed(4)},${p.konum.lat.toFixed(4)}` : null
  useEffect(() => {
    if (hazir && p.konum) ucus(p.konum.lon, p.konum.lat, 15)
  }, [hazir, konumAnahtari])

  // Listeden seçilen yere git; rota gelince bütün rotayı sığdır (J-44).
  // Rota önbellekteyse doğrudan sığdırılır, önce yere uçup sonra geri
  // dönmez.
  const rota = p.rota
  useEffect(() => {
    if (hazir && p.secili && !rota) ucus(p.secili.lon, p.secili.lat, 16)
  }, [hazir, p.secili?.id])
  const rotaAnahtari = rota && rota.length > 1 ? `${rota.length}:${rota[0]}:${rota[rota.length - 1]}` : null
  useEffect(() => {
    const harita = haritaAl()
    if (!hazir || !harita || !rota || rota.length < 2) return
    let [w, s, e, n] = [rota[0][0], rota[0][1], rota[0][0], rota[0][1]]
    for (const [x, y] of rota) {
      w = Math.min(w, x)
      e = Math.max(e, x)
      s = Math.min(s, y)
      n = Math.max(n, y)
    }
    const azalt = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    harita.fitBounds(
      [
        [w, s],
        [e, n],
      ],
      { padding: 40, maxZoom: 17, duration: azalt ? 0 : 900 },
    )
  }, [hazir, rotaAnahtari])

  return null
}

/** Harita üstü: konuma dön ve kaynak künyesi (ARAYUZ §11: künye hep ekranda). */
function Ustyazi(p: AfetzedeHaritasiProps) {
  const { ucus } = useHarita()
  const { gorunen, katalog } = useAltlikGirdisi()
  const kaynak = gorunen[0]?.kaynak ?? katalog.data?.[0]?.kaynak
  const k = p.konum
  const kapsamda =
    !k ||
    !katalog.data ||
    katalog.data.some((b) => k.lon >= b.kutu[0] && k.lon <= b.kutu[2] && k.lat >= b.kutu[1] && k.lat <= b.kutu[3])

  return (
    <>
      {k && (
        <button
          type="button"
          onClick={() => ucus(k.lon, k.lat, 15)}
          className="absolute top-2 right-2 z-10 flex h-9 items-center gap-1.5 rounded-control border border-line-2 bg-panel px-2.5 text-body text-ink shadow-float hover:bg-hover"
        >
          <Crosshair size={16} className="text-accent" aria-hidden />
          {k.kaynak === 'gps' ? 'Konumuma dön' : 'Mahalleme dön'}
        </button>
      )}
      <p className="pointer-events-none absolute bottom-0 left-0 z-10 m-2 max-w-full rounded-control border border-line-2 bg-panel px-2.5 py-1 text-small text-ink-2 shadow-float">
        {kaynak ? `${kaynak.atif} (${kaynak.lisans})` : 'Altlık yükleniyor'}
        {!kapsamda && ' · bu çevrenin altlığı üretilmedi'}
      </p>
    </>
  )
}
