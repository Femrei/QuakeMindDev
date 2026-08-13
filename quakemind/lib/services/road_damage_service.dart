import 'dart:async';

import '../models/road_damage_job_status.dart';
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

  /// Kicks off a road-damage analysis job and returns its analysisId almost
  /// immediately -- the backend runs the actual (CPU-bound, can take
  /// minutes) Segformer inference on a dedicated worker process, so this
  /// call no longer blocks on the full analysis. Poll with
  /// getAnalysisStatus / pollAnalysis using the returned id.
  Future<String> analyzeArea({
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
      // The POST now returns almost instantly (just queues the job) --
      // keeping the old 300s timeout here would mask a genuinely broken
      // endpoint instead of failing fast.
      timeoutSeconds: 20,
    );

    final analysisId = jsonMap['analysisId'] as String?;
    if (analysisId == null || analysisId.isEmpty) {
      throw const RoadDamageBridgeUnavailableException(
        message: 'Sunucu analysisId dondurmedi.',
        instructions: [
          'Backend surumunun guncel oldugundan emin olun.',
        ],
      );
    }
    return analysisId;
  }

  Future<RoadDamageJobStatus> getAnalysisStatus(String analysisId) async {
    final outcome = await _httpClient.getJsonWithStatus(
      endpoint: '/api/road_damage/status/$analysisId',
      timeoutSeconds: 10,
    );
    if (outcome.statusCode == 404) {
      return const RoadDamageJobStatus(status: 'not_found', errorMessage: 'Analiz bulunamadi.');
    }
    if (outcome.json != null && outcome.statusCode != null && outcome.statusCode! >= 200 && outcome.statusCode! < 300) {
      return RoadDamageJobStatus.fromJson(outcome.json!);
    }
    // Transport error or a non-2xx/404 response -- treat as transient so the
    // poll loop keeps retrying instead of failing on one dropped request.
    return const RoadDamageJobStatus(status: 'queued');
  }

  /// Polls getAnalysisStatus until the job reaches a terminal state
  /// (done/error/not_found) or the overall timeout elapses, yielding every
  /// intermediate status along the way so the UI can react.
  Stream<RoadDamageJobStatus> pollAnalysis(
    String analysisId, {
    Duration interval = const Duration(seconds: 3),
    Duration timeout = const Duration(minutes: 15),
  }) async* {
    final startedAt = DateTime.now();
    while (true) {
      final status = await getAnalysisStatus(analysisId);
      yield status;
      if (status.isTerminal) return;
      if (DateTime.now().difference(startedAt) > timeout) {
        yield const RoadDamageJobStatus(status: 'error', errorMessage: 'Analiz zaman asimina ugradi.');
        return;
      }
      await Future.delayed(interval);
    }
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

  /// PostGIS-tabanli, session'suz risk-agirlikli rota (A*/Dijkstra +
  /// damage_points + road_blockages). analyzeArea'nin onceden cagirilmis
  /// olmasini gerektirmez -- mevcut route/analyze akisinin uzerine ucuncu,
  /// risk-farkinda bir alternatif sunar.
  Future<Map<String, dynamic>> fetchSafeRoute({
    required double startLat,
    required double startLon,
    required double destLat,
    required double destLon,
    double radiusKm = 3.0,
  }) async {
    return _httpClient.postJson(
      endpoint: '/api/road_damage/safe_route',
      payload: {
        'startLat': startLat,
        'startLon': startLon,
        'destLat': destLat,
        'destLon': destLon,
        'radiusKm': radiusKm,
      },
      unavailableException: const RoadDamageBridgeUnavailableException(
        message: 'FastAPI sunucusuna baglanilamadi.',
        instructions: [
          'Ayarlardan API adresini (IP:Port) dogru girdiginizden emin olun.',
        ],
      ),
      timeoutSeconds: 30,
    );
  }

  /// Bir konumdan gelen tum bildirim yogunlugunun (Twitter/NLP, kamera,
  /// SOS, uydu hasar noktalari) Gaussian kernel isi haritasi -- leaflet.heat
  /// uyumlu [lat, lon, intensity] uclusu listesi doner (points alani).
  Future<List<List<double>>> fetchDamageHeatmap({
    required double latitude,
    required double longitude,
    double radiusKm = 10.0,
  }) async {
    final json = await _httpClient.getJson(
      endpoint: '/api/road_damage/heatmap'
          '?latitude=$latitude&longitude=$longitude&radiusKm=$radiusKm',
      timeoutSeconds: 20,
    );
    final list = json['points'] as List<dynamic>? ?? const [];
    return list
        .map<List<double>>(
          (point) => (point as List<dynamic>)
              .map((value) => (value as num).toDouble())
              .toList(),
        )
        .toList();
  }
}
