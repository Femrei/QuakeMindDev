"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Compass, ShieldAlert, Users, Radio, ArrowRight, CheckCircle2, Server } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { setRole } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<"survivor" | "responder">("responder");
  const [selectedCity, setSelectedCity] = useState("Hatay");

  const handleFinish = () => {
    setRole(selectedRole);
    if (selectedRole === "survivor") {
      router.push("/survivor");
    } else {
      router.push("/command");
    }
  };

  return (
    <div className="flex-1 w-full flex items-center justify-center p-6 bg-[#0b0f17]">
      <div className="max-w-2xl w-full glass-panel p-8 rounded-3xl border border-slate-800 space-y-8 relative overflow-hidden">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              QuakeMind Başlangıç & Kurulum Simülasyonu
            </span>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Adım {step} / 3
          </span>
        </div>

        {/* STEP 1: ROL SEÇİMİ */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-2xl font-bold text-white">1. Kullanıcı Rolünüzü Seçin</h2>
              <p className="text-xs text-slate-400 mt-1">
                Sistem arayüzü ve harita görünümü seçtiğiniz role göre özel olarak şekillenecektir.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setSelectedRole("survivor")}
                className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                  selectedRole === "survivor"
                    ? "bg-red-500/10 border-red-500 text-white shadow-xl shadow-red-500/10"
                    : "glass-card border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <ShieldAlert className="w-8 h-8 text-red-500 mb-3" />
                <h3 className="text-base font-bold">Afetzede & Vatandaş</h3>
                <p className="text-xs mt-1 opacity-80">
                  Hızlı SOS sinyali gönderme ve en yakın güvenli sığınak bulma paneli.
                </p>
              </div>

              <div
                onClick={() => setSelectedRole("responder")}
                className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                  selectedRole === "responder"
                    ? "bg-blue-500/10 border-blue-500 text-white shadow-xl shadow-blue-500/10"
                    : "glass-card border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Users className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-base font-bold">Arama Kurtarma Ekibi</h3>
                <p className="text-xs mt-1 opacity-80">
                  Canlı SOS sevk paneli, Segformer uydu yol analizi ve War Room dashboard.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Sonraki Adıma Geç</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: ÖNCELİKLİ AFET BÖLGESİ */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-2xl font-bold text-white">2. Öncelikli Takip Bölgeniz</h2>
              <p className="text-xs text-slate-400 mt-1">
                Harita ve deprem risk analizleri ilk olarak bu şehir için yüklenecektir.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {["Hatay", "Kahramanmaras", "Gaziantep", "Malatya", "Adiyaman", "Istanbul"].map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`p-4 rounded-xl text-xs font-bold border transition-all text-left ${
                    selectedCity === city
                      ? "bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-md shadow-emerald-600/20"
                      : "glass-button text-slate-400 border-slate-800"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="py-4 px-6 rounded-2xl glass-button text-slate-400 text-sm font-bold"
              >
                Geri
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Sonraki Adıma Geç</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SERVER & NODE CONNECTION TEST */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-2xl font-bold text-white">3. Sunucu ve Bağlantı Modu</h2>
              <p className="text-xs text-slate-400 mt-1">
                QuakeMind FastAPI Backend ve Hotspot Mesh ağı durumu kontrol ediliyor.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <Server className="w-4 h-4 text-blue-400" /> FastAPI REST API (Port 8000)
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bağlandı
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <Radio className="w-4 h-4 text-emerald-400" /> P2P Hotspot Mesh Ağı
                </span>
                <span className="text-emerald-400 font-bold">10.42.0.1 (Aktif)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(2)}
                className="py-4 px-6 rounded-2xl glass-button text-slate-400 text-sm font-bold"
              >
                Geri
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-base tracking-wider shadow-2xl shadow-emerald-600/40 transition-all flex items-center justify-center gap-2"
              >
                <span>SİSTEMİ BAŞLAT VE PORTALA GİR</span>
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
