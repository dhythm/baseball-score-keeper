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
import { RESULT_LABELS } from "@/lib/types";
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

  useEffect(() => {
    if (atBat?.resultDetail) {
      setDetailDraft(atBat.resultDetail);
    } else {
      setDetailDraft("");
    }
  }, [atBat?.id, atBat?.resultDetail]);

  const handleResultChange = (value: string) => {
    if (!eventId) return;
    const newResult = value as AtBatResult;
    const patch = buildAtBatEventUpdateFromResult(
      game,
      eventId,
      newResult,
      newResult === "groundOut" || newResult === "otherOut"
        ? detailDraft
        : undefined
    );
    if (!patch) return;
    dispatch({ type: "UPDATE_EVENT", eventId, event: patch });
  };

  const applyDetail = () => {
    if (!eventId || !atBat?.result) return;
    if (atBat.result !== "groundOut" && atBat.result !== "otherOut") return;
    const patch = buildAtBatEventUpdateFromResult(
      game,
      eventId,
      atBat.result,
      detailDraft
    );
    if (!patch) return;
    dispatch({ type: "UPDATE_EVENT", eventId, event: patch });
  };

  const handleDelete = () => {
    if (!eventId) return;
    dispatch({ type: "DELETE_EVENT", eventId });
    setShowDelete(false);
    onOpenChange(false);
  };

  const halfLabel = atBat?.half === "top" ? "表" : "裏";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>打席結果の修正</SheetTitle>
            <SheetDescription>
              {atBat ? (
                <>
                  {atBat.inning}回{halfLabel}の打席を変更します。
                </>
              ) : (
                "イベントが見つかりません。"
              )}
            </SheetDescription>
          </SheetHeader>

          {atBat && (
            <div className="space-y-4 px-1 pb-6">
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

              {(atBat.result === "groundOut" ||
                atBat.result === "otherOut") && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    補足（任意）
                  </span>
                  <Input
                    value={detailDraft}
                    onChange={(e) => setDetailDraft(e.target.value)}
                    onBlur={applyDetail}
                    placeholder="例: ショートゴロ"
                    className="text-sm"
                  />
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => setShowDelete(true)}
              >
                この打席を削除
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

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
