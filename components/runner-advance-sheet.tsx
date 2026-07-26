"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AtBatResult, Base } from "@/lib/types";
import type { RunnerMovement, Runners } from "@/lib/domain/types";
import type { AppGame } from "@/lib/app-state/types";
import { getCurrentBatter, getPlayerById } from "@/lib/app-state/selectors";
import { getDefaultMovementsForSelection } from "@/lib/app-state/event-factory";
import { RESULT_LABELS } from "@/lib/types";

type Destination = Base | "home" | "out";

function defaultRbiWhenScoring(
  result: AtBatResult,
  from: "batter" | Base,
  to: Destination
): boolean {
  if (to !== "home") return false;
  if (from === "batter" && result === "homerun") return true;
  if (from === "batter") return false;
  return ["single", "double", "triple", "homerun", "sacrifice", "walk", "hitByPitch"].includes(
    result
  );
}

interface RunnerAdvanceSheetProps {
  game: AppGame;
  result: AtBatResult;
  detail?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (movements: RunnerMovement[], outsInPlay: number, runsScored: number) => void;
  context?: {
    runners: Runners;
    outs: number;
    batterId: string;
  };
  initialMovementsOverride?: RunnerMovement[];
}

interface RunnerState {
  playerId: string;
  name: string;
  from: "batter" | Base;
  to: Destination;
}

export function RunnerAdvanceSheet({
  game,
  result,
  detail,
  open,
  onOpenChange,
  onConfirm,
  context,
  initialMovementsOverride,
}: RunnerAdvanceSheetProps) {
  const runners = context?.runners ?? game.currentState.runners;
  const outs = context?.outs ?? game.currentState.outs;
  const currentBatter = context
    ? getPlayerById(game, context.batterId)
    : getCurrentBatter(game);

  const initialMovements = useMemo(() => {
    if (initialMovementsOverride) return initialMovementsOverride;
    if (!currentBatter) return [];
    return getDefaultMovementsForSelection(
      result,
      detail,
      runners,
      currentBatter.id,
      outs
    );
  }, [
    result,
    detail,
    runners,
    currentBatter,
    outs,
    initialMovementsOverride,
  ]);

  const [runnerStates, setRunnerStates] = useState<RunnerState[]>([]);
  const [rbiByPlayerId, setRbiByPlayerId] = useState<Record<string, boolean>>({});

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
    const rbi: Record<string, boolean> = {};
    for (const r of states) {
      if (r.to === "home") {
        rbi[r.playerId] = defaultRbiWhenScoring(result, r.from, r.to);
      }
    }
    setRbiByPlayerId(rbi);
  }, [open, game, runners, currentBatter, initialMovements, result]);

  const updateRunnerDestination = (playerId: string, to: Destination) => {
    setRunnerStates((prev) => {
      const old = prev.find((r) => r.playerId === playerId);
      if (old) {
        setRbiByPlayerId((prevRbi) => {
          const next = { ...prevRbi };
          if (to === "home") {
            next[playerId] = defaultRbiWhenScoring(result, old.from, to);
          } else {
            delete next[playerId];
          }
          return next;
        });
      }
      return prev.map((r) => (r.playerId === playerId ? { ...r, to } : r));
    });
  };

  const setRbiForRunner = (playerId: string, value: boolean) => {
    setRbiByPlayerId((prev) => ({ ...prev, [playerId]: value }));
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
    const movements: RunnerMovement[] = runnerStates.map((r) => {
      let isRBI = false;
      if (r.to === "home") {
        if (r.from === "batter" && result === "homerun") {
          isRBI = true;
        } else {
          isRBI = rbiByPlayerId[r.playerId] ?? defaultRbiWhenScoring(result, r.from, r.to);
        }
      }
      return {
        playerId: r.playerId,
        from: r.from,
        to: r.to,
        isRBI,
      };
    });

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
      <SheetContent
        side="bottom"
        className="left-1/2 right-auto max-h-[88dvh] w-[min(100%,42rem)] -translate-x-1/2 gap-0 overflow-y-auto rounded-t-[1.75rem] border-x border-t bg-card pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.18)]"
      >
        <SheetHeader className="sticky top-0 z-10 border-b border-border bg-card px-5 py-4">
          <SheetTitle className="text-lg font-extrabold">
            ランナー進塁確認
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-4 py-5 sm:px-5">
          <div className="space-y-1 rounded-xl bg-secondary/70 px-4 py-3">
            <div>
              <span className="text-sm text-muted-foreground">打席結果: </span>
              <span className="text-sm font-semibold text-foreground">
                {RESULT_LABELS[result]}
              </span>
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">
              ホームインした走者ごとに、打点に含めるかチェックで調整できます。
            </p>
          </div>

          <div className="space-y-4">
            {runnerStates.map((runner) => (
              <div key={runner.playerId} className="space-y-2">
                <Label className="text-sm font-medium">
                  {getFromLabel(runner.from)}: {runner.name}
                </Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="lg"
                  value={runner.to}
                  onValueChange={(value) => {
                    if (value) updateRunnerDestination(runner.playerId, value as Destination);
                  }}
                  className="w-full justify-start"
                >
                  {getDestinationOptions(runner.from).map(({ value, label }) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      className="text-sm font-semibold"
                    >
                      {label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {runner.to === "home" && !(runner.from === "batter" && result === "homerun") && (
                  <div className="flex items-start gap-2 pt-1">
                    <Checkbox
                      id={`rbi-${runner.playerId}`}
                      checked={rbiByPlayerId[runner.playerId] ?? false}
                      onCheckedChange={(v) => setRbiForRunner(runner.playerId, !!v)}
                    />
                    <Label
                      htmlFor={`rbi-${runner.playerId}`}
                      className="cursor-pointer text-xs font-normal leading-snug text-muted-foreground"
                    >
                      この得点を打者の打点に含める
                    </Label>
                  </div>
                )}
              </div>
            ))}
          </div>

          {duplicates.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive font-medium">警告</p>
              {duplicates.map((d, i) => (
                <p key={i} className="text-sm text-destructive">
                  {d}
                </p>
              ))}
            </div>
          )}

          <div className="space-y-1 rounded-xl bg-secondary px-4 py-3">
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
            className="h-12 w-full text-base font-bold"
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
