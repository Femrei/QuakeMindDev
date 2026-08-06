import 'dart:ui';

import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

enum OpsPanelVariant { standard, hero, alert, live }

/// Successor to the old `SectionCard` glass card: same frosted-blur base,
/// but with a hairline top-edge highlight, small HUD-style corner brackets,
/// and (for the hero/alert/live variants) a soft colored glow -- the "real
/// depth" the flat card-stack look was missing.
class OpsPanel extends StatelessWidget {
  const OpsPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.color,
    this.variant = OpsPanelVariant.standard,
    this.radius = 28,
  });

  final Widget child;
  final EdgeInsets padding;
  final Color? color;
  final OpsPanelVariant variant;
  final double radius;

  Color get _tint {
    switch (variant) {
      case OpsPanelVariant.hero:
        return color ?? AppTheme.accent;
      case OpsPanelVariant.alert:
        return color ?? AppTheme.danger;
      case OpsPanelVariant.live:
        return color ?? AppTheme.teal;
      case OpsPanelVariant.standard:
        return color ?? AppTheme.panelHigh;
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final baseTint = variant == OpsPanelVariant.standard
        ? (color ?? scheme.surfaceContainerHigh)
        : _tint;
    final glow = variant == OpsPanelVariant.standard ? null : _tint;

    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                baseTint.withValues(alpha: 0.42),
                AppTheme.panel.withValues(alpha: 0.30),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(
              color: glow != null
                  ? glow.withValues(alpha: 0.5)
                  : AppTheme.glassStroke,
              width: variant == OpsPanelVariant.standard ? 1 : 1.3,
            ),
            boxShadow: [
              const BoxShadow(
                color: Color(0x66000000),
                blurRadius: 22,
                offset: Offset(0, 12),
              ),
              if (glow != null)
                BoxShadow(
                  color: glow.withValues(alpha: 0.22),
                  blurRadius: 34,
                  spreadRadius: -6,
                ),
            ],
          ),
          child: Stack(
            children: [
              // Hairline top-edge highlight to fake a light falloff.
              Positioned(
                left: radius * 0.6,
                right: radius * 0.6,
                top: 0,
                child: Container(
                  height: 1,
                  color: Colors.white.withValues(alpha: 0.10),
                ),
              ),
              Padding(padding: padding, child: child),
              if (variant != OpsPanelVariant.standard) ..._corners(_tint),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _corners(Color color) {
    final stroke = color.withValues(alpha: 0.85);
    Widget bracket({required bool top, required bool left}) {
      return Positioned(
        top: top ? 10 : null,
        bottom: top ? null : 10,
        left: left ? 10 : null,
        right: left ? null : 10,
        child: SizedBox(
          width: 12,
          height: 12,
          child: CustomPaint(
            painter: _CornerBracketPainter(color: stroke, top: top, left: left),
          ),
        ),
      );
    }

    return [
      bracket(top: true, left: true),
      bracket(top: true, left: false),
      bracket(top: false, left: true),
      bracket(top: false, left: false),
    ];
  }
}

class _CornerBracketPainter extends CustomPainter {
  const _CornerBracketPainter({
    required this.color,
    required this.top,
    required this.left,
  });

  final Color color;
  final bool top;
  final bool left;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final path = Path();
    final vY = top ? 0.0 : size.height;
    final hX = left ? 0.0 : size.width;
    path.moveTo(hX, top ? size.height : 0);
    path.lineTo(hX, vY);
    path.lineTo(left ? size.width : 0, vY);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _CornerBracketPainter oldDelegate) =>
      oldDelegate.color != color;
}
