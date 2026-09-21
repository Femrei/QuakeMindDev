/* Tek SSE akışının mesaj tipleri (MIMARI.md §6).
   Sunucu yalnızca DEĞİŞİKLİK olduğunda mesaj gönderir; istemci yoklama yapmaz. */

export type CanliMesaj =
  | {
      tip: 'yeni-sos'
      id: string
      zaman: number
      /* Konsol rollerine tam kayıt gider. Afetzedeye yalnız KENDİ çağrısının
         kimliği ve durumu gider; konum ve öncelik hiç gitmez (J-42). */
      lon?: number
      lat?: number
      oncelik?: string
      durum?: 'bekliyor' | 'atandi' | 'kapandi'
    }
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
  /** Koordinasyonun yayınladığı acil durum bildirimi (herkese gider). */
  | { tip: 'bildirim'; id: string; baslik: string; onem: string; zaman: number }

export const MESAJ_TIPLERI: CanliMesaj['tip'][] = [
  'yeni-sos',
  'is-durumu',
  'yeni-analiz',
  'isi-surumu',
  'ekip-konumu',
  'bildirim',
]

/** Mesaj tipi → tazelenecek sorgu anahtarları. */
export const TAZELENECEK: Record<CanliMesaj['tip'], string[][]> = {
  'yeni-sos': [['sos'], ['ozet']],
  'is-durumu': [['isler']],
  'yeni-analiz': [['hasar'], ['ozet']],
  'isi-surumu': [['isi']],
  'ekip-konumu': [['ekipler']],
  bildirim: [['bildirimler']],
}
