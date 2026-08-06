import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'tactical_palette.dart';

/// Faint fixed-pitch background grid, evoking a targeting/telemetry HUD.
/// Static (no animation) so it's cheap to keep behind every screen.
class GridTexturePainter extends CustomPainter {
  const GridTexturePainter({this.pitch = 28, this.color = TacticalPalette.gridLine});

  final double pitch;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1;
    for (double x = 0; x <= size.width; x += pitch) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y <= size.height; y += pitch) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant GridTexturePainter oldDelegate) =>
      oldDelegate.pitch != pitch || oldDelegate.color != color;
}

/// Animated horizontal sweep line with a fading trail, driven by an external
/// 0..1 [progress] value (typically from an [AnimationController]).
class ScanlinePainter extends CustomPainter {
  const ScanlinePainter({required this.progress, this.color = TacticalPalette.neonCyan});

  final double progress;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final y = size.height * progress;
    final rect = Rect.fromLTWH(0, math.max(0, y - 48), size.width, 48);
    final gradient = LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [color.withValues(alpha: 0), color.withValues(alpha: TacticalPalette.scanlineAlpha)],
    );
    final paint = Paint()..shader = gradient.createShader(rect);
    canvas.drawRect(rect, paint);
    canvas.drawLine(
      Offset(0, y),
      Offset(size.width, y),
      Paint()
        ..color = color.withValues(alpha: 0.5)
        ..strokeWidth = 1,
    );
  }

  @override
  bool shouldRepaint(covariant ScanlinePainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.color != color;
}

/// Rotating radial wedge + concentric rings, used behind location/tracking
/// heroes (Risk tab, SOS button, Toplanma) to reinforce a "detection" motif.
class RadarSweepPainter extends CustomPainter {
  const RadarSweepPainter({required this.angle, this.color = TacticalPalette.neonCyan});

  final double angle;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.shortestSide / 2;

    final ringPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = color.withValues(alpha: 0.14);
    for (final fraction in [0.35, 0.65, 1.0]) {
      canvas.drawCircle(center, radius * fraction, ringPaint);
    }

    final sweepGradient = SweepGradient(
      startAngle: 0,
      endAngle: math.pi / 2,
      colors: [color.withValues(alpha: 0.22), color.withValues(alpha: 0)],
      transform: GradientRotation(angle),
    );
    final sweepPaint = Paint()
      ..shader = sweepGradient.createShader(Rect.fromCircle(center: center, radius: radius));
    canvas.drawCircle(center, radius, sweepPaint);
  }

  @override
  bool shouldRepaint(covariant RadarSweepPainter oldDelegate) =>
      oldDelegate.angle != angle || oldDelegate.color != color;
}
