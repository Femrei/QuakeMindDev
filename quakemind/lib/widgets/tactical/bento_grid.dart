import 'package:flutter/material.dart';

/// A tile inside a [BentoGrid], declaring how many of the grid's columns it
/// should span. Unlike [CardMasonryGrid]'s auto-flow, spans are explicit so a
/// hero tile can deliberately sit next to smaller stat tiles.
class BentoTile extends StatelessWidget {
  const BentoTile({super.key, required this.child, this.colSpan = 1});

  final Widget child;
  final int colSpan;

  @override
  Widget build(BuildContext context) => child;
}

/// Explicit-span grid layout for mixing a big hero cell with smaller stat
/// cells in a single row-flowing arrangement. Falls back to a single column
/// on narrow (<480px) viewports.
class BentoGrid extends StatelessWidget {
  const BentoGrid({
    super.key,
    required this.children,
    this.columns = 2,
    this.spacing = 12,
  });

  final List<BentoTile> children;
  final int columns;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final cols = width < 480 ? 1 : columns;

    return LayoutBuilder(
      builder: (context, constraints) {
        final cellWidth = (constraints.maxWidth - spacing * (cols - 1)) / cols;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: children.map((tile) {
            final span = cols == 1 ? 1 : tile.colSpan.clamp(1, cols);
            final w = cellWidth * span + spacing * (span - 1);
            return SizedBox(width: w, child: tile.child);
          }).toList(),
        );
      },
    );
  }
}
