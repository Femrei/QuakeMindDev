import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../theme/tactical_motion.dart';
import '../../theme/tactical_textures.dart';

/// Outermost background layer for shells/full screens: the existing hero
/// gradient plus a faint fixed grid and (optionally) an ambient animated
/// scanline or radar sweep. Texture stays behind all content and never
/// crosses into a contrast range that would hurt readability.
class ScanBackground extends StatefulWidget {
  const ScanBackground({
    super.key,
    this.child,
    this.showScanline = false,
    this.showRadar = false,
    this.radarColor,
  });

  final Widget? child;
  final bool showScanline;
  final bool showRadar;
  final Color? radarColor;

  @override
  State<ScanBackground> createState() => _ScanBackgroundState();
}

class _ScanBackgroundState extends State<ScanBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: AppMotion.scan,
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
      child: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: const GridTexturePainter())),
          if (widget.showScanline)
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, _) => CustomPaint(
                  painter: ScanlinePainter(progress: _controller.value),
                ),
              ),
            ),
          if (widget.showRadar)
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, _) => CustomPaint(
                  painter: RadarSweepPainter(
                    angle: _controller.value * 6.28318,
                    color: widget.radarColor ?? AppTheme.neonCyan,
                  ),
                ),
              ),
            ),
          if (widget.child != null) Positioned.fill(child: widget.child!),
        ],
      ),
    );
  }
}
