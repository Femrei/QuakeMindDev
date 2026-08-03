"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { MapContainer, ImageOverlay, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CompareMapContainerProps {
  beforeImage: string;
  afterImage: string;
  bounds: { west: number; south: number; east: number; north: number };
  className?: string;
}

// Recenters the map when a new analysis produces a different bounding box —
// MapContainer's center/zoom props only apply on first mount, so without this
// a second analysis at a different location leaves the images panned off-screen.
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(bounds)]);
  return null;
}

/**
 * Swipe-compare handle anchored to a longitude (not a screen percentage). The old
 * approach (leaflet-side-by-side) clips based on the container's own screen
 * coordinates assuming the clipped element's box starts at the map pane origin —
 * true for TileLayer, but ImageOverlay is positioned with a CSS transform, so its
 * box origin sits wherever the image's geo-bounds happen to project to. That
 * mismatch is why dragging the slider itself did nothing, while panning the map
 * (which forces Leaflet to re-run its own transform/reset) coincidentally looked
 * "clipped" — position and clip.rect were never actually in sync.
 *
 * Fixing it geographically: the divider is a longitude within `bounds`. On every
 * map move/zoom/resize we project that longitude to a screen pixel, use it to
 * position the visible handle, and derive the "before" image's own clip-path
 * inset from the SAME pixel measured against that image element's own bounding
 * box (clip-path insets are relative to the element's own box, so this is immune
 * to whatever transform Leaflet applies to position it).
 */
function SwipeCompare({
  beforeLayer,
  bounds,
}: {
  beforeLayer: L.ImageOverlay | null;
  bounds: L.LatLngBounds;
}) {
  const map = useMap();
  const [dividerLng, setDividerLng] = useState(() => bounds.getCenter().lng);
  const [handleLeftPx, setHandleLeftPx] = useState<number | null>(null);
  const draggingRef = useRef(false);

  const applyClip = useCallback(() => {
    const el = beforeLayer?.getElement();
    if (!el) return;

    const lat = map.getCenter().lat;
    const dividerContainerPoint = map.latLngToContainerPoint([lat, dividerLng]);
    const mapRect = map.getContainer().getBoundingClientRect();
    const dividerScreenX = mapRect.left + dividerContainerPoint.x;

    const imgRect = el.getBoundingClientRect();
    const dividerXWithinImage = dividerScreenX - imgRect.left;
    const insetRightPct =
      imgRect.width > 0
        ? Math.min(100, Math.max(0, 100 - (dividerXWithinImage / imgRect.width) * 100))
        : 50;

    el.style.clipPath = `inset(0 ${insetRightPct}% 0 0)`;
    setHandleLeftPx(dividerContainerPoint.x);
  }, [beforeLayer, map, dividerLng]);

  useEffect(() => {
    applyClip();
  }, [applyClip]);

  useMapEvents({
    move: applyClip,
    zoom: applyClip,
    resize: applyClip,
  });

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const mapRect = map.getContainer().getBoundingClientRect();
      const containerX = clientX - mapRect.left;
      const latLng = map.containerPointToLatLng([containerX, 0]);
      const west = bounds.getWest();
      const east = bounds.getEast();
      const clamped = Math.min(east, Math.max(west, latLng.lng));
      setDividerLng(clamped);
    },
    [map, bounds]
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      updateFromClientX(e.clientX);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      map.dragging.enable();
      (map as unknown as { tap?: { enable: () => void } }).tap?.enable();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [updateFromClientX, map]);

  if (handleLeftPx == null) return null;

  const startDrag = (e: ReactPointerEvent) => {
    // Stop this from reaching Leaflet's own mousedown/touchstart handlers —
    // without it, grabbing the divider also starts a map pan (the "resmi
    // kaydırınca" symptom: the image drags along with the divider instead of
    // just moving the divider).
    e.stopPropagation();
    e.preventDefault();
    draggingRef.current = true;
    map.dragging.disable();
    (map as unknown as { tap?: { disable: () => void } }).tap?.disable();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };

  return (
    <div
      className="absolute top-0 bottom-0 z-[1000] w-6 cursor-ew-resize touch-none"
      style={{ left: `${handleLeftPx}px`, transform: "translateX(-50%)" }}
      onPointerDown={startDrag}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[3px] h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.7)] mx-auto" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border-2 border-blue-500 flex items-center justify-center">
        <span className="text-blue-600 text-sm font-black leading-none">⇔</span>
      </div>
    </div>
  );
}

export default function CompareMapContainer({
  beforeImage,
  afterImage,
  bounds,
  className = "w-full h-full min-h-[400px]",
}: CompareMapContainerProps) {
  const [beforeLayer, setBeforeLayer] = useState<L.ImageOverlay | null>(null);

  // Stable identity across re-renders — an inline arrow ref would be recreated on
  // every render (e.g. while dragging an unrelated slider elsewhere on the page),
  // forcing React to null out and re-attach the ref each time.
  const setBeforeRef = useCallback((layer: L.ImageOverlay | null) => {
    setBeforeLayer(layer);
  }, []);

  const leafletBounds = L.latLngBounds(
    [bounds.south, bounds.west],
    [bounds.north, bounds.east]
  );
  const center: [number, number] = [
    (bounds.south + bounds.north) / 2,
    (bounds.west + bounds.east) / 2,
  ];

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-800 select-none ${className}`}>
      <MapContainer
        center={center}
        zoom={17}
        className="w-full h-full min-h-[400px]"
        style={{ background: "#0b0f17" }}
      >
        <FitBounds bounds={leafletBounds} />
        {/* Always-visible base layer ("sonra") */}
        <ImageOverlay url={afterImage} bounds={leafletBounds} />
        {/* Clipped top layer ("önce") — revealed left of the divider */}
        <ImageOverlay ref={setBeforeRef} url={beforeImage} bounds={leafletBounds} />
        <SwipeCompare beforeLayer={beforeLayer} bounds={leafletBounds} />
      </MapContainer>

      <div className="absolute top-2 left-2 z-[999] px-2 py-1 rounded bg-black/60 text-white text-[10px] font-bold pointer-events-none">
        ÖNCE
      </div>
      <div className="absolute top-2 right-2 z-[999] px-2 py-1 rounded bg-black/60 text-white text-[10px] font-bold pointer-events-none">
        SONRA
      </div>
    </div>
  );
}
