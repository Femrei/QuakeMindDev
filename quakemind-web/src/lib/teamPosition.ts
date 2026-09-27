import type { TeamClaim } from "./api";

/** Bir ekibin claim+route bilgisinden, zaman-bazli interpolasyonla o anki
 * konumunu turetir -- ayri bir "pozisyon guncelle" backend dongusu yok,
 * her sey routeCoords + startedAt + distanceMeters'tan hesaplanir.
 * Hem /command hem /command/map ayni mantigi kullansin diye paylasilan lib'e
 * tasindi (daha once sadece command/page.tsx icindeydi). */
export function interpolateTeamPosition(claim: TeamClaim): [number, number] | null {
  if (!claim.routeCoords || claim.routeCoords.length < 2 || !claim.startedAt || !claim.distanceMeters) {
    return null;
  }
  const speedKmh = claim.assumedSpeedKmh || 15;
  const totalSeconds = (claim.distanceMeters / 1000 / speedKmh) * 3600;
  const elapsedSeconds = (Date.now() - new Date(claim.startedAt).getTime()) / 1000;
  const fraction = Math.max(0, Math.min(1, totalSeconds > 0 ? elapsedSeconds / totalSeconds : 1));

  const coords = claim.routeCoords;
  // Kumulatif mesafeye gore polyline uzerinde yuru
  let cumulative = 0;
  const segLengths: number[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[i + 1];
    const d = Math.hypot(lat2 - lat1, lon2 - lon1);
    segLengths.push(d);
    cumulative += d;
  }
  const targetDist = cumulative * fraction;
  let walked = 0;
  for (let i = 0; i < segLengths.length; i++) {
    if (walked + segLengths[i] >= targetDist || i === segLengths.length - 1) {
      const segFraction = segLengths[i] > 0 ? (targetDist - walked) / segLengths[i] : 0;
      const [lat1, lon1] = coords[i];
      const [lat2, lon2] = coords[i + 1];
      return [lat1 + (lat2 - lat1) * segFraction, lon1 + (lon2 - lon1) * segFraction];
    }
    walked += segLengths[i];
  }
  return coords[coords.length - 1];
}
