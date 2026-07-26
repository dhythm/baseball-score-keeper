"use client";

import { Component, type ReactNode } from "react";
import { Download, RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportGameAsJson } from "@/lib/export/game-log";
import {
  createBrowserGameRepository,
  type PersistedGameV2,
} from "@/lib/storage/local-storage";

interface GameErrorBoundaryProps {
  children: ReactNode;
}

interface GameErrorBoundaryState {
  hasError: boolean;
}

function getActiveGame(): PersistedGameV2 | null {
  try {
    return createBrowserGameRepository().loadActive();
  } catch {
    return null;
  }
}

function downloadGame(game: PersistedGameV2): void {
  const json = exportGameAsJson(game);
  const url = URL.createObjectURL(
    new Blob([json], { type: "application/json" })
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `scorebook-${game.date.slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function GameErrorFallback() {
  const activeGame = getActiveGame();

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <section
        role="alert"
        className="w-full max-w-md space-y-5 rounded-2xl border border-destructive/40 bg-card p-5 text-center shadow-lg"
      >
        <TriangleAlert
          className="mx-auto h-10 w-10 text-destructive"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <h1 className="text-lg font-bold">画面を表示できませんでした</h1>
          <p className="text-sm font-semibold">記録データは保存されています</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            JSONを書き出して記録を退避してから、画面を再読み込みしてください。
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={!activeGame}
            onClick={() => {
              if (activeGame) downloadGame(activeGame);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            JSONを書き出す
          </Button>
          <Button
            type="button"
            className="h-11"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            再読み込み
          </Button>
        </div>
      </section>
    </main>
  );
}

export class GameErrorBoundary extends Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  state: GameErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GameErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <GameErrorFallback />;
    return this.props.children;
  }
}
