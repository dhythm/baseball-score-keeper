import {
  createStorageEnvelope,
  parseStoredGame,
  type PersistedGameV2,
} from "../storage/local-storage";

const HISTORY_ARCHIVE_FORMAT = "baseball-score-keeper-history";
const HISTORY_ARCHIVE_VERSION = 1;

interface HistoryArchiveV1 {
  format: typeof HISTORY_ARCHIVE_FORMAT;
  version: typeof HISTORY_ARCHIVE_VERSION;
  exportedAt: string;
  games: PersistedGameV2[];
}

export function exportHistoryArchive(
  games: readonly PersistedGameV2[],
  exportedAt = new Date().toISOString()
): string {
  const archive: HistoryArchiveV1 = {
    format: HISTORY_ARCHIVE_FORMAT,
    version: HISTORY_ARCHIVE_VERSION,
    exportedAt,
    games: [...games],
  };
  return JSON.stringify(archive, null, 2);
}

export function parseHistoryArchive(serialized: string): PersistedGameV2[] {
  try {
    const value: unknown = JSON.parse(serialized);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error();
    }
    const archive = value as Record<string, unknown>;
    if (
      archive.format !== HISTORY_ARCHIVE_FORMAT ||
      archive.version !== HISTORY_ARCHIVE_VERSION ||
      typeof archive.exportedAt !== "string" ||
      !Array.isArray(archive.games)
    ) {
      throw new Error();
    }

    return archive.games.map((game) =>
      parseStoredGame(
        JSON.stringify(createStorageEnvelope(game as PersistedGameV2))
      )
    );
  } catch {
    throw new Error("invalid history archive");
  }
}
