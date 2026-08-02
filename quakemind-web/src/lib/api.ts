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
  guven_skoru?: number;
  aciliyet?: number;
  konum_metin?: string | null;
  konum?: [number, number] | null;
  konum_adaylari?: string[];
  raw_tweet?: string;
  status?: string;
  reason?: string;
}

export interface RiskMapEvent {
  label: string;
  latitude: number;
  longitude: number;
  magnitude: number;
  timeLabel: string;
}

export interface RiskTechnicalQuake {
  time: string;
  place: string;
  magnitude: number;
  depth: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
}

export interface RiskFaultLine {
  name: string;
  points: Array<{ latitude: number; longitude: number }>;
}

export interface RiskResponse {
  city: string;
  coordinates: { lat: number; lon: number };
  summary: string;
  riskScore: number;
  riskLevel: string;
  lastUpdate: string;
  nearbyFaults: string[];
  recentEvents: string[];
  factors: Record<string, number>;
  metrics: {
    shortRisk: number;
    longHazard: number;
    faultScore: number;
    faultDistanceKm: number;
    nearbyQuakeCount: number;
    maxMagnitude: number;
    averageDepth: number;
    heatSampleCount: number;
    totalFaultFeatures: number;
  };
  mapEvents: RiskMapEvent[];
  heatmapEvents: RiskMapEvent[];
  faultLines: RiskFaultLine[];
  technicalQuakes: RiskTechnicalQuake[];
  usedManualCoordinates: boolean;
  refreshMessage: string;
  source: string;
}

export interface FaultLinesResponse {
  faultLines: RiskFaultLine[];
  count: number;
}

export interface RoadDamageResponse {
  city: string;
  analysisId: string;
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
  satelliteAttribution?: string;
  imageOriginalB64?: string;
  imageDamageOverlayB64?: string;
  imageDamageMaskB64?: string;
  imageRoadMaskB64?: string;
  imageIntersectionB64?: string;
  imageSegmentationOverlayB64?: string;
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
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail || "Deprem riski hesaplanamadı.");
  }
  return res.json();
}

export async function getFaultLines(): Promise<FaultLinesResponse> {
  const res = await fetch(`${API_BASE_URL}/api/risk/fault_lines`);
  if (!res.ok) throw new Error("Fay hattı verisi alınamadı.");
  return res.json();
}

export interface ObservatoryQuake {
  time: string;
  place: string;
  magnitude: number;
  depth: number | null;
  latitude: number;
  longitude: number;
  status: string;
}

export interface AllQuakesResponse {
  quakes: ObservatoryQuake[];
  totalMatched: number;
  returned: number;
  datasetStart: string;
  datasetEnd: string;
  datasetTotal: number;
}

export async function getAllQuakes(params: {
  minMagnitude?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  sortBy?: "time" | "magnitude";
}): Promise<AllQuakesResponse> {
  const query = new URLSearchParams({
    minMagnitude: String(params.minMagnitude ?? 0),
    limit: String(params.limit ?? 500),
    sortBy: params.sortBy || "time",
  });
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);

  const res = await fetch(`${API_BASE_URL}/api/risk/all_quakes?${query.toString()}`);
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail || "Deprem kataloğu alınamadı.");
  }
  return res.json();
}

export async function refreshLiveEarthquakeData(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/risk/refresh_live_data`, { method: "POST" });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail || "Canlı veri güncellenemedi.");
  }
  return res.json();
}

export async function analyzeRoadDamage(params: {
  city: string;
  latitude: number;
  longitude: number;
  source?: string;
  damageBooster?: number;
  threshold?: number;
  waybackId?: string;
  oamTileUrl?: string;
  useImagenetNorm?: boolean;
  postProcessLevel?: number;
  bbox?: [number, number, number, number]; // [west, south, east, north]
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
      waybackId: params.waybackId,
      oamTileUrl: params.oamTileUrl,
      useImagenetNorm: params.useImagenetNorm ?? true,
      postProcessLevel: params.postProcessLevel ?? 2,
      bboxWest: params.bbox?.[0],
      bboxSouth: params.bbox?.[1],
      bboxEast: params.bbox?.[2],
      bboxNorth: params.bbox?.[3],
    }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail || "Uydu yol hasar analizi başarısız.");
  }
  return res.json();
}

export interface RouteResult {
  routeCoords: [number, number][];
  distanceMeters: number;
}

export async function getRouteBetweenPoints(
  analysisId: string,
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<RouteResult> {
  const res = await fetch(`${API_BASE_URL}/api/road_damage/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysisId,
      startLat: start.lat,
      startLon: start.lng,
      endLat: end.lat,
      endLon: end.lng,
    }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail || "Rota hesaplanamadı.");
  }
  return res.json();
}

export interface AssemblyRecord {
  toplanma_alani: string;
  lat: number;
  lon: number;
  display_lat: number;
  display_lon: number;
  category: string;
  source: string;
  note: string;
  priority: number;
  distanceM?: number;
}

export interface AssemblyResponse {
  records: AssemblyRecord[];
  activeDataSource: string;
  osmError: string | null;
  nearest: AssemblyRecord | null;
  nearestAirM: number | null;
  routeCoords: [number, number][] | null;
  routeLengthM: number | null;
  routeError: string | null;
}

export async function getAssemblyAreas(params: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  includeCandidates?: boolean;
  dataSource?: "auto" | "local" | "online";
  allowOnlineFallback?: boolean;
}): Promise<AssemblyResponse> {
  const query = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    radiusKm: String(params.radiusKm ?? 8),
    includeCandidates: String(params.includeCandidates ?? true),
    dataSource: params.dataSource || "auto",
    allowOnlineFallback: String(params.allowOnlineFallback ?? true),
  });
  const res = await fetch(`${API_BASE_URL}/api/road_damage/assembly?${query.toString()}`);
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail || "Toplanma alanları verisi alınamadı.");
  }
  return res.json();
}

export interface WaybackVersion {
  date: string;
  id: string;
  label: string;
}

export async function getWaybackVersions(): Promise<WaybackVersion[]> {
  const res = await fetch(`${API_BASE_URL}/api/road_damage/wayback_versions`);
  if (!res.ok) throw new Error("Esri Wayback sürümleri alınamadı.");
  const data = await res.json();
  return data.versions || [];
}

export interface OamImage {
  id: string;
  title: string;
  provider: string;
  date: string;
  tms_url: string;
  bbox?: number[];
}

export async function searchOamImages(params: {
  latitude: number;
  longitude: number;
  dateStart?: string;
  dateEnd?: string;
}): Promise<OamImage[]> {
  const query = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
  });
  if (params.dateStart) query.set("dateStart", params.dateStart);
  if (params.dateEnd) query.set("dateEnd", params.dateEnd);

  const res = await fetch(`${API_BASE_URL}/api/road_damage/oam_search?${query.toString()}`);
  if (!res.ok) throw new Error("OpenAerialMap görüntüleri aranamadı.");
  const data = await res.json();
  return data.images || [];
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

export interface CameraDetection {
  label: string;
  confidence: number;
  model: string;
  box: number[];
  severity: "CRITICAL" | "SAFE";
}

export interface CameraAnalysisResponse {
  status: "CRITICAL_EVACUATE" | "SAFE_SURFACE";
  modelType: string;
  activeModels: string[];
  detections: CameraDetection[];
  annotatedImage?: string | null;
  advice: string;
  timestamp: string;
}

export async function analyzeCameraFrame(modelType: string = "hybrid", imageBase64?: string): Promise<CameraAnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/api/camera/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelType, imageBase64 }),
  });
  if (!res.ok) throw new Error("Kamera analizi başarısız.");
  return res.json();
}
