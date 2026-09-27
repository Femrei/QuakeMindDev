// Tarayici konum izni reddedilse/zaman asimina ugrasa bile cagiran akisi
// bloklamamasi icin null'a dusen, best-effort bir tek-seferlik konum okuma.
export function getCurrentCoords(timeoutMs: number = 5000): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: timeoutMs, enableHighAccuracy: true }
    );
  });
}
