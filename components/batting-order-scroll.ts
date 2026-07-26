interface InningColumnScrollMetrics {
  containerWidth: number;
  stickyWidth: number;
  targetOffsetLeft: number;
  targetWidth: number;
  maxScrollLeft: number;
}

interface CurrentBatterScrollMetrics {
  isBattingTeam: boolean;
  isRendered: boolean;
  rowTop: number;
  rowBottom: number;
  viewportTop: number;
  viewportBottom: number;
}

/**
 * Centers an inning column in the visible area beside the sticky order/name
 * columns, clamped to the table's scrollable range.
 */
export function getInningColumnScrollLeft({
  containerWidth,
  stickyWidth,
  targetOffsetLeft,
  targetWidth,
  maxScrollLeft,
}: InningColumnScrollMetrics): number {
  const visibleWidth = Math.max(0, containerWidth - stickyWidth);
  const centeredPosition =
    targetOffsetLeft -
    stickyWidth -
    Math.max(0, visibleWidth - targetWidth) / 2;

  return Math.min(
    Math.max(0, maxScrollLeft),
    Math.max(0, Math.round(centeredPosition))
  );
}

export function shouldScrollCurrentBatterIntoView({
  isBattingTeam,
  isRendered,
  rowTop,
  rowBottom,
  viewportTop,
  viewportBottom,
}: CurrentBatterScrollMetrics): boolean {
  if (!isBattingTeam || !isRendered) return false;
  return rowTop < viewportTop || rowBottom > viewportBottom;
}
