import 'package:flutter/material.dart';

/// Additional color tokens layered on top of the base [AppTheme] palette for
/// the "tactical ops center" redesign -- kept in a separate file so the
/// palette can grow without bloating app_theme.dart.
class TacticalPalette {
  const TacticalPalette._();

  /// Low-alpha line color for background grid/scanline textures. Distinct
  /// from AppTheme.glassStroke, which is used for actual panel borders.
  static const Color gridLine = Color(0x1E3CF0FF);

  /// Data-viz accents used alongside the existing accent/teal/danger trio so
  /// charts and status readouts have a categorical palette instead of
  /// reusing the brand violet for everything.
  static const Color neonCyan = Color(0xFF3CF0FF);
  static const Color neonAmber = Color(0xFFFFC24B);

  static const double scanlineAlpha = 0.09;
  static const double glowAlpha = 0.35;
}
