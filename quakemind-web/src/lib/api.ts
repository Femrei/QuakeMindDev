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
  waybackId?: string;
  oamTileUrl?: string;
  useImagenetNorm?: boolean;
  postProcessLevel?: number;
  bbox?: [number, number, number, number]; // [west, south, east, north]
  networkType?: string; // "drive" (default, vehicle logistics) or "walk" (pedestrian evacuation)
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
      networkType: params.networkType,
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

export interface EvacuationAssemblyRecord {
  toplanma_alani?: string;
  name?: string;
  il?: string;
  ilce?: string;
  mahalle?: string;
  lat: number;
  lon: number;
  display_lat?: number;
  display_lon?: number;
  category?: string;
  priority?: number;
  source?: string;
  capacity?: string;
  status?: string;
}

export interface EvacuationAssemblyResponse {
  records: EvacuationAssemblyRecord[];
  activeDataSource: string;
  osmError?: string | null;
  nearest?: EvacuationAssemblyRecord | null;
  nearestAirM?: number | null;
  routeCoords?: [number, number][] | null;
  routeLengthM?: number | null;
  routeError?: string | null;
}

export async function getEvacuationAssemblyData(
  latitude: number,
  longitude: number,
  radiusKm: number = 8.0
): Promise<EvacuationAssemblyResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/road_damage/assembly?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`
  );
  if (!res.ok) throw new Error("Tahliye toplanma alanları ve rota alınamadı.");
  return res.json();
}

export interface CustomRouteResponse {
  start: [number, number];
  destination: [number, number];
  routeCoords: [number, number][];
  routeLengthM: number;
  estWalkMinutes: number;
  routeError?: string | null;
}

export async function calculateCustomRoute(
  startLat: number,
  startLon: number,
  destLat: number,
  destLon: number
): Promise<CustomRouteResponse> {
  const res = await fetch(`${API_BASE_URL}/api/road_damage/calculate_custom_route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startLat, startLon, destLat, destLon }),
  });
  if (!res.ok) throw new Error("Rota hesaplanamadı.");
  return res.json();
}
