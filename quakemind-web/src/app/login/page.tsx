"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"survivor" | "responder">("responder");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole, email || "operator@quakemind.org");
    if (selectedRole === "survivor") {
      router.push("/survivor");
    } else {
      router.push("/command");
    }
  };

  return (
    <div className="flex-1 w-full flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0f17] to-black">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 relative z-10 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 mb-3">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white font-mono">QUAKEMIND GİRİŞİ</h1>
          <p className="text-xs text-slate-400">Firebase Authentication Hazır Kimlik Doğrulama Paneli</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Kullanıcı Rolü</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole("responder")}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedRole === "responder"
                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30"
                    : "glass-button text-slate-400 border-slate-800"
                }`}
              >
                Ekip Girişi
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("survivor")}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedRole === "survivor"
                    ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30"
                    : "glass-button text-slate-400 border-slate-800"
                }`}
              >
                Vatandaş Girişi
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">E-Posta Adresi</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@quakemind.gov.tr"
                className="w-full py-3 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Şifre</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Güvenli Giriş Yap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-800">
          <span>Firebase FCM & OAuth Entegrasyonu Etkinleştirilmeye Hazır.</span>
        </div>
      </div>
    </div>
  );
}
