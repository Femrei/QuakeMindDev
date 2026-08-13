"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { MapMarkerItem } from "@/components/map/LeafletContainer";
import type {
  AssemblyRecord,
  DebrisReport,
  RiskFaultLine,
  RiskResponse,
  SOSAlert,
} from "@/lib/api";

export type LayerKey =
  | "sos"
  | "nlp"
  | "risk"
  | "faultLines"
  | "roadDamage"
  | "assemblyAreas"
  | "debris"
  | "team";

export interface NlpIncident {
  id: string;
  marker: MapMarkerItem;
  kategori?: string;
  aciliyet?: number;
  createdAt: string;
}

export interface RoadDamageAnalysisLayer {
  analysisId: string;
  city: string;
  safeRoadSegments: number[][][];
  blockedRoadSegments: number[][][];
  bounds: { west: number; south: number; east: number; north: number };
  createdAt: string;
}

interface RiskLayerState {
  cityResult?: RiskResponse;
  allFaultLines: RiskFaultLine[];
}

interface MapLayersContextType {
  sosAlerts: SOSAlert[];
  setSosAlerts: (alerts: SOSAlert[]) => void;
  sosUpdatedAt: string | null;

  nlpIncidents: NlpIncident[];
  addNlpIncident: (incident: Omit<NlpIncident, "id" | "createdAt">) => void;

  riskLayer: RiskLayerState;
  setRiskResult: (result: RiskResponse) => void;
  setAllFaultLines: (faultLines: RiskFaultLine[]) => void;
  riskUpdatedAt: string | null;
  faultLinesUpdatedAt: string | null;

  roadDamageAnalyses: RoadDamageAnalysisLayer[];
  addRoadDamageAnalysis: (analysis: Omit<RoadDamageAnalysisLayer, "createdAt">) => void;

  assemblyAreas: AssemblyRecord[];
  setAssemblyAreas: (areas: AssemblyRecord[], sourceId?: string) => void;
  assemblyUpdatedAt: string | null;

  debrisReports: DebrisReport[];
  setDebrisReports: (reports: DebrisReport[]) => void;
  debrisUpdatedAt: string | null;

  layerVisibility: Record<LayerKey, boolean>;
  toggleLayer: (key: LayerKey) => void;
}

const DEFAULT_VISIBILITY: Record<LayerKey, boolean> = {
  sos: true,
  nlp: true,
  risk: false,
  faultLines: false,
  roadDamage: false,
  assemblyAreas: false,
  debris: true,
  team: true,
};

const MapLayersContext = createContext<MapLayersContextType | undefined>(undefined);

export function MapLayersProvider({ children }: { children: React.ReactNode }) {
  const [sosAlerts, setSosAlertsState] = useState<SOSAlert[]>([]);
  const [sosUpdatedAt, setSosUpdatedAt] = useState<string | null>(null);

  const [nlpIncidents, setNlpIncidents] = useState<NlpIncident[]>([]);

  const [riskLayer, setRiskLayerState] = useState<RiskLayerState>({ allFaultLines: [] });
  const [riskUpdatedAt, setRiskUpdatedAt] = useState<string | null>(null);
  const [faultLinesUpdatedAt, setFaultLinesUpdatedAt] = useState<string | null>(null);

  const [roadDamageAnalyses, setRoadDamageAnalyses] = useState<RoadDamageAnalysisLayer[]>([]);

  // Coklu sehir/analiz kaynagindan gelen toplanma alanlarinin birbirini
  // silmemesi icin kaynak (analysisId veya "manual") bazinda saklanir, harita
  // icin hepsi birlestirilir -- boylece Kahramanmaras'in verisi Hatay'in
  // verisi gelince kaybolmaz.
  const [assemblyAreasBySource, setAssemblyAreasBySource] = useState<Record<string, AssemblyRecord[]>>({});
  const [assemblyUpdatedAt, setAssemblyUpdatedAt] = useState<string | null>(null);
  const assemblyAreas = useMemo(
    () => Object.values(assemblyAreasBySource).flat(),
    [assemblyAreasBySource]
  );

  const [debrisReports, setDebrisReportsState] = useState<DebrisReport[]>([]);
  const [debrisUpdatedAt, setDebrisUpdatedAt] = useState<string | null>(null);

  const [layerVisibility, setLayerVisibility] = useState<Record<LayerKey, boolean>>(DEFAULT_VISIBILITY);

  const setSosAlerts = useCallback((alerts: SOSAlert[]) => {
    setSosAlertsState(alerts);
    setSosUpdatedAt(new Date().toISOString());
  }, []);

  const addNlpIncident = useCallback((incident: Omit<NlpIncident, "id" | "createdAt">) => {
    setNlpIncidents((prev) => [
      ...prev,
      { ...incident, id: `nlp-${Date.now()}-${prev.length}`, createdAt: new Date().toISOString() },
    ]);
  }, []);

  const setRiskResult = useCallback((result: RiskResponse) => {
    setRiskLayerState((prev) => ({ ...prev, cityResult: result }));
    setRiskUpdatedAt(new Date().toISOString());
  }, []);

  const setAllFaultLines = useCallback((faultLines: RiskFaultLine[]) => {
    setRiskLayerState((prev) => ({ ...prev, allFaultLines: faultLines }));
    setFaultLinesUpdatedAt(new Date().toISOString());
  }, []);

  const addRoadDamageAnalysis = useCallback((analysis: Omit<RoadDamageAnalysisLayer, "createdAt">) => {
    setRoadDamageAnalyses((prev) => [
      ...prev.filter((a) => a.analysisId !== analysis.analysisId),
      { ...analysis, createdAt: new Date().toISOString() },
    ]);
  }, []);

  const setAssemblyAreas = useCallback((areas: AssemblyRecord[], sourceId: string = "manual") => {
    setAssemblyAreasBySource((prev) => ({ ...prev, [sourceId]: areas }));
    setAssemblyUpdatedAt(new Date().toISOString());
  }, []);

  const setDebrisReports = useCallback((reports: DebrisReport[]) => {
    setDebrisReportsState(reports);
    setDebrisUpdatedAt(new Date().toISOString());
  }, []);

  const toggleLayer = useCallback((key: LayerKey) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Bundling every layer's state into one object literal means any single
  // layer updating (e.g. one new SOS alert) would otherwise hand every
  // consumer a new context reference and force an app-wide re-render fan-out,
  // even for consumers that only care about an unrelated layer.
  const value = useMemo<MapLayersContextType>(
    () => ({
      sosAlerts,
      setSosAlerts,
      sosUpdatedAt,
      nlpIncidents,
      addNlpIncident,
      riskLayer,
      setRiskResult,
      setAllFaultLines,
      riskUpdatedAt,
      faultLinesUpdatedAt,
      roadDamageAnalyses,
      addRoadDamageAnalysis,
      assemblyAreas,
      setAssemblyAreas,
      assemblyUpdatedAt,
      debrisReports,
      setDebrisReports,
      debrisUpdatedAt,
      layerVisibility,
      toggleLayer,
    }),
    [
      sosAlerts,
      setSosAlerts,
      sosUpdatedAt,
      nlpIncidents,
      addNlpIncident,
      riskLayer,
      setRiskResult,
      setAllFaultLines,
      riskUpdatedAt,
      faultLinesUpdatedAt,
      roadDamageAnalyses,
      addRoadDamageAnalysis,
      assemblyAreas,
      setAssemblyAreas,
      assemblyUpdatedAt,
      debrisReports,
      setDebrisReports,
      debrisUpdatedAt,
      layerVisibility,
      toggleLayer,
    ]
  );

  return <MapLayersContext.Provider value={value}>{children}</MapLayersContext.Provider>;
}

export function useMapLayers() {
  const context = useContext(MapLayersContext);
  if (!context) {
    throw new Error("useMapLayers must be used within a MapLayersProvider");
  }
  return context;
}
