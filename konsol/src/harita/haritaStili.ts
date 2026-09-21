import type { StyleSpecification } from 'maplibre-gl'

/* ---------------------------------------------------------------------------
   Harita stili bizim (ARAYUZ §11, MIMARI §8).
   Altlık kendi verimizden çizilir; dış karo servisine bağımlılık yok.

   Şu an kendi karo uçlarımız hazır olmadığı için stil yalnız zeminden ibaret:
   harita boş ve sönük açılır, veri katmanları deck.gl ile üstüne biner.
   Karo ucu geldiğinde buraya tek bir vektör kaynak + yol hiyerarşisi eklenir;
   renkler token dosyasındaki --color-map-* değerleridir.
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
