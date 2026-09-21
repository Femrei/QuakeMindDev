import { create } from 'zustand'

/* ---------------------------------------------------------------------------
   Konsolun arayüz durumu (sunucu verisi değil — o TanStack Query'de).
   Modlar sayfa değildir: mod değişince harita yerinde kalır, paneller ve
   açık katmanlar değişir (MIMARI §7, ARAYUZ §8).
--------------------------------------------------------------------------- */

export const KATMANLAR = [
  'analizSonucu',
  'yapilar',
  'yollar',
  'hasarliYollar',
  'isi',
  'depremler',
  'toplanma',
  'ekipler',
  'faylar',
] as const
export type KatmanId = (typeof KATMANLAR)[number]

export const KATMAN_ADI: Record<KatmanId, string> = {
  analizSonucu: 'Analiz sonucu (kapalı yollar)',
  yapilar: 'Yapılar',
  yollar: 'Yol ağı',
  hasarliYollar: 'Hasarlı yollar',
  isi: 'Birleşik ısı',
  depremler: 'Depremler',
  toplanma: 'Toplanma alanları',
  ekipler: 'Saha ekipleri',
  faylar: 'Fay hatları',
}

/** Isı haritasının dört kanalı (MIMARI §5). */
export const KANALLAR = ['sat', 'sos', 'cam', 'nlp'] as const
export type KanalId = (typeof KANALLAR)[number]

export const KANAL_BILGI: Record<KanalId, { ad: string; kaynak: string; renk: string }> = {
  sat: { ad: 'Uydu hasar tespiti', kaynak: 'SegFormer bölütleme çıktısı', renk: 'var(--color-ch-sat)' },
  sos: { ad: 'SOS çağrıları', kaynak: 'vatandaş acil çağrıları', renk: 'var(--color-ch-sos)' },
  cam: { ad: 'Kamera tespiti', kaynak: 'saha fotoğrafları · YOLO', renk: 'var(--color-ch-cam)' },
  nlp: { ad: 'Metin ihbarı', kaynak: 'metin analizi · BERTurk', renk: 'var(--color-ch-nlp)' },
}

type Agirliklar = Record<KanalId, number>

export const KARISIM_HAZIRLARI = [
  {
    id: 'genel',
    etiket: 'Genel durum',
    w: { sat: 1, sos: 1, cam: 1, nlp: 1 } as Agirliklar,
    not: 'Bütün kaynaklar birlikte: nerede hasar yoğun?',
  },
  {
    id: 'cagri',
    etiket: 'Yalnız çağrılar',
    w: { sat: 0, sos: 1, cam: 0, nlp: 1 } as Agirliklar,
    not: 'Yalnızca vatandaştan gelen çağrılar: ekip talebi olan yerler.',
  },
  {
    id: 'sessiz',
    etiket: 'Sessiz bölgeler',
    w: { sat: 1, sos: -1, cam: -0.6, nlp: -0.6 } as Agirliklar,
    not: 'Uydu yıkık gösteriyor ama oradan çağrı gelmemiş. Kimsenin haber veremediği yerler.',
  },
] as const

export type KarisimId = (typeof KARISIM_HAZIRLARI)[number]['id']

type KonsolDurumu = {
  katmanlar: Record<KatmanId, boolean>
  agirliklar: Agirliklar
  karisim: KarisimId | null
  seciliKayit: { tip: 'sos' | 'yol' | 'yapi'; id: string } | null
  komutPaletiAcik: boolean

  katmanDegistir: (id: KatmanId, acik?: boolean) => void
  katmanlariAyarla: (acik: KatmanId[]) => void
  agirlikAyarla: (id: KanalId, deger: number) => void
  karisimSec: (id: KarisimId) => void
  kayitSec: (kayit: KonsolDurumu['seciliKayit']) => void
  komutPaleti: (acik: boolean) => void
}

const BASLANGIC: Record<KatmanId, boolean> = {
  analizSonucu: true,
  yapilar: true,
  yollar: true,
  hasarliYollar: true,
  isi: true,
  depremler: true,
  toplanma: false,
  ekipler: true,
  faylar: false,
}

export const useKonsol = create<KonsolDurumu>((set) => ({
  katmanlar: BASLANGIC,
  agirliklar: { sat: 1, sos: 1, cam: 1, nlp: 1 },
  karisim: 'genel',
  seciliKayit: null,
  komutPaletiAcik: false,

  katmanDegistir: (id, acik) =>
    set((d) => ({ katmanlar: { ...d.katmanlar, [id]: acik ?? !d.katmanlar[id] } })),

  katmanlariAyarla: (acik) =>
    set(() => {
      const yeni = { ...BASLANGIC }
      for (const k of KATMANLAR) yeni[k] = acik.includes(k)
      return { katmanlar: yeni }
    }),

  agirlikAyarla: (id, deger) =>
    set((d) => ({ agirliklar: { ...d.agirliklar, [id]: deger }, karisim: null })),

  karisimSec: (id) => {
    const h = KARISIM_HAZIRLARI.find((x) => x.id === id)
    if (h) set({ karisim: id, agirliklar: { ...h.w } })
  },

  kayitSec: (kayit) => set({ seciliKayit: kayit }),
  komutPaleti: (acik) => set({ komutPaletiAcik: acik }),
}))
