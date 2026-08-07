import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../data/mock_data.dart';
import '../../models/road_damage_result.dart';
import '../../services/map_layers_controller.dart';
import '../../services/road_damage_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_widgets.dart';
import '../../widgets/tactical/hero_stat_band.dart';
import '../../widgets/tactical/ops_panel.dart';
import 'shared/async_state_widgets.dart';

class RoadDamagePage extends StatefulWidget {
  const RoadDamagePage({
    super.key,
    required this.city,
    required this.source,
    required this.damageBooster,
    required this.threshold,
    required this.useImagenetNorm,
    required this.postProcessLevel,
    required this.onCityChanged,
    required this.onSourceChanged,
    required this.onDamageBoosterChanged,
    required this.onThresholdChanged,
    required this.onNormalizationChanged,
    required this.onPostProcessChanged,
  });

  final String city;
  final String source;
  final double damageBooster;
  final double threshold;
  final bool useImagenetNorm;
  final int postProcessLevel;
  final ValueChanged<String?> onCityChanged;
  final ValueChanged<String?> onSourceChanged;
  final ValueChanged<double> onDamageBoosterChanged;
  final ValueChanged<double> onThresholdChanged;
  final ValueChanged<bool> onNormalizationChanged;
  final ValueChanged<int> onPostProcessChanged;

  @override
  State<RoadDamagePage> createState() => _RoadDamagePageState();
}

enum _RoadLocationMode { current, sample }

class _RoadDamagePageState extends State<RoadDamagePage> {
  static const _service = RoadDamageService();
  static const _oamSampleTitle = '2023-02-09T17:00:00.000Z - Help.NGO';

  Future<RoadDamageResult>? _future;
  _RoadLocationMode _locationMode = _RoadLocationMode.sample;
  double? _currentLatitude;
  double? _currentLongitude;
  String? _locationError;
  double _radiusKm = 2.5;
  String? _selectedWaybackId;
  String? _selectedWaybackLabel;
  String? _selectedOamTileUrl;
  String? _selectedOamLabel;
  bool _showAdvanced = false;

  Future<void> _pickHistoricalImagery() async {
    final isWayback = widget.source.toLowerCase().contains('esri') ||
        widget.source.toLowerCase().contains('wayback');
    final isOam = widget.source.toLowerCase().contains('openaerial') ||
        widget.source.toLowerCase().contains('oam');

    if (!isWayback && !isOam) return;

    List<Map<String, dynamic>> items = [];
    String errorText = '';
    try {
      if (isWayback) {
        items = await _service.fetchWaybackVersions();
      } else {
        final coords = _locationMode == _RoadLocationMode.current &&
                _currentLatitude != null &&
                _currentLongitude != null
            ? [_currentLatitude!, _currentLongitude!]
            : _cityCoordinates(widget.city);
        items = await _service.searchOamImages(
          latitude: coords[0],
          longitude: coords[1],
          radiusKm: _radiusKm,
        );
      }
    } catch (e) {
      errorText = 'Liste alinamadi: $e';
    }

    if (!mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isWayback ? 'Esri Wayback goruntusu sec' : 'OpenAerialMap goruntusu sec',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                if (errorText.isNotEmpty)
                  Text(errorText)
                else if (items.isEmpty)
                  const Text('Bu bolge/tarih icin uygun goruntu bulunamadi. Varsayilan kaynak kullanilacak.')
                else
                  Flexible(
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        final item = items[index];
                        final title = isWayback
                            ? (item['date']?.toString() ?? 'Wayback #${item['id']}')
                            : (item['title']?.toString() ?? 'OAM goruntusu ${index + 1}');
                        final subtitle = isWayback
                            ? 'ID: ${item['id']}'
                            : (item['acquisition_date']?.toString() ?? '');
                        return ListTile(
                          leading: const Icon(Icons.image_search),
                          title: Text(title),
                          subtitle: subtitle.isEmpty ? null : Text(subtitle),
                          onTap: () {
                            setState(() {
                              if (isWayback) {
                                _selectedWaybackId = item['id']?.toString();
                                _selectedWaybackLabel = title;
                                _selectedOamTileUrl = null;
                                _selectedOamLabel = null;
                              } else {
                                _selectedOamTileUrl = item['tms']?.toString();
                                _selectedOamLabel = title;
                                _selectedWaybackId = null;
                                _selectedWaybackLabel = null;
                              }
                            });
                            Navigator.of(context).pop();
                          },
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _runAnalysis() async {
    double latitude;
    double longitude;
    String cityLabel;

    if (_locationMode == _RoadLocationMode.current) {
      final coords = await _resolveCurrentCoordinates();
      if (coords == null) {
        setState(() {
          _future = Future.error(
            _locationError ?? 'Mevcut konum alinamadi. Ornek uydu seti moduna gecip tekrar deneyin.',
          );
        });
        return;
      }
      latitude = coords[0];
      longitude = coords[1];
      cityLabel = 'Mevcut Konum';
    } else {
      final coords = _cityCoordinates(widget.city);
      latitude = coords[0];
      longitude = coords[1];
      cityLabel = widget.city;
    }

    setState(() {
      _future = _service
          .analyzeArea(
            city: cityLabel,
            latitude: latitude,
            longitude: longitude,
            source: widget.source,
            oamPreferredTitle: _selectedOamTileUrl == null &&
                    _locationMode == _RoadLocationMode.sample &&
                    widget.source.toLowerCase().contains('openaerial')
                ? _oamSampleTitle
                : null,
            waybackId: _selectedWaybackId,
            oamTileUrl: _selectedOamTileUrl,
            damageBooster: widget.damageBooster,
            threshold: widget.threshold,
            useImagenetNorm: widget.useImagenetNorm,
            postProcessLevel: widget.postProcessLevel,
            radiusKm: _radiusKm,
          )
          .then((result) {
            // Feed the result into the shared map layers store so it also
            // shows up on the "Harita" (toplu harita) tab, not just here.
            MapLayersController.instance.addRoadDamageAnalysis(result);
            return result;
          });
    });
  }

  List<double> _cityCoordinates(String city) {
    const coords = {
      'Antakya (Hatay)': [36.20, 36.16],
      'Kahramanmaras': [37.57, 36.93],
      'Gaziantep': [37.06, 37.38],
      'Malatya': [38.35, 38.30],
      'Adiyaman': [37.76, 38.27],
    };
    return coords[city] ?? [37.0, 37.0];
  }

  Future<List<double>?> _resolveCurrentCoordinates() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() => _locationError = 'Konum servisi kapali.');
        return null;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        setState(() => _locationError = 'Konum izni verilmedi.');
        return null;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      _locationError = null;
      _currentLatitude = position.latitude;
      _currentLongitude = position.longitude;
      return [position.latitude, position.longitude];
    } catch (e) {
      setState(() => _locationError = 'Konum alinirken hata: $e');
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
      children: [
        if (_future == null)
          const HeroStatBand(
            title: 'Uydu Yol Hasari Analizi',
            headline: 'ANALIZ BEKLENIYOR',
            subtitle: 'Segformer AI modeli ile uydu goruntusunden yol hasari tespiti.',
            beaconLabel: 'HAZIR',
            beaconColor: AppTheme.neonCyan,
          )
        else
          FutureBuilder<RoadDamageResult>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const HeroStatBand(
                  title: 'Uydu Yol Hasari Analizi',
                  headline: 'ISLENIYOR...',
                  subtitle: 'Uydu goruntusu indiriliyor ve AI modeli calisiyor. Bu islem 1-2 dakika surebilir.',
                  beaconLabel: 'AKTIF',
                  beaconColor: AppTheme.neonAmber,
                  beaconLive: true,
                );
              }
              if (snapshot.hasError || !snapshot.hasData) {
                return HeroStatBand(
                  title: 'Uydu Yol Hasari Analizi',
                  headline: 'ANALIZ BASARISIZ',
                  headlineColor: AppTheme.danger,
                  subtitle: 'Yol hasari analizi tamamlanamadi.',
                  variant: OpsPanelVariant.alert,
                  accentColor: AppTheme.danger,
                  beaconLabel: 'HATA',
                  beaconColor: AppTheme.danger,
                );
              }
              final result = snapshot.data!;
              return HeroStatBand(
                title: 'Uydu Yol Hasari Analizi - ${result.city}',
                headline: '%${(result.damageRate * 100).toStringAsFixed(1)}',
                headlineColor: const Color(0xFFE15B64),
                subtitle: result.recommendedAction,
                variant: OpsPanelVariant.hero,
                accentColor: const Color(0xFFE15B64),
                stats: [
                  HeroStat(label: 'ACIK YOL', value: '${result.openRoads}', color: AppTheme.teal),
                  HeroStat(label: 'KAPALI YOL', value: '${result.blockedRoads}', color: const Color(0xFF9C3D54)),
                  if (result.timingsMs['total'] != null)
                    HeroStat(
                      label: 'SURE',
                      value: '${(result.timingsMs['total']! / 1000).toStringAsFixed(1)}sn',
                      color: AppTheme.neonCyan,
                    ),
                ],
              );
            },
          ),
        const SizedBox(height: 18),
        OpsPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionTitle(
                title: 'Konum ve veri kaynagi',
                subtitle: 'Analiz edilecek sehri ve uydu goruntu kaynagini secin.',
              ),
              const SizedBox(height: 18),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: SegmentedButton<_RoadLocationMode>(
                  segments: const [
                    ButtonSegment(
                      value: _RoadLocationMode.current,
                      label: Text('Bulundugum Konum'),
                      icon: Icon(Icons.my_location),
                    ),
                    ButtonSegment(
                      value: _RoadLocationMode.sample,
                      label: Text('Ornek Uydu Seti'),
                      icon: Icon(Icons.layers),
                    ),
                  ],
                  selected: {_locationMode},
                  onSelectionChanged: (value) {
                    setState(() {
                      _locationMode = value.first;
                    });
                  },
                ),
              ),
              const SizedBox(height: 12),
              if (_locationMode == _RoadLocationMode.current) ...[
                OutlinedButton.icon(
                  onPressed: () async {
                    await _resolveCurrentCoordinates();
                    if (mounted) setState(() {});
                  },
                  icon: const Icon(Icons.gps_fixed),
                  label: const Text('Konumu Al / Yenile'),
                ),
                const SizedBox(height: 10),
                Text(
                  _currentLatitude != null && _currentLongitude != null
                      ? 'Aktif koordinat: ${_currentLatitude!.toStringAsFixed(5)}, ${_currentLongitude!.toStringAsFixed(5)}'
                      : (_locationError ?? 'Konum alinmadi.'),
                ),
                const SizedBox(height: 10),
              ] else ...[
                DropdownButtonFormField<String>(
                  initialValue: widget.city,
                  items: roadCities.map((value) => DropdownMenuItem(value: value, child: Text(value))).toList(),
                  onChanged: widget.onCityChanged,
                  decoration: const InputDecoration(labelText: 'Ornek bolge secin'),
                ),
                const SizedBox(height: 12),
              ],
              DropdownButtonFormField<String>(
                initialValue: widget.source,
                items: const [
                  DropdownMenuItem(value: 'Google Maps', child: Text('Google Maps (Latest / High Res)')),
                  DropdownMenuItem(value: 'OpenAerialMap', child: Text('OpenAerialMap (Event Specific)')),
                  DropdownMenuItem(value: 'Esri Wayback', child: Text('Esri Wayback (Historical)')),
                ],
                onChanged: (value) {
                  widget.onSourceChanged(value);
                  setState(() {
                    _selectedWaybackId = null;
                    _selectedWaybackLabel = null;
                    _selectedOamTileUrl = null;
                    _selectedOamLabel = null;
                  });
                },
                decoration: const InputDecoration(labelText: 'Uydu kaynagi'),
              ),
              if (widget.source.toLowerCase().contains('openaerial') ||
                  widget.source.toLowerCase().contains('esri') ||
                  widget.source.toLowerCase().contains('wayback')) ...[
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _pickHistoricalImagery,
                  icon: const Icon(Icons.image_search),
                  label: Text(_selectedWaybackLabel ?? _selectedOamLabel ?? 'Belirli goruntu / tarih sec'),
                ),
              ],
              const SizedBox(height: 18),
              Text('Analiz yaricapi: ${_radiusKm.toStringAsFixed(1)} km', style: Theme.of(context).textTheme.bodyLarge),
              Slider(
                value: _radiusKm,
                min: 0.5,
                max: 8.0,
                divisions: 15,
                label: '${_radiusKm.toStringAsFixed(1)} km',
                onChanged: (value) => setState(() => _radiusKm = value),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        OpsPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: () => setState(() => _showAdvanced = !_showAdvanced),
                child: Row(
                  children: [
                    const Icon(Icons.tune, color: AppTheme.neonCyan, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text('Analiz ayarlari (gelismis)', style: Theme.of(context).textTheme.titleLarge),
                    ),
                    Icon(_showAdvanced ? Icons.expand_less : Icons.expand_more, color: AppTheme.textSecondary),
                  ],
                ),
              ),
              if (_showAdvanced) ...[
                const SizedBox(height: 12),
                Text('Hasar hassasiyeti: ${widget.damageBooster.toStringAsFixed(1)}'),
                Slider(
                  value: widget.damageBooster,
                  min: 1,
                  max: 10,
                  divisions: 18,
                  onChanged: widget.onDamageBoosterChanged,
                ),
                Text('Tespit esigi: ${widget.threshold.toStringAsFixed(2)}'),
                Slider(
                  value: widget.threshold,
                  min: 0.05,
                  max: 0.95,
                  divisions: 18,
                  onChanged: widget.onThresholdChanged,
                ),
                SwitchListTile.adaptive(
                  value: widget.useImagenetNorm,
                  onChanged: widget.onNormalizationChanged,
                  contentPadding: EdgeInsets.zero,
                  title: const Text('ImageNet normalizasyonu'),
                  subtitle: const Text('Modelin egitim formatina uygun preprocess'),
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: SegmentedButton<int>(
                    segments: const [
                      ButtonSegment(value: 0, label: Text('Kapali')),
                      ButtonSegment(value: 1, label: Text('Hafif')),
                      ButtonSegment(value: 2, label: Text('Guclu')),
                    ],
                    selected: {widget.postProcessLevel},
                    onSelectionChanged: (value) => widget.onPostProcessChanged(value.first),
                  ),
                ),
              ],
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => _runAnalysis(),
                  icon: const Icon(Icons.satellite_alt),
                  label: const Text('Analizi Baslat'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        if (_future != null)
          FutureBuilder<RoadDamageResult>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const LoadingState(
                  message: 'Uydu goruntusu indiriliyor ve AI modeli calisiyor... Bu islem 1-2 dakika surebilir.',
                );
              }
              if (snapshot.hasError || !snapshot.hasData) {
                return ErrorState(
                  title: 'Yol hasari analizi tamamlanamadi',
                  error: snapshot.error?.toString() ?? 'Bilinmeyen hata',
                  onRetry: () => _runAnalysis(),
                );
              }
              final result = snapshot.data!;
              return _RoadDamageResultBody(result: result);
            },
          ),
      ],
    );
  }
}

class _RoadDamageResultBody extends StatelessWidget {
  const _RoadDamageResultBody({required this.result});

  final RoadDamageResult result;

  void _showAnalysisSteps(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 8, 18, 18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Analiz Adimlari', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 10),
                Flexible(
                  child: ListView(
                    shrinkWrap: true,
                    children: [
                      ...result.logLines.map(
                        (line) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.task_alt, color: AppTheme.teal),
                          title: Text(line),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _RoadDamageImageFilmstrip(result: result),
        const SizedBox(height: 18),
        OpsPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  OutlinedButton.icon(
                    onPressed: () => _showAnalysisSteps(context),
                    icon: const Icon(Icons.format_list_numbered),
                    label: const Text('Analiz Gunlugunu Goster'),
                  ),
                  if (result.timingsMs['total'] != null)
                    StatusPill(
                      label: 'Toplam sure: ${(result.timingsMs['total']! / 1000).toStringAsFixed(1)} sn',
                      color: AppTheme.responderAccent,
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        RoadLogisticsMapPanel(title: 'Lojistik Cizim Katmani', result: result, height: 500),
      ],
    );
  }
}

class _RoadDamageImageFilmstrip extends StatelessWidget {
  const _RoadDamageImageFilmstrip({required this.result});

  final RoadDamageResult result;

  @override
  Widget build(BuildContext context) {
    final images = <String, String?>{
      'Uydu goruntusu': result.imageOriginalB64,
      'Hasar overlay': result.imageDamageOverlayB64,
      'Hasar maskesi': result.imageDamageMaskB64,
      'Yol maskesi': result.imageRoadMaskB64,
      'Kesisim (kapali yol)': result.imageIntersectionB64,
      'Segmentasyon overlay': result.imageSegmentationOverlayB64,
    }..removeWhere((_, value) => value == null || value.isEmpty);

    if (images.isEmpty) {
      return const SizedBox.shrink();
    }

    return OpsPanel(
      padding: const EdgeInsets.fromLTRB(20, 20, 0, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 20),
            child: Text('Analiz gorselleri', style: Theme.of(context).textTheme.titleLarge),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 180,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: images.length,
              padding: const EdgeInsets.only(right: 20),
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final entry = images.entries.elementAt(index);
                return SizedBox(
                  width: 200,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(entry.key, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                      const SizedBox(height: 6),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: GestureDetector(
                            onTap: () => _showFullscreen(context, entry.key, entry.value!),
                            child: Builder(
                              builder: (context) {
                                final bytes = _decodeImageDataUri(entry.value!);
                                if (bytes == null) return const _ImageDecodeError();
                                return Image.memory(
                                  bytes,
                                  fit: BoxFit.cover,
                                  width: double.infinity,
                                  errorBuilder: (context, error, stackTrace) => const _ImageDecodeError(),
                                );
                              },
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showFullscreen(BuildContext context, String title, String base64) {
    final bytes = _decodeImageDataUri(base64);
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => Scaffold(
          appBar: AppBar(title: Text(title)),
          backgroundColor: Colors.black,
          body: Center(
            child: bytes == null
                ? const _ImageDecodeError()
                : InteractiveViewer(child: Image.memory(bytes)),
          ),
        ),
      ),
    );
  }
}

/// Backend sends images as `data:image/png;base64,<...>` data URIs, not raw
/// base64 -- `base64Decode` throws a FormatException on the `data:` prefix,
/// and since it runs synchronously while building the widget (not inside
/// Image.memory's own error handling), that exception used to crash the
/// whole result screen with Flutter's red error view instead of being
/// caught by Image.memory's errorBuilder.
Uint8List? _decodeImageDataUri(String value) {
  final commaIndex = value.indexOf(',');
  final raw = value.startsWith('data:') && commaIndex != -1
      ? value.substring(commaIndex + 1)
      : value;
  try {
    return base64Decode(raw);
  } catch (_) {
    return null;
  }
}

class _ImageDecodeError extends StatelessWidget {
  const _ImageDecodeError();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 120,
      alignment: Alignment.center,
      color: AppTheme.panelHigh,
      child: const Icon(Icons.broken_image_outlined),
    );
  }
}
