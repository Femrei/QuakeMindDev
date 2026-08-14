"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import InteractiveMap, { MapMarkerItem, MapPolylineItem } from "@/components/map/InteractiveMap";
import { useMapLayers, LayerKey } from "@/context/MapLayersContext";
import {
  getFaultLines,
  getDebrisReports,
  getRecentRoadDamage,
  getAssemblyAreas,
  getNlpLocations,
  NLPLocation,
  getSOSAlerts,
  getTeamClaims,
  TeamClaim,
} from "@/lib/api";
import { interpolateTeamPosition } from "@/lib/teamPosition";
import { COMMS_LABEL } from "@/lib/commsStatus";
import { generateDemoMapData } from "@/lib/demoMapData";
import {
  Layers,
  Siren,
  FileText,
  Activity,
  Waves,
  Map as MapIcon,
  Tent,
  Clock,
  AlertTriangle,
  Users,
  Flame,
  Sparkles,
  Trash2,
} from "lucide-react";

const TURKEY_CENTER: [number, number] = [38.9, 35.2];
const DEBRIS_POLL_MS = 6000;
// Yol agi buyuk (bir sehir ~4,5MB JSON) ve analiz basina bir kez uretilir --
// diger katmanlar kadar sik cekmeye gerek yok.
const ROAD_DAMAGE_POLL_MS = 20000;
const NLP_POLL_MS = 6000;
const SOS_POLL_MS = 6000;
const TEAM_POLL_MS = 2500;

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
    setSosAlerts,
    sosUpdatedAt,
    nlpIncidents,
    setNlpIncidents,
    riskLayer,
    setRiskResult,
    clearRiskResult,
    riskUpdatedAt,
    faultLinesUpdatedAt,
    setAllFaultLines,
    roadDamageAnalyses,
    addRoadDamageAnalysis,
    setRoadDamageAnalyses,
    assemblyAreas,
    setAssemblyAreas,
    assemblyUpdatedAt,
    debrisReports,
    setDebrisReports,
    debrisUpdatedAt,
    layerVisibility,
    toggleLayer,
  } = useMapLayers();

  const [faultLinesLoading, setFaultLinesLoading] = useState(false);
  const [nlpLocations, setNlpLocations] = useState<NLPLocation[]>([]);
  const [teamClaims, setTeamClaims] = useState<TeamClaim[]>([]);
  // Ekip pozisyonlari zaman-bazli interpolasyonla turetildigi icin, harita
  // yeniden render olsun diye her tick'te bagimsiz bir "simdi" tetigi lazim
  // (command/page.tsx'teki simulasyon modundaki mantikla ayni).
  const [, setTeamTick] = useState(0);
  const assemblyFetchedForRef = useRef<Set<string>>(new Set());
  // Yol analizi kumesinin "imzasi" (id + segment sayilari) -- degismediyse
  // 90.000 elemanli segment dizileri context'e yeniden yazilmaz.
  const roadSignatureRef = useRef<string>("");

  // SOS ihbarlari -- daha once bu harita SADECE /command/sos'un context'e
  // push ettigi (o sayfa ziyaret edilmediyse bos kalan) veriyi okuyordu; artik
  // diger katmanlar gibi (debris/road-damage/nlp) kendi basina da ceker,
  // boylece /command'daki "Simulasyon Modu" hic acilmasa/o sayfaya hic
  // gidilmese bile SOS verisi burada canli gorunur.
  useEffect(() => {
    const poll = () => {
      getSOSAlerts()
        .then((data) => setSosAlerts(data.alerts))
        .catch(() => {});
    };
    poll();
    const timer = setInterval(poll, SOS_POLL_MS);
    return () => clearInterval(timer);
  }, [setSosAlerts]);

  // Ekip claim'leri -- /command sayfasindaki "Simulasyon Modu" acik degilken
  // ya da o sayfadan baska bir sayfaya gecildiginde ekip verisi/hareketi
  // kaybolmasin diye bu harita da kendi basina ceker (daha once burada HIC
  // ekip katmani yoktu, bu yuzden /command/map'e gecince ekipler "duruyor"
  // gibi gorunuyordu).
  useEffect(() => {
    const poll = () => {
      getTeamClaims()
        .then((data) => setTeamClaims(data.claims))
        .catch(() => {});
      setTeamTick((t) => t + 1);
    };
    poll();
    const timer = setInterval(poll, TEAM_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  // NLP boru hattinin (rich_simulation.py gibi orkestratorlerin gonderdigi
  // ihbar metinlerinden) cikardigi konumlar -- command/nlp sayfasindaki
  // manuel tek-metin akisindan (nlpIncidents) AYRI bir kaynak, bu yuzden
  // burada kendi basina cekilip ayni "nlp" katmaninda birlestirilir.
  useEffect(() => {
    const poll = () => {
      getNlpLocations()
        .then((data) => setNlpLocations(data.locations))
        .catch(() => {});
    };
    poll();
    const timer = setInterval(poll, NLP_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  // Kamera modelleriyle tespit edilen enkaz/catlak noktalari -- diger
  // katmanlarin aksine (bir sayfa ziyaretiyle doldurulan) bu katman icin
  // ozel bir "kaynak" sayfa yok, o yuzden birlesik harita kendi basina
  // periyodik olarak ceker.
  useEffect(() => {
    const poll = () => {
      getDebrisReports()
        .then((data) => setDebrisReports(data.reports))
        .catch(() => {});
    };
    poll();
    const timer = setInterval(poll, DEBRIS_POLL_MS);
    return () => clearInterval(timer);
  }, [setDebrisReports]);

  // Yol hasari analizleri de ayni sekilde: baska bir sayfanin (orn. gercek
  // senaryo orkestratorunun tetikledigi simulate_closures) ureteceklerini
  // kendi basina cekip haritaya ekler -- ziyaret sirasina bagli kalmadan.
  // Her YENI analysisId icin bounds merkezinde bir toplanma-alani sorgusu
  // da tetiklenir, boylece "toplanma alanlari" katmani da otomatik dolar
  // (daha once SADECE road-damage sayfasindaki Assembly sekmesi ziyaret
  // edilirse doluyordu).
  useEffect(() => {
    const poll = () => {
      getRecentRoadDamage(180)
        .then((data) => {
          // Bir sehrin tam yol agi ~4,5MB JSON eder; analiz kumesi
          // degismediyse (ayni id'ler + ayni segment sayilari) 90.000
          // elemanli diziler bosuna context'e yeniden yazilmaz.
          const signature = data.analyses
            .map((a) => `${a.analysisId}:${a.safeRoadSegments.length}:${a.blockedRoadSegments.length}`)
            .join("|");
          const changed = signature !== roadSignatureRef.current;
          roadSignatureRef.current = signature;

          data.analyses.forEach((a) => {
            // Agir segment dizileri SADECE analiz kumesi degistiginde
            // context'e yazilir; toplanma-alani sorgusu ise her zaman
            // (analysisId basina bir kez) tetiklenir.
            if (changed) {
              addRoadDamageAnalysis({
                analysisId: a.analysisId,
                city: "Canlı Simülasyon",
                safeRoadSegments: a.safeRoadSegments,
                blockedRoadSegments: a.blockedRoadSegments,
                bounds: a.bounds || { west: 0, south: 0, east: 0, north: 0 },
              });
            }

            if (a.bounds && !assemblyFetchedForRef.current.has(a.analysisId)) {
              assemblyFetchedForRef.current.add(a.analysisId);
              const centerLat = (a.bounds.south + a.bounds.north) / 2;
              const centerLon = (a.bounds.west + a.bounds.east) / 2;
              getAssemblyAreas({ latitude: centerLat, longitude: centerLon, radiusKm: 5 })
                .then((res) => setAssemblyAreas(res.records, a.analysisId))
                .catch(() => {});
            }
          });
        })
        .catch(() => {});
    };
    poll();
    const timer = setInterval(poll, ROAD_DAMAGE_POLL_MS);
    return () => clearInterval(timer);
  }, [addRoadDamageAnalysis, setAssemblyAreas]);

  // Sunucusuz sunum/demo modu -- gercek verinin uzerine gecici olarak
  // sahte-ama-tutarli ornek veri yukler (canli backend'e bagli olmadan
  // katmanlarin nasil gorunecegini gostermek icin).
  const [demoActive, setDemoActive] = useState(false);

  const loadDemoData = () => {
    const demo = generateDemoMapData();
    setSosAlerts(demo.sosAlerts);
    setNlpIncidents(demo.nlpIncidents);
    setRiskResult(demo.riskResult);
    setRoadDamageAnalyses(demo.roadDamageAnalyses);
    setAssemblyAreas(demo.assemblyAreas);
    (["sos", "nlp", "risk", "roadDamage", "assemblyAreas", "heatmap"] as LayerKey[]).forEach((key) => {
      if (!layerVisibility[key]) toggleLayer(key);
    });
    setDemoActive(true);
  };

  const clearDemoData = () => {
    setSosAlerts([]);
    setNlpIncidents([]);
    clearRiskResult();
    setRoadDamageAnalyses([]);
    setAssemblyAreas([]);
    setDemoActive(false);
  };

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
          popupText: `Durum: ${a.status || "AÇIK"}${a.batteryPercent != null ? ` | Pil: %${a.batteryPercent}` : ""}${a.commsStatus ? ` | Haberleşme: ${COMMS_LABEL[a.commsStatus]}` : ""}`,
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
      nlpLocations.forEach((n) =>
        list.push({
          id: `nlp-loc-${n.id}`,
          lat: n.latitude,
          lng: n.longitude,
          title: `NLP Konum Çıkarımı: ${n.konumMetin || "bilinmiyor"}`,
          type: "nlp",
          popupText: `Kategori: ${n.kategori || "—"} | Aciliyet: ${n.aciliyet ?? "—"} | Metin: "${n.sourceText}"`,
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

    if (layerVisibility.team) {
      teamClaims
        .filter((c) => c.status === "active")
        .forEach((claim) => {
          if (claim.routeCoords && claim.routeCoords.length > 0) {
            list.push({
              id: `team-start-${claim.teamId}-${claim.targetId}`,
              lat: claim.routeCoords[0][0],
              lng: claim.routeCoords[0][1],
              title: `Çıkış Noktası: ${claim.teamId}`,
              type: "team-start",
              popupText: `Ekip ${claim.teamId} buradan yola çıktı | Hedef: ${claim.targetId}`,
              linkHref: "/command/sos",
              linkLabel: "SOS Sevk Ekranına Git",
            });
          }
          const pos = interpolateTeamPosition(claim);
          if (!pos) return;
          list.push({
            id: `team-${claim.teamId}-${claim.targetId}`,
            lat: pos[0],
            lng: pos[1],
            title: `Ekip: ${claim.teamId}`,
            type: "team",
            popupText: `Hedef: ${claim.targetId} | Tür: ${claim.targetType}`,
            linkHref: "/command/sos",
            linkLabel: "SOS Sevk Ekranına Git",
          });
        });
    }

    if (layerVisibility.debris) {
      debrisReports.forEach((r) =>
        list.push({
          id: `debris-${r.id}`,
          lat: r.latitude,
          lng: r.longitude,
          title: `Enkaz: ${r.topLabel || "Tespit"}`,
          type: "debris",
          popupText: `Şiddet: ${r.severity} | Tespit sayısı: ${r.detectionCount} | ${new Date(r.receivedAt).toLocaleTimeString()}`,
          linkHref: "/command/camera",
          linkLabel: "Kamera Tespit Ekranına Git",
        })
      );
    }

    return list;
  }, [layerVisibility, sosAlerts, nlpIncidents, nlpLocations, riskLayer.cityResult, assemblyAreas, debrisReports, teamClaims]);

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
      // Bir sehrin TAM yol agi ~50.000 segment surer; her segmenti ayri bir
      // <Polyline> yapmak React'i ve Leaflet'i kilitliyordu. Tum acik yollar
      // TEK, tum kapali yollar TEK cok-parcali katman olarak cizilir.
      roadDamageAnalyses.forEach((a) => {
        if (a.safeRoadSegments.length > 0) {
          list.push({
            id: `${a.analysisId}-safe`,
            coords: [],
            coordGroups: a.safeRoadSegments as [number, number][][],
            color: "#22c55e",
            weight: 2,
            opacity: 0.75,
          });
        }
        if (a.blockedRoadSegments.length > 0) {
          list.push({
            id: `${a.analysisId}-blocked`,
            coords: [],
            coordGroups: a.blockedRoadSegments as [number, number][][],
            color: "#ef4444",
            weight: 3,
            opacity: 0.95,
          });
        }
      });
    }

    if (layerVisibility.team) {
      // Ekibin GERCEKTEN gittigi rota -- genel acik/kapali yol katmanindan
      // (yesil/kirmizi) ayrilsin diye belirgin sari, koyu konturlu kalin cizgi
      // (command/page.tsx'teki simulasyon modundaki mantikla ayni).
      teamClaims
        .filter((c) => c.status === "active" && c.routeCoords)
        .forEach((claim) => {
          list.push({
            id: `team-route-${claim.teamId}-${claim.targetId}`,
            coords: claim.routeCoords!,
            color: "#facc15",
            weight: 5,
            opacity: 0.95,
            casing: true,
          });
        });
    }

    return list;
  }, [layerVisibility, riskLayer, roadDamageAnalyses, teamClaims]);

  // Combined heat layer: pools every feature currently on the map into one
  // density surface. Reuses data already loaded by the other layers instead
  // of a separate backend call — SOS/NLP/risk/road-damage points are already
  // in context by the time this toggle gets switched on.
  const heatPoints: [number, number, number][] = useMemo(() => {
    if (!layerVisibility.heatmap) return [];
    const points: [number, number, number][] = [];

    sosAlerts.forEach((a) => points.push([a.latitude, a.longitude, 1.0]));

    nlpIncidents.forEach((n) => points.push([n.marker.lat, n.marker.lng, 0.6]));

    const quakeEvents = riskLayer.cityResult?.heatmapEvents ?? riskLayer.cityResult?.mapEvents ?? [];
    quakeEvents.forEach((q) => points.push([q.latitude, q.longitude, Math.min(1, q.magnitude / 6)]));

    roadDamageAnalyses.forEach((a) => {
      a.blockedRoadSegments.forEach((seg) => {
        if (seg.length === 0) return;
        const mid = seg[Math.floor(seg.length / 2)];
        points.push([mid[0], mid[1], 0.7]);
      });
    });

    return points;
  }, [layerVisibility.heatmap, sosAlerts, nlpIncidents, riskLayer, roadDamageAnalyses]);

  const heatUpdatedAt = [sosUpdatedAt, riskUpdatedAt, roadDamageAnalyses.at(-1)?.createdAt ?? null]
    .filter((v): v is string => !!v)
    .sort()
    .at(-1) ?? null;

  const layerDefs: LayerDef[] = [
    { key: "sos", label: "SOS İhbarları", icon: Siren, color: "text-red-400", count: sosAlerts.length, updatedAt: sosUpdatedAt },
    { key: "nlp", label: "NLP İhbar Konumları", icon: FileText, color: "text-cyan-400", count: nlpIncidents.length + nlpLocations.length, updatedAt: nlpLocations.at(-1)?.receivedAt ?? nlpIncidents.at(-1)?.createdAt ?? null },
    { key: "risk", label: "Deprem Riski & Yakın Faylar", icon: Activity, color: "text-amber-400", count: riskLayer.cityResult ? 1 : 0, updatedAt: riskUpdatedAt },
    { key: "faultLines", label: "Türkiye Geneli Fay Hatları", icon: Waves, color: "text-orange-400", count: riskLayer.allFaultLines.length, updatedAt: faultLinesUpdatedAt },
    { key: "roadDamage", label: "Uydu Yol Hasarı", icon: MapIcon, color: "text-blue-400", count: roadDamageAnalyses.length, updatedAt: roadDamageAnalyses.at(-1)?.createdAt ?? null },
    { key: "assemblyAreas", label: "Toplanma Alanları", icon: Tent, color: "text-emerald-400", count: assemblyAreas.length, updatedAt: assemblyUpdatedAt },
    { key: "debris", label: "Enkaz / Çatlak Tespitleri", icon: AlertTriangle, color: "text-orange-400", count: debrisReports.length, updatedAt: debrisUpdatedAt },
    {
      key: "team",
      label: "Saha Ekipleri (Canlı Konum)",
      icon: Users,
      color: "text-yellow-400",
      count: teamClaims.filter((c) => c.status === "active").length,
      updatedAt: teamClaims.at(-1)?.claimedAt ?? null,
    },
    { key: "heatmap", label: "Birleşik Isı Haritası", icon: Flame, color: "text-rose-400", count: heatPoints.length, updatedAt: heatPoints.length > 0 ? heatUpdatedAt : null },
  ];

  return (
    <div className="flex-1 flex w-full">
      <Sidebar />

      <main className="flex-1 relative h-[calc(100vh-65px)] bg-[#0b0f17]">
        <div className="absolute inset-0">
          <InteractiveMap center={TURKEY_CENTER} zoom={6} markers={markers} polylines={polylines} heatData={heatPoints} />
        </div>

        {/* LAYER CONTROL PANEL */}
        <div className="absolute top-4 right-4 z-[1000] glass-panel p-4 rounded-2xl border border-slate-700/60 bg-slate-950/90 backdrop-blur-md text-xs space-y-3 max-w-xs w-72">
          <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-800 pb-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>BİRLEŞİK KOMUTA HARİTASI</span>
          </div>

          <div className="space-y-1.5 pb-2 border-b border-slate-800">
            <button
              onClick={loadDemoData}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {demoActive ? "Simülasyon Verisini Yenile" : "Simülasyon Verisi Yükle"}
            </button>
            {demoActive && (
              <button
                onClick={clearDemoData}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Simülasyon Verisini Temizle
              </button>
            )}
            {demoActive && (
              <p className="text-[10px] text-purple-300/80 text-center pt-0.5">
                Tüm katmanlar sahte/simüle veriyle dolduruldu — test amaçlıdır.
              </p>
            )}
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
