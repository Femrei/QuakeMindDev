import 'package:flutter/material.dart';

import '../../data/mock_data.dart';
import '../../models/risk_module_result.dart';
import '../../services/risk_module_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/tactical/hero_stat_band.dart';
import '../../widgets/tactical/ops_panel.dart';

class SurvivorRiskPage extends StatefulWidget {
  const SurvivorRiskPage({super.key});

  @override
  State<SurvivorRiskPage> createState() => _SurvivorRiskPageState();
}

class _SurvivorRiskPageState extends State<SurvivorRiskPage> {
  static const _service = RiskModuleService();
  String _city = turkeyCities.first;
  late Future<RiskModuleResult> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.fetchCityRisk(_city);
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
      children: [
        FutureBuilder<RiskModuleResult>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const HeroStatBand(
                title: 'Bolgemdeki Deprem Riski',
                headline: 'HESAPLANIYOR...',
                subtitle: 'Sehir sec, guncel risk seviyesini ve yakin faylari gor.',
                beaconLabel: 'ISLENIYOR',
                beaconColor: AppTheme.neonAmber,
                beaconLive: true,
              );
            }
            if (snapshot.hasError || !snapshot.hasData) {
              return HeroStatBand(
                title: 'Bolgemdeki Deprem Riski',
                headline: 'VERI ALINAMADI',
                headlineColor: AppTheme.danger,
                subtitle: 'Risk verisi alinamadi: ${snapshot.error ?? "bilinmeyen hata"}',
                variant: OpsPanelVariant.alert,
                accentColor: AppTheme.danger,
                beaconLabel: 'HATA',
                beaconColor: AppTheme.danger,
              );
            }
            final result = snapshot.data!;
            return HeroStatBand(
              title: 'Bolgemdeki Deprem Riski - $_city',
              headline: result.riskScore.toStringAsFixed(1),
              headlineColor: const Color(0xFFE15B64),
              subtitle: 'Risk seviyesi: ${result.riskLevel}',
              variant: OpsPanelVariant.hero,
              accentColor: const Color(0xFFE15B64),
            );
          },
        ),
        const SizedBox(height: 18),
        DropdownButtonFormField<String>(
          initialValue: _city,
          items: turkeyCities.map((value) => DropdownMenuItem(value: value, child: Text(value))).toList(),
          onChanged: (value) {
            if (value == null) return;
            setState(() {
              _city = value;
              _future = _service.fetchCityRisk(_city);
            });
          },
          decoration: const InputDecoration(labelText: 'Sehir sec'),
        ),
        const SizedBox(height: 18),
        FutureBuilder<RiskModuleResult>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done || snapshot.hasError || !snapshot.hasData) {
              return const SizedBox.shrink();
            }
            final result = snapshot.data!;
            return OpsPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Yakin faylar', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 10),
                  ...result.nearbyFaults.map(
                    (fault) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.timeline, color: AppTheme.accent),
                      title: Text(fault),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
