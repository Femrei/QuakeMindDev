"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

interface HeatmapLayerProps {
  /** [lat, lng, intensity] triples, matching the backend's /heatmap response. */
  points: [number, number, number][];
}

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const heatLayer = (L as any).heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 17,
      max: 1.0,
      gradient: { 0.2: "#3b82f6", 0.4: "#10b981", 0.6: "#f59e0b", 0.8: "#ef4444", 1.0: "#991b1b" },
    });
    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}
