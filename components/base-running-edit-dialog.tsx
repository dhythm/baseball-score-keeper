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
import type { Game } from "@/lib/types";
import { BASE_RUNNING_LABELS } from "@/lib/types";

export function BaseRunningEditDialog({
  game,
  eventId,
  open,
  onOpenChange,
}: {
  game: Game;
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { dispatch } = useGame();
  const [showDelete, setShowDelete] = useState(false);

  const event = eventId ? game.events.find((e) => e.id === eventId) : undefined;
  const baseRun =
    event?.type === "baseRunning" && event.baseRunningType ? event : undefined;

  const halfLabel =
    baseRun?.half === "top" ? "表" : baseRun?.half === "bottom" ? "裏" : "";

  const handleDelete = () => {
    if (!eventId) return;
    dispatch({ type: "DELETE_EVENT", eventId });
    setShowDelete(false);
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
                  {baseRun.inning}回{halfLabel}のイベントです。
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {baseRun?.baseRunningType && (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground">
              {BASE_RUNNING_LABELS[baseRun.baseRunningType]}
            </div>
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
