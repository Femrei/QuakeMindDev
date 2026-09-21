import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

/* ---------------------------------------------------------------------------
   Afetzedenin konumu (J-43).

   Cihaz ilk konumu çoğu zaman kaba verir (baz istasyonu, Wi-Fi: yüzlerce
   metre); uydu kilitlendikçe iyileşir. Bu yüzden tek atış yerine kısa bir
   izleme açılır: en iyi sonuç tutulur, hedef doğruluğa inince ya da süre
   dolunca izleme kapanır. Bu bir uç yoklaması değildir; cihazın kendi
   algılayıcısıdır ve sunucuya istek atmaz.
--------------------------------------------------------------------------- */

export type GpsKonumu = { lon: number; lat: number; dogrulukM: number; zaman: number }

export type GpsDurumu =
  | { durum: 'araniyor'; konum: GpsKonumu | null }
  | { durum: 'alindi'; konum: GpsKonumu }
  | { durum: 'hata'; neden: 'izin' | 'desteklenmiyor' | 'bulunamadi' }

/** Bu doğruluğa inince izleme erken biter. */
const HEDEF_DOGRULUK_M = 30
/** İzleme en çok bu kadar sürer; o ana kadarki en iyi sonuç kullanılır. */
const EN_UZUN_ARAMA_MS = 20_000
/** Bundan kaba konumda kullanıcı uyarılır. */
export const KABA_DOGRULUK_M = 500

export function useGpsKonumu() {
  const [gps, setGps] = useState<GpsDurumu>({ durum: 'araniyor', konum: null })
  const izleme = useRef<number | null>(null)
  const sayac = useRef<number | null>(null)

  const durdur = useCallback(() => {
    if (izleme.current != null) navigator.geolocation.clearWatch(izleme.current)
    if (sayac.current != null) window.clearTimeout(sayac.current)
    izleme.current = null
    sayac.current = null
  }, [])

  const iste = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGps({ durum: 'hata', neden: 'desteklenmiyor' })
      return
    }
    durdur()
    let enIyi: GpsKonumu | null = null
    setGps({ durum: 'araniyor', konum: null })

    izleme.current = navigator.geolocation.watchPosition(
      (p) => {
        const yeni: GpsKonumu = {
          lon: p.coords.longitude,
          lat: p.coords.latitude,
          dogrulukM: p.coords.accuracy,
          zaman: p.timestamp,
        }
        if (!enIyi || yeni.dogrulukM <= enIyi.dogrulukM) enIyi = yeni
        if (enIyi.dogrulukM <= HEDEF_DOGRULUK_M) {
          durdur()
          setGps({ durum: 'alindi', konum: enIyi })
        } else {
          setGps({ durum: 'araniyor', konum: enIyi })
        }
      },
      (e) => {
        if (e.code === e.PERMISSION_DENIED) {
          durdur()
          setGps({ durum: 'hata', neden: 'izin' })
        } else if (e.code === e.POSITION_UNAVAILABLE && !enIyi) {
          durdur()
          setGps({ durum: 'hata', neden: 'bulunamadi' })
        }
        // Zaman aşımında izleme sürer; son kararı aşağıdaki sayaç verir.
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: EN_UZUN_ARAMA_MS },
    )
    sayac.current = window.setTimeout(() => {
      durdur()
      setGps(enIyi ? { durum: 'alindi', konum: enIyi } : { durum: 'hata', neden: 'bulunamadi' })
    }, EN_UZUN_ARAMA_MS)
  }, [durdur])

  // Konum hem çağrı hem toplanma alanı için gerekli: ekran açılınca istenir.
  useEffect(() => {
    iste()
    return durdur
  }, [iste, durdur])

  return { gps, iste }
}

/* ---- çevrimiçi durumu --------------------------------------------------- */

function cevrimiciAbone(bildir: () => void) {
  window.addEventListener('online', bildir)
  window.addEventListener('offline', bildir)
  return () => {
    window.removeEventListener('online', bildir)
    window.removeEventListener('offline', bildir)
  }
}

/** Tarayıcının ağ durumu. `false` kesin çevrimdışıdır; `true` sunucuya ulaşıldığını garanti etmez. */
export function useCevrimici(): boolean {
  return useSyncExternalStore(cevrimiciAbone, () => navigator.onLine)
}

/* ---- uzaklık ve yön ------------------------------------------------------ */

/** "850 m" · "1,4 km" */
export function mesafeMetni(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`
}

const YONLER = ['kuzey', 'kuzeydoğu', 'doğu', 'güneydoğu', 'güney', 'güneybatı', 'batı', 'kuzeybatı']

/** Başlangıç yönü (derece, kuzeyden saat yönünde) ve sekiz yönlü adı. */
export function yon(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): { derece: number; ad: string } {
  const r = Math.PI / 180
  const dl = (b.lon - a.lon) * r
  const y = Math.sin(dl) * Math.cos(b.lat * r)
  const x =
    Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos(dl)
  const derece = (Math.atan2(y, x) / r + 360) % 360
  return { derece, ad: YONLER[Math.round(derece / 45) % 8] }
}

/* ---- yer adı arama ------------------------------------------------------- */

/** Türkçe harfleri ve büyük/küçük farkını yok sayan arama anahtarı: "Alitaşı" ~ "alitasi". */
export function aramaAnahtari(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[âà]/g, 'a')
    .replace(/[îì]/g, 'i')
    .replace(/[ûù]/g, 'u')
    .trim()
}
