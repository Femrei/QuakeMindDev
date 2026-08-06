import 'package:flutter/material.dart';

import '../../services/sos_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_widgets.dart';
import '../../widgets/tactical/bento_grid.dart';
import '../../widgets/tactical/hero_stat_band.dart';
import '../../widgets/tactical/ops_panel.dart';
import 'shared/async_state_widgets.dart';

class IncomingSosPage extends StatefulWidget {
  const IncomingSosPage({super.key});

  @override
  State<IncomingSosPage> createState() => _IncomingSosPageState();
}

class _IncomingSosPageState extends State<IncomingSosPage> {
  static const _service = SosService();

  Future<List<SosAlertSummary>>? _future;

  @override
  void initState() {
    super.initState();
    _future = _service.fetchAlerts();
  }

  void _refresh() {
    setState(() {
      _future = _service.fetchAlerts();
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
      children: [
        FutureBuilder<List<SosAlertSummary>>(
          future: _future,
          builder: (context, snapshot) {
            final count = snapshot.data?.length ?? 0;
            final loading = snapshot.connectionState != ConnectionState.done;
            return HeroStatBand(
              title: 'Gelen SOS Cagrilari',
              headline: loading ? '...' : '$count',
              headlineColor: count > 0 ? AppTheme.danger : AppTheme.teal,
              subtitle: 'Sahadan gelen acil durum bildirimleri, backend uzerinden canli listelenir.',
              variant: count > 0 ? OpsPanelVariant.alert : OpsPanelVariant.live,
              accentColor: count > 0 ? AppTheme.danger : AppTheme.teal,
              beaconLabel: loading ? 'YUKLENIYOR' : (count > 0 ? 'AKTIF CAGRI' : 'TEMIZ'),
              beaconColor: count > 0 ? AppTheme.danger : AppTheme.teal,
              beaconLive: count > 0,
              action: Align(
                alignment: Alignment.centerLeft,
                child: OutlinedButton.icon(
                  onPressed: _refresh,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Listeyi Yenile'),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 18),
        FutureBuilder<List<SosAlertSummary>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const LoadingState(message: 'Gelen SOS cagrilari yukleniyor...');
            }
            if (snapshot.hasError) {
              return ErrorState(
                title: 'SOS listesi alinamadi',
                error: snapshot.error?.toString() ?? 'Bilinmeyen hata',
                onRetry: _refresh,
              );
            }
            final alerts = snapshot.data ?? const [];
            if (alerts.isEmpty) {
              return const SectionCard(
                child: Column(
                  children: [
                    Icon(Icons.check_circle_outline, size: 38, color: AppTheme.teal),
                    SizedBox(height: 14),
                    Text('Su anda bekleyen SOS cagrisi yok.', textAlign: TextAlign.center),
                  ],
                ),
              );
            }
            return Column(
              children: [
                GeoPointsMapPanel(
                  title: 'Cagri Konumlari',
                  subtitle: '${alerts.length} aktif cagri haritada isaretli.',
                  height: 320,
                  markers: alerts
                      .map(
                        (alert) => GeoMarkerData(
                          latitude: alert.latitude,
                          longitude: alert.longitude,
                          label: alert.message?.isNotEmpty == true ? alert.message! : 'SOS cagrisi',
                          highlight: true,
                        ),
                      )
                      .toList(),
                ),
                const SizedBox(height: 18),
                BentoGrid(
                  children: alerts
                      .map(
                        (alert) => BentoTile(
                          child: OpsPanel(
                            variant: OpsPanelVariant.alert,
                            color: AppTheme.danger,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.sos, color: AppTheme.danger),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        alert.message?.isNotEmpty == true ? alert.message! : 'Acil durum cagrisi',
                                        style: Theme.of(context).textTheme.titleMedium,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Konum: ${alert.latitude.toStringAsFixed(5)}, ${alert.longitude.toStringAsFixed(5)}'
                                  '${alert.accuracy != null ? " (dogruluk ~${alert.accuracy!.toStringAsFixed(0)} m)" : ""}',
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Alinma zamani: ${alert.receivedAt}',
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            );
          },
        ),
      ],
    );
  }
}
