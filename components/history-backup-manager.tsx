"use client";

import { useEffect, useState } from "react";

import { HistoryBackupNotice } from "@/components/history-backup-notice";
import { toPersistedGame } from "@/lib/app-state/selectors";
import { useGame } from "@/lib/game-context";
import { getHistoryBackupCandidates } from "@/lib/storage/history-retention";
import {
  createBrowserGameRepository,
  type PersistedGameV2,
} from "@/lib/storage/local-storage";

export function HistoryBackupManager() {
  const { game, storageReady } = useGame();
  const [candidates, setCandidates] = useState<PersistedGameV2[]>([]);

  useEffect(() => {
    if (!storageReady) return;
    const repository = createBrowserGameRepository();
    const gamesById = new Map(
      repository.list().map((storedGame) => [storedGame.id, storedGame])
    );
    if (game) gamesById.set(game.id, toPersistedGame(game));
    setCandidates(
      getHistoryBackupCandidates([...gamesById.values()], game?.id ?? null)
    );
  }, [game, storageReady]);

  return (
    <HistoryBackupNotice
      games={candidates}
      onRemove={(gameIds) => {
        const repository = createBrowserGameRepository();
        for (const gameId of gameIds) repository.remove(gameId);
        setCandidates([]);
      }}
    />
  );
}
