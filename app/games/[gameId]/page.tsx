"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GameResult } from "@/components/game-result";
import { LiveScoring } from "@/components/live-scoring";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { getGameViewKey } from "@/lib/app-state/view-key";
import { useGame } from "@/lib/game-context";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { game, storageReady, loadGame } = useGame();
  const [missingGameId, setMissingGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!storageReady) return;
    if (game?.id === gameId) {
      setMissingGameId(null);
      return;
    }

    setMissingGameId(loadGame(gameId) ? null : gameId);
  }, [game?.id, gameId, loadGame, storageReady]);

  if (!storageReady || (game?.id !== gameId && missingGameId !== gameId)) {
    return (
      <main
        className="grid min-h-screen place-items-center bg-background p-4"
        aria-busy="true"
      >
        <p className="text-sm text-muted-foreground">試合を読み込んでいます…</p>
      </main>
    );
  }

  if (missingGameId === gameId || !game) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-4">
        <section className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <div className="space-y-1">
            <h1 className="text-lg font-bold">試合が見つかりません</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              この端末に保存されていないか、履歴から削除された試合です。
            </p>
          </div>
          <Button asChild className="h-11 w-full">
            <Link href="/">試合設定へ戻る</Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <>
      <ScrollToTop resetKey={getGameViewKey(game)} />
      {game.status === "finished" ? <GameResult /> : <LiveScoring />}
    </>
  );
}
