import 'dart:convert';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:latlong2/latlong.dart' show LatLng;
import 'package:webview_flutter/webview_flutter.dart';

import '../models/road_damage_result.dart';
import '../models/risk_module_result.dart';
import '../theme/app_theme.dart';
import 'tactical/ops_panel.dart';
import 'tactical/status_beacon.dart';
import 'tactical/telemetry_tile.dart';

BoxDecoration _glassBoxDecoration({
  double radius = 26,
  Color? tint,
  Color? stroke,
}) {
  final base = tint ?? AppTheme.panelHigh;
  return BoxDecoration(
    gradient: LinearGradient(
      colors: [
        base.withValues(alpha: 0.42),
        AppTheme.panel.withValues(alpha: 0.30),
      ],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    borderRadius: BorderRadius.circular(radius),
    border: Border.all(color: stroke ?? AppTheme.glassStroke),
    boxShadow: const [
      BoxShadow(
        color: Color(0x66000000),
        blurRadius: 22,
        offset: Offset(0, 12),
      ),
    ],
  );
}

/// Deprecated: delegates to [OpsPanel] (standard variant). Kept as a thin
/// alias so not-yet-migrated call sites still get the new panel treatment.
class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.color,
  });

  final Widget child;
  final EdgeInsets padding;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return OpsPanel(padding: padding, color: color, child: child);
  }
}

/// Compact staggered layout for a set of [SectionCard]-style children so
/// pages read as a dense cluster of tiles instead of a single left-aligned
/// column. Meant for short/medium-height cards (summaries, controls, logs);
/// tall content (maps, webviews, long JSON dumps) should stay outside the
/// grid at full width.
class CardMasonryGrid extends StatelessWidget {
  const CardMasonryGrid({
    super.key,
    required this.children,
    this.crossAxisCount = 2,
    this.spacing = 12,
  });

  final List<Widget> children;
  final int crossAxisCount;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final columns = width < 480 ? 1 : crossAxisCount;
    return MasonryGridView.count(
      crossAxisCount: columns,
      mainAxisSpacing: spacing,
      crossAxisSpacing: spacing,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: children.length,
      itemBuilder: (context, index) => children[index],
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle({super.key, required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 6),
        Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}

/// Deprecated: delegates to [TelemetryMetricTile]. Kept as a thin alias so
/// not-yet-migrated call sites still get the new mono-numeral treatment.
class MetricTile extends StatelessWidget {
  const MetricTile({
    super.key,
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return TelemetryMetricTile(label: label, value: value, color: color);
  }
}

/// Deprecated: delegates to [StatusBeacon]. Kept as a thin alias so
/// not-yet-migrated call sites still get the new beacon treatment.
class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return StatusBeacon(label: label, color: color);
  }
}

class RiskMapPanel extends StatefulWidget {
  const RiskMapPanel({
    super.key,
    required this.title,
    required this.city,
    required this.result,
    this.height = 280,
    this.showHeatmapMode = true,
  });

  final String title;
  final String city;
  final RiskModuleResult result;
  final double height;
  final bool showHeatmapMode;

  @override
  State<RiskMapPanel> createState() => _RiskMapPanelState();
}

enum _RiskMapMode { overview, heatmap, technical }

class _RiskMapPanelState extends State<RiskMapPanel> {
  _RiskMapMode _mode = _RiskMapMode.overview;
  late final WebViewController _webViewController;

  @override
  void initState() {
    super.initState();
    if (!widget.showHeatmapMode) {
      _mode = _RiskMapMode.overview;
    }
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.transparent)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) => NavigationDecision.navigate,
        ),
      )
      ..loadRequest(_buildMapUri(widget.result.mapHtml));
  }

  @override
  void didUpdateWidget(covariant RiskMapPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.result.mapHtml != widget.result.mapHtml) {
      _webViewController.loadRequest(_buildMapUri(widget.result.mapHtml));
    }
  }

  Uri _buildMapUri(String html) {
    return Uri.dataFromString(html, mimeType: 'text/html', encoding: utf8);
  }

  @override
  Widget build(BuildContext context) {
    final segments = <ButtonSegment<_RiskMapMode>>[
      const ButtonSegment(
        value: _RiskMapMode.overview,
        label: Text('Genel Harita'),
        icon: Icon(Icons.map_outlined),
      ),
      if (widget.showHeatmapMode)
        const ButtonSegment(
          value: _RiskMapMode.heatmap,
          label: Text('Isi Haritasi'),
          icon: Icon(Icons.local_fire_department_outlined),
        ),
      const ButtonSegment(
        value: _RiskMapMode.technical,
        label: Text('Teknik Katman'),
        icon: Icon(Icons.timeline),
      ),
    ];

    return Container(
      height: widget.height,
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(26)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(26),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: _glassBoxDecoration(radius: 26),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.title,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${widget.city} merkezli canli harita katmanlari',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.ink,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          '${widget.result.totalFaultFeatures} segment / ${widget.result.nearbyQuakeCount} deprem',
                          style: const TextStyle(
                            color: AppTheme.textPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: SegmentedButton<_RiskMapMode>(
                      segments: segments,
                      selected: {_mode},
                      onSelectionChanged: (value) {
                        setState(() {
                          _mode = value.first;
                        });
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: _mode == _RiskMapMode.technical
                        ? _RiskTechnicalPanel(result: widget.result)
                        : Stack(
                            children: [
                              WebViewWidget(controller: _webViewController),
                              Positioned(
                                left: 14,
                                top: 14,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xDD0D1B2A),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const _MapLegendRow(
                                        color: Color(0xFFCC5A31),
                                        label: 'Ana faylar',
                                      ),
                                      const SizedBox(height: 6),
                                      const _MapLegendRow(
                                        color: Color(0xFFF7C548),
                                        label: 'Deprem odaklari',
                                      ),
                                      const SizedBox(height: 6),
                                      const _MapLegendRow(
                                        color: Color(0xFFE63946),
                                        label: 'Secili sehir',
                                      ),
                                      if (widget.showHeatmapMode &&
                                          _mode == _RiskMapMode.heatmap) ...[
                                        const SizedBox(height: 6),
                                        const _MapLegendRow(
                                          color: Color(0xFF4CC9F0),
                                          label: 'Isi katmani acik',
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.sand,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Text(
                      _mode == _RiskMapMode.technical
                          ? 'Teknik katmanda backend tarafindaki detayli fay GeoJSON sayilari ve en guclu 20 deprem listeleniyor.'
                          : widget.showHeatmapMode
                          ? 'Bu harita backendde uretilen gercek Folium icerigini gosterir. Harita uzerinde gezinebilir, yakinlasabilir ve layer control ile isi haritasi ile fay katmanlarini acip kapatabilirsin.'
                          : 'Bu harita backendde uretilen gercek Folium icerigini gosterir. Harita uzerinde gezinebilir, yakinlasabilir ve katmanlari inceleyebilirsin.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RiskTechnicalPanel extends StatelessWidget {
  const _RiskTechnicalPanel({required this.result});

  final RiskModuleResult result;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            SizedBox(
              width: 170,
              child: MetricTile(
                label: '150 km icindeki deprem',
                value: '${result.nearbyQuakeCount}',
                color: AppTheme.survivorAccent,
              ),
            ),
            SizedBox(
              width: 170,
              child: MetricTile(
                label: 'Maksimum buyukluk',
                value: result.maxMagnitude.toStringAsFixed(2),
                color: const Color(0xFF15616D),
              ),
            ),
            SizedBox(
              width: 170,
              child: MetricTile(
                label: 'Ortalama derinlik',
                value: '${result.averageDepth.toStringAsFixed(1)} km',
                color: const Color(0xFF5A6C7D),
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        Text(
          'GeoJSON fay katmanlari',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        ...result.technicalLayers.map(
          (layer) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(
              Icons.account_tree_outlined,
              color: AppTheme.accent,
            ),
            title: Text(layer.name),
            subtitle: Text(layer.path),
            trailing: Text('${layer.featureCount}'),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Toplam gosterilen detayli fay segmenti: ${result.totalFaultFeatures}',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 18),
        Text(
          'En guclu 20 deprem kaydi',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        ...result.technicalQuakes.map(
          (quake) => Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.panelHigh,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              'M${quake.magnitude.toStringAsFixed(1)}  |  ${quake.place}\n'
              '${quake.time}\n'
              'Derinlik: ${quake.depth.toStringAsFixed(1)} km  |  Mesafe: ${quake.distanceKm.toStringAsFixed(1)} km',
            ),
          ),
        ),
        if (result.technicalQuakes.isEmpty)
          const Text(
            'Bu bolge icin teknik listelenecek deprem kaydi bulunamadi.',
          ),
      ],
    );
  }
}

class GeoMarkerData {
  const GeoMarkerData({
    required this.latitude,
    required this.longitude,
    required this.label,
    this.highlight = false,
  });

  final double latitude;
  final double longitude;
  final String label;
  final bool highlight;
}

class GeoPointsMapPanel extends StatelessWidget {
  const GeoPointsMapPanel({
    super.key,
    required this.title,
    required this.subtitle,
    required this.markers,
    this.height = 280,
  });

  final String title;
  final String subtitle;
  final List<GeoMarkerData> markers;
  final double height;

  @override
  Widget build(BuildContext context) {
    final center = markers.isNotEmpty
        ? LatLng(markers.last.latitude, markers.last.longitude)
        : const LatLng(39.0, 35.0);

    return SizedBox(
      height: height,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(26),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: _glassBoxDecoration(radius: 26),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.ink,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          '${markers.length} konum',
                          style: const TextStyle(
                            color: AppTheme.textPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: FlutterMap(
                      options: MapOptions(
                        initialCenter: center,
                        initialZoom: markers.isNotEmpty ? 11 : 5.5,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate:
                              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.example.quakemind',
                        ),
                        MarkerLayer(
                          markers: markers
                              .map(
                                (item) => Marker(
                                  point: LatLng(item.latitude, item.longitude),
                                  width: 32,
                                  height: 32,
                                  child: Tooltip(
                                    message: item.label,
                                    child: Icon(
                                      item.highlight
                                          ? Icons.location_on
                                          : Icons.location_pin,
                                      color: item.highlight
                                          ? AppTheme.survivorAccent
                                          : const Color(0xFF15616D),
                                      size: item.highlight ? 30 : 24,
                                    ),
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.sand,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Text(
                      markers.isEmpty
                          ? 'Metinden cikarilan koordinat bulunamadiginda bu panel bos kalir.'
                          : 'Harita, NLP analizinde cikarilan konumlari oturum bazli biriktirerek gosterir.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Shows the user's position, the nearest assembly/gathering point, and the
/// walking route between them as a green polyline.
class RoutePlanMapPanel extends StatelessWidget {
  const RoutePlanMapPanel({
    super.key,
    required this.title,
    required this.subtitle,
    required this.userLatitude,
    required this.userLongitude,
    this.destinationLatitude,
    this.destinationLongitude,
    this.destinationLabel,
    this.routePoints = const [],
    this.height = 320,
  });

  final String title;
  final String subtitle;
  final double userLatitude;
  final double userLongitude;
  final double? destinationLatitude;
  final double? destinationLongitude;
  final String? destinationLabel;
  final List<List<double>> routePoints;
  final double height;

  @override
  Widget build(BuildContext context) {
    final hasDestination = destinationLatitude != null && destinationLongitude != null;
    final center = hasDestination
        ? LatLng(
            (userLatitude + destinationLatitude!) / 2,
            (userLongitude + destinationLongitude!) / 2,
          )
        : LatLng(userLatitude, userLongitude);

    final polyline = routePoints.length > 1
        ? Polyline(
            points: routePoints
                .map((p) => LatLng(p[0], p[1]))
                .toList(growable: false),
            color: AppTheme.teal,
            strokeWidth: 5,
          )
        : (hasDestination
            ? Polyline(
                points: [
                  LatLng(userLatitude, userLongitude),
                  LatLng(destinationLatitude!, destinationLongitude!),
                ],
                color: AppTheme.teal.withValues(alpha: 0.7),
                strokeWidth: 4,
              )
            : null);

    return SizedBox(
      height: height,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(26),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: _glassBoxDecoration(radius: 26),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 4),
                      Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                ),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: FlutterMap(
                      options: MapOptions(
                        initialCenter: center,
                        initialZoom: hasDestination ? 15 : 13,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate:
                              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.example.quakemind',
                        ),
                        if (polyline != null)
                          PolylineLayer(polylines: [polyline]),
                        MarkerLayer(
                          markers: [
                            Marker(
                              point: LatLng(userLatitude, userLongitude),
                              width: 34,
                              height: 34,
                              child: const Tooltip(
                                message: 'Konumun',
                                child: Icon(
                                  Icons.my_location,
                                  color: Color(0xFF3B82F6),
                                  size: 30,
                                ),
                              ),
                            ),
                            if (hasDestination)
                              Marker(
                                point: LatLng(destinationLatitude!, destinationLongitude!),
                                width: 36,
                                height: 36,
                                child: Tooltip(
                                  message: destinationLabel ?? 'Toplanma alani',
                                  child: const Icon(
                                    Icons.shield,
                                    color: Color(0xFF28A6A1),
                                    size: 32,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class RoadLogisticsMapPanel extends StatefulWidget {
  const RoadLogisticsMapPanel({
    super.key,
    required this.title,
    required this.result,
    this.height = 320,
  });

  final String title;
  final RoadDamageResult result;
  final double height;

  @override
  State<RoadLogisticsMapPanel> createState() => _RoadLogisticsMapPanelState();
}

class _RoadLogisticsMapPanelState extends State<RoadLogisticsMapPanel> {
  late RoadPoint _centerPoint;
  late List<Polyline> _safePolylines;
  late List<Polyline> _blockedPolylines;

  @override
  void initState() {
    super.initState();
    _computePolylines();
  }

  @override
  void didUpdateWidget(covariant RoadLogisticsMapPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Rebuilding these lists (and re-diffing flutter_map's PolylineLayer) is
    // the most expensive part of this panel -- with up to ~1000 short
    // segments, doing it on every rebuild of the surrounding page (e.g. a
    // slider being dragged elsewhere on screen) caused visible stutter/tearing
    // in the drawn roads. Only recompute when the actual analysis result
    // changes.
    if (!identical(oldWidget.result, widget.result)) {
      _computePolylines();
    }
  }

  void _computePolylines() {
    final result = widget.result;
    final blockedPoints = result.blockedRoadSegments.expand((s) => s).toList();
    final safePoints = result.safeRoadSegments.expand((s) => s).toList();
    _centerPoint = blockedPoints.isNotEmpty
        ? blockedPoints.first
        : (safePoints.isNotEmpty
              ? safePoints.first
              : const RoadPoint(37.0, 35.0));

    _blockedPolylines = result.blockedRoadSegments
        .map(
          (segment) => Polyline(
            points: segment
                .map((p) => LatLng(p.latitude, p.longitude))
                .toList(growable: false),
            color: AppTheme.survivorAccent,
            strokeWidth: 4,
            strokeCap: StrokeCap.round,
            strokeJoin: StrokeJoin.round,
          ),
        )
        .toList(growable: false);

    _safePolylines = result.safeRoadSegments
        .map(
          (segment) => Polyline(
            points: segment
                .map((p) => LatLng(p.latitude, p.longitude))
                .toList(growable: false),
            color: AppTheme.teal,
            strokeWidth: 3,
            strokeCap: StrokeCap.round,
            strokeJoin: StrokeJoin.round,
          ),
        )
        .toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    final result = widget.result;
    final title = widget.title;
    final height = widget.height;
    final centerPoint = _centerPoint;
    final blockedPolylines = _blockedPolylines;
    final safePolylines = _safePolylines;

    final tileTemplate = result.satelliteTileUrl.trim().isNotEmpty
        ? result.satelliteTileUrl.trim()
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    final tileAttribution = result.satelliteAttribution.trim().isNotEmpty
        ? result.satelliteAttribution.trim()
        : 'OpenStreetMap';

    return SizedBox(
      height: height,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(26),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: _glassBoxDecoration(radius: 26),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${result.city} - acik/kapali yol cizimleri',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          StatusPill(
                            label:
                                'Kapali segment: ${result.blockedRoadSegments.length}',
                            color: AppTheme.survivorAccent,
                          ),
                          StatusPill(
                            label:
                                'Acik segment: ${result.safeRoadSegments.length}',
                            color: AppTheme.teal,
                          ),
                          StatusPill(
                            label: result.satelliteSource.isNotEmpty
                                ? result.satelliteSource
                                : 'OpenStreetMap',
                            color: AppTheme.responderAccent,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: FlutterMap(
                      options: MapOptions(
                        initialCenter: LatLng(
                          centerPoint.latitude,
                          centerPoint.longitude,
                        ),
                        initialZoom: 14,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: tileTemplate,
                          userAgentPackageName: 'com.example.quakemind',
                          maxZoom: 20,
                        ),
                        PolylineLayer(polylines: safePolylines),
                        PolylineLayer(polylines: blockedPolylines),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.sand,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Text(
                      'Yesil cizgiler acik yollari, kirmizi cizgiler engelli/kapali yol segmentlerini gosterir.',
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      'Harita kaynagi: $tileAttribution',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MapLegendRow extends StatelessWidget {
  const _MapLegendRow({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(99),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
