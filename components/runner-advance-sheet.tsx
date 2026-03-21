"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AtBatResult, Game, Base, RunnerMovement } from "@/lib/types";
import { getPlayerById, getDefaultMovements, getCurrentBatter } from "@/lib/game-utils";
import { RESULT_LABELS } from "@/lib/types";

interface RunnerAdvanceSheetProps {
  game: Game;
  result: AtBatResult;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (movements: RunnerMovement[], outsInPlay: number, runsScored: number) => void;
}

type Destination = Base | "home" | "out";

interface RunnerState {
  playerId: string;
  name: string;
  from: "batter" | Base;
  to: Destination;
}

export function RunnerAdvanceSheet({
  game,
  result,
  open,
  onOpenChange,
  onConfirm,
}: RunnerAdvanceSheetProps) {
  const { runners, outs } = game.currentState;
  const currentBatter = getCurrentBatter(game);

  const initialMovements = useMemo(() => {
    if (!currentBatter) return [];
    return getDefaultMovements(result, runners, currentBatter.id, outs);
  }, [result, runners, currentBatter, outs]);

  const [runnerStates, setRunnerStates] = useState<RunnerState[]>([]);

  useEffect(() => {
    if (!open || !currentBatter) return;

    const states: RunnerState[] = [];

    if (runners.third) {
      const player = getPlayerById(game, runners.third);
      const defaultMovement = initialMovements.find((m) => m.from === "third");
      states.push({
        playerId: runners.third,
        name: player?.name ?? "不明",
        from: "third",
        to: defaultMovement?.to ?? "third",
      });
    }

    if (runners.second) {
      const player = getPlayerById(game, runners.second);
      const defaultMovement = initialMovements.find((m) => m.from === "second");
      states.push({
        playerId: runners.second,
        name: player?.name ?? "不明",
        from: "second",
        to: defaultMovement?.to ?? "second",
      });
    }

    if (runners.first) {
      const player = getPlayerById(game, runners.first);
      const defaultMovement = initialMovements.find((m) => m.from === "first");
      states.push({
        playerId: runners.first,
        name: player?.name ?? "不明",
        from: "first",
        to: defaultMovement?.to ?? "first",
      });
    }

    const batterMovement = initialMovements.find((m) => m.from === "batter");
    states.push({
      playerId: currentBatter.id,
      name: currentBatter.name,
      from: "batter",
      to: batterMovement?.to ?? "first",
    });

    setRunnerStates(states);
  }, [open, game, runners, currentBatter, initialMovements]);

  const updateRunnerDestination = (playerId: string, to: Destination) => {
    setRunnerStates((prev) =>
      prev.map((r) => (r.playerId === playerId ? { ...r, to } : r))
    );
  };

  const getDestinationOptions = (from: "batter" | Base): { value: Destination; label: string }[] => {
    const options: { value: Destination; label: string }[] = [];

    if (from === "batter") {
      options.push({ value: "first", label: "1塁" });
      if (result === "double") options.push({ value: "second", label: "2塁" });
      if (result === "triple") options.push({ value: "third", label: "3塁" });
      if (result === "homerun") options.push({ value: "home", label: "ホーム" });
      options.push({ value: "out", label: "アウト" });
    } else {
      if (from === "first") {
        options.push({ value: "first", label: "1塁" });
        options.push({ value: "second", label: "2塁" });
        options.push({ value: "third", label: "3塁" });
      }
      if (from === "second") {
        options.push({ value: "second", label: "2塁" });
        options.push({ value: "third", label: "3塁" });
      }
      if (from === "third") {
        options.push({ value: "third", label: "3塁" });
      }
      options.push({ value: "home", label: "ホーム" });
      options.push({ value: "out", label: "アウト" });
    }

    return options;
  };

  const calculatePreview = () => {
    let runsScored = 0;
    let outsAdded = 0;
    const scorers: string[] = [];

    for (const runner of runnerStates) {
      if (runner.to === "home") {
        if (outs + outsAdded < 3) {
          runsScored++;
          scorers.push(runner.name);
        }
      } else if (runner.to === "out") {
        outsAdded++;
      }
    }

    const totalOuts = Math.min(outs + outsAdded, 3);

    return { runsScored, outsAdded, totalOuts, scorers };
  };

  const checkDuplicateBases = () => {
    const occupiedBases: Record<Base, string[]> = {
      first: [],
      second: [],
      third: [],
    };

    for (const runner of runnerStates) {
      if (runner.to === "first" || runner.to === "second" || runner.to === "third") {
        occupiedBases[runner.to].push(runner.name);
      }
    }

    const duplicates: string[] = [];
    for (const [base, names] of Object.entries(occupiedBases)) {
      if (names.length > 1) {
        const baseLabel = base === "first" ? "1塁" : base === "second" ? "2塁" : "3塁";
        duplicates.push(`${baseLabel}に${names.join("と")}が重複`);
      }
    }

    return duplicates;
  };

  const preview = calculatePreview();
  const duplicates = checkDuplicateBases();
  const hasErrors = duplicates.length > 0;

  const handleConfirm = () => {
    const movements: RunnerMovement[] = runnerStates.map((r) => ({
      playerId: r.playerId,
      from: r.from,
      to: r.to,
      isRBI: r.to === "home" && r.from !== "batter" && ["single", "double", "triple", "homerun", "sacrifice", "walk", "hitByPitch"].includes(result),
    }));

    const batterMovement = movements.find((m) => m.from === "batter" && m.to === "home");
    if (batterMovement && result === "homerun") {
      batterMovement.isRBI = true;
    }

    onConfirm(movements, preview.outsAdded, preview.runsScored);
  };

  const getFromLabel = (from: "batter" | Base) => {
    switch (from) {
      case "batter":
        return "打者";
      case "first":
        return "1塁";
      case "second":
        return "2塁";
      case "third":
        return "3塁";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>ランナー進塁確認</SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-6">
          <div className="bg-secondary/50 rounded-lg px-3 py-2">
            <span className="text-sm text-muted-foreground">打席結果: </span>
            <span className="text-sm font-semibold text-foreground">
              {RESULT_LABELS[result]}
            </span>
          </div>

          <div className="space-y-4">
            {runnerStates.map((runner) => (
              <div key={runner.playerId} className="space-y-2">
                <Label className="text-sm font-medium">
                  {getFromLabel(runner.from)}: {runner.name}
                </Label>
                <ToggleGroup
                  type="single"
                  value={runner.to}
                  onValueChange={(value) => {
                    if (value) updateRunnerDestination(runner.playerId, value as Destination);
                  }}
                  className="justify-start flex-wrap"
                >
                  {getDestinationOptions(runner.from).map(({ value, label }) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      className="text-sm"
                    >
                      {label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            ))}
          </div>

          {duplicates.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              <p className="text-sm text-destructive font-medium">警告</p>
              {duplicates.map((d, i) => (
                <p key={i} className="text-sm text-destructive">
                  {d}
                </p>
              ))}
            </div>
          )}

          <div className="bg-secondary rounded-lg px-4 py-3 space-y-1">
            <p className="text-sm font-medium text-foreground">プレビュー</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">得点:</span>
              <span className="font-mono font-semibold text-primary">
                +{preview.runsScored}
                {preview.scorers.length > 0 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    ({preview.scorers.join(", ")})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">アウト:</span>
              <span className="font-mono">
                +{preview.outsAdded} → 合計{preview.totalOuts}アウト
              </span>
            </div>
          </div>

          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={handleConfirm}
            disabled={hasErrors}
          >
            確定
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
