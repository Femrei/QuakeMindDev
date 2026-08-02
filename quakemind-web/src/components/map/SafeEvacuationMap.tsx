"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Shield, Navigation, AlertTriangle, Layers, Compass, Crosshair, RefreshCw, MapPin, Footprints, Zap } from "lucide-react";
import "leaflet/dist/leaflet.css";
import {
  getEvacuationAssemblyData,
  calculateCustomRoute,
  analyzeRoadDamage,
  getRouteBetweenPoints,
  EvacuationAssemblyRecord,
  EvacuationAssemblyResponse,
} from "@/lib/api";

interface SafeEvacuationMapProps {
  role?: "survivor" | "command";
  height?: string;
  onShelterSelect?: (shelterName: string) => void;
}

// Fallback Default Location: Antakya Epicenter
const DEFAULT_LAT = 36.2050;
const DEFAULT_LON = 36.1650;

interface DamageBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

interface DamageAnalysisState {
  analysisId: string;
  bounds: DamageBounds;
  safeRoadSegments: number[][][];
  blockedRoadSegments: number[][][];
}

// True if (lat, lon) sits at least marginDeg inside every edge of bounds —
// OSMnx can clip/drop edges right at the bbox boundary, so routing near the
// raw edge is unreliable.
function boundsContainPoint(bounds: DamageBounds, lat: number, lon: number, marginDeg: number): boolean {
  return (
    lat >= bounds.south + marginDeg &&
    lat <= bounds.north - marginDeg &&
    lon >= bounds.west + marginDeg &&
    lon <= bounds.east - marginDeg
  );
}

// Bbox covering both points with generous padding so nearby alternate shelters
// stay inside the same cached analysis. Returns null if the pair is too far
// apart for a single bounded damage analysis to be worthwhile.
function computeBboxForPair(userLat: number, userLon: number, destLat: number, destLon: number): DamageBounds | null {
  const lonSpan = Math.abs(destLon - userLon);
  const latSpan = Math.abs(destLat - userLat);
  if (lonSpan > 0.06 || latSpan > 0.06) return null;

  const padding = Math.min(0.05, Math.max(0.02, lonSpan * 0.5, latSpan * 0.5));
  return {
    west: Math.min(userLon, destLon) - padding,
    south: Math.min(userLat, destLat) - padding,
    east: Math.max(userLon, destLon) + padding,
    north: Math.max(userLat, destLat) + padding,
  };
}

function InnerEvacuationMap({ role, onShelterSelect }: SafeEvacuationMapProps) {
  const { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMapEvents } = require("react-leaflet");
  const L = require("leaflet");

  const [userLocation, setUserLocation] = useState<[number, number]>([DEFAULT_LAT, DEFAULT_LON]);
  const [gpsStatus, setGpsStatus] = useState<"detecting" | "success" | "fallback">("detecting");
  const [assemblyData, setAssemblyData] = useState<EvacuationAssemblyResponse | null>(null);
  
  const [selectedShelter, setSelectedShelter] = useState<EvacuationAssemblyRecord | null>(null);
  const [customRouteCoords, setCustomRouteCoords] = useState<[number, number][] | null>(null);
  const [customDistanceM, setCustomDistanceM] = useState<number | null>(null);
  const [customWalkMinutes, setCustomWalkMinutes] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [showBlocked, setShowBlocked] = useState(true);

  const [damageAnalysis, setDamageAnalysis] = useState<DamageAnalysisState | null>(null);
  const [damageAnalysisLoading, setDamageAnalysisLoading] = useState(false);
  const [routeMode, setRouteMode] = useState<"idle" | "damage-aware" | "fallback">("idle");
  const [routeErrorMsg, setRouteErrorMsg] = useState<string | null>(null);
  const routeRequestIdRef = useRef(0);

  // Detect User GPS on Load
  useEffect(() => {
    detectUserGPS();
  }, []);

  const detectUserGPS = () => {
    setGpsStatus("detecting");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setUserLocation([lat, lon]);
          setGpsStatus("success");
          fetchAssemblyAndInitialRoute(lat, lon);
        },
        (err) => {
          console.warn("GPS okunamadı, varsayılan deprem merkez üssüne geçiliyor:", err);
          setGpsStatus("fallback");
          fetchAssemblyAndInitialRoute(DEFAULT_LAT, DEFAULT_LON);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setGpsStatus("fallback");
      fetchAssemblyAndInitialRoute(DEFAULT_LAT, DEFAULT_LON);
    }
  };

  const fetchAssemblyAndInitialRoute = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const data = await getEvacuationAssemblyData(lat, lon, 10.0);
      setAssemblyData(data);
      if (data.nearest) {
        setSelectedShelter(data.nearest);
        if (data.routeCoords && data.routeCoords.length > 0) {
          setCustomRouteCoords(data.routeCoords);
          setCustomDistanceM(data.routeLengthM || 450);
          setCustomWalkMinutes(Math.max(1, Math.round((data.routeLengthM || 450) / 80)));
          setRouteMode("fallback");
        }
        const nearestLat = data.nearest.lat || data.nearest.display_lat;
        const nearestLon = data.nearest.lon || data.nearest.display_lon;
        if (nearestLat != null && nearestLon != null) {
          // Upgrade the provisional OSRM route to a damage-aware one in the background.
          drawRouteToTarget(nearestLat, nearestLon, data.nearest, [lat, lon]);
        }
      }
    } catch (e) {
      console.warn("Backend toplanma alanı API offline, yerel AFAD veri seti kullanılıyor:", e);
      const mockRecords: EvacuationAssemblyRecord[] = [
        { name: "Yeni Cami AFAD Toplanma Alanı", lat: 36.2058, lon: 36.1655, ilce: "Antakya", mahalle: "Yeni Cami Mah.", capacity: "2,000 Kişi", status: "Güvenli AFAD Toplanma Alanı", priority: 0 },
        { name: "Habib-i Neccar AFAD Toplanma Alanı", lat: 36.2080, lon: 36.1680, ilce: "Antakya", mahalle: "Habib-i Neccar", capacity: "3,000 Kişi", status: "Güvenli AFAD Toplanma Alanı", priority: 0 },
        { name: "Meydan AFAD Toplanma Alanı", lat: 36.2020, lon: 36.1610, ilce: "Antakya", mahalle: "Meydan", capacity: "1,500 Kişi", status: "Güvenli AFAD Toplanma Alanı", priority: 0 },
      ];
      setAssemblyData({
        records: mockRecords,
        activeDataSource: "Çevrimdışı AFAD Veri Seti",
        nearest: mockRecords[0],
        nearestAirM: 350,
        routeCoords: [
          [lat, lon],
          [36.2052, 36.1651],
          [36.2055, 36.1653],
          [36.2058, 36.1655],
        ],
        routeLengthM: 450,
      });
      setSelectedShelter(mockRecords[0]);
      setCustomRouteCoords([
        [lat, lon],
        [36.2052, 36.1651],
        [36.2055, 36.1653],
        [36.2058, 36.1655],
      ]);
      setCustomDistanceM(450);
      setCustomWalkMinutes(5);
      setRouteMode("fallback");
    } finally {
      setLoading(false);
    }
  };

  // Runs (or reuses a cached) satellite damage analysis for the origin/destination
  // pair, then computes a real Dijkstra route over the damage-pruned road graph.
  // Returns null on any failure so the caller can fall back to plain OSRM routing.
  const runDamageAwareRoute = async (originLat: number, originLon: number, destLat: number, destLon: number) => {
    let analysis = damageAnalysis;
    const marginDeg = 0.005;

    const cacheValid =
      !!analysis &&
      boundsContainPoint(analysis.bounds, originLat, originLon, marginDeg) &&
      boundsContainPoint(analysis.bounds, destLat, destLon, marginDeg);

    if (!cacheValid) {
      const bbox = computeBboxForPair(originLat, originLon, destLat, destLon);
      if (!bbox) return null;

      setDamageAnalysisLoading(true);
      try {
        const result = await analyzeRoadDamage({
          city: "Sokak Rotası Bölgesi",
          latitude: (originLat + destLat) / 2,
          longitude: (originLon + destLon) / 2,
          bbox: [bbox.west, bbox.south, bbox.east, bbox.north],
          networkType: "walk",
        });
        analysis = {
          analysisId: result.analysisId,
          bounds: result.bounds,
          safeRoadSegments: result.safeRoadSegments,
          blockedRoadSegments: result.blockedRoadSegments,
        };
        setDamageAnalysis(analysis);
      } catch (e) {
        console.warn("Hasar analizi başarısız, genel rotaya geçiliyor:", e);
        return null;
      } finally {
        setDamageAnalysisLoading(false);
      }
    }

    if (!analysis) return null;

    try {
      return await getRouteBetweenPoints(
        analysis.analysisId,
        { lat: originLat, lng: originLon },
        { lat: destLat, lng: destLon }
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (message.includes("Analiz oturumu")) {
        // Backend session expired/restarted — drop the stale cache so the next attempt re-analyzes.
        setDamageAnalysis(null);
      }
      console.warn("Hasar-farkında rota hesaplanamadı:", e);
      return null;
    }
  };

  // ROUTE DRAWING TO ANY CLICKED SHELTER OR MAP POINT
  // originOverride lets fetchAssemblyAndInitialRoute pass the freshly-detected GPS
  // fix directly, since userLocation state may not have re-rendered yet at that point.
  //
  // Draws a fast fallback route immediately (OSRM, ~1-2s) so the user always sees
  // something right away, then upgrades to the damage-aware route in the background
  // once/if that (much slower, satellite+AI) analysis resolves. routeRequestIdRef
  // guards against a slow in-flight upgrade overwriting a newer click's result.
  const drawRouteToTarget = async (
    destLat: number,
    destLon: number,
    shelterObj?: EvacuationAssemblyRecord,
    originOverride?: [number, number]
  ) => {
    const origin = originOverride || userLocation;
    const requestId = ++routeRequestIdRef.current;
    setRoutingLoading(true);
    setRouteErrorMsg(null);
    if (shelterObj) {
      setSelectedShelter(shelterObj);
      if (onShelterSelect) onShelterSelect(shelterObj.toplanma_alani || shelterObj.name || "Güvenli Bölge");
    }

    try {
      const res = await calculateCustomRoute(origin[0], origin[1], destLat, destLon);
      if (requestId !== routeRequestIdRef.current) return; // a newer click superseded this one
      if (res.routeCoords && res.routeCoords.length > 0) {
        setCustomRouteCoords(res.routeCoords);
        setCustomDistanceM(res.routeLengthM);
        setCustomWalkMinutes(res.estWalkMinutes);
        setRouteMode("fallback");
      }
    } catch (e) {
      if (requestId === routeRequestIdRef.current) {
        console.warn("Rota hesaplama API hatası:", e);
        setRouteErrorMsg("Rota hesaplanamadı, lütfen tekrar deneyin.");
      }
    } finally {
      if (requestId === routeRequestIdRef.current) setRoutingLoading(false);
    }

    try {
      const damageRoute = await runDamageAwareRoute(origin[0], origin[1], destLat, destLon);
      if (requestId !== routeRequestIdRef.current) return;
      if (damageRoute && damageRoute.routeCoords && damageRoute.routeCoords.length > 0) {
        setCustomRouteCoords(damageRoute.routeCoords);
        setCustomDistanceM(damageRoute.distanceMeters);
        setCustomWalkMinutes(Math.max(1, Math.round(damageRoute.distanceMeters / 80)));
        setRouteMode("damage-aware");
      }
    } catch (e) {
      console.warn("Hasar-farkında rota hesaplanamadı:", e);
    }
  };

  // Click Handler for Map Component
  function MapClickHandler() {
    useMapEvents({
      click(e: any) {
        const { lat, lng } = e.latlng;
        drawRouteToTarget(lat, lng, {
          toplanma_alani: `Seçilen Rota Hedefi (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          name: `Seçilen Rota Hedefi (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          lat: lat,
          lon: lng,
          status: "Kullanıcı Tarafından Seçilen Rota Hedefi",
        });
      },
    });
    return null;
  }

  // Custom Icon Builders
  const greenShieldIcon = L.divIcon({
    className: "custom-shelter-icon",
    html: `<div style="background:#10b981; border:2.5px solid #ffffff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 18px rgba(16,185,129,0.85);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

  const hazardIcon = L.divIcon({
    className: "custom-hazard-icon",
    html: `<div style="background:#ef4444; border:2px solid #ffffff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 15px rgba(239,68,68,0.9);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const userGpsIcon = L.divIcon({
    className: "custom-user-gps-icon",
    html: `<div style="background:#3b82f6; border:3px solid #ffffff; width:26px; height:26px; border-radius:50%; box-shadow:0 0 22px #3b82f6; display:flex; align-items:center; justify-content:center;"><div style="width:8px; height:8px; background:white; border-radius:50%;"></div></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

  const activeRoute = customRouteCoords && customRouteCoords.length > 0
    ? customRouteCoords
    : [[userLocation[0], userLocation[1]], selectedShelter ? [selectedShelter.lat || selectedShelter.display_lat!, selectedShelter.lon || selectedShelter.display_lon!] : [DEFAULT_LAT, DEFAULT_LON]];

  const routeStatusMeta =
    role !== "survivor"
      ? { label: "EKİP TAKTİK MÜDAHALE KORİDORU", colorClass: "text-cyan-400", Icon: Shield }
      : routeMode === "damage-aware"
      ? { label: "HASAR-FARKINDA GÜVENLİ ROTA", colorClass: "text-emerald-400", Icon: Shield }
      : routeMode === "fallback"
      ? { label: "GENEL ROTA (Hasar Verisi Yok)", colorClass: "text-amber-400", Icon: AlertTriangle }
      : { label: "CANLI AFAD SOKAK ROTASI", colorClass: "text-emerald-400", Icon: Shield };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-[#080c14]">
      {/* HEADER CONTROLS (CLEAN NON-OVERLAPPING BAR) */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 flex-wrap max-w-[calc(100%-180px)]">
        <button
          onClick={detectUserGPS}
          disabled={loading}
          className="glass-panel px-3.5 py-2 rounded-xl border border-cyan-500/40 bg-slate-950/90 text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-2 shadow-lg hover:bg-cyan-950/60 transition-all"
        >
          <Crosshair className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
          <span>{gpsStatus === "success" ? "GPS AKTİF" : "🎯 KONUMUMU BUL"}</span>
        </button>

        <span className="glass-panel px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/90 text-[11px] font-mono text-emerald-400 font-bold">
          AFAD RESMİ ALANLARI ({assemblyData?.records?.length || 0})
        </span>

        {damageAnalysisLoading && (
          <span className="glass-panel px-3 py-2 rounded-xl border border-amber-500/40 bg-slate-950/90 text-[11px] font-mono text-amber-300 font-bold flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 animate-spin" />
            🛰️ Uydu &amp; hasar analizi çalışıyor... (sunucu yoğunluğuna göre biraz sürebilir)
          </span>
        )}
      </div>

      {/* MAP OVERLAY LEGEND & CONTROLS (TOP RIGHT) */}
      <div className="absolute top-3 right-3 z-[1000] glass-panel p-3 rounded-2xl border border-slate-700/60 bg-slate-950/90 text-xs space-y-2 max-w-[200px] shadow-xl">
        <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-1">
          <span className="flex items-center gap-1.5 text-[11px]"><Layers className="w-3.5 h-3.5 text-emerald-400" /> HARİTA KATMANLARI</span>
        </div>

        <div className="space-y-1 text-[10px] font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block"></span>
            <span>Açık Yollar</span>
          </div>
          <div className="flex items-center gap-2 text-red-400">
            <span className="w-3 h-1 bg-red-500 border border-dashed rounded-full inline-block"></span>
            <span>Hasarlı Yollar</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <span className="w-3 h-1.5 bg-cyan-400 rounded-full inline-block shadow-[0_0_10px_#22d3ee]"></span>
            <span>OSM Sokak Rotası</span>
          </div>
        </div>
      </div>

      {/* FOOTER INFO CARD (BOTTOM LEFT) */}
      <div className="absolute bottom-3 left-3 z-[1000] glass-panel p-3.5 rounded-2xl border border-slate-700/60 bg-slate-950/95 flex items-center gap-3 max-w-sm shadow-2xl">
        <div className={`p-2.5 rounded-xl ${role === 'survivor' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
          {routingLoading ? <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" /> : <Navigation className="w-5 h-5 animate-pulse" />}
        </div>
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${routeStatusMeta.colorClass}`}>
            <routeStatusMeta.Icon className="w-3 h-3" />
            {routeStatusMeta.label}
          </div>
          <div className="text-xs font-black text-white font-mono flex items-center gap-2 mt-0.5 truncate max-w-[240px]">
            <span>{selectedShelter?.toplanma_alani || selectedShelter?.name || "AFAD Güvenli Bölge"}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-cyan-300 font-mono mt-0.5">
            <span className="flex items-center gap-1 font-bold">
              <MapPin className="w-3 h-3 text-cyan-400" /> {customDistanceM ? `${customDistanceM} m` : "Hesaplanıyor..."}
            </span>
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <Footprints className="w-3 h-3 text-emerald-400" /> ~{customWalkMinutes || 5} Dk Yürüme
            </span>
          </div>
          {routeErrorMsg && (
            <div className="text-[10px] text-red-400 font-bold mt-1">{routeErrorMsg}</div>
          )}
        </div>
      </div>

      {/* LEAFLET CONTAINER (DISABLE DEFAULT OVERLAPPING ZOOM CONTROL) */}
      <MapContainer center={userLocation} zoom={15} zoomControl={false} className="w-full h-full">
        <MapClickHandler />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO &copy; AFAD / QuakeMind GIS'
        />

        {/* OPEN ROADS (GREEN) - real segments from the satellite damage analysis */}
        {damageAnalysis?.safeRoadSegments.map((road, idx) => (
          <Polyline
            key={`open-${idx}`}
            positions={road as [number, number][]}
            pathOptions={{ color: "#10b981", weight: 5, opacity: 0.8 }}
          />
        ))}

        {/* BLOCKED ROADS (RED DASHED) - real segments from the satellite damage analysis */}
        {showBlocked &&
          damageAnalysis?.blockedRoadSegments.map((road, idx) => (
            <React.Fragment key={`blocked-${idx}`}>
              <Polyline
                positions={road as [number, number][]}
                pathOptions={{ color: "#ef4444", weight: 6, dashArray: "8, 8", opacity: 0.9 }}
              />
              {road.length > 1 && (
                <Marker position={road[Math.floor(road.length / 2)] as [number, number]} icon={hazardIcon}>
                  <Popup>
                    <div className="text-slate-900 text-xs font-sans space-y-1 p-1">
                      <div className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> HASARLI / KAPALI YOL</div>
                      <div>Uydu görüntüsü hasar analizine göre bu yol segmenti kapalı olarak tespit edildi.</div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          ))}

        {/* OSM STREET ROUTE (CYAN POLYLINE FOLLOWING STREET TURNS) */}
        {activeRoute.length > 1 && (
          <Polyline 
            positions={activeRoute} 
            pathOptions={{ color: "#06b6d4", weight: 7, opacity: 0.95 }} 
          />
        )}

        {/* USER GPS MARKER */}
        <Marker position={userLocation} icon={userGpsIcon}>
          <Tooltip permanent direction="top" offset={[0, -12]}>
            <span className="font-bold text-[10px] text-blue-400 bg-slate-950 px-2 py-1 rounded border border-blue-500 shadow">
              📍 KONUMUNUZ ({userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)})
            </span>
          </Tooltip>
        </Marker>

        {/* REAL OFFICIAL AFAD ASSEMBLY & SAFE ZONES */}
        {assemblyData?.records?.map((s, idx) => {
          const lat = s.lat || s.display_lat;
          const lon = s.lon || s.display_lon;
          if (!lat || !lon) return null;

          return (
            <Marker 
              key={idx} 
              position={[lat, lon]} 
              icon={greenShieldIcon}
              eventHandlers={{
                click: () => {
                  drawRouteToTarget(lat, lon, s);
                }
              }}
            >
              <Popup>
                <div className="text-slate-900 font-sans p-1 space-y-1.5 min-w-[220px]">
                  <div className="font-black text-sm text-emerald-700 flex items-center gap-1">
                    <Shield className="w-4 h-4 text-emerald-600" /> {s.toplanma_alani || s.name}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    Konum: <b>{s.ilce || "Antakya"} / {s.mahalle || "AFAD Bölgesi"}</b>
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    {s.status || "🟢 Güvenli AFAD Toplanma Alanı"}
                  </div>
                  <button 
                    onClick={() => drawRouteToTarget(lat, lon, s)}
                    className="w-full mt-2 bg-cyan-600 text-white font-bold text-xs py-2 rounded-lg shadow hover:bg-cyan-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" /> ⚡ Buraya Sokak Rotası Çiz
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

const DynamicSafeEvacuationMap = dynamic(() => Promise.resolve(InnerEvacuationMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-mono text-xs">
      Afet Güvenlik & 72.232 AFAD Toplanma Alanı Haritası Yükleniyor...
    </div>
  ),
});

export default function SafeEvacuationMap(props: SafeEvacuationMapProps) {
  return <DynamicSafeEvacuationMap {...props} />;
}
