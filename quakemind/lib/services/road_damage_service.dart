import '../models/road_damage_result.dart';
import 'bridge_client.dart';

class RoadDamageBridgeUnavailableException extends BridgeUnavailableException {
  const RoadDamageBridgeUnavailableException({
    required super.message,
    required super.instructions,
    super.bridgeBaseUrl,
    super.lastError,
  });
}

class RoadDamageService {
  const RoadDamageService();

  static const _httpClient = BridgeHttpClient(
    configuredBaseUrl: '',
    defaultPort: 8000,
  );

  Future<RoadDamageResult> analyzeArea({
    required String city,
    required double latitude,
    required double longitude,
    String source = 'google',
    String? oamPreferredTitle,
    String? waybackId,
    String? oamTileUrl,
    double damageBooster = 3.5,
    double threshold = 0.40,
    bool useImagenetNorm = true,
    int postProcessLevel = 2,
    double radiusKm = 2.5,
  }) async {
    final jsonMap = await _httpClient.postJson(
      endpoint: '/api/road_damage/analyze',
      payload: {
        'city': city,
        'latitude': latitude,
        'longitude': longitude,
        'source': source,
        if (oamPreferredTitle != null && oamPreferredTitle.trim().isNotEmpty)
          'oamPreferredTitle': oamPreferredTitle.trim(),
        if (waybackId != null && waybackId.trim().isNotEmpty)
          'waybackId': waybackId.trim(),
        if (oamTileUrl != null && oamTileUrl.trim().isNotEmpty)
          'oamTileUrl': oamTileUrl.trim(),
        'damageBooster': damageBooster,
        'threshold': threshold,
        'useImagenetNorm': useImagenetNorm,
        'postProcessLevel': postProcessLevel,
        'radiusKm': radiusKm,
      },
      unavailableException: const RoadDamageBridgeUnavailableException(
        message: 'FastAPI sunucusuna baglanilamadi.',
        instructions: [
          'Ayarlardan API adresini (IP:Port) dogru girdiginizden emin olun.',
        ],
      ),
      timeoutSeconds: 300,
    );

    return RoadDamageResult.fromJson(jsonMap);
  }

  /// Historical Esri Wayback capture list, newest first, so the user can pick
  /// a specific imagery date instead of always getting the latest capture.
  Future<List<Map<String, dynamic>>> fetchWaybackVersions() async {
    final json = await _httpClient.getJson(
      endpoint: '/api/road_damage/wayback_versions',
      timeoutSeconds: 15,
    );
    final list = json['versions'] as List<dynamic>? ?? const [];
    return list.cast<Map<String, dynamic>>();
  }

  /// Event-specific OpenAerialMap captures near a coordinate, so the user can
  /// pick the exact post-disaster image instead of an arbitrary default.
  Future<List<Map<String, dynamic>>> searchOamImages({
    required double latitude,
    required double longitude,
    double radiusKm = 5,
  }) async {
    final json = await _httpClient.getJson(
      endpoint: '/api/road_damage/oam_search'
          '?latitude=$latitude&longitude=$longitude&radiusKm=$radiusKm',
      timeoutSeconds: 20,
    );
    final list = json['images'] as List<dynamic>? ?? const [];
    return list.cast<Map<String, dynamic>>();
  }
}
