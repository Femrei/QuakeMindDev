import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import 'ops_panel.dart';
import 'status_beacon.dart';

class HeroStat {
  const HeroStat({required this.label, required this.value, this.color = AppTheme.neonCyan});

  final String label;
  final String value;
  final Color color;
}

/// The "primary element" for a tab: a big headline value/status plus a row
/// of compact stat chips beneath it, optionally with a trailing action
/// (e.g. "open on map") and a status beacon in the corner. Used as the top
/// band of every redesigned screen instead of the old uniform card stack.
class HeroStatBand extends StatelessWidget {
  const HeroStatBand({
    super.key,
    required this.title,
    required this.headline,
    this.subtitle,
    this.stats = const [],
    this.beaconLabel,
    this.beaconColor = AppTheme.teal,
    this.beaconLive = false,
    this.action,
    this.headlineColor = AppTheme.textPrimary,
    this.variant = OpsPanelVariant.hero,
    this.accentColor,
  });

  final String title;
  final String headline;
  final String? subtitle;
  final List<HeroStat> stats;
  final String? beaconLabel;
  final Color beaconColor;
  final bool beaconLive;
  final Widget? action;
  final Color headlineColor;
  final OpsPanelVariant variant;
  final Color? accentColor;

  @override
  Widget build(BuildContext context) {
    return OpsPanel(
      variant: variant,
      color: accentColor,
      padding: const EdgeInsets.fromLTRB(22, 20, 22, 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title.toUpperCase(),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    letterSpacing: 1.1,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              if (beaconLabel != null)
                StatusBeacon(label: beaconLabel!, color: beaconColor, live: beaconLive),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            headline,
            style: AppTheme.telemetryStyle(fontSize: 32, color: headlineColor),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 6),
            Text(subtitle!, style: Theme.of(context).textTheme.bodyMedium),
          ],
          if (stats.isNotEmpty) ...[
            const SizedBox(height: 16),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final stat in stats) ...[
                    _StatChip(stat: stat),
                    const SizedBox(width: 10),
                  ],
                ],
              ),
            ),
          ],
          if (action != null) ...[
            const SizedBox(height: 16),
            action!,
          ],
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.stat});

  final HeroStat stat;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.ink.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: stat.color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            stat.label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
          ),
          const SizedBox(height: 2),
          Text(stat.value, style: AppTheme.telemetryStyle(fontSize: 15, color: stat.color)),
        ],
      ),
    );
  }
}
