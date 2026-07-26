import type { AppGame } from "./types";

export function getGameViewKey(
  game: Pick<AppGame, "id" | "status"> | null
): string {
  return game ? `${game.id}:${game.status}` : "setup";
}
