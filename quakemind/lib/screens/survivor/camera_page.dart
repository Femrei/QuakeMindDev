import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../widgets/live_camera_view.dart';
import '../../widgets/tactical/ops_panel.dart';
import '../../widgets/tactical/status_beacon.dart';
import '../../widgets/tactical/telemetry_tile.dart';

class SurvivorCameraPage extends StatefulWidget {
  const SurvivorCameraPage({super.key});

  @override
  State<SurvivorCameraPage> createState() => _SurvivorCameraPageState();
}

class _SurvivorCameraPageState extends State<SurvivorCameraPage> {
  CameraDetectionMode _mode = CameraDetectionMode.crack;
  CameraDetectionTick? _latest;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
      children: [
        OpsPanel(
          variant: OpsPanelVariant.live,
          color: AppTheme.survivorAccent,
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('Catlak / Enkaz Tarama', style: Theme.of(context).textTheme.titleLarge),
                  ),
                  StatusBeacon(label: 'CANLI', color: AppTheme.neonCyan, live: true),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Kamerani bina veya duvara dogrult, cihaz uzerinde AI taramasi calisir.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 320,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(22),
                  child: LiveCameraView(
                    detectionMode: _mode,
                    preferFrontCamera: false,
                    onDetection: (tick) => setState(() => _latest = tick),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              TelemetryMetricTile(
                label: 'Son guven skoru',
                value: _latest == null ? '-' : '%${(_latest!.confidence * 100).round()}',
                color: const Color(0xFF7CC6FE),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SegmentedButton<CameraDetectionMode>(
            segments: const [
              ButtonSegment(value: CameraDetectionMode.crack, label: Text('Catlak Tespiti'), icon: Icon(Icons.crisis_alert)),
              ButtonSegment(value: CameraDetectionMode.debris, label: Text('Enkaz Tespiti'), icon: Icon(Icons.apartment)),
            ],
            selected: {_mode},
            onSelectionChanged: (value) => setState(() => _mode = value.first),
          ),
        ),
      ],
    );
  }
}
