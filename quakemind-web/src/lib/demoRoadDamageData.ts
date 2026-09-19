/**
 * Fake, purely client-side "simulation" result for the road-damage analysis
 * screen. Lets the page be demoed end-to-end (result card, route overlay,
 * heatmap) without a running backend / Segformer inference. Demo-only --
 * never sent to the API. Mirrors the approach used in demoMapData.ts.
 */
import type { RoadDamageResponse } from "@/lib/api";

interface CityCoords {
  lat: number;
  lng: number;
}

function jitter(value: number, spread: number): number {
  return value + (Math.random() - 0.5) * spread;
}

function makeSegments(center: CityCoords, count: number): number[][][] {
  return Array.from({ length: count }, () => {
    const startLat = jitter(center.lat, 0.03);
    const startLon = jitter(center.lng, 0.03);
    return [
      [startLat, startLon],
      [jitter(startLat, 0.01), jitter(startLon, 0.01)],
      [jitter(startLat, 0.015), jitter(startLon, 0.015)],
    ];
  });
}

export function generateDemoRoadDamageResult(city: string, center: CityCoords): RoadDamageResponse {
  const openRoads = 20 + Math.round(Math.random() * 15);
  const blockedRoads = 6 + Math.round(Math.random() * 10);
  const total = openRoads + blockedRoads;
  const damageRate = Math.round((blockedRoads / total) * 1000) / 1000;

  return {
    city,
    analysisId: `demo-road-${Date.now()}`,
    damageRate,
    openRoads,
    blockedRoads,
    openRoadPct: Math.round((openRoads / total) * 1000) / 10,
    blockedRoadPct: Math.round((blockedRoads / total) * 1000) / 10,
    logLines: [
      "[SİMÜLASYON] Bu sonuç örnek veriyle üretilmiştir, gerçek uydu analizi değildir.",
      `[SİMÜLASYON] ${city} için ${total} yol segmenti değerlendirildi.`,
      `[SİMÜLASYON] Hasar oranı: %${(damageRate * 100).toFixed(1)}`,
    ],
    recommendedAction:
      "Bu bir SİMÜLASYON çıktısıdır. Tespit edilen tıkalı yollardan kaçınılması, açık yollar üzerinden lojistik planlama yapılması önerilir.",
    bounds: {
      west: center.lng - 0.03,
      south: center.lat - 0.03,
      east: center.lng + 0.03,
      north: center.lat + 0.03,
    },
    safeRoadSegments: makeSegments(center, openRoads),
    blockedRoadSegments: makeSegments(center, blockedRoads),
    satelliteSource: "demo",
    satelliteTileUrl: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    satelliteAttribution: "Google (Simülasyon)",
  };
}

export function generateDemoHeatmapPoints(center: CityCoords, count = 40): [number, number, number][] {
  return Array.from({ length: count }, () => [
    jitter(center.lat, 0.04),
    jitter(center.lng, 0.04),
    Math.round(Math.random() * 100) / 100,
  ]);
}
