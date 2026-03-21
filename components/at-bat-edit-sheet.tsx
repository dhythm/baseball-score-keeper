"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { BASE_RUNNING_LABELS, RESULT_LABELS } from "@/lib/types";
import { buildAtBatEventUpdateFromResult } from "@/lib/game-utils";

const ALL_RESULTS = Object.keys(RESULT_LABELS) as AtBatResult[];

interface AtBatEditSheetProps {
  game: Game;
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AtBatEditSheet({
  game,
  eventId,
  open,
  onOpenChange,
}: AtBatEditSheetProps) {
  const { dispatch } = useGame();
  const [detailDraft, setDetailDraft] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const event = eventId
    ? game.events.find((e) => e.id === eventId)
    : undefined;
  const atBat =
    event?.type === "atBat" && event.result ? event : undefined;
  const baseRun =
    event?.type === "baseRunning" && event.baseRunningType ? event : undefined;

  useEffect(() => {
    setDetailDraft(event?.resultDetail ?? "");
  }, [event?.id, event?.resultDetail]);

  const handleResultChange = (value: string) => {
    if (!eventId) return;
    const newResult = value as AtBatResult;
    const patch = buildAtBatEventUpdateFromResult(
      game,
      eventId,
      newResult,
      detailDraft
    );
    if (!patch) return;
    dispatch({ type: "UPDATE_EVENT", eventId, event: patch });
  };

  const applyNotation = () => {
    if (!eventId || !event) return;
    if (event.type === "atBat" && !event.result) return;
    if (event.type !== "atBat" && event.type !== "baseRunning") return;
    const trimmed = detailDraft.trim();
    const prev = event.resultDetail?.trim() ?? "";
    if (trimmed === prev) return;
    dispatch({
      type: "UPDATE_EVENT",
      eventId,
      event: { resultDetail: trimmed || undefined },
    });
  };

  const handleDelete = () => {
    if (!eventId) return;
    dispatch({ type: "DELETE_EVENT", eventId });
    setShowDelete(false);
    onOpenChange(false);
  };

  const halfLabel =
    event?.half === "top" ? "表" : event?.half === "bottom" ? "裏" : "";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>
              {baseRun ? "走塁・配球の表記" : "打席結果の修正"}
            </SheetTitle>
            <SheetDescription>
              {atBat && (
                <>
                  {atBat.inning}回{halfLabel}の打席を変更します。
                </>
              )}
              {baseRun && (
                <>
                  {baseRun.inning}回{halfLabel}の打席外イベントの表記を編集します。
                </>
              )}
              {!atBat && !baseRun && eventId && "イベントが見つかりません。"}
            </SheetDescription>
          </SheetHeader>

          {(atBat || baseRun) && (
            <div className="space-y-4 px-1 pb-6">
              {baseRun?.baseRunningType && (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                  {BASE_RUNNING_LABELS[baseRun.baseRunningType]}
                </div>
              )}

              {atBat && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    結果
                  </span>
                  <Select
                    value={atBat.result}
                    onValueChange={handleResultChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(60vh,24rem)]">
                      {ALL_RESULTS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {RESULT_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">
                  スコア表記（任意）
                </span>
                <Input
                  value={detailDraft}
                  onChange={(e) => setDetailDraft(e.target.value)}
                  onBlur={applyNotation}
                  placeholder={
                    baseRun
                      ? "例: 盗2、WP·1→2、PB·1→2"
                      : "例: 左安、遊ゴロ、空三振、見三振、打点2（手入力）"
                  }
                  className="text-sm"
                />
                {atBat && (
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    打点はデータから自動で2行目に表示されます。「打点」を表記に含めると自動表示と重複しません。
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => setShowDelete(true)}
              >
                {baseRun ? "このイベントを削除" : "この打席を削除"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>このプレーを削除しますか？</AlertDialogTitle>
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
