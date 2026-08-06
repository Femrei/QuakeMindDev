import 'package:flutter/material.dart';

import '../../data/mock_data.dart';
import '../../models/risk_module_result.dart';
import '../../services/risk_module_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_widgets.dart';
import '../../widgets/tactical/bento_grid.dart';
import '../../widgets/tactical/hero_stat_band.dart';
import '../../widgets/tactical/ops_panel.dart';
import 'shared/async_state_widgets.dart';

class RiskPage extends StatefulWidget {
  const RiskPage({super.key, required this.city, required this.onCityChanged});

  final String city;
  final ValueChanged<String?> onCityChanged;

  @override
  State<RiskPage> createState() => _RiskPageState();
}

class _RiskPageState extends State<RiskPage> {
  static const _service = RiskModuleService();

  late Future<RiskModuleResult> _future;
  final _manualLatitudeController = TextEditingController();
  final _manualLongitudeController = TextEditingController();
  bool _useManualCoordinates = false;

  @override
  void initState() {
    super.initState();
    _future = _loadRisk();
  }

  @override
  void dispose() {
    _manualLatitudeController.dispose();
    _manualLongitudeController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant RiskPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.city != widget.city) {
      _future = _loadRisk();
    }
  }

  Future<RiskModuleResult> _loadRisk({bool refreshData = false}) async {
    final manualLatitude = _useManualCoordinates
        ? double.tryParse(_manualLatitudeController.text.replaceAll(',', '.'))
        : null;
    final manualLongitude = _useManualCoordinates
        ? double.tryParse(_manualLongitudeController.text.replaceAll(',', '.'))
        : null;

    if (_useManualCoordinates && (manualLatitude == null || manualLongitude == null)) {
      throw Exception('Manuel koordinat icin gecerli enlem ve boylam gir.');
    }

    final result = await _service.fetchCityRisk(
      widget.city,
      refreshData: refreshData,
      manualLatitude: manualLatitude,
      manualLongitude: manualLongitude,
    );
    _manualLatitudeController.text = result.latitude.toStringAsFixed(6);
    _manualLongitudeController.text = result.longitude.toStringAsFixed(6);
    return result;
  }

  void _runRisk() {
    setState(() {
      _future = _loadRisk();
    });
  }

  void _refreshData() {
    setState(() {
      _future = _loadRisk(refreshData: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
      children: [
        FutureBuilder<RiskModuleResult>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const HeroStatBand(
                title: 'Deprem Risk Paneli',
                headline: 'HESAPLANIYOR...',
                subtitle: 'Risk motoru backend uzerinden hesaplama yapiyor.',
                beaconLabel: 'ISLENIYOR',
                beaconColor: AppTheme.neonAmber,
                beaconLive: true,
              );
            }
            if (snapshot.hasError || !snapshot.hasData) {
              return HeroStatBand(
                title: 'Deprem Risk Paneli',
                headline: 'VERI ALINAMADI',
                headlineColor: AppTheme.danger,
                subtitle: '${widget.city} icin risk verisi alinamadi.',
                variant: OpsPanelVariant.alert,
                accentColor: AppTheme.danger,
                beaconLabel: 'HATA',
                beaconColor: AppTheme.danger,
              );
            }
            final result = snapshot.data!;
            return HeroStatBand(
              title: 'Deprem Risk Paneli - ${widget.city}',
              headline: result.riskScore.toStringAsFixed(1),
              headlineColor: const Color(0xFFE15B64),
              subtitle: 'Risk seviyesi: ${result.riskLevel}',
              variant: OpsPanelVariant.hero,
              accentColor: const Color(0xFFE15B64),
              stats: [
                HeroStat(label: '150KM DEPREM', value: '${result.nearbyQuakeCount}'),
                HeroStat(label: 'MAX BUYUKLUK', value: result.maxMagnitude.toStringAsFixed(2)),
                HeroStat(label: 'GUNCELLEME', value: result.lastUpdate, color: AppTheme.neonAmber),
              ],
              action: FilledButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => _RiskMapFullScreenPage(result: result)),
                  );
                },
                icon: const Icon(Icons.open_in_full),
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
                title: 'Analiz Kontrolleri',
                subtitle: 'Sehir secimi, manuel koordinat ve veri yenileme ayarlari.',
              ),
              const SizedBox(height: 18),
              DropdownButtonFormField<String>(
                initialValue: widget.city,
                items: turkeyCities
                    .map((value) => DropdownMenuItem(value: value, child: Text(value)))
                    .toList(),
                onChanged: widget.onCityChanged,
                decoration: const InputDecoration(labelText: 'Sehir secin'),
              ),
              const SizedBox(height: 14),
              CheckboxListTile(
                value: _useManualCoordinates,
                onChanged: (value) {
                  setState(() {
                    _useManualCoordinates = value ?? false;
                  });
                },
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                title: const Text('Manuel koordinat kullan'),
                subtitle: const Text('Secili sehir yerine ozel koordinatlarla hesap yap.'),
              ),
              if (_useManualCoordinates) ...[
                const SizedBox(height: 8),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final width = (constraints.maxWidth - 12) / 2;
                    final fieldWidth = width > 170 ? width : constraints.maxWidth;
                    return Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        SizedBox(
                          width: fieldWidth,
                          child: TextField(
                            controller: _manualLatitudeController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                            decoration: const InputDecoration(labelText: 'Enlem'),
                          ),
                        ),
                        SizedBox(
                          width: fieldWidth,
                          child: TextField(
                            controller: _manualLongitudeController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                            decoration: const InputDecoration(labelText: 'Boylam'),
                          ),
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 14),
              ],
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: _refreshData,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Veriyi Guncelle'),
                  ),
                  FilledButton.icon(
                    onPressed: _runRisk,
                    icon: const Icon(Icons.public),
                    label: const Text('Deprem Riskini Hesapla'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        FutureBuilder<RiskModuleResult>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const LoadingState(message: 'Risk motoru backend uzerinden hesaplama yapiyor...');
            }
            if (snapshot.hasError || !snapshot.hasData) {
              return ErrorState(
                title: '${widget.city} icin risk verisi alinamadi',
                error: snapshot.error?.toString() ?? 'Bilinmeyen hata',
                onRetry: _runRisk,
              );
            }

            final result = snapshot.data!;
            return Column(
              children: [
                if (result.refreshMessage.isNotEmpty) ...[
                  SectionCard(color: AppTheme.panelHigh, child: Text(result.refreshMessage)),
                  const SizedBox(height: 18),
                ],
                MetricTile(
                  label: 'Isi orneklemi',
                  value: '${result.heatSampleCount}',
                  color: const Color(0xFF5A6C7D),
                ),
                const SizedBox(height: 18),
                BentoGrid(
                  children: [
                    BentoTile(
                      child: SectionCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Risk faktorleri', style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: 14),
                            ...result.factors.entries.map(
                              (entry) => Padding(
                                padding: const EdgeInsets.only(bottom: 14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(entry.key, maxLines: 2, overflow: TextOverflow.ellipsis),
                                        ),
                                        const SizedBox(width: 8),
                                        Text('%${(entry.value * 100).round()}'),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(99),
                                      child: LinearProgressIndicator(
                                        minHeight: 10,
                                        value: entry.value,
                                        backgroundColor: AppTheme.mist,
                                        color: entry.value > 0.75 ? const Color(0xFFE15B64) : AppTheme.teal,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const Divider(height: 32),
                            Text('Motor ozeti', style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: 10),
                            Text(result.summary.replaceAll('\n', '\n\n')),
                          ],
                        ),
                      ),
                    ),
                    BentoTile(
                      child: SectionCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Yakin faylar', style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: 12),
                            ...result.nearbyFaults.map(
                              (fault) => ListTile(
                                leading: const Icon(Icons.timeline, color: AppTheme.accent),
                                title: Text(fault),
                                subtitle: Text('${result.city} merkezine gore siralandi'),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text('Yakin olaylar', style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: 12),
                            if (result.recentEvents.isEmpty)
                              const Text('Bu alan icin son deprem kaydi bulunamadi.'),
                            ...result.recentEvents.map(
                              (event) => ListTile(
                                leading: const Icon(Icons.warning_amber_rounded, color: Color(0xFFE15B64)),
                                title: Text(event),
                                subtitle: const Text('150 km icindeki en yeni kayitlardan'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _RiskMapFullScreenPage extends StatelessWidget {
  const _RiskMapFullScreenPage({required this.result});

  final RiskModuleResult result;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Risk Haritasi')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
          child: RiskMapPanel(
            title: 'Fay ve olay katmani',
            city: result.city,
            result: result,
            showHeatmapMode: false,
            height: MediaQuery.of(context).size.height - 70,
          ),
        ),
      ),
    );
  }
}
