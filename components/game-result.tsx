"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Scoreboard } from "@/components/scoreboard";
import { useGame } from "@/lib/game-context";
import type { Game, GameEvent, TeamSide, Half } from "@/lib/types";
import { getPlayerStats, getPlayerById } from "@/lib/game-utils";
import { RESULT_LABELS, BASE_RUNNING_LABELS } from "@/lib/types";
import { RotateCcw, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function BattingStats({ game, teamSide }: { game: Game; teamSide: TeamSide }) {
  const team = game.teams[teamSide];

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          {team.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-xs">選手</TableHead>
              <TableHead className="text-center text-xs w-10">打数</TableHead>
              <TableHead className="text-center text-xs w-10">安打</TableHead>
              <TableHead className="text-center text-xs w-10">打点</TableHead>
              <TableHead className="text-center text-xs w-10">得点</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.players.map((player) => {
              const stats = getPlayerStats(game.events, player.id);
              return (
                <TableRow key={player.id}>
                  <TableCell className="font-medium text-sm py-2">
                    {player.name}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm tabular-nums">
                    {stats.atBats}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm tabular-nums">
                    {stats.hits}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm tabular-nums">
                    {stats.rbi}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm tabular-nums">
                    {stats.runs}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function InningDetails({ game }: { game: Game }) {
  const groupedEvents: Record<string, GameEvent[]> = {};

  for (const event of game.events) {
    const key = `${event.inning}-${event.half}`;
    if (!groupedEvents[key]) {
      groupedEvents[key] = [];
    }
    groupedEvents[key].push(event);
  }

  const innings = Object.keys(groupedEvents).sort((a, b) => {
    const [aInning, aHalf] = a.split("-");
    const [bInning, bHalf] = b.split("-");
    if (aInning !== bInning) return parseInt(aInning) - parseInt(bInning);
    return aHalf === "top" ? -1 : 1;
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          イニング詳細
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          {innings.map((key) => {
            const [inning, half] = key.split("-") as [string, Half];
            const events = groupedEvents[key];
            const teamSide = half === "top" ? "away" : "home";
            const teamName = game.teams[teamSide].name;

            return (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="px-4 text-sm">
                  {inning}回{half === "top" ? "表" : "裏"} ({teamName})
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {events.map((event, index) => {
                      if (event.type === "atBat" && event.batterId && event.result) {
                        const batter = getPlayerById(game, event.batterId);
                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="text-muted-foreground w-6">
                              #{index + 1}
                            </span>
                            <span className="font-medium">
                              {batter?.name ?? "不明"}
                            </span>
                            <span className="text-muted-foreground">:</span>
                            <span>{RESULT_LABELS[event.result]}</span>
                            {event.resultDetail && (
                              <span className="text-muted-foreground text-xs">
                                ({event.resultDetail})
                              </span>
                            )}
                            {event.runsScored > 0 && (
                              <span className="text-primary font-semibold">
                                +{event.runsScored}点
                              </span>
                            )}
                          </div>
                        );
                      }

                      if (event.type === "baseRunning" && event.baseRunningType) {
                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <span className="w-6">#{index + 1}</span>
                            <span>{BASE_RUNNING_LABELS[event.baseRunningType]}</span>
                            {event.runsScored > 0 && (
                              <span className="text-primary font-semibold">
                                +{event.runsScored}点
                              </span>
                            )}
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

export function GameResult() {
  const { game, dispatch } = useGame();
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);

  if (!game) return null;

  const handleNewGame = () => {
    dispatch({ type: "RESET_GAME" });
    setShowNewGameDialog(false);
  };

  const handleContinueGame = () => {
    dispatch({ type: "UNDO_LAST_EVENT" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span className="text-xl">&#9918;</span>
          試合終了
        </h1>
      </header>

      <main className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
        <Scoreboard game={game} />
        <BattingStats game={game} teamSide="away" />
        <BattingStats game={game} teamSide="home" />
        <InningDetails game={game} />
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-lg mx-auto space-y-2">
          <Button
            variant="outline"
            className="w-full h-10"
            onClick={handleContinueGame}
          >
            <Edit className="h-4 w-4 mr-2" />
            試合を続ける
          </Button>
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={() => setShowNewGameDialog(true)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            新しい試合を開始
          </Button>
        </div>
      </div>

      <AlertDialog open={showNewGameDialog} onOpenChange={setShowNewGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>新しい試合を開始しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在の試合データは削除されます。この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleNewGame}>
              新しい試合を開始
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
