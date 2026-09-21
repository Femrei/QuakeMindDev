import { useQuery } from '@tanstack/react-query'
import { apiGet, apiPost } from './istemci'
import type { Kutu } from '@/durum/secimDurumu'

/* ---------------------------------------------------------------------------
   Uydu hasar analizi — modelin koştuğu iş.

   Akış (MIMARI §3-§4, CLAUDE.md kural 3):
     1. POST /api/road_damage/analyze  → HTTP 202 + iş kimliği (model burada
        koşmaz, iş kuyruğa girer)
     2. ilerleme canlı akıştan gelir: `is-durumu` mesajları
     3. "bitti" mesajı gelince sonuç TEK istekle indirilir — yoklama yok
--------------------------------------------------------------------------- */

export const BOLGELER = [
  { id: 'antakya', ad: 'Antakya (Hatay)', lat: 36.202, lon: 36.161 },
  { id: 'maras', ad: 'Kahramanmaraş', lat: 37.57, lon: 36.93 },
  { id: 'antep', ad: 'Gaziantep', lat: 37.06, lon: 37.38 },
  { id: 'malatya', ad: 'Malatya', lat: 38.35, lon: 38.3 },
  { id: 'adiyaman', ad: 'Adıyaman', lat: 37.76, lon: 38.27 },
] as const

export type BolgeId = (typeof BOLGELER)[number]['id']

/** Görüntü kaynağı — sonucun künyesine yazılır (kural 1). */
export const KAYNAKLAR = [
  { id: 'google', ad: 'Güncel uydu görüntüsü' },
  { id: 'esri', ad: 'Esri Wayback (tarihli arşiv)' },
  { id: 'oam', ad: 'OpenAerialMap' },
] as const

export type KaynakId = (typeof KAYNAKLAR)[number]['id']

/* ---- Esri Wayback: tarihli uydu görüntüsü arşivi ----------------------- */

export type WaybackSurumu = { id: string; date: string; label: string }

/** Sürüm listesi neredeyse durağandır; SSE'den de tazelenmez, bir kez çekilir. */
export function useWaybackSurumleri() {
  return useQuery({
    queryKey: ['wayback-surumleri'],
    queryFn: async () => {
      const y = await apiGet<{ versions: WaybackSurumu[] }>('/api/road_damage/wayback_versions')
      return y.versions
    },
  })
}

/** 6 Şubat 2023 depremlerinden SONRAKİ ilk görüntü — çalışma alanımızın tarihi. */
export const DEPREM_TARIHI = '2023-02-06'

export function depremSonrasiSurum(surumler: WaybackSurumu[]): WaybackSurumu | undefined {
  // Liste yeniden eskiye sıralı gelir; deprem tarihinden sonraki EN ESKİ kayıt aranır.
  return [...surumler]
    .filter((s) => s.date >= DEPREM_TARIHI)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
}

export function depremOncesiSurum(surumler: WaybackSurumu[]): WaybackSurumu | undefined {
  return [...surumler]
    .filter((s) => s.date < DEPREM_TARIHI)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
}

/* ---- OpenAerialMap: tarih aralığıyla görüntü arama ---------------------- */

export type OamGoruntu = {
  id: string
  title: string
  provider: string
  /** ISO zaman damgası, ör. "2023-02-12T17:00:00.000Z" */
  date: string
  tms_url: string
  /** [batı, güney, doğu, kuzey] */
  bbox: [number, number, number, number]
}

export type OamAramaGirdisi = {
  lat: number
  lon: number
  baslangic: string
  bitis: string
  kutu?: Kutu | null
  /** Arama yalnız düğmeye basılınca koşar. */
  aktif: boolean
}

export function useOamArama(g: OamAramaGirdisi) {
  return useQuery({
    queryKey: ['oam-arama', g.lat, g.lon, g.baslangic, g.bitis, g.kutu?.join(',') ?? ''],
    enabled: g.aktif,
    queryFn: async () => {
      const parametreler: Record<string, string | number> = {
        latitude: g.lat,
        longitude: g.lon,
        dateStart: g.baslangic,
        dateEnd: g.bitis,
      }
      if (g.kutu) {
        parametreler.bboxWest = g.kutu[0]
        parametreler.bboxSouth = g.kutu[1]
        parametreler.bboxEast = g.kutu[2]
        parametreler.bboxNorth = g.kutu[3]
      }
      const y = await apiGet<{ images: OamGoruntu[] }>(
        '/api/road_damage/oam_search',
        parametreler,
      )
      return y.images
    },
  })
}

export type AnalizIstegi = {
  city: string
  latitude: number
  longitude: number
  source: KaynakId
  threshold: number
  damageBooster: number
  postProcessLevel: number
  radiusKm: number
  /** source === 'esri' ise hangi tarihli Wayback sürümü kullanılacak. */
  waybackId?: string
  /** source === 'oam' ise seçilen görüntünün karo adresi. */
  oamTileUrl?: string
  /** Haritada alan seçildiyse merkez+yarıçap yerine bu kutu analiz edilir. */
  bboxWest?: number
  bboxSouth?: number
  bboxEast?: number
  bboxNorth?: number
}

export type AnalizSonucu = {
  analysisId: string
  status: 'queued' | 'done' | 'error'
  city?: string
  /** Koşumun kendi künyesi: hangi kaynaktan, hangi arşiv sürümünden. */
  imagerySource?: string
  imageryLabel?: string
  waybackId?: string | null
  oamTitle?: string | null
  damageRate?: number
  openRoads?: number
  blockedRoads?: number
  openRoadPct?: number
  blockedRoadPct?: number
  closureRule?: string
  blockageRadiusM?: number
  threshold?: number
  damageBooster?: number
  recommendedAction?: string
  bounds?: { west: number; south: number; east: number; north: number }
  error?: string
}

/** İstek yolunda model koşmaz: uç 202 döner, iş kuyrukta işlenir. */
export function analizBaslat(istek: AnalizIstegi) {
  return apiPost<{ analysisId: string; status: string }>('/api/road_damage/analyze', istek)
}

/** Canlı akış "bitti" dediğinde bir kez çağrılır.

    Tam sonuç ~17 MB'dir; bunun ~16 MB'i tanı görselleri, ~1,7 MB'i geometri.
    Panel yalnız sayıları ve künyeyi gösterdiği için ikisini de istemiyoruz:
    özet ~1 KB iner, geometri ayrı ve önbelleklenebilir uçtan gelir. */
export function analizSonucuAl(isId: string) {
  return apiGet<AnalizSonucu>(`/api/road_damage/status/${isId}`, {
    gorseller: 0,
    segmentler: 0,
  })
}

/* ---- Analiz geometrisi: haritaya binen yollar ------------------------- */

/** Sunucu [enlem, boylam] sırasıyla gönderir (Leaflet düzeni); deck.gl
    [boylam, enlem] ister. Çevirme tek yerde yapılır. */
export type Yol = [number, number][]

export type AnalizSegmentleri = {
  analysisId: string
  bounds?: { west: number; south: number; east: number; north: number }
  kapali: Yol[]
  acik: Yol[]
}

function cevir(segmentler: [number, number][][] | undefined): Yol[] {
  return (segmentler ?? []).map((yol) => yol.map(([enlem, boylam]) => [boylam, enlem] as [number, number]))
}

/** Analiz bitince değişmeyen veri: bir kez çekilir, önbellekte kalır. */
export function useAnalizSegmentleri(isId: string | null) {
  return useQuery({
    queryKey: ['analiz-segmentleri', isId],
    enabled: !!isId,
    queryFn: async () => {
      const y = await apiGet<{
        analysisId: string
        bounds?: AnalizSegmentleri['bounds']
        safeRoadSegments: [number, number][][]
        blockedRoadSegments: [number, number][][]
      }>(`/api/road_damage/segments/${isId}`)
      return {
        analysisId: y.analysisId,
        bounds: y.bounds,
        kapali: cevir(y.blockedRoadSegments),
        acik: cevir(y.safeRoadSegments),
      } satisfies AnalizSegmentleri
    },
  })
}
