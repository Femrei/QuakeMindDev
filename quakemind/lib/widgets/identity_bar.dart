import 'package:flutter/material.dart';

import '../services/auth_controller.dart';
import '../theme/app_theme.dart';

/// Compact header row showing the logged-in user's name/unit and a logout
/// action -- shown at the top of both role shells so it's always clear
/// which account is active, matching the web navbar's identity chip.
class IdentityBar extends StatelessWidget {
  const IdentityBar({super.key, required this.accentColor});

  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    final user = AuthController.instance.user;
    if (user == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(11),
              border: Border.all(color: accentColor.withValues(alpha: 0.55)),
              boxShadow: [
                BoxShadow(color: accentColor.withValues(alpha: 0.25), blurRadius: 12),
              ],
            ),
            alignment: Alignment.center,
            child: Text(
              user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
              style: AppTheme.telemetryStyle(fontSize: 16, color: accentColor),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                if (user.unit != null)
                  Text(
                    user.unit!.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 10.5,
                      letterSpacing: 0.5,
                      fontWeight: FontWeight.w700,
                      color: accentColor.withValues(alpha: 0.85),
                    ),
                  ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Cikis Yap',
            onPressed: () => AuthController.instance.logout(),
            icon: const Icon(Icons.power_settings_new, size: 20, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }
}
