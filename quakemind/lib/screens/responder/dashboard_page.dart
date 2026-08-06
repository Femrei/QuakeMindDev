import 'package:flutter/material.dart';

import '../../data/mock_data.dart';
import '../../services/server_status_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_widgets.dart';
import '../../widgets/ip_config_dialog.dart';
import '../../widgets/tactical/bento_grid.dart';
import '../../widgets/tactical/hero_stat_band.dart';
import '../../widgets/tactical/ops_panel.dart';
import '../../widgets/tactical/status_beacon.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key, required this.onOpenModule});

  final ValueChanged<int> onOpenModule;

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  static const _statusService = ServerStatusService();
  ServerStatus? _status;
  bool _checking = false;
  bool _showInstructions = false;

  @override
  void initState() {
    super.initState();
    _checkConnection();
  }

  Future<void> _checkConnection() async {
    setState(() => _checking = true);
    final status = await _statusService.checkStatus();
    if (mounted) {
      setState(() {
        _status = status;
        _checking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOnline = _status?.isOnline ?? false;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
      children: [
        HeroStatBand(
          title: 'Sistem Durumu',
          headline: isOnline ? 'OPERASYONEL' : 'BAGLANTI YOK',
          headlineColor: isOnline ? AppTheme.teal : AppTheme.danger,
          subtitle: isOnline
              ? 'Tum moduller backend API uzerinden calismaya hazir.'
              : 'PC uzerinden hotspot ac, sunucuyu baslat ve telefonu bu hotspot\'a bagla.',
          variant: isOnline ? OpsPanelVariant.live : OpsPanelVariant.alert,
          accentColor: isOnline ? AppTheme.teal : AppTheme.danger,
          beaconLabel: isOnline ? 'CANLI' : 'CEVRIMDISI',
          beaconColor: isOnline ? AppTheme.teal : AppTheme.danger,
          beaconLive: isOnline,
          action: Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              if (_status != null) ...[
                StatusBeacon(
                  label: _status!.riskReady ? 'Risk Hazir' : 'Risk Yuklenemedi',
                  color: _status!.riskReady ? AppTheme.teal : AppTheme.neonAmber,
                ),
                StatusBeacon(
                  label: _status!.nlpReady ? 'NLP Hazir' : 'NLP Yuklenemedi',
                  color: _status!.nlpReady ? AppTheme.teal : AppTheme.neonAmber,
                ),
                StatusBeacon(
                  label: _status!.roadDamageReady ? 'Uydu Hazir' : 'Uydu Yuklenemedi',
                  color: _status!.roadDamageReady ? AppTheme.teal : AppTheme.neonAmber,
                ),
              ],
              OutlinedButton.icon(
                onPressed: () async {
                  await showDialog(context: context, builder: (_) => const IpConfigDialog());
                  _checkConnection();
                },
                icon: const Icon(Icons.settings_ethernet),
                label: const Text('Sunucu Ayari'),
              ),
              OutlinedButton.icon(
                onPressed: _checking ? null : _checkConnection,
                icon: _checking
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.refresh),
                label: const Text('Baglantiyi Test Et'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        BentoGrid(
          children: List.generate(moduleSummaries.length, (index) {
            final module = moduleSummaries[index];
            return BentoTile(
              colSpan: 1,
              child: SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: module.color.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: module.color.withValues(alpha: 0.4)),
                          ),
                          child: Icon(module.icon, color: module.color),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(module.title, style: Theme.of(context).textTheme.titleMedium),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(module.subtitle, style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 14),
                    _moduleStatusPill(index),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: module.highlights
                          .map((item) => Chip(label: Text(item), backgroundColor: AppTheme.sand))
                          .toList(),
                    ),
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerRight,
                      child: FilledButton(
                        onPressed: () => widget.onOpenModule(index + 1),
                        child: const Text('Modulu Ac'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 18),
        _buildInstructionsPanel(),
      ],
    );
  }

  Widget _moduleStatusPill(int index) {
    if (_status == null) {
      return StatusBeacon(label: moduleSummaries[index].status, color: moduleSummaries[index].color);
    }

    final s = _status!;
    bool ready;
    switch (index) {
      case 0: // Risk
        ready = s.riskReady;
        break;
      case 1: // Road Damage
        ready = s.roadDamageReady;
        break;
      case 2: // NLP
        ready = s.nlpReady;
        break;
      default: // Camera - local
        ready = true;
    }

    if (!s.isOnline) {
      return const StatusBeacon(label: 'Sunucu baglantisi yok', color: AppTheme.danger);
    }

    return StatusBeacon(
      label: ready ? 'Backend bagli - Hazir' : 'Modul yuklenemedi',
      color: ready ? AppTheme.teal : AppTheme.neonAmber,
      live: ready,
    );
  }

  Widget _buildInstructionsPanel() {
    return OpsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () => setState(() => _showInstructions = !_showInstructions),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: AppTheme.neonCyan, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text('Kullanim Talimati', style: Theme.of(context).textTheme.titleLarge),
                ),
                Icon(
                  _showInstructions ? Icons.expand_less : Icons.expand_more,
                  color: AppTheme.textSecondary,
                ),
              ],
            ),
          ),
          if (_showInstructions) ...[
            const SizedBox(height: 12),
            const _InstructionStep(
              number: '1',
              text: 'Bilgisayarda hotspot ac (Linux: nm-connection-editor, Windows: Mobil etkin nokta)',
            ),
            const _InstructionStep(
              number: '2',
              text: 'Bilgisayarda: python3 fastapi_app.py komutu ile sunucuyu baslat',
            ),
            const _InstructionStep(number: '3', text: 'Telefonu bilgisayarin hotspot\'una bagla'),
            const _InstructionStep(
              number: '4',
              text: 'Sunucu Ayari\'ndan PC IP\'sini gir (Linux: 10.42.0.1:8000, Windows: 192.168.137.1:8000)',
            ),
            const _InstructionStep(
              number: '5',
              text: 'Baglantiyi Test Et ile dogrula, sonra modulleri kullanmaya basla',
            ),
          ],
        ],
      ),
    );
  }
}

class _InstructionStep extends StatelessWidget {
  const _InstructionStep({required this.number, required this.text});

  final String number;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: AppTheme.teal.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(99),
            ),
            alignment: Alignment.center,
            child: Text(
              number,
              style: const TextStyle(color: AppTheme.teal, fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
