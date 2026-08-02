"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import InteractiveMap, { MapMarkerItem } from "@/components/map/InteractiveMap";
import { getSOSAlerts, sendSOSAlert, SOSAlert } from "@/lib/api";
import { useMapLayers } from "@/context/MapLayersContext";
import { Siren, ShieldAlert, CheckCircle2, Clock, UserCheck, Plus, Filter } from "lucide-react";

export default function SOSDispatchPage() {
  const { setSosAlerts } = useMapLayers();
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "EN_ROUTE" | "RESOLVED">("ALL");

  useEffect(() => {
    getSOSAlerts()
      .then((data) => setAlerts(data.alerts))
      .catch(() => {
        setAlerts([
          {
            id: "sos-101",
            latitude: 36.208,
            longitude: 36.165,
            message: "[KİŞİ: 4] [KRİTİK] Cebrail Mah. Enkaz altı ses var!",
            receivedAt: new Date().toISOString(),
            status: "OPEN",
            urgency: "CRITICAL",
          },
          {
            id: "sos-102",
            latitude: 36.195,
            longitude: 36.152,
            message: "[KİŞİ: 2] [YARALI] Atatürk Cad. Yaşlı çift mahsur.",
            receivedAt: new Date(Date.now() - 20 * 60000).toISOString(),
            status: "EN_ROUTE",
            urgency: "HIGH",
          },
          {
            id: "sos-103",
            latitude: 36.215,
            longitude: 36.175,
            message: "[KİŞİ: 1] [NORMAL] Kan ve battaniye acil ihtiyaç.",
            receivedAt: new Date(Date.now() - 60 * 60000).toISOString(),
            status: "RESOLVED",
            urgency: "HIGH",
          },
        ]);
      });
  }, []);

  useEffect(() => {
    setSosAlerts(alerts);
  }, [alerts, setSosAlerts]);

  const updateStatus = (id: string, newStatus: "OPEN" | "EN_ROUTE" | "RESOLVED") => {
    setAlerts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    if (selectedAlert && selectedAlert.id === id) {
      setSelectedAlert({ ...selectedAlert, status: newStatus });
    }
  };

  const filteredAlerts = alerts.filter((a) => (filter === "ALL" ? true : a.status === filter));

  const markers: MapMarkerItem[] = filteredAlerts.map((a) => ({
    id: a.id,
    lat: a.latitude,
    lng: a.longitude,
    title: a.message || "SOS İhbarı",
    type: "sos",
    popupText: `Durum: ${a.status || "AÇIK"}`,
  }));

  return (
    <div className="flex-1 flex w-full">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-65px)] bg-[#0b0f17]">
        {/* HEADER */}
        <div className="glass-panel p-6 rounded-3xl border border-red-500/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-widest">
              <Siren className="w-4 h-4 text-red-500 animate-bounce" />
              <span>ACİL İHBAR VE EKİP SEVK MERKEZİ</span>
            </div>
            <h1 className="text-2xl font-black text-white font-mono mt-1">SOS SEVK YÖNETİMİ</h1>
          </div>

          <div className="flex items-center gap-2">
            {(["ALL", "OPEN", "EN_ROUTE", "RESOLVED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === st
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "glass-button text-slate-400"
                }`}
              >
                {st === "ALL" ? "Tümü" : st === "OPEN" ? "Açık" : st === "EN_ROUTE" ? "Ekipler Yolda" : "Kurtarıldı"}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* INCIDENT LIST (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>İhbar Listesi ({filteredAlerts.length})</span>
              <span className="text-red-400">Canlı Bağlantı Aktif</span>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedAlert?.id === alert.id
                      ? "bg-slate-900 border-red-500 shadow-xl shadow-red-500/10"
                      : "glass-panel border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-red-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> {alert.urgency || "KRİTİK"}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(alert.receivedAt).toLocaleTimeString()}</span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium leading-relaxed">{alert.message}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-[11px] text-slate-400">
                      Konum: {alert.latitude.toFixed(3)}, {alert.longitude.toFixed(3)}
                    </span>
                    <div className="flex items-center gap-1">
                      {alert.status === "OPEN" && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">AÇIK</span>
                      )}
                      {alert.status === "EN_ROUTE" && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">YOLDA</span>
                      )}
                      {alert.status === "RESOLVED" && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">ÇÖZÜLDÜ</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MAP & ACTION DETAILS (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 h-[400px] overflow-hidden">
              <InteractiveMap
                center={
                  selectedAlert
                    ? [selectedAlert.latitude, selectedAlert.longitude]
                    : [36.202, 36.161]
                }
                zoom={14}
                markers={markers}
              />
            </div>

            {/* ACTION PANEL */}
            {selectedAlert ? (
              <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Vaka Detayı & Ekip Atama</h3>
                    <p className="text-xs text-slate-400">ID: {selectedAlert.id}</p>
                  </div>
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                    {selectedAlert.urgency || "KRİTİK"}
                  </span>
                </div>

                <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedAlert.message}
                </p>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-300">Durumu Güncelle:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStatus(selectedAlert.id, "OPEN")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedAlert.status === "OPEN"
                          ? "bg-red-600 text-white border-red-500"
                          : "glass-button text-slate-400"
                      }`}
                    >
                      Açık Vaka
                    </button>
                    <button
                      onClick={() => updateStatus(selectedAlert.id, "EN_ROUTE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedAlert.status === "EN_ROUTE"
                          ? "bg-amber-600 text-white border-amber-500"
                          : "glass-button text-slate-400"
                      }`}
                    >
                      Ekip Yolda
                    </button>
                    <button
                      onClick={() => updateStatus(selectedAlert.id, "RESOLVED")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedAlert.status === "RESOLVED"
                          ? "bg-emerald-600 text-white border-emerald-500"
                          : "glass-button text-slate-400"
                      }`}
                    >
                      Kurtarıldı / Çözüldü
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-center text-xs text-slate-400">
                Haritadan veya listeden bir SOS ihbarı seçerek ekip atayabilir ve durumunu değiştirebilirsiniz.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
