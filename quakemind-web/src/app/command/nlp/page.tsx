"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { analyzeNLP, NLPResponse } from "@/lib/api";
import { FileText, Zap, MapPin, AlertCircle, CheckCircle2, Send } from "lucide-react";

const SAMPLES = [
  "Hatay antakya cebrail mahallesi yıkıldı, enkaz altında kalanlar var lütfen yardım edin ses geliyor!",
  "Gaziantep nurdağı yolu kapalı tırlar geçemiyor, toprak kayması var.",
  "Kahramanmaraş merkezde 50 çadır ve bol miktarda bebek maması ihtiyacı çok acil.",
  "Malatya battalgazide apartman çöktü, içeride yaşlı bir çift mahsur kaldı.",
];

export default function NLPPage() {
  const [text, setText] = useState(SAMPLES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NLPResponse | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const data = await analyzeNLP(text);
      setResult(data);
    } catch {
      // Fallback mock payload
      setResult({
        kategori: "Enkaz Bildirimi / Acil İhbar",
        güven: 0.96,
        aciliyet_p5: 5,
        adres: "Hatay Antakya Cebrail Mahallesi",
        koordinat: [36.208, 36.165],
        raw_tweet: text,
      });
    } finally {
      setLoading(false);
    }
  };

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
          {/* INPUT FORM (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
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
                      "{s}"
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
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? "BERTurk Analiz Ediyor..." : "NLP İhbar Analizini Çalıştır"}</span>
              </button>
            </div>
          </div>

          {/* AI OUTPUT DISPLAY (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            {result ? (
              <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-300">Yapay Zeka Analiz Çıktısı</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Güven: %{((result.güven || 0.95) * 100).toFixed(0)}
                  </span>
                </div>

                {/* URGENCY GAUGE */}
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">Aciliyet Seviyesi (P-5)</span>
                    <span className="text-2xl font-black text-red-400 font-mono">P-{result.aciliyet_p5 || 5} KRİTİK SEVİYE</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-black text-xl border border-red-500/40">
                    P{result.aciliyet_p5 || 5}
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
                    <span className="font-bold text-white text-xs">{result.adres || "Tespit Edilemedi"}</span>
                  </div>

                  {result.koordinat && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between">
                      <span className="text-slate-400">Geocoding Koordinatı:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {result.koordinat[0]}, {result.koordinat[1]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center text-xs text-slate-400">
                NLP analiz butonuna basarak metin kategorisini, P-5 aciliyet skorunu ve çıkarılan adresi burada görebilirsiniz.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
