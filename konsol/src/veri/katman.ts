import { useQuery } from '@tanstack/react-query'
import { apiGet } from './istemci'

/* ---------------------------------------------------------------------------
   Haritanın başvuru katmanları (J-56): yol kapanmaları, depremler, fay hatları,
   toplanma alanları. Dördünün de anahtarı vardı ama hiçbiri bir şey çizmiyordu.

   Her yanıt kendi kaynağını taşır (kural 1): katman listesinde ve ipucunda
   verinin nereden geldiği bu alandan yazılır, koda gömülmez.

   Veri bölgeye göre değişmediği için bir kez istenir ve önbellekte kalır;
   yoklama yok (kural 4). Kapanmalar analiz bitince canlı akışla tazelenir.
--------------------------------------------------------------------------- */

export type KatmanKaynagi = {
  ad: string
  atif?: string
  lisans?: string
  aciklama?: string
  not?: string
  dosya?: string
  dosyaTarihi?: string
  /** Katalogdaki ilk ve son kaydın zamanı (ms) ve toplam kayıt sayısı. */
  ilk?: number
  son?: number
  kayit?: number
}

export type KatmanYaniti<T> = {
  kutu: [number, number, number, number]
  sayi: number
  kutudakiToplam?: number
  kaynak: KatmanKaynagi
  kayitlar: T[]
}

export type Kapanma = {
  /** Kapalı yol parçasının çizgisi [[enlem, boylam], …]; eski kayıtlarda yok (J-58). */
  cizgi?: [number, number][] | null
  id: string
  lon: number
  lat: number
  zaman: number
  kaynak: string
  analizId: string | null
}

export type Deprem = {
  id: string
  lon: number
  lat: number
  buyukluk: number
  derinlikKm: number | null
  zaman: number
  yer: string | null
  durum: string | null
}

export type Fay = { id: string; cizgi: [number, number][] }

export type ToplanmaAlani = {
  id: string
  lon: number
  lat: number
  ad: string | null
  adres: string | null
}

/** Katalogdan çizilen en küçük büyüklük; katman listesi bunu yazar. */
export const DEPREM_EN_AZ = 4

export function useKapanmalar(acik: boolean) {
  return useQuery({
    queryKey: ['katman', 'kapanmalar'],
    enabled: acik,
    queryFn: () => apiGet<KatmanYaniti<Kapanma>>('/api/katman/kapanmalar'),
  })
}

export function useDepremler(acik: boolean) {
  return useQuery({
    queryKey: ['katman', 'depremler', DEPREM_EN_AZ],
    enabled: acik,
    queryFn: () => apiGet<KatmanYaniti<Deprem>>('/api/katman/depremler', { enAz: DEPREM_EN_AZ }),
  })
}

export function useFaylar(acik: boolean) {
  return useQuery({
    queryKey: ['katman', 'faylar'],
    enabled: acik,
    queryFn: () => apiGet<KatmanYaniti<Fay>>('/api/katman/faylar'),
  })
}

export function useToplanmaAlanlari(acik: boolean) {
  return useQuery({
    queryKey: ['katman', 'toplanma'],
    enabled: acik,
    queryFn: () => apiGet<KatmanYaniti<ToplanmaAlani>>('/api/katman/toplanma'),
  })
}

/** "AFAD toplanma alanları listesi · 3.682 alan" gibi tek satır. */
export function kaynakSatiri(kaynak: KatmanKaynagi | undefined): string | null {
  if (!kaynak) return null
  return [kaynak.ad, kaynak.atif, kaynak.aciklama].filter(Boolean).join(' · ')
}
