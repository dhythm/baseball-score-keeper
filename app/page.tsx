"use client";

import { GameProvider, useGame } from "@/lib/game-context";
import { GameSetup } from "@/components/game-setup";
import { LiveScoring } from "@/components/live-scoring";
import { GameResult } from "@/components/game-result";
import { ScrollToTop } from "@/components/scroll-to-top";
import { getGameViewKey } from "@/lib/app-state/view-key";

function GameRouter() {
  const { game } = useGame();
  const viewKey = getGameViewKey(game);
  const content = !game ? (
    <GameSetup />
  ) : game.status === "finished" ? (
    <GameResult />
  ) : (
    <LiveScoring />
  );

  return (
    <>
      <ScrollToTop resetKey={viewKey} />
      {content}
    </>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
