"use client";

import { GameProvider, useGame } from "@/lib/game-context";
import { GameSetup } from "@/components/game-setup";
import { LiveScoring } from "@/components/live-scoring";
import { GameResult } from "@/components/game-result";

function GameRouter() {
  const { game } = useGame();

  if (!game) {
    return <GameSetup />;
  }

  if (game.status === "finished") {
    return <GameResult />;
  }

  return <LiveScoring />;
}

export default function Home() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
