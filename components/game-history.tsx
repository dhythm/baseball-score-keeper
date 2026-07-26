"use client";

import { useEffect, useState } from "react";
import { History, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGame } from "@/lib/game-context";
import { replay } from "@/lib/domain/replay";
import {
  createBrowserGameRepository,
  type PersistedGameV2,
} from "@/lib/storage/local-storage";

export function GameHistory() {
  const { dispatch } = useGame();
  const [games, setGames] = useState<PersistedGameV2[]>([]);

  const refresh = () => setGames(createBrowserGameRepository().list());

  useEffect(() => {
    refresh();
  }, []);

  if (games.length === 0) return null;

  return (
    <Card className="gap-3 border-border py-4">
      <CardHeader className="px-4 py-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          試合履歴
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4">
        {games.slice(0, 10).map((storedGame) => {
          const snapshot = replay(
            storedGame.events,
            storedGame.config
          ).snapshot;
          return (
            <div
              key={storedGame.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
            >
              <button
                type="button"
                className="min-h-11 min-w-0 flex-1 touch-manipulation text-left"
                onClick={() =>
                  dispatch({ type: "LOAD_GAME", game: storedGame })
                }
              >
                <span className="block truncate text-sm font-semibold">
                  {storedGame.config.teams.away.name} {snapshot.score.away}
                  <span className="mx-1 text-muted-foreground">-</span>
                  {snapshot.score.home} {storedGame.config.teams.home.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {storedGame.date.slice(0, 10)}・
                  {storedGame.status === "finished" ? "試合終了" : "試合中"}
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 text-destructive"
                aria-label="この試合を履歴から削除"
                onClick={() => {
                  if (!window.confirm("この試合を履歴から削除しますか？")) {
                    return;
                  }
                  createBrowserGameRepository().remove(storedGame.id);
                  refresh();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
