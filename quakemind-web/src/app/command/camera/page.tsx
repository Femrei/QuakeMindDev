"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Camera, Video, AlertCircle, CheckCircle2, Play, Square } from "lucide-react";

export default function CameraDetectionPage() {
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Kamera Tespiti Hazır");

  const handleToggle = () => {
    if (running) {
      setRunning(false);
      setStatus("Kamera Durduruldu");
    } else {
      setRunning(true);
      setStatus("Canlı OpenCV Tespit Modelleri Çalışıyor...");
    }
  };

  return (
    <div className="flex-1 flex w-full">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-65px)] bg-[#0b0f17]">
        {/* HEADER */}
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
              <Camera className="w-4 h-4 text-emerald-500" />
              <span>OPENCV & COMPUTER VISION MODELİ</span>
            </div>
            <h1 className="text-2xl font-black text-white font-mono mt-1">CANLI KAMERA ÇATLAK & BİNA TESPİTİ</h1>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CAMERA FEED CANVAS (8 Cols) */}
          <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" /> CANLI VİDEO AKIŞ TUVALİ (FRAME STREAM)
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                running ? "bg-emerald-500/20 text-emerald-400 animate-pulse" : "bg-slate-800 text-slate-400"
              }`}>
                {running ? "CANLI AKIŞ AKTİF" : "BEKLEMEDE"}
              </span>
            </div>

            <div className="flex-1 rounded-2xl bg-black border border-slate-800 flex items-center justify-center relative overflow-hidden">
              {running ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6">
                  {/* Mock Bounding Box AI Vision Overlay */}
                  <div className="absolute inset-12 border-2 border-dashed border-red-500/60 rounded-xl flex items-start p-2">
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Çatlak Tespiti %94.2
                    </span>
                  </div>
                  <div className="absolute bottom-16 right-16 border-2 border-emerald-500/60 rounded-xl p-2">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Bina Yapısal Bütünlük OK
                    </span>
                  </div>
                  <Video className="w-16 h-16 text-emerald-500 animate-pulse opacity-40 mb-3" />
                  <span className="text-xs text-slate-400 font-mono">OpenCV Kamera Akışı & Derin Öğrenme Modeli İşleniyor...</span>
                </div>
              ) : (
                <div className="text-center space-y-3 p-6">
                  <Camera className="w-16 h-16 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Kamera tespitini başlatarak canlı akış üzerinden duvar çatlaklarını ve bina hasar durumunu anlık izleyebilirsiniz.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CONTROLS & MODEL INFO (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Kamera Kontrolü</h3>

              <button
                onClick={handleToggle}
                className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                  running
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                }`}
              >
                {running ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{running ? "Kamera Akışını Durdur" : "Kamera Tespitini Başlat"}</span>
              </button>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Çatlak Modeli:</span>
                  <span className="font-mono font-bold text-slate-200">crack_detection_model.onnx</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Bina Modeli:</span>
                  <span className="font-mono font-bold text-slate-200">building_integrity_v2.pth</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
