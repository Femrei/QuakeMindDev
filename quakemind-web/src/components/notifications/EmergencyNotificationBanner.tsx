"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Bell, BellOff, Volume2, VolumeX, X, Navigation, ShieldAlert, CheckCircle2 } from "lucide-react";

export interface EmergencyAlert {
  id: string;
  title: string;
  body: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
  location?: string;
  magnitude?: number;
}

export default function EmergencyNotificationBanner() {
  const pathname = usePathname();
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Hide notification siren banner on login page for clean UI
  if (pathname === "/login") {
    return null;
  }

  // Check notification permission state on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionGranted(Notification.permission === "granted");
    }
  }, []);

  // Poll active emergency notifications from backend
  useEffect(() => {
    const fetchLatestAlert = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/notifications/active");
        if (res.ok) {
          const data = await res.json();
          if (data.activeAlert) {
            setActiveAlert(data.activeAlert);
          }
        }
      } catch (e) {
        // Silent fallback
      }
    };

    fetchLatestAlert();
    const interval = setInterval(fetchLatestAlert, 10000);
    return () => clearInterval(interval);
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setPermissionGranted(true);
          // Trigger test push notification
          new Notification("🔴 QUAKEMIND AFET İKAZ SİSTEMİ AKTİF!", {
            body: "Deprem acil durum push bildirimleri ve FCM canlı uyarıları başarıyla etkinleştirildi.",
            icon: "/favicon.ico"
          });
        }
      } catch (e) {
        console.warn("Notification permission error:", e);
      }
    }
  };

  const triggerDemoEmergency = () => {
    const demoAlert: EmergencyAlert = {
      id: "alert-" + Date.now(),
      title: "🔴 6.8 ŞİDDETİNDE ACİL DEPREM ALARMI!",
      body: "Hatay - Antakya Bölgesi. Lütfen hemen en yakın AFAD Güvenli Toplanma Alanına veya açık park alanına geçiniz!",
      severity: "critical",
      timestamp: new Date().toLocaleTimeString("tr-TR"),
      location: "Hatay / Antakya",
      magnitude: 6.8
    };
    setActiveAlert(demoAlert);

    if (permissionGranted && typeof window !== "undefined" && "Notification" in window) {
      new Notification(demoAlert.title, {
        body: demoAlert.body,
        icon: "/favicon.ico"
      });
    }
  };

  return (
    <div className="w-full relative z-40">
      {/* PERMISSION REQUEST BANNER IF NOT GRANTED */}
      {!permissionGranted && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-blue-950/90 border-b border-amber-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400 animate-bounce flex-shrink-0" />
            <span>
              <strong>Afet İkaz Bildirimleri Kapalı:</strong> Deprem anında anlık acil durum push bildirimi alabilmek için bildirim izni veriniz.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Bildirim İznini Aç</span>
            </button>
            <button
              onClick={triggerDemoEmergency}
              className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-bold transition-all flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Test Alarmı Çal</span>
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE EMERGENCY CRITICAL ALERT BANNER */}
      {activeAlert && (
        <div className={`w-full p-4 border-b transition-all animate-pulse ${
          activeAlert.severity === "critical"
            ? "bg-red-950/95 border-red-500 text-red-100 shadow-2xl shadow-red-600/40"
            : "bg-amber-950/95 border-amber-500 text-amber-100"
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-red-600 text-white font-black animate-bounce shadow-lg shadow-red-500/50">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase font-mono tracking-wider">
                    ACİL AFET UYARISI
                  </span>
                  <span className="text-xs font-mono opacity-80">{activeAlert.timestamp}</span>
                </div>
                <h3 className="text-base md:text-lg font-black tracking-wide text-white">{activeAlert.title}</h3>
                <p className="text-xs md:text-sm text-red-200 font-medium">{activeAlert.body}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/survivor"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-red-700 font-black text-xs shadow-xl transition-all flex items-center gap-2"
              >
                <Navigation className="w-4 h-4 text-red-600" />
                <span>EN YAKIN AFAD SAFESPOT ROTALARI</span>
              </Link>
              <button
                onClick={() => setActiveAlert(null)}
                className="p-2 rounded-xl bg-red-900/60 hover:bg-red-900 text-red-300 transition-all"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
