import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../services/map_layers_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/app_widgets.dart';

/// Shared "toplu harita" (bulk/unified map) screen used by both the
/// responder and survivor shells: overlays SOS calls, satellite road-damage
/// results, AFAD assembly points and fault lines on one map with per-layer
/// toggles, mirroring the web app's command map. Mobile previously had only
/// small, single-purpose map panels scattered across separate feature pages
/// (one SOS pin, one route, one analysis) with no combined view.
class UnifiedMapScreen extends StatefulWidget {
  const UnifiedMapScreen({super.key, required this.isResponder});

  final bool isResponder;

  @override
  State<UnifiedMapScreen> createState() => _UnifiedMapScreenState();
}

class _UnifiedMapScreenState extends State<UnifiedMapScreen> {
  final _controller = MapLayersController.instance;
  Position? _position;
  String? _locationError;
  bool _locating = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onControllerChanged);
    _bootstrap();
  }

  @override
  void dispose() {
    _controller.removeListener(_onControllerChanged);
    super.dispose();
  }

  void _onControllerChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _bootstrap() async {
    await _resolveLocation();
    unawaited(_controller.refreshSos());
    unawaited(_controller.refreshFaultLines());
    if (_position != null) {
      unawaited(
        _controller.refreshAssembly(
          latitude: _position!.latitude,
          longitude: _position!.longitude,
        ),
      );
    }
  }

  Future<void> _resolveLocation() async {
    setState(() => _locating = true);
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _locationError = 'Konum servisi kapali.';
          _locating = false;
        });
        return;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        setState(() {
          _locationError = 'Konum izni verilmedi.';
          _locating = false;
        });
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      if (!mounted) return;
      setState(() {
        _position = position;
        _locationError = null;
        _locating = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _locationError = 'Konum alinamadi: $e';
        _locating = false;
      });
    }
  }

  Future<void> _refreshAll() async {
    await _controller.refreshSos();
    if (_position != null) {
      await _controller.refreshAssembly(
        latitude: _position!.latitude,
        longitude: _position!.longitude,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final center = _position != null
        ? LatLng(_position!.latitude, _position!.longitude)
        : const LatLng(39.0, 35.0);

    final showSos = _controller.layerVisibility[MapLayerKey.sos] ?? true;
    final showRoadDamage =
        _controller.layerVisibility[MapLayerKey.roadDamage] ?? true;
    final showAssembly =
        _controller.layerVisibility[MapLayerKey.assemblyAreas] ?? true;
    final showFaultLines =
        _controller.layerVisibility[MapLayerKey.faultLines] ?? false;

    final markers = <Marker>[
      if (_position != null)
        Marker(
          point: center,
          width: 34,
          height: 34,
          child: const Icon(
            Icons.my_location,
            color: Color(0xFF3276E8),
            size: 30,
          ),
        ),
      if (showSos)
        ..._controller.sosAlerts.map(
          (alert) => Marker(
            point: LatLng(alert.latitude, alert.longitude),
            width: 34,
            height: 34,
            child: Tooltip(
              message: (alert.message ?? '').trim().isNotEmpty
                  ? alert.message!.trim()
                  : 'SOS cagrisi',
              child: const Icon(Icons.sos, color: Color(0xFFE15B64), size: 30),
            ),
          ),
        ),
      if (showAssembly)
        ..._controller.assemblyAreas.map(
          (point) => Marker(
            point: LatLng(point.latitude, point.longitude),
            width: 30,
            height: 30,
            child: Tooltip(
              message: point.name,
              child: const Icon(Icons.shield, color: AppTheme.teal, size: 26),
            ),
          ),
        ),
    ];

    final polylines = <Polyline>[
      if (showFaultLines)
        ..._controller.faultLines.map(
          (line) => Polyline(
            points: line.points
                .map((p) => LatLng(p.latitude, p.longitude))
                .toList(growable: false),
            color: const Color(0xFFB98B3E),
            strokeWidth: 2,
          ),
        ),
      if (showRoadDamage)
        for (final analysis in _controller.roadDamageAnalyses) ...[
          ...analysis.safeRoadSegments.map(
            (segment) => Polyline(
              points: segment
                  .map((p) => LatLng(p.latitude, p.longitude))
                  .toList(growable: false),
              color: AppTheme.teal,
              strokeWidth: 3,
            ),
          ),
          ...analysis.blockedRoadSegments.map(
            (segment) => Polyline(
              points: segment
                  .map((p) => LatLng(p.latitude, p.longitude))
                  .toList(growable: false),
              color: const Color(0xFFE15B64),
              strokeWidth: 4,
            ),
          ),
        ],
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
      children: [
        Text(
          'Toplu Harita Gorunumu',
          style: Theme.of(context).textTheme.displaySmall,
        ),
        const SizedBox(height: 8),
        Text(
          widget.isResponder
              ? 'Gelen SOS cagrilari, uydu yol hasari sonuclari, toplanma alanlari ve fay hatlarini tek haritada gor.'
              : 'Cevrendeki SOS cagrilarini, guvenli toplanma alanlarini ve fay hatlarini tek haritada gor.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _LayerChip(
              label: 'SOS (${_controller.sosAlerts.length})',
              selected: showSos,
              color: const Color(0xFFE15B64),
              onTap: () => _controller.toggleLayer(MapLayerKey.sos),
            ),
            _LayerChip(
              label: 'Yol Hasari (${_controller.roadDamageAnalyses.length})',
              selected: showRoadDamage,
              color: const Color(0xFF3276E8),
              onTap: () => _controller.toggleLayer(MapLayerKey.roadDamage),
            ),
            _LayerChip(
              label:
                  'Toplanma Alanlari (${_controller.assemblyAreas.length})',
              selected: showAssembly,
              color: AppTheme.teal,
              onTap: () => _controller.toggleLayer(MapLayerKey.assemblyAreas),
            ),
            _LayerChip(
              label: 'Fay Hatlari (${_controller.faultLines.length})',
              selected: showFaultLines,
              color: const Color(0xFFB98B3E),
              onTap: () => _controller.toggleLayer(MapLayerKey.faultLines),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_controller.lastError != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: SectionCard(
              color: const Color(0xFF4A1C1C),
              child: Text(
                _controller.lastError!,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ),
        if (_locationError != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: SectionCard(
              color: const Color(0xFF4A1C1C),
              child: Text(
                _locationError!,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ),
        SizedBox(
          height: 460,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(26),
            child: Stack(
              children: [
                FlutterMap(
                  options: MapOptions(
                    initialCenter: center,
                    initialZoom: _position != null ? 12 : 5.5,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.example.quakemind',
                    ),
                    PolylineLayer(polylines: polylines),
                    MarkerLayer(markers: markers),
                  ],
                ),
                Positioned(
                  right: 12,
                  top: 12,
                  child: FloatingActionButton.small(
                    heroTag: 'unified_map_refresh',
                    onPressed: _locating
                        ? null
                        : () async {
                            await _resolveLocation();
                            await _refreshAll();
                          },
                    child: _locating
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.refresh),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Katmanlar', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 10),
              const _LegendRow(
                color: Color(0xFFE15B64),
                icon: Icons.sos,
                label: 'SOS cagrisi',
              ),
              const _LegendRow(
                color: AppTheme.teal,
                icon: Icons.shield,
                label: 'Toplanma alani',
              ),
              const _LegendRow(
                color: AppTheme.teal,
                icon: Icons.timeline,
                label: 'Acik yol (uydu analizi)',
              ),
              const _LegendRow(
                color: Color(0xFFE15B64),
                icon: Icons.timeline,
                label: 'Kapali / hasarli yol',
              ),
              const _LegendRow(
                color: Color(0xFFB98B3E),
                icon: Icons.timeline,
                label: 'Fay hatti',
              ),
              if (_controller.roadDamageAnalyses.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    widget.isResponder
                        ? 'Uydu sekmesinde bir analiz calistirdiginda sonuclar burada da gorunur.'
                        : 'Bu oturumda henuz uydu yol hasari analizi yapilmadi.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LayerChip extends StatelessWidget {
  const _LayerChip({
    required this.label,
    required this.selected,
    required this.color,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: color.withValues(alpha: 0.28),
      checkmarkColor: color,
      side: BorderSide(color: color.withValues(alpha: 0.6)),
    );
  }
}

class _LegendRow extends StatelessWidget {
  const _LegendRow({
    required this.color,
    required this.icon,
    required this.label,
  });

  final Color color;
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(label)),
        ],
      ),
    );
  }
}
