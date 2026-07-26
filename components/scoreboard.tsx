"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppGame } from "@/lib/app-state/types";
import { getEffectiveInningCount } from "@/lib/app-state/selectors";
import { getInningScores, getTeamStats } from "@/lib/domain/stats";

interface ScoreboardProps {
  game: AppGame;
  collapsibleOnMobile?: boolean;
  defaultMobileExpanded?: boolean;
}

export function Scoreboard({
  game,
  collapsibleOnMobile = false,
  defaultMobileExpanded = false,
}: ScoreboardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mobileExpanded, setMobileExpanded] = useState(defaultMobileExpanded);
  const inningCount = getEffectiveInningCount(game);
  const scores = getInningScores(game.timeline, inningCount);
  const awayStats = getTeamStats(game.timeline, "away");
  const homeStats = getTeamStats(game.timeline, "home");

  const currentInning = game.currentState.inning;
  const currentHalfLabel = game.currentState.half === "top" ? "表" : "裏";
  const headerHeight = collapsibleOnMobile ? "h-11 sm:h-9" : "h-9";
  const scoreHeight = collapsibleOnMobile ? "h-8 sm:h-9" : "h-9";

  useEffect(() => {
    if (scrollRef.current) {
      const inningWidth = 32;
      const scrollPosition = Math.max(0, (currentInning - 3) * inningWidth);
      scrollRef.current.scrollLeft = scrollPosition;
    }
  }, [currentInning]);

  return (
    <div className="isolate mx-auto w-full max-w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,50,28,0.06)]">
      {collapsibleOnMobile && !mobileExpanded && (
        <button
          type="button"
          className="flex h-11 w-full items-center justify-between gap-3 px-3 text-sm touch-manipulation sm:hidden"
          aria-expanded={false}
          aria-label="スコアボードを展開"
          data-scoreboard-view="compact"
          onClick={() => setMobileExpanded(true)}
        >
          <span className="min-w-0 flex-1 truncate text-right font-semibold">
            {game.config.teams.away.name || "先攻"}
          </span>
          <span className="shrink-0 font-mono text-base font-extrabold tabular-nums text-primary">
            {scores.awayTotal} - {scores.homeTotal}
          </span>
          <span className="min-w-0 flex-1 truncate font-semibold">
            {game.config.teams.home.name || "後攻"}
          </span>
          <span className="shrink-0 text-xs font-bold text-muted-foreground">
            {currentInning}回{currentHalfLabel}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      )}

      <div
        className={cn(
          "flex",
          collapsibleOnMobile && !mobileExpanded && "hidden sm:flex"
        )}
        data-scoreboard-view="full"
      >
        <div className="flex-shrink-0 bg-secondary/70">
          {collapsibleOnMobile ? (
            <>
              <button
                type="button"
                className="flex h-11 w-24 items-center justify-center gap-1 border-b border-border text-[11px] font-bold tracking-wide text-muted-foreground touch-manipulation sm:hidden"
                aria-expanded={true}
                aria-label="スコアボードを折りたたむ"
                onClick={() => setMobileExpanded(false)}
              >
                チーム
                <ChevronUp className="h-4 w-4" />
              </button>
              <div className="hidden h-9 w-24 items-center justify-center border-b border-border text-[11px] font-bold tracking-wide text-muted-foreground sm:flex">
                チーム
              </div>
            </>
          ) : (
            <div className="flex h-9 w-24 items-center justify-center border-b border-border text-[11px] font-bold tracking-wide text-muted-foreground">
              チーム
            </div>
          )}
          <div
            className={cn(
              "flex w-24 items-center truncate border-b border-border px-3 text-sm font-bold text-foreground",
              scoreHeight
            )}
          >
            {game.config.teams.away.name || "先攻"}
          </div>
          <div
            className={cn(
              "flex w-24 items-center truncate px-3 text-sm font-bold text-foreground",
              scoreHeight
            )}
          >
            {game.config.teams.home.name || "後攻"}
          </div>
        </div>

        <div ref={scrollRef} className="min-w-0 overflow-x-auto scrollbar-hide">
          <div className="inline-flex">
            {Array.from({ length: inningCount }, (_, i) => {
              const inning = i + 1;
              const isCurrentInning = inning === currentInning;

              return (
                <div key={inning} className="flex-shrink-0 w-8">
                  <div
                    className={cn(
                      "flex items-center justify-center border-b border-border text-xs font-bold",
                      headerHeight,
                      isCurrentInning
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {inning}
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-center border-b border-border font-mono text-sm tabular-nums",
                      scoreHeight,
                      isCurrentInning && game.currentState.half === "top"
                        ? "bg-accent/20"
                        : ""
                    )}
                  >
                    {scores.away[i] !== null ? scores.away[i] : "-"}
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-center font-mono text-sm tabular-nums",
                      scoreHeight,
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
              <div
                className={cn(
                  "flex items-center justify-center border-b border-border bg-secondary/70 text-xs font-bold text-muted-foreground",
                  headerHeight
                )}
              >
                R
              </div>
              <div
                className={cn(
                  "flex items-center justify-center border-b border-border font-mono text-sm font-bold text-primary tabular-nums",
                  scoreHeight
                )}
              >
                {scores.awayTotal}
              </div>
              <div
                className={cn(
                  "flex items-center justify-center font-mono text-sm font-bold text-primary tabular-nums",
                  scoreHeight
                )}
              >
                {scores.homeTotal}
              </div>
            </div>
            <div className="w-8 border-l border-border">
              <div
                className={cn(
                  "flex items-center justify-center border-b border-border bg-secondary/70 text-xs font-bold text-muted-foreground",
                  headerHeight
                )}
              >
                H
              </div>
              <div
                className={cn(
                  "flex items-center justify-center border-b border-border font-mono text-sm text-foreground tabular-nums",
                  scoreHeight
                )}
              >
                {awayStats.hits}
              </div>
              <div
                className={cn(
                  "flex items-center justify-center font-mono text-sm text-foreground tabular-nums",
                  scoreHeight
                )}
              >
                {homeStats.hits}
              </div>
            </div>
            <div className="w-8 border-l border-border">
              <div
                className={cn(
                  "flex items-center justify-center border-b border-border bg-secondary/70 text-xs font-bold text-muted-foreground",
                  headerHeight
                )}
              >
                E
              </div>
              <div
                className={cn(
                  "flex items-center justify-center border-b border-border font-mono text-sm text-foreground tabular-nums",
                  scoreHeight
                )}
              >
                {awayStats.errors}
              </div>
              <div
                className={cn(
                  "flex items-center justify-center font-mono text-sm text-foreground tabular-nums",
                  scoreHeight
                )}
              >
                {homeStats.errors}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
