import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../widgets/emergency_banner.dart';
import '../../widgets/identity_bar.dart';
import '../../widgets/tactical/scan_background.dart';
import '../../widgets/tactical/tactical_dock.dart';
import '../../widgets/tactical/tactical_page_switcher.dart';
import '../unified_map_screen.dart';
import 'assembly_page.dart';
import 'camera_page.dart';
import 'risk_page.dart';
import 'sos_page.dart';

/// Citizen-facing shell: SOS front and center, plus lightweight risk info
/// and an on-device crack/debris camera scanner. Deliberately smaller than
/// ResponderShell -- a survivor doesn't need satellite/NLP/ops tooling,
/// mirroring the web app's /survivor vs /command split.
class SurvivorShell extends StatefulWidget {
  const SurvivorShell({super.key});

  @override
  State<SurvivorShell> createState() => _SurvivorShellState();
}

class _SurvivorShellState extends State<SurvivorShell> {
  int _index = 0;

  static const _dockItems = [
    TacticalDockItem(icon: Icons.emergency_outlined, label: 'SOS'),
    TacticalDockItem(icon: Icons.shield_outlined, label: 'Toplanma'),
    TacticalDockItem(icon: Icons.public, label: 'Risk'),
    TacticalDockItem(icon: Icons.videocam_outlined, label: 'Kamera'),
    TacticalDockItem(icon: Icons.route_outlined, label: 'Harita'),
  ];

  @override
  Widget build(BuildContext context) {
    final pages = const [
      SurvivorSosPage(),
      SurvivorAssemblyPage(),
      SurvivorRiskPage(),
      SurvivorCameraPage(),
      UnifiedMapScreen(isResponder: false),
    ];

    return Scaffold(
      body: ScanBackground(
        radarColor: AppTheme.survivorAccent,
        child: SafeArea(
          child: Column(
            children: [
              const IdentityBar(accentColor: AppTheme.survivorAccent),
              const EmergencyBanner(),
              Expanded(
                child: TacticalPageSwitcher(index: _index, child: pages[_index]),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: TacticalDock(
        items: _dockItems,
        selectedIndex: _index,
        onSelected: (value) => setState(() => _index = value),
        accentColor: AppTheme.survivorAccent,
      ),
    );
  }
}
