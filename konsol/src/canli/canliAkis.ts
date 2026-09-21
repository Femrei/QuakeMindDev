import { create } from 'zustand'
import type { QueryClient } from '@tanstack/react-query'
import { MESAJ_TIPLERI, TAZELENECEK, type CanliMesaj } from './mesajlar'

/* ---------------------------------------------------------------------------
   TEK canlı akış istemcisi (MIMARI §6, CLAUDE.md kural 4).

   · Uygulamada tek bir EventSource açılır; başka hiçbir yerde açılmaz.
   · setInterval ile uç nokta yoklamak YASAKTIR. Sorgular yalnız mesaj gelince
     tazelenir.
   · Uç nokta henüz yoksa akış boş çalışır: bağlantı kurulamaz, durum
     "bağlı değil" olarak gösterilir, yeniden deneme üstel geri çekilmeyle
     seyrekleşir (yoklamaya dönüşmez).
--------------------------------------------------------------------------- */

export type BaglantiDurumu = 'kapali' | 'baglaniyor' | 'bagli' | 'kopuk'

type AkisDurumu = {
  durum: BaglantiDurumu
  sonMesaj: { tip: CanliMesaj['tip']; zaman: number } | null
  mesajSayisi: number
  denemeSayisi: number
  sonrakiDenemeMs: number | null
}

export const useCanliAkisDurumu = create<AkisDurumu>(() => ({
  durum: 'kapali',
  sonMesaj: null,
  mesajSayisi: 0,
  denemeSayisi: 0,
  sonrakiDenemeMs: null,
}))

const ILK_BEKLEME = 2_000
const EN_UZUN_BEKLEME = 60_000

export type AkisSecenek = {
  url?: string
  /** Mesajları dinlemek isteyen yerler için (bildirim, harita nabzı). */
  dinleyici?: (m: CanliMesaj) => void
}

export function canliAkisBaslat(qc: QueryClient, secenek: AkisSecenek = {}): () => void {
  const url = secenek.url ?? '/api/live'
  let kaynak: EventSource | null = null
  let zamanlayici: number | null = null
  let kapandi = false
  let deneme = 0

  const isle = (ham: string) => {
    let mesaj: CanliMesaj
    try {
      mesaj = JSON.parse(ham) as CanliMesaj
    } catch {
      return // biçimsiz mesaj sessizce atılır, akış kapatılmaz
    }
    if (!mesaj || !MESAJ_TIPLERI.includes(mesaj.tip)) return
    for (const anahtar of TAZELENECEK[mesaj.tip] ?? []) {
      void qc.invalidateQueries({ queryKey: anahtar })
    }
    useCanliAkisDurumu.setState((d) => ({
      sonMesaj: { tip: mesaj.tip, zaman: Date.now() },
      mesajSayisi: d.mesajSayisi + 1,
    }))
    secenek.dinleyici?.(mesaj)
  }

  const bagla = () => {
    if (kapandi) return
    useCanliAkisDurumu.setState({ durum: 'baglaniyor', sonrakiDenemeMs: null })
    kaynak = new EventSource(url)

    kaynak.onopen = () => {
      deneme = 0
      useCanliAkisDurumu.setState({ durum: 'bagli', denemeSayisi: 0, sonrakiDenemeMs: null })
    }
    kaynak.onmessage = (e) => isle(e.data)
    // Sunucu adlandırılmış olay gönderirse (event: yeni-sos) o da aynı yoldan geçer.
    for (const tip of MESAJ_TIPLERI) {
      kaynak.addEventListener(tip, (e) => isle((e as MessageEvent<string>).data))
    }
    kaynak.onerror = () => {
      kaynak?.close()
      kaynak = null
      if (kapandi) return
      deneme += 1
      const bekle = Math.min(EN_UZUN_BEKLEME, ILK_BEKLEME * 2 ** (deneme - 1))
      const sapma = Math.round(bekle * 0.2 * Math.random())
      useCanliAkisDurumu.setState({
        durum: 'kopuk',
        denemeSayisi: deneme,
        sonrakiDenemeMs: bekle + sapma,
      })
      zamanlayici = window.setTimeout(bagla, bekle + sapma)
    }
  }

  bagla()

  return () => {
    kapandi = true
    if (zamanlayici) window.clearTimeout(zamanlayici)
    kaynak?.close()
    useCanliAkisDurumu.setState({ durum: 'kapali', sonrakiDenemeMs: null })
  }
}
