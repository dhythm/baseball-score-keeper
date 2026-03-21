"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronDown } from "lucide-react";
import type {
  AtBatResult,
  Base,
  BaseRunningType,
  ResultCategory,
  Game,
} from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BaseRunningEventSheet } from "./base-running-event-sheet";

interface AtBatInputProps {
  game: Game;
  onResult: (result: AtBatResult, detail?: string) => void;
  onBaseRunningEvent: (
    runnerId: string,
    type: BaseRunningType,
    to: Base | "home" | "out"
  ) => void;
}

const CATEGORIES: { id: ResultCategory; label: string; variant: "default" | "secondary" | "outline" }[] = [
  { id: "hit", label: "安打", variant: "default" },
  { id: "out", label: "アウト", variant: "secondary" },
  { id: "walk", label: "四死球", variant: "secondary" },
  { id: "error", label: "エラー", variant: "outline" },
  { id: "other", label: "その他", variant: "outline" },
];

const CATEGORY_RESULTS: Record<ResultCategory, { result: AtBatResult; label: string }[]> = {
  hit: [
    { result: "single", label: "シングル" },
    { result: "double", label: "ツーベース" },
    { result: "triple", label: "スリーベース" },
    { result: "homerun", label: "ホームラン" },
  ],
  out: [
    { result: "groundOut", label: "ゴロ" },
    { result: "flyOut", label: "フライ" },
    { result: "strikeout", label: "三振" },
    { result: "doublePlay", label: "併殺打" },
    { result: "otherOut", label: "その他" },
  ],
  walk: [
    { result: "walk", label: "フォアボール" },
    { result: "hitByPitch", label: "デッドボール" },
  ],
  error: [{ result: "error", label: "エラー出塁" }],
  other: [
    { result: "sacrifice", label: "犠打" },
    { result: "fieldersChoice", label: "FC" },
    { result: "interference", label: "打撃妨害" },
  ],
};

export function AtBatInput({ game, onResult, onBaseRunningEvent }: AtBatInputProps) {
  const [selectedCategory, setSelectedCategory] = useState<ResultCategory | null>(null);
  const [resultDetail, setResultDetail] = useState("");
  const [baseRunningOpen, setBaseRunningOpen] = useState(false);

  const handleCategorySelect = (category: ResultCategory) => {
    setSelectedCategory(category);
    setResultDetail("");
  };

  const handleResultSelect = (result: AtBatResult) => {
    onResult(result, resultDetail || undefined);
    setSelectedCategory(null);
    setResultDetail("");
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setResultDetail("");
  };

  const hasRunners =
    game.currentState.runners.first ||
    game.currentState.runners.second ||
    game.currentState.runners.third;

  const currentOuts = game.currentState.outs;

  if (selectedCategory) {
    const results = CATEGORY_RESULTS[selectedCategory];
    const categoryLabel = CATEGORIES.find((c) => c.id === selectedCategory)?.label;

    return (
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              戻る
            </Button>
            <span className="text-sm font-semibold text-foreground">
              {categoryLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {results.map(({ result, label }) => {
              const isDoublePlayDisabled = result === "doublePlay" && currentOuts >= 2;
              
              return (
                <Button
                  key={result}
                  variant="secondary"
                  className="h-12 text-sm font-medium touch-manipulation"
                  onClick={() => handleResultSelect(result)}
                  disabled={isDoublePlayDisabled}
                >
                  {label}
                  {isDoublePlayDisabled && (
                    <span className="text-xs ml-1 text-muted-foreground">(2アウト)</span>
                  )}
                </Button>
              );
            })}
          </div>

          {selectedCategory === "out" && (
            <div className="mt-3">
              <Input
                placeholder="補足メモ (例: ショートゴロ)"
                value={resultDetail}
                onChange={(e) => setResultDetail(e.target.value)}
                className="text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {CATEGORIES.slice(0, 3).map(({ id, label, variant }) => (
            <Button
              key={id}
              variant={variant}
              className="h-12 text-sm font-semibold touch-manipulation"
              onClick={() => handleCategorySelect(id)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {CATEGORIES.slice(3).map(({ id, label, variant }) => (
            <Button
              key={id}
              variant={variant}
              className="h-12 text-sm font-semibold touch-manipulation"
              onClick={() => handleCategorySelect(id)}
            >
              {label}
            </Button>
          ))}
        </div>

        {hasRunners && (
          <Sheet open={baseRunningOpen} onOpenChange={setBaseRunningOpen}>
            <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-12 text-sm font-medium justify-between touch-manipulation"
            >
                <span>打席外イベント</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[70vh]">
              <SheetHeader>
                <SheetTitle>打席外イベント</SheetTitle>
              </SheetHeader>
              <BaseRunningEventSheet
                game={game}
                onEvent={(runnerId, type, to) => {
                  onBaseRunningEvent(runnerId, type, to);
                  setBaseRunningOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>
        )}
      </CardContent>
    </Card>
  );
}
