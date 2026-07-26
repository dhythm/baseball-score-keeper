"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, History, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGame } from "@/lib/game-context";
import { replay } from "@/lib/domain/replay";
import { gamePath } from "@/lib/app-state/routes";
import {
  createBrowserGameRepository,
  type PersistedGameV2,
} from "@/lib/storage/local-storage";

export function GameHistory() {
  const { game, resetGame } = useGame();
  const router = useRouter();
  const [games, setGames] = useState<PersistedGameV2[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null);

  const refresh = () => setGames(createBrowserGameRepository().list());

  useEffect(() => {
    refresh();
  }, []);

  if (games.length === 0) return null;

  const deleteGame = games.find((game) => game.id === deleteGameId);

  const handleDelete = () => {
    if (!deleteGameId) return;
    const isCurrentGame = game?.id === deleteGameId;
    createBrowserGameRepository().remove(deleteGameId);
    if (isCurrentGame) {
      resetGame();
      router.replace("/");
    }
    setDeleteGameId(null);
    refresh();
  };

  return (
    <>
      <Card className="gap-0 border-border py-0">
        <CardHeader className="px-2 py-2">
          <CardTitle>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full justify-between px-2 text-base"
              aria-expanded={isExpanded}
              aria-controls="saved-game-list"
              onClick={() => setIsExpanded((expanded) => !expanded)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <History className="h-4 w-4 shrink-0" />
                <span>試合履歴</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {games.length}
                </span>
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent
            id="saved-game-list"
            className="space-y-2 border-t border-border px-4 py-4"
          >
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
                    onClick={() => router.push(gamePath(storedGame.id))}
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
                    aria-label={`${storedGame.config.teams.away.name}対${storedGame.config.teams.home.name}の試合を履歴から削除`}
                    onClick={() => setDeleteGameId(storedGame.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>

      <AlertDialog
        open={deleteGameId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteGameId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              この試合を履歴から削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteGame
                ? `${deleteGame.config.teams.away.name} 対 ${deleteGame.config.teams.home.name}（${deleteGame.date.slice(0, 10)}）を削除します。`
                : "選択した試合を削除します。"}
              この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
