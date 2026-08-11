"""Gaussian kernel yoğunluk ısı haritası (rapor 2.4.3).

scipy'ye yeni bağımlılık eklememek için Gauss çekirdeği numpy ile elle
hesaplanır. Çıktı formatı bilinçli olarak leaflet.heat'in beklediği
[lat, lon, intensity] üçlüsü -- hem web hem mobil aynı formatı tüketebilir.
"""
import numpy as np

from apps.road_damage.utils.assembly import haversine_m

# Grid hücreleri altında bu yoğunluğa (normalize, 0-1) düşen noktalar cevaptan
# atılır -- boş/önemsiz alanlarla payload'u şişirmemek için.
_INTENSITY_CUTOFF = 0.02


def _haversine_km_grid(lat_grid, lon_grid, lat2, lon2):
    """haversine_m'in numpy grid üzerinde vektörize hali (km cinsinden)."""
    r_km = 6371.0
    phi1 = np.radians(lat_grid)
    phi2 = np.radians(lat2)
    d_phi = np.radians(lat2 - lat_grid)
    d_lambda = np.radians(lon2 - lon_grid)
    a = np.sin(d_phi / 2) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(d_lambda / 2) ** 2
    return r_km * 2 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))


def build_gaussian_heatmap(points, bbox, grid_size=100, bandwidth_km=0.5):
    """points: [(lat, lon, weight), ...], bbox: (west, south, east, north).

    Her grid hücresi için tüm noktaların Gauss çekirdeği katkısı toplanır,
    sonra en yüksek değere göre 0..1 normalize edilir.
    """
    if not points:
        return []

    west, south, east, north = bbox
    if not (west < east and south < north):
        return []

    lats = np.linspace(south, north, grid_size)
    lons = np.linspace(west, east, grid_size)
    lon_grid, lat_grid = np.meshgrid(lons, lats)

    intensity = np.zeros_like(lat_grid, dtype=float)
    two_sigma_sq = 2.0 * (bandwidth_km ** 2)
    for lat, lon, weight in points:
        dist_km = _haversine_km_grid(lat_grid, lon_grid, lat, lon)
        intensity += float(weight) * np.exp(-(dist_km ** 2) / two_sigma_sq)

    max_val = float(intensity.max())
    if max_val <= 0:
        return []
    normalized = intensity / max_val

    mask = normalized >= _INTENSITY_CUTOFF
    result = [
        [round(float(lat), 6), round(float(lon), 6), round(float(val), 4)]
        for lat, lon, val in zip(lat_grid[mask], lon_grid[mask], normalized[mask])
    ]
    return result


__all__ = ["build_gaussian_heatmap", "haversine_m"]
