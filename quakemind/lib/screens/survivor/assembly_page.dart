import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../services/assembly_service.dart';
import '../../services/road_damage_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_widgets.dart';
import '../../widgets/tactical/hero_stat_band.dart';
import '../../widgets/tactical/ops_panel.dart';

class SurvivorAssemblyPage extends StatefulWidget {
  const SurvivorAssemblyPage({super.key});

  @override
  State<SurvivorAssemblyPage> createState() => _SurvivorAssemblyPageState();
}

class _SurvivorAssemblyPageState extends State<SurvivorAssemblyPage> {
  static const _service = AssemblyService();
  static const _roadDamageService = RoadDamageService();

  Position? _position;
  AssemblyRouteResult? _result;
  String? _error;
  bool _loading = false;

  // PostGIS-tabanli, risk-agirlikli A*/Dijkstra rota (rapor 2.4.4) --
  // toplanma alanina cizilen varsayilan OSRM rotasinin ustune, aktif
  // edilebilir bir alternatif.
  bool _usingSafeRoute = false;
  bool _safeRouteLoading = false;
  String? _safeRouteError;
  List<List<double>>? _safeRouteCoords;
  double? _safeRouteDistanceM;
  String? _safeRouteAlgorithm;

  Future<void> _toggleSafeRoute() async {
    if (_usingSafeRoute) {
      setState(() {
        _usingSafeRoute = false;
        _safeRouteCoords = null;
        _safeRouteDistanceM = null;
        _safeRouteAlgorithm = null;
        _safeRouteError = null;
      });
      return;
    }

    final position = _position;
    final nearest = _result?.nearest;
    if (position == null || nearest == null) return;

    setState(() {
      _safeRouteLoading = true;
      _safeRouteError = null;
    });
    try {
      final data = await _roadDamageService.fetchSafeRoute(
        startLat: position.latitude,
        startLon: position.longitude,
        destLat: nearest.latitude,
        destLon: nearest.longitude,
      );
      final coords = (data['routeCoords'] as List<dynamic>? ?? const [])
          .map(
            (point) => (point as List<dynamic>)
                .map((value) => (value as num).toDouble())
                .toList(),
          )
          .toList();
      if (!mounted) return;
      setState(() {
        _usingSafeRoute = true;
        _safeRouteCoords = coords;
        _safeRouteDistanceM = (data['distanceMeters'] as num?)?.toDouble();
        _safeRouteAlgorithm = data['algorithm']?.toString();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _safeRouteError = 'Risk-agirlikli rota hesaplanamadi: $e');
    } finally {
      if (mounted) setState(() => _safeRouteLoading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _usingSafeRoute = false;
      _safeRouteCoords = null;
      _safeRouteDistanceM = null;
      _safeRouteAlgorithm = null;
      _safeRouteError = null;
    });

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _error = 'Konum servisi kapali. Lutfen GPS\'i acin.';
          _loading = false;
        });
        return;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        setState(() {
          _error = 'Konum izni verilmedi.';
          _loading = false;
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      final result = await _service.nearestAssembly(
        latitude: position.latitude,
        longitude: position.longitude,
      );

      if (!mounted) return;
      setState(() {
        _position = position;
        _result = result;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Toplanma alani bilgisi alinamadi: $e';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final nearest = _result?.nearest;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
      children: [
        if (_loading)
          const HeroStatBand(
            title: 'En Yakin Toplanma Alani',
            headline: 'ARANIYOR...',
            subtitle: 'Konumuna en yakin guvenli AFAD toplanma alani araniyor.',
            beaconLabel: 'ISLENIYOR',
            beaconColor: AppTheme.neonAmber,
            beaconLive: true,
          )
        else if (_error != null)
          HeroStatBand(
            title: 'En Yakin Toplanma Alani',
            headline: 'HATA',
            headlineColor: AppTheme.danger,
            subtitle: _error!,
            variant: OpsPanelVariant.alert,
            accentColor: AppTheme.danger,
            beaconLabel: 'HATA',
            beaconColor: AppTheme.danger,
            action: OutlinedButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh),
              label: const Text('Tekrar dene'),
            ),
          )
        else if (nearest != null && _position != null)
          HeroStatBand(
            title: 'En Yakin Toplanma Alani',
            headline: nearest.name,
            headlineColor: AppTheme.teal,
            subtitle: nearest.status ?? 'Konumuna en yakin guvenli AFAD toplanma alani.',
            variant: OpsPanelVariant.live,
            accentColor: AppTheme.teal,
            beaconLabel: 'ROTA HAZIR',
            beaconColor: AppTheme.teal,
            stats: [
              if (nearest.capacity != null) HeroStat(label: 'KAPASITE', value: '${nearest.capacity}'),
              if (_result?.routeLengthM != null)
                HeroStat(
                  label: 'MESAFE',
                  value: '${(_result!.routeLengthM! / 1000).toStringAsFixed(2)} km',
                  color: AppTheme.neonCyan,
                ),
              if (_result?.routeLengthM != null)
                HeroStat(
                  label: 'YURUYUS',
                  value: '~${(_result!.routeLengthM! / 80).round()} dk',
                  color: AppTheme.neonAmber,
                ),
            ],
          )
        else
          HeroStatBand(
            title: 'En Yakin Toplanma Alani',
            headline: 'BULUNAMADI',
            subtitle: 'Yakinda kayitli bir toplanma alani bulunamadi.',
            beaconLabel: 'BOS',
            beaconColor: AppTheme.textSecondary,
            action: OutlinedButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh),
              label: const Text('Tekrar dene'),
            ),
          ),
        const SizedBox(height: 18),
        if (nearest != null && _position != null) ...[
          OpsPanel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _usingSafeRoute
                      ? 'Risk-agirlikli guvenli rota aktif'
                          '${_safeRouteAlgorithm != null ? ' (${_safeRouteAlgorithm!})' : ''}'
                          '${_safeRouteDistanceM != null ? ' - ${(_safeRouteDistanceM! / 1000).toStringAsFixed(2)} km' : ''}'
                      : 'Varsayilan OSRM rotasi gosteriliyor.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _safeRouteLoading ? null : _toggleSafeRoute,
                    icon: _safeRouteLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(_usingSafeRoute ? Icons.shield : Icons.shield_outlined),
                    label: Text(
                      _usingSafeRoute ? 'Standart Rotaya Don' : 'Risk-Agirlikli Guvenli Rota',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_safeRouteError != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(_safeRouteError!, style: const TextStyle(color: AppTheme.danger)),
            ),
          const SizedBox(height: 12),
          RoutePlanMapPanel(
            title: 'Toplanma alanina rota',
            subtitle: _usingSafeRoute
                ? 'Cyan hat: PostGIS damage_points + road_blockages ile hesaplanan risk-agirlikli A*/Dijkstra rotasi.'
                : 'Yesil hat: en yakin guvenli alana yuruyus rotasi.',
            userLatitude: _position!.latitude,
            userLongitude: _position!.longitude,
            destinationLatitude: nearest.latitude,
            destinationLongitude: nearest.longitude,
            destinationLabel: nearest.name,
            routePoints: _usingSafeRoute && _safeRouteCoords != null
                ? _safeRouteCoords!
                : (_result?.routeCoords ?? const []),
            height: 340,
          ),
          const SizedBox(height: 18),
          if ((_result?.records.length ?? 0) > 1)
            OpsPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Yakin diger toplanma alanlari', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 92,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _result!.records.length > 6 ? 6 : _result!.records.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 10),
                      itemBuilder: (context, index) {
                        final item = _result!.records[index];
                        return Container(
                          width: 170,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.teal.withValues(alpha: 0.08),
                            border: Border.all(color: AppTheme.teal.withValues(alpha: 0.35)),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.place, color: AppTheme.teal, size: 16),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      item.name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                                    ),
                                  ),
                                ],
                              ),
                              if (item.distanceMeters != null) ...[
                                const SizedBox(height: 6),
                                Text(
                                  '${(item.distanceMeters! / 1000).toStringAsFixed(2)} km',
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
        ],
      ],
    );
  }
}
