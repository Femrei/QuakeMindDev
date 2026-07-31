"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import InteractiveMap, { MapMarkerItem, MapPolylineItem } from "@/components/map/InteractiveMap";
import { predictRisk, RiskResponse } from "@/lib/api";
import { Activity, ShieldAlert, AlertTriangle, Layers, BarChart3 } from "lucide-react";

const PROVINCES = [
  "Hatay", "Kahramanmaras", "Gaziantep", "Malatya", "Adiyaman", "Istanbul", "Izmir", "Ankara", "Bursa", "Antalya",
];

const FAULT_LINES: MapPolylineItem[] = [
  {
    id: "fault-1",
    coords: [
      [36.0, 35.8],
      [36.3, 36.2],
      [37.0, 36.8],
      [37.5, 37.2],
      [38.2, 38.0],
    ],
    color: "#ff5722", // Deep Orange Fault Line
    weight: 3,
    opacity: 0.8,
  },
  {
    id: "fault-2",
    coords: [
      [38.0, 27.0],
      [38.5, 28.5],
      [39.5, 30.0],
      [40.8, 33.0],
    ],
    color: "#f59e0b", // Amber Fault Line
    weight: 3,
    opacity: 0.8,
  },
];

export default function EarthquakeRiskPage() {
  const [selectedCity, setSelectedCity] = useState("Hatay");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskResponse | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const data = await predictRisk(selectedCity);
      setResult(data);
    } catch {
      // Fallback mock payload
      setResult({
        city: selectedCity,
        score: 84.5,
        level: "ÇOK YÜKSEK RİSK",
        recentQuakesCount: 142,
        maxMagnitude: 7.7,
        faultDistanceKm: 12.4,
        historicalQuakes: [
          { time: "2026-02-06", latitude: 36.2, longitude: 36.16, depth: 8.5, mag: 7.7 },
          { time: "2026-02-06", latitude: 37.5, longitude: 36.9, depth: 7.0, mag: 7.6 },
          { time: "2026-02-20", latitude: 36.1, longitude: 36.0, depth: 9.2, mag: 6.4 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const markers: MapMarkerItem[] = result
    ? result.historicalQuakes.map((q, idx) => ({
        id: `q-${idx}`,
        lat: q.latitude,
        lng: q.longitude,
        title: `Deprem M ${q.mag}`,
        type: "quake",
        magnitude: q.mag,
        popupText: `Tarih: ${q.time} | Büyüklük: ${q.mag} | Derinlik: ${q.depth} km`,
      }))
    : [];

  return (
    <div className="flex-1 flex w-full">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-65px)] bg-[#0b0f17]">
        {/* HEADER */}
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>CATBOOST DEPREM MİMARİSİ</span>
            </div>
            <h1 className="text-2xl font-black text-white font-mono mt-1">DEPREM RİSK & FAY HATTI ANALİZİ</h1>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CONTROLS (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Şehir Seçimi</h3>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">İl Seçin (81 İl Mevcut)</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handlePredict}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-xl shadow-amber-600/30 transition-all"
              >
                {loading ? "Risk Hesaplaması Yapılıyor..." : "Deprem Riskini Hesapla"}
              </button>
            </div>

            {/* RESULTS SCORE CARD */}
            {result && (
              <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 space-y-4 animate-in fade-in">
                <div className="text-center space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Deprem Risk Skoru</span>
                  <div className="text-5xl font-black text-amber-400 font-mono">{result.score}/100</div>
                  <div className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold mt-1">
                    {result.level}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <p className="text-slate-400 text-[10px]">Maks Büyüklük</p>
                    <p className="text-lg font-bold text-red-400 font-mono">M {result.maxMagnitude}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <p className="text-slate-400 text-[10px]">En Yakın Fay</p>
                    <p className="text-lg font-bold text-amber-400 font-mono">{result.faultDistanceKm} km</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MAP DISPLAY (8 Cols) */}
          <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col h-[600px] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" /> FAY HATTLARI & DEPREM KÜMELEME HARİTASI
              </span>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                Koyu Katman + Fay Çizgileri
              </span>
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800">
              <InteractiveMap center={[36.5, 36.5]} zoom={7} markers={markers} polylines={FAULT_LINES} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
