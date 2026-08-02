"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Pane, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
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
        <ChangeView center={center} zoom={zoom} />
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
          let customIcon = blueIcon;
          if (marker.type === "sos") customIcon = redIcon;
          if (marker.type === "shelter") customIcon = greenIcon;

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
                </Popup>
              </CircleMarker>
            );
          }

          return (
            <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={customIcon}>
              <Popup>
                <div className="text-sm font-bold text-slate-900">{marker.title}</div>
                {marker.popupText && <div className="text-xs text-slate-700 mt-1">{marker.popupText}</div>}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
