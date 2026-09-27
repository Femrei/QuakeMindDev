/** Türkçe biçimlendirme yardımcıları. Sayılar birimiyle yazılır (ARAYUZ §9). */

const saatBicim = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Istanbul',
})

const gunBicim = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/Istanbul',
})

const saatiBicim = new Intl.DateTimeFormat('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Istanbul',
})

/** 1234 → "1.234" */
export const sayi = (n: number) => n.toLocaleString('tr-TR')

/** Veri yoksa uydurulmaz, eksik olduğu söylenir (CLAUDE.md kural 1). */
export const sayiVeyaYok = (n: number | null | undefined) => (n == null ? '—' : sayi(n))

export const tarihSaat = (ms: number) => saatBicim.format(ms)
export const tarih = (ms: number) => gunBicim.format(ms)
export const saat = (ms: number) => saatiBicim.format(ms)

const yilliBicim = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Istanbul',
})

/** Olay verisi bu yıla ait olduğu için yıl yazılmaz. Ama deprem kataloğu 1933'e
    kadar gidiyor (J-56): 2023'teki bir kayıt "6 Şub 05:31" diye yazılınca bu yıl
    olmuş gibi okunuyordu. Başka yıldaki kayıtta yıl da yazılır. */
export const tarihSaatYilli = (ms: number) =>
  new Date(ms).getFullYear() === new Date().getFullYear() ? tarihSaat(ms) : yilliBicim.format(ms)

const gunUzunBicim = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "2023-02-23" → "23 Şubat 2023" */
export const gunMetni = (isoGun: string) => gunUzunBicim.format(new Date(`${isoGun}T00:00:00Z`))

/** Konum doğruluğu: "±12 m" · "±1,2 km" */
export const dogruluk = (m: number) =>
  m < 1000 ? `±${Math.round(m)} m` : `±${(m / 1000).toFixed(1).replace('.', ',')} km`

/* Saatin ardından gelen ek, okunuşun son sözcüğüne uyar: "14.02'de" (iki),
   "14.05'te" (beş), "14.30'da" (otuz), "14.40'ta" (kırk), "14.00'te" (dört). */
const BIRLER_EKI = ['', 'de', 'de', 'te', 'te', 'te', 'da', 'de', 'de', 'da'] // bir…dokuz
const ONLAR_EKI = ['da', 'da', 'de', 'da', 'ta', 'de'] // sıfır, on, yirmi, otuz, kırk, elli

function saatEki(ms: number): string {
  const [sa, dk] = saat(ms).split(':').map(Number)
  const n = dk === 0 ? sa : dk
  return n % 10 ? BIRLER_EKI[n % 10] : ONLAR_EKI[Math.floor(n / 10)]
}

/** "14:05'te", "14:02'de" */
export const saatte = (ms: number) => `${saat(ms)}'${saatEki(ms)}`

/** "14:05'ten", "14:02'den" */
export const saatten = (ms: number) => `${saat(ms)}'${saatEki(ms)}n`

/** Tahmini süre: "6 dk", "2 sa 26 dk", "3 sa". */
export function sureMetni(dk: number): string {
  if (dk < 60) return `${dk} dk`
  const sa = Math.floor(dk / 60)
  return dk % 60 ? `${sa} sa ${dk % 60} dk` : `${sa} sa`
}

/** "850 m" · "1,4 km" (en yakın 10 m'ye yuvarlanır). */
export function mesafe(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`
}

/** Şimdiye göre geçen süre: "az önce", "12 dk önce", "3 sa önce", "2 gün önce". */
export function once(ms: number, simdi: number): string {
  const dk = Math.floor((simdi - ms) / 60000)
  if (dk < 1) return 'az önce'
  if (dk < 60) return `${dk} dk önce`
  const sa = Math.floor(dk / 60)
  if (sa < 48) return `${sa} sa önce`
  return `${Math.floor(sa / 24)} gün önce`
}

/** Bekleme süresi, Türkçe ekiyle: "12 dakikadır", "1 saat 59 dakikadır",
    "3 saattir", "2 gündür". Bekleme kısaltılmaz: 1 sa 59 dk "1 saattir"
    yazılmaz. Bir dakikadan azsa null (çağıran "yeni geldi" yazar). */
export function suredir(ms: number, simdi: number): string | null {
  const dk = Math.floor((simdi - ms) / 60000)
  if (dk < 1) return null
  if (dk < 60) return `${dk} dakikadır`
  if (dk < 24 * 60) return dk % 60 ? `${Math.floor(dk / 60)} saat ${dk % 60} dakikadır` : `${dk / 60} saattir`
  return `${Math.floor(dk / (24 * 60))} gündür`
}

/** "6 saat", "45 dakika", "3 gün" */
export function sure(ms: number): string {
  const dk = Math.round(ms / 60000)
  if (dk < 60) return `${dk} dakika`
  const sa = Math.round(dk / 60)
  if (sa < 48) return `${sa} saat`
  return `${Math.round(sa / 24)} gün`
}

/** Ağırlık etiketi: ×1,0 · −0,6 · kapalı */
export function agirlik(v: number): string {
  if (Math.abs(v) < 0.05) return 'kapalı'
  return (v < 0 ? '−' : '×') + Math.abs(v).toFixed(1).replace('.', ',')
}
