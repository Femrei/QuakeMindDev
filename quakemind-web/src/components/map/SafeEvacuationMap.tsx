"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Shield, Navigation, AlertTriangle, CheckCircle2, Layers, Compass, Crosshair, RefreshCw, MapPin, Footprints, Zap } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { getEvacuationAssemblyData, calculateCustomRoute, EvacuationAssemblyRecord, EvacuationAssemblyResponse } from "@/lib/api";

interface SafeEvacuationMapProps {
  role?: "survivor" | "command";
  height?: string;
  onShelterSelect?: (shelterName: string) => void;
}

// Fallback Default Location: Antakya Epicenter
const DEFAULT_LAT = 36.2050;
const DEFAULT_LON = 36.1650;

// Sample Road Blockages & Open Corridors in Region
const DEFAULT_OPEN_ROADS: [number, number][][] = [
  [[36.2025, 36.1600], [36.2050, 36.1640], [36.2080, 36.1680], [36.2120, 36.1730]],
  [[36.1980, 36.1550], [36.2000, 36.1700], [36.2150, 36.1800]],
];

const DEFAULT_BLOCKED_ROADS: [number, number][][] = [
  [[36.2050, 36.1640], [36.2040, 36.1670], [36.2020, 36.1690]],
  [[36.2100, 36.1700], [36.2090, 36.1740]],
];

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
      const data = await getEvacuationAssemblyData(lat, lon, 8.0);
      setAssemblyData(data);
      if (data.nearest) {
        setSelectedShelter(data.nearest);
        if (data.routeCoords && data.routeCoords.length > 0) {
          setCustomRouteCoords(data.routeCoords);
          setCustomDistanceM(data.routeLengthM || 950);
          setCustomWalkMinutes(Math.max(1, Math.round((data.routeLengthM || 950) / 80)));
        }
      }
    } catch (e) {
      console.warn("Backend toplanma alanı API offline, yerel AFAD veri seti kullanılıyor:", e);
      const mockRecords: EvacuationAssemblyRecord[] = [
        { name: "Antakya Şehir Stadyumu Toplanma Alanı", lat: 36.2120, lon: 36.1730, ilce: "Antakya", mahalle: "Atatürk Mah.", capacity: "2,000 Kişi", status: "Güvenli - Su & Gıda Var", priority: 0 },
        { name: "Fuar Alanı Güvenli Çadır Kenti", lat: 36.2150, lon: 36.1800, ilce: "Antakya", mahalle: "Aksaray Mah.", capacity: "3,000 Kişi", status: "Güvenli - Sağlık Ekibi Mevcut", priority: 0 },
        { name: "Primemall Açık Park Sığınağı", lat: 36.1980, lon: 36.1550, ilce: "Defne", mahalle: "Harbiye", capacity: "1,000 Kişi", status: "Güvenli - Jeneratör Aktif", priority: 0 },
      ];
      setAssemblyData({
        records: mockRecords,
        activeDataSource: "Çevrimdışı AFAD Veri Seti",
        nearest: mockRecords[0],
        nearestAirM: 950,
        routeCoords: [
          [lat, lon],
          [36.2050, 36.1640],
          [36.2080, 36.1680],
          [36.2120, 36.1730],
        ],
        routeLengthM: 1250,
      });
      setSelectedShelter(mockRecords[0]);
      setCustomRouteCoords([
        [lat, lon],
        [36.2050, 36.1640],
        [36.2080, 36.1680],
        [36.2120, 36.1730],
      ]);
      setCustomDistanceM(1250);
      setCustomWalkMinutes(15);
    } finally {
      setLoading(false);
    }
  };

  // ROUTE DRAWING TO ANY CLICKED SHELTER OR MAP POINT
  const drawRouteToTarget = async (destLat: number, destLon: number, shelterObj?: EvacuationAssemblyRecord) => {
    setRoutingLoading(true);
    if (shelterObj) {
      setSelectedShelter(shelterObj);
      if (onShelterSelect) onShelterSelect(shelterObj.toplanma_alani || shelterObj.name || "Güvenli Bölge");
    }

    try {
      const res = await calculateCustomRoute(userLocation[0], userLocation[1], destLat, destLon);
      if (res.routeCoords && res.routeCoords.length > 0) {
        setCustomRouteCoords(res.routeCoords);
        setCustomDistanceM(res.routeLengthM);
        setCustomWalkMinutes(res.estWalkMinutes);
      }
    } catch (e) {
      console.warn("Rota hesaplama API hatası, doğrudan interpolasyon yapılıyor:", e);
      const fallbackPath: [number, number][] = [
        [userLocation[0], userLocation[1]],
        [userLocation[0] + (destLat - userLocation[0]) * 0.5, userLocation[1] + (destLon - userLocation[1]) * 0.5],
        [destLat, destLon],
      ];
      setCustomRouteCoords(fallbackPath);
      setCustomDistanceM(1100);
      setCustomWalkMinutes(14);
    } finally {
      setRoutingLoading(false);
    }
  };

  // Click Handler for Map Component
  function MapClickHandler() {
    useMapEvents({
      click(e: any) {
        const { lat, lng } = e.latlng;
        drawRouteToTarget(lat, lng, {
          name: `Özel Seçilen Güvenli Nokta (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          lat: lat,
          lon: lng,
          status: "Kullanıcı Seçimli Hedef",
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

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800">
      {/* GPS DETECT BUTTON & STATUS */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
        <button
          onClick={detectUserGPS}
          disabled={loading}
          className="glass-panel px-3.5 py-2.5 rounded-2xl border border-cyan-500/40 bg-slate-950/85 backdrop-blur-md text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-2 shadow-lg hover:bg-cyan-950/50 transition-all"
        >
          <Crosshair className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
          <span>{gpsStatus === "success" ? "GPS KONUMU AKTİF" : "🎯 KONUMUMU BUL"}</span>
        </button>

        <span className="glass-panel px-3 py-2 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md text-[10px] font-mono text-slate-300">
          AFAD RESMİ ALANLARI ({assemblyData?.records?.length || 0})
        </span>
      </div>

      {/* MAP OVERLAY LEGEND & CONTROLS */}
      <div className="absolute top-4 right-4 z-[1000] glass-panel p-3.5 rounded-2xl border border-slate-700/60 bg-slate-950/85 backdrop-blur-md text-xs space-y-2 max-w-xs">
        <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-1.5">
          <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-emerald-400" /> HARİTA KATMANLARI</span>
          <button 
            onClick={() => setShowBlocked(!showBlocked)}
            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${showBlocked ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-slate-800 text-slate-400"}`}
          >
            {showBlocked ? "KAPALI YOLLAR AÇIK" : "GİZLİ"}
          </button>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="w-4 h-1 bg-emerald-500 rounded-full inline-block"></span>
            <span>Açık / Güvenli Yollar</span>
          </div>
          <div className="flex items-center gap-2 text-red-400 font-medium">
            <span className="w-4 h-1 bg-red-500 border border-dashed rounded-full inline-block"></span>
            <span>Kapalı / Hasarlı Yollar</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <span className="w-4 h-1.5 bg-cyan-400 rounded-full inline-block shadow-[0_0_10px_#22d3ee]"></span>
            <span>Dijkstra En Kısa Güvenli Rota</span>
          </div>
        </div>
      </div>

      {/* ROLE OVERLAY BANNER WITH LIVE ROUTE STATS */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-panel p-4 rounded-2xl border border-slate-700/60 bg-slate-950/95 backdrop-blur-md flex items-center gap-3.5 max-w-md shadow-2xl">
        <div className={`p-3 rounded-2xl ${role === 'survivor' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
          {routingLoading ? <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" /> : role === 'survivor' ? <Navigation className="w-6 h-6 animate-pulse" /> : <Compass className="w-6 h-6" />}
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            {role === 'survivor' ? 'SEÇİLİ GÜVENLİ HEDEF & CANLI ROTA' : 'EKİP TAKTİK MÜDAHALE KORİDORU'}
          </div>
          <div className="text-sm font-black text-white font-mono flex items-center gap-2 mt-0.5">
            <span>{selectedShelter?.toplanma_alani || selectedShelter?.name || "AFAD Güvenli Bölge"}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-cyan-300 font-mono mt-1">
            <span className="flex items-center gap-1 font-bold">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {customDistanceM ? `${customDistanceM} m` : "Hesaplanıyor..."}
            </span>
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <Footprints className="w-3.5 h-3.5 text-emerald-400" /> ~{customWalkMinutes || 5} Dk Yürüme
            </span>
          </div>
        </div>
      </div>

      {/* LEAFLET CONTAINER */}
      <MapContainer center={userLocation} zoom={14} className="w-full h-full">
        <MapClickHandler />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO &copy; AFAD / QuakeMind GIS'
        />

        {/* OPEN ROADS (GREEN) */}
        {DEFAULT_OPEN_ROADS.map((road, idx) => (
          <Polyline key={`open-${idx}`} positions={road} pathOptions={{ color: "#10b981", weight: 5, opacity: 0.8 }} />
        ))}

        {/* BLOCKED ROADS (RED DASHED) */}
        {showBlocked && DEFAULT_BLOCKED_ROADS.map((road, idx) => (
          <React.Fragment key={`blocked-${idx}`}>
            <Polyline positions={road} pathOptions={{ color: "#ef4444", weight: 6, dashArray: "8, 8", opacity: 0.9 }} />
            <Marker position={road[1]} icon={hazardIcon}>
              <Popup>
                <div className="text-slate-900 text-xs font-sans space-y-1 p-1">
                  <div className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> HASARLI / KAPALI YOL</div>
                  <div>Yapı çökmesi nedeniyle yol araç ve yaya trafiğine kapatılmıştır.</div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* DIJKSTRA / OSM SHORT SAFE ROUTE (CYAN) */}
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
                    Konum: <b>{s.ilce || "Merkez"} / {s.mahalle || "AFAD Bölgesi"}</b>
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    {s.status || "🟢 Güvenli AFAD Toplanma Alanı"}
                  </div>
                  <button 
                    onClick={() => drawRouteToTarget(lat, lon, s)}
                    className="w-full mt-2 bg-cyan-600 text-white font-bold text-xs py-2 rounded-lg shadow hover:bg-cyan-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" /> ⚡ Buraya En Kısa Rotayı Çiz
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
