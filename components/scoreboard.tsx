"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AppGame } from "@/lib/app-state/types";
import { getEffectiveInningCount } from "@/lib/app-state/selectors";
import {
  getInningScores,
  getTeamStats,
} from "@/lib/domain/stats";

interface ScoreboardProps {
  game: AppGame;
}

export function Scoreboard({ game }: ScoreboardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inningCount = getEffectiveInningCount(game);
  const scores = getInningScores(game.timeline, inningCount);
  const awayStats = getTeamStats(game.timeline, "away");
  const homeStats = getTeamStats(game.timeline, "home");

  const currentInning = game.currentState.inning;

  useEffect(() => {
    if (scrollRef.current) {
      const inningWidth = 32;
      const scrollPosition = Math.max(0, (currentInning - 3) * inningWidth);
      scrollRef.current.scrollLeft = scrollPosition;
    }
  }, [currentInning]);

  return (
    <div className="isolate mx-auto w-full max-w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,50,28,0.06)]">
      <div className="flex">
        <div className="flex-shrink-0 bg-secondary/70">
          <div className="flex h-9 w-24 items-center justify-center border-b border-border text-[11px] font-bold tracking-wide text-muted-foreground">
            チーム
          </div>
          <div className="flex h-9 w-24 items-center truncate border-b border-border px-3 text-sm font-bold text-foreground">
            {game.config.teams.away.name || "先攻"}
          </div>
          <div className="flex h-9 w-24 items-center truncate px-3 text-sm font-bold text-foreground">
            {game.config.teams.home.name || "後攻"}
          </div>
        </div>

        <div
          ref={scrollRef}
          className="min-w-0 overflow-x-auto scrollbar-hide"
        >
          <div className="inline-flex">
            {Array.from({ length: inningCount }, (_, i) => {
              const inning = i + 1;
              const isCurrentInning = inning === currentInning;

              return (
                <div key={inning} className="flex-shrink-0 w-8">
                  <div
                    className={cn(
                      "flex h-9 items-center justify-center border-b border-border text-xs font-bold",
                      isCurrentInning
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {inning}
                  </div>
                  <div
                    className={cn(
                      "flex h-9 items-center justify-center border-b border-border font-mono text-sm tabular-nums",
                      isCurrentInning && game.currentState.half === "top"
                        ? "bg-accent/20"
                        : ""
                    )}
                  >
                    {scores.away[i] !== null ? scores.away[i] : "-"}
                  </div>
                  <div
                    className={cn(
                      "flex h-9 items-center justify-center font-mono text-sm tabular-nums",
                      isCurrentInning && game.currentState.half === "bottom"
                        ? "bg-accent/20"
                        : ""
                    )}
                  >
                    {scores.home[i] !== null ? scores.home[i] : "-"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-shrink-0 border-l border-border">
          <div className="flex">
            <div className="w-10">
              <div className="flex h-9 items-center justify-center border-b border-border bg-secondary/70 text-xs font-bold text-muted-foreground">
                R
              </div>
              <div className="flex h-9 items-center justify-center border-b border-border font-mono text-sm font-bold text-primary tabular-nums">
                {scores.awayTotal}
              </div>
              <div className="flex h-9 items-center justify-center font-mono text-sm font-bold text-primary tabular-nums">
                {scores.homeTotal}
              </div>
            </div>
            <div className="w-8 border-l border-border">
              <div className="flex h-9 items-center justify-center border-b border-border bg-secondary/70 text-xs font-bold text-muted-foreground">
                H
              </div>
              <div className="flex h-9 items-center justify-center border-b border-border font-mono text-sm text-foreground tabular-nums">
                {awayStats.hits}
              </div>
              <div className="flex h-9 items-center justify-center font-mono text-sm text-foreground tabular-nums">
                {homeStats.hits}
              </div>
            </div>
            <div className="w-8 border-l border-border">
              <div className="flex h-9 items-center justify-center border-b border-border bg-secondary/70 text-xs font-bold text-muted-foreground">
                E
              </div>
              <div className="flex h-9 items-center justify-center border-b border-border font-mono text-sm text-foreground tabular-nums">
                {awayStats.errors}
              </div>
              <div className="flex h-9 items-center justify-center font-mono text-sm text-foreground tabular-nums">
                {homeStats.errors}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
