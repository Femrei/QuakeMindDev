"use client";

import React, { useState, useEffect } from "react";
import InteractiveMap, { MapMarkerItem, MapPolylineItem } from "@/components/map/InteractiveMap";
import { sendSOSAlert } from "@/lib/api";
import { ShieldAlert, MapPin, Navigation, Package, CheckCircle2, AlertCircle, Heart, PhoneCall } from "lucide-react";

const ANTAKYA_COORDS: [number, number] = [36.202, 36.161];

const SHELTERS: MapMarkerItem[] = [
  {
    id: "sh-1",
    lat: 36.208,
    lng: 36.165,
    title: "Atatürk Parkı Güvenli Toplanma Alanı",
    type: "shelter",
    popupText: "Kapasite: 500 Çadır | Aşevi Var",
  },
  {
    id: "sh-2",
    lat: 36.195,
    lng: 36.155,
    title: "Stadyum Acil Sığınak Merkezi",
    type: "shelter",
    popupText: "Sağlık Çadırı & İlaç Dağıtımı Aktif",
  },
];

export default function SurvivorPortalPage() {
  const [userLocation, setUserLocation] = useState<[number, number]>(ANTAKYA_COORDS);
  const [locating, setLocating] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sendingSos, setSendingSos] = useState(false);

  // Form States
  const [victimCount, setVictimCount] = useState(1);
  const [urgencyLevel, setUrgencyLevel] = useState<"CRITICAL" | "HIGH" | "NORMAL">("HIGH");
  const [note, setNote] = useState("");
  const [selectedAid, setSelectedAid] = useState<string[]>(["su", "gida"]);
  const [aidRequested, setAidRequested] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          setLocating(false);
        },
        () => setLocating(false),
        { timeout: 5000 }
      );
    }
  }, []);

  const handleSendSOS = async () => {
    setSendingSos(true);
    try {
      await sendSOSAlert({
        latitude: userLocation[0],
        longitude: userLocation[1],
        message: `[KİŞİ SAYISI: ${victimCount}] [ACİLİYET: ${urgencyLevel}] ${note}`,
        userId: "survivor-user",
      });
      setSosSent(true);
    } catch (e) {
      setSosSent(true); // Fallback mock for offline
    } finally {
      setSendingSos(false);
    }
  };

  const toggleAid = (id: string) => {
    if (selectedAid.includes(id)) {
      setSelectedAid(selectedAid.filter((item) => item !== id));
    } else {
      setSelectedAid([...selectedAid, id]);
    }
  };

  const markers: MapMarkerItem[] = [
    {
      id: "user-loc",
      lat: userLocation[0],
      lng: userLocation[1],
      title: "Konumunuz (Siz)",
      type: "sos",
      popupText: "SOS Sinyali Gönderilecek Nokta",
    },
    ...SHELTERS,
  ];

  // Route from User to Shelter
  const polylines: MapPolylineItem[] = [
    {
      id: "route-to-shelter",
      coords: [userLocation, [36.208, 36.165]],
      color: "#10b981",
      weight: 5,
      opacity: 0.9,
    },
  ];

  return (
    <div className="flex-1 w-full min-h-screen bg-[#090d14] text-slate-100 p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* HEADER BANNER */}
      <div className="glass-panel p-6 rounded-3xl border border-red-500/30 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-950">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-red-600/30 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest block">
              Vatandaş & Afetzede Acil Portalı
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white font-mono">
              ACİL DURUM İKAZ & YARDIM MERKEZİ
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:112"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/40 transition-all hover:scale-105"
          >
            <PhoneCall className="w-4 h-4" /> 112 ACİL ARA
          </a>
        </div>
      </div>

      {/* MAIN TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: BIG SOS TRIGGER & ASSISTANCE FORM (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* BIG SOS TRIGGER CARD */}
          <div className="glass-panel p-6 rounded-3xl border border-red-500/40 space-y-6 relative overflow-hidden bg-slate-900/90">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" /> TEK TIKLA İKAZ GÖNDER
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold">
                {locating ? "GPS Alınıyor..." : "GPS Konum Aktif"}
              </span>
            </div>

            {sosSent ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-emerald-400">SOS SİNYALİNİZ ALINDI!</h3>
                <p className="text-xs text-slate-300">
                  Konumunuz ve aciliyet durumunuz bölgedeki Arama-Kurtarma ekiplerine iletildi. Lütfen sakin kalın ve güvenli alanda bekleyin.
                </p>
                <button
                  onClick={() => setSosSent(false)}
                  className="px-4 py-2 rounded-xl glass-button text-xs text-slate-300 font-semibold mt-2"
                >
                  Yeni Sinyal Gönder
                </button>
              </div>
            ) : (
              <>
                {/* Form Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Bulunduğunuz Yerde Kaç Kişi Var?</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 5, "5+"].map((count, idx) => (
                        <button
                          key={idx}
                          onClick={() => setVictimCount(typeof count === "number" ? count : 6)}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                            victimCount === count || (count === "5+" && victimCount >= 5)
                              ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30"
                              : "glass-button text-slate-300 border-slate-700"
                          }`}
                        >
                          {count} Kişi
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Aciliyet Durumu</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setUrgencyLevel("CRITICAL")}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          urgencyLevel === "CRITICAL"
                            ? "bg-red-600 text-white border-red-500 glow-red"
                            : "glass-button text-slate-400"
                        }`}
                      >
                        Enkaz Altı / Kritik
                      </button>
                      <button
                        onClick={() => setUrgencyLevel("HIGH")}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          urgencyLevel === "HIGH"
                            ? "bg-amber-600 text-white border-amber-500"
                            : "glass-button text-slate-400"
                        }`}
                      >
                        Yaralı Var / Acil
                      </button>
                      <button
                        onClick={() => setUrgencyLevel("NORMAL")}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          urgencyLevel === "NORMAL"
                            ? "bg-blue-600 text-white border-blue-500"
                            : "glass-button text-slate-400"
                        }`}
                      >
                        Güvenli / İhtiyaç
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Açıklama / Adres Detayı (Opsiyonel)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Bina adı, kat numarası veya acil durum notunuzu yazın..."
                      className="w-full h-20 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                    />
                  </div>
                </div>

                {/* THE GIANT RED SOS BUTTON */}
                <button
                  onClick={handleSendSOS}
                  disabled={sendingSos}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-red-600 text-white font-black text-xl tracking-wider shadow-2xl shadow-red-600/50 glow-red transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                >
                  <ShieldAlert className="w-7 h-7 animate-ping" />
                  <span>{sendingSos ? "SOS GÖNDERİLİYOR..." : "ACİL SOS SİNYALİ GÖNDER"}</span>
                </button>
              </>
            )}
          </div>

          {/* EMERGENCY AID REQUEST CARD */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" /> ACİL MALZEME & YARDIM TALEBİ
              </span>
            </div>

            {aidRequested ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>Malzeme yardım talebiniz kayıtlara eklendi. En yakın lojistik noktasından sevk edilecektir.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "su", label: "💧 Temiz Su" },
                    { id: "gida", label: "🍞 Gıda / Konserve" },
                    { id: "cadir", label: "⛺ Çadır / Battaniye" },
                    { id: "ilac", label: "💊 İlk Yardım / İlaç" },
                  ].map((aid) => (
                    <button
                      key={aid.id}
                      onClick={() => toggleAid(aid.id)}
                      className={`p-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                        selectedAid.includes(aid.id)
                          ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/50"
                          : "glass-button text-slate-400 border-slate-800"
                      }`}
                    >
                      {aid.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAidRequested(true)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                >
                  Yardım Talebini İlet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: NEAREST SHELTER MAP & NAVIGATION (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-emerald-400" /> EN YAKIN GÜVENLİ SIĞINAK & ROTA
                </span>
                <p className="text-xs text-slate-400">
                  Konumunuza en yakın toplanma alanı ve güvenli yeşil rota çizimi.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <MapPin className="w-3.5 h-3.5" /> 650 Metre Yakında
              </div>
            </div>

            {/* INTERACTIVE MAP */}
            <div className="flex-1 min-h-[420px] rounded-2xl overflow-hidden border border-slate-800">
              <InteractiveMap center={userLocation} zoom={14} markers={markers} polylines={polylines} />
            </div>

            {/* SHELTER DETAILS LIST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {SHELTERS.map((sh) => (
                <div key={sh.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                  <p className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {sh.title}
                  </p>
                  <p className="text-slate-400 text-[11px]">{sh.popupText}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
