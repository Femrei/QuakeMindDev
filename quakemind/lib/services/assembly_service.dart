import 'bridge_client.dart';

class AssemblyBridgeUnavailableException extends BridgeUnavailableException {
  const AssemblyBridgeUnavailableException({
    required super.message,
    required super.instructions,
    super.bridgeBaseUrl,
    super.lastError,
  });
}

class AssemblyPoint {
  const AssemblyPoint({
    required this.name,
    required this.latitude,
    required this.longitude,
    this.category,
    this.capacity,
    this.status,
    this.distanceMeters,
  });

  factory AssemblyPoint.fromJson(Map<String, dynamic> json) {
    final lat = (json['lat'] as num?) ?? (json['display_lat'] as num?);
    final lon = (json['lon'] as num?) ?? (json['display_lon'] as num?);
    return AssemblyPoint(
      name: (json['toplanma_alani'] ?? json['name'] ?? 'Toplanma Alani')
          .toString(),
      latitude: lat?.toDouble() ?? 0,
      longitude: lon?.toDouble() ?? 0,
      category: json['category']?.toString(),
      capacity: json['capacity']?.toString(),
      status: json['status']?.toString(),
      distanceMeters: (json['dist_m'] as num?)?.toDouble(),
    );
  }

  final String name;
  final double latitude;
  final double longitude;
  final String? category;
  final String? capacity;
  final String? status;
  final double? distanceMeters;
}

class AssemblyRouteResult {
  const AssemblyRouteResult({
    required this.nearest,
    required this.records,
    required this.routeCoords,
    required this.routeLengthM,
  });

  factory AssemblyRouteResult.fromJson(Map<String, dynamic> json) {
    final recordsJson = json['records'] as List<dynamic>? ?? const [];
    final nearestJson = json['nearest'] as Map<String, dynamic>?;
    final routeJson = json['routeCoords'] as List<dynamic>? ?? const [];

    return AssemblyRouteResult(
      nearest: nearestJson != null ? AssemblyPoint.fromJson(nearestJson) : null,
      records: recordsJson
          .map((item) => AssemblyPoint.fromJson(item as Map<String, dynamic>))
          .toList(),
      routeCoords: routeJson
          .map((point) {
            final p = point as List<dynamic>;
            return [
              (p[0] as num).toDouble(),
              (p[1] as num).toDouble(),
            ];
          })
          .toList(),
      routeLengthM: (json['routeLengthM'] as num?)?.toDouble() ??
          (json['nearestAirM'] as num?)?.toDouble(),
    );
  }

  final AssemblyPoint? nearest;
  final List<AssemblyPoint> records;
  final List<List<double>> routeCoords;
  final double? routeLengthM;
}

/// Talks to the backend's already-existing AFAD/OSM assembly-point + route
/// endpoints (`/api/road_damage/assembly`) so the mobile survivor screen can
/// show the nearest safe gathering point and a walking route to it, the same
/// way the web survivor portal already does.
class AssemblyService {
  const AssemblyService();

  static const _httpClient = BridgeHttpClient(
    configuredBaseUrl: '',
    defaultPort: 8000,
  );

  Future<AssemblyRouteResult> nearestAssembly({
    required double latitude,
    required double longitude,
    double radiusKm = 15,
  }) async {
    final json = await _httpClient.getJson(
      endpoint: '/api/road_damage/assembly'
          '?latitude=$latitude&longitude=$longitude&radiusKm=$radiusKm',
      timeoutSeconds: 20,
    );
    if (json.isEmpty) {
      throw const AssemblyBridgeUnavailableException(
        message: 'Toplanma alani servisine ulasilamadi.',
        instructions: [
          'Ayarlardan API adresini (IP:Port) dogru girdiginizden emin olun.',
        ],
      );
    }
    return AssemblyRouteResult.fromJson(json);
  }
}
