"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppGame } from "@/lib/app-state/types";
import { getPlayerById } from "@/lib/app-state/selectors";
import type {
  Base,
  BaseRunningEvent,
  BaseRunningType,
  RunnerDestination,
  RunnerMovement,
  Snapshot,
  TeamSide,
} from "@/lib/domain/types";

export interface BaseRunningEventResult {
  type: BaseRunningType;
  movements: RunnerMovement[];
  rbiCreditBatterId?: string;
}

interface BaseRunningEventSheetProps {
  game: AppGame;
  onEvent: (payload: BaseRunningEventResult) => void;
  initialEvent?: BaseRunningEvent;
  snapshot?: Snapshot;
  submitLabel?: string;
}

const EVENT_TYPES: { type: BaseRunningType; label: string; isOut: boolean }[] =
  [
    { type: "steal", label: "盗塁", isOut: false },
    { type: "caughtStealing", label: "盗塁死", isOut: true },
    { type: "wildPitch", label: "暴投", isOut: false },
    { type: "passedBall", label: "捕逸", isOut: false },
    { type: "pickOff", label: "牽制死", isOut: true },
    { type: "balk", label: "ボーク", isOut: false },
  ];

function destinationOptions(base: Base) {
  if (base === "first") {
    return [
      { value: "second", label: "2塁" },
      { value: "third", label: "3塁" },
      { value: "home", label: "ホーム" },
    ] as const;
  }
  if (base === "second") {
    return [
      { value: "third", label: "3塁" },
      { value: "home", label: "ホーム" },
    ] as const;
  }
  return [{ value: "home", label: "ホーム" }] as const;
}

export function BaseRunningEventSheet({
  game,
  onEvent,
  initialEvent,
  snapshot,
  submitLabel = "走塁を記録",
}: BaseRunningEventSheetProps) {
  const effectiveSnapshot = snapshot ?? game.currentState;
  const runners = effectiveSnapshot.runners;
  const teamSide: TeamSide = effectiveSnapshot.half === "top" ? "away" : "home";
  const battingTeam = game.config.teams[teamSide];
  const [selectedType, setSelectedType] = useState<BaseRunningType>(
    initialEvent?.type ?? "steal"
  );
  const [selectedRunnerIds, setSelectedRunnerIds] = useState<string[]>(
    initialEvent?.movements.map((movement) => movement.playerId) ?? []
  );
  const [destinationByRunnerId, setDestinationByRunnerId] = useState<
    Record<string, RunnerDestination>
  >(
    Object.fromEntries(
      initialEvent?.movements.map((movement) => [
        movement.playerId,
        movement.to,
      ]) ?? []
    )
  );
  const [creditRbi, setCreditRbi] = useState(
    initialEvent?.movements.some((movement) => movement.isRBI) ?? false
  );
  const [rbiBatterId, setRbiBatterId] = useState(
    initialEvent?.rbiCreditBatterId ?? ""
  );

  useEffect(() => {
    if (!initialEvent) return;
    setSelectedType(initialEvent.type);
    setSelectedRunnerIds(
      initialEvent.movements.map((movement) => movement.playerId)
    );
    setDestinationByRunnerId(
      Object.fromEntries(
        initialEvent.movements.map((movement) => [
          movement.playerId,
          movement.to,
        ])
      )
    );
    setCreditRbi(initialEvent.movements.some((movement) => movement.isRBI));
    setRbiBatterId(initialEvent.rbiCreditBatterId ?? "");
  }, [initialEvent]);

  const runnerOptions = useMemo(() => {
    const options: { id: string; name: string; base: Base }[] = [];
    (["first", "second", "third"] as const).forEach((base) => {
      const playerId = runners[base];
      if (!playerId) return;
      const player = getPlayerById(game, playerId);
      if (player) options.push({ id: playerId, name: player.name, base });
    });
    return options;
  }, [game, runners]);

  const eventType = EVENT_TYPES.find((option) => option.type === selectedType)!;
  const hasHomeDestination = selectedRunnerIds.some(
    (playerId) => destinationByRunnerId[playerId] === "home"
  );
  const allDestinationsSelected = selectedRunnerIds.every(
    (playerId) => eventType.isOut || Boolean(destinationByRunnerId[playerId])
  );
  const canSubmit =
    selectedRunnerIds.length > 0 &&
    allDestinationsSelected &&
    (!creditRbi || (hasHomeDestination && Boolean(rbiBatterId)));

  const toggleRunner = (playerId: string, checked: boolean) => {
    setSelectedRunnerIds((current) =>
      checked ? [...current, playerId] : current.filter((id) => id !== playerId)
    );
    if (!checked) {
      setDestinationByRunnerId((current) => {
        const next = { ...current };
        delete next[playerId];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const movements = selectedRunnerIds.flatMap((playerId) => {
      const runner = runnerOptions.find((option) => option.id === playerId);
      if (!runner) return [];
      const to = eventType.isOut ? "out" : destinationByRunnerId[playerId];
      if (!to) return [];
      return [
        {
          playerId,
          from: runner.base,
          to,
          isRBI: to === "home" && creditRbi,
        },
      ];
    });
    onEvent({
      type: selectedType,
      movements,
      ...(creditRbi && rbiBatterId ? { rbiCreditBatterId: rbiBatterId } : {}),
    });
  };

  if (runnerOptions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        塁上に走者がいません。
      </p>
    );
  }

  return (
    <div className="space-y-5 px-4 py-5 sm:px-5">
      <div className="space-y-2">
        <Label>イベント</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EVENT_TYPES.map((option) => (
            <Button
              key={option.type}
              type="button"
              variant={selectedType === option.type ? "default" : "outline"}
              className="h-11 touch-manipulation"
              onClick={() => {
                setSelectedType(option.type);
                setDestinationByRunnerId({});
                setCreditRbi(false);
                setRbiBatterId("");
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>対象走者（複数選択可）</Label>
        {runnerOptions.map((runner) => {
          const selected = selectedRunnerIds.includes(runner.id);
          return (
            <div
              key={runner.id}
              className="space-y-3 rounded-xl border border-border p-3"
            >
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) =>
                    toggleRunner(runner.id, checked === true)
                  }
                />
                <span className="font-medium">
                  {runner.base === "first"
                    ? "1塁"
                    : runner.base === "second"
                      ? "2塁"
                      : "3塁"}
                  ・{runner.name}
                </span>
              </label>
              {selected && !eventType.isOut && (
                <Select
                  value={destinationByRunnerId[runner.id] ?? ""}
                  onValueChange={(value) =>
                    setDestinationByRunnerId((current) => ({
                      ...current,
                      [runner.id]: value as RunnerDestination,
                    }))
                  }
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="進塁先を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationOptions(runner.base).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}
      </div>

      {hasHomeDestination && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <Checkbox
              checked={creditRbi}
              onCheckedChange={(checked) => {
                setCreditRbi(checked === true);
                if (checked !== true) setRbiBatterId("");
              }}
            />
            <span className="text-sm font-medium">打点として記録する</span>
          </label>
          {creditRbi && (
            <Select value={rbiBatterId} onValueChange={setRbiBatterId}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="打点を付ける打者" />
              </SelectTrigger>
              <SelectContent>
                {battingTeam.players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    #{player.order} {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <Button
        type="button"
        className="h-12 w-full text-base font-semibold"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
