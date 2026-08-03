"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { registerUser, loginUser } from "@/lib/api";
import { 
  ShieldAlert, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  UserCheck, 
  MapPin, 
  Briefcase,
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithProfile } = useAuth();
  
  const [tab, setTab] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<"survivor" | "responder">("responder");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("Hatay");
  const [unit, setUnit] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (tab === "register") {
        if (!name.trim()) {
          setErrorMsg("Lütfen adınızı ve soyadınızı giriniz.");
          setLoading(false);
          return;
        }
        const res = await registerUser({
          name: name.trim(),
          email: email.trim() || `user_${Date.now()}@quakemind.gov.tr`,
          password: password || "password123",
          role: selectedRole,
          city: city || "Hatay",
          unit: unit || (selectedRole === "responder" ? "Arama Kurtarma Saha Ekibi" : "Sivil Afetzede"),
        });
        setSuccessMsg(res.message || "Kayıt başarılı! Yönlendiriliyorsunuz...");
        loginWithProfile(res.user, res.token);
        setTimeout(() => {
          router.push(selectedRole === "survivor" ? "/survivor" : "/command");
        }, 600);
      } else {
        const userEmail = email.trim() || (selectedRole === "responder" ? "saha@quakemind.gov.tr" : "afetzede@quakemind.gov.tr");
        const res = await loginUser({
          email: userEmail,
          password: password || "password123",
          role: selectedRole,
        });
        setSuccessMsg("Giriş başarılı! Yönlendiriliyorsunuz...");
        loginWithProfile(res.user, res.token);
        setTimeout(() => {
          router.push(res.user.role === "survivor" ? "/survivor" : "/command");
        }, 500);
      }
    } catch (err: any) {
      console.warn("Auth API hatası, yerel oturuma geçiliyor:", err);
      // Local fallback for instant offline testing
      const fallbackProfile = {
        id: "usr-" + Math.random().toString(36).substring(2, 8),
        name: name.trim() || (selectedRole === "responder" ? "Afet Saha Ekibi" : "Afetzede Vatandaş"),
        email: email.trim() || (selectedRole === "responder" ? "saha@quakemind.gov.tr" : "afetzede@quakemind.gov.tr"),
        role: selectedRole,
        city: city || "Hatay",
        unit: unit || (selectedRole === "responder" ? "Arama Kurtarma Lideri" : "Sivil"),
      };
      loginWithProfile(fallbackProfile, "local-demo-token");
      router.push(selectedRole === "survivor" ? "/survivor" : "/command");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: "survivor" | "responder") => {
    setLoading(true);
    const email = role === "responder" ? "saha@quakemind.gov.tr" : "afetzede@quakemind.gov.tr";
    loginUser({ email, password: "password123", role })
      .then((res) => {
        loginWithProfile(res.user, res.token);
        router.push(role === "survivor" ? "/survivor" : "/command");
      })
      .catch(() => {
        const demoProfile = {
          id: role === "responder" ? "usr-responder-101" : "usr-survivor-102",
          name: role === "responder" ? "Afet Saha Ekibi" : "Afetzede Vatandaş",
          email,
          role,
          city: "Hatay",
          unit: role === "responder" ? "Arama Kurtarma Lideri" : "Sivil",
        };
        loginWithProfile(demoProfile, "demo-token");
        router.push(role === "survivor" ? "/survivor" : "/command");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex-1 w-full min-h-screen flex items-center justify-center p-4 md:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0f17] to-black">
      <div className="max-w-xl w-full glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6 relative z-10 shadow-2xl bg-slate-950/90">
        
        {/* HEADER BRANDING */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 mx-auto flex items-center justify-center text-white font-bold shadow-xl shadow-blue-500/30 mb-3 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-mono tracking-wide">QUAKEMIND AFET KİMLİK MERKEZİ</h1>
          <p className="text-xs text-slate-400">PostGIS & AI Destekli Afet İkaz & Operasyon Platformu</p>
        </div>

        {/* LOGIN / REGISTER TAB SELECTOR */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => { setTab("login"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === "login"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" /> 🔑 GİRİŞ YAP
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === "register"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" /> 📝 HESAP OLUŞTUR
          </button>
        </div>

        {/* ROLE SELECTION CARDS (PROFİL SEÇİMİ) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-cyan-400" /> KULLANICI PROFİLİ & YETKİ SEVİYESİ
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setSelectedRole("responder")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRole === "responder"
                  ? "bg-blue-950/50 border-blue-500/80 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-400 uppercase font-mono">🔵 Saha Ekibi & Komuta</span>
                {selectedRole === "responder" && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                AFAD, Arama Kurtarma Lideri, İHA & Uydu Operatörü, Komuta Haritası & SOS Sevk Paneli.
              </p>
            </div>

            <div
              onClick={() => setSelectedRole("survivor")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRole === "survivor"
                  ? "bg-red-950/50 border-red-500/80 shadow-lg shadow-red-500/20 ring-1 ring-red-500"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-red-400 uppercase font-mono">🔴 Vatandaş & Afetzede</span>
                {selectedRole === "survivor" && <CheckCircle2 className="w-4 h-4 text-red-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Tek Tıkla Acil SOS Gönderme, PostGIS Güvenli AFAD Toplanma Alanı & Çatlak Tara.
              </p>
            </div>
          </div>
        </div>

        {/* FEEDBACK ALERTS */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM FIELDS */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "register" && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Ad Soyad</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full py-3 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">E-Posta Adresi</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === "responder" ? "saha@quakemind.gov.tr" : "afetzede@quakemind.gov.tr"}
                className="w-full py-3 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Şifre</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {tab === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Şehir / İl</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Hatay"
                    className="w-full py-3 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Birim / Unvan</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={selectedRole === "responder" ? "Arama Kurtarma Lideri" : "Sivil"}
                    className="w-full py-3 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50 ${
              selectedRole === "responder"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30"
                : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/30"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Kimlik Doğrulanıyor...</span>
              </>
            ) : (
              <>
                <span>{tab === "login" ? "Giriş Yap ve Devam Et" : "Hesabımı Oluştur ve Başla"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-CLICK DEMO ACCOUNTS FOR INSTANT TESTING */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">⚡ Hızlı Test İçin Tek Tıkla Demo Girişi:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("responder")}
              className="py-2.5 px-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>👤 Saha Ekibi Demo Girişi</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("survivor")}
              className="py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>🛡️ Afetzede Demo Girişi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
