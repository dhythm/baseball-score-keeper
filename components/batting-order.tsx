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
import {
  getAtBatCellDisplayText,
  getBaseRunningCellDisplayText,
  getPlayerInningScorebookEvents,
  getEffectiveTotalInnings,
} from "@/lib/game-utils";
import { AtBatEditSheet } from "@/components/at-bat-edit-sheet";
import { ScorebookAtBatLine } from "@/components/scorebook-at-bat-line";

interface BattingOrderPanelProps {
  game: Game;
}

function OrderList({
  game,
  teamSide,
  isBattingTeam,
  onEditAtBat,
}: {
  game: Game;
  teamSide: TeamSide;
  isBattingTeam: boolean;
  onEditAtBat: (eventId: string) => void;
}) {
  const team = game.teams[teamSide];
  const batterIndex = game.currentState.currentBatterIndex[teamSide];
  const playerCount = team.players.length;
  const nextIndex =
    playerCount > 0 ? (batterIndex + 1) % playerCount : 0;
  const showNextBadge =
    isBattingTeam && playerCount > 1 && nextIndex !== batterIndex;

  const inningCount = getEffectiveTotalInnings(game);
  const halfForTeam = teamSide === "away" ? "top" : "bottom";

  const thInning =
    "min-w-9 border-b border-border px-0.5 py-1.5 text-center text-[11px] font-bold tabular-nums sm:text-xs";
  const tdInning =
    "min-w-9 border-b border-border px-0.5 py-1 align-middle text-center";

  return (
    <div
      className="overflow-x-auto rounded-lg border border-border bg-card touch-pan-x"
      aria-label={`${team.name || (teamSide === "away" ? "先攻" : "後攻")}の打順`}
    >
      <table className="w-max min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th
              className="sticky left-0 z-20 w-8 min-w-8 border-r border-border bg-muted/50 px-1 py-1.5 text-center text-[10px] font-semibold text-muted-foreground sm:text-xs"
              scope="col"
            >
              #
            </th>
            <th
              className="sticky left-8 z-20 w-28 min-w-28 border-r border-border bg-muted/50 px-1 py-1.5 text-left text-[10px] font-semibold text-muted-foreground sm:text-xs"
              scope="col"
            >
              選手
            </th>
            {Array.from({ length: inningCount }, (_, idx) => {
              const inningNum = idx + 1;
              const isLiveColumn =
                inningNum === game.currentState.inning &&
                game.currentState.half === halfForTeam;
              return (
                <th
                  key={inningNum}
                  scope="col"
                  className={cn(
                    thInning,
                    isLiveColumn && "bg-accent/25 text-accent-foreground"
                  )}
                >
                  {inningNum}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {team.players.map((player, i) => {
            const isCurrent = isBattingTeam && i === batterIndex;
            const isNext =
              showNextBadge && i === nextIndex && !isCurrent;

            return (
              <tr
                key={player.id}
                className={cn(
                  isCurrent && "bg-primary/10",
                  !isCurrent && isNext && "bg-muted/50"
                )}
              >
                <td
                  className={cn(
                    "sticky left-0 z-10 w-8 min-w-8 border-r border-border bg-card px-1 py-1.5 text-center font-mono text-xs tabular-nums text-muted-foreground",
                    isCurrent && "bg-primary/10",
                    !isCurrent && isNext && "bg-muted/50"
                  )}
                >
                  {i + 1}
                </td>
                <td
                  className={cn(
                    "sticky left-8 z-10 w-28 min-w-28 border-r border-border bg-card px-1 py-1.5 align-top",
                    isCurrent && "bg-primary/10",
                    !isCurrent && isNext && "bg-muted/50"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={cn(
                        "line-clamp-2 text-xs leading-snug sm:text-sm",
                        isCurrent ? "font-bold text-foreground" : "text-foreground"
                      )}
                    >
                      {player.name}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-primary">
                          打席
                        </span>
                      )}
                      {isNext && (
                        <span className="text-[10px] text-muted-foreground">
                          次
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                {Array.from({ length: inningCount }, (_, idx) => {
                  const inningNum = idx + 1;
                  const cellEvents = getPlayerInningScorebookEvents(
                    game.events,
                    player.id,
                    teamSide,
                    inningNum
                  );
                  const isLiveColumn =
                    inningNum === game.currentState.inning &&
                    game.currentState.half === halfForTeam;

                  return (
                    <td
                      key={inningNum}
                      className={cn(
                        tdInning,
                        isLiveColumn && "bg-accent/10"
                      )}
                    >
                      {cellEvents.length === 0 ? (
                        <span className="text-muted-foreground/40">·</span>
                      ) : (
                        <div className="flex min-h-10 flex-col items-center justify-center gap-0.5">
                          {cellEvents.map((ev) => (
                            <button
                              key={ev.id}
                              type="button"
                              className={cn(
                                "min-h-9 w-full max-w-[3.25rem] rounded border bg-background px-0.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums shadow-sm",
                                ev.type === "atBat"
                                  ? "border-border text-primary hover:border-primary/50 hover:bg-accent/40 active:bg-accent"
                                  : "border-dashed border-muted-foreground/40 text-primary hover:border-primary/50 hover:bg-accent/40 active:bg-accent"
                              )}
                              onClick={() => onEditAtBat(ev.id)}
                              aria-label={
                                ev.type === "atBat"
                                  ? `${inningNum}回の打席 ${getAtBatCellDisplayText(ev)}を修正`
                                  : `${inningNum}回の走塁 ${getBaseRunningCellDisplayText(ev)}を修正`
                              }
                            >
                              {ev.type === "atBat" ? (
                                <ScorebookAtBatLine event={ev} />
                              ) : (
                                <span className="line-clamp-2 break-all px-0.5 text-[10px] leading-tight sm:text-[11px]">
                                  {getBaseRunningCellDisplayText(ev)}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function BattingOrderPanel({ game }: BattingOrderPanelProps) {
  const { half } = game.currentState;
  const battingTeamSide: TeamSide = half === "top" ? "away" : "home";
  const [activeTab, setActiveTab] = useState<TeamSide>(battingTeamSide);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

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
          列は1回〜のイニング（先攻は表・後攻は裏）。表記は日本語でも可。打点は得点が付いた打席で2行目に表示されます。セルをタップして修正できます。
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
              onEditAtBat={setEditingEventId}
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
              onEditAtBat={setEditingEventId}
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
                onEditAtBat={setEditingEventId}
              />
            </TabsContent>
            <TabsContent value="home" className="mt-0">
              <OrderList
                game={game}
                teamSide="home"
                isBattingTeam={battingTeamSide === "home"}
                onEditAtBat={setEditingEventId}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>

      <AtBatEditSheet
        game={game}
        eventId={editingEventId}
        open={editingEventId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingEventId(null);
        }}
      />
    </Card>
  );
}
