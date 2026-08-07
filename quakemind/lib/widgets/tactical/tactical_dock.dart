import 'dart:ui';

import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../theme/tactical_motion.dart';

class TacticalDockItem {
  const TacticalDockItem({required this.icon, required this.label});

  final IconData icon;
  final String label;
}

/// Floating pill-shaped bottom navigation, replacing the inline
/// NavigationBar-in-blurred-container duplicated across both shells. Shows
/// the label only for the selected item so the row stays visually light,
/// with a glowing capsule indicator sliding to the active icon.
class TacticalDock extends StatelessWidget {
  const TacticalDock({
    super.key,
    required this.items,
    required this.selectedIndex,
    required this.onSelected,
    this.accentColor = AppTheme.accent,
  });

  final List<TacticalDockItem> items;
  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.ink.withValues(alpha: 0.62),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: AppTheme.glassStroke),
              boxShadow: const [
                BoxShadow(color: Color(0x88000000), blurRadius: 24, offset: Offset(0, 10)),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (var i = 0; i < items.length; i++)
                  Flexible(
                    child: _DockButton(
                      item: items[i],
                      selected: i == selectedIndex,
                      accentColor: accentColor,
                      onTap: () => onSelected(i),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DockButton extends StatelessWidget {
  const _DockButton({
    required this.item,
    required this.selected,
    required this.accentColor,
    required this.onTap,
  });

  final TacticalDockItem item;
  final bool selected;
  final Color accentColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: AppMotion.base,
        curve: AppMotion.dockIndicator,
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: EdgeInsets.symmetric(horizontal: selected ? 16 : 12, vertical: 12),
        decoration: BoxDecoration(
          color: selected ? accentColor.withValues(alpha: 0.20) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: selected
              ? Border.all(color: accentColor.withValues(alpha: 0.55))
              : null,
          boxShadow: selected
              ? [BoxShadow(color: accentColor.withValues(alpha: 0.35), blurRadius: 16)]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              item.icon,
              size: 22,
              color: selected ? accentColor : AppTheme.textSecondary,
            ),
            // Flexible (not FittedBox) so a cramped dock only ever shrinks
            // the label -- the icon stays full-size instead of scaling
            // down along with it when many items compete for space.
            if (selected) ...[
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  item.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: accentColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
