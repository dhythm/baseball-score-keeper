"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import type { Half, TimelineEntry } from "@/lib/domain/types";
import type { AppGame } from "@/lib/app-state/types";
import { getPlayerById } from "@/lib/app-state/selectors";
import { formatEventNotation } from "@/lib/domain/notation";
import { RotateCcw, Edit, Share2, Download } from "lucide-react";
import { toast } from "sonner";
import { toPersistedGame } from "@/lib/app-state/selectors";
import { exportGameAsJson, exportGameAsText } from "@/lib/export/game-log";
import { getPitcherStats } from "@/lib/domain/pitching";
import { GameHistory } from "@/components/game-history";
import { FeedbackDialog } from "@/components/feedback-dialog";
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
    const [bInning] = b.split("-");
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

                      return (
                        <div
                          key={event.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <span className="w-6">#{index + 1}</span>
                          <span>{formatEventNotation(event)}</span>
                        </div>
                      );
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

function PitchingSummary({ game }: { game: AppGame }) {
  return (
    <Card className="gap-3 border-border py-4">
      <CardHeader className="px-4 py-0">
        <CardTitle className="text-base">投手成績</CardTitle>
        <CardDescription className="text-xs">
          記録された投手交代ごとに集計しています。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2">
        {(["away", "home"] as const).map((side) => {
          const team = game.config.teams[side];
          const roster = [...team.players, ...(team.benchPlayers ?? [])];
          const pitchingLines = getPitcherStats(
            game.timeline,
            side,
            team.startingPitcherId ?? null
          );
          return (
            <div
              key={side}
              className="space-y-2 rounded-lg border border-border p-3"
            >
              <p className="truncate text-sm font-semibold">{team.name}</p>
              {pitchingLines.map((stats, index) => {
                const pitcherName =
                  stats.pitcherId === null
                    ? team.startingPitcherName || `${team.name} 先発`
                    : (roster.find((player) => player.id === stats.pitcherId)
                        ?.name ?? stats.pitcherId);
                return (
                  <div
                    key={`${stats.pitcherId ?? "starter"}-${index}`}
                    className="rounded-md bg-muted/50 px-2.5 py-2"
                  >
                    <p className="truncate text-xs font-semibold">
                      {pitcherName}
                      <span className="ml-1 font-normal text-muted-foreground">
                        {stats.role === "starter" ? "先発" : "救援"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stats.inningsPitched}回・被安打{stats.hitsAllowed}・失点
                      {stats.runsAllowed}・与四球{stats.walksAllowed}・奪三振
                      {stats.strikeouts}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function GameResult() {
  const { game, dispatch, resetGame } = useGame();
  const router = useRouter();
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);

  if (!game) return null;

  const handleNewGame = () => {
    resetGame();
    setShowNewGameDialog(false);
    router.replace("/");
  };

  const handleContinueGame = () => {
    dispatch({ type: "RESUME_GAME" });
  };

  const handleShare = async () => {
    const text = exportGameAsText(toPersistedGame(game));
    try {
      if (navigator.share) {
        await navigator.share({ title: "試合結果", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("試合結果をコピーしました");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("共有できませんでした");
      }
    }
  };

  const handleJsonDownload = () => {
    const json = exportGameAsJson(toPersistedGame(game));
    const url = URL.createObjectURL(
      new Blob([json], { type: "application/json" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `scorebook-${game.date.slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("JSONを書き出しました");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-primary-foreground/10 bg-primary px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] text-primary-foreground shadow-sm">
        <h1 className="flex items-center gap-2 text-lg font-extrabold">
          <span className="text-xl">&#9918;</span>
          試合終了
        </h1>
        <FeedbackDialog />
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-4 px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-4 lg:px-6">
        <Scoreboard game={game} />
        {game.currentState.gameEndReasonDetail && (
          <p className="rounded-lg bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
            終了理由: {game.currentState.gameEndReasonDetail}
          </p>
        )}
        <PitchingSummary game={game} />
        <Card className="border-border py-4 gap-2">
          <CardHeader className="px-4 pb-0 pt-0 sm:px-6">
            <CardTitle className="text-base">打撃成績</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              集計とイニングごとの打席結果。横にスクロールして全イニングを表示できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-0 pt-2 sm:px-6">
            <Tabs defaultValue="away" className="gap-3">
              <TabsList className="grid h-11 w-full grid-cols-2 p-1 touch-manipulation">
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
        <GameHistory />
        <section className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
          <h2 className="mb-3 text-sm font-bold text-foreground">試合データ</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button variant="secondary" className="h-11" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              共有
            </Button>
            <Button
              variant="secondary"
              className="h-11"
              onClick={handleJsonDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              JSON
            </Button>
            <Button
              variant="outline"
              className="col-span-2 h-11 sm:col-span-1"
              onClick={handleContinueGame}
            >
              <Edit className="mr-2 h-4 w-4" />
              試合を続ける
            </Button>
            <Button
              className="col-span-2 h-11 font-bold sm:col-span-1"
              onClick={() => setShowNewGameDialog(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              新しい試合
            </Button>
          </div>
        </section>
      </main>

      <AlertDialog open={showNewGameDialog} onOpenChange={setShowNewGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>新しい試合を開始しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              試合設定画面へ戻ります。現在の試合は履歴からもう一度開けます。
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
