"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Pane, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import DrawControl from "./DrawControl";

// Fix Leaflet Default Icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Bir ekip zaten yola cikmis (aktif claim) bir SOS ihbarini gostermek icin --
// digerlerinden (kirmizi=bekliyor, yesil=tamamlandi) ayirt edilsin diye.
const amberIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type?: "sos" | "shelter" | "quake" | "damage" | "team" | "team-start" | "debris" | "nlp";
  popupText?: string;
  magnitude?: number;
  /** "team" marker only: renders a different color/icon per role. */
  teamRole?: "arama-kurtarma" | "lojistik-ilk-yardim";
  /** "sos" marker only: bir ekip atanmis mi -- kirmizi (bekliyor) / turuncu
   * (ekip yolda) / yesil (tamamlandi) ayrimi icin. */
  claimStatus?: "unclaimed" | "active" | "completed";
  /** Optional deep-link shown in the popup, e.g. "Detaya git" back to the module that produced this marker. */
  linkHref?: string;
  linkLabel?: string;
}

function teamDivIcon(role?: string) {
  const color = role === "lojistik-ilk-yardim" ? "#3b82f6" : "#f59e0b";
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px ${color};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

// Ekibin yola CIKTIGI nokta (itfaiye/hastane vb.) -- hareketli daire ikondan
// (teamDivIcon, o anki konum) bilincli olarak ayirt edilsin diye sabit bir
// bayrak sekli; ekip harekete gectikten sonra bile haritada kalir.
function teamStartDivIcon(role?: string) {
  const color = role === "lojistik-ilk-yardim" ? "#3b82f6" : "#f59e0b";
  return L.divIcon({
    className: "",
    html: `<div style="width:0;height:0;border-left:2px solid ${color};position:relative;"><div style="position:absolute;left:2px;top:-1px;width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:9px solid ${color};filter:drop-shadow(0 0 3px ${color});"></div><div style="position:absolute;left:0;top:9px;width:6px;height:3px;background:#0b0f17;border-radius:1px;"></div></div>`,
    iconSize: [11, 14],
    iconAnchor: [1, 13],
  });
}

// Kamera modelleri (catlak/bina) uzerinden tespit edilip haritaya "enkaz"
// olarak isaretlenen noktalar icin -- SOS/ekip pinlerinden ayirt edilsin diye
// ucgen uyari isareti.
const debrisIcon = L.divIcon({
  className: "",
  html: `<div style="width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-bottom:16px solid #fb923c;filter:drop-shadow(0 0 4px rgba(251,146,60,0.9));"></div>`,
  iconSize: [18, 16],
  iconAnchor: [9, 14],
});

// NLP'nin serbest metinden CIKARDIGI konum -- afetzedenin kendi GPS'inden
// gelen SOS pin'inden (kirmizi) bilincli olarak ayirt edilsin diye baklava
// (elmas) seklinde mor bir isaret. Ikisi ayni afetzedeye ait olsa bile farkli
// kaynaklardan gelir (biri cihaz GPS'i, digeri metin analizi tahmini).
const nlpIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#a855f7;border:2px solid #fff;transform:rotate(45deg);box-shadow:0 0 8px rgba(168,85,247,0.9);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export interface MapPolylineItem {
  id: string;
  coords: [number, number][];
  color: string;
  weight?: number;
  opacity?: number;
  label?: string;
  /** Draws a dark outline underneath so the line stands out against any tile background. */
  casing?: boolean;
}

interface LeafletContainerProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarkerItem[];
  polylines?: MapPolylineItem[];
  className?: string;
  satelliteTileUrl?: string;
  satelliteAttribution?: string;
  onMapClick?: (lat: number, lng: number) => void;
  enableDraw?: boolean;
  onBoundsSelected?: (bbox: [number, number, number, number]) => void;
  onDrawCleared?: () => void;
  /** Verilince center/zoom yerine bu noktalarin hepsini gorecek sekilde
   * otomatik zum yapar -- sabit bir bolgeye (orn. Antakya) kilitlenmek
   * yerine, aktif olay verisi nerede olursa olsun dogru odaklanmak icin. */
  fitBoundsPoints?: [number, number][];
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function FitBoundsHandler({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(points, { padding: [60, 60], maxZoom: 16 });
    // Sadece nokta SAYISI ve kaba konumu degistiginde yeniden sigdir --
    // yoksa ekip pozisyonu her interpolasyon tick'inde (2.5sn) mikro
    // hareket ettikce harita da surekli zum/pan sicrar, kullaniciyi rahatsiz eder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length, Math.round(points[0]?.[0] * 20), Math.round(points[0]?.[1] * 20), map]);
  return null;
}

function ClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletContainer({
  center,
  zoom = 13,
  markers = [],
  polylines = [],
  className = "w-full h-full min-h-[400px]",
  satelliteTileUrl,
  satelliteAttribution,
  onMapClick,
  enableDraw = false,
  onBoundsSelected,
  onDrawCleared,
  fitBoundsPoints,
}: LeafletContainerProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-800 ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[400px]"
        style={{ background: "#0b0f17" }}
      >
        {fitBoundsPoints && fitBoundsPoints.length > 0 ? (
          <FitBoundsHandler points={fitBoundsPoints} />
        ) : (
          <ChangeView center={center} zoom={zoom} />
        )}
        <ClickHandler onClick={onMapClick} />
        {enableDraw && <DrawControl onBoundsSelected={onBoundsSelected} onCleared={onDrawCleared} />}

        {satelliteTileUrl ? (
          <>
            <TileLayer
              key={satelliteTileUrl}
              attribution={satelliteAttribution ? `&copy; ${satelliteAttribution}` : undefined}
              url={satelliteTileUrl}
            />
            {/* Transparent reference overlay so street lines + place labels stay
                identifiable on top of raw satellite imagery (hybrid view, matching
                the Streamlit tool). CartoDB's "only_labels" style provides text only,
                so road linework comes from Esri's public transportation reference
                layer instead; both sit in their own pane above the base tile but
                below markers/routes. */}
            <Pane name="labels-pane" style={{ zIndex: 350 }}>
              <TileLayer
                attribution="Yollar: Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
              />
              <TileLayer
                attribution='Etiketler: &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              />
            </Pane>
          </>
        ) : (
          /* Dark Matter CartoDB Base Layer */
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        )}

        {/* Polylines (Roads, Routes, Fault Lines) */}
        {polylines.map((poly) => (
          <React.Fragment key={poly.id}>
            {poly.casing && (
              <>
                {/* Dark outline for contrast against any tile */}
                <Polyline
                  positions={poly.coords}
                  pathOptions={{
                    color: "#0b0f17",
                    weight: (poly.weight || 4) + 8,
                    opacity: 0.85,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
                {/* Bright base stroke under the animated dashes */}
                <Polyline
                  positions={poly.coords}
                  pathOptions={{
                    color: "#ffffff",
                    weight: (poly.weight || 4) + 3,
                    opacity: 0.9,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              </>
            )}
            <Polyline
              positions={poly.coords}
              pathOptions={{
                color: poly.color || "#3b82f6",
                weight: poly.weight || 4,
                opacity: poly.opacity || 0.85,
                lineCap: "round",
                lineJoin: "round",
                className: poly.casing ? "qm-route-line" : undefined,
              }}
            />
          </React.Fragment>
        ))}

        {/* Markers */}
        {markers.map((marker) => {
          let customIcon: L.Icon | L.DivIcon = blueIcon;
          if (marker.type === "sos") {
            if (marker.claimStatus === "active") customIcon = amberIcon;
            else if (marker.claimStatus === "completed") customIcon = greenIcon;
            else customIcon = redIcon;
          }
          if (marker.type === "shelter") customIcon = greenIcon;
          if (marker.type === "team") customIcon = teamDivIcon(marker.teamRole);
          if (marker.type === "team-start") customIcon = teamStartDivIcon(marker.teamRole);
          if (marker.type === "debris") customIcon = debrisIcon;
          if (marker.type === "nlp") customIcon = nlpIcon;

          if (marker.type === "quake") {
            const mag = marker.magnitude || 3.0;
            let circleColor = "#10b981"; // green
            if (mag >= 4.0) circleColor = "#f59e0b"; // orange
            if (mag >= 5.0) circleColor = "#ef4444"; // red
            if (mag >= 6.0) circleColor = "#881337"; // dark red

            return (
              <CircleMarker
                key={marker.id}
                center={[marker.lat, marker.lng]}
                radius={Math.max(4, mag * 2.5)}
                pathOptions={{
                  color: circleColor,
                  fillColor: circleColor,
                  fillOpacity: 0.75,
                }}
              >
                <Popup>
                  <div className="text-sm font-semibold">{marker.title}</div>
                  <div className="text-xs text-slate-300">{marker.popupText || `Büyüklük: ${mag}`}</div>
                  {marker.linkHref && (
                    <Link href={marker.linkHref} className="text-xs text-blue-600 font-semibold underline block mt-1">
                      {marker.linkLabel || "Detaya git"}
                    </Link>
                  )}
                </Popup>
              </CircleMarker>
            );
          }

          return (
            <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={customIcon}>
              <Popup>
                <div className="text-sm font-bold text-slate-900">{marker.title}</div>
                {marker.popupText && <div className="text-xs text-slate-700 mt-1">{marker.popupText}</div>}
                {marker.linkHref && (
                  <Link href={marker.linkHref} className="text-xs text-blue-600 font-semibold underline block mt-1">
                    {marker.linkLabel || "Detaya git"}
                  </Link>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
