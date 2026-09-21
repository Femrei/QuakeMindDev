import { create } from 'zustand'

/* ---------------------------------------------------------------------------
   Uzun süren işlerin durumu. Tek kaynak: canlı akıştaki `is-durumu` mesajları.
   Hiçbir yerde zamanlayıcıyla durum sorulmaz (CLAUDE.md kural 4).
--------------------------------------------------------------------------- */

export type IsDurumu = 'kuyrukta' | 'calisiyor' | 'bitti' | 'hata'

/** İşi başlatırken gönderdiğimiz koşullar. Sonuç bunun yanında gösterilir,
    böylece hangi görüntüden çıktığı ekranda yazar (CLAUDE.md kural 1). */
export type IsKunyesi = {
  bolge: string
  kaynak: string
  goruntuTarihi?: string
  esik: number
  sonIsleme: number
  yaricapKm: number
}

export type Is = {
  id: string
  isTipi: string
  durum: IsDurumu
  ilerleme: number
  mesaj: string
  hata?: string
  baslangic: number
  bitis?: number
  /** İş bitince tek istekle indirilen sonucun özeti. */
  sonuc?: unknown
  kunye?: IsKunyesi
}

type IslerDurumu = {
  isler: Record<string, Is>
  sonIsId: string | null
  isBasladi: (id: string, isTipi: string, mesaj: string, kunye?: IsKunyesi) => void
  isGuncelle: (id: string, yama: Partial<Is>) => void
}

export const useIsler = create<IslerDurumu>((set) => ({
  isler: {},
  sonIsId: null,

  isBasladi: (id, isTipi, mesaj, kunye) =>
    set((d) => ({
      sonIsId: id,
      isler: {
        ...d.isler,
        [id]: { id, isTipi, durum: 'kuyrukta', ilerleme: 0, mesaj, baslangic: Date.now(), kunye },
      },
    })),

  isGuncelle: (id, yama) =>
    set((d) => {
      const onceki = d.isler[id]
      if (!onceki) return d
      return { isler: { ...d.isler, [id]: { ...onceki, ...yama } } }
    }),
}))

export function sonIsSec(d: IslerDurumu): Is | null {
  return d.sonIsId ? (d.isler[d.sonIsId] ?? null) : null
}
