import 'dart:async';

import 'package:flutter/material.dart';

import '../services/notifications_service.dart';
import '../theme/app_theme.dart';

/// Polls the backend for the latest broadcast emergency alert and shows a
/// dismissible banner atop the current shell, mirroring the web dashboard's
/// EmergencyNotificationBanner.
class EmergencyBanner extends StatefulWidget {
  const EmergencyBanner({super.key});

  @override
  State<EmergencyBanner> createState() => _EmergencyBannerState();
}

class _EmergencyBannerState extends State<EmergencyBanner> {
  static const _service = NotificationsService();

  EmergencyAlert? _alert;
  String? _dismissedId;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _poll();
    _timer = Timer.periodic(const Duration(seconds: 20), (_) => _poll());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _poll() async {
    final alert = await _service.fetchActive();
    if (!mounted) return;
    setState(() => _alert = alert);
  }

  Color _severityColor(String severity) {
    switch (severity) {
      case 'critical':
        return AppTheme.danger;
      case 'warning':
        return AppTheme.neonAmber;
      default:
        return AppTheme.neonCyan;
    }
  }

  @override
  Widget build(BuildContext context) {
    final alert = _alert;
    if (alert == null || alert.id == _dismissedId) {
      return const SizedBox.shrink();
    }
    final color = _severityColor(alert.severity);
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.ink.withValues(alpha: 0.55),
        border: Border.all(color: color.withValues(alpha: 0.55)),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: color.withValues(alpha: 0.28), blurRadius: 18)],
      ),
      child: Row(
        children: [
          Icon(Icons.campaign_outlined, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  alert.title,
                  style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 12.5),
                ),
                const SizedBox(height: 2),
                Text(
                  alert.body,
                  style: const TextStyle(fontSize: 11.5, color: AppTheme.textPrimary),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => setState(() => _dismissedId = alert.id),
            child: Icon(Icons.close, color: color, size: 16),
          ),
        ],
      ),
    );
  }
}
