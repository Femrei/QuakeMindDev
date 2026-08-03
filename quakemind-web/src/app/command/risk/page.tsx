"use client";

import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import InteractiveMap, { MapMarkerItem, MapPolylineItem } from "@/components/map/InteractiveMap";
import {
  predictRisk,
  getFaultLines,
  getAllQuakes,
  refreshLiveEarthquakeData,
  RiskResponse,
  RiskFaultLine,
  ObservatoryQuake,
} from "@/lib/api";
import { useMapLayers } from "@/context/MapLayersContext";
import { Activity, AlertTriangle, Layers, RefreshCw, Telescope, Gauge, Search } from "lucide-react";

// Tum 81 il — Nominatim ile "<il>, Turkey" olarak geocode edilir.
const PROVINCES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya",
  "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
  "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne",
  "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane",
  "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu",
  "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya",
  "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu",
  "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak",
  "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın",
  "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce",
];

// Backend'deki risk_engine._risk_category ile ayni esikler.
function riskCategory(score: number): { label: string; color: string; bar: string; badge: string } {
  if (score < 0.25) return { label: "DÜŞÜK", color: "text-emerald-400", bar: "bg-emerald-500", badge: "bg-emerald-500/20 text-emerald-400" };
  if (score < 0.5) return { label: "ORTA", color: "text-yellow-400", bar: "bg-yellow-500", badge: "bg-yellow-500/20 text-yellow-400" };
  if (score < 0.75) return { label: "YÜKSEK", color: "text-orange-400", bar: "bg-orange-500", badge: "bg-orange-500/20 text-orange-400" };
  return { label: "ÇOK YÜKSEK", color: "text-red-400", bar: "bg-red-500", badge: "bg-red-500/20 text-red-400" };
}

function RiskComponentRow({ label, sublabel, value }: { label: string; sublabel: string; value: number }) {
  const pct = Math.round(value * 100);
  const cat = riskCategory(value);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-300 font-semibold">{label}</span>
        <span className={`font-mono font-bold ${cat.color}`}>%{pct} · {cat.label}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${cat.bar}`} style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
      </div>
      <p className="text-[10px] text-slate-500">{sublabel}</p>
    </div>
  );
}

function faultLinesToPolylines(lines: RiskFaultLine[], color: string, weight: number, opacity: number): MapPolylineItem[] {
  return lines.map((line, idx) => ({
    id: `fault-${idx}-${line.name}`,
    coords: line.points.map((p) => [p.latitude, p.longitude] as [number, number]),
    color,
    weight,
    opacity,
  }));
}

export default function EarthquakeRiskPage() {
  const [activeTab, setActiveTab] = useState<"risk" | "observatory">("risk");

  return (
    <div className="flex-1 flex w-full">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-65px)] bg-[#0b0f17]">
        {/* HEADER */}
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>CATBOOST DEPREM MİMARİSİ</span>
            </div>
            <h1 className="text-2xl font-black text-white font-mono mt-1">DEPREM RİSK & FAY HATTI ANALİZİ</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("risk")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                activeTab === "risk"
                  ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30"
                  : "glass-button text-slate-400 border-slate-800"
              }`}
            >
              <Gauge className="w-4 h-4" /> Risk Analizi
            </button>
            <button
              onClick={() => setActiveTab("observatory")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                activeTab === "observatory"
                  ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30"
                  : "glass-button text-slate-400 border-slate-800"
              }`}
            >
              <Telescope className="w-4 h-4" /> Rasathane
            </button>
          </div>
        </div>

        {activeTab === "risk" ? <RiskAnalysisTab /> : <ObservatoryTab />}
      </main>
    </div>
  );
}

function RiskAnalysisTab() {
  const { setRiskResult, setAllFaultLines: publishFaultLines } = useMapLayers();
  const [selectedCity, setSelectedCity] = useState("Hatay");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Turkiye genelindeki tum fay hatlari — secilen sehirden bagimsiz, harita her
  // zaman gosterir (eskiden sadece 6 segmentlik kaba bir yaklasik veri hardcode
  // edilmisti; artik gercek GEM aktif fay veritabanindan geliyor).
  const [allFaultLines, setAllFaultLines] = useState<RiskFaultLine[]>([]);
  const [faultLinesLoading, setFaultLinesLoading] = useState(true);

  useEffect(() => {
    getFaultLines()
      .then((data) => {
        setAllFaultLines(data.faultLines);
        publishFaultLines(data.faultLines);
      })
      .catch(() => setAllFaultLines([]))
      .finally(() => setFaultLinesLoading(false));
  }, [publishFaultLines]);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictRisk(selectedCity);
      setResult(data);
      setRiskResult(data);
    } catch (err: any) {
      setError(err?.message || "Deprem riski hesaplanamadı. Backend çalışıyor mu kontrol edin.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const markers: MapMarkerItem[] = useMemo(() => {
    if (!result) return [];
    const items: MapMarkerItem[] = result.mapEvents.map((q, idx) => ({
      id: `q-${idx}`,
      lat: q.latitude,
      lng: q.longitude,
      title: `${q.label} — M ${q.magnitude}`,
      type: "quake",
      magnitude: q.magnitude,
      popupText: `Tarih: ${q.timeLabel.slice(0, 10)} | Büyüklük: ${q.magnitude}`,
    }));
    items.push({
      id: "selected-city",
      lat: result.coordinates.lat,
      lng: result.coordinates.lon,
      title: result.city,
      type: "shelter",
      popupText: `Risk Skoru: ${result.riskScore} — ${result.riskLevel}`,
    });
    return items;
  }, [result]);

  const polylines: MapPolylineItem[] = useMemo(
    () => [
      ...faultLinesToPolylines(allFaultLines, "#f59e0b", 1.5, 0.45),
      ...(result ? faultLinesToPolylines(result.faultLines, "#ff5722", 3, 0.85) : []),
    ],
    [allFaultLines, result]
  );

  const mapCenter: [number, number] = result ? [result.coordinates.lat, result.coordinates.lon] : [38.9, 35.2];
  const mapZoom = result ? 7 : 6;

  return (
    <>
      <div className="flex justify-end -mt-2">
        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          {faultLinesLoading ? "Fay hatları yükleniyor..." : `${allFaultLines.length} fay segmenti (Türkiye geneli)`}
        </span>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CONTROLS (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Şehir Seçimi</h3>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">İl Seçin (81 İl)</label>
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
                className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-xl shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {loading ? "Risk Hesaplaması Yapılıyor..." : "Deprem Riskini Hesapla"}
              </button>
            </div>

            {error && (
              <div className="glass-panel p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* RESULTS SCORE CARD */}
            {result && (
              <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 space-y-4 animate-in fade-in">
                <div className="text-center space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Deprem Risk Skoru</span>
                  <div className="text-5xl font-black text-amber-400 font-mono">{result.riskScore}/100</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${riskCategory(result.riskScore / 100).badge}`}>
                    {result.riskLevel}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <p className="text-slate-400 text-[10px]">Maks Büyüklük (150km)</p>
                    <p className="text-lg font-bold text-red-400 font-mono">M {result.metrics.maxMagnitude.toFixed(1)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <p className="text-slate-400 text-[10px]">En Yakın Fay</p>
                    <p className="text-lg font-bold text-amber-400 font-mono">{result.metrics.faultDistanceKm.toFixed(1)} km</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <p className="text-slate-400 text-[10px]">Yakındaki Deprem Sayısı</p>
                    <p className="text-lg font-bold text-cyan-400 font-mono">{result.metrics.nearbyQuakeCount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <p className="text-slate-400 text-[10px]">Ort. Derinlik</p>
                    <p className="text-lg font-bold text-slate-300 font-mono">{result.metrics.averageDepth.toFixed(1)} km</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kısa & Uzun Vadeli Olasılık Kırılımı</p>
                  <RiskComponentRow
                    label="Kısa Vadeli Risk"
                    sublabel="Önümüzdeki 30 gün içinde M≥4 deprem olasılığı"
                    value={result.metrics.shortRisk}
                  />
                  <RiskComponentRow
                    label="Uzun Vadeli Tehlike"
                    sublabel="Önümüzdeki 10 yıl içinde M≥6 deprem olasılığı"
                    value={result.metrics.longHazard}
                  />
                  <RiskComponentRow
                    label="Fay Segment Etkisi"
                    sublabel={`En yakın fay hattına mesafe: ${result.metrics.faultDistanceKm.toFixed(1)} km`}
                    value={result.metrics.faultScore}
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yakın Fay Hatları</p>
                  {result.nearbyFaults.map((f, idx) => (
                    <p key={idx} className="text-[11px] text-slate-300">• {f}</p>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Son Depremler (150km)</p>
                  {result.recentEvents.length > 0 ? (
                    result.recentEvents.map((ev, idx) => (
                      <p key={idx} className="text-[11px] text-slate-300 font-mono">{ev}</p>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500">Kayıt yok</p>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 pt-1">Son güncelleme: {result.lastUpdate}</p>
              </div>
            )}
          </div>

          {/* MAP DISPLAY (8 Cols) */}
          <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col h-[700px] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" /> FAY HATLARI & DEPREM KÜMELEME HARİTASI
              </span>
              <div className="flex items-center gap-3 text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-3 h-1 bg-amber-500 rounded" /> Türkiye Fay Ağı
                </span>
                <span className="flex items-center gap-1 text-orange-400">
                  <span className="w-3 h-1 bg-orange-600 rounded" /> Şehre Yakın Fay
                </span>
              </div>
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800">
              <InteractiveMap center={mapCenter} zoom={mapZoom} markers={markers} polylines={polylines} />
            </div>
          </div>
        </div>
    </>
  );
}

function magnitudeColor(mag: number): string {
  if (mag >= 6.0) return "text-red-400";
  if (mag >= 5.0) return "text-orange-400";
  if (mag >= 4.0) return "text-amber-400";
  return "text-emerald-400";
}

function ObservatoryTab() {
  const [minMagnitude, setMinMagnitude] = useState(3.0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState(500);
  const [sortBy, setSortBy] = useState<"time" | "magnitude">("time");

  const [quakes, setQuakes] = useState<ObservatoryQuake[]>([]);
  const [meta, setMeta] = useState<{
    totalMatched: number;
    returned: number;
    datasetStart: string;
    datasetEnd: string;
    datasetTotal: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllQuakes({
        minMagnitude,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit,
        sortBy,
      });
      setQuakes(data.quakes);
      setMeta({
        totalMatched: data.totalMatched,
        returned: data.returned,
        datasetStart: data.datasetStart,
        datasetEnd: data.datasetEnd,
        datasetTotal: data.datasetTotal,
      });
    } catch (err: any) {
      setError(err?.message || "Deprem kataloğu alınamadı. Backend çalışıyor mu kontrol edin.");
      setQuakes([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefreshLiveData = async () => {
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const res = await refreshLiveEarthquakeData();
      setRefreshMessage(res.message);
      await runSearch();
    } catch (err: any) {
      setRefreshMessage(err?.message || "Canlı veri güncellenemedi.");
    } finally {
      setRefreshing(false);
    }
  };

  const markers: MapMarkerItem[] = useMemo(
    () =>
      quakes.map((q, idx) => ({
        id: `obs-${idx}`,
        lat: q.latitude,
        lng: q.longitude,
        title: `${q.place} — M ${q.magnitude}`,
        type: "quake",
        magnitude: q.magnitude,
        popupText: `Tarih: ${q.time.slice(0, 16).replace("T", " ")} | Derinlik: ${q.depth != null ? q.depth.toFixed(1) + " km" : "?"}`,
      })),
    [quakes]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* FILTERS + LIST (4 Cols) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Telescope className="w-4 h-4" /> RASATHANE FİLTRELERİ
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Minimum Büyüklük</span>
              <span className="font-bold text-amber-400">M {minMagnitude.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="7"
              step="0.5"
              value={minMagnitude}
              onChange={(e) => setMinMagnitude(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Başlangıç Tarihi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Sırala</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "time" | "magnitude")}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="time">En Yeni</option>
                <option value="magnitude">En Büyük</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Limit</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                {[100, 250, 500, 1000, 2000].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={runSearch}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {loading ? "Aranıyor..." : "Kataloğu Ara"}
          </button>

          <button
            onClick={handleRefreshLiveData}
            disabled={refreshing}
            className="w-full py-3 rounded-xl glass-button border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-2"
          >
            {refreshing ? (
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 text-amber-400" />
            )}
            {refreshing ? "Canlı Veri Çekiliyor..." : "Canlı Veriyi Yenile (Kandilli + USGS)"}
          </button>
          {refreshMessage && <p className="text-[11px] text-amber-300">{refreshMessage}</p>}
        </div>

        {error && (
          <div className="glass-panel p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {meta && (
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p>Kataloğun tamamı: <span className="text-slate-200 font-bold">{meta.datasetTotal.toLocaleString("tr-TR")}</span> kayıt ({meta.datasetStart.slice(0, 10)} → {meta.datasetEnd.slice(0, 10)})</p>
            <p>Filtreye uyan: <span className="text-amber-400 font-bold">{meta.totalMatched.toLocaleString("tr-TR")}</span> — gösterilen: <span className="text-slate-200 font-bold">{meta.returned}</span></p>
          </div>
        )}

        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300">Deprem Listesi</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-800">
            {quakes.length === 0 && !loading && (
              <p className="p-4 text-xs text-slate-500">Filtrelere uyan kayıt bulunamadı.</p>
            )}
            {quakes.map((q, idx) => (
              <div key={idx} className="p-3 text-xs space-y-0.5 hover:bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-semibold truncate pr-2">{q.place}</span>
                  <span className={`font-mono font-bold ${magnitudeColor(q.magnitude)}`}>M {q.magnitude.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{q.time.slice(0, 16).replace("T", " ")}</span>
                  <span>{q.depth != null ? `${q.depth.toFixed(1)} km derinlik` : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAP (8 Cols) */}
      <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col h-[820px] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" /> TÜM DEPREMLER HARİTASI
          </span>
          <span className="text-[10px] text-slate-500">{quakes.length} deprem gösteriliyor</span>
        </div>
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800">
          <InteractiveMap center={[38.9, 35.2]} zoom={6} markers={markers} />
        </div>
      </div>
    </div>
  );
}
