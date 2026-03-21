"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Scoreboard } from "@/components/scoreboard";
import { GameSituation } from "@/components/game-situation";
import { BattingOrderPanel } from "@/components/batting-order";
import { AtBatInput } from "@/components/at-bat-input";
import { RunnerAdvanceSheet } from "@/components/runner-advance-sheet";
import { LastEventUndo } from "@/components/last-event-undo";
import { useGame } from "@/lib/game-context";
import type { AtBatResult, RunnerMovement, BaseRunningType, Base, Half } from "@/lib/types";
import {
  getCurrentBatter,
  getDefaultMovements,
  applyRunnerMovements,
  isAutoAdvanceAtBatResult,
} from "@/lib/game-utils";
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
import { Flag } from "lucide-react";
import { createDummyGameAfterSevenInnings } from "@/lib/dummy-game";

export function LiveScoring() {
  const { game, dispatch } = useGame();
  const [pendingResult, setPendingResult] = useState<AtBatResult | null>(null);
  const [pendingDetail, setPendingDetail] = useState<string | undefined>();
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);
  const [showDummyDialog, setShowDummyDialog] = useState(false);

  if (!game) return null;

  const currentBatter = getCurrentBatter(game);

  const handleAtBatResult = (result: AtBatResult, detail?: string) => {
    if (!currentBatter) return;

    const isAutoAdvance = isAutoAdvanceAtBatResult(result);

    if (isAutoAdvance) {
      const movements = getDefaultMovements(
        result,
        game.currentState.runners,
        currentBatter.id,
        game.currentState.outs
      );

      const { runsScored, outsAdded } = applyRunnerMovements(
        game.currentState.runners,
        movements,
        3,
        game.currentState.outs
      );

      const teamSide = game.currentState.half === "top" ? "away" : "home";

      dispatch({
        type: "ADD_EVENT",
        event: {
          type: "atBat",
          inning: game.currentState.inning,
          half: game.currentState.half,
          team: teamSide,
          batterId: currentBatter.id,
          result,
          resultDetail: detail,
          runnerMovements: movements,
          outsInPlay: outsAdded,
          runsScored,
        },
      });
    } else {
      setPendingResult(result);
      setPendingDetail(detail);
    }
  };

  const handleRunnerAdvanceConfirm = (
    movements: RunnerMovement[],
    outsInPlay: number,
    runsScored: number
  ) => {
    if (!currentBatter || !pendingResult) return;

    const teamSide = game.currentState.half === "top" ? "away" : "home";

    dispatch({
      type: "ADD_EVENT",
      event: {
        type: "atBat",
        inning: game.currentState.inning,
        half: game.currentState.half,
        team: teamSide,
        batterId: currentBatter.id,
        result: pendingResult,
        resultDetail: pendingDetail,
        runnerMovements: movements,
        outsInPlay,
        runsScored,
      },
    });

    setPendingResult(null);
    setPendingDetail(undefined);
  };

  const handleBaseRunningEvent = (
    runnerId: string,
    type: BaseRunningType,
    to: Base | "home" | "out"
  ) => {
    const { runners, inning, half, outs } = game.currentState;
    const teamSide = half === "top" ? "away" : "home";

    let from: Base;
    if (runners.first === runnerId) from = "first";
    else if (runners.second === runnerId) from = "second";
    else if (runners.third === runnerId) from = "third";
    else return;

    const movements: RunnerMovement[] = [
      { playerId: runnerId, from, to, isRBI: false },
    ];

    const isOut = ["caughtStealing", "pickOff"].includes(type) || to === "out";
    const runsScored = to === "home" && outs < 3 ? 1 : 0;
    const outsInPlay = isOut ? 1 : 0;

    dispatch({
      type: "ADD_EVENT",
      event: {
        type: "baseRunning",
        inning,
        half: half as Half,
        team: teamSide,
        baseRunningType: type,
        runnerMovements: movements,
        outsInPlay,
        runsScored,
      },
    });
  };

  const handleUndo = () => {
    dispatch({ type: "UNDO_LAST_EVENT" });
  };

  const handleEndGame = () => {
    dispatch({ type: "END_GAME" });
    setShowEndGameDialog(false);
  };

  const handleResetGame = () => {
    dispatch({ type: "RESET_GAME" });
  };

  const handleLoadDummyGame = () => {
    dispatch({ type: "LOAD_GAME", game: createDummyGameAfterSevenInnings() });
    setShowDummyDialog(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span className="text-xl">&#9918;</span>
          スコアブック
        </h1>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            className="h-11 min-h-11 px-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/10 touch-manipulation sm:text-sm"
            onClick={() => setShowDummyDialog(true)}
          >
            検証用
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 min-h-11 min-w-11 text-primary-foreground hover:bg-primary-foreground/10 touch-manipulation"
            onClick={() => setShowEndGameDialog(true)}
            aria-label="試合終了"
          >
            <Flag className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full space-y-4 px-3 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-4 xl:px-8">
        <div className="mx-auto w-full max-w-lg space-y-4">
          <Scoreboard game={game} />
          <GameSituation game={game} />
          <AtBatInput
            game={game}
            onResult={handleAtBatResult}
            onBaseRunningEvent={handleBaseRunningEvent}
          />
          <LastEventUndo game={game} onUndo={handleUndo} />
        </div>
        <div className="mx-auto w-full max-w-6xl">
          <BattingOrderPanel game={game} />
        </div>
      </main>

      {pendingResult && (
        <RunnerAdvanceSheet
          game={game}
          result={pendingResult}
          open={!!pendingResult}
          onOpenChange={(open) => {
            if (!open) {
              setPendingResult(null);
              setPendingDetail(undefined);
            }
          }}
          onConfirm={handleRunnerAdvanceConfirm}
        />
      )}

      <AlertDialog open={showDummyDialog} onOpenChange={setShowDummyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>検証用ダミーを読み込みますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在の試合データは上書きされます。7イニング終了後（8回表・0アウト・0-0）のダミーに切り替わります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoadDummyGame}>
              読み込む
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showEndGameDialog} onOpenChange={setShowEndGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>試合を終了しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              試合を終了すると、結果画面に移動します。後から修正することも可能です。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleResetGame}
              className="text-destructive hover:text-destructive"
            >
              試合を破棄
            </Button>
            <AlertDialogAction onClick={handleEndGame}>
              試合終了
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
