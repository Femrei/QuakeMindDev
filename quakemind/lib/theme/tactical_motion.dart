import 'package:flutter/material.dart';

/// Centralized motion tokens for the tactical redesign. Durations/curves
/// should read as "a system responding to a query" -- scan sweeps, telemetry
/// count-ups -- rather than generic Material ripples.
class AppMotion {
  const AppMotion._();

  static const Duration fast = Duration(milliseconds: 150);
  static const Duration base = Duration(milliseconds: 220);
  static const Duration slow = Duration(milliseconds: 400);
  static const Duration scan = Duration(milliseconds: 3200);

  static const Curve entrance = Curves.easeOutCubic;
  static const Curve crossFade = Curves.easeInOutCubic;
  static const Curve dockIndicator = Curves.easeOutBack;
}
