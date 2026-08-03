"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Siren, 
  Map, 
  Activity, 
  FileText, 
  Camera,
  Settings,
  Compass,
  Radio,
  Layers
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Komuta Merkezi", href: "/command", icon: LayoutDashboard },
    { name: "Birleşik Komuta Haritası", href: "/command/map", icon: Layers },
    { name: "SOS İhbar Sevk", href: "/command/sos", icon: Siren, badge: "CANLI" },
    { name: "Uydu Yol & Rota Analizi", href: "/command/road-damage", icon: Map },
    { name: "Deprem Risk & Fay Hattı", href: "/command/risk", icon: Activity },
    { name: "Afet Metin NLP", href: "/command/nlp", icon: FileText },
    { name: "Kamera ile Çatlak Tespiti", href: "/command/camera", icon: Camera },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)]">
      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
            Arama Kurtarma Modülleri
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick System Shortcuts */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
            Hızlı Erişim & Ayarlar
          </h2>
          <Link
            href="/onboarding"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Onboarding Simülasyonu</span>
          </Link>
          <div className="px-3 py-2 rounded-xl bg-slate-900/40 border border-slate-800/50 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Node Modu:
              </span>
              <span className="font-semibold text-emerald-400">Offline Hotspot</span>
            </div>
            <p className="text-[9px] text-slate-400">10.42.0.1 (FastAPI Mesh)</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
        <span>QuakeMind SaaS v2.0</span>
        <span className="text-emerald-400 font-semibold">PostGIS Ready</span>
      </div>
    </aside>
  );
}
