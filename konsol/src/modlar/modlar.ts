import type { KatmanId } from '@/durum/konsolDurumu'

/* ---------------------------------------------------------------------------
   Sayfa yok, MOD var (MIMARI §7 · ARAYUZ §8).
   Mod değişince harita yerinde kalır; yalnız paneller ve açık katmanlar değişir.
   Yeni mod eklemek = bu listeye bir satır eklemek.

   `grup`: üst çubukta "ana" modlar sekme, "analiz" modları tek açılır menüde
   (J-56; kullanıcı: "üst menüde bir sürü alan var").
--------------------------------------------------------------------------- */

export const MODLAR = [
  {
    id: 'genel',
    grup: 'ana',
    ad: 'Genel durum',
    ozet: 'Bütün kaynaklardan gelen hasar bilgisi ve afetzede ihbarları tek haritada.',
    katmanlar: ['yapilar', 'yollar', 'hasarliYollar', 'isi', 'depremler', 'ekipler', 'ihbarlar'],
  },
  {
    id: 'sos',
    grup: 'ana',
    ad: 'SOS kuyruğu',
    ozet: 'Ekip bekleyen çağrılar, kime kim gidiyor, ekip gönderme.',
    katmanlar: ['yollar', 'hasarliYollar', 'ekipler', 'toplanma'],
  },
  {
    id: 'ekipler',
    grup: 'ana',
    ad: 'Ekipler',
    ozet: 'Hangi ekip nerede, neye gidiyor, kaç kişiyle; ekip tanımı ve bağlı hesaplar.',
    katmanlar: ['yollar', 'ekipler', 'ihbarlar', 'toplanma'],
  },
  {
    id: 'ihtiyac',
    grup: 'ana',
    ad: 'İhtiyaç talepleri',
    ozet: 'Afetzedelerin su, gıda, barınma gibi ihtiyaç talepleri; nerede ne eksik.',
    katmanlar: ['yollar', 'toplanma', 'ekipler', 'ihbarlar'],
  },
  {
    id: 'bildirim',
    grup: 'ana',
    ad: 'Acil bildirim',
    ozet: 'Afetzede ekranlarına acil durum bildirimi yayınla, yanlış olanı geri çek.',
    katmanlar: ['yollar', 'isi', 'ekipler'],
  },
  {
    id: 'hasar',
    grup: 'analiz',
    ad: 'Hasar analizi',
    ozet: 'Uydu görüntüsünden yol kapanmalarını çıkaran analizi başlat ve izle.',
    katmanlar: ['analizSonucu', 'yollar', 'hasarliYollar'],
  },
  {
    id: 'kamera',
    grup: 'analiz',
    ad: 'Kamera tespiti',
    ozet: 'Afetzedelerin hasar fotoğrafları ve saha fotoğrafında çatlak, yapı hasarı tespiti.',
    katmanlar: ['yollar', 'yapilar', 'isi', 'ihbarlar'],
  },
  {
    id: 'metin',
    grup: 'analiz',
    ad: 'Metin analizi',
    ozet: 'Afetzedelerin yazılı ihbarları; Türkçe metinden kategori, konum ve aciliyet.',
    katmanlar: ['yollar', 'isi', 'ekipler', 'ihbarlar'],
  },
  {
    id: 'risk',
    grup: 'analiz',
    ad: 'Deprem riski',
    ozet: 'Bölge bazlı risk skoru: sismik geçmiş, fay uzaklığı, son hareketlilik.',
    katmanlar: ['yollar', 'depremler', 'faylar'],
  },
  {
    id: 'yol',
    grup: 'analiz',
    ad: 'Yol ve rota',
    ozet: 'Kapalı yollar ve ekiplerin geçebileceği güzergâh.',
    katmanlar: ['yollar', 'hasarliYollar', 'toplanma', 'ekipler'],
  },
] as const satisfies ReadonlyArray<{
  id: string
  grup: 'ana' | 'analiz'
  ad: string
  ozet: string
  katmanlar: readonly KatmanId[]
}>

export type ModId = (typeof MODLAR)[number]['id']

export const VARSAYILAN_MOD: ModId = 'genel'

export function modBul(id: string | undefined) {
  return MODLAR.find((m) => m.id === id)
}
