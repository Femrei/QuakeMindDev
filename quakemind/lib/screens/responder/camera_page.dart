import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../widgets/app_widgets.dart';
import '../../widgets/live_camera_view.dart';
import '../../widgets/tactical/ops_panel.dart';
import '../../widgets/tactical/status_beacon.dart';
import '../../widgets/tactical/telemetry_tile.dart';

class CameraPage extends StatefulWidget {
  const CameraPage({super.key});

  @override
  State<CameraPage> createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> {
  String _cameraSource = 'Arka kamera';
  CameraDetectionMode _mode = CameraDetectionMode.debris;
  final List<CameraDetectionTick> _ticks = [];

  @override
  Widget build(BuildContext context) {
    final latest = _ticks.isNotEmpty ? _ticks.last : null;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
      children: [
        OpsPanel(
          variant: OpsPanelVariant.live,
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('Kamera Tespiti', style: Theme.of(context).textTheme.titleLarge),
                  ),
                  StatusBeacon(label: 'CANLI KAMERA', color: AppTheme.neonCyan, live: true),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 280,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(22),
                  child: LiveCameraView(
                    detectionMode: _mode,
                    preferFrontCamera: _cameraSource == 'On kamera',
                    onDetection: (tick) {
                      setState(() {
                        _ticks.add(tick);
                        if (_ticks.length > 30) {
                          _ticks.removeAt(0);
                        }
                      });
                    },
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: TelemetryMetricTile(
                      label: 'Son guven skoru',
                      value: latest == null ? '-' : '%${(latest.confidence * 100).round()}',
                      color: const Color(0xFF7CC6FE),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TelemetryMetricTile(
                      label: 'Toplam sinyal',
                      value: '${_ticks.length}',
                      color: AppTheme.neonAmber,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        OpsPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionTitle(
                title: 'Kamera ve model durumu',
                subtitle: 'Algilama modunu sec ve canli model skorunu takip et.',
              ),
              const SizedBox(height: 18),
              DropdownButtonFormField<String>(
                initialValue: _cameraSource,
                items: const [
                  DropdownMenuItem(value: 'Arka kamera', child: Text('Arka kamera')),
                  DropdownMenuItem(value: 'On kamera', child: Text('On kamera')),
                ],
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => _cameraSource = value);
                },
                decoration: const InputDecoration(labelText: 'Goruntu kaynagi'),
              ),
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: SegmentedButton<CameraDetectionMode>(
                  segments: const [
                    ButtonSegment(
                      value: CameraDetectionMode.debris,
                      label: Text('Enkaz Tespiti'),
                      icon: Icon(Icons.apartment),
                    ),
                    ButtonSegment(
                      value: CameraDetectionMode.crack,
                      label: Text('Catlak Tespiti'),
                      icon: Icon(Icons.crisis_alert),
                    ),
                  ],
                  selected: {_mode},
                  onSelectionChanged: (value) {
                    setState(() => _mode = value.first);
                  },
                ),
              ),
              const SizedBox(height: 14),
              const Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  StatusPill(label: 'assets/models/bina.tflite', color: Color(0xFFE15B64)),
                  StatusPill(label: 'assets/models/catlak.tflite', color: Color(0xFFF59F00)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        OpsPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Tespit akisi', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              if (_ticks.isEmpty)
                const Text('Henuz tespit sinyali yok. Kamera goruntusunu hedefe dogrultun.')
              else
                SizedBox(
                  height: 96,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _ticks.length > 10 ? 10 : _ticks.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 10),
                    itemBuilder: (context, index) {
                      final item = _ticks.reversed.toList()[index];
                      final severity = _severityFromConfidence(item.confidence);
                      final color = _severityColor(severity);
                      return Container(
                        width: 150,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.10),
                          border: Border.all(color: color.withValues(alpha: 0.4)),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.center_focus_strong, color: color, size: 16),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    item.mode == CameraDetectionMode.debris ? 'Enkaz' : 'Catlak',
                                    style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(_formatTime(item.detectedAt), style: const TextStyle(fontSize: 11)),
                            Text('Guven: %${(item.confidence * 100).round()}', style: const TextStyle(fontSize: 11)),
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
    );
  }

  static String _formatTime(DateTime dt) {
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    final ss = dt.second.toString().padLeft(2, '0');
    return '$hh:$mm:$ss';
  }

  static String _severityFromConfidence(double confidence) {
    if (confidence >= 0.75) return 'Yuksek';
    if (confidence >= 0.50) return 'Orta';
    return 'Dusuk';
  }

  static Color _severityColor(String severity) {
    switch (severity) {
      case 'Yuksek':
        return const Color(0xFFE15B64);
      case 'Orta':
        return const Color(0xFFF59F00);
      default:
        return AppTheme.teal;
    }
  }
}
