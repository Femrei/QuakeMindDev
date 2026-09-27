import { create } from 'zustand'
import { IHBAR_TURU, type IhbarTuru } from '@/veri/ihbar'
import { ONCELIK_ADI } from '@/veri/sorgular'
import type { CanliMesaj } from './mesajlar'

/* Yeni SOS ve ihbar kartlarının durumu (J-51). Canlı akış dinleyicisi
   `yeniOlayIsle` ile besler; kartları konsol kabuğu çizer (kabuk/YeniOlaylar).
   Afetzede ekranında kart çıkmaz: ona gelen mesajlarda konum yoktur. */

export type Olay = {
  anahtar: string
  tur: IhbarTuru | 'sos'
  id: string
  lon: number
  lat: number
  baslik: string
  alt: string
  zaman: number
}

const EN_COK = 3
/** Kart 20 sn durur; kaçırılan kayıt listede "yeni" olarak kalır. */
export const OMUR_MS = 20_000

export const useYeniOlaylar = create<{
  olaylar: Olay[]
  kaldir: (anahtar: string) => void
}>((set) => ({
  olaylar: [],
  kaldir: (anahtar) => set((d) => ({ olaylar: d.olaylar.filter((o) => o.anahtar !== anahtar) })),
}))

/* ---- yeni duyuru (afetzede ekranı, J-51) ------------------------------------
   Koordinasyon duyuru yayınlayınca afetzedenin ekranında üstte bir uyarı
   çıkar; afetzede izin verdiyse ve sekme arka plandaysa tarayıcı bildirimi de
   gelir. Geri çekilen duyurunun uyarısı kalkar. */

export type YeniDuyuru = { id: string; baslik: string; onem: string; zaman: number }

export const useYeniDuyuru = create<{ duyuru: YeniDuyuru | null; kapat: () => void }>((set) => ({
  duyuru: null,
  kapat: () => set({ duyuru: null }),
}))

function duyuruIsle(m: Extract<CanliMesaj, { tip: 'bildirim' }>) {
  if (m.durum === 'kaldirildi') {
    useYeniDuyuru.setState((d) => (d.duyuru?.id === m.id ? { duyuru: null } : d))
    return
  }
  useYeniDuyuru.setState({ duyuru: { id: m.id, baslik: m.baslik, onem: m.onem, zaman: Date.now() } })
  // Tarayıcı bildirimi yalnız afetzede izin verdiyse ve sekme görünmüyorsa.
  if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
    try {
      const b = new Notification(`QuakeMind · ${m.onem === 'acil' ? 'ACİL ' : ''}duyuru`, {
        body: m.baslik,
        tag: m.id,
      })
      b.onclick = () => window.focus()
    } catch {
      /* bazı tarayıcılar sayfadan bildirim açmaya izin vermez; uyarı yine ekranda */
    }
  }
}

/** Canlı akış dinleyicisi çağırır. Konumsuz mesaj (afetzedenin kendi kaydının
    durumu ya da durum değişikliği) kart açmaz. */
export function yeniOlayIsle(m: CanliMesaj) {
  if (m.tip === 'bildirim') {
    duyuruIsle(m)
    return
  }
  let olay: Olay | null = null
  if (m.tip === 'yeni-sos' && m.lon != null && m.lat != null) {
    const oncelik = ONCELIK_ADI[m.oncelik as keyof typeof ONCELIK_ADI]
    olay = {
      anahtar: `sos-${m.id}`,
      tur: 'sos',
      id: m.id,
      lon: m.lon,
      lat: m.lat,
      baslik: 'Yeni SOS çağrısı',
      alt: [oncelik ? `${oncelik} aciliyet` : null, m.mahalle].filter(Boolean).join(' · '),
      zaman: Date.now(),
    }
  } else if (m.tip === 'ihbar' && m.durum === 'yeni' && m.lon != null && m.lat != null) {
    olay = {
      anahtar: `ihb-${m.id}`,
      tur: m.tur,
      id: m.id,
      lon: m.lon,
      lat: m.lat,
      baslik: `Yeni ${IHBAR_TURU[m.tur].ad.toLocaleLowerCase('tr-TR')}`,
      alt: m.etiket ?? '',
      zaman: Date.now(),
    }
  }
  if (!olay) return
  const yeni = olay
  useYeniOlaylar.setState((d) => ({
    olaylar: [yeni, ...d.olaylar.filter((o) => o.anahtar !== yeni.anahtar)].slice(0, EN_COK),
  }))
}
