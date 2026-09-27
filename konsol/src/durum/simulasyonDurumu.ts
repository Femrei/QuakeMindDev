import { create } from 'zustand'
import type { SimKosIstegi, SimVaryantId } from '@/veri/simulasyon'

/* ---------------------------------------------------------------------------
   Tatbikat modunun arayüz durumu (SIMULASYON_SOZLESMESI.md §5).

   Koşu kimliği burada durur, mod bileşeninde değil: TATBİKAT şeridi mod
   değişince de görünmeye devam eder (madde 1) ve başka moda geçip dönünce
   koşu kaybolmaz.

   Hangi katmanın hazır olduğu canlı akıştan gelir (`simulasyon-katman`);
   yoklama yok (kural 4).
--------------------------------------------------------------------------- */

export type SimKatman = 'hasar' | 'kapanma' | 'rota' | 'gorev'

/** Sözleşmedeki varsayılanlar (§2, POST /api/simulasyon/kos gövdesi). */
export const VARSAYILAN_AYAR: Omit<SimKosIstegi, 'alanId' | 'katmanId' | 'modelId'> = {
  esik: 0.5,
  // r_h = 0: ürünün kuralı, "yalnız yolun üstündeki hasar kapatır" (J-70).
  // Panelde gösterilmez; yarıçap kuralı bir deneydir ve kesinliği artırmıyor.
  kapanmaYaricapiM: 0,
  yumusakMaliyet: false,
  lambda: null,
  ekipSayisi: 5,
  afetzedeSayisi: 5,
  tohum: 42,
}

export type SimSecim = {
  alanId: string | null
  katmanId: string | null
  modelId: string | null
} & Omit<SimKosIstegi, 'alanId' | 'katmanId' | 'modelId'>

type SimDurumu = {
  secim: SimSecim
  /** Çalışan ya da biten koşu; mod kapansa da durur. */
  isId: string | null
  parmakIzi: string | null
  onbellekten: boolean
  /** Canlı akışın "hazır" dediği katmanlar (sıra: hasar → kapanma → rota → görev). */
  hazir: SimKatman[]
  /** Haritada hangi rota varyantları görünsün. */
  varyantlar: Record<SimVaryantId, boolean>

  secimYaz: (yama: Partial<SimSecim>) => void
  kosuBasladi: (isId: string, parmakIzi: string, onbellekten: boolean) => void
  katmanHazir: (isId: string, katman: SimKatman) => void
  varyantDegistir: (id: SimVaryantId) => void
  temizle: () => void
}

const BOS_SECIM: SimSecim = { alanId: null, katmanId: null, modelId: null, ...VARSAYILAN_AYAR }

/* Tatbikat AÇIK kalmalı: koşu sunucuda sürerken sayfa yenilenirse şerit
   kaybolup ekran normal akışa dönüyordu — kullanıcı tatbikatın bittiğini
   sanıyor, oysa koşu sürüyor ve hasar noktaları duruyordu (ölçüldü, 26 Eylül).
   Koşunun kimliği sekmenin `sessionStorage`'ında tutulur: yenilemeyi aşar,
   sekme kapanınca biter ve başka sekmeye/kullanıcıya sızmaz. Okuma ve yazma
   try/catch içinde: özel pencerede ya da depolama kapalıyken uygulama yine
   çalışır, yalnız yenileme sonrası mod kapanır. */
const ANAHTAR = 'quakemind.tatbikat.isId'

function saklananIsId(): string | null {
  try {
    return sessionStorage.getItem(ANAHTAR)
  } catch {
    return null
  }
}

function sakla(isId: string | null) {
  try {
    if (isId) sessionStorage.setItem(ANAHTAR, isId)
    else sessionStorage.removeItem(ANAHTAR)
  } catch {
    /* depolama yok: mod yenilemeyi aşmaz, uygulama etkilenmez */
  }
}

export const useSimulasyon = create<SimDurumu>((set) => ({
  secim: BOS_SECIM,
  isId: saklananIsId(),
  parmakIzi: null,
  onbellekten: false,
  // Yenileme sonrası katmanların hangisinin hazır olduğu bilinmez; sonuç ucu
  // kısmi sonuç döndüğü için ekran eldekini çizer ve eksik bölüm boş kalır.
  hazir: [],
  // Üçü de açık: sözleşme "üç rota" diyor (§5 madde 4). Kalabalık gelirse
  // kullanıcı kapatır; varsayılanı biz daraltmayız.
  varyantlar: { depremOncesi: true, kapanmali: true, riskli: true },

  secimYaz: (yama) => set((d) => ({ secim: { ...d.secim, ...yama } })),

  kosuBasladi: (isId, parmakIzi, onbellekten) => {
    sakla(isId)
    return set({
      isId,
      parmakIzi,
      onbellekten,
      // Önbellekten gelen koşuda katman mesajı beklenmez: sonuç hazırdır.
      hazir: onbellekten ? ['hasar', 'kapanma', 'rota', 'gorev'] : [],
    })
  },

  katmanHazir: (isId, katman) =>
    set((d) =>
      d.isId !== isId || d.hazir.includes(katman) ? d : { hazir: [...d.hazir, katman] },
    ),

  varyantDegistir: (id) =>
    set((d) => ({ varyantlar: { ...d.varyantlar, [id]: !d.varyantlar[id] } })),

  temizle: () => {
    sakla(null)
    return set({ isId: null, parmakIzi: null, onbellekten: false, hazir: [] })
  },
}))

/** Koşu var mı: TATBİKAT şeridi buna bakar (madde 1). */
export function kosuVar(d: SimDurumu): boolean {
  return d.isId !== null
}
