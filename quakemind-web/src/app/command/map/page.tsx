"use client";

import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import InteractiveMap, { MapMarkerItem, MapPolylineItem } from "@/components/map/InteractiveMap";
import { useMapLayers, LayerKey } from "@/context/MapLayersContext";
import { getFaultLines } from "@/lib/api";
import { Layers, Siren, FileText, Activity, Waves, Map as MapIcon, Tent, Clock } from "lucide-react";

const TURKEY_CENTER: [number, number] = [38.9, 35.2];

interface LayerDef {
  key: LayerKey;
  label: string;
  icon: React.ElementType;
  color: string;
  count: number;
  updatedAt: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Henüz veri yok";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  return `${hours} sa önce`;
}

export default function UnifiedCommandMapPage() {
  const {
    sosAlerts,
    sosUpdatedAt,
    nlpIncidents,
    riskLayer,
    riskUpdatedAt,
    faultLinesUpdatedAt,
    setAllFaultLines,
    roadDamageAnalyses,
    assemblyAreas,
    assemblyUpdatedAt,
    layerVisibility,
    toggleLayer,
  } = useMapLayers();

  const [faultLinesLoading, setFaultLinesLoading] = useState(false);

  // Lazy-fetch: Turkiye geneli fay hatti veri seti buyuk oldugu icin sadece
  // katman ilk kez acildiginda ve daha once cekilmediyse indirilir.
  useEffect(() => {
    if (!layerVisibility.faultLines) return;
    if (riskLayer.allFaultLines.length > 0) return;
    setFaultLinesLoading(true);
    getFaultLines()
      .then((data) => setAllFaultLines(data.faultLines))
      .catch(() => {})
      .finally(() => setFaultLinesLoading(false));
  }, [layerVisibility.faultLines, riskLayer.allFaultLines.length, setAllFaultLines]);

  const markers: MapMarkerItem[] = useMemo(() => {
    const list: MapMarkerItem[] = [];

    if (layerVisibility.sos) {
      sosAlerts.forEach((a) =>
        list.push({
          id: `sos-${a.id}`,
          lat: a.latitude,
          lng: a.longitude,
          title: a.message || "SOS İhbarı",
          type: "sos",
          popupText: `Durum: ${a.status || "AÇIK"}`,
          linkHref: "/command/sos",
          linkLabel: "SOS Sevk Ekranına Git",
        })
      );
    }

    if (layerVisibility.nlp) {
      nlpIncidents.forEach((n) =>
        list.push({
          ...n.marker,
          linkHref: "/command/nlp",
          linkLabel: "NLP Analiz Ekranına Git",
        })
      );
    }

    if (layerVisibility.risk && riskLayer.cityResult) {
      const r = riskLayer.cityResult;
      r.mapEvents.forEach((q, idx) =>
        list.push({
          id: `risk-q-${idx}`,
          lat: q.latitude,
          lng: q.longitude,
          title: `${q.label} — M ${q.magnitude}`,
          type: "quake",
          magnitude: q.magnitude,
          popupText: `Tarih: ${q.timeLabel.slice(0, 10)} | Büyüklük: ${q.magnitude}`,
          linkHref: "/command/risk",
          linkLabel: "Risk Paneline Git",
        })
      );
      list.push({
        id: "risk-city",
        lat: r.coordinates.lat,
        lng: r.coordinates.lon,
        title: r.city,
        type: "shelter",
        popupText: `Risk Skoru: ${r.riskScore} — ${r.riskLevel}`,
        linkHref: "/command/risk",
        linkLabel: "Risk Paneline Git",
      });
    }

    if (layerVisibility.assemblyAreas) {
      assemblyAreas.forEach((rec, idx) =>
        list.push({
          id: `assembly-${idx}`,
          lat: rec.display_lat ?? rec.lat,
          lng: rec.display_lon ?? rec.lon,
          title: rec.toplanma_alani,
          type: "shelter",
          popupText: rec.note || rec.category,
          linkHref: "/command/road-damage",
          linkLabel: "Toplanma Alanları Ekranına Git",
        })
      );
    }

    return list;
  }, [layerVisibility, sosAlerts, nlpIncidents, riskLayer.cityResult, assemblyAreas]);

  const polylines: MapPolylineItem[] = useMemo(() => {
    const list: MapPolylineItem[] = [];

    if (layerVisibility.faultLines) {
      riskLayer.allFaultLines.forEach((line, idx) =>
        list.push({
          id: `fault-${idx}-${line.name}`,
          coords: line.points.map((p) => [p.latitude, p.longitude] as [number, number]),
          color: "#f59e0b",
          weight: 1.5,
          opacity: 0.45,
        })
      );
    }

    if (layerVisibility.risk && riskLayer.cityResult) {
      riskLayer.cityResult.faultLines.forEach((line, idx) =>
        list.push({
          id: `near-fault-${idx}-${line.name}`,
          coords: line.points.map((p) => [p.latitude, p.longitude] as [number, number]),
          color: "#ff5722",
          weight: 3,
          opacity: 0.85,
        })
      );
    }

    if (layerVisibility.roadDamage) {
      roadDamageAnalyses.forEach((a) => {
        a.safeRoadSegments.forEach((seg, i) =>
          list.push({
            id: `${a.analysisId}-safe-${i}`,
            coords: seg as [number, number][],
            color: "#10b981",
            weight: 5,
            opacity: 0.8,
          })
        );
        a.blockedRoadSegments.forEach((seg, i) =>
          list.push({
            id: `${a.analysisId}-blocked-${i}`,
            coords: seg as [number, number][],
            color: "#ef4444",
            weight: 6,
            opacity: 0.9,
          })
        );
      });
    }

    return list;
  }, [layerVisibility, riskLayer, roadDamageAnalyses]);

  const layerDefs: LayerDef[] = [
    { key: "sos", label: "SOS İhbarları", icon: Siren, color: "text-red-400", count: sosAlerts.length, updatedAt: sosUpdatedAt },
    { key: "nlp", label: "NLP İhbar Konumları", icon: FileText, color: "text-cyan-400", count: nlpIncidents.length, updatedAt: nlpIncidents.at(-1)?.createdAt ?? null },
    { key: "risk", label: "Deprem Riski & Yakın Faylar", icon: Activity, color: "text-amber-400", count: riskLayer.cityResult ? 1 : 0, updatedAt: riskUpdatedAt },
    { key: "faultLines", label: "Türkiye Geneli Fay Hatları", icon: Waves, color: "text-orange-400", count: riskLayer.allFaultLines.length, updatedAt: faultLinesUpdatedAt },
    { key: "roadDamage", label: "Uydu Yol Hasarı", icon: MapIcon, color: "text-blue-400", count: roadDamageAnalyses.length, updatedAt: roadDamageAnalyses.at(-1)?.createdAt ?? null },
    { key: "assemblyAreas", label: "Toplanma Alanları", icon: Tent, color: "text-emerald-400", count: assemblyAreas.length, updatedAt: assemblyUpdatedAt },
  ];

  return (
    <div className="flex-1 flex w-full">
      <Sidebar />

      <main className="flex-1 relative h-[calc(100vh-65px)] bg-[#0b0f17]">
        <div className="absolute inset-0">
          <InteractiveMap center={TURKEY_CENTER} zoom={6} markers={markers} polylines={polylines} />
        </div>

        {/* LAYER CONTROL PANEL */}
        <div className="absolute top-4 right-4 z-[1000] glass-panel p-4 rounded-2xl border border-slate-700/60 bg-slate-950/90 backdrop-blur-md text-xs space-y-3 max-w-xs w-72">
          <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-800 pb-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>BİRLEŞİK KOMUTA HARİTASI</span>
          </div>

          <div className="space-y-2">
            {layerDefs.map((layer) => {
              const Icon = layer.icon;
              const active = layerVisibility[layer.key];
              return (
                <button
                  key={layer.key}
                  onClick={() => toggleLayer(layer.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-left ${
                    active
                      ? "bg-slate-900 border-slate-700"
                      : "bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-90"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${layer.color}`} />
                    <span className="font-semibold text-slate-200">{layer.label}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400">{layer.count}</span>
                    <span
                      className={`w-8 h-4 rounded-full relative transition-colors ${
                        active ? "bg-blue-600" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                          active ? "left-4" : "left-0.5"
                        }`}
                      />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-1">
            {layerDefs
              .filter((l) => layerVisibility[l.key])
              .map((l) => (
                <div key={l.key} className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{l.label}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {l.key === "faultLines" && faultLinesLoading ? "Yükleniyor..." : timeAgo(l.updatedAt)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
