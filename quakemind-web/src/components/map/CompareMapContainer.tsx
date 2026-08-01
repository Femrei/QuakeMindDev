"use client";

import { useEffect, useState } from "react";
import { MapContainer, ImageOverlay, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";

interface CompareMapContainerProps {
  beforeImage: string;
  afterImage: string;
  bounds: { west: number; south: number; east: number; north: number };
  className?: string;
}

function SideBySideControl({ left, right }: { left: L.ImageOverlay | null; right: L.ImageOverlay | null }) {
  const map = useMap();

  useEffect(() => {
    if (!left || !right) return;
    const sideBySideFactory = (L.control as unknown as {
      sideBySide: (l: L.Layer, r: L.Layer) => L.Control & { remove: () => void };
    }).sideBySide;
    const control = sideBySideFactory(left, right).addTo(map);
    return () => {
      control.remove();
    };
  }, [map, left, right]);

  return null;
}

export default function CompareMapContainer({
  beforeImage,
  afterImage,
  bounds,
  className = "w-full h-full min-h-[400px]",
}: CompareMapContainerProps) {
  const [leftLayer, setLeftLayer] = useState<L.ImageOverlay | null>(null);
  const [rightLayer, setRightLayer] = useState<L.ImageOverlay | null>(null);

  const leafletBounds: L.LatLngBoundsExpression = [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  ];
  const center: [number, number] = [
    (bounds.south + bounds.north) / 2,
    (bounds.west + bounds.east) / 2,
  ];

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-800 ${className}`}>
      <MapContainer
        center={center}
        zoom={17}
        className="w-full h-full min-h-[400px]"
        style={{ background: "#0b0f17" }}
      >
        <ImageOverlay ref={setLeftLayer} url={beforeImage} bounds={leafletBounds} />
        <ImageOverlay ref={setRightLayer} url={afterImage} bounds={leafletBounds} />
        <SideBySideControl left={leftLayer} right={rightLayer} />
      </MapContainer>
    </div>
  );
}
