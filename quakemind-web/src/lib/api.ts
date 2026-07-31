export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface StatusResponse {
  status: string;
  modules: {
    nlp: boolean;
    risk: boolean;
    road_damage: boolean;
  };
}

export interface NLPResponse {
  kategori?: string;
  güven?: number;
  aciliyet_p5?: number;
  adres?: string;
  koordinat?: [number, number];
  raw_tweet?: string;
  status?: string;
  reason?: string;
}

export interface RiskResponse {
  city: string;
  score: number;
  level: string;
  recentQuakesCount: number;
  maxMagnitude: number;
  faultDistanceKm: number;
  historicalQuakes: Array<{
    time: string;
    latitude: number;
    longitude: number;
    depth: number;
    mag: number;
  }>;
}

export interface RoadDamageResponse {
  city: string;
  damageRate: number;
  openRoads: number;
  blockedRoads: number;
  openRoadPct: number;
  blockedRoadPct: number;
  logLines: string[];
  recommendedAction: string;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  safeRoadSegments: number[][][];
  blockedRoadSegments: number[][][];
  satelliteSource: string;
  satelliteTileUrl: string;
}

export interface SOSAlert {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  message?: string;
  userId?: string;
  receivedAt: string;
  status?: "OPEN" | "EN_ROUTE" | "RESOLVED";
  urgency?: "HIGH" | "MEDIUM" | "CRITICAL";
}

export async function fetchServerStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/status`);
  if (!res.ok) throw new Error("API sunucusuna ulaşılamadı.");
  return res.json();
}

export async function analyzeNLP(text: string): Promise<NLPResponse> {
  const res = await fetch(`${API_BASE_URL}/api/nlp/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("NLP analizi başarısız oldu.");
  return res.json();
}

export async function predictRisk(city: string, manualLat?: number, manualLon?: number): Promise<RiskResponse> {
  const res = await fetch(`${API_BASE_URL}/api/risk/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city,
      manualLatitude: manualLat,
      manualLongitude: manualLon,
      refreshData: false,
    }),
  });
  if (!res.ok) throw new Error("Deprem riski hesaplanamadı.");
  return res.json();
}

export async function analyzeRoadDamage(params: {
  city: string;
  latitude: number;
  longitude: number;
  source?: string;
  damageBooster?: number;
  threshold?: number;
}): Promise<RoadDamageResponse> {
  const res = await fetch(`${API_BASE_URL}/api/road_damage/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city: params.city,
      latitude: params.latitude,
      longitude: params.longitude,
      source: params.source || "google",
      damageBooster: params.damageBooster || 3.5,
      threshold: params.threshold || 0.4,
    }),
  });
  if (!res.ok) throw new Error("Uydu yol hasar analizi başarısız.");
  return res.json();
}

export async function sendSOSAlert(payload: {
  latitude: number;
  longitude: number;
  message?: string;
  userId?: string;
}): Promise<SOSAlert> {
  const res = await fetch(`${API_BASE_URL}/api/sos/alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("SOS uyarısı gönderilemedi.");
  return res.json();
}

export async function getSOSAlerts(): Promise<{ alerts: SOSAlert[]; totalAlerts: number }> {
  const res = await fetch(`${API_BASE_URL}/api/sos/alerts`);
  if (!res.ok) throw new Error("SOS kayıtları çekilemedi.");
  return res.json();
}
