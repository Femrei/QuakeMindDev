import type { YerTuru } from './veri'

/* Yer türlerinin adı, harfi ve rengi: harita, lejant ve liste aynı tanımı
   kullanır. Renk token dosyasından (--color-yer-*); kırmızı, turuncu ve sarı
   aciliyete ayrıldığı için yok. Renk tek başına anlam taşımasın diye her
   türün bir harfi var (ARAYUZ §12). */

export const YER_TURLERI: Record<
  YerTuru,
  {
    ad: string
    cogul: string
    harf: string
    renk: `--color-${string}`
    /* Tailwind sınıfları açık yazılır ki derleyici bulsun. */
    nokta: string
    kenar: string
    soluk: string
  }
> = {
  toplanma: {
    ad: 'Toplanma alanı', cogul: 'Toplanma', harf: 'T', renk: '--color-yer-toplanma',
    nokta: 'bg-yer-toplanma', kenar: 'border-yer-toplanma', soluk: 'bg-yer-toplanma/15',
  },
  hastane: {
    ad: 'Hastane', cogul: 'Hastane', harf: 'H', renk: '--color-yer-saglik',
    nokta: 'bg-yer-saglik', kenar: 'border-yer-saglik', soluk: 'bg-yer-saglik/15',
  },
  saglik: {
    ad: 'Sağlık merkezi', cogul: 'Sağlık merkezi', harf: 'S', renk: '--color-yer-saglik',
    nokta: 'bg-yer-saglik', kenar: 'border-yer-saglik', soluk: 'bg-yer-saglik/15',
  },
  eczane: {
    ad: 'Eczane', cogul: 'Eczane', harf: 'E', renk: '--color-yer-eczane',
    nokta: 'bg-yer-eczane', kenar: 'border-yer-eczane', soluk: 'bg-yer-eczane/15',
  },
  itfaiye: {
    ad: 'İtfaiye', cogul: 'İtfaiye', harf: 'İ', renk: '--color-yer-guvenlik',
    nokta: 'bg-yer-guvenlik', kenar: 'border-yer-guvenlik', soluk: 'bg-yer-guvenlik/15',
  },
  polis: {
    ad: 'Polis', cogul: 'Polis', harf: 'P', renk: '--color-yer-guvenlik',
    nokta: 'bg-yer-guvenlik', kenar: 'border-yer-guvenlik', soluk: 'bg-yer-guvenlik/15',
  },
}

export const YER_SIRASI: YerTuru[] = ['toplanma', 'hastane', 'saglik', 'eczane', 'itfaiye', 'polis']

/** Haritada açılışta görünenler; eczane çok sayıda olduğu için isteğe bağlı. */
export const VARSAYILAN_ACIK: YerTuru[] = ['toplanma', 'hastane', 'saglik']

/** "Hastane" ya da adsızsa "Adsız hastane". */
export function yerAdi(y: { ad: string | null; tur: YerTuru }): string {
  return y.ad ?? `Adsız ${YER_TURLERI[y.tur].ad.toLocaleLowerCase('tr-TR')}`
}
