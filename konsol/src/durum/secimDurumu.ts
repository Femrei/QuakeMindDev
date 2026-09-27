import { create } from 'zustand'

/* ---------------------------------------------------------------------------
   Haritada analiz alanı seçimi.

   Dört yöntem: şehir merkezi · nokta seç · dikdörtgen çiz · çokgen çiz.
   Not: çıkarım ucu bugün yalnız sınır kutusu (bbox) kabul ediyor; çokgen de
   kendi sınır kutusuna indirgenerek gönderilir ve panel bunu açıkça yazar.
--------------------------------------------------------------------------- */

export type SecimModu = 'sehir' | 'nokta' | 'alan' | 'cokgen'

/** [batı, güney, doğu, kuzey] */
export type Kutu = [number, number, number, number]
export type Nokta = [number, number]

type SecimDurumu = {
  modu: SecimModu
  merkez: Nokta | null
  kutu: Kutu | null
  cokgen: Nokta[] | null
  /** Sürükleme ya da çokgen çizimi sürüyor mu? */
  ciziyor: boolean
  /** Çizim sürerken görünen geçici şekil. Köşeler burada durur; harita
      dinleyicisi kendi içinde kopya tutmaz, yoksa ikisi ayrışıyor. */
  taslak: { kutu?: Kutu; nokta?: Nokta[] } | null

  moduSec: (modu: SecimModu) => void
  merkezSec: (nokta: Nokta) => void
  kutuSec: (kutu: Kutu) => void
  taslakKutu: (kutu: Kutu | null) => void
  koseEkle: (nokta: Nokta) => void
  sonKoseyiSil: () => void
  cizimiBitir: () => void
  cizimiIptal: () => void
  temizle: () => void
}

export const useSecim = create<SecimDurumu>((set) => ({
  modu: 'sehir',
  merkez: null,
  kutu: null,
  cokgen: null,
  ciziyor: false,
  taslak: null,

  moduSec: (modu) =>
    set((d) =>
      modu === d.modu ? { modu } : { modu, taslak: null, ciziyor: false },
    ),
  merkezSec: (merkez) => set({ merkez, kutu: null, cokgen: null, taslak: null, ciziyor: false }),
  kutuSec: (kutu) => set({ kutu, cokgen: null, taslak: null, ciziyor: false }),
  taslakKutu: (kutu) => set(kutu ? { taslak: { kutu }, ciziyor: true } : { taslak: null, ciziyor: false }),

  koseEkle: (nokta) =>
    set((d) => ({ taslak: { nokta: [...(d.taslak?.nokta ?? []), nokta] }, ciziyor: true })),

  sonKoseyiSil: () =>
    set((d) => {
      const kalan = (d.taslak?.nokta ?? []).slice(0, -1)
      return kalan.length ? { taslak: { nokta: kalan } } : { taslak: null, ciziyor: false }
    }),

  cizimiBitir: () =>
    set((d) => {
      const koseler = d.taslak?.nokta ?? []
      if (koseler.length < 3) return { taslak: null, ciziyor: false }
      return { cokgen: koseler, kutu: cokgenKutusu(koseler), taslak: null, ciziyor: false }
    }),

  cizimiIptal: () => set({ taslak: null, ciziyor: false }),
  temizle: () => set({ kutu: null, cokgen: null, merkez: null, taslak: null, ciziyor: false }),
}))

export function cokgenKutusu(noktalar: Nokta[]): Kutu {
  const lonlar = noktalar.map((n) => n[0])
  const enlemler = noktalar.map((n) => n[1])
  return [
    Math.min(...lonlar),
    Math.min(...enlemler),
    Math.max(...lonlar),
    Math.max(...enlemler),
  ]
}

export function kutuCevresi(kutu: Kutu): { genislikKm: number; yukseklikKm: number; alanKm2: number } {
  const [b, g, d, k] = kutu
  const ortalamaEnlem = ((g + k) / 2) * (Math.PI / 180)
  const genislikKm = (d - b) * 111.32 * Math.cos(ortalamaEnlem)
  const yukseklikKm = (k - g) * 110.57
  return { genislikKm, yukseklikKm, alanKm2: genislikKm * yukseklikKm }
}

export function kutuMerkezi(kutu: Kutu): Nokta {
  return [(kutu[0] + kutu[2]) / 2, (kutu[1] + kutu[3]) / 2]
}
