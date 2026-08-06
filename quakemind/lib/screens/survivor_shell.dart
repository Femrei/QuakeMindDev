import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../data/mock_data.dart';
import '../models/risk_module_result.dart';
import '../services/assembly_service.dart';
import '../services/auth_controller.dart';
import '../services/risk_module_service.dart';
import '../services/sos_service.dart';
import '../models/sos_alert_result.dart';
import '../theme/app_theme.dart';
import '../widgets/app_widgets.dart';
import '../widgets/emergency_banner.dart';
import '../widgets/identity_bar.dart';
import '../widgets/live_camera_view.dart';
import 'unified_map_screen.dart';

/// Citizen-facing shell: SOS front and center, plus lightweight risk info
/// and an on-device crack/debris camera scanner. Deliberately smaller than
/// [ResponderShell] -- a survivor doesn't need satellite/NLP/ops tooling,
/// mirroring the web app's /survivor vs /command split.
class SurvivorShell extends StatefulWidget {
  const SurvivorShell({super.key});

  @override
  State<SurvivorShell> createState() => _SurvivorShellState();
}

class _SurvivorShellState extends State<SurvivorShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = const [
      _SurvivorSosPage(),
      _SurvivorAssemblyPage(),
      _SurvivorRiskPage(),
      _SurvivorCameraPage(),
      UnifiedMapScreen(isResponder: false),
    ];

    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.bg, Color(0xFF2A0F12), Color(0xFF0A1220)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                const IdentityBar(accentColor: Color(0xFFE15B64)),
                const EmergencyBanner(),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 220),
                    child: KeyedSubtree(key: ValueKey(_index), child: pages[_index]),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        minimum: const EdgeInsets.fromLTRB(14, 0, 14, 12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.panelHigh.withValues(alpha: 0.48),
                    AppTheme.panel.withValues(alpha: 0.34),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppTheme.glassStroke),
              ),
              child: NavigationBar(
                selectedIndex: _index,
                onDestinationSelected: (value) => setState(() => _index = value),
                indicatorColor: const Color(0x2EE15B64),
                destinations: const [
                  NavigationDestination(icon: Icon(Icons.sos), label: 'SOS'),
                  NavigationDestination(icon: Icon(Icons.shield), label: 'Toplanma'),
                  NavigationDestination(icon: Icon(Icons.public), label: 'Risk'),
                  NavigationDestination(icon: Icon(Icons.videocam), label: 'Kamera'),
                  NavigationDestination(icon: Icon(Icons.map), label: 'Harita'),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// SOS
// ---------------------------------------------------------------------------

enum _SosStatus { idle, locating, sending, sent, locationError, sendError }

class _SurvivorSosPage extends StatefulWidget {
  const _SurvivorSosPage();

  @override
  State<_SurvivorSosPage> createState() => _SurvivorSosPageState();
}

enum _SosUrgency { critical, high, normal }

class _SurvivorSosPageState extends State<_SurvivorSosPage> {
  static const _service = SosService();

  _SosStatus _status = _SosStatus.idle;
  Position? _position;
  String? _errorMessage;
  SosAlertResult? _lastAlert;

  final TextEditingController _noteController = TextEditingController();
  int _victimCount = 1;
  _SosUrgency _urgency = _SosUrgency.high;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  String _urgencyLabel(_SosUrgency value) {
    switch (value) {
      case _SosUrgency.critical:
        return 'KRITIK';
      case _SosUrgency.high:
        return 'YUKSEK';
      case _SosUrgency.normal:
        return 'NORMAL';
    }
  }

  Future<void> _triggerSos() async {
    setState(() {
      _status = _SosStatus.locating;
      _errorMessage = null;
    });

    final position = await _resolvePosition();
    if (position == null) return;

    setState(() {
      _position = position;
      _status = _SosStatus.sending;
    });

    try {
      final user = AuthController.instance.user;
      final note = _noteController.text.trim();
      final message =
          '[KISI SAYISI: $_victimCount] [ACILIYET: ${_urgencyLabel(_urgency)}]'
          '${note.isEmpty ? '' : ' $note'}';
      final result = await _service.sendAlert(
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        message: message,
        userId: user?.id,
      );
      if (!mounted) return;
      setState(() {
        _lastAlert = result;
        _status = _SosStatus.sent;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _status = _SosStatus.sendError;
      });
    }
  }

  Future<Position?> _resolvePosition() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _errorMessage = 'Konum servisi kapali. Lutfen GPS\'i acin.';
          _status = _SosStatus.locationError;
        });
        return null;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        setState(() {
          _errorMessage = 'Konum izni verilmedi.';
          _status = _SosStatus.locationError;
        });
        return null;
      }
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
    } catch (e) {
      setState(() {
        _errorMessage = 'Konum alinirken hata: $e';
        _status = _SosStatus.locationError;
      });
      return null;
    }
  }

  String _statusLabel() {
    switch (_status) {
      case _SosStatus.idle:
        return 'Acil durumda butona bas. Konumun otomatik olarak alinir.';
      case _SosStatus.locating:
        return 'Konumun aliniyor...';
      case _SosStatus.sending:
        return 'Konum alindi, ekiplere gonderiliyor...';
      case _SosStatus.sent:
        return 'Uyarin arama kurtarma ekibine ulasti.';
      case _SosStatus.locationError:
        return 'Konum alinamadi.';
      case _SosStatus.sendError:
        return 'Konum alindi ama sunucuya gonderilemedi.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isBusy = _status == _SosStatus.locating || _status == _SosStatus.sending;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
      children: [
        Text('Acil Durum SOS', style: Theme.of(context).textTheme.displaySmall),
        const SizedBox(height: 8),
        Text(
          'Butona bastiginda konumun otomatik alinir ve en yakin ekibe gonderilir.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 24),
        SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Bulundugun yerde kac kisi var?', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [1, 2, 3, 4, 5].map((count) {
                  final selected = _victimCount == count;
                  return ChoiceChip(
                    label: Text('$count Kisi'),
                    selected: selected,
                    onSelected: isBusy ? null : (_) => setState(() => _victimCount = count),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),
              Text('Aciliyet durumu', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: SegmentedButton<_SosUrgency>(
                  segments: const [
                    ButtonSegment(value: _SosUrgency.critical, label: Text('Enkaz Alti / Kritik')),
                    ButtonSegment(value: _SosUrgency.high, label: Text('Yarali Var / Acil')),
                    ButtonSegment(value: _SosUrgency.normal, label: Text('Guvenli / Ihtiyac')),
                  ],
                  selected: {_urgency},
                  onSelectionChanged: isBusy
                      ? null
                      : (value) => setState(() => _urgency = value.first),
                ),
              ),
              const SizedBox(height: 18),
              Text('Aciklama / adres detayi (opsiyonel)', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              TextField(
                controller: _noteController,
                enabled: !isBusy,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Bina adi, kat numarasi veya acil durum notunuzu yazin...',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Center(
          child: GestureDetector(
            onTap: isBusy ? null : _triggerSos,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFE15B64).withValues(alpha: isBusy ? 0.45 : 0.92),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFE15B64).withValues(alpha: 0.5),
                    blurRadius: 40,
                    spreadRadius: 6,
                  ),
                ],
                border: Border.all(color: Colors.white, width: 4),
              ),
              alignment: Alignment.center,
              child: isBusy
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.sos, color: Colors.white, size: 48),
                        SizedBox(height: 8),
                        Text(
                          'SOS GONDER',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.4,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: Text(
            _statusLabel(),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
        ),
        const SizedBox(height: 24),
        if (_errorMessage != null)
          SectionCard(
            color: const Color(0xFF4A1C1C),
            child: Text(_errorMessage!, style: const TextStyle(color: Colors.white)),
          ),
        if (_status == _SosStatus.sent && _lastAlert != null) ...[
          SectionCard(
            color: const Color(0xFF1C3A2E),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.check_circle, color: AppTheme.teal),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'SOS uyarin ulasti',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Uyari ID: ${_lastAlert!.id}'),
                Text('Alinma zamani: ${_lastAlert!.receivedAt}'),
              ],
            ),
          ),
          const SizedBox(height: 18),
        ],
        if (_position != null)
          GeoPointsMapPanel(
            title: 'Gonderilen Konum',
            subtitle: 'GPS\'ten alinan enlem/boylam.',
            markers: [
              GeoMarkerData(
                latitude: _position!.latitude,
                longitude: _position!.longitude,
                label: '${_position!.latitude.toStringAsFixed(5)}, ${_position!.longitude.toStringAsFixed(5)}',
                highlight: true,
              ),
            ],
            height: 300,
          ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Nearest assembly / gathering point + route
// ---------------------------------------------------------------------------

class _SurvivorAssemblyPage extends StatefulWidget {
  const _SurvivorAssemblyPage();

  @override
  State<_SurvivorAssemblyPage> createState() => _SurvivorAssemblyPageState();
}

class _SurvivorAssemblyPageState extends State<_SurvivorAssemblyPage> {
  static const _service = AssemblyService();

  Position? _position;
  AssemblyRouteResult? _result;
  String? _error;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _error = 'Konum servisi kapali. Lutfen GPS\'i acin.';
          _loading = false;
        });
        return;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        setState(() {
          _error = 'Konum izni verilmedi.';
          _loading = false;
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      final result = await _service.nearestAssembly(
        latitude: position.latitude,
        longitude: position.longitude,
      );

      if (!mounted) return;
      setState(() {
        _position = position;
        _result = result;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Toplanma alani bilgisi alinamadi: $e';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final nearest = _result?.nearest;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
      children: [
        Text('En Yakin Toplanma Alani', style: Theme.of(context).textTheme.displaySmall),
        const SizedBox(height: 8),
        Text(
          'Konumuna en yakin guvenli AFAD toplanma alani ve yururke rota.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 18),
        if (_loading)
          const SectionCard(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            ),
          )
        else if (_error != null)
          SectionCard(
            color: const Color(0xFF4A1C1C),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_error!, style: const TextStyle(color: Colors.white)),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _load,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Tekrar dene'),
                ),
              ],
            ),
          )
        else if (nearest != null && _position != null) ...[
          SectionCard(
            color: const Color(0xFF1C3A2E),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.shield, color: AppTheme.teal),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(nearest.name, style: Theme.of(context).textTheme.titleLarge),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (nearest.capacity != null) Text('Kapasite: ${nearest.capacity}'),
                if (nearest.status != null) Text('Durum: ${nearest.status}'),
                if (_result?.routeLengthM != null)
                  Text(
                    'Rota uzunlugu: ${(_result!.routeLengthM! / 1000).toStringAsFixed(2)} km '
                    '(~${(_result!.routeLengthM! / 80).round()} dk yuruyus)',
                  ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          RoutePlanMapPanel(
            title: 'Toplanma alanina rota',
            subtitle: 'Yesil hat: en yakin guvenli alana yuruyus rotasi.',
            userLatitude: _position!.latitude,
            userLongitude: _position!.longitude,
            destinationLatitude: nearest.latitude,
            destinationLongitude: nearest.longitude,
            destinationLabel: nearest.name,
            routePoints: _result?.routeCoords ?? const [],
            height: 340,
          ),
          const SizedBox(height: 18),
          if ((_result?.records.length ?? 0) > 1)
            SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Yakin diger toplanma alanlari', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 10),
                  ..._result!.records.take(6).map(
                        (item) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.place, color: AppTheme.teal),
                          title: Text(item.name),
                          subtitle: item.distanceMeters != null
                              ? Text('${(item.distanceMeters! / 1000).toStringAsFixed(2)} km')
                              : null,
                        ),
                      ),
                ],
              ),
            ),
        ] else
          SectionCard(
            child: Column(
              children: [
                const Icon(Icons.shield_outlined, size: 38, color: AppTheme.teal),
                const SizedBox(height: 12),
                const Text(
                  'Yakinda kayitli bir toplanma alani bulunamadi.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _load,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Tekrar dene'),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Risk (read-only, simplified)
// ---------------------------------------------------------------------------

class _SurvivorRiskPage extends StatefulWidget {
  const _SurvivorRiskPage();

  @override
  State<_SurvivorRiskPage> createState() => _SurvivorRiskPageState();
}

class _SurvivorRiskPageState extends State<_SurvivorRiskPage> {
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
        Text('Bolgemdeki Deprem Riski', style: Theme.of(context).textTheme.displaySmall),
        const SizedBox(height: 8),
        Text(
          'Sehir sec, guncel risk seviyesini ve yakin faylari gor.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 18),
        DropdownButtonFormField<String>(
          initialValue: _city,
          items: turkeyCities
              .map((value) => DropdownMenuItem(value: value, child: Text(value)))
              .toList(),
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
            if (snapshot.connectionState != ConnectionState.done) {
              return const SectionCard(
                child: Center(child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(),
                )),
              );
            }
            if (snapshot.hasError || !snapshot.hasData) {
              return SectionCard(
                child: Text(
                  'Risk verisi alinamadi: ${snapshot.error ?? "bilinmeyen hata"}',
                ),
              );
            }
            final result = snapshot.data!;
            return Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: MetricTile(
                        label: 'Risk skoru',
                        value: result.riskScore.toStringAsFixed(1),
                        color: const Color(0xFFE15B64),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: MetricTile(
                        label: 'Risk seviyesi',
                        value: result.riskLevel,
                        color: const Color(0xFFB24C63),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                SectionCard(
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
                ),
              ],
            );
          },
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Camera scan (debris / crack)
// ---------------------------------------------------------------------------

class _SurvivorCameraPage extends StatefulWidget {
  const _SurvivorCameraPage();

  @override
  State<_SurvivorCameraPage> createState() => _SurvivorCameraPageState();
}

class _SurvivorCameraPageState extends State<_SurvivorCameraPage> {
  CameraDetectionMode _mode = CameraDetectionMode.crack;
  CameraDetectionTick? _latest;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
      children: [
        Text('Catlak / Enkaz Tarama', style: Theme.of(context).textTheme.displaySmall),
        const SizedBox(height: 8),
        Text(
          'Kamerani bina veya duvara dogrult, cihaz uzerinde AI taramasi calisir.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 16),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SegmentedButton<CameraDetectionMode>(
            segments: const [
              ButtonSegment(
                value: CameraDetectionMode.crack,
                label: Text('Catlak Tespiti'),
                icon: Icon(Icons.crisis_alert),
              ),
              ButtonSegment(
                value: CameraDetectionMode.debris,
                label: Text('Enkaz Tespiti'),
                icon: Icon(Icons.apartment),
              ),
            ],
            selected: {_mode},
            onSelectionChanged: (value) => setState(() => _mode = value.first),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          height: 320,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: const LinearGradient(
              colors: [Color(0xFF1B1E28), Color(0xFF2B4257)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: LiveCameraView(
              detectionMode: _mode,
              preferFrontCamera: false,
              onDetection: (tick) => setState(() => _latest = tick),
            ),
          ),
        ),
        const SizedBox(height: 16),
        MetricTile(
          label: 'Son guven skoru',
          value: _latest == null ? '-' : '%${(_latest!.confidence * 100).round()}',
          color: const Color(0xFF7CC6FE),
        ),
      ],
    );
  }
}
