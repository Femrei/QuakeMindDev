"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Globe,
  Zap,
  ChevronDown,
  Radio,
  Satellite,
  Route,
} from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRole = searchParams.get("role");

  // Where RouteGuard sent the visitor from before bouncing them here, so
  // login can return them to the page they actually wanted. Only accept a
  // same-origin relative path (must start with a single "/") -- anything
  // else (a bare "//evil.com" or an absolute URL) is an open-redirect
  // vector and gets ignored in favor of the role's default portal.
  const rawRedirect = searchParams.get("redirect");
  const safeRedirect =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : null;
  const destinationFor = (role: string | null | undefined) =>
    safeRedirect || (role === "survivor" ? "/survivor" : "/command");

  const { loginWithProfile } = useAuth();
  
  const [tab, setTab] = useState<"login" | "register" | "sms">("login");
  const [selectedRole, setSelectedRole] = useState<"survivor" | "responder">(
    urlRole === "survivor" ? "survivor" : "responder"
  );
  
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
  // Collapsed by default -- 8 demo account buttons always expanded is what
  // was pushing the card taller than the viewport and forcing an awkward
  // inner scroll.
  const [showDemo, setShowDemo] = useState(false);

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
      if (!confirmationResult || !confirmationResult.confirm) {
        throw new Error("SMS doğrulama oturumu bulunamadı. Lütfen kodu tekrar gönderin.");
      }
      const res = await confirmationResult.confirm(otpCode);
      const firebaseUser = res.user;

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
        router.push(destinationFor(selectedRole));
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
      router.push(destinationFor(selectedRole));
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
          router.push(destinationFor(selectedRole));
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
          router.push(destinationFor(res.user.role));
        }, 500);
      }
    } catch (err: any) {
      // Auth must fail closed: show the real error, never fabricate a session.
      setErrorMsg(err.message || "Giriş başarısız. Bilgilerinizi kontrol edip tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Geliştirme aşamasında birden fazla hesapla test edebilmek için demo
  // kullanıcı listesi. TODO: production'a çıkmadan önce kaldır / env flag'e bağla.
  const DEMO_RESPONDERS = [
    { email: "saha@quakemind.gov.tr", name: "Afet Saha Ekibi", unit: "Arama Kurtarma Lideri" },
    { email: "saha2@quakemind.gov.tr", name: "Zeynep Arslan", unit: "AKUT Operatörü" },
    { email: "saha3@quakemind.gov.tr", name: "Mehmet Demir", unit: "İHA & Uydu Operatörü" },
    { email: "saha4@quakemind.gov.tr", name: "Elif Kaya", unit: "UMKE Sağlık Ekibi" },
    { email: "saha5@quakemind.gov.tr", name: "Burak Öztürk", unit: "İtfaiye Arama Kurtarma" },
  ];
  const DEMO_SURVIVORS = [
    { email: "afetzede@quakemind.gov.tr", name: "Afetzede Vatandaş", unit: "Sivil" },
    { email: "afetzede2@quakemind.gov.tr", name: "Ali Yıldız", unit: "Sivil" },
    { email: "afetzede3@quakemind.gov.tr", name: "Ayşe Şahin", unit: "Sivil" },
  ];

  const handleDemoLogin = (role: "survivor" | "responder", demoEmail?: string) => {
    setLoading(true);
    setErrorMsg(null);
    const email = demoEmail || (role === "responder" ? "saha@quakemind.gov.tr" : "afetzede@quakemind.gov.tr");
    loginUser({ email, password: "password123", role })
      .then((res) => {
        loginWithProfile(res.user, res.token);
        router.push(destinationFor(role));
      })
      .catch((err: any) => {
        // Fail closed: a demo-login failure must surface as an error, not a
        // fabricated session, so a backend rejection can never be bypassed.
        setErrorMsg(err.message || "Demo giriş başarısız. Backend'e ulaşılamıyor.");
      })
      .finally(() => setLoading(false));
  };

  const roleAccent = selectedRole === "survivor" ? "red" : "blue";
  const heroFeatures =
    selectedRole === "responder"
      ? [
          [Satellite, "Birleşik Komuta Haritası & Katmanlar"],
          [Radio, "Canlı SOS Sevk & Ekip Yönetimi"],
          [Shield, "Kurumsal AFAD / AKUT / UMKE Girişi"],
        ] as const
      : [
          [Zap, "Tek Dokunuşla SOS Gönderimi"],
          [Route, "PostGIS Sokak Rota Navigasyonu"],
          [ShieldAlert, "YOLO Canlı Çatlak & Hasar Tara"],
        ] as const;

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-65px)] flex bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0f17] to-black relative overflow-hidden">
      {/* Ambient glow -- tints toward the selected role's accent color */}
      <div
        className={`absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] blur-[150px] pointer-events-none rounded-full transition-colors duration-700 ${
          roleAccent === "red" ? "bg-red-600/20" : "bg-blue-600/20"
        }`}
      />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/5 blur-[130px] pointer-events-none rounded-full" />

      {/* LEFT: branding / hero panel -- desktop only, mirrors the landing page's language */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col justify-center px-12 xl:px-16 relative z-10 border-r border-slate-800/60 shrink-0">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 backdrop-blur-md shadow-xl w-fit mb-8">
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>QuakeMind Afet İkaz & Operasyon Ekosistemi v2.0</span>
        </div>

        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 transition-colors duration-500 ${
            roleAccent === "red"
              ? "bg-gradient-to-tr from-red-600 to-rose-500 shadow-red-500/30"
              : "bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 shadow-blue-500/30"
          }`}
        >
          <ShieldAlert className="w-9 h-9" />
        </div>

        <h1 className="text-4xl xl:text-5xl font-black text-white font-mono tracking-tight leading-[1.1] mb-4">
          AFET KİMLİK{" "}
          <span
            className={`bg-clip-text text-transparent bg-gradient-to-r transition-colors duration-500 ${
              roleAccent === "red" ? "from-red-500 via-rose-400 to-orange-300" : "from-blue-500 via-indigo-400 to-cyan-300"
            }`}
          >
            MERKEZİ
          </span>
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed mb-9 max-w-sm">
          PostGIS 3.4 mekânsal veritabanı ve yapay zekâ destekli afet ikaz platformu. Rolüne göre özelleştirilmiş güvenli giriş.
        </p>

        <div className="space-y-3.5">
          {heroFeatures.map(([Icon, label], i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-500 ${
                  roleAccent === "red" ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: form panel -- full width on mobile, remaining width on desktop */}
      <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto relative z-10">
        <div className="w-full max-w-md space-y-4 py-6">

        {/* Compact header -- only shown when the hero panel is hidden (mobile/tablet) */}
        <div className="lg:hidden text-center space-y-2 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-white font-mono tracking-wide">QUAKEMIND AFET KİMLİK MERKEZİ</h1>
          <p className="text-xs text-slate-400">PostGIS & AI Destekli Afet İkaz & Operasyon Platformu</p>
        </div>

        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-800 space-y-5 shadow-2xl bg-slate-950/90">
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
        </div>
        {/* /glass-panel card */}

        {/* DEMO ACCOUNTS -- collapsed by default so 8 buttons don't force the
            page into an awkward inner scroll on smaller viewports. */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 bg-slate-950/70 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Demo Hesaplarla Hızlı Giriş (Test Amaçlı)
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDemo ? "rotate-180" : ""}`} />
          </button>

          {showDemo && (
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-800/80">
              <div className="space-y-1.5 pt-3">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide px-0.5">🔵 Saha Ekibi Hesapları</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {DEMO_RESPONDERS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin("responder", acc.email)}
                      className="py-2 px-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-[11px] font-bold flex flex-col items-start gap-0.5 transition-all disabled:opacity-50 text-left"
                    >
                      <span className="truncate w-full">👤 {acc.name}</span>
                      <span className="text-[9px] text-blue-400/70 font-normal truncate w-full">{acc.unit}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide px-0.5">🔴 Vatandaş Hesapları</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {DEMO_SURVIVORS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin("survivor", acc.email)}
                      className="py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-[11px] font-bold flex flex-col items-start gap-0.5 transition-all disabled:opacity-50 text-left"
                    >
                      <span className="truncate w-full">🛡️ {acc.name}</span>
                      <span className="text-[9px] text-red-400/70 font-normal truncate w-full">{acc.unit}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-slate-500 text-center pt-1">
                Tüm demo hesapların şifresi: <span className="font-mono text-slate-400">password123</span>
              </p>
            </div>
          )}
        </div>

        {/* GOOGLE OAUTH */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-3 px-3 rounded-2xl glass-panel bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
        >
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Google Hesabı İle Giriş Yap (OAuth 2.0)</span>
        </button>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
