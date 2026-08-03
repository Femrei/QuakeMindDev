"use client";

import { memo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { MapMarkerItem, MapPolylineItem } from "./LeafletContainer";

export type { MapMarkerItem, MapPolylineItem };

interface InteractiveMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarkerItem[];
  polylines?: MapPolylineItem[];
  className?: string;
  heatData?: [number, number, number][];
  satelliteTileUrl?: string;
  satelliteAttribution?: string;
  onMapClick?: (lat: number, lng: number) => void;
  enableDraw?: boolean;
  onBoundsSelected?: (bbox: [number, number, number, number]) => void;
  onDrawCleared?: () => void;
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

// Memoized here (the outer static wrapper) rather than on the dynamically-
// imported LeafletContainer itself: wrapping next/dynamic's lazy-loaded
// target directly in React.memo breaks its Suspense/bailout-to-CSR handling.
// This still skips re-rendering the (potentially ~2000-marker) Leaflet tree
// when a parent re-renders with the same props (e.g. an unrelated slider drag).
function InteractiveMap(props: InteractiveMapProps) {
  return <DynamicMap {...props} />;
}

export default memo(InteractiveMap);
