"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Users, Compass, Activity, ArrowRight, Zap, Radio, CheckCircle2 } from "lucide-react";

export default function LandingGatePage() {
  const router = useRouter();
  const { setRole } = useAuth();

  const handleSelectRole = (role: "survivor" | "responder", targetPath: string) => {
    setRole(role);
    router.push(targetPath);
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-6 md:p-12 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0f17] to-black">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-red-600/20 via-orange-500/10 to-blue-600/20 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-4xl w-full text-center space-y-8 relative z-10">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 backdrop-blur-md shadow-xl">
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>QuakeMind SaaS Enterprise v2.0 Platformu</span>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white font-mono">
            AFET İKAZ & <span className="bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 bg-clip-text text-transparent">YAPAY ZEKA</span> PLATFORMU
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            İnternetsiz Mesh ağı uyumlu, uydu yol hasarı tespitli, CatBoost deprem risk motorlu ve BERTurk NLP ihbar madencilikli akıllı afet yönetim ekosistemi.
          </p>
        </div>

        {/* DUAL PORTAL CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4">
          {/* 🔴 SURVIVOR / AFETZEDE PORTALI */}
          <div
            onClick={() => handleSelectRole("survivor", "/survivor")}
            className="group cursor-pointer glass-panel p-8 rounded-3xl border border-red-500/30 hover:border-red-500 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all" />

            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-1">
                  Vatandaş & Afetzede Portalı
                </span>
                <h2 className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors">
                  Afetzedeyim / SOS & Yardım Talebi
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Tek tıkla GPS konumu ve durum bildirme, en yakın güvenli toplanma alanını bulma ve acil ihtiyaç talebi oluşturma paneli.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                <span>Tek Dokunuşla SOS Gönderimi</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                <span>En Yakın Sığınak Navigasyonu</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                <span>Yüksek Kontrast & Kolay Arayüz</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs font-bold text-red-400 group-hover:translate-x-1 transition-transform">
              <span>Portala Giriş Yap</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* 🔵 RESPONDER / EKİP PORTALI */}
          <div
            onClick={() => handleSelectRole("responder", "/command")}
            className="group cursor-pointer glass-panel p-8 rounded-3xl border border-blue-500/30 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />

            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
                  Komuta & Saha Ekip Portalı
                </span>
                <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  Kurtarma Ekibi & Yönetim Paneli
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Arama-kurtarma ekipleri için 60 FPS canlı harita, SOS sevk merkezi, Segformer uydu yol analizi ve NLP ihbar takibi.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Canlı SOS Sevk & Ekip Yönetimi</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Segformer AI Uydu Yol & Rota Analizi</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Deprem Risk, Fay Hatları & Kamera Tespiti</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Komuta Merkezine Bağlan</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Footer Shortcut to Onboarding */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <Link href="/onboarding" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>İlk Kurulum & Onboarding Simülasyonu</span>
          </Link>
          <span>•</span>
          <Link href="/login" className="hover:text-slate-200 transition-colors">
            Firebase Auth Giriş Sayfası
          </Link>
        </div>
      </div>
    </div>
  );
}
