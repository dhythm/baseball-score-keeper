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
    <div className="mx-auto w-max max-w-full overflow-x-auto rounded-lg border border-border bg-card">
      <div className="flex">
        <div className="flex-shrink-0 bg-secondary/50">
          <div className="h-8 w-20 flex items-center justify-center text-xs font-semibold text-muted-foreground border-b border-border">
            チーム
          </div>
          <div className="h-8 w-20 flex items-center px-2 text-sm font-medium text-foreground border-b border-border truncate">
            {game.config.teams.away.name || "先攻"}
          </div>
          <div className="h-8 w-20 flex items-center px-2 text-sm font-medium text-foreground truncate">
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
                      "h-8 flex items-center justify-center text-xs font-semibold border-b border-border",
                      isCurrentInning
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {inning}
                  </div>
                  <div
                    className={cn(
                      "h-8 flex items-center justify-center text-sm font-mono border-b border-border tabular-nums",
                      isCurrentInning && game.currentState.half === "top"
                        ? "bg-accent/20"
                        : ""
                    )}
                  >
                    {scores.away[i] !== null ? scores.away[i] : "-"}
                  </div>
                  <div
                    className={cn(
                      "h-8 flex items-center justify-center text-sm font-mono tabular-nums",
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
              <div className="h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground border-b border-border bg-secondary/50">
                R
              </div>
              <div className="h-8 flex items-center justify-center text-sm font-mono font-bold text-primary border-b border-border tabular-nums">
                {scores.awayTotal}
              </div>
              <div className="h-8 flex items-center justify-center text-sm font-mono font-bold text-primary tabular-nums">
                {scores.homeTotal}
              </div>
            </div>
            <div className="w-8 border-l border-border">
              <div className="h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground border-b border-border bg-secondary/50">
                H
              </div>
              <div className="h-8 flex items-center justify-center text-sm font-mono text-foreground border-b border-border tabular-nums">
                {awayStats.hits}
              </div>
              <div className="h-8 flex items-center justify-center text-sm font-mono text-foreground tabular-nums">
                {homeStats.hits}
              </div>
            </div>
            <div className="w-8 border-l border-border">
              <div className="h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground border-b border-border bg-secondary/50">
                E
              </div>
              <div className="h-8 flex items-center justify-center text-sm font-mono text-foreground border-b border-border tabular-nums">
                {awayStats.errors}
              </div>
              <div className="h-8 flex items-center justify-center text-sm font-mono text-foreground tabular-nums">
                {homeStats.errors}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
