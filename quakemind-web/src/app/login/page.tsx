"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { registerUser, loginUser } from "@/lib/api";
import { setupRecaptcha, sendSmsOtp, signInWithGoogle } from "@/lib/firebase";
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
  RefreshCw,
  Phone,
  KeyRound,
  Globe
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithProfile } = useAuth();
  
  const [tab, setTab] = useState<"login" | "register" | "sms">("login");
  const [selectedRole, setSelectedRole] = useState<"survivor" | "responder">("responder");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("Hatay");
  const [unit, setUnit] = useState("");

  // Firebase SMS OTP states
  const [phone, setPhone] = useState("+90 555 123 4567");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const recaptcha = setupRecaptcha("recaptcha-container");
      const confirmation = await sendSmsOtp(phone.trim(), recaptcha);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setSuccessMsg("SMS Doğrulama Kodu Gönderildi! Demo Doğrulama Kodu: 123456");
    } catch (err: any) {
      console.warn("SMS Gönderme Hatası:", err);
      setErrorMsg(err.message || "SMS kodu gönderilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg("Lütfen 6 haneli SMS kodunu giriniz.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      let firebaseUser: any = null;
      if (confirmationResult && confirmationResult.confirm) {
        const res = await confirmationResult.confirm(otpCode);
        firebaseUser = res.user;
      } else {
        firebaseUser = {
          uid: "usr-sms-" + Math.random().toString(36).substring(2, 8),
          phoneNumber: phone,
          displayName: "Afetzede Vatandaş (SMS OTP)",
          email: `sms_${phone.replace(/\D/g, '')}@quakemind.gov.tr`
        };
      }

      const profile = {
        id: firebaseUser.uid || "usr-sms-101",
        name: name.trim() || `Afetzede (${phone})`,
        email: firebaseUser.email || `sms_${phone.replace(/\D/g, '')}@quakemind.gov.tr`,
        role: selectedRole,
        city: city || "Hatay",
        unit: selectedRole === "responder" ? "Arama Kurtarma Saha Ekibi" : "Sivil Afetzede",
      };

      loginWithProfile(profile, "firebase-sms-token-" + profile.id);
      setSuccessMsg("SMS Doğrulaması Başarılı! Yönlendiriliyorsunuz...");
      setTimeout(() => {
        router.push(selectedRole === "survivor" ? "/survivor" : "/command");
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "SMS Doğrulama Kodu Hatalı!");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const gUser = await signInWithGoogle();
      const profile = {
        id: gUser.uid || "usr-g-101",
        name: gUser.displayName || "Google Kullanıcısı",
        email: gUser.email || "google@quakemind.gov.tr",
        role: selectedRole,
        city: "Hatay",
        unit: selectedRole === "responder" ? "Arama Kurtarma Lideri" : "Sivil",
      };
      loginWithProfile(profile, "google-oauth-token");
      router.push(selectedRole === "survivor" ? "/survivor" : "/command");
    } catch (err: any) {
      setErrorMsg("Google ile giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  };

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

        {/* LOGIN / REGISTER / SMS TAB SELECTOR */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => { setTab("login"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              tab === "login"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> 🔑 E-POSTA
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              tab === "register"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" /> 📝 KAYIT OL
          </button>
          <button
            type="button"
            onClick={() => { setTab("sms"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              tab === "sms"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Phone className="w-3.5 h-3.5" /> 📱 SMS OTP
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
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRole === "responder"
                  ? "bg-blue-950/50 border-blue-500/80 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-400 uppercase font-mono">🔵 Saha Ekibi & Komuta</span>
                {selectedRole === "responder" && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                AFAD, Arama Kurtarma Lideri, İHA & Uydu Operatörü, Komuta Haritası & SOS Sevk.
              </p>
            </div>

            <div
              onClick={() => setSelectedRole("survivor")}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRole === "survivor"
                  ? "bg-red-950/50 border-red-500/80 shadow-lg shadow-red-500/20 ring-1 ring-red-500"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-red-400 uppercase font-mono">🔴 Vatandaş & Afetzede</span>
                {selectedRole === "survivor" && <CheckCircle2 className="w-4 h-4 text-red-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tek Tıkla SOS Gönderme, PostGIS Güvenli AFAD Toplanma Alanı & Çatlak Tara.
              </p>
            </div>
          </div>
        </div>

        {/* FEEDBACK ALERTS */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SMS OTP FORM */}
        {tab === "sms" ? (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendSms} className="space-y-3.5">
            <div id="recaptcha-container"></div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Cep Telefon Numarası</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="tel"
                  disabled={otpSent}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+90 555 123 4567"
                  className="w-full py-3 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {otpSent && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">SMS Doğrulama Kodu (Demo: 123456)</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-emerald-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full py-3 pl-9 pr-3 rounded-xl bg-slate-950 border border-emerald-500/60 text-sm font-black text-emerald-300 tracking-widest focus:border-emerald-400 focus:outline-none font-mono text-center"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>SMS Kod İşleniyor...</span>
                </>
              ) : otpSent ? (
                <>
                  <span>SMS Kodu Doğrula ve Başla</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>📱 SMS OTP Kodu Gönder (3 Sn)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* EMAIL & REGISTER FORM */
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {selectedRole === "responder" && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Bağlı Bulunan Kurum</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-blue-400 absolute left-3 top-3.5" />
                    <select
                      value={unit || "AFAD"}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full py-3 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="AFAD (Afet ve Acil Durum Yön.)">AFAD (Afet ve Acil Durum Yön.)</option>
                      <option value="AKUT (Arama Kurtarma Derneği)">AKUT (Arama Kurtarma Derneği)</option>
                      <option value="KIZILAY (Türk Kızılay)">KIZILAY (Türk Kızılay Afet)</option>
                      <option value="UMKE (Ulusal Medikal Kurtarma)">UMKE (Ulusal Medikal Kurtarma)</option>
                      <option value="İTFAİYE (Arama Kurtarma)">İTFAİYE (Arama Kurtarma)</option>
                      <option value="EGM / JANDARMA (Asayiş Ekipleri)">EGM / JANDARMA (Asayiş Ekipleri)</option>
                      <option value="TBB / BELEDİYE (Lojistik)">TBB / BELEDİYE (Lojistik)</option>
                      <option value="Özel Arama Kurtarma Kuruluşu">Özel Arama Kurtarma Kuruluşu</option>
                    </select>
                  </div>
                </div>
              )}
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
      )}

        {/* 1-CLICK DEMO ACCOUNTS & GOOGLE OAUTH */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">⚡ Hızlı Test & OAuth Giriş Seçenekleri:</p>
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
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all mt-2"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Google Hesabı İle Giriş Yap (OAuth 2.0)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
