import 'package:flutter/material.dart';

import '../../theme/tactical_motion.dart';

/// Successor to `StatusPill`: same colored-pill API, plus an optional
/// pulsing dot for genuinely "live" states (connection ok, camera active,
/// SOS broadcasting) versus a static pill for terminal states.
class StatusBeacon extends StatefulWidget {
  const StatusBeacon({
    super.key,
    required this.label,
    required this.color,
    this.live = false,
  });

  final String label;
  final Color color;
  final bool live;

  @override
  State<StatusBeacon> createState() => _StatusBeaconState();
}

class _StatusBeaconState extends State<StatusBeacon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: AppMotion.scan,
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: widget.color.withValues(alpha: 0.14),
        border: Border.all(color: widget.color.withValues(alpha: 0.42)),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.live)
            AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                final t = _controller.value;
                return Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: widget.color,
                    boxShadow: [
                      BoxShadow(
                        color: widget.color.withValues(alpha: 0.55 * t + 0.15),
                        blurRadius: 6 * t + 2,
                        spreadRadius: 1.5 * t,
                      ),
                    ],
                  ),
                );
              },
            ),
          Flexible(
            child: Text(
              widget.label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: widget.color,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Non-animated convenience alias matching the old `StatusPill` call shape
/// exactly, for call sites that don't need the live pulse.
class StatusPillTile extends StatelessWidget {
  const StatusPillTile({super.key, required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) =>
      StatusBeacon(label: label, color: color);
}
