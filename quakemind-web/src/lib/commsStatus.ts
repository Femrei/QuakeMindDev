export type CommsStatus = "online" | "mesh" | "offline";

/** Akış diyagramlarındaki "haberleşme durumu" (mesh/BLE fallback) için
 * kısa Türkçe etiket -- harita popup'ları ve liste görünümleri arasında
 * tekrarlanmasın diye tek yerde tutulur. */
export const COMMS_LABEL: Record<CommsStatus, string> = {
  online: "Şebeke",
  mesh: "BLE Mesh",
  offline: "Çevrimdışı",
};

/** Akış diyagramlarındaki 3 seviyeli iletim fallback zinciri -- popup ve
 * kenar çubuğunda hangi seviyenin kullanıldığı açıkça yazılsın diye. */
export const COMMS_FALLBACK_LABEL: Record<CommsStatus, string> = {
  online: "HTTPS/REST API (tam veri)",
  mesh: "P2P BLE Mesh (hafif JSON)",
  offline: "Lokal SQLite kuyruğu (izole)",
};

export type IncidentChannel = "yolo" | "nlp" | "sos";

/** İhbarın hangi veri üretim kanalından geldiği. Harita pin standardını da
 * bu belirler: yolo=turuncu üçgen, nlp=sarı, sos=kırmızı (siren varsa flaşör). */
export const CHANNEL_LABEL: Record<IncidentChannel, string> = {
  yolo: "YOLOv8 Görüntü",
  nlp: "NLP Metin",
  sos: "Acil SOS",
};
