export type CommsStatus = "online" | "mesh" | "offline";

/** Akış diyagramlarındaki "haberleşme durumu" (mesh/BLE fallback) için
 * kısa Türkçe etiket -- harita popup'ları ve liste görünümleri arasında
 * tekrarlanmasın diye tek yerde tutulur. */
export const COMMS_LABEL: Record<CommsStatus, string> = {
  online: "Şebeke",
  mesh: "BLE Mesh",
  offline: "Çevrimdışı",
};
