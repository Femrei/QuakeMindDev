/**
 * Fake, purely client-side "simulation" dataset for the unified command map.
 * Lets us exercise every layer (SOS, NLP, risk/quakes, road damage, assembly
 * areas, combined heatmap) as if long-running production data were already
 * loaded, without touching the backend. Demo-only -- never sent to the API.
 */
import type { NlpIncident, RoadDamageAnalysisLayer } from "@/context/MapLayersContext";
import type { AssemblyRecord, RiskFaultLine, RiskMapEvent, RiskResponse, SOSAlert } from "@/lib/api";

interface DemoRegion {
  city: string;
  lat: number;
  lon: number;
}

// Yüksek deprem riskli / son büyük olayların yaşandığı bölgeler.
const REGIONS: DemoRegion[] = [
  { city: "İstanbul", lat: 41.0082, lon: 28.9784 },
  { city: "İzmir", lat: 38.4237, lon: 27.1428 },
  { city: "Kahramanmaraş", lat: 37.5753, lon: 36.9228 },
  { city: "Adıyaman", lat: 37.7648, lon: 38.2786 },
  { city: "Malatya", lat: 38.3552, lon: 38.3095 },
  { city: "Hatay", lat: 36.4018, lon: 36.3498 },
  { city: "Van", lat: 38.4891, lon: 43.4089 },
  { city: "Elazığ", lat: 38.681, lon: 39.2264 },
];

function jitter(value: number, spread: number): number {
  return value + (Math.random() - 0.5) * spread;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgoIso(maxDays: number): string {
  const ms = Date.now() - Math.random() * maxDays * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

export interface DemoDataset {
  sosAlerts: SOSAlert[];
  nlpIncidents: NlpIncident[];
  riskResult: RiskResponse;
  roadDamageAnalyses: RoadDamageAnalysisLayer[];
  assemblyAreas: AssemblyRecord[];
}

export function generateDemoMapData(): DemoDataset {
  // --- SOS ihbarları (18 adet, son 15 gün) ---
  const sosAlerts: SOSAlert[] = Array.from({ length: 18 }, (_, i) => {
    const region = pick(REGIONS);
    const status = pick(["OPEN", "EN_ROUTE", "RESOLVED"] as const);
    const urgency = pick(["HIGH", "MEDIUM", "CRITICAL"] as const);
    return {
      id: `demo-sos-${i}`,
      latitude: jitter(region.lat, 0.3),
      longitude: jitter(region.lon, 0.3),
      accuracy: Math.round(10 + Math.random() * 40),
      message: `${region.city} - simülasyon SOS ihbarı #${i + 1}`,
      userId: `demo-user-${i}`,
      receivedAt: daysAgoIso(15),
      status,
      urgency,
    };
  });

  // --- NLP ihbar konumları (16 adet, son 20 gün) ---
  const kategoriler = ["Enkaz altında kalma", "Yaralı var", "Yangın", "Su/gıda ihtiyacı", "Yol kapalı"];
  const nlpIncidents: NlpIncident[] = Array.from({ length: 16 }, (_, i) => {
    const region = pick(REGIONS);
    const kategori = pick(kategoriler);
    return {
      id: `demo-nlp-${i}`,
      createdAt: daysAgoIso(20),
      kategori,
      aciliyet: Math.round(1 + Math.random() * 4),
      marker: {
        id: `demo-nlp-marker-${i}`,
        lat: jitter(region.lat, 0.3),
        lng: jitter(region.lon, 0.3),
        title: `${region.city} - ${kategori}`,
        type: "sos",
        popupText: `Simülasyon NLP tespiti: ${kategori}`,
      },
    };
  });

  // --- Risk paneli / deprem olayları (35 adet, son 30 gün) ---
  const primaryRegion = REGIONS[2]; // Kahramanmaraş
  const mapEvents: RiskMapEvent[] = Array.from({ length: 35 }, (_, i) => {
    const region = pick(REGIONS);
    const magnitude = Math.round((2.5 + Math.random() * 4.0) * 10) / 10;
    return {
      label: `${region.city} - Simülasyon Deprem #${i + 1}`,
      latitude: jitter(region.lat, 0.6),
      longitude: jitter(region.lon, 0.6),
      magnitude,
      timeLabel: daysAgoIso(30),
    };
  });

  const faultLines: RiskFaultLine[] = REGIONS.slice(0, 4).map((region, idx) => ({
    name: `${region.city} Simülasyon Fay Hattı`,
    points: Array.from({ length: 6 }, (_, i) => ({
      latitude: jitter(region.lat, 0.4 * (i / 5)),
      longitude: jitter(region.lon, 0.4 * (i / 5)) + idx * 0.05,
    })),
  }));

  const riskResult: RiskResponse = {
    city: primaryRegion.city,
    coordinates: { lat: primaryRegion.lat, lon: primaryRegion.lon },
    summary: "Bu veri, harita katmanlarını test etmek için üretilmiş bir SİMÜLASYONDUR, gerçek deprem verisi değildir.",
    riskScore: 72,
    riskLevel: "Yüksek",
    lastUpdate: daysAgoIso(1),
    nearbyFaults: faultLines.map((f) => f.name),
    recentEvents: mapEvents.slice(0, 5).map((e) => e.label),
    factors: { faySisan: 0.8, tarihselAktivite: 0.65, zeminRiski: 0.55 },
    metrics: {
      shortRisk: 0.68,
      longHazard: 0.74,
      faultScore: 0.7,
      faultDistanceKm: 4.2,
      nearbyQuakeCount: mapEvents.length,
      maxMagnitude: Math.max(...mapEvents.map((e) => e.magnitude)),
      averageDepth: 8.5,
      heatSampleCount: mapEvents.length,
      totalFaultFeatures: faultLines.length,
    },
    mapEvents,
    heatmapEvents: mapEvents,
    faultLines,
    technicalQuakes: mapEvents.slice(0, 10).map((e) => ({
      time: e.timeLabel,
      place: e.label,
      magnitude: e.magnitude,
      depth: Math.round(5 + Math.random() * 15),
      distanceKm: Math.round(Math.random() * 50),
      latitude: e.latitude,
      longitude: e.longitude,
    })),
    usedManualCoordinates: false,
    refreshMessage: "Simülasyon verisi - gerçek zamanlı değil.",
    source: "DEMO_SIMULATION",
  };

  // --- Yol hasarı analizleri (3 adet, sahte segmentler) ---
  const roadDamageAnalyses: RoadDamageAnalysisLayer[] = REGIONS.slice(0, 3).map((region, idx) => {
    const makeSegments = (count: number) =>
      Array.from({ length: count }, () => {
        const startLat = jitter(region.lat, 0.15);
        const startLon = jitter(region.lon, 0.15);
        return [
          [startLat, startLon],
          [jitter(startLat, 0.02), jitter(startLon, 0.02)],
          [jitter(startLat, 0.03), jitter(startLon, 0.03)],
        ] as number[][];
      });

    return {
      analysisId: `demo-road-${idx}`,
      city: region.city,
      safeRoadSegments: makeSegments(20),
      blockedRoadSegments: makeSegments(9),
      bounds: {
        west: region.lon - 0.2,
        south: region.lat - 0.2,
        east: region.lon + 0.2,
        north: region.lat + 0.2,
      },
      createdAt: daysAgoIso(10),
    };
  });

  // --- Toplanma alanları (12 adet) ---
  const assemblyAreas: AssemblyRecord[] = Array.from({ length: 12 }, (_, i) => {
    const region = pick(REGIONS);
    const lat = jitter(region.lat, 0.25);
    const lon = jitter(region.lon, 0.25);
    return {
      toplanma_alani: `${region.city} Simülasyon Toplanma Alanı ${i + 1}`,
      lat,
      lon,
      display_lat: lat,
      display_lon: lon,
      category: pick(["Park", "Okul Bahçesi", "Stadyum", "Meydan"]),
      source: "DEMO_SIMULATION",
      note: "Simülasyon verisi",
      priority: Math.round(1 + Math.random() * 3),
    };
  });

  return { sosAlerts, nlpIncidents, riskResult, roadDamageAnalyses, assemblyAreas };
}
