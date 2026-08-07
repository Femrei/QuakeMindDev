import 'package:flutter/material.dart';

import '../../theme/tactical_motion.dart';

/// Switches between shell pages (dashboard/risk/map/etc). Deliberately not a
/// bare [AnimatedSwitcher]: its default layoutBuilder stacks the outgoing
/// and incoming page with `Alignment.center` and loose constraints, so a
/// page whose layout assumes it fills the available height gets sized
/// differently for the ~one frame both pages coexist during the crossfade --
/// which was surfacing as a red error/overflow flash on every dock switch.
/// Positioning both children with [Positioned.fill] keeps their constraints
/// identical to the non-animated case.
class TacticalPageSwitcher extends StatelessWidget {
  const TacticalPageSwitcher({super.key, required this.index, required this.child});

  final int index;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: AppMotion.base,
      switchInCurve: AppMotion.entrance,
      switchOutCurve: Curves.easeIn,
      layoutBuilder: (currentChild, previousChildren) {
        return Stack(
          children: [
            for (final child in previousChildren) Positioned.fill(child: child),
            if (currentChild != null) Positioned.fill(child: currentChild),
          ],
        );
      },
      transitionBuilder: (child, animation) {
        final slide = Tween<Offset>(
          begin: const Offset(0, 0.03),
          end: Offset.zero,
        ).animate(animation);
        return FadeTransition(
          opacity: animation,
          child: SlideTransition(position: slide, child: child),
        );
      },
      child: KeyedSubtree(key: ValueKey(index), child: child),
    );
  }
}
