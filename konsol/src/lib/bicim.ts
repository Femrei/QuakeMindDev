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
