import 'package:flutter/material.dart';

import '../../data/mock_data.dart';
import '../../models/nlp_module_result.dart';
import '../../services/nlp_module_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_widgets.dart';
import '../../widgets/tactical/hero_stat_band.dart';
import '../../widgets/tactical/ops_panel.dart';
import 'shared/async_state_widgets.dart';

class NlpPage extends StatefulWidget {
  const NlpPage({super.key, required this.sample, required this.onSampleChanged});

  final String sample;
  final ValueChanged<String?> onSampleChanged;

  @override
  State<NlpPage> createState() => _NlpPageState();
}

class _NlpPageState extends State<NlpPage> {
  static const _service = NlpModuleService();

  late final TextEditingController _controller;
  Future<NlpModuleResult>? _future;
  final List<NlpCoordinates> _locationHistory = [];

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.sample);
  }

  @override
  void didUpdateWidget(covariant NlpPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.sample != widget.sample && _controller.text != widget.sample) {
      _controller.text = widget.sample;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
      children: [
        if (_future == null)
          const HeroStatBand(
            title: 'Afet NLP Analizi',
            headline: 'METIN BEKLENIYOR',
            subtitle: 'BERTurk siniflandirma, NER ve geocoding ile afet metni analizi.',
            beaconLabel: 'HAZIR',
            beaconColor: AppTheme.neonCyan,
          )
        else
          FutureBuilder<NlpModuleResult>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const HeroStatBand(
                  title: 'Afet NLP Analizi',
                  headline: 'ISLENIYOR...',
                  subtitle: 'NLP pipeline backend uzerinden calisiyor.',
                  beaconLabel: 'AKTIF',
                  beaconColor: AppTheme.neonAmber,
                  beaconLive: true,
                );
              }
              if (snapshot.hasError || !snapshot.hasData) {
                return HeroStatBand(
                  title: 'Afet NLP Analizi',
                  headline: 'ANALIZ BASARISIZ',
                  headlineColor: AppTheme.danger,
                  subtitle: 'Afet NLP verisi alinamadi.',
                  variant: OpsPanelVariant.alert,
                  accentColor: AppTheme.danger,
                  beaconLabel: 'HATA',
                  beaconColor: AppTheme.danger,
                );
              }
              final result = snapshot.data!;
              return HeroStatBand(
                title: 'Afet NLP Analizi',
                headline: result.category,
                headlineColor: const Color(0xFF0F9D7A),
                subtitle: 'Konum: ${result.locationText.isEmpty ? 'Cikarilamadi' : result.locationText}',
                variant: OpsPanelVariant.hero,
                accentColor: const Color(0xFF0F9D7A),
                stats: [
                  HeroStat(label: 'GUVEN', value: '%${(result.confidence * 100).round()}', color: AppTheme.responderAccent),
                  HeroStat(label: 'P-5 ACILIYET', value: '${result.urgency} / 5', color: const Color(0xFFE15B64)),
                ],
                action: FilledButton.icon(
                  onPressed: () {
                    final markers = _historyMarkers(result.coordinates);
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(builder: (_) => _NlpMapFullScreenPage(markers: markers)),
                    );
                  },
                  icon: const Icon(Icons.map_outlined),
                  label: const Text('Haritada Incele'),
                ),
              );
            },
          ),
        const SizedBox(height: 18),
        OpsPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionTitle(
                title: 'Metin girisi',
                subtitle: 'Ornek metinlerden secin veya serbest metin girin.',
              ),
              const SizedBox(height: 18),
              DropdownButtonFormField<String>(
                initialValue: widget.sample,
                items: nlpSamples
                    .map((value) => DropdownMenuItem(
                          value: value,
                          child: Text(value, maxLines: 1, overflow: TextOverflow.ellipsis),
                        ))
                    .toList(),
                onChanged: (value) {
                  widget.onSampleChanged(value);
                  if (value != null) {
                    _controller.text = value;
                  }
                },
                decoration: const InputDecoration(labelText: 'Ornek test verisi'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _controller,
                minLines: 5,
                maxLines: 8,
                decoration: const InputDecoration(
                  labelText: 'Sosyal medya / saha metni',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _runAnalysis,
                icon: const Icon(Icons.auto_awesome),
                label: const Text('Analizi calistir'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        if (_future != null)
          FutureBuilder<NlpModuleResult>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const LoadingState(message: 'NLP pipeline backend uzerinden calisiyor...');
              }
              if (snapshot.hasError || !snapshot.hasData) {
                return ErrorState(
                  title: 'Afet NLP verisi alinamadi',
                  error: snapshot.error?.toString() ?? 'Bilinmeyen hata',
                  onRetry: _runAnalysis,
                );
              }
              final result = snapshot.data!;
              return LayoutBuilder(
                builder: (context, constraints) {
                  final wide = constraints.maxWidth >= 560;
                  final locationCard = OpsPanel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Cikarilan konum', style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 12),
                        Text('Konum metni: ${result.locationText.isEmpty ? 'Cikarilamadi' : result.locationText}'),
                        if (result.coordinates case final coordinates?) ...[
                          const SizedBox(height: 10),
                          Text(
                            'Koordinat: ${coordinates.latitude.toStringAsFixed(4)}, ${coordinates.longitude.toStringAsFixed(4)}',
                          ),
                        ],
                        if (result.candidates.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: result.candidates.map((item) => Chip(label: Text(item))).toList(),
                          ),
                        ],
                      ],
                    ),
                  );
                  final jsonCard = OpsPanel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('JSON cikti', style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.ink,
                            borderRadius: BorderRadius.circular(22),
                          ),
                          child: Text(
                            result.jsonPayload,
                            style: AppTheme.telemetryStyle(fontSize: 12.5, color: const Color(0xFFF2F6FA)),
                          ),
                        ),
                      ],
                    ),
                  );

                  if (wide) {
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: locationCard),
                        const SizedBox(width: 14),
                        Expanded(child: jsonCard),
                      ],
                    );
                  }
                  return Column(children: [locationCard, const SizedBox(height: 14), jsonCard]);
                },
              );
            },
          ),
      ],
    );
  }

  void _runAnalysis() {
    setState(() {
      _future = _analyze();
    });
  }

  Future<NlpModuleResult> _analyze() async {
    final text = _controller.text.trim();
    if (text.isEmpty) {
      throw Exception('Analiz edilecek bir metin gir.');
    }
    final result = await _service.analyzeText(text);
    final coordinate = result.coordinates;
    if (coordinate != null) {
      final alreadyExists = _locationHistory.any(
        (item) =>
            (item.latitude - coordinate.latitude).abs() < 0.00001 &&
            (item.longitude - coordinate.longitude).abs() < 0.00001,
      );
      if (!alreadyExists) {
        _locationHistory.add(coordinate);
        if (_locationHistory.length > 30) {
          _locationHistory.removeAt(0);
        }
      }
    }
    return result;
  }

  List<GeoMarkerData> _historyMarkers(NlpCoordinates? latest) {
    final markers = _locationHistory
        .map(
          (item) => GeoMarkerData(
            latitude: item.latitude,
            longitude: item.longitude,
            label: 'NLP konum: ${item.latitude.toStringAsFixed(4)}, ${item.longitude.toStringAsFixed(4)}',
          ),
        )
        .toList();

    if (latest != null) {
      markers.add(
        GeoMarkerData(
          latitude: latest.latitude,
          longitude: latest.longitude,
          label: 'Son analiz: ${latest.latitude.toStringAsFixed(4)}, ${latest.longitude.toStringAsFixed(4)}',
          highlight: true,
        ),
      );
    }
    return markers;
  }
}

class _NlpMapFullScreenPage extends StatelessWidget {
  const _NlpMapFullScreenPage({required this.markers});

  final List<GeoMarkerData> markers;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('NLP Konum Haritasi')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
          child: GeoPointsMapPanel(
            title: 'NER ve geocoding konum haritasi',
            subtitle: 'Analiz edilen metinlerden cikarilan konumlar',
            markers: markers,
            height: MediaQuery.of(context).size.height - 70,
          ),
        ),
      ),
    );
  }
}
