"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Shield, Navigation, AlertTriangle, CheckCircle2, Layers, Compass } from "lucide-react";

interface SafeEvacuationMapProps {
  role?: "survivor" | "command";
  height?: string;
  onShelterSelect?: (shelterName: string) => void;
}

// Sample GIS Data for Evacuation & Road Status (Hatay/Antakya Region)
const OPEN_ROADS: [number, number][][] = [
  // Atatürk Cad. Open Corridor
  [[36.2025, 36.1600], [36.2050, 36.1640], [36.2080, 36.1680], [36.2120, 36.1730]],
  // Çevre Yolu Safe Route
  [[36.1980, 36.1550], [36.2000, 36.1700], [36.2150, 36.1800]],
];

const BLOCKED_ROADS: [number, number][][] = [
  // Cebrail Mah. Blocked / Collapsed Road
  [[36.2050, 36.1640], [36.2040, 36.1670], [36.2020, 36.1690]],
  // 600 Evler Damage Zone
  [[36.2100, 36.1700], [36.2090, 36.1740]],
];

const SAFE_ROUTE: [number, number][] = [
  [36.2025, 36.1600], // Start (User GPS / Base)
  [36.2050, 36.1640],
  [36.2080, 36.1680], // Bypasses Cebrail blockage via Atatürk Cd.
  [36.2120, 36.1730], // Arrives at Safe Shelter
];

const SHELTERS = [
  { id: 1, name: "Antakya Şehir Stadyumu Toplanma Alanı", coords: [36.2120, 36.1730] as [number, number], capacity: "850 / 2000 Kişi", status: "Güvenli - Su & Gıda Var", distance: "950m" },
  { id: 2, name: "Fuar Alanı Güvenli Çadır Kenti", coords: [36.2150, 36.1800] as [number, number], capacity: "1200 / 3000 Kişi", status: "Güvenli - Sağlık Ekibi Mevcut", distance: "1.8 km" },
  { id: 3, name: "Primemall Açık Park Sığınağı", coords: [36.1980, 36.1550] as [number, number], capacity: "400 / 1000 Kişi", status: "Güvenli - Jeneratör Aktif", distance: "1.2 km" },
];

function MapContent({ role, onShelterSelect }: SafeEvacuationMapProps) {
  const { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } = require("react-leaflet");
  const L = require("leaflet");
  require("leaflet/dist/leaflet.css");

  const [selectedShelter, setSelectedShelter] = useState(SHELTERS[0]);
  const [showBlocked, setShowBlocked] = useState(true);

  // Custom Icon Builders
  const greenShieldIcon = L.divIcon({
    className: "custom-shelter-icon",
    html: `<div style="background:#10b981; border:2px solid #ffffff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 15px rgba(16,185,129,0.8);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const hazardIcon = L.divIcon({
    className: "custom-hazard-icon",
    html: `<div style="background:#ef4444; border:2px solid #ffffff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 15px rgba(239,68,68,0.9);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const userGpsIcon = L.divIcon({
    className: "custom-user-gps-icon",
    html: `<div style="background:#3b82f6; border:3px solid #ffffff; width:24px; height:24px; border-radius:50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; box-shadow:0 0 20px #3b82f6;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800">
      {/* MAP OVERLAY LEGEND & CONTROLS */}
      <div className="absolute top-4 right-4 z-[1000] glass-panel p-3 rounded-2xl border border-slate-700/60 bg-slate-950/80 backdrop-blur-md text-xs space-y-2 max-w-xs">
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
            <span className="w-4 h-1.5 bg-cyan-400 rounded-full inline-block shadow-[0_0_8px_#22d3ee]"></span>
            <span>En Kısa Güvenli Rota</span>
          </div>
        </div>
      </div>

      {/* ROLE OVERLAY BANNER */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-panel p-3.5 rounded-2xl border border-slate-700/60 bg-slate-950/90 backdrop-blur-md flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${role === 'survivor' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
          {role === 'survivor' ? <Navigation className="w-5 h-5 animate-pulse" /> : <Compass className="w-5 h-5" />}
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {role === 'survivor' ? 'AFETZEDE GÜVENLİ NAVİGASYON' : 'EKİP TAKTİK KONVOY ROTASI'}
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <span>{selectedShelter.name}</span>
            <span className="text-xs text-emerald-400 font-bold">({selectedShelter.distance})</span>
          </div>
        </div>
      </div>

      {/* LEAFLET CONTAINER */}
      <MapContainer center={[36.2050, 36.1650]} zoom={14} className="w-full h-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; QuakeMind GIS'
        />

        {/* OPEN ROADS (GREEN) */}
        {OPEN_ROADS.map((road, idx) => (
          <Polyline key={`open-${idx}`} positions={road} pathOptions={{ color: "#10b981", weight: 5, opacity: 0.8 }} />
        ))}

        {/* BLOCKED ROADS (RED DASHED) */}
        {showBlocked && BLOCKED_ROADS.map((road, idx) => (
          <React.Fragment key={`blocked-${idx}`}>
            <Polyline positions={road} pathOptions={{ color: "#ef4444", weight: 6, dashArray: "8, 8", opacity: 0.9 }} />
            <Marker position={road[1]} icon={hazardIcon}>
              <Popup>
                <div className="text-slate-900 text-xs font-sans space-y-1 p-1">
                  <div className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> YOL ÇÖKMÜŞ / KAPALI</div>
                  <div>Cebrail Mah. İnönü Cad. bina enkazı nedeniyle araç ve yaya trafiğine kapalıdır.</div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* SAFE ANIMATED ROUTE (BLUE) */}
        <Polyline 
          positions={SAFE_ROUTE} 
          pathOptions={{ color: "#06b6d4", weight: 6, opacity: 0.95 }} 
        />

        {/* USER / BASE GPS START */}
        <Marker position={SAFE_ROUTE[0]} icon={userGpsIcon}>
          <Tooltip permanent direction="top" offset={[0, -10]}>
            <span className="font-bold text-[10px] text-blue-600">KONUMUNUZ (BAŞLANGIÇ)</span>
          </Tooltip>
        </Marker>

        {/* SAFE SHELTER MARKERS */}
        {SHELTERS.map((s) => (
          <Marker 
            key={s.id} 
            position={s.coords} 
            icon={greenShieldIcon}
            eventHandlers={{
              click: () => {
                setSelectedShelter(s);
                if (onShelterSelect) onShelterSelect(s.name);
              }
            }}
          >
            <Popup>
              <div className="text-slate-900 font-sans p-1 space-y-1.5 min-w-[200px]">
                <div className="font-black text-sm text-emerald-700 flex items-center gap-1">
                  <Shield className="w-4 h-4 text-emerald-600" /> {s.name}
                </div>
                <div className="text-xs text-slate-600 font-medium">Kapasite: <b>{s.capacity}</b></div>
                <div className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  {s.status}
                </div>
                <button 
                  onClick={() => setSelectedShelter(s)}
                  className="w-full mt-2 bg-emerald-600 text-white font-bold text-xs py-1.5 rounded-lg shadow hover:bg-emerald-700 transition-colors"
                >
                  Buraya Rota Çiz
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function SafeEvacuationMap(props: SafeEvacuationMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[350px] bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-mono text-xs">
        Afet Güvenlik & Rota Haritası Yükleniyor...
      </div>
    );
  }

  return <MapContent {...props} />;
}
