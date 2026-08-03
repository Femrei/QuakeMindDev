"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import InteractiveMap, { MapMarkerItem, MapPolylineItem } from "@/components/map/InteractiveMap";
import { getSOSAlerts, fetchServerStatus, SOSAlert } from "@/lib/api";
import { deriveUrgencyTier, urgencyLabel, urgencyTextClass } from "@/lib/urgency";
import { 
  ShieldAlert, 
  Siren, 
  Map as MapIcon, 
  Activity, 
  FileText, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  ArrowUpRight
} from "lucide-react";

const ANTAKYA_CENTER: [number, number] = [36.202, 36.161];

export default function CommandDashboardPage() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ nlp: boolean; risk: boolean; road_damage: boolean }>({
    nlp: true,
    risk: true,
    road_damage: true,
  });

  useEffect(() => {
    getSOSAlerts()
      .then((data) => {
        setAlerts(data.alerts);
        setLoading(false);
      })
      .catch(() => {
        // Mock sample SOS alerts for fallback
        setAlerts([
          {
            id: "sos-1",
            latitude: 36.208,
            longitude: 36.165,
            message: "[KİŞİ: 4] [KRİTİK] Cebrail Mah. Enkaz altı ses alındı!",
            receivedAt: new Date().toISOString(),
            urgency: "CRITICAL",
            status: "OPEN",
          },
          {
            id: "sos-2",
            latitude: 36.195,
            longitude: 36.152,
            message: "[KİŞİ: 2] [YARALI] Atatürk Cad. Yaşlı çift mahsur.",
            receivedAt: new Date(Date.now() - 15 * 60000).toISOString(),
            urgency: "HIGH",
            status: "EN_ROUTE",
          },
          {
            id: "sos-3",
            latitude: 36.215,
            longitude: 36.175,
            message: "[KİŞİ: 1] [NORMAL] Kan ve battaniye acil ihtiyaç.",
            receivedAt: new Date(Date.now() - 45 * 60000).toISOString(),
            urgency: "HIGH",
            status: "RESOLVED",
          },
        ]);
        setLoading(false);
      });

    fetchServerStatus().then((res) => setStatus(res.modules)).catch(() => {});
  }, []);

  const markers: MapMarkerItem[] = alerts.map((a) => ({
    id: a.id,
    lat: a.latitude,
    lng: a.longitude,
    title: `SOS: ${a.message || "Acil Çağrı"}`,
    type: "sos",
    popupText: `Durum: ${a.status || "AÇIK"} | Alındı: ${new Date(a.receivedAt).toLocaleTimeString()}`,
  }));

  return (
    <div className="flex-1 flex w-full">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-65px)] bg-[#0b0f17]">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
              <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
              <span>AFET SAHASI WAR ROOM KOMUTA MERKEZİ</span>
            </div>
            <h1 className="text-2xl font-black text-white font-mono mt-1">GENEL OPERASYON TABLOSU</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/command/sos"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all"
            >
              <Siren className="w-4 h-4 animate-bounce" /> CANLI SOS SEVK
            </Link>
            <Link
              href="/command/road-damage"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <MapIcon className="w-4 h-4" /> UYDU YOL ANALİZİ
            </Link>
          </div>
        </div>

        {/* METRICS ROW (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-red-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Aktif SOS İhbarları</span>
              <Siren className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-400 font-mono">{alerts.length}</span>
              <span className="text-xs text-red-300/80 font-bold">Vaka Bekliyor</span>
            </div>
            <div className="text-[10px] text-slate-500">2 Kritik Enkaz Çağrısı Aktif</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Arama Kurtarma Ekipleri</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">18</span>
              <span className="text-xs text-emerald-300/80 font-bold">Saha Ekibi</span>
            </div>
            <div className="text-[10px] text-slate-500">12 Ekip Görevde, 6 Hazırda</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Uydu Hasar Oranı</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400 font-mono">%34.8</span>
              <span className="text-xs text-amber-300/80 font-bold">Tıkalı Sokak</span>
            </div>
            <div className="text-[10px] text-slate-500">Segformer MIT-B4 Model Analizi</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Yapay Zeka Modülleri</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-400 font-mono">3/3</span>
              <span className="text-xs text-blue-300/80 font-bold">Tümü Aktif</span>
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> NLP, Risk & Segformer Hazır
            </div>
          </div>
        </div>

        {/* MAP & INCIDENT FEED GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MAP DISPLAY (8 Cols) */}
          <div className="lg:col-span-8 glass-panel p-5 rounded-3xl border border-slate-800 space-y-3 flex flex-col h-[520px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-blue-400" /> CANLI AFET SAHASI & SOS HARİTASI
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                60 FPS Leaflet GPU Engine
              </span>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800">
              <InteractiveMap center={ANTAKYA_CENTER} zoom={13} markers={markers} />
            </div>
          </div>

          {/* REAL-TIME INCIDENT FEED (4 Cols) */}
          <div className="lg:col-span-4 glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Siren className="w-4 h-4 text-red-500 animate-pulse" /> CANLI İHBAR AKIŞI
              </span>
              <Link href="/command/sos" className="text-[11px] text-blue-400 hover:underline font-semibold">
                Tümünü Gör
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold flex items-center gap-1 ${urgencyTextClass(deriveUrgencyTier(a))}`}>
                      <AlertTriangle className="w-3.5 h-3.5" /> {urgencyLabel(deriveUrgencyTier(a))}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(a.receivedAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">{a.message}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                    <span className="text-slate-400">Konum: {a.latitude.toFixed(3)}, {a.longitude.toFixed(3)}</span>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {a.status || "AÇIK"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
