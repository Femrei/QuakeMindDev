/* Harita renkleri de token dosyasından gelir (ARAYUZ §6, tasarim/token.css):
   deck.gl RGB dizisi ister, bu yüzden CSS değişkeni bir kez okunup çevrilir.
   Dönen dizi aynı başvurudur; deck.gl sabit rengi değişmemiş sayar. */

const onbellek = new Map<string, [number, number, number]>()

export function tokenRenk(ad: `--color-${string}`): [number, number, number] {
  const kayitli = onbellek.get(ad)
  if (kayitli) return kayitli
  const deger = getComputedStyle(document.documentElement).getPropertyValue(ad).trim()
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(deger)
  if (!m) return [128, 128, 128] // stil yüklenmeden çağrıldıysa önbelleğe yazılmaz
  const rgb: [number, number, number] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
  onbellek.set(ad, rgb)
  return rgb
}

const pxOnbellek = new Map<string, number>()

/** Yazı boyu token'ı (ör. `--text-small` = 12px) piksel sayısı olarak. */
export function tokenPx(ad: `--text-${string}`): number {
  const kayitli = pxOnbellek.get(ad)
  if (kayitli) return kayitli
  const px = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(ad))
  if (!Number.isFinite(px)) return 12 // stil yüklenmeden çağrıldıysa önbelleğe yazılmaz
  pxOnbellek.set(ad, px)
  return px
}
