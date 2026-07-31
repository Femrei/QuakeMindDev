"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type?: "sos" | "shelter" | "quake" | "damage";
  popupText?: string;
  magnitude?: number;
}

export interface MapPolylineItem {
  id: string;
  coords: [number, number][];
  color: string;
  weight?: number;
  opacity?: number;
  label?: string;
}

interface InteractiveMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarkerItem[];
  polylines?: MapPolylineItem[];
  className?: string;
  heatData?: [number, number, number][];
}

const DynamicMap = dynamic(() => import("./LeafletContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 animate-pulse rounded-xl border border-slate-800">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <span className="text-sm font-medium">İnteraktif GPU Harita Yükleniyor...</span>
    </div>
  ),
});

export default function InteractiveMap(props: InteractiveMapProps) {
  return <DynamicMap {...props} />;
}
