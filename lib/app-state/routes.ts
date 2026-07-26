export function gamePath(gameId: string): string {
  return `/games/${encodeURIComponent(gameId)}`;
}
