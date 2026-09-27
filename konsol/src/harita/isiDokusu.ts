import type { IsiIzgarasi } from '@/veri/sorgular'
import type { KanalId } from '@/durum/konsolDurumu'

/* ---------------------------------------------------------------------------
   Isı dokusu: kanal ızgaralarını ağırlıklarla karıştırıp tek bir görüntüye
   çevirir (MIMARI §5).

   · Sunucu her kanalın ızgarasını AYRI üretir; karışım burada yapılır, bu
     yüzden ağırlık değişince sunucuya istek gitmez.
   · İstemci ikinci kez bulanıklaştırma YAPMAZ; gelen değer olduğu gibi
     renklendirilir. Bulanıklık tanımı sunucuda kalır.
   · Negatif ağırlık desteklenir: "uydu yıkık gösteriyor ama çağrı yok"
     sorusu böyle sorulur.
--------------------------------------------------------------------------- */

/** ARAYUZ §3'teki ısı skalası (algısal, koyu zemine göre). */
const RAMP: Array<[number, [number, number, number, number]]> = [
  [0.0, [16, 19, 26, 0]],
  [0.12, [43, 11, 77, 150]],
  [0.34, [123, 35, 130, 196]],
  [0.56, [196, 63, 102, 220]],
  [0.78, [240, 115, 63, 235]],
  [1.0, [252, 217, 104, 245]],
]

function renk(t: number): [number, number, number, number] {
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i][0]) {
      const [a0, a] = RAMP[i - 1]
      const [b0, b] = RAMP[i]
      const f = (t - a0) / (b0 - a0)
      return [0, 1, 2, 3].map((j) => a[j] + (b[j] - a[j]) * f) as [number, number, number, number]
    }
  }
  return RAMP[RAMP.length - 1][1]
}

export type KanalIzgarasi = { kanal: KanalId; veri: IsiIzgarasi | undefined; agirlik: number }

export type IsiDokusu = {
  goruntu: ImageData
  sinirlar: [number, number, number, number]
  /** Karışıma giren kanal sayısı ve toplam nokta (panelde yazmak için). */
  kanalSayisi: number
  noktaSayisi: number
}

/** Seyrek [lat, lon, değer] listesini ızgara dizisine açar. */
function izgaraya(veri: IsiIzgarasi, boyut: number): Float32Array {
  const { west, south, east, north } = veri.bounds
  const izgara = new Float32Array(boyut * boyut)
  const lonAdim = (east - west) / (boyut - 1)
  const latAdim = (north - south) / (boyut - 1)
  for (const [lat, lon, deger] of veri.points) {
    const x = Math.round((lon - west) / lonAdim)
    const y = Math.round((lat - south) / latAdim)
    if (x < 0 || y < 0 || x >= boyut || y >= boyut) continue
    izgara[y * boyut + x] = deger
  }
  return izgara
}

export function isiDokusuKur(kanallar: KanalIzgarasi[], boyut = 100): IsiDokusu | null {
  const dolu = kanallar.filter((k) => k.veri && k.veri.points.length > 0)
  if (!dolu.length) return null

  const ilk = dolu[0].veri!
  const { west, south, east, north } = ilk.bounds

  const karisim = new Float32Array(boyut * boyut)
  let noktaSayisi = 0
  for (const { veri, agirlik } of dolu) {
    if (!veri || Math.abs(agirlik) < 0.05) continue
    noktaSayisi += veri.generatedFrom.totalReports
    const izgara = izgaraya(veri, boyut)
    for (let i = 0; i < karisim.length; i++) karisim[i] += agirlik * izgara[i]
  }

  const goruntu = new ImageData(boyut, boyut)
  for (let y = 0; y < boyut; y++) {
    for (let x = 0; x < boyut; x++) {
      // Sunucu ızgarası güneyden kuzeye; görüntü kuzeyden güneye.
      const deger = karisim[(boyut - 1 - y) * boyut + x]
      const i = (y * boyut + x) * 4
      if (deger <= 0.03) {
        goruntu.data[i + 3] = 0
        continue
      }
      const [r, g, b, a] = renk(Math.min(1, deger))
      goruntu.data[i] = r
      goruntu.data[i + 1] = g
      goruntu.data[i + 2] = b
      goruntu.data[i + 3] = a
    }
  }

  return {
    goruntu,
    sinirlar: [west, south, east, north],
    kanalSayisi: dolu.filter((k) => Math.abs(k.agirlik) >= 0.05).length,
    noktaSayisi,
  }
}
