import type { StyleSpecification } from 'maplibre-gl'

/* ---------------------------------------------------------------------------
   Harita stili bizim (ARAYUZ §11, MIMARI §8).
   Altlık kendi verimizden çizilir; dış karo servisine bağımlılık yok.

   Stil yalnız zeminden ibaret. Altlık (yollar, yapılar, su) yerel OSM
   kopyasından bölge bölge üretilmiş paketlerden deck.gl ile en alta çizilir
   (J-40, harita/katmanlar.ts → altlikKatmanlari); renkler token dosyasındaki
   --color-map-* değerleridir. Bölge sayısı büyüyünce aynı veri vektör karoya
   (MVT / PMTiles) taşınır ve buraya tek bir kaynak olarak eklenir (MIMARI §8).
--------------------------------------------------------------------------- */

export const ANTAKYA = { lon: 36.1614, lat: 36.2024, zoom: 12.4 }

export function haritaStili(): StyleSpecification {
  return {
    version: 8,
    name: 'quakemind-koyu',
    sources: {},
    layers: [
      {
        id: 'zemin',
        type: 'background',
        paint: { 'background-color': '#080A0E' },
      },
    ],
  }
}
