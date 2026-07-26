"use client";

import type { Runners } from "@/lib/domain/types";
import type { AppGame } from "@/lib/app-state/types";
import { getPlayerById } from "@/lib/app-state/selectors";

interface DiamondFieldProps {
  runners: Runners;
  game: AppGame;
}

export function DiamondField({ runners, game }: DiamondFieldProps) {
  const firstRunner = runners.first ? getPlayerById(game, runners.first) : null;
  const secondRunner = runners.second ? getPlayerById(game, runners.second) : null;
  const thirdRunner = runners.third ? getPlayerById(game, runners.third) : null;

  return (
    <div className="relative w-full max-w-[200px] mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-auto">
        <line
          x1="50"
          y1="15"
          x2="85"
          y2="50"
          stroke="currentColor"
          strokeWidth="1"
          className="text-border"
        />
        <line
          x1="85"
          y1="50"
          x2="50"
          y2="85"
          stroke="currentColor"
          strokeWidth="1"
          className="text-border"
        />
        <line
          x1="50"
          y1="85"
          x2="15"
          y2="50"
          stroke="currentColor"
          strokeWidth="1"
          className="text-border"
        />
        <line
          x1="15"
          y1="50"
          x2="50"
          y2="15"
          stroke="currentColor"
          strokeWidth="1"
          className="text-border"
        />

        <rect
          x="45"
          y="10"
          width="10"
          height="10"
          transform="rotate(45 50 15)"
          className={runners.second ? "fill-accent" : "fill-card stroke-border"}
          strokeWidth="1.5"
        />

        <rect
          x="80"
          y="45"
          width="10"
          height="10"
          transform="rotate(45 85 50)"
          className={runners.first ? "fill-accent" : "fill-card stroke-border"}
          strokeWidth="1.5"
        />

        <rect
          x="10"
          y="45"
          width="10"
          height="10"
          transform="rotate(45 15 50)"
          className={runners.third ? "fill-accent" : "fill-card stroke-border"}
          strokeWidth="1.5"
        />

        <polygon
          points="50,80 45,88 50,92 55,88"
          className="fill-card stroke-border"
          strokeWidth="1.5"
        />
      </svg>

      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
        {secondRunner && (
          <div className="absolute top-[5%] left-1/2 -translate-x-1/2 text-[10px] font-medium text-accent-foreground bg-accent/90 px-1.5 py-0.5 rounded whitespace-nowrap">
            {secondRunner.name}
          </div>
        )}
        {firstRunner && (
          <div className="absolute top-[42%] right-[0%] text-[10px] font-medium text-accent-foreground bg-accent/90 px-1.5 py-0.5 rounded whitespace-nowrap">
            {firstRunner.name}
          </div>
        )}
        {thirdRunner && (
          <div className="absolute top-[42%] left-[0%] text-[10px] font-medium text-accent-foreground bg-accent/90 px-1.5 py-0.5 rounded whitespace-nowrap">
            {thirdRunner.name}
          </div>
        )}
      </div>
    </div>
  );
}
