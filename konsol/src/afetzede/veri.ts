import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/veri/istemci'
import type { Ihtiyac, SosCagrisi } from '@/veri/sorgular'

/* ---------------------------------------------------------------------------
   Afetzede ekranının verisi (J-43). Konsolun sorgularından ayrı durur: bu yol
   harita motorunu ve analiz modüllerini indirmez (MIMARI §7).

   Tazeleme yalnız canlı akışla olur (kural 4): kendi çağrının durumu değişince
   "yeni-sos", koordinasyon bildirim yayınlayınca "bildirim" mesajı gelir.
--------------------------------------------------------------------------- */

const GUN_MS = 86_400_000

/** Son 7 günün çağrıları. Afetzede yalnız kendininkini alır; bu sınır sunucuda. */
export function useCagrilarim() {
  return useQuery({
    queryKey: ['sos', 'kendi'],
    // Pencere istek anında hesaplanır: anahtar sabit kaldığı için "yeni-sos"
    // mesajı bu sorguyu da tazeler (önek ['sos']).
    queryFn: () => apiGet<SosCagrisi[]>('/api/sos', { baslangic: Date.now() - 7 * GUN_MS }),
  })
}

export type CagriIstegi = {
  lon: number
  lat: number
  oncelik: SosCagrisi['oncelik']
  kisiSayisi: number
  ihtiyaclar?: Ihtiyac[]
  metin?: string
  mahalle?: string
  konumKaynagi: 'gps' | 'mahalle'
  konumDogrulukM?: number
}

export function useCagriGonder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (govde: CagriIstegi) => apiPost<SosCagrisi>('/api/sos', govde),
    // Hata olsa da liste tazelenir: yanıt yolda kaybolduysa çağrı sunucuda
    // açılmış olabilir, afetzede onu listede görür ve ikinci kez göndermez.
    onSettled: () => qc.invalidateQueries({ queryKey: ['sos'] }),
  })
}

export type Bildirim = {
  id: string
  baslik: string
  metin: string
  /** "critical" | "warning" | "info" */
  onem: string
  konum: string | null
  buyukluk: number | null
  /** epoch ms; eski kayıtlarda yok */
  zaman: number | null
}

export function useBildirimler() {
  return useQuery({
    queryKey: ['bildirimler'],
    queryFn: () => apiGet<Bildirim[]>('/api/bildirimler/aktif'),
  })
}

/** Altlığı üretilmiş bölgelerin yer adları: konum alınamazsa mahalle seçtirilir. */
export type Yer = {
  ad: string
  tur: 'city' | 'town' | 'village' | 'suburb' | 'neighbourhood' | 'quarter'
  lon: number
  lat: number
  bolge: string
  bolgeAd: string
}

export function useYerler(acik: boolean) {
  return useQuery({
    queryKey: ['altlik-yerler'],
    enabled: acik,
    queryFn: () => apiGet<{ yerler: Yer[] }>('/api/altlik/yerler').then((y) => y.yerler),
  })
}

export type ToplanmaAlani = {
  name: string
  toplanma_alani?: string
  il?: string
  ilce?: string
  mahalle?: string
  lat: number
  lon: number
  /** Kuş uçuşu uzaklık, metre (sunucu haversine). */
  dist_m: number
}

type ToplanmaYaniti = {
  records: ToplanmaAlani[]
  activeDataSource: string
}

/**
 * En yakın toplanma alanları. `allowOnlineFallback=false`: sunucu dış rota
 * servisine (OSRM) kullanıcının konumunu göndermez (J-43). Anahtar ~100 m'ye
 * yuvarlanır; konum biraz oynayınca istek tekrarlanmaz.
 */
export function useToplanmaAlanlari(konum: { lon: number; lat: number } | null) {
  const anahtar = konum ? [konum.lat.toFixed(3), konum.lon.toFixed(3)] : ['yok']
  return useQuery({
    queryKey: ['toplanma', ...anahtar],
    enabled: !!konum,
    queryFn: () =>
      apiGet<ToplanmaYaniti>('/api/road_damage/assembly', {
        latitude: konum!.lat,
        longitude: konum!.lon,
        radiusKm: 10,
        allowOnlineFallback: 'false',
      }),
  })
}
