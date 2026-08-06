import 'package:flutter/foundation.dart';

import '../models/risk_module_result.dart';
import '../models/road_damage_result.dart';
import 'assembly_service.dart';
import 'bridge_client.dart';
import 'sos_service.dart';

enum MapLayerKey { sos, roadDamage, assemblyAreas, faultLines }

class RoadDamageMapLayer {
  const RoadDamageMapLayer({
    required this.city,
    required this.safeRoadSegments,
    required this.blockedRoadSegments,
    required this.createdAt,
  });

  final String city;
  final List<List<RoadPoint>> safeRoadSegments;
  final List<List<RoadPoint>> blockedRoadSegments;
  final DateTime createdAt;
}

/// Aggregates every geo-referenced data source (SOS calls, satellite road
/// damage analyses, AFAD assembly points, fault lines) into one shared,
/// app-wide store so a single "toplu harita" screen can show them together
/// for both the responder and survivor shells -- mirroring the web app's
/// unified command map, which mobile previously had no equivalent of (only
/// small, single-purpose map panels scattered across separate feature
/// pages).
class MapLayersController extends ChangeNotifier {
  MapLayersController._();

  static final MapLayersController instance = MapLayersController._();

  static const _sosService = SosService();
  static const _assemblyService = AssemblyService();
  static const _httpClient = BridgeHttpClient(
    configuredBaseUrl: '',
    defaultPort: 8000,
  );

  List<SosAlertSummary> sosAlerts = const [];
  DateTime? sosUpdatedAt;

  List<RoadDamageMapLayer> roadDamageAnalyses = [];

  List<AssemblyPoint> assemblyAreas = const [];
  DateTime? assemblyUpdatedAt;

  List<RiskFaultLine> faultLines = const [];
  DateTime? faultLinesUpdatedAt;

  bool loadingSos = false;
  bool loadingAssembly = false;
  bool loadingFaultLines = false;
  String? lastError;

  final Map<MapLayerKey, bool> layerVisibility = {
    MapLayerKey.sos: true,
    MapLayerKey.roadDamage: true,
    MapLayerKey.assemblyAreas: true,
    MapLayerKey.faultLines: false,
  };

  void toggleLayer(MapLayerKey key) {
    layerVisibility[key] = !(layerVisibility[key] ?? true);
    notifyListeners();
  }

  void addRoadDamageAnalysis(RoadDamageResult result) {
    roadDamageAnalyses = [
      ...roadDamageAnalyses,
      RoadDamageMapLayer(
        city: result.city,
        safeRoadSegments: result.safeRoadSegments,
        blockedRoadSegments: result.blockedRoadSegments,
        createdAt: DateTime.now(),
      ),
    ];
    notifyListeners();
  }

  Future<void> refreshSos() async {
    loadingSos = true;
    notifyListeners();
    try {
      sosAlerts = await _sosService.fetchAlerts();
      sosUpdatedAt = DateTime.now();
    } catch (e) {
      lastError = 'SOS cagrilari alinamadi: $e';
    } finally {
      loadingSos = false;
      notifyListeners();
    }
  }

  Future<void> refreshAssembly({
    required double latitude,
    required double longitude,
    double radiusKm = 25,
  }) async {
    loadingAssembly = true;
    notifyListeners();
    try {
      final result = await _assemblyService.nearestAssembly(
        latitude: latitude,
        longitude: longitude,
        radiusKm: radiusKm,
      );
      assemblyAreas = result.records;
      assemblyUpdatedAt = DateTime.now();
    } catch (e) {
      lastError = 'Toplanma alanlari alinamadi: $e';
    } finally {
      loadingAssembly = false;
      notifyListeners();
    }
  }

  /// Fault lines are a static national dataset (`turkey_faults.geojson`
  /// served by the backend), so once loaded for a session there is no need
  /// to re-fetch on every map refresh.
  Future<void> refreshFaultLines() async {
    if (faultLines.isNotEmpty) return;
    loadingFaultLines = true;
    notifyListeners();
    try {
      final json = await _httpClient.getJson(
        endpoint: '/api/risk/fault_lines',
        timeoutSeconds: 15,
      );
      final list = json['faultLines'] as List<dynamic>? ?? const [];
      faultLines = list
          .map(
            (item) =>
                RiskFaultLine.fromJson((item as Map).cast<String, dynamic>()),
          )
          .toList();
      faultLinesUpdatedAt = DateTime.now();
    } catch (e) {
      lastError = 'Fay hatti verisi alinamadi: $e';
    } finally {
      loadingFaultLines = false;
      notifyListeners();
    }
  }
}
