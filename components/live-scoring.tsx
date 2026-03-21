"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Scoreboard } from "@/components/scoreboard";
import { GameSituation } from "@/components/game-situation";
import { AtBatInput } from "@/components/at-bat-input";
import { RunnerAdvanceSheet } from "@/components/runner-advance-sheet";
import { LastEventUndo } from "@/components/last-event-undo";
import { useGame } from "@/lib/game-context";
import type { AtBatResult, RunnerMovement, BaseRunningType, Base, Half } from "@/lib/types";
import {
  getCurrentBatter,
  getDefaultMovements,
  getDefaultOuts,
  applyRunnerMovements,
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
import { Settings, Flag } from "lucide-react";

export function LiveScoring() {
  const { game, dispatch } = useGame();
  const [pendingResult, setPendingResult] = useState<AtBatResult | null>(null);
  const [pendingDetail, setPendingDetail] = useState<string | undefined>();
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);

  if (!game) return null;

  const currentBatter = getCurrentBatter(game);

  const handleAtBatResult = (result: AtBatResult, detail?: string) => {
    if (!currentBatter) return;

    const isAutoAdvance = ["homerun", "strikeout", "walk", "hitByPitch"].includes(result);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span className="text-xl">&#9918;</span>
          スコアブック
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setShowEndGameDialog(true)}
          >
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-6 max-w-lg mx-auto w-full">
        <Scoreboard game={game} />
        <GameSituation game={game} />
        <AtBatInput
          game={game}
          onResult={handleAtBatResult}
          onBaseRunningEvent={handleBaseRunningEvent}
        />
        <LastEventUndo game={game} onUndo={handleUndo} />
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
