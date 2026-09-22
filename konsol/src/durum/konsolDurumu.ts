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
  'ihbarlar',
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
  ihbarlar: 'Afetzede ihbarları',
}

/** Katmanın grubu, kaynağı ve haritaya bağlı olup olmadığı (J-56). Kaynak her
    katmanın yanında yazılır (kural 1). `bagli: false` katman haritada henüz
    çizilmiyor: anahtarı yok, "bağlanmadı" yazar. Eskiden anahtarı vardı ama
    hiçbir şey çizmiyordu (hasarlı yollar boş veriyle, ötekiler hiç). */
export const KATMAN_BILGI: Record<KatmanId, { grup: 'olay' | 'hasar' | 'altlik'; kaynak: string; bagli: boolean }> = {
  ihbarlar: { grup: 'olay', kaynak: 'Afetzede ekranı: fotoğraf (YOLO), yazılı (BERTurk), ihtiyaç', bagli: true },
  ekipler: { grup: 'olay', kaynak: 'Ekip kaydı; konum ekibin telefonundan ya da koordinasyondan', bagli: true },
  isi: { grup: 'hasar', kaynak: 'Uydu, SOS, kamera ve metin noktaları; ızgara sunucuda', bagli: true },
  analizSonucu: { grup: 'hasar', kaynak: 'Bu oturumda biten uydu analizi (Hasar analizi modu)', bagli: true },
  hasarliYollar: { grup: 'hasar', kaynak: 'Kayıtlı yol kapanmaları; haritaya henüz bağlanmadı', bagli: false },
  depremler: {
    grup: 'hasar',
    kaynak: 'Deprem kataloğu; Deprem riski modunda liste olarak var, harita katmanı yok',
    bagli: false,
  },
  faylar: {
    grup: 'hasar',
    kaynak: 'Fay hatları; Deprem riski modunda liste olarak var, harita katmanı yok',
    bagli: false,
  },
  yapilar: { grup: 'altlik', kaynak: 'OpenStreetMap, yerel kopya; yakınlaşınca çizilir', bagli: true },
  yollar: { grup: 'altlik', kaynak: 'OpenStreetMap, yerel kopya', bagli: true },
  toplanma: {
    grup: 'altlik',
    kaynak: 'AFAD listesi; afetzede ekranında var, konsol haritasına bağlanmadı',
    bagli: false,
  },
}

export const KATMAN_GRUBU = { olay: 'Olaylar ve ekipler', hasar: 'Hasar', altlik: 'Altlık' } as const

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

/** SOS kuyruğu ve ekip listesi süzgeçleri: sol paneldeki seçim sağdaki listeyi
    süzer. Eskiden durum sol panelde kalıyordu ve liste süzülmüyordu (J-54). */
export type SosSuzgeci = 'bekleyen' | 'kritik' | 'atanan' | 'tum'
export type EkipSuzgeci = 'tum' | 'musait' | 'gorevde' | 'hizmet-disi'

type KonsolDurumu = {
  katmanlar: Record<KatmanId, boolean>
  sosSuzgeci: SosSuzgeci
  ekipSuzgeci: EkipSuzgeci
  agirliklar: Agirliklar
  karisim: KarisimId | null
  seciliKayit: { tip: 'sos' | 'yol' | 'yapi' | 'ihbar'; id: string } | null
  komutPaletiAcik: boolean

  katmanDegistir: (id: KatmanId, acik?: boolean) => void
  katmanlariAyarla: (acik: KatmanId[]) => void
  agirlikAyarla: (id: KanalId, deger: number) => void
  karisimSec: (id: KarisimId) => void
  kayitSec: (kayit: KonsolDurumu['seciliKayit']) => void
  komutPaleti: (acik: boolean) => void
  sosSuzgeciSec: (s: SosSuzgeci) => void
  ekipSuzgeciSec: (s: EkipSuzgeci) => void
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
  ihbarlar: true,
}

export const useKonsol = create<KonsolDurumu>((set) => ({
  katmanlar: BASLANGIC,
  sosSuzgeci: 'bekleyen',
  ekipSuzgeci: 'tum',
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
  sosSuzgeciSec: (sosSuzgeci) => set({ sosSuzgeci }),
  ekipSuzgeciSec: (ekipSuzgeci) => set({ ekipSuzgeci }),
}))
