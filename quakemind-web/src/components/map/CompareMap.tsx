"use client";

import dynamic from "next/dynamic";

interface CompareMapProps {
  beforeImage: string;
  afterImage: string;
  bounds: { west: number; south: number; east: number; north: number };
  className?: string;
}

const DynamicCompareMap = dynamic(() => import("./CompareMapContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 animate-pulse rounded-xl border border-slate-800">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <span className="text-sm font-medium">Karşılaştırma Haritası Yükleniyor...</span>
    </div>
  ),
});

export default function CompareMap(props: CompareMapProps) {
  return <DynamicCompareMap {...props} />;
}
