/* Tek SSE akışının mesaj tipleri (MIMARI.md §6).
   Sunucu yalnızca DEĞİŞİKLİK olduğunda mesaj gönderir; istemci yoklama yapmaz. */

export type CanliMesaj =
  | { tip: 'yeni-sos'; id: string; lon: number; lat: number; oncelik: string; zaman: number }
  | {
      tip: 'is-durumu'
      isId: string
      isTipi: string
      durum: 'kuyrukta' | 'calisiyor' | 'bitti' | 'hata'
      ilerleme?: number
      mesaj?: string
      hata?: string
    }
  | { tip: 'yeni-analiz'; kaynak: string; isId?: string; bolge?: string; sayi?: number }
  | { tip: 'isi-surumu'; surum: string; bolge?: string }
  | { tip: 'ekip-konumu'; ekipId: string; lon: number; lat: number }

export const MESAJ_TIPLERI: CanliMesaj['tip'][] = [
  'yeni-sos',
  'is-durumu',
  'yeni-analiz',
  'isi-surumu',
  'ekip-konumu',
]

/** Mesaj tipi → tazelenecek sorgu anahtarları. */
export const TAZELENECEK: Record<CanliMesaj['tip'], string[][]> = {
  'yeni-sos': [['sos'], ['ozet']],
  'is-durumu': [['isler']],
  'yeni-analiz': [['hasar'], ['ozet']],
  'isi-surumu': [['isi']],
  'ekip-konumu': [['ekipler']],
}
