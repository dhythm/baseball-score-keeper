"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import type { AtBatResult, Game } from "@/lib/types";
import { RESULT_LABELS } from "@/lib/types";
import {
  buildAtBatEventUpdateFromResult,
  getOutsBeforeEvent,
} from "@/lib/game-utils";
import { AtBatResultFlow } from "@/components/at-bat-result-flow";

export type AtBatResultDialogProps = {
  game: Game;
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
  const { dispatch } = useGame();
  const [resetToken, setResetToken] = useState(0);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (open) setResetToken((k) => k + 1);
  }, [open]);

  const event =
    mode === "edit" && eventId
      ? game.events.find((e) => e.id === eventId)
      : undefined;
  const atBat =
    event?.type === "atBat" && event.result ? event : undefined;

  const halfLabel =
    atBat?.half === "top" ? "表" : atBat?.half === "bottom" ? "裏" : "";

  const handleFlowSubmit = (result: AtBatResult, detail?: string) => {
    if (mode === "new") {
      onNewResult?.(result, detail);
      onOpenChange(false);
      return;
    }
    if (!eventId || !atBat) return;
    const patch = buildAtBatEventUpdateFromResult(game, eventId, result, detail);
    if (!patch) return;
    dispatch({ type: "UPDATE_EVENT", eventId, event: patch });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!eventId) return;
    dispatch({ type: "DELETE_EVENT", eventId });
    setShowDelete(false);
    onOpenChange(false);
  };

  const outsForFlow =
    mode === "edit" && eventId
      ? getOutsBeforeEvent(game, eventId)
      : game.currentState.outs;

  const title =
    mode === "edit" ? "打席結果の修正" : "打席結果の入力";
  const description =
    mode === "edit" && atBat ? (
      <>
        {atBat.inning}回{halfLabel}の打席を変更します。ボタンだけで表記を選べます。
      </>
    ) : (
      <>種類を選び、続いて打球の方向や守備位置を選んでください。</>
    );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {mode === "edit" && atBat && atBat.result && (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
              現在: {RESULT_LABELS[atBat.result]}
              {atBat.resultDetail ? (
                <span className="text-muted-foreground">（{atBat.resultDetail}）</span>
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
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => setShowDelete(true)}
            >
              この打席を削除
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この打席を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              削除すると以降のイニング・走者・スコアが再計算されます。元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
