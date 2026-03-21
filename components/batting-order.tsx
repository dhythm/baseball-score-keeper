"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Game, TeamSide } from "@/lib/types";

interface BattingOrderPanelProps {
  game: Game;
}

function OrderList({
  game,
  teamSide,
  isBattingTeam,
}: {
  game: Game;
  teamSide: TeamSide;
  isBattingTeam: boolean;
}) {
  const team = game.teams[teamSide];
  const batterIndex = game.currentState.currentBatterIndex[teamSide];
  const playerCount = team.players.length;
  const nextIndex =
    playerCount > 0 ? (batterIndex + 1) % playerCount : 0;
  const showNextBadge =
    isBattingTeam && playerCount > 1 && nextIndex !== batterIndex;

  return (
    <ul
      className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden touch-manipulation"
      aria-label={`${team.name || (teamSide === "away" ? "先攻" : "後攻")}の打順`}
    >
      {team.players.map((player, i) => {
        const isCurrent = isBattingTeam && i === batterIndex;
        const isNext =
          showNextBadge && i === nextIndex && !isCurrent;

        return (
          <li
            key={player.id}
            className={cn(
              "flex min-h-11 items-center gap-2 px-3 py-2 sm:min-h-10",
              isCurrent &&
                "bg-primary/12 border-l-4 border-l-primary pl-2",
              !isCurrent && isNext && "bg-muted/60"
            )}
          >
            <span className="font-mono text-sm tabular-nums w-9 shrink-0 text-center text-muted-foreground">
              {i + 1}
            </span>
            <span
              className={cn(
                "flex-1 min-w-0 truncate text-base leading-snug",
                isCurrent ? "font-bold text-foreground" : "text-foreground"
              )}
            >
              {player.name}
            </span>
            {isCurrent && (
              <span className="text-xs font-semibold text-primary shrink-0">
                打席
              </span>
            )}
            {isNext && (
              <span className="text-xs text-muted-foreground shrink-0">
                次
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function BattingOrderPanel({ game }: BattingOrderPanelProps) {
  const { half } = game.currentState;
  const battingTeamSide: TeamSide = half === "top" ? "away" : "home";
  const [activeTab, setActiveTab] = useState<TeamSide>(battingTeamSide);

  useEffect(() => {
    setActiveTab(battingTeamSide);
  }, [battingTeamSide]);

  const awayName = game.teams.away.name || "先攻";
  const homeName = game.teams.home.name || "後攻";

  return (
    <Card className="border-border py-4 gap-3">
      <CardHeader className="px-4 py-0 sm:px-6">
        <CardTitle className="text-base">打順</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          攻撃中のチームに「打席」「次」を表示。スマホはタブ切替、PCは両チームを横に並べます。
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-0 pt-0 sm:px-6">
        <div className="hidden min-w-0 lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="min-w-0 space-y-2">
            <div className="flex items-baseline justify-between gap-2 border-b border-border pb-1">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {awayName}
              </h3>
              {battingTeamSide === "away" && (
                <span className="shrink-0 text-xs font-medium text-primary">
                  攻撃中
                </span>
              )}
            </div>
            <OrderList
              game={game}
              teamSide="away"
              isBattingTeam={battingTeamSide === "away"}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex items-baseline justify-between gap-2 border-b border-border pb-1">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {homeName}
              </h3>
              {battingTeamSide === "home" && (
                <span className="shrink-0 text-xs font-medium text-primary">
                  攻撃中
                </span>
              )}
            </div>
            <OrderList
              game={game}
              teamSide="home"
              isBattingTeam={battingTeamSide === "home"}
            />
          </div>
        </div>

        <div className="min-w-0 lg:hidden">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TeamSide)}
            className="gap-3"
          >
            <TabsList className="h-11 w-full min-w-0 grid grid-cols-2 p-1 sm:h-10 touch-manipulation">
              <TabsTrigger
                value="away"
                className="min-w-0 text-sm px-2 data-[state=active]:font-semibold"
              >
                <span className="truncate">{awayName}</span>
              </TabsTrigger>
              <TabsTrigger
                value="home"
                className="min-w-0 text-sm px-2 data-[state=active]:font-semibold"
              >
                <span className="truncate">{homeName}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="away" className="mt-0">
              <OrderList
                game={game}
                teamSide="away"
                isBattingTeam={battingTeamSide === "away"}
              />
            </TabsContent>
            <TabsContent value="home" className="mt-0">
              <OrderList
                game={game}
                teamSide="home"
                isBattingTeam={battingTeamSide === "home"}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
