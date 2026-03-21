"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DiamondField } from "@/components/diamond-field";
import type { Game } from "@/lib/types";
import { getCurrentBatter, getNextBatter } from "@/lib/game-utils";

interface GameSituationProps {
  game: Game;
}

function OutIndicator({ outs }: { outs: number }) {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border-2 ${
            i < outs
              ? "bg-primary border-primary"
              : "bg-transparent border-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

export function GameSituation({ game }: GameSituationProps) {
  const { inning, half, outs, runners } = game.currentState;
  const currentBatter = getCurrentBatter(game);
  const nextBatter = getNextBatter(game);

  const teamSide = half === "top" ? "away" : "home";
  const batterIndex = game.currentState.currentBatterIndex[teamSide];

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-foreground">
              {inning}回{half === "top" ? "表" : "裏"}
            </span>
            <OutIndicator outs={outs} />
            <span className="text-sm text-muted-foreground">
              {outs}アウト
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <DiamondField runners={runners} game={game} />
          </div>

          <div className="flex-1 min-w-0">
            {currentBatter && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-0.5">
                  打者
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    #{batterIndex + 1}
                  </span>
                  <span className="text-base font-bold text-foreground truncate">
                    {currentBatter.name}
                  </span>
                </div>
              </div>
            )}

            {nextBatter && (
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">
                  次打者
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    #{((batterIndex + 1) % game.teams[teamSide].players.length) + 1}
                  </span>
                  <span className="text-sm text-muted-foreground truncate">
                    {nextBatter.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
