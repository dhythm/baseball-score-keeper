"use client";

import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import type { Game, GameEvent } from "@/lib/types";
import { getPlayerById } from "@/lib/game-utils";
import { RESULT_LABELS, BASE_RUNNING_LABELS } from "@/lib/types";

interface LastEventUndoProps {
  game: Game;
  onUndo: () => void;
}

function getEventDescription(event: GameEvent, game: Game): string {
  if (event.type === "atBat" && event.batterId && event.result) {
    const batter = getPlayerById(game, event.batterId);
    const resultLabel = RESULT_LABELS[event.result];
    return `${batter?.name ?? "不明"} → ${resultLabel}`;
  }

  if (event.type === "baseRunning" && event.baseRunningType) {
    const label = BASE_RUNNING_LABELS[event.baseRunningType];
    return `${label}`;
  }

  return "不明なイベント";
}

export function LastEventUndo({ game, onUndo }: LastEventUndoProps) {
  const lastEvent = game.events.length > 0 ? game.events[game.events.length - 1] : null;

  if (!lastEvent) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
      <div className="text-sm">
        <span className="text-muted-foreground">直前: </span>
        <span className="font-medium text-foreground">
          {getEventDescription(lastEvent, game)}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        className="h-8 px-3"
      >
        <Undo2 className="h-4 w-4 mr-1.5" />
        元に戻す
      </Button>
    </div>
  );
}
