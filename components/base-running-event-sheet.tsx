"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Game, BaseRunningType, Base } from "@/lib/types";
import { getPlayerById } from "@/lib/game-utils";

interface BaseRunningEventSheetProps {
  game: Game;
  onEvent: (
    runnerId: string,
    type: BaseRunningType,
    to: Base | "home" | "out"
  ) => void;
}

const EVENT_TYPES: { type: BaseRunningType; label: string; needsDestination: boolean }[] = [
  { type: "steal", label: "盗塁", needsDestination: true },
  { type: "caughtStealing", label: "盗塁死", needsDestination: false },
  { type: "wildPitch", label: "WP/PB", needsDestination: true },
  { type: "pickOff", label: "牽制死", needsDestination: false },
  { type: "balk", label: "ボーク", needsDestination: true },
];

export function BaseRunningEventSheet({ game, onEvent }: BaseRunningEventSheetProps) {
  const { runners } = game.currentState;
  const [selectedRunner, setSelectedRunner] = useState<string | null>(null);
  const [selectedRunnerBase, setSelectedRunnerBase] = useState<Base | null>(null);
  const [selectedType, setSelectedType] = useState<BaseRunningType | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Base | "home" | "out" | null>(null);

  const runnerOptions: { id: string; name: string; base: Base }[] = [];
  if (runners.first) {
    const player = getPlayerById(game, runners.first);
    if (player) runnerOptions.push({ id: runners.first, name: player.name, base: "first" });
  }
  if (runners.second) {
    const player = getPlayerById(game, runners.second);
    if (player) runnerOptions.push({ id: runners.second, name: player.name, base: "second" });
  }
  if (runners.third) {
    const player = getPlayerById(game, runners.third);
    if (player) runnerOptions.push({ id: runners.third, name: player.name, base: "third" });
  }

  const handleRunnerSelect = (runnerId: string) => {
    setSelectedRunner(runnerId);
    const runner = runnerOptions.find((r) => r.id === runnerId);
    setSelectedRunnerBase(runner?.base ?? null);
    setSelectedDestination(null);
  };

  const getDestinationOptions = (base: Base): { value: Base | "home"; label: string }[] => {
    switch (base) {
      case "first":
        return [
          { value: "second", label: "2塁" },
          { value: "third", label: "3塁" },
          { value: "home", label: "ホーム" },
        ];
      case "second":
        return [
          { value: "third", label: "3塁" },
          { value: "home", label: "ホーム" },
        ];
      case "third":
        return [{ value: "home", label: "ホーム" }];
      default:
        return [];
    }
  };

  const selectedEventType = EVENT_TYPES.find((e) => e.type === selectedType);
  const needsDestination = selectedEventType?.needsDestination ?? false;

  const canSubmit =
    selectedRunner &&
    selectedType &&
    (!needsDestination || selectedDestination);

  const handleSubmit = () => {
    if (!selectedRunner || !selectedType) return;
    
    let destination: Base | "home" | "out";
    if (needsDestination && selectedDestination) {
      destination = selectedDestination;
    } else {
      destination = "out";
    }
    
    onEvent(selectedRunner, selectedType, destination);
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <Label className="text-sm font-medium mb-3 block">対象ランナー</Label>
        <div className="flex flex-wrap gap-2">
          {runnerOptions.map((runner) => (
            <Button
              key={runner.id}
              variant={selectedRunner === runner.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleRunnerSelect(runner.id)}
            >
              {runner.base === "first" && "1塁"}
              {runner.base === "second" && "2塁"}
              {runner.base === "third" && "3塁"}
              : {runner.name}
            </Button>
          ))}
        </div>
      </div>

      {selectedRunner && (
        <div>
          <Label className="text-sm font-medium mb-3 block">イベント</Label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(({ type, label }) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedType(type);
                  setSelectedDestination(null);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedRunner && selectedType && needsDestination && selectedRunnerBase && (
        <div>
          <Label className="text-sm font-medium mb-3 block">進塁先</Label>
          <RadioGroup
            value={selectedDestination ?? ""}
            onValueChange={(value) => setSelectedDestination(value as Base | "home")}
            className="flex gap-3"
          >
            {getDestinationOptions(selectedRunnerBase).map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={value} />
                <Label htmlFor={value} className="cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      <Button
        className="w-full"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        確定
      </Button>
    </div>
  );
}
