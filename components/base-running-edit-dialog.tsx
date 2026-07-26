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
import { formatViolationMessage } from "@/lib/app-state/feedback";
import { toast } from "sonner";
import { SituationMiniHeader } from "@/components/situation-mini-header";
import type { BaseRunningEvent } from "@/lib/domain/types";
import {
  evaluateEventDeletion,
  evaluateEventUpdate,
} from "@/lib/app-state/reducer";

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
  const { dispatch, updateEvent } = useGame();
  const [showDelete, setShowDelete] = useState(false);
  const [cascadeUpdate, setCascadeUpdate] = useState<{
    event: BaseRunningEvent;
    invalidatedCount: number;
  } | null>(null);

  const event = eventId ? game.events.find((e) => e.id === eventId) : undefined;
  const baseRun = event?.kind === "baseRunning" ? event : undefined;
  const timelineEntry = eventId ? getTimelineEntry(game, eventId) : null;

  const handleDelete = () => {
    if (!eventId) return;
    if (!dispatch({ type: "DELETE_EVENT", eventId })) return;
    setShowDelete(false);
    onOpenChange(false);
  };

  const commitUpdate = (replacement: BaseRunningEvent) => {
    if (!eventId) return;
    const result = updateEvent(eventId, replacement);
    if (!result.accepted) {
      toast.error(
        result.violations[0]
          ? formatViolationMessage(result.violations[0])
          : "変更を保存できませんでした。"
      );
      return;
    }
    if (result.invalidatedEventIds.length > 0) {
      toast.warning(
        `走塁を変更し、後続${result.invalidatedEventIds.length}件が無効になりました`
      );
    } else {
      toast.success("走塁の変更を保存しました");
    }
    setCascadeUpdate(null);
    onOpenChange(false);
  };

  const handleUpdate = (payload: BaseRunningEventResult) => {
    if (!eventId || !baseRun) return;
    const replacement: BaseRunningEvent = {
      ...baseRun,
      type: payload.type,
      movements: payload.movements,
      ...(payload.rbiCreditBatterId
        ? { rbiCreditBatterId: payload.rbiCreditBatterId }
        : { rbiCreditBatterId: undefined }),
    };
    const preview = evaluateEventUpdate(game, eventId, replacement);
    if (preview && preview.invalidatedEventIds.length > 0) {
      setCascadeUpdate({
        event: replacement,
        invalidatedCount: preview.invalidatedEventIds.length,
      });
      return;
    }
    commitUpdate(replacement);
  };

  const deleteImpact = eventId
    ? (evaluateEventDeletion(game, eventId)?.invalidatedEventIds.length ?? 0)
    : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>打席外イベント</DialogTitle>
            {timelineEntry && (
              <SituationMiniHeader
                game={game}
                snapshot={timelineEntry.before}
              />
            )}
            <DialogDescription className="sr-only">
              打席外イベントを編集
            </DialogDescription>
          </DialogHeader>

          {baseRun && timelineEntry && (
            <BaseRunningEventSheet
              game={game}
              initialEvent={baseRun}
              snapshot={timelineEntry.before}
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
              {deleteImpact > 0
                ? `削除すると後続${deleteImpact}件が無効になります。以降の走者・スコアも再計算されます。`
                : "削除すると以降の走者・スコアが再計算されます。"}
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

      <AlertDialog
        open={cascadeUpdate !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setCascadeUpdate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この変更を保存しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この修正で後続{cascadeUpdate?.invalidatedCount ?? 0}
              件が無効になります。無効になった記録は試合画面に警告として残ります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>戻って確認</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (cascadeUpdate) commitUpdate(cascadeUpdate.event);
              }}
            >
              変更を保存
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
