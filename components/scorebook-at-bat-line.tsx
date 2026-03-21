"use client";

import type { GameEvent } from "@/lib/types";
import { getAtBatCellDisplayParts } from "@/lib/game-utils";
import { cn } from "@/lib/utils";

export function ScorebookAtBatLine({
  event,
  className,
}: {
  event: GameEvent;
  className?: string;
}) {
  const p = getAtBatCellDisplayParts(event);
  if (!p) return null;
  return (
    <span
      className={cn(
        "inline-flex flex-col items-center justify-center gap-0 leading-tight",
        className
      )}
    >
      <span className="text-primary">{p.playLine}</span>
      {p.rbiNote ? (
        <span className="whitespace-nowrap text-[9px] font-medium leading-none text-muted-foreground tabular-nums">
          {p.rbiNote}
        </span>
      ) : null}
    </span>
  );
}
