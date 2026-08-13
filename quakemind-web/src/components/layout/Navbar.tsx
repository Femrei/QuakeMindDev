"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchServerStatus } from "@/lib/api";
import { Bell, ShieldAlert, Activity, User, LogOut, CheckCircle2, AlertCircle } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, setRole, logout, notificationsCount } = useAuth();
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchServerStatus()
      .then(() => setServerOk(true))
      .catch(() => setServerOk(false));
  }, []);

  // Hide top Navbar completely on login screen for a clean, clutter-free authentication UI
  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full max-w-full glass-panel border-b border-slate-800/80 px-4 py-3 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 group min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 p-0.5 shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-lg font-black tracking-wider text-white font-mono whitespace-nowrap">QUAKEMIND</span>
              <span className="block text-[10px] text-slate-400 -mt-1 font-sans truncate">Afet İkaz & AI Platformu</span>
            </div>
          </Link>

          {/* Role Indicator Pill */}
          {role && (
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${
              role === 'survivor' 
                ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${role === 'survivor' ? 'bg-red-500 animate-ping' : 'bg-blue-500'}`} />
              {role === 'survivor' ? '🔴 Afetzede Portalı' : '🔵 Ekip Komuta Merkezi'}
            </div>
          )}
        </div>

        {/* Server Health & Right Tools */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Server Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 shrink-0">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>FastAPI:</span>
            {serverOk === null ? (
              <span className="text-amber-400">Bağlanıyor...</span>
            ) : serverOk ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400 font-medium">
                <AlertCircle className="w-3 h-3" /> Çevrimdışı (Demo Mod)
              </span>
            )}
          </div>

          {/* Role Switcher Button */}
          <button
            onClick={() => setRole(role === "survivor" ? "responder" : "survivor")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-button text-xs text-slate-200 font-medium"
            title="Modu Değiştir"
          >
            Mod Değiştir ({role === "survivor" ? "Ekip" : "Afetzede"})
          </button>

          {/* Notifications Bell */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg glass-button text-slate-300 hover:text-white"
              aria-label="Bildirimler"
            >
              <Bell className="w-5 h-5" />
              {notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {notificationsCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 glass-panel rounded-xl shadow-2xl border border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="text-xs font-bold text-white">Canlı Afet İkaz Akışı</span>
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                    Firebase FCM Ready
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200">
                    <p className="font-bold text-red-400">🚨 YENİ KRİTİK SOS</p>
                    <p className="text-[11px] mt-0.5">Hatay Antakya: Cebrail Mah. enkaz altı ses alındı!</p>
                    <span className="text-[9px] text-red-300/60 block mt-1">1 dakika önce</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
                    <p className="font-bold text-amber-400">📉 DEPREM UYARISI</p>
                    <p className="text-[11px] mt-0.5">Kahramanmaraş merkezli M 4.2 deprem kaydedildi.</p>
                    <span className="text-[9px] text-amber-300/60 block mt-1">12 dakika önce</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200">
                    <p className="font-bold text-blue-400">🛣️ YOL HASAR RAPORU</p>
                    <p className="text-[11px] mt-0.5">Gaziantep Nurdağı otoyolunda heyelan tespit edildi.</p>
                    <span className="text-[9px] text-blue-300/60 block mt-1">45 dakika önce</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge & Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 border border-blue-400 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-blue-500/20">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="hidden lg:block text-left text-xs min-w-0 max-w-[9rem]">
                  <p className="font-semibold text-slate-200 leading-tight truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.unit || user.city}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 ml-1 shrink-0"
                title="Çıkış Yap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Çıkış Yap</span>
              </button>
            </div>
          ) : (
            <Link href="/login" className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">🔑 Giriş Yap / Kayıt Ol</span>
              <span className="sm:hidden">Giriş Yap</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
