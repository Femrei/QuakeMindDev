import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../models/sos_alert_result.dart';
import '../../services/auth_controller.dart';
import '../../services/sos_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_widgets.dart';
import '../../widgets/tactical/ops_panel.dart';
import '../../widgets/tactical/scan_background.dart';
import '../../widgets/tactical/status_beacon.dart';

enum _SosStatus { idle, locating, sending, sent, locationError, sendError }

class SurvivorSosPage extends StatefulWidget {
  const SurvivorSosPage({super.key});

  @override
  State<SurvivorSosPage> createState() => _SurvivorSosPageState();
}

enum _SosUrgency { critical, high, normal }

class _SurvivorSosPageState extends State<SurvivorSosPage> {
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
      final message = '[KISI SAYISI: $_victimCount] [ACILIYET: ${_urgencyLabel(_urgency)}]'
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
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
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
    final broadcasting = isBusy || _status == _SosStatus.sent;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
      children: [
        Row(
          children: [
            Expanded(
              child: Text('Acil Durum SOS', style: Theme.of(context).textTheme.displaySmall),
            ),
            StatusBeacon(
              label: broadcasting ? 'YAYINDA' : 'HAZIR',
              color: broadcasting ? AppTheme.danger : AppTheme.teal,
              live: broadcasting,
            ),
          ],
        ),
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
                  onSelectionChanged: isBusy ? null : (value) => setState(() => _urgency = value.first),
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
          child: SizedBox(
            width: 220,
            height: 220,
            child: Stack(
              alignment: Alignment.center,
              children: [
                if (broadcasting)
                  Positioned.fill(
                    child: ScanBackground(showRadar: true, radarColor: AppTheme.danger),
                  ),
                GestureDetector(
                  onTap: isBusy ? null : _triggerSos,
                  child: Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.danger.withValues(alpha: isBusy ? 0.45 : 0.92),
                      boxShadow: [
                        BoxShadow(color: AppTheme.danger.withValues(alpha: 0.5), blurRadius: 40, spreadRadius: 6),
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
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: Text(_statusLabel(), textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge),
        ),
        const SizedBox(height: 24),
        if (_errorMessage != null)
          OpsPanel(
            variant: OpsPanelVariant.alert,
            color: AppTheme.danger,
            child: Text(_errorMessage!, style: const TextStyle(color: Colors.white)),
          ),
        if (_status == _SosStatus.sent && _lastAlert != null) ...[
          OpsPanel(
            variant: OpsPanelVariant.live,
            color: AppTheme.teal,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.check_circle, color: AppTheme.teal),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text('SOS uyarin ulasti', style: Theme.of(context).textTheme.titleLarge),
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
