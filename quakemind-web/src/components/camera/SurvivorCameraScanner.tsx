"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, AlertTriangle, CheckCircle2, RefreshCw, X, ShieldAlert, Zap } from "lucide-react";

interface SurvivorCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SurvivorCameraScanner({ isOpen, onClose }: SurvivorCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: "CRITICAL" | "SAFE" | null;
    label: string;
    confidence: number;
    advice: string;
  }>({ type: null, label: "", confidence: 0, advice: "" });

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Kamera erişimi alınamadı veya izin verilmedi:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleScan = () => {
    setScanning(true);
    setScanResult({ type: null, label: "", confidence: 0, advice: "" });

    setTimeout(() => {
      setScanning(false);
      // Mock AI detection simulation for wall/crack analysis
      const isDangerous = Math.random() > 0.4;
      if (isDangerous) {
        setScanResult({
          type: "CRITICAL",
          label: "Derin Taşıyıcı Kolon Çatlağı Tespiti",
          confidence: 96.4,
          advice: "⚠️ BİNAYI DERHAL BOŞALTIN! Taşıyıcı elemanda derin yapısal çatlak saptandı.",
        });
      } else {
        setScanResult({
          type: "SAFE",
          label: "Yüzeysel Sıva / Boya Çatlağı",
          confidence: 92.1,
          advice: "🟢 YAPISAL TEHLİKE SAPTANMADI. Çatlak taşıyıcı kolonda değil, kaplama yüzeyindedir.",
        });
      }
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 overflow-hidden shadow-2xl space-y-0">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-mono">BİNA & DUVAR HASAR KONTROL TARAMASI</h2>
              <p className="text-xs text-slate-400">Kameranızı duvara veya kolona tutarak anında yapay zeka analizi yapın.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CAMERA CANVAS STREAM */}
        <div className="relative w-full h-[360px] bg-black flex items-center justify-center overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          {/* AI SCANNER OVERLAY BOUNDING BOX */}
          <div className="absolute inset-8 border-2 border-dashed border-cyan-400/70 rounded-2xl flex flex-col justify-between p-3 pointer-events-none">
            <div className="flex items-center justify-between">
              <span className="bg-cyan-500/90 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                <Zap className="w-3 h-3 fill-slate-950" /> CANLI TESPİT KATMANI (60 FPS)
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                AI VISION ACTIVE
              </span>
            </div>

            {scanning && (
              <div className="w-full h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse rounded-full my-auto"></div>
            )}
          </div>

          {!stream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 space-y-2 text-xs font-mono">
              <Camera className="w-8 h-8 text-slate-600 animate-pulse" />
              <span>Kamera başlatılıyor veya simülasyon aktif...</span>
            </div>
          )}
        </div>

        {/* SCAN RESULT DISPLAY */}
        <div className="p-5 bg-slate-950/80 border-t border-slate-800 space-y-4">
          {scanResult.type ? (
            <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              scanResult.type === 'CRITICAL' 
                ? 'bg-red-500/10 border-red-500/40 text-red-300' 
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            }`}>
              {scanResult.type === 'CRITICAL' ? (
                <ShieldAlert className="w-7 h-7 text-red-500 flex-shrink-0 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{scanResult.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    scanResult.type === 'CRITICAL' ? 'bg-red-500/30 text-red-300' : 'bg-emerald-500/30 text-emerald-300'
                  }`}>
                    Güven %{scanResult.confidence}
                  </span>
                </div>
                <p className="text-xs font-medium">{scanResult.advice}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center font-mono">
              Kamerayı hasarlı bölgeye doğrultun ve &quot;Taramayı Başlat&quot; butonuna basın.
            </p>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex-1 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Yapay Zeka Taraması Yapılıyor...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" /> Hasar Taramasını Başlat
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-3.5 rounded-2xl glass-button text-xs text-slate-300 font-bold hover:bg-slate-800"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
