"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import InteractiveMap, { MapMarkerItem } from "@/components/map/InteractiveMap";
import { analyzeNLP, NLPResponse } from "@/lib/api";
import { FileText, MapPin, Send, Layers, AlertTriangle } from "lucide-react";

const SAMPLES = [
  "Hatay antakya cebrail mahallesi yıkıldı, enkaz altında kalanlar var lütfen yardım edin ses geliyor!",
  "Gaziantep nurdağı yolu kapalı tırlar geçemiyor, toprak kayması var.",
  "Kahramanmaraş merkezde 50 çadır ve bol miktarda bebek maması ihtiyacı çok acil.",
  "Malatya battalgazide apartman çöktü, içeride yaşlı bir çift mahsur kaldı.",
];

const DEFAULT_MAP_CENTER: [number, number] = [37.5, 36.5];

export default function NLPPage() {
  const [text, setText] = useState(SAMPLES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NLPResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeNLP(text);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "NLP analizi başarısız oldu. Backend çalışıyor mu kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const isIgnored = result?.status === "ignored";
  const marker: MapMarkerItem | null =
    result?.konum
      ? {
          id: "nlp-location",
          lat: result.konum[0],
          lng: result.konum[1],
          title: result.konum_metin || "Tespit Edilen Konum",
          type: "sos",
          popupText: result.kategori,
        }
      : null;

  return (
    <div className="flex-1 flex w-full">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-65px)] bg-[#0b0f17]">
        {/* HEADER */}
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest">
              <FileText className="w-4 h-4 text-cyan-500" />
              <span>BERTurk & NER MODELİ</span>
            </div>
            <h1 className="text-2xl font-black text-white font-mono mt-1">AFET METİN NLP & İHBAR MADENCİLİĞİ</h1>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* INPUT FORM (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Sosyal Medya / Rapor Metni Girişi</h3>

              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 font-semibold block">Örnek İhbar Seçin:</span>
                <div className="space-y-1.5">
                  {SAMPLES.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setText(s)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left text-xs text-slate-300 transition-colors line-clamp-1"
                    >
                      &quot;{s}&quot;
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Analiz Edilecek Metin</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-32 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || !text.trim()}
                className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{loading ? "BERTurk Analiz Ediyor..." : "NLP İhbar Analizini Çalıştır"}</span>
              </button>
            </div>

            {error && (
              <div className="glass-panel p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {result ? (
              isIgnored ? (
                <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    Bu metin bir afet/acil durum ihbarı olarak sınıflandırılmadı ({result.reason || "Alakasız"}), bu yüzden
                    konum/kategori çıkarımı yapılmadı.
                  </span>
                </div>
              ) : (
                <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 space-y-5 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-300">Yapay Zeka Analiz Çıktısı</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Güven: %{((result.guven_skoru ?? 0) * 100).toFixed(0)}
                    </span>
                  </div>

                  {/* URGENCY GAUGE */}
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">Aciliyet Seviyesi (P-5)</span>
                      <span className="text-2xl font-black text-red-400 font-mono">P-{result.aciliyet ?? "?"}</span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-black text-xl border border-red-500/40">
                      P{result.aciliyet ?? "?"}
                    </div>
                  </div>

                  {/* CATEGORY & ADDRESS */}
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Kategori Tespiti:</span>
                      <span className="font-bold text-cyan-400 text-sm">{result.kategori}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-400" /> Çıkarılan Adres (NER):
                      </span>
                      <span className="font-bold text-white text-xs">{result.konum_metin || "Tespit Edilemedi"}</span>
                    </div>

                    {result.konum && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between">
                        <span className="text-slate-400">Geocoding Koordinatı:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {result.konum[0].toFixed(5)}, {result.konum[1].toFixed(5)}
                        </span>
                      </div>
                    )}

                    {!result.konum && result.konum_adaylari && result.konum_adaylari.length > 0 && (
                      <p className="text-[11px] text-amber-300">
                        NER, {result.konum_adaylari.length} konum adayı çıkardı ama hiçbiri geocoding ile eşleştirilemedi.
                      </p>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center text-xs text-slate-400">
                NLP analiz butonuna basarak metin kategorisini, P-5 aciliyet skorunu ve çıkarılan adresi burada görebilirsiniz.
              </div>
            )}
          </div>

          {/* MAP DISPLAY (7 Cols) */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col h-[600px] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> NER İLE ÇIKARILAN KONUM
              </span>
              {!result?.konum && (
                <span className="text-[10px] text-slate-500">Henüz bir konum tespit edilmedi</span>
              )}
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800">
              <InteractiveMap
                center={marker ? [marker.lat, marker.lng] : DEFAULT_MAP_CENTER}
                zoom={marker ? 14 : 6}
                markers={marker ? [marker] : []}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
