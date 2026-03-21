"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Game, BaseRunningType, Base, TeamSide } from "@/lib/types";
import { getPlayerById } from "@/lib/game-utils";

export interface BaseRunningEventResult {
  runnerId: string;
  type: BaseRunningType;
  to: Base | "home" | "out";
  /** ホームインかつ打点として記録する場合の打者 id */
  rbiCreditBatterId?: string;
}

interface BaseRunningEventSheetProps {
  game: Game;
  onEvent: (payload: BaseRunningEventResult) => void;
}

const EVENT_TYPES: {
  type: BaseRunningType;
  label: string;
  needsDestination: boolean;
}[] = [
  { type: "steal", label: "盗塁", needsDestination: true },
  { type: "caughtStealing", label: "盗塁死", needsDestination: false },
  { type: "wildPitch", label: "ワイルドピッチ", needsDestination: true },
  { type: "passedBall", label: "パスボール", needsDestination: true },
  { type: "pickOff", label: "牽制死", needsDestination: false },
  { type: "balk", label: "ボーク", needsDestination: true },
];

export function BaseRunningEventSheet({ game, onEvent }: BaseRunningEventSheetProps) {
  const { runners } = game.currentState;
  const teamSide: TeamSide = game.currentState.half === "top" ? "away" : "home";
  const battingTeam = game.teams[teamSide];

  const [selectedRunner, setSelectedRunner] = useState<string | null>(null);
  const [selectedRunnerBase, setSelectedRunnerBase] = useState<Base | null>(null);
  const [selectedType, setSelectedType] = useState<BaseRunningType | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Base | "home" | null>(null);
  const [creditRbi, setCreditRbi] = useState(false);
  const [rbiBatterId, setRbiBatterId] = useState<string>("");

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
    setCreditRbi(false);
    setRbiBatterId("");
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

  const toHome =
    needsDestination && selectedDestination === "home";
  const canSubmit =
    selectedRunner &&
    selectedType &&
    (!needsDestination || selectedDestination) &&
    (!toHome || !creditRbi || !!rbiBatterId);

  const handleSubmit = () => {
    if (!selectedRunner || !selectedType) return;

    let destination: Base | "home" | "out";
    if (needsDestination && selectedDestination) {
      destination = selectedDestination;
    } else {
      destination = "out";
    }

    const isRbiHome = destination === "home" && creditRbi && !!rbiBatterId;

    onEvent({
      runnerId: selectedRunner,
      type: selectedType,
      to: destination,
      rbiCreditBatterId: isRbiHome ? rbiBatterId : undefined,
    });
  };

  return (
    <div className="space-y-6 py-4">
      <p className="text-xs leading-snug text-muted-foreground">
        盗塁・暴投・パスボールなど、打席外の走塁を記録します。ホームイン時は必要に応じて打点（どの打者に記録するか）を選べます。
      </p>

      <div>
        <Label className="mb-3 block text-sm font-medium">対象ランナー</Label>
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
          <Label className="mb-3 block text-sm font-medium">イベント</Label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(({ type, label }) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedType(type);
                  setSelectedDestination(null);
                  setCreditRbi(false);
                  setRbiBatterId("");
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
          <Label className="mb-3 block text-sm font-medium">進塁先</Label>
          <RadioGroup
            value={selectedDestination ?? ""}
            onValueChange={(value) => {
              setSelectedDestination(value as Base | "home");
              if (value !== "home") {
                setCreditRbi(false);
                setRbiBatterId("");
              }
            }}
            className="flex flex-wrap gap-3"
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

      {toHome && (
        <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-start gap-2">
            <Checkbox
              id="credit-rbi"
              checked={creditRbi}
              onCheckedChange={(v) => {
                setCreditRbi(!!v);
                if (!v) setRbiBatterId("");
              }}
            />
            <Label htmlFor="credit-rbi" className="cursor-pointer text-sm leading-snug">
              打点として記録する
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                盗塁・暴投などで通常は打点になりません。記録規則上打点とする場合のみチェックしてください。
              </span>
            </Label>
          </div>
          {creditRbi && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">打点を付ける打者</Label>
              <Select value={rbiBatterId} onValueChange={setRbiBatterId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選手を選択" />
                </SelectTrigger>
                <SelectContent>
                  {battingTeam.players.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      #{p.order} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      <Button className="w-full touch-manipulation" disabled={!canSubmit} onClick={handleSubmit}>
        確定
      </Button>
    </div>
  );
}
