import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from './istemci'
import { dogruluk } from '@/lib/bicim'

/* ---------------------------------------------------------------------------
   Ortak çıktı sözleşmesi (CLAUDE.md kural 2):
   (konum, hasar/aciliyet skoru, güven, zaman damgası, kaynak tipi)
   Arayüz modellere değil bu sözleşmeye bağlanır.

   Uçlar henüz bağlanmadı. Bu yüzden sorgular gerçekten istek atar; uç yoksa
   hata döner ve paneller "veri yok" yazar. Uydurma veri üretilmez (kural 1).
--------------------------------------------------------------------------- */

export type KaynakTipi = 'uydu' | 'kamera' | 'metin' | 'sos'

export type HasarNoktasi = {
  id: string
  lon: number
  lat: number
  skor: number
  guven: number
  zaman: number
  kaynak: KaynakTipi
}

export type SosDurumu = 'bekliyor' | 'atandi' | 'kapandi'

/** Aciliyet adı ve rozet tonu: liste, harita ipucu ve panel aynı adı kullanır. */
export const ONCELIK_ADI = { kritik: 'Kritik', yuksek: 'Yüksek', orta: 'Orta' } as const
export const ONCELIK_TON = { kritik: 'crit', yuksek: 'high', orta: 'mid' } as const

/** Sözleşmedeki kaynak tipinin görünen adı. */
export const KAYNAK_ADI = {
  uydu: 'Uydu hasar tespiti',
  sos: 'SOS çağrısı',
  kamera: 'Kamera tespiti',
  metin: 'Metin ihbarı',
} as const

/** Afetzedenin bildirebildiği ihtiyaçlar; sunucudaki `IHTIYACLAR` ile aynı sıra. */
export const IHTIYAC_ADI = {
  su: 'Su',
  gida: 'Gıda',
  barinma: 'Barınma',
  isinma: 'Isınma',
  ilac: 'İlaç, ilk yardım',
  tuvalet: 'Tuvalet, hijyen',
} as const
export type Ihtiyac = keyof typeof IHTIYAC_ADI

export type SosCagrisi = {
  id: string
  lon: number
  lat: number
  oncelik: 'kritik' | 'yuksek' | 'orta'
  durum: SosDurumu
  zaman: number
  mahalle?: string | null
  metin?: string | null
  ekipId?: string | null
  atamaZamani?: number | null
  /* Afetzede ekranından gelen yapılandırılmış bilgi (J-43); eski kayıtlarda yok. */
  kisiSayisi?: number | null
  ihtiyaclar?: Ihtiyac[] | null
  /** "gps": cihaz konumu · "mahalle": mahalle merkezi, yaklaşık konum. */
  konumKaynagi?: 'gps' | 'mahalle' | null
  konumDogrulukM?: number | null
}

/**
 * Afetzede ekranından gelen bilgi, ekip ekranlarında tek biçimde (J-43).
 * `yaklasik` doluysa konum mahalle merkezidir: ekip bunu görmeden gitmemeli.
 */
export function sosEkBilgi(c: SosCagrisi): { kisiIhtiyac: string | null; konum: string | null; yaklasik: boolean } {
  const kisiIhtiyac =
    [
      c.kisiSayisi ? `${c.kisiSayisi} kişi` : null,
      c.ihtiyaclar?.length ? c.ihtiyaclar.map((i) => IHTIYAC_ADI[i] ?? i).join(', ') : null,
    ]
      .filter(Boolean)
      .join(' · ') || null
  const yaklasik = c.konumKaynagi === 'mahalle'
  const konum = yaklasik
    ? 'Yaklaşık konum: mahalle merkezi (afetzede konum veremedi)'
    : c.konumKaynagi === 'gps' && c.konumDogrulukM != null
      ? `Cihaz konumu, ${dogruluk(c.konumDogrulukM)}`
      : null
  return { kisiIhtiyac, konum, yaklasik }
}

export type Ekip = {
  id: string
  ad: string
  lon: number
  lat: number
  durum: string
  gorev?: string | null
  guncellendi?: number
}

type Aralik = [number, number]

export function useHasarNoktalari([t0, t1]: Aralik) {
  return useQuery({
    queryKey: ['hasar', t0, t1],
    queryFn: () => apiGet<HasarNoktasi[]>('/api/hasar-noktalari', { baslangic: t0, bitis: t1 }),
  })
}

export function useSosCagrilari([t0, t1]: Aralik) {
  return useQuery({
    queryKey: ['sos', t0, t1],
    queryFn: () => apiGet<SosCagrisi[]>('/api/sos', { baslangic: t0, bitis: t1 }),
  })
}

export function useEkipler() {
  return useQuery({ queryKey: ['ekipler'], queryFn: () => apiGet<Ekip[]>('/api/ekipler') })
}

/** Çağrıya en yakın ekip — hesap sunucuda yapılır, istemci mesafe hesaplamaz. */
export function useEnYakinEkip(sosId: string | null) {
  return useQuery({
    queryKey: ['en-yakin-ekip', sosId],
    enabled: !!sosId,
    queryFn: () =>
      apiGet<{ ekip: Ekip | null; mesafeM: number | null }>(`/api/sos/${sosId}/en-yakin-ekip`),
  })
}

/** Ekip sevki. Mükerrer sevki sunucu 409 ile reddeder. */
export function useSosAta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sosId, ekipId }: { sosId: string; ekipId: string }) =>
      apiPost<SosCagrisi>(`/api/sos/${sosId}/ata`, { ekipId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sos'] })
      void qc.invalidateQueries({ queryKey: ['ozet'] })
      void qc.invalidateQueries({ queryKey: ['ekipler'] })
    },
  })
}

/* ---- Isı haritası -------------------------------------------------------
   Izgara sunucuda üretilir; ölçek MUTLAKtır (istek başına maksimuma göre
   normalize edilmez), bu yüzden aynı yer harita kaydırılınca renk
   değiştirmez. İstemci ikinci kez bulanıklaştırma YAPMAZ (MIMARI §5). */

export type IsiIzgarasi = {
  /** [lat, lon, yoğunluk 0-1] */
  points: [number, number, number][]
  bounds: { west: number; south: number; east: number; north: number }
  olcek: { tip: string; referans: number }
  generatedFrom: { totalReports: number; bySource: Record<string, number>; source: string }
}

export function useIsiIzgarasi(
  merkez: { lon: number; lat: number },
  yaricapKm: number,
  [t0, t1]: Aralik,
  kaynak: KaynakTipi,
  acik: boolean,
) {
  return useQuery({
    queryKey: ['isi', kaynak, merkez.lon, merkez.lat, yaricapKm, t0, t1],
    enabled: acik,
    queryFn: () =>
      apiGet<IsiIzgarasi>('/api/road_damage/heatmap', {
        latitude: merkez.lat,
        longitude: merkez.lon,
        radiusKm: yaricapKm,
        baslangic: t0,
        bitis: t1,
        kaynak,
      }),
  })
}

/** Bölge özeti: KPI sayıları sunucuda hesaplanır, istemci hazır olanı gösterir. */
export type Ozet = {
  yikikYapi: number
  hasarliYapi: number
  hasarliYol: number
  bekleyenSos: number
  atananSos: number
  kapananSos: number
  /** Kanal başına nokta sayısı: ısı panelindeki sayılar buradan gelir. */
  kaynakSayilari: Partial<Record<KaynakTipi, number>>
}

export function useOzet([t0, t1]: Aralik) {
  return useQuery({
    queryKey: ['ozet', t0, t1],
    queryFn: () => apiGet<Ozet>('/api/ozet', { baslangic: t0, bitis: t1 }),
  })
}
