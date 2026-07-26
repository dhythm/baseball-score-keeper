"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { AtBatResult } from "@/lib/types";
import type { RunnerMovement } from "@/lib/domain/types";
import type { AppGame } from "@/lib/app-state/types";
import { getTimelineEntry } from "@/lib/app-state/selectors";
import {
  createAtBatEvent,
  mapAtBatSelectionResult,
} from "@/lib/app-state/event-factory";
import { formatAtBatResult } from "@/lib/domain/notation";
import { formatViolationMessage } from "@/lib/app-state/feedback";
import { AtBatResultFlow } from "@/components/at-bat-result-flow";
import { RunnerAdvanceSheet } from "@/components/runner-advance-sheet";
import { X } from "lucide-react";
import { toast } from "sonner";

export type AtBatResultDialogProps = {
  game: AppGame;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "new" | "edit";
  /** edit 時必須 */
  eventId?: string | null;
  /** 新規打席の確定（ランナー進行シートの前に呼ばれる） */
  onNewResult?: (result: AtBatResult, detail?: string) => void;
};

export function AtBatResultDialog({
  game,
  open,
  onOpenChange,
  mode,
  eventId,
  onNewResult,
}: AtBatResultDialogProps) {
  const { dispatch, updateEvent } = useGame();
  const [resetToken, setResetToken] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{
    result: AtBatResult;
    detail?: string;
    initialMovements?: RunnerMovement[];
  } | null>(null);

  useEffect(() => {
    if (open) setResetToken((k) => k + 1);
  }, [open]);

  const event =
    mode === "edit" && eventId
      ? game.events.find((e) => e.id === eventId)
      : undefined;
  const atBat = event?.kind === "atBat" ? event : undefined;
  const timelineEntry = eventId ? getTimelineEntry(game, eventId) : null;

  const halfLabel =
    timelineEntry?.half === "top"
      ? "表"
      : timelineEntry?.half === "bottom"
        ? "裏"
        : "";

  const handleFlowSubmit = (result: AtBatResult, detail?: string) => {
    if (mode === "new") {
      onNewResult?.(result, detail);
      onOpenChange(false);
      return;
    }
    if (!eventId || !atBat) return;
    const before = timelineEntry?.before;
    if (!before) return;
    setPendingEdit({
      result,
      detail,
      ...(mapAtBatSelectionResult(result, detail?.trim() ?? "") === atBat.result
        ? { initialMovements: atBat.movements }
        : {}),
    });
    onOpenChange(false);
  };

  const handleEditMovements = (movements: RunnerMovement[]) => {
    if (!eventId || !atBat || !pendingEdit) return;
    const result = updateEvent(
      eventId,
      createAtBatEvent({
        id: eventId,
        batterId: atBat.batterId,
        result: pendingEdit.result,
        detail: pendingEdit.detail,
        movements,
      })
    );
    if (!result.accepted) {
      toast.error(
        result.violations[0]
          ? formatViolationMessage(result.violations[0])
          : "変更を保存できませんでした。"
      );
      return;
    }
    toast.success("打席結果の変更を保存しました");
    setPendingEdit(null);
  };

  const handleDelete = () => {
    if (!eventId) return;
    dispatch({ type: "DELETE_EVENT", eventId });
    setShowDelete(false);
    onOpenChange(false);
  };

  const outsForFlow =
    mode === "edit" && timelineEntry
      ? timelineEntry.outsBefore
      : game.currentState.outs;

  const title = mode === "edit" ? "打席結果の修正" : "打席結果の入力";
  const description =
    mode === "edit" && atBat ? (
      <>
        {timelineEntry?.inning}回{halfLabel}
        の打席を変更します。ボタンだけで表記を選べます。
      </>
    ) : (
      <>種類を選び、続いて打球の方向や守備位置を選んでください。</>
    );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="bottom-0 left-0 top-auto flex max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-b-none rounded-t-[1.75rem] border-x border-t bg-card p-0 shadow-[0_-20px_60px_rgba(0,0,0,0.18)] sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:grid sm:max-h-[min(90dvh,40rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:grid-rows-[auto_minmax(0,1fr)] sm:gap-4 sm:rounded-lg sm:border sm:p-6"
        >
          <DialogHeader className="relative shrink-0 border-b border-border bg-card px-5 py-4 pr-16 text-left sm:border-0 sm:bg-transparent sm:p-0 sm:pr-10">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            <DialogClose
              className="absolute right-2.5 top-2.5 flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:-right-2 sm:-top-2"
              aria-label="打席結果入力を閉じる"
            >
              <X className="size-5" />
            </DialogClose>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-0 sm:py-0 sm:pb-0">
            {mode === "edit" && atBat && atBat.result && (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                現在: {formatAtBatResult(atBat.result, atBat.battedBall)}
                {atBat.note ? (
                  <span className="text-muted-foreground">
                    （{atBat.note}）
                  </span>
                ) : null}
              </div>
            )}

            <AtBatResultFlow
              resetToken={resetToken}
              outs={outsForFlow}
              onSubmit={handleFlowSubmit}
            />

            {mode === "edit" && eventId && atBat && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => setShowDelete(true)}
              >
                この打席を削除
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {mode === "edit" && atBat && timelineEntry && pendingEdit && (
        <RunnerAdvanceSheet
          game={game}
          result={pendingEdit.result}
          detail={pendingEdit.detail}
          open
          context={{
            runners: timelineEntry.before.runners,
            outs: timelineEntry.before.outs,
            batterId: atBat.batterId,
          }}
          initialMovementsOverride={pendingEdit.initialMovements}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPendingEdit(null);
          }}
          onConfirm={handleEditMovements}
        />
      )}

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この打席を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              削除すると以降のイニング・走者・スコアが再計算されます。元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
