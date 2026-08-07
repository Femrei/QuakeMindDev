import 'package:flutter/material.dart';

import '../../data/mock_data.dart';
import '../../theme/app_theme.dart';
import '../../widgets/emergency_banner.dart';
import '../../widgets/identity_bar.dart';
import '../../widgets/tactical/scan_background.dart';
import '../../widgets/tactical/tactical_dock.dart';
import '../../widgets/tactical/tactical_page_switcher.dart';
import '../../widgets/team_chat_sheet.dart';
import '../unified_map_screen.dart';
import 'camera_page.dart';
import 'dashboard_page.dart';
import 'incoming_sos_page.dart';
import 'nlp_page.dart';
import 'risk_page.dart';
import 'road_damage_page.dart';

/// Responder/admin command shell: full operational tool set (dashboard,
/// incoming SOS queue, risk, satellite road damage, NLP, camera) plus the
/// floating team-chat overlay. Survivors get SurvivorShell instead.
class ResponderShell extends StatefulWidget {
  const ResponderShell({super.key});

  @override
  State<ResponderShell> createState() => _ResponderShellState();
}

class _ResponderShellState extends State<ResponderShell> {
  int _index = 0;
  String _selectedCity = turkeyCities.first;
  String _selectedRoadCity = roadCities.first;
  String _selectedSource = 'OpenAerialMap';
  String _selectedSample = nlpSamples.first;
  double _damageBooster = 3.5;
  double _threshold = 0.40;
  bool _useImagenetNorm = true;
  int _postProcessLevel = 2;

  static const _dockItems = [
    TacticalDockItem(icon: Icons.dashboard_customize_outlined, label: 'Panel'),
    TacticalDockItem(icon: Icons.public, label: 'Risk'),
    TacticalDockItem(icon: Icons.satellite_alt_outlined, label: 'Uydu'),
    TacticalDockItem(icon: Icons.crisis_alert_outlined, label: 'NLP'),
    TacticalDockItem(icon: Icons.videocam_outlined, label: 'Kamera'),
    TacticalDockItem(icon: Icons.emergency_outlined, label: 'Cagrilar'),
    TacticalDockItem(icon: Icons.route_outlined, label: 'Harita'),
  ];

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      DashboardPage(onOpenModule: _openModule),
      RiskPage(
        city: _selectedCity,
        onCityChanged: (value) => setState(() => _selectedCity = value!),
      ),
      RoadDamagePage(
        city: _selectedRoadCity,
        source: _selectedSource,
        damageBooster: _damageBooster,
        threshold: _threshold,
        useImagenetNorm: _useImagenetNorm,
        postProcessLevel: _postProcessLevel,
        onCityChanged: (value) => setState(() => _selectedRoadCity = value!),
        onSourceChanged: (value) => setState(() => _selectedSource = value!),
        onDamageBoosterChanged: (value) => setState(() => _damageBooster = value),
        onThresholdChanged: (value) => setState(() => _threshold = value),
        onNormalizationChanged: (value) => setState(() => _useImagenetNorm = value),
        onPostProcessChanged: (value) => setState(() => _postProcessLevel = value),
      ),
      NlpPage(
        sample: _selectedSample,
        onSampleChanged: (value) => setState(() => _selectedSample = value!),
      ),
      const CameraPage(),
      const IncomingSosPage(),
      const UnifiedMapScreen(isResponder: true),
    ];

    return Scaffold(
      body: ScanBackground(
        child: Stack(
          children: [
            SafeArea(
              child: Column(
                children: [
                  const IdentityBar(accentColor: AppTheme.responderAccent),
                  const EmergencyBanner(),
                  Expanded(
                    child: TacticalPageSwitcher(index: _index, child: pages[_index]),
                  ),
                ],
              ),
            ),
            const TeamChatOverlay(),
          ],
        ),
      ),
      bottomNavigationBar: TacticalDock(
        items: _dockItems,
        selectedIndex: _index,
        onSelected: (value) => setState(() => _index = value),
        accentColor: AppTheme.responderAccent,
      ),
    );
  }

  void _openModule(int index) {
    setState(() => _index = index);
  }
}
