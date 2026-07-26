"use client";

import { useState } from "react";
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
import type { AppGame } from "@/lib/app-state/types";
import { getTimelineEntry } from "@/lib/app-state/selectors";
import {
  BaseRunningEventSheet,
  type BaseRunningEventResult,
} from "@/components/base-running-event-sheet";

export function BaseRunningEditDialog({
  game,
  eventId,
  open,
  onOpenChange,
}: {
  game: AppGame;
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { dispatch } = useGame();
  const [showDelete, setShowDelete] = useState(false);

  const event = eventId ? game.events.find((e) => e.id === eventId) : undefined;
  const baseRun =
    event?.kind === "baseRunning" ? event : undefined;
  const timelineEntry = eventId ? getTimelineEntry(game, eventId) : null;

  const halfLabel =
    timelineEntry?.half === "top"
      ? "表"
      : timelineEntry?.half === "bottom"
        ? "裏"
        : "";

  const handleDelete = () => {
    if (!eventId) return;
    dispatch({ type: "DELETE_EVENT", eventId });
    setShowDelete(false);
    onOpenChange(false);
  };

  const handleUpdate = (payload: BaseRunningEventResult) => {
    if (!eventId || !baseRun) return;
    dispatch({
      type: "UPDATE_EVENT",
      eventId,
      event: {
        ...baseRun,
        type: payload.type,
        movements: payload.movements,
        ...(payload.rbiCreditBatterId
          ? { rbiCreditBatterId: payload.rbiCreditBatterId }
          : { rbiCreditBatterId: undefined }),
      },
    });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>打席外イベント</DialogTitle>
            <DialogDescription>
              {baseRun && (
                <>
                  {timelineEntry?.inning}回{halfLabel}のイベントです。
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {baseRun && timelineEntry && (
            <BaseRunningEventSheet
              game={game}
              initialEvent={baseRun}
              runnerSnapshot={timelineEntry.before.runners}
              submitLabel="変更を保存"
              onEvent={handleUpdate}
            />
          )}

          {baseRun && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => setShowDelete(true)}
            >
              このイベントを削除
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>このイベントを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              削除すると以降の走者・スコアが再計算されます。
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
