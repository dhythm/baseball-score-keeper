"use client";

import type { TimelineEntry } from "@/lib/domain/types";
import { formatAtBatNotation } from "@/lib/domain/notation";
import { cn } from "@/lib/utils";

export function ScorebookAtBatLine({
  entry,
  className,
}: {
  entry: TimelineEntry;
  className?: string;
}) {
  if (entry.event.kind !== "atBat") return null;
  const playLine = formatAtBatNotation(entry.event);
  const rbi = entry.scoringMovements.filter(
    (movement) => movement.isRBI
  ).length;
  return (
    <span
      className={cn(
        "inline-flex flex-col items-center justify-center gap-0 leading-tight",
        className
      )}
    >
      <span className="text-primary">{playLine}</span>
      {rbi > 0 ? (
        <span className="whitespace-nowrap text-[9px] font-medium leading-none text-muted-foreground tabular-nums">
          打点{rbi}
        </span>
      ) : null}
    </span>
  );
}
