import { useMemo } from 'react'
import { create } from 'zustand'

/* ---------------------------------------------------------------------------
   Zaman aralığı — ARAYUZ_KARARLARI.md §10 (canlı mod davranışı, kesin).

   · Varsayılan CANLI: pencere şimdiye kilitli, saatle birlikte kayar.
   · Kullanıcı şeridi geri çekince mod GEÇMİŞe düşer.
   · Oynat düğmesi yalnız geçmiş modunda çalışır.
   · Pencere HER ŞEYİ süzer: harita katmanları, ısı kanalları, sayılar, listeler.

   Not: buradaki saat yalnız yerel bir sayaçtır; sunucuya istek atmaz (kural 4).
--------------------------------------------------------------------------- */

export const SAAT = 3600_000
export const HAZIR_PENCERELER = [
  { id: 'canli', etiket: 'Canlı', canli: true, uzunluk: 6 * SAAT },
  { id: '6s', etiket: 'Son 6 saat', canli: false, uzunluk: 6 * SAAT },
  { id: '24s', etiket: 'Son 24 saat', canli: false, uzunluk: 24 * SAAT },
  { id: '3g', etiket: 'Son 3 gün', canli: false, uzunluk: 72 * SAAT },
  { id: 'tum', etiket: 'Tümü', canli: false, uzunluk: 30 * 24 * SAAT },
] as const

export type PencereId = (typeof HAZIR_PENCERELER)[number]['id']

type ZamanDurumu = {
  canli: boolean
  simdi: number
  /** Canlı modda pencere uzunluğu; geçmişte seçili aralığın uzunluğu. */
  uzunluk: number
  /** Geçmiş modda pencerenin bitişi. Canlı modda kullanılmaz. */
  bitis: number
  oynatiliyor: boolean

  saatIlerlet: (simdi: number) => void
  canliyaDon: () => void
  /** Şeridi geri çekmek: canlıdan geçmişe düşüren tek yol. */
  aralikTasi: (yeniBitis: number) => void
  pencereSec: (id: PencereId) => void
  oynatDegistir: () => void
}

export const useZaman = create<ZamanDurumu>((set, get) => ({
  canli: true,
  simdi: Date.now(),
  uzunluk: 6 * SAAT,
  bitis: Date.now(),
  oynatiliyor: false,

  saatIlerlet: (simdi) =>
    set((d) => (d.canli ? { simdi, bitis: simdi } : { simdi })),

  canliyaDon: () => set((d) => ({ canli: true, oynatiliyor: false, bitis: d.simdi })),

  aralikTasi: (yeniBitis) => {
    const d = get()
    const sinirli = Math.min(yeniBitis, d.simdi)
    // Şimdiye kilitliyken ileri çekmek canlıda tutar; geri çekmek geçmişe düşürür.
    set({ bitis: sinirli, canli: sinirli >= d.simdi - 60_000 })
  },

  pencereSec: (id) => {
    const p = HAZIR_PENCERELER.find((x) => x.id === id)
    if (!p) return
    const d = get()
    set(
      p.canli
        ? { canli: true, oynatiliyor: false, uzunluk: p.uzunluk, bitis: d.simdi }
        : { canli: false, uzunluk: p.uzunluk, bitis: d.simdi },
    )
  },

  oynatDegistir: () => set((d) => (d.canli ? d : { oynatiliyor: !d.oynatiliyor })),
}))

/** Seçili aralık [baslangic, bitis] — bütün sorgular ve katmanlar bunu kullanır.
    Not: seçici dizi döndürdüğü için doğrudan useZaman(...) ile kullanılmaz;
    her çağrıda yeni dizi üretmek sonsuz yeniden çizime yol açar. */
export function aralikAl(d: ZamanDurumu): [number, number] {
  const bitis = d.canli ? d.simdi : d.bitis
  return [bitis - d.uzunluk, bitis]
}

/** Bileşenler aralığı bu kancayla okur: yalnız ilkel değerlere abone olunur. */
export function useAralik(): [number, number] {
  const bitis = useZaman((d) => (d.canli ? d.simdi : d.bitis))
  const uzunluk = useZaman((d) => d.uzunluk)
  return useMemo(() => [bitis - uzunluk, bitis], [bitis, uzunluk])
}

/** Hangi hazır pencere seçili görünüyor? */
export function seciliPencere(d: ZamanDurumu): PencereId | null {
  if (d.canli) return 'canli'
  return HAZIR_PENCERELER.find((p) => !p.canli && p.uzunluk === d.uzunluk)?.id ?? null
}
