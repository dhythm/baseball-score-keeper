"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Scoreboard } from "@/components/scoreboard";
import { BattingScorebookTable } from "@/components/batting-scorebook-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGame } from "@/lib/game-context";
import type { Half, TeamSide, TimelineEntry } from "@/lib/domain/types";
import type { AppGame } from "@/lib/app-state/types";
import { getPlayerById } from "@/lib/app-state/selectors";
import { formatEventNotation } from "@/lib/domain/notation";
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

function InningDetails({ game }: { game: AppGame }) {
  const groupedEntries: Record<string, TimelineEntry[]> = {};

  for (const entry of game.timeline) {
    if (!entry.applied) continue;
    const key = `${entry.inning}-${entry.half}`;
    if (!groupedEntries[key]) {
      groupedEntries[key] = [];
    }
    groupedEntries[key].push(entry);
  }

  const innings = Object.keys(groupedEntries).sort((a, b) => {
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
            const entries = groupedEntries[key];
            const teamSide = half === "top" ? "away" : "home";
            const teamName = game.teams[teamSide].name;

            return (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="px-4 text-sm">
                  {inning}回{half === "top" ? "表" : "裏"} ({teamName})
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {entries.map((entry, index) => {
                      const event = entry.event;
                      if (event.kind === "atBat") {
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
                            <span>{formatEventNotation(event)}</span>
                            {event.note && (
                              <span className="text-muted-foreground text-xs">
                                ({event.note})
                              </span>
                            )}
                            {entry.runsScored > 0 && (
                              <span className="text-primary font-semibold">
                                +{entry.runsScored}点
                              </span>
                            )}
                          </div>
                        );
                      }

                      if (event.kind === "baseRunning") {
                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <span className="w-6">#{index + 1}</span>
                            <span>{formatEventNotation(event)}</span>
                            {entry.runsScored > 0 && (
                              <span className="text-primary font-semibold">
                                +{entry.runsScored}点
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
    dispatch({ type: "RESUME_GAME" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span className="text-xl">&#9918;</span>
          試合終了
        </h1>
      </header>

      <main className="w-full max-w-full mx-auto space-y-4 px-3 pt-4 pb-[max(7rem,env(safe-area-inset-bottom)+5.5rem)] sm:px-4 md:max-w-3xl md:mx-auto lg:max-w-5xl xl:max-w-6xl xl:px-8">
        <Scoreboard game={game} />
        <Card className="border-border py-4 gap-2">
          <CardHeader className="px-4 pb-0 pt-0 sm:px-6">
            <CardTitle className="text-base">打撃成績</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              集計とイニングごとの打席結果。横にスクロールして全イニングを表示できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-0 pt-2 sm:px-6">
            <Tabs defaultValue="away" className="gap-3">
              <TabsList className="h-11 w-full grid grid-cols-2 p-1 touch-manipulation sm:h-10">
                <TabsTrigger
                  value="away"
                  className="truncate text-sm data-[state=active]:font-semibold"
                >
                  {game.teams.away.name || "先攻"}
                </TabsTrigger>
                <TabsTrigger
                  value="home"
                  className="truncate text-sm data-[state=active]:font-semibold"
                >
                  {game.teams.home.name || "後攻"}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="away" className="mt-0">
                <BattingScorebookTable game={game} teamSide="away" />
              </TabsContent>
              <TabsContent value="home" className="mt-0">
                <BattingScorebookTable game={game} teamSide="home" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <InningDetails game={game} />
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-full space-y-2 md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
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
