import { create } from 'zustand'

/** Metin ve kamera çözümlemelerinin son sonucu: sol panel gönderir, sağ panel
    gösterir. Sorgu değil tek seferlik iş olduğu için ayrı bir depoda durur. */

export type MetinSonucu = {
  kategori: string
  konum: [number, number] | null
  konum_metin: string | null
  konum_adaylari: string[]
  aciliyet: number
  guven_skoru: number
  nlpLocationId?: string
}

type CozumlemeDurumu = {
  metin: { girdi: string; sonuc: MetinSonucu; zaman: number } | null
  metinYaz: (girdi: string, sonuc: MetinSonucu) => void
  /** Risk modunda seçili bölge: iki panel aynı seçimi paylaşır. */
  riskBolge: string | null
  riskBolgeSec: (id: string) => void
}

/** Kamera tespitleri — sunucu biçimi: güven yüzde (0-100), severity metni. */
export type KameraTespiti = {
  label: string
  confidence: number
  model: string
  box: number[]
  severity: 'CRITICAL' | 'SAFE'
}

export type KameraSonucu = {
  status: string
  modelType: string
  activeModels: string[]
  detections: KameraTespiti[]
  annotatedImage: string | null
  advice: string
  timestamp: string
}

type KameraDurumu = { sonuc: KameraSonucu | null; yaz: (s: KameraSonucu) => void }

export const useKameraCozumleme = create<KameraDurumu>((set) => ({
  sonuc: null,
  yaz: (sonuc) => set({ sonuc }),
}))

export const useCozumleme = create<CozumlemeDurumu>((set) => ({
  metin: null,
  metinYaz: (girdi, sonuc) => set({ metin: { girdi, sonuc, zaman: Date.now() } }),
  riskBolge: null,
  riskBolgeSec: (id) => set({ riskBolge: id }),
}))
