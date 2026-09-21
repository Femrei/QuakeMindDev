import type { KatmanId } from '@/durum/konsolDurumu'

/* ---------------------------------------------------------------------------
   Sayfa yok, MOD var (MIMARI §7 · ARAYUZ §8).
   Mod değişince harita yerinde kalır; yalnız paneller ve açık katmanlar değişir.
   Yeni mod eklemek = bu listeye bir satır eklemek.
--------------------------------------------------------------------------- */

export const MODLAR = [
  {
    id: 'genel',
    ad: 'Genel durum',
    ozet: 'Bütün kaynaklardan gelen hasar bilgisi tek haritada.',
    katmanlar: ['yapilar', 'yollar', 'hasarliYollar', 'isi', 'depremler', 'ekipler'],
  },
  {
    id: 'sos',
    ad: 'SOS kuyruğu',
    ozet: 'Bekleyen çağrılar, öncelik sırası ve en yakın ekip.',
    katmanlar: ['yollar', 'hasarliYollar', 'ekipler', 'toplanma'],
  },
  {
    id: 'hasar',
    ad: 'Hasar analizi',
    ozet: 'Uydu görüntüsünden yol kapanmalarını çıkaran analizi başlat ve izle.',
    katmanlar: ['analizSonucu', 'yollar', 'hasarliYollar'],
  },
  {
    id: 'kamera',
    ad: 'Kamera tespiti',
    ozet: 'Saha fotoğrafında çatlak ve yapı hasarı tespiti.',
    katmanlar: ['yollar', 'yapilar', 'isi'],
  },
  {
    id: 'metin',
    ad: 'Metin analizi',
    ozet: 'Türkçe ihbar metninden kategori, konum ve aciliyet çıkarımı.',
    katmanlar: ['yollar', 'isi', 'ekipler'],
  },
  {
    id: 'risk',
    ad: 'Deprem riski',
    ozet: 'Bölge bazlı risk skoru: sismik geçmiş, fay uzaklığı, son hareketlilik.',
    katmanlar: ['yollar', 'depremler', 'faylar'],
  },
  {
    id: 'yol',
    ad: 'Yol ve rota',
    ozet: 'Kapalı yollar ve ekiplerin geçebileceği güzergâh.',
    katmanlar: ['yollar', 'hasarliYollar', 'toplanma', 'ekipler'],
  },
] as const satisfies ReadonlyArray<{
  id: string
  ad: string
  ozet: string
  katmanlar: readonly KatmanId[]
}>

export type ModId = (typeof MODLAR)[number]['id']

export const VARSAYILAN_MOD: ModId = 'genel'

export function modBul(id: string | undefined) {
  return MODLAR.find((m) => m.id === id)
}
