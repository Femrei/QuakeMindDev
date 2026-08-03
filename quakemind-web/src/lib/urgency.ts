export type UrgencyTier = "CRITICAL" | "HIGH" | "NORMAL" | "UNKNOWN";

const CRITICAL_HINTS = ["KRİTİK", "ENKAZ", "CRITICAL"];
const HIGH_HINTS = ["YARALI", "ACİL", "HIGH"];
const NORMAL_HINTS = ["NORMAL", "İHTİYAÇ", "MEDIUM", "GÜVENLİ"];

/**
 * Real SOS alerts from the backend never carry a structured `urgency` field
 * (the backend only stores `message`), so the actual signal lives inside the
 * free-text message (e.g. "[ACİLİYET: CRITICAL]"). This derives a display
 * tier from whichever is available instead of defaulting every alert to a
 * hardcoded "KRİTİK" label.
 */
export function deriveUrgencyTier(alert: { urgency?: string | null; message?: string | null }): UrgencyTier {
  const raw = (alert.urgency || "").toUpperCase();
  if (raw === "CRITICAL") return "CRITICAL";
  if (raw === "HIGH") return "HIGH";
  if (raw === "MEDIUM" || raw === "NORMAL" || raw === "LOW") return "NORMAL";

  const message = (alert.message || "").toUpperCase();
  if (CRITICAL_HINTS.some((hint) => message.includes(hint))) return "CRITICAL";
  if (HIGH_HINTS.some((hint) => message.includes(hint))) return "HIGH";
  if (NORMAL_HINTS.some((hint) => message.includes(hint))) return "NORMAL";
  return "UNKNOWN";
}

export function urgencyLabel(tier: UrgencyTier): string {
  switch (tier) {
    case "CRITICAL": return "KRİTİK";
    case "HIGH": return "YÜKSEK";
    case "NORMAL": return "NORMAL";
    default: return "BİLİNMİYOR";
  }
}

export function urgencyBadgeClass(tier: UrgencyTier): string {
  switch (tier) {
    case "CRITICAL": return "bg-red-500/20 text-red-400";
    case "HIGH": return "bg-orange-500/20 text-orange-400";
    case "NORMAL": return "bg-emerald-500/20 text-emerald-400";
    default: return "bg-slate-500/20 text-slate-400";
  }
}

export function urgencyTextClass(tier: UrgencyTier): string {
  switch (tier) {
    case "CRITICAL": return "text-red-400";
    case "HIGH": return "text-orange-400";
    case "NORMAL": return "text-emerald-400";
    default: return "text-slate-400";
  }
}
