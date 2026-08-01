"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

interface DrawControlProps {
  onBoundsSelected?: (bbox: [number, number, number, number]) => void;
  onCleared?: () => void;
}

export default function DrawControl({ onBoundsSelected, onCleared }: DrawControlProps) {
  const map = useMap();

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: "topleft",
      draw: {
        polyline: false,
        marker: false,
        circle: false,
        circlemarker: false,
        polygon: { allowIntersection: false, showArea: false } as L.DrawOptions.PolygonOptions,
        rectangle: {} as L.DrawOptions.RectangleOptions,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    const handleCreated = (e: L.DrawEvents.Created) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      const bounds = (e.layer as L.Rectangle | L.Polygon).getBounds();
      onBoundsSelected?.([
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]);
    };
    const handleDeleted = () => onCleared?.();

    map.on(L.Draw.Event.CREATED, handleCreated as L.LeafletEventHandlerFn);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated as L.LeafletEventHandlerFn);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onBoundsSelected, onCleared]);

  return null;
}
