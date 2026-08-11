import osmnx as ox
import networkx as nx
from shapely.geometry import LineString
import math

# Without an explicit cap, osmnx falls back to its own default Overpass
# timeout/retry policy, which can wait far longer than the mobile client's
# fixed 300s HTTP timeout for /api/road_damage/analyze -- the backend
# eventually finishes and logs success, but the request already timed out
# on the phone. Cache responses so repeated analyses of the same area don't
# re-hit Overpass at all.
ox.settings.use_cache = True
ox.settings.requests_timeout = 30

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000 # radius of earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def calculate_route(G, start_lat, start_lon, end_lat, end_lon, weight='length'):
    """weight='length' (default) preserves the plain shortest-path behavior
    used by /api/road_damage/route. Pass weight='risk_cost' (after running
    apply_risk_penalties on G) to get a risk-aware route instead.
    """
    start_node = ox.distance.nearest_nodes(G, X=start_lon, Y=start_lat)
    end_node = ox.distance.nearest_nodes(G, X=end_lon, Y=end_lat)

    def astar_heuristic(u, v):
        u_node = G.nodes[u]
        v_node = G.nodes[v]
        return haversine(u_node['y'], u_node['x'], v_node['y'], v_node['x'])

    try:
        path_dijkstra = nx.shortest_path(G, start_node, end_node, weight=weight)
    except nx.NetworkXNoPath:
        path_dijkstra = None

    try:
        path_astar = nx.astar_path(G, start_node, end_node, heuristic=astar_heuristic, weight=weight)
    except nx.NetworkXNoPath:
        path_astar = None

    def get_route_line(path):
        if not path:
            return None
        route_coords = []
        for i in range(len(path) - 1):
            u = path[i]
            v = path[i+1]
            edge_data = min(G[u][v].values(), key=lambda d: d.get('length', float('inf')))
            if 'geometry' in edge_data:
                route_coords.extend([(lat, lon) for lon, lat in edge_data['geometry'].coords])
            else:
                route_coords.extend([(G.nodes[u]['y'], G.nodes[u]['x']), (G.nodes[v]['y'], G.nodes[v]['x'])])
        return route_coords

    def get_route_cost(path):
        if not path:
            return None
        total = 0.0
        for i in range(len(path) - 1):
            u = path[i]
            v = path[i + 1]
            edge_data = min(G[u][v].values(), key=lambda d: d.get(weight, float('inf')))
            total += edge_data.get(weight, 0.0)
        return total

    return (
        get_route_line(path_dijkstra),
        get_route_line(path_astar),
        get_route_cost(path_dijkstra),
        get_route_cost(path_astar),
    )


def risk_weight(min_dist_m):
    """Basamaklı ceza kademesi: bir kenarın en yakın hasar/tehlike noktasına
    uzaklığına göre 'length' üzerine uygulanacak çarpan."""
    if min_dist_m < 50:
        return 3.0
    if min_dist_m < 150:
        return 1.5
    if min_dist_m < 400:
        return 1.1
    return 1.0


def _edge_midpoint(G, u, v, data):
    if 'geometry' in data:
        coords = list(data['geometry'].coords)
        mid_lon, mid_lat = coords[len(coords) // 2]
        return mid_lat, mid_lon
    u_node = G.nodes[u]
    v_node = G.nodes[v]
    return (u_node['y'] + v_node['y']) / 2.0, (u_node['x'] + v_node['x']) / 2.0


def _as_latlon_list(items):
    """Normalizes damage_points/blockages (dicts with lat/lon, [lat, lon]
    pairs, or [[lat, lon], ...] polylines) into a flat list of (lat, lon)."""
    points = []
    for item in items or []:
        if isinstance(item, dict):
            lat, lon = item.get('lat'), item.get('lon')
            if lat is not None and lon is not None:
                points.append((float(lat), float(lon)))
        elif isinstance(item, (list, tuple)) and len(item) == 2 and isinstance(item[0], (int, float)):
            points.append((float(item[0]), float(item[1])))
        elif isinstance(item, (list, tuple)) and item:
            # A blockage polyline ([[lat, lon], ...]) -- use its midpoint.
            mid = item[len(item) // 2]
            points.append((float(mid[0]), float(mid[1])))
    return points


def apply_risk_penalties(G, damage_points, blockages=None, blockage_hard_radius_m=25.0):
    """Kapalı yol maskeleri + yıkım yoğunluğu + tehlikeli noktaları tek bir
    ceza-katsayılı grafta birleştirir (mutates G in place, returns G).

    - `blockages` içindeki her noktaya `blockage_hard_radius_m` metre içinde
      kalan kenarlar tamamen kaldırılır (hard-block).
    - Kalan her kenara `risk_cost = length * risk_weight(min_dist_to_damage_point)`
      atanır.
    """
    damage_coords = _as_latlon_list(damage_points)
    blockage_coords = _as_latlon_list(blockages)

    edges_to_remove = []
    for u, v, key, data in G.edges(keys=True, data=True):
        mid_lat, mid_lon = _edge_midpoint(G, u, v, data)

        if blockage_coords and any(
            haversine(mid_lat, mid_lon, blat, blon) <= blockage_hard_radius_m
            for blat, blon in blockage_coords
        ):
            edges_to_remove.append((u, v, key))
            continue

        min_dist = min(
            (haversine(mid_lat, mid_lon, dlat, dlon) for dlat, dlon in damage_coords),
            default=float('inf'),
        )
        length = data.get('length', 0.0)
        data['risk_cost'] = length * risk_weight(min_dist)

    for u, v, key in edges_to_remove:
        if G.has_edge(u, v, key):
            G.remove_edge(u, v, key)

    return G

def analyze_road_network_graph(bounds, w, h, blockage_mask, network_type='drive'):
    """Fetches OSM graph, evaluates blockages, and returns safe/blocked lists."""
    west, south, east, north = bounds
    try:
        # 'drive' varsayılanı araç lojistiği için; yaya tahliye rotası 'walk' geçer
        G = ox.graph_from_bbox(bbox=bounds, network_type=network_type, simplify=True)
    except Exception as e:
        print("OSMnx error:", e)
        return None, None, None, None

    blocked_edges = []
    safe_edges = []
    edges_to_remove = []
    
    for u, v, key, data in G.edges(keys=True, data=True):
        if 'geometry' in data:
            line = data['geometry']
        else:
            u_node = G.nodes[u]
            v_node = G.nodes[v]
            line = LineString([(u_node['x'], u_node['y']), (v_node['x'], v_node['y'])])
            
        length = line.length
        # Örnekleme sıklığını ~5 metreye düşürüyoruz (eskiden ~2 metreydi)
        num_samples = max(int(length / 0.00005), 3)
        
        current_type = None
        current_segment = []
        has_blocked_part = False
        
        for i in range(num_samples):
            pt = line.interpolate(float(i) / (num_samples - 1), normalized=True)
            px = int((pt.x - west) / (east - west) * w)
            py = int((north - pt.y) / (north - south) * h)
            
            is_blocked = False
            if 0 <= px < w and 0 <= py < h:
                if blockage_mask[py, px] > 0:
                    is_blocked = True
                    has_blocked_part = True
                    
            if current_type is None:
                current_type = is_blocked
                current_segment.append((pt.x, pt.y))
            elif current_type == is_blocked:
                current_segment.append((pt.x, pt.y))
            else:
                current_segment.append((pt.x, pt.y)) # connect lines
                if len(current_segment) > 1:
                    if current_type:
                        blocked_edges.append((u, v, key, LineString(current_segment)))
                    else:
                        safe_edges.append((u, v, key, LineString(current_segment)))
                
                current_type = is_blocked
                current_segment = [(pt.x, pt.y)]

        if len(current_segment) > 1:
            if current_type:
                blocked_edges.append((u, v, key, LineString(current_segment)))
            else:
                safe_edges.append((u, v, key, LineString(current_segment)))
                
        if has_blocked_part:
            edges_to_remove.append((u, v, key))

    safe_G = G.copy()
    safe_G.remove_edges_from(edges_to_remove)
                
    return G, safe_G, safe_edges, blocked_edges
