import type { PersistedGameV2 } from "./local-storage";

export const DEFAULT_HISTORY_BYTE_BUDGET = 3 * 1024 * 1024;

export function estimateSerializedBytes(serialized: string): number {
  return serialized.length * 2;
}

function historyBytes(games: readonly PersistedGameV2[]): number {
  return estimateSerializedBytes(JSON.stringify({ schemaVersion: 2, games }));
}

/**
 * Returns finished games that should be backed up before removal.
 *
 * The active game and every other live game stay available even when they
 * exceed the soft budget. Candidates are returned oldest first so the UI can
 * export and remove them deterministically.
 */
export function getHistoryBackupCandidates(
  games: readonly PersistedGameV2[],
  activeGameId: string | null,
  byteBudget = DEFAULT_HISTORY_BYTE_BUDGET
): PersistedGameV2[] {
  const retained = [...games];
  const removable = games
    .filter((game) => game.id !== activeGameId && game.status === "finished")
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) || left.id.localeCompare(right.id)
    );
  const candidates: PersistedGameV2[] = [];

  for (const game of removable) {
    if (historyBytes(retained) <= byteBudget) break;
    const index = retained.findIndex((item) => item.id === game.id);
    if (index === -1) continue;
    retained.splice(index, 1);
    candidates.push(game);
  }

  return candidates;
}
