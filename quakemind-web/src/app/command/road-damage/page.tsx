"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import InteractiveMap, { MapPolylineItem, MapMarkerItem } from "@/components/map/InteractiveMap";
import SafeEvacuationMap from "@/components/map/SafeEvacuationMap";
import CompareMap from "@/components/map/CompareMap";
import {
  analyzeRoadDamage,
  pollRoadDamageStatus,
  getWaybackVersions,
  searchOamImages,
  getRouteBetweenPoints,
  getAssemblyAreas,
  RoadDamageResponse,
  RoadDamageProgress,
  WaybackVersion,
  OamImage,
  AssemblyResponse,
} from "@/lib/api";
import { useMapLayers } from "@/context/MapLayersContext";
import {
  Map as MapIcon,
  Sliders,
  Play,
  AlertTriangle,
  Layers,
  Search,
  MousePointerClick,
  Square,
  Route,
  Trash2,
  LocateFixed,
  Tent,
  RefreshCw,
} from "lucide-react";

const CITIES = {
  "Antakya (Hatay)": { lat: 36.202, lng: 36.161 },
  Kahramanmaras: { lat: 37.57, lng: 36.93 },
  Gaziantep: { lat: 37.06, lng: 37.38 },
  Malatya: { lat: 38.35, lng: 38.30 },
  Adiyaman: { lat: 37.76, lng: 38.27 },
};

type SelectionMode = "city" | "click" | "draw";
type LatLng = { lat: number; lng: number };

export default function RoadDamagePage() {
  const [activeTab, setActiveTab] = useState<"damage" | "assembly">("damage");

  return (
    <div className="flex-1 flex w-full">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-65px)] bg-[#0b0f17]">
        {/* HEADER */}
        <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
              <MapIcon className="w-4 h-4 text-blue-500" />
              <span>SEGFORMER AI YAPAY ZEKA MODELİ</span>
            </div>
            <h1 className="text-2xl font-black text-white font-mono mt-1">UYDU YOL HASAR & ROTA ANALİZİ</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("damage")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                activeTab === "damage"
                  ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30"
                  : "glass-button text-slate-400 border-slate-800"
              }`}
            >
              <MapIcon className="w-4 h-4" /> Hasar Analizi
            </button>
            <button
              onClick={() => setActiveTab("assembly")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                activeTab === "assembly"
                  ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30"
                  : "glass-button text-slate-400 border-slate-800"
              }`}
            >
              <Tent className="w-4 h-4" /> Toplanma Alanları
            </button>
          </div>
        </div>

        {activeTab === "damage" ? <DamageAnalysisTab /> : <AssemblyAreasTab />}
      </main>
    </div>
  );
}

function DamageAnalysisTab() {
  const { addRoadDamageAnalysis } = useMapLayers();
  const [selectedCity, setSelectedCity] = useState<keyof typeof CITIES>("Antakya (Hatay)");
  const [source, setSource] = useState("google");
  const [booster, setBooster] = useState(3.5);
  const [threshold, setThreshold] = useState(0.4);
  const [postProcessLevel, setPostProcessLevel] = useState(2);
  const [useImagenetNorm, setUseImagenetNorm] = useState(true);

  const [selectionMode, setSelectionMode] = useState<SelectionMode>("city");
  const [clickedPoint, setClickedPoint] = useState<LatLng | null>(null);
  const [drawnBbox, setDrawnBbox] = useState<[number, number, number, number] | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoadDamageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<RoadDamageProgress | null>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      analysisAbortRef.current?.abort();
    };
  }, []);

  // Esri Wayback (historical satellite version) selection
  const [waybackVersions, setWaybackVersions] = useState<WaybackVersion[]>([]);
  const [selectedWaybackId, setSelectedWaybackId] = useState<string>("");
  const [loadingWayback, setLoadingWayback] = useState(false);

  // OpenAerialMap (event-specific imagery) date range + selection
  const [oamDateStart, setOamDateStart] = useState("2023-02-06");
  const [oamDateEnd, setOamDateEnd] = useState("2023-02-28");
  const [oamImages, setOamImages] = useState<OamImage[]>([]);
  const [selectedOamUrl, setSelectedOamUrl] = useState<string>("");
  const [loadingOam, setLoadingOam] = useState(false);

  // Interactive routing (click 2 points on the result map)
  const [pickingRoute, setPickingRoute] = useState(false);
  const [routeStart, setRouteStart] = useState<LatLng | null>(null);
  const [routeEnd, setRouteEnd] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeDistanceM, setRouteDistanceM] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    if (source !== "esri" || waybackVersions.length > 0) return;
    setLoadingWayback(true);
    getWaybackVersions()
      .then((versions) => {
        setWaybackVersions(versions);
        if (versions.length > 0) setSelectedWaybackId(versions[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingWayback(false));
  }, [source, waybackVersions.length]);

  const cityCoords = CITIES[selectedCity];
  const analysisCenter: LatLng =
    selectionMode === "click" && clickedPoint
      ? clickedPoint
      : selectionMode === "draw" && drawnBbox
      ? { lat: (drawnBbox[1] + drawnBbox[3]) / 2, lng: (drawnBbox[0] + drawnBbox[2]) / 2 }
      : cityCoords;

  // Live map preview of the currently selected satellite source, so the map
  // updates immediately when picking Esri/OpenAerial — not only after a full
  // analysis run finishes and returns its own satelliteTileUrl.
  let previewTileUrl: string | undefined;
  let previewAttribution: string | undefined;
  if (source === "esri" && selectedWaybackId) {
    previewTileUrl = `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/${selectedWaybackId}/{z}/{y}/{x}`;
    previewAttribution = "Esri";
  } else if (source === "oam" && selectedOamUrl) {
    previewTileUrl = selectedOamUrl;
    previewAttribution = "OpenAerialMap";
  } else if (source === "google") {
    previewTileUrl = "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";
    previewAttribution = "Google";
  }
  const activeSatelliteTileUrl = result?.satelliteTileUrl || previewTileUrl;
  const activeSatelliteAttribution = result?.satelliteAttribution || previewAttribution;

  const handleSearchOam = async () => {
    setLoadingOam(true);
    setSelectedOamUrl("");
    try {
      const images = await searchOamImages({
        latitude: analysisCenter.lat,
        longitude: analysisCenter.lng,
        dateStart: oamDateStart,
        dateEnd: oamDateEnd,
      });
      setOamImages(images);
      if (images.length > 0) setSelectedOamUrl(images[0].tms_url);
    } catch (err) {
      setOamImages([]);
    } finally {
      setLoadingOam(false);
    }
  };

  const resetRouteSelection = () => {
    setRouteStart(null);
    setRouteEnd(null);
    setRouteCoords(null);
    setRouteDistanceM(null);
    setRouteError(null);
  };

  const handleRunAnalysis = async () => {
    // Cancel any still-in-flight poll from a previous run before starting a
    // new one (second click, or changed parameters mid-analysis).
    analysisAbortRef.current?.abort();
    const controller = new AbortController();
    analysisAbortRef.current = controller;

    setLoading(true);
    setError(null);
    setProgress({ percent: 0, message: "Analiz sıraya alınıyor..." });
    resetRouteSelection();
    setPickingRoute(false);
    try {
      const { analysisId } = await analyzeRoadDamage({
        city: selectedCity,
        latitude: analysisCenter.lat,
        longitude: analysisCenter.lng,
        source: source,
        damageBooster: booster,
        threshold: threshold,
        waybackId: source === "esri" ? selectedWaybackId : undefined,
        oamTileUrl: source === "oam" ? selectedOamUrl : undefined,
        useImagenetNorm,
        postProcessLevel,
        bbox: selectionMode === "draw" && drawnBbox ? drawnBbox : undefined,
      });
      const data = await pollRoadDamageStatus(analysisId, {
        signal: controller.signal,
        onProgress: (p) => {
          if (!controller.signal.aborted) setProgress(p);
        },
      });
      if (controller.signal.aborted) return;
      setResult(data);
      addRoadDamageAnalysis({
        analysisId: data.analysisId,
        city: data.city,
        safeRoadSegments: data.safeRoadSegments,
        blockedRoadSegments: data.blockedRoadSegments,
        bounds: data.bounds,
      });
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setError(err?.message || "Analiz başarısız oldu. Backend çalışıyor mu kontrol edin.");
      setResult(null);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setProgress(null);
      }
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (pickingRoute) {
      if (!routeStart) {
        setRouteStart({ lat, lng });
        setRouteCoords(null);
        setRouteError(null);
      } else if (!routeEnd) {
        setRouteEnd({ lat, lng });
      } else {
        setRouteStart({ lat, lng });
        setRouteEnd(null);
        setRouteCoords(null);
        setRouteError(null);
      }
      return;
    }
    if (selectionMode === "click") {
      setClickedPoint({ lat, lng });
    }
  };

  const handleCalculateRoute = async () => {
    if (!result || !routeStart || !routeEnd) return;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const data = await getRouteBetweenPoints(result.analysisId, routeStart, routeEnd);
      setRouteCoords(data.routeCoords);
      setRouteDistanceM(data.distanceMeters);
    } catch (err: any) {
      setRouteError(err?.message || "Rota hesaplanamadı.");
      setRouteCoords(null);
    } finally {
      setRouteLoading(false);
    }
  };

  // Convert road segments into MapPolylineItems
  const polylines: MapPolylineItem[] = [];
  if (result) {
    result.safeRoadSegments.forEach((seg, idx) => {
      polylines.push({
        id: `safe-${idx}`,
        coords: seg as [number, number][],
        color: "#10b981",
        weight: 4,
        opacity: 0.9,
      });
    });
    result.blockedRoadSegments.forEach((seg, idx) => {
      polylines.push({
        id: `blocked-${idx}`,
        coords: seg as [number, number][],
        color: "#ef4444",
        weight: 5,
        opacity: 0.9,
      });
    });
    if (routeCoords) {
      polylines.push({
        id: "computed-route",
        coords: routeCoords,
        color: "#ff2d55",
        weight: 6,
        opacity: 1.0,
        casing: true,
      });
    }
  }

  const markers: MapMarkerItem[] = [];
  if (selectionMode === "click" && clickedPoint) {
    markers.push({
      id: "click-marker",
      lat: clickedPoint.lat,
      lng: clickedPoint.lng,
      title: "Seçilen Nokta",
      popupText: "Analiz bu noktadan yapılacak",
    });
  } else if (!result) {
    markers.push({
      id: "center-marker",
      lat: cityCoords.lat,
      lng: cityCoords.lng,
      title: selectedCity,
    });
  }
  if (result) {
    markers.push({
      id: "center-marker",
      lat: analysisCenter.lat,
      lng: analysisCenter.lng,
      title: `${selectedCity} Analiz Merkezi`,
      type: "damage",
      popupText: `Hasar Oranı: %${(result.damageRate * 100).toFixed(1)}`,
    });
  }
  if (routeStart) {
    markers.push({ id: "route-start", lat: routeStart.lat, lng: routeStart.lng, title: "Başlangıç Noktası" });
  }
  if (routeEnd) {
    markers.push({ id: "route-end", lat: routeEnd.lat, lng: routeEnd.lng, title: "Hedef Noktası" });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* CONTROLS (4 Cols) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4" /> PARAMETRE AYARLARI
            </span>
          </div>

          {/* Selection Mode */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Konum Seçim Yöntemi</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectionMode("city")}
                className={`py-2 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${
                  selectionMode === "city" ? "bg-blue-600 text-white border-blue-500" : "glass-button text-slate-400 border-slate-800"
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" /> Şehir
              </button>
              <button
                onClick={() => setSelectionMode("click")}
                className={`py-2 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${
                  selectionMode === "click" ? "bg-blue-600 text-white border-blue-500" : "glass-button text-slate-400 border-slate-800"
                }`}
              >
                <MousePointerClick className="w-3.5 h-3.5" /> Nokta Seç
              </button>
              <button
                onClick={() => setSelectionMode("draw")}
                className={`py-2 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${
                  selectionMode === "draw" ? "bg-blue-600 text-white border-blue-500" : "glass-button text-slate-400 border-slate-800"
                }`}
              >
                <Square className="w-3.5 h-3.5" /> Alan Çiz
              </button>
            </div>
            {selectionMode === "click" && (
              <p className="text-[11px] text-slate-500 mt-1.5">Haritada bir noktaya tıklayarak analiz merkezini seç.</p>
            )}
            {selectionMode === "draw" && (
              <p className="text-[11px] text-slate-500 mt-1.5">Haritanın sol üstündeki dörtgen aracıyla özel bir alan çiz.</p>
            )}
          </div>

          {/* City Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Şehir / Afet Bölgesi</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as any)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500"
            >
              {Object.keys(CITIES).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Satellite Source */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Uydu Görüntü Kaynağı</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "google", label: "Google" },
                { id: "esri", label: "Esri" },
                { id: "oam", label: "OpenAerial" },
              ].map((src) => (
                <button
                  key={src.id}
                  onClick={() => setSource(src.id)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    source === src.id
                      ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30"
                      : "glass-button text-slate-400 border-slate-800"
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>
          </div>

          {/* Esri Wayback: historical date/version selection */}
          {source === "esri" && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Uydu Görüntü Tarihi (Esri Wayback)</label>
              {loadingWayback ? (
                <div className="text-xs text-slate-400 flex items-center gap-2 p-2">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Sürümler yükleniyor...
                </div>
              ) : waybackVersions.length > 0 ? (
                <select
                  value={selectedWaybackId}
                  onChange={(e) => setSelectedWaybackId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500"
                >
                  {waybackVersions.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-slate-500">Sürüm listesi alınamadı, güncel görüntü kullanılacak.</p>
              )}
            </div>
          )}

          {/* OpenAerialMap: event-specific date range + image selection */}
          {source === "oam" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Görüntü Tarih Aralığı (OpenAerialMap)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={oamDateStart}
                  onChange={(e) => setOamDateStart(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500"
                />
                <input
                  type="date"
                  value={oamDateEnd}
                  onChange={(e) => setOamDateEnd(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSearchOam}
                disabled={loadingOam}
                className="w-full py-2 rounded-xl glass-button border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-2"
              >
                {loadingOam ? (
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>{loadingOam ? "Aranıyor..." : "Görüntü Ara"}</span>
              </button>

              {oamImages.length > 0 && (
                <select
                  value={selectedOamUrl}
                  onChange={(e) => setSelectedOamUrl(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500"
                >
                  {oamImages.map((img) => (
                    <option key={img.id} value={img.tms_url}>{img.date} — {img.provider}</option>
                  ))}
                </select>
              )}
              {oamImages.length === 0 && !loadingOam && (
                <p className="text-xs text-slate-500">Tarih aralığı seçip &quot;Görüntü Ara&quot;ya basın.</p>
              )}
            </div>
          )}

          {/* Damage Booster Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Hasar Hassasiyeti (Booster)</span>
              <span className="font-bold text-blue-400">{booster}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={booster}
              onChange={(e) => setBooster(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Threshold Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Tespit Eşiği (Threshold)</span>
              <span className="font-bold text-blue-400">{threshold}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Post-Processing + ImageNet norm */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Post-Processing</label>
              <select
                value={postProcessLevel}
                onChange={(e) => setPostProcessLevel(parseInt(e.target.value, 10))}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500"
              >
                <option value={0}>Kapalı (0)</option>
                <option value={1}>Hafif (1)</option>
                <option value={2}>Güçlü (2)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300 mt-6">
              <input
                type="checkbox"
                checked={useImagenetNorm}
                onChange={(e) => setUseImagenetNorm(e.target.checked)}
                className="accent-blue-500 w-4 h-4"
              />
              ImageNet Norm.
            </label>
          </div>

          {/* RUN BUTTON */}
          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/40 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-5 h-5 fill-white" />
            )}
            <span>
              {loading
                ? `Segformer Analiz Ediyor... %${progress?.percent ?? 0}`
                : "Yol Hasar Analizini Başlat"}
            </span>
          </button>

          {/* Analysis can run for minutes on CPU, so show the backend's real
              stage-by-stage progress instead of an indeterminate spinner. */}
          {loading && (
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full rounded-full bg-slate-700/60 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress?.percent ?? 0}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {progress?.message || "Analiz sıraya alındı..."}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="glass-panel p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* METRICS RESULT CARD */}
        {result && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 animate-in fade-in">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Analiz Sonuçları</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400">
                <p className="text-[10px] text-slate-400">Açık Sokaklar</p>
                <p className="text-xl font-bold font-mono">{result.openRoads}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-red-500/30 text-red-400">
                <p className="text-[10px] text-slate-400">Tıkalı Sokaklar</p>
                <p className="text-xl font-bold font-mono">{result.blockedRoads}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Önerilen Aksiyon:
              </p>
              <p className="mt-1 text-[11px] leading-relaxed">{result.recommendedAction}</p>
            </div>

            {/* Logistics / interactive routing */}
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Route className="w-4 h-4 text-blue-400" /> Lojistik Rota
              </p>
              <p className="text-[11px] text-slate-500">
                Sağdaki haritada 2 nokta seçerek enkazsız yollar üzerinden en güvenli rotayı hesapla.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPickingRoute((v) => !v);
                    if (!pickingRoute) resetRouteSelection();
                  }}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    pickingRoute ? "bg-blue-600 text-white border-blue-500" : "glass-button text-slate-400 border-slate-800"
                  }`}
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                  {pickingRoute ? "Nokta Seçimi Açık" : "Nokta Seçmeye Başla"}
                </button>
                <button
                  onClick={resetRouteSelection}
                  className="py-2 px-3 rounded-xl text-[11px] font-bold border border-slate-800 glass-button text-slate-400"
                  title="Seçimleri Temizle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {routeStart && routeEnd && (
                <button
                  onClick={handleCalculateRoute}
                  disabled={routeLoading}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  {routeLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Route className="w-3.5 h-3.5" />
                  )}
                  {routeLoading ? "Hesaplanıyor..." : "En Güvenli Rotayı Hesapla"}
                </button>
              )}
              {routeError && <p className="text-[11px] text-red-300">{routeError}</p>}
              {routeCoords && routeDistanceM != null && (
                <p className="text-[11px] text-rose-300">Rota mesafesi: {(routeDistanceM / 1000).toFixed(2)} km</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MAP & ROUTE OVERLAY (8 Cols) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col h-[650px] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> HARİTA LEJANDI & ROTA GÖSTERİMİ
            </span>
            <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-3 h-1 bg-emerald-500 rounded" /> Açık Yollar
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-3 h-1 bg-red-500 rounded" /> Hasarlı Yollar
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-3 h-1 bg-rose-500 rounded" /> Hesaplanan Rota
              </span>
            </div>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800">
            <InteractiveMap
              center={[analysisCenter.lat, analysisCenter.lng]}
              zoom={15}
              markers={markers}
              polylines={polylines}
              satelliteTileUrl={activeSatelliteTileUrl}
              satelliteAttribution={activeSatelliteAttribution}
              onMapClick={handleMapClick}
              enableDraw={selectionMode === "draw"}
              onBoundsSelected={(bbox) => setDrawnBbox(bbox)}
              onDrawCleared={() => setDrawnBbox(null)}
            />
          </div>
        </div>

        {/* Before / After comparison */}
        {result?.imageOriginalB64 && result?.imageDamageOverlayB64 && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> ÖNCE / SONRA KARŞILAŞTIRMA
            </span>
            <div className="h-[450px] rounded-2xl overflow-hidden border border-slate-800">
              <CompareMap
                beforeImage={result.imageOriginalB64}
                afterImage={result.imageDamageOverlayB64}
                bounds={result.bounds}
              />
            </div>
            <div className="flex items-center justify-around text-[11px] font-semibold bg-slate-950/60 rounded-xl border border-slate-800 py-2.5">
              <span className="text-cyan-400">■ Açık Yol (OSM)</span>
              <span className="text-yellow-300">■ Tespit Edilen Yıkıntı</span>
              <span className="text-red-400">■ Yol Üzerindeki Yıkıntı</span>
            </div>
          </div>
        )}

        {/* Diagnostics grid */}
        {result?.imageDamageMaskB64 && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> DİAGNOSTİK
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { src: result.imageDamageMaskB64, label: "Model Yıkıntı Tahmini" },
                { src: result.imageRoadMaskB64, label: "OSM Yol Maskesi" },
                { src: result.imageIntersectionB64, label: "Yol & Yıkıntı Kesişimi" },
                { src: result.imageSegmentationOverlayB64, label: "Uydu + Segmentasyon" },
              ].map((panel, idx) => (
                <div key={idx} className="space-y-1.5">
                  {panel.src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={panel.src} alt={panel.label} className="w-full h-auto rounded-lg border border-slate-800" />
                  )}
                  <p className="text-[10px] text-slate-500 text-center">{panel.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssemblyAreasTab() {
  const { setAssemblyAreas } = useMapLayers();
  const [userLat, setUserLat] = useState(36.202);
  const [userLon, setUserLon] = useState(36.161);
  const [locationSource, setLocationSource] = useState("Seçili şehir merkezi");
  const [geoLoading, setGeoLoading] = useState(false);

  const [dataSource, setDataSource] = useState<"auto" | "local" | "online">("auto");
  const [radiusKm, setRadiusKm] = useState(8);
  const [includeCandidates, setIncludeCandidates] = useState(true);
  const [allowOnlineFallback, setAllowOnlineFallback] = useState(true);

  const [assemblyResult, setAssemblyResult] = useState<AssemblyResponse | null>(null);
  const [assemblyLoading, setAssemblyLoading] = useState(false);
  const [assemblyError, setAssemblyError] = useState<string | null>(null);

  const hasAutoFetched = useRef(false);

  const runFetch = async (lat: number, lon: number) => {
    setAssemblyLoading(true);
    setAssemblyError(null);
    try {
      const data = await getAssemblyAreas({
        latitude: lat,
        longitude: lon,
        radiusKm,
        includeCandidates,
        dataSource,
        allowOnlineFallback,
      });
      setAssemblyResult(data);
      setAssemblyAreas(data.records, "manual");
    } catch (err: any) {
      setAssemblyError(err?.message || "Toplanma alanları verisi alınamadı.");
      setAssemblyResult(null);
    } finally {
      setAssemblyLoading(false);
    }
  };

  useEffect(() => {
    if (hasAutoFetched.current) return;
    hasAutoFetched.current = true;
    runFetch(userLat, userLon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationSource("Tarayıcı konum desteklemiyor");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLat(lat);
        setUserLon(lon);
        setLocationSource(`Tarayıcı GPS (±${Math.round(pos.coords.accuracy)} m)`);
        setGeoLoading(false);
        runFetch(lat, lon);
      },
      (err) => {
        setLocationSource(`Konum alınamadı: ${err.message}`);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    setUserLat(lat);
    setUserLon(lng);
    setLocationSource("Harita tıklaması");
    runFetch(lat, lng);
  };

  const officialCount = assemblyResult?.records.filter((r) => r.priority === 0).length ?? 0;
  const candidateCount = (assemblyResult?.records.length ?? 0) - officialCount;

  const markers: MapMarkerItem[] = [];
  assemblyResult?.records.forEach((rec, idx) => {
    markers.push({
      id: `assembly-${idx}`,
      lat: rec.display_lat,
      lng: rec.display_lon,
      title: rec.toplanma_alani,
      type: rec.priority === 0 ? "shelter" : undefined,
      popupText: `${rec.category} • ${rec.source}${
        rec.distanceM != null ? ` • ${(rec.distanceM / 1000).toFixed(2)} km` : ""
      }`,
    });
  });
  markers.push({
    id: "user-location",
    lat: userLat,
    lng: userLon,
    title: "Bulunduğun Konum",
    type: "sos",
    popupText: locationSource,
  });

  const polylines: MapPolylineItem[] = [];
  if (assemblyResult?.routeCoords) {
    polylines.push({
      id: "assembly-route",
      coords: assemblyResult.routeCoords,
      color: "#0077ff",
      weight: 6,
      opacity: 0.9,
      casing: true,
    });
  } else if (assemblyResult?.nearest) {
    polylines.push({
      id: "assembly-airline",
      coords: [
        [userLat, userLon],
        [assemblyResult.nearest.display_lat, assemblyResult.nearest.display_lon],
      ],
      color: "#ff7a00",
      weight: 3,
      opacity: 0.7,
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Tent className="w-4 h-4" /> KONUM & ARAMA
            </span>
          </div>

          <button
            onClick={handleUseGeolocation}
            disabled={geoLoading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            {geoLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4" />
            )}
            {geoLoading ? "Konum alınıyor..." : "Konumumu Kullan"}
          </button>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Veya Bir Şehir Seç</label>
            <select
              value=""
              onChange={(e) => {
                const cityName = e.target.value as keyof typeof CITIES;
                if (!cityName) return;
                const coords = CITIES[cityName];
                setUserLat(coords.lat);
                setUserLon(coords.lng);
                setLocationSource(`Şehir seçimi: ${cityName}`);
                runFetch(coords.lat, coords.lng);
              }}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500"
            >
              <option value="">Şehir seçin...</option>
              {Object.keys(CITIES).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-slate-500">Kaynak: {locationSource}</p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Enlem</label>
              <input
                type="number"
                step="0.000001"
                value={userLat}
                onChange={(e) => setUserLat(parseFloat(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Boylam</label>
              <input
                type="number"
                step="0.000001"
                value={userLon}
                onChange={(e) => setUserLon(parseFloat(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Veri Kaynağı</label>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500"
            >
              <option value="auto">Otomatik (local varsa)</option>
              <option value="local">Sadece local dataset</option>
              <option value="online">Online OSM</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Arama Yarıçapı</span>
              <span className="font-bold text-blue-400">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={includeCandidates}
              onChange={(e) => setIncludeCandidates(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            Park/bahçe aday açık alanları dahil et
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={allowOnlineFallback}
              onChange={(e) => setAllowOnlineFallback(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            Local rota olmazsa online fallback
          </label>

          <button
            onClick={() => runFetch(userLat, userLon)}
            disabled={assemblyLoading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            {assemblyLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {assemblyLoading ? "Aranıyor..." : "Ara / Yenile"}
          </button>
        </div>

        {assemblyError && (
          <div className="glass-panel p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{assemblyError}</span>
          </div>
        )}

        {assemblyResult && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Sonuçlar ({assemblyResult.activeDataSource})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400">
                <p className="text-[10px] text-slate-400">Resmi Alan</p>
                <p className="text-xl font-bold font-mono">{officialCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-400">
                <p className="text-[10px] text-slate-400">Aday Alan</p>
                <p className="text-xl font-bold font-mono">{candidateCount}</p>
              </div>
            </div>

            {assemblyResult.nearest && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs space-y-1">
                <p className="font-bold">{assemblyResult.nearest.toplanma_alani}</p>
                <p className="text-[11px] text-slate-400">{assemblyResult.nearest.category}</p>
                {assemblyResult.nearestAirM != null && (
                  <p className="text-[11px]">Kuş uçuşu: {(assemblyResult.nearestAirM / 1000).toFixed(2)} km</p>
                )}
                {assemblyResult.routeLengthM != null ? (
                  <p className="text-[11px] text-cyan-300">Yürüyüş rotası: {(assemblyResult.routeLengthM / 1000).toFixed(2)} km</p>
                ) : (
                  <p className="text-[11px] text-slate-500">Yürüyüş rotası hesaplanamadı</p>
                )}
              </div>
            )}
            {assemblyResult.routeError && (
              <p className="text-[11px] text-amber-300">{assemblyResult.routeError}</p>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col h-[720px] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" /> TOPLANMA ALANLARI HARİTASI
          </span>
          <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-3 h-1 bg-emerald-500 rounded" /> Resmi Alan
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-3 h-1 bg-blue-400 rounded" /> Yürüyüş Rotası
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">Haritaya tıklayarak konumunu güncelleyebilirsin.</p>
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800">
          <InteractiveMap
            center={[userLat, userLon]}
            zoom={radiusKm <= 5 ? 14 : 12}
            markers={markers}
            polylines={polylines}
            onMapClick={handleMapClick}
          />
        </div>
      </div>
    </div>
  );
}
