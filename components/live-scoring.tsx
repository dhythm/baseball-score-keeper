"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Scoreboard } from "@/components/scoreboard";
import { GameSituation } from "@/components/game-situation";
import { BattingOrderPanel } from "@/components/batting-order";
import { RunnerAdvanceSheet } from "@/components/runner-advance-sheet";
import { AtBatResultDialog } from "@/components/at-bat-result-dialog";
import {
  BaseRunningEventSheet,
  type BaseRunningEventResult,
} from "@/components/base-running-event-sheet";
import { SubstitutionSheet } from "@/components/substitution-sheet";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGame } from "@/lib/game-context";
import type { AtBatResult } from "@/lib/types";
import type { RunnerMovement } from "@/lib/domain/types";
import {
  isAutoAdvanceAtBatResult,
  generateId,
} from "@/lib/game-utils";
import { getCurrentBatter } from "@/lib/app-state/selectors";
import {
  createAtBatEvent,
  getDefaultMovementsForSelection,
} from "@/lib/app-state/event-factory";
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
import {
  Flag,
  RotateCcw,
  Footprints,
  PlusCircle,
  UserRoundCog,
} from "lucide-react";
import { toast } from "sonner";
import { createDummyGameAfterSevenInnings } from "@/lib/dummy-game";
import { migrateV1Game } from "@/lib/storage/local-storage";

export function LiveScoring() {
  const { game, dispatch } = useGame();
  const [pendingResult, setPendingResult] = useState<AtBatResult | null>(null);
  const [pendingDetail, setPendingDetail] = useState<string | undefined>();
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);
  const [showDummyDialog, setShowDummyDialog] = useState(false);
  const [atBatDialogOpen, setAtBatDialogOpen] = useState(false);
  const [baseRunningOpen, setBaseRunningOpen] = useState(false);
  const [substitutionOpen, setSubstitutionOpen] = useState(false);
  const [gameEndReason, setGameEndReason] = useState("規定回終了");

  if (!game) return null;

  const currentBatter = getCurrentBatter(game);

  const handleAtBatResult = (result: AtBatResult, detail?: string) => {
    if (!currentBatter) return;

    const isAutoAdvance = isAutoAdvanceAtBatResult(result);

    if (isAutoAdvance) {
      const movements = getDefaultMovementsForSelection(
        result,
        detail,
        game.currentState.runners,
        currentBatter.id,
        game.currentState.outs
      );

      dispatch({
        type: "ADD_EVENT",
        event: createAtBatEvent({
          id: generateId(),
          batterId: currentBatter.id,
          result,
          detail,
          movements,
        }),
      });
      toast.success("打席を記録しました");
    } else {
      setPendingResult(result);
      setPendingDetail(detail);
    }
  };

  const handleRunnerAdvanceConfirm = (
    movements: RunnerMovement[],
    _outsInPlay: number,
    _runsScored: number
  ) => {
    if (!currentBatter || !pendingResult) return;

    dispatch({
      type: "ADD_EVENT",
      event: createAtBatEvent({
        id: generateId(),
        batterId: currentBatter.id,
        result: pendingResult,
        detail: pendingDetail,
        movements,
      }),
    });
    toast.success("打席を記録しました");

    setPendingResult(null);
    setPendingDetail(undefined);
  };

  const handleBaseRunningEvent = (payload: BaseRunningEventResult) => {
    dispatch({
      type: "ADD_EVENT",
      event: {
        id: generateId(),
        kind: "baseRunning",
        type: payload.type,
        movements: payload.movements,
        rbiCreditBatterId: payload.rbiCreditBatterId,
      },
    });
    toast.success("走塁を記録しました");
  };

  const handleUndo = () => {
    if (game.events.length === 0) return;
    dispatch({ type: "UNDO_LAST_EVENT" });
    toast("直前の記録を取り消しました");
  };

  const handleEndGame = () => {
    dispatch({
      type: "ADD_EVENT",
      event: {
        id: generateId(),
        kind: "gameControl",
        action: "endGame",
        reason: gameEndReason,
      },
    });
    setShowEndGameDialog(false);
  };

  const handleLoadDummyGame = () => {
    dispatch({
      type: "LOAD_GAME",
      game: migrateV1Game(createDummyGameAfterSevenInnings()),
    });
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
            type="button"
            variant="ghost"
            size="icon"
            className="hidden h-11 w-11 text-primary-foreground hover:bg-primary-foreground/10 sm:inline-flex"
            disabled={game.events.length === 0}
            onClick={handleUndo}
            aria-label="直前の記録を取り消す"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setSubstitutionOpen(true)}
            aria-label="選手交代"
          >
            <UserRoundCog className="h-5 w-5" />
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

      <main className="flex-1 w-full space-y-4 px-3 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] xl:px-8">
        <div className="mx-auto w-full max-w-lg space-y-4">
          <Scoreboard game={game} />
          <GameSituation
            game={game}
            onRecordResult={() => setAtBatDialogOpen(true)}
            onOpenBaseRunning={() => setBaseRunningOpen(true)}
          />
        </div>
        <div className="mx-auto w-full max-w-6xl">
          <BattingOrderPanel game={game} />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-[0.8fr_1fr_1.4fr] gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 touch-manipulation flex-col gap-0 text-[11px]"
            disabled={game.events.length === 0}
            onClick={handleUndo}
          >
            <RotateCcw className="h-4 w-4" />
            戻す
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12 touch-manipulation flex-col gap-0 text-[11px]"
            disabled={
              !game.currentState.runners.first &&
              !game.currentState.runners.second &&
              !game.currentState.runners.third
            }
            onClick={() => setBaseRunningOpen(true)}
          >
            <Footprints className="h-4 w-4" />
            走塁
          </Button>
          <Button
            type="button"
            className="h-12 touch-manipulation text-sm font-bold"
            onClick={() => setAtBatDialogOpen(true)}
          >
            <PlusCircle className="h-5 w-5" />
            結果入力
          </Button>
        </div>
      </div>

      <AtBatResultDialog
        game={game}
        open={atBatDialogOpen}
        onOpenChange={setAtBatDialogOpen}
        mode="new"
        onNewResult={handleAtBatResult}
      />

      <Sheet open={baseRunningOpen} onOpenChange={setBaseRunningOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle>走塁・打席外</SheetTitle>
          </SheetHeader>
          <BaseRunningEventSheet
            game={game}
            onEvent={(p) => {
              handleBaseRunningEvent(p);
              setBaseRunningOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={substitutionOpen} onOpenChange={setSubstitutionOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle>選手交代</SheetTitle>
          </SheetHeader>
          <SubstitutionSheet
            game={game}
            onSubmit={(event) => {
              dispatch({ type: "ADD_EVENT", event });
              toast.success("選手交代を記録しました");
              setSubstitutionOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      {pendingResult && (
        <RunnerAdvanceSheet
          game={game}
          result={pendingResult}
          detail={pendingDetail}
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
          <div className="space-y-2">
            <p className="text-sm font-medium">終了理由</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "規定回終了",
                "時間切れ",
                "コールド",
                "降雨・中止",
                "没収試合",
                "その他",
              ].map((reason) => (
                <Button
                  key={reason}
                  type="button"
                  variant={gameEndReason === reason ? "default" : "outline"}
                  className="h-11"
                  onClick={() => setGameEndReason(reason)}
                >
                  {reason}
                </Button>
              ))}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndGame}>
              試合終了
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
