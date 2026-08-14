"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import InteractiveMap, { MapMarkerItem, MapPolylineItem } from "@/components/map/InteractiveMap";
import {
  getSOSAlerts,
  fetchServerStatus,
  SOSAlert,
  getTeamClaims,
  getRecentRoadDamage,
  getDebrisReports,
  getNlpLocations,
  TeamClaim,
  DebrisReport,
  NLPLocation,
} from "@/lib/api";
import { deriveUrgencyTier, urgencyLabel, urgencyTextClass } from "@/lib/urgency";
import { interpolateTeamPosition } from "@/lib/teamPosition";
import { COMMS_LABEL } from "@/lib/commsStatus";
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
  ArrowUpRight,
  Radio,
} from "lucide-react";

const SIMULATION_POLL_MS = 2500;
// Yol agi buyuk (bir sehir ~4,5MB JSON) ve analiz basina bir kez uretilir --
// hizli dongude her tur cekmeye gerek yok.
const ROAD_POLL_MS = 20000;

const ANTAKYA_CENTER: [number, number] = [36.202, 36.161];

export default function CommandDashboardPage() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ nlp: boolean; risk: boolean; road_damage: boolean }>({
    nlp: true,
    risk: true,
    road_damage: true,
  });

  const [simulationMode, setSimulationMode] = useState(false);
  const [teamClaims, setTeamClaims] = useState<TeamClaim[]>([]);
  const [damagePolylines, setDamagePolylines] = useState<MapPolylineItem[]>([]);
  const [roadStats, setRoadStats] = useState<{ safe: number; blocked: number }>({ safe: 0, blocked: 0 });
  const [debrisReports, setDebrisReports] = useState<DebrisReport[]>([]);
  const [nlpLocations, setNlpLocations] = useState<NLPLocation[]>([]);
  // Ekip pozisyonlari zaman-bazli interpolasyonla turetildigi icin, harita
  // yeniden render olsun diye her tick'te bagimsiz bir "simdi" tetigi lazim.
  const [, setSimTick] = useState(0);
  // Yol analizi kumesinin "imzasi" (id + segment sayilari) -- degismediyse
  // 90.000 elemanli polyline dizileri yeniden olusturulmaz.
  const roadSignatureRef = useRef<string>("");

  useEffect(() => {
    if (!simulationMode) return;

    const poll = async () => {
      try {
        const [sosData, claimsData, debrisData, nlpData] = await Promise.all([
          getSOSAlerts(),
          getTeamClaims(),
          getDebrisReports(),
          getNlpLocations(),
        ]);
        setAlerts(sosData.alerts);
        setTeamClaims(claimsData.claims);
        setDebrisReports(debrisData.reports);
        setNlpLocations(nlpData.locations);
      } catch {
        // sunucu gecici olarak yanit vermiyor olabilir -- bir sonraki tick'te tekrar dene
      }
      setSimTick((t) => t + 1);
    };

    poll();
    const interval = setInterval(poll, SIMULATION_POLL_MS);
    return () => clearInterval(interval);
  }, [simulationMode]);

  // Yol agi AYRI ve cok daha seyrek cekilir: bir sehrin tam yol agi ~4,5MB
  // JSON eder ve 2,5sn'lik hizli dongude her tur yeniden indirilip
  // ayristirilirsa istekler ust uste binip arayuzu bogar (olculdu: tek
  // istek ~1,8sn). Ayrica analiz kumesi degismediyse (ayni analysisId'ler,
  // ayni segment sayilari) 90.000 elemanli diziler bosuna yeniden
  // olusturulmaz -- yol kapanmalari zaten analiz basina bir kez uretilir.
  useEffect(() => {
    if (!simulationMode) return;

    const pollRoads = async () => {
      try {
        const damageData = await getRecentRoadDamage(120);
        const signature = damageData.analyses
          .map((a) => `${a.analysisId}:${a.safeRoadSegments.length}:${a.blockedRoadSegments.length}`)
          .join("|");
        if (signature === roadSignatureRef.current) return;
        roadSignatureRef.current = signature;

        const polylines: MapPolylineItem[] = [];
        let safeCount = 0;
        let blockedCount = 0;
        damageData.analyses.forEach((a) => {
          safeCount += a.safeRoadSegments.length;
          blockedCount += a.blockedRoadSegments.length;
          // Bir sehrin TAM yol agi ~50.000 segment surer -- her segmenti ayri
          // bir <Polyline> yapmak React'i ve Leaflet'i kilitliyordu (olculdu:
          // katmani acmak tarayiciyi 30sn+ dondurdu). Acik yollarin hepsi TEK,
          // kapalilarin hepsi TEK cok-parcali katman olarak cizilir.
          if (a.safeRoadSegments.length > 0) {
            polylines.push({
              id: `${a.analysisId}-safe`,
              coords: [],
              coordGroups: a.safeRoadSegments as [number, number][][],
              color: "#22c55e",
              weight: 2,
              opacity: 0.75,
            });
          }
          if (a.blockedRoadSegments.length > 0) {
            polylines.push({
              id: `${a.analysisId}-blocked`,
              coords: [],
              coordGroups: a.blockedRoadSegments as [number, number][][],
              color: "#ef4444",
              weight: 3,
              opacity: 0.95,
            });
          }
        });
        setDamagePolylines(polylines);
        setRoadStats({ safe: safeCount, blocked: blockedCount });
      } catch {
        // sunucu gecici olarak yanit vermiyor olabilir -- bir sonraki turda tekrar dene
      }
    };

    pollRoads();
    const interval = setInterval(pollRoads, ROAD_POLL_MS);
    return () => clearInterval(interval);
  }, [simulationMode]);

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

  // Bir ihbara ekip atanmis mi -- atanmissa marker'i kirmizidan turuncuya
  // cevirmek icin (diger ekipler oraya zaten gidildigini gorsun, ayni
  // mantik command/sos/page.tsx'te de kullaniliyor).
  const claimForAlert = (id: string): TeamClaim | undefined =>
    teamClaims.find((c) => c.targetId === id && c.status === "active");

  const markers: MapMarkerItem[] = alerts.map((a) => ({
    id: a.id,
    lat: a.latitude,
    lng: a.longitude,
    title: `SOS: ${a.message || "Acil Çağrı"}`,
    type: "sos",
    claimStatus: claimForAlert(a.id) ? "active" : a.status === "RESOLVED" ? "completed" : "unclaimed",
    popupText: `Durum: ${a.status || "AÇIK"}${claimForAlert(a.id) ? ` | Ekip yolda: ${claimForAlert(a.id)!.teamId}` : ""}${a.batteryPercent != null ? ` | Pil: %${a.batteryPercent}` : ""}${a.commsStatus ? ` | Haberleşme: ${COMMS_LABEL[a.commsStatus]}` : ""} | Alındı: ${new Date(a.receivedAt).toLocaleTimeString()}`,
  }));

  const debrisMarkers: MapMarkerItem[] = simulationMode
    ? debrisReports.map((r) => ({
        id: `debris-${r.id}`,
        lat: r.latitude,
        lng: r.longitude,
        title: `Enkaz: ${r.topLabel || "Tespit"}`,
        type: "debris",
        popupText: `Şiddet: ${r.severity} | Tespit sayısı: ${r.detectionCount} | ${new Date(r.receivedAt).toLocaleTimeString()}`,
      }))
    : [];

  // NLP'nin serbest metinden CIKARDIGI konum -- afetzedenin kendi GPS'inden
  // (kirmizi SOS pin'i) bilincli olarak ayri, mor baklava isareti.
  const nlpMarkers: MapMarkerItem[] = simulationMode
    ? nlpLocations.map((n) => ({
        id: `nlp-${n.id}`,
        lat: n.latitude,
        lng: n.longitude,
        title: `NLP Konum Çıkarımı: ${n.konumMetin || "Bilinmeyen"}`,
        type: "nlp",
        popupText: `Metin: "${n.sourceText}" | Kategori: ${n.kategori || "-"} | Aciliyet: ${n.aciliyet ?? "-"}`,
      }))
    : [];

  const teamMarkers: MapMarkerItem[] = [];
  const teamStartMarkers: MapMarkerItem[] = [];
  const teamTrailPolylines: MapPolylineItem[] = [];
  if (simulationMode) {
    teamClaims
      .filter((c) => c.status === "active")
      .forEach((claim) => {
        // Ekibin yola CIKTIGI nokta -- rotanin ilk koordinati, ekip
        // hareket etmeye baslasa bile haritada sabit kalir.
        if (claim.routeCoords && claim.routeCoords.length > 0) {
          teamStartMarkers.push({
            id: `team-start-${claim.teamId}-${claim.targetId}`,
            lat: claim.routeCoords[0][0],
            lng: claim.routeCoords[0][1],
            title: `Çıkış Noktası: ${claim.teamId}`,
            type: "team-start",
            popupText: `Ekip ${claim.teamId} buradan yola çıktı | Hedef: ${claim.targetId}`,
          });
        }
        const pos = interpolateTeamPosition(claim);
        if (!pos) return;
        teamMarkers.push({
          id: `team-${claim.teamId}-${claim.targetId}`,
          lat: pos[0],
          lng: pos[1],
          title: `Ekip: ${claim.teamId}`,
          type: "team",
          popupText: `Hedef: ${claim.targetId} | Tür: ${claim.targetType}`,
        });
        if (claim.routeCoords) {
          // Ekibin GERCEKTEN gittigi rota -- genel acik/kapali yol
          // katmanindan (yesil/kirmizi) ayrilsin diye belirgin sari, koyu
          // konturlu (casing) kalin bir cizgi.
          teamTrailPolylines.push({
            id: `team-route-${claim.teamId}-${claim.targetId}`,
            coords: claim.routeCoords,
            color: "#facc15",
            weight: 5,
            opacity: 0.95,
            casing: true,
          });
        }
      });
  }

  const allMarkers = simulationMode
    ? [...markers, ...teamMarkers, ...teamStartMarkers, ...debrisMarkers, ...nlpMarkers]
    : markers;
  const allPolylines = simulationMode ? [...damagePolylines, ...teamTrailPolylines] : [];
  // Sabit Antakya merkezine kilitlenmek yerine, simulasyon aktifken haritayi
  // gercek olay verisinin (SOS + ekip konumlari) oldugu yere otomatik
  // odakla -- hangi bolge (Kahramanmaras, Hatay, ...) calisirsa calissin.
  // NLP marker'lari BILEREK disarida birakilir: NLP metinden sadece il/ilce
  // seviyesinde konum cikarabiliyor (mahalle gazetteer'i yok), bu yuzden
  // gercek ilce merkezine (bazen analiz alaninin onlarca km disina) duser --
  // bu marker'lar haritada gorunur kalir ama otomatik zoom'u bozmasin diye
  // odaklama hesabina dahil edilmez.
  const fitBoundsPoints: [number, number][] = simulationMode
    ? [...markers, ...teamMarkers, ...debrisMarkers].map((m) => [m.lat, m.lng] as [number, number])
    : [];

  const criticalAlertCount = alerts.filter((a) => deriveUrgencyTier(a) === "CRITICAL").length;
  const uniqueTeamIds = new Set(teamClaims.map((c) => c.teamId));
  const totalTeamCount = uniqueTeamIds.size;
  const activeTeamCount = new Set(
    teamClaims.filter((c) => c.status === "active").map((c) => c.teamId)
  ).size;
  const totalRoadSegments = roadStats.safe + roadStats.blocked;
  const blockedRoadRatio =
    totalRoadSegments > 0 ? ((roadStats.blocked / totalRoadSegments) * 100).toFixed(1) : "0.0";
  const activeModuleCount = [status.nlp, status.risk, status.road_damage].filter(Boolean).length;

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
            <button
              onClick={() => setSimulationMode((v) => !v)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all ${
                simulationMode
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              }`}
            >
              <Radio className={`w-4 h-4 ${simulationMode ? "animate-pulse" : ""}`} />
              {simulationMode ? "SİMÜLASYON AKIYOR" : "SİMÜLASYON MODU"}
            </button>
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
            <div className="text-[10px] text-slate-500">{criticalAlertCount} Kritik Enkaz Çağrısı Aktif</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Arama Kurtarma Ekipleri</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">{totalTeamCount}</span>
              <span className="text-xs text-emerald-300/80 font-bold">Saha Ekibi</span>
            </div>
            <div className="text-[10px] text-slate-500">
              {activeTeamCount} Ekip Görevde, {Math.max(totalTeamCount - activeTeamCount, 0)} Hazırda
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Uydu Hasar Oranı</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400 font-mono">%{blockedRoadRatio}</span>
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
              <span className="text-3xl font-black text-blue-400 font-mono">{activeModuleCount}/3</span>
              <span className="text-xs text-blue-300/80 font-bold">
                {activeModuleCount === 3 ? "Tümü Aktif" : "Kısmi Aktif"}
              </span>
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
              <InteractiveMap center={ANTAKYA_CENTER} zoom={13} markers={allMarkers} polylines={allPolylines} />
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
