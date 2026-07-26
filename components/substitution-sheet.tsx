"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppGame } from "@/lib/app-state/types";
import type {
  SubstitutionEvent,
  SubstitutionRole,
  TeamSide,
} from "@/lib/domain/types";
import { generateId } from "@/lib/game-utils";

const ROLE_OPTIONS: { value: SubstitutionRole; label: string }[] = [
  { value: "pinchHitter", label: "代打" },
  { value: "pinchRunner", label: "代走" },
  { value: "fielder", label: "守備交代" },
  { value: "pitcher", label: "投手交代" },
];

export function SubstitutionSheet({
  game,
  onSubmit,
}: {
  game: AppGame;
  onSubmit: (event: SubstitutionEvent) => void;
}) {
  const offense: TeamSide =
    game.currentState.half === "top" ? "away" : "home";
  const [team, setTeam] = useState<TeamSide>(offense);
  const [role, setRole] = useState<SubstitutionRole>("pinchHitter");
  const [outPlayerId, setOutPlayerId] = useState("");
  const [inPlayerId, setInPlayerId] = useState("");

  useEffect(() => {
    if (role === "pinchHitter" || role === "pinchRunner") {
      setTeam(offense);
    }
    setOutPlayerId("");
    setInPlayerId("");
  }, [offense, role]);

  const roster = useMemo(
    () => [
      ...game.config.teams[team].players,
      ...(game.config.teams[team].benchPlayers ?? []),
    ],
    [game.config.teams, team]
  );
  const activeIds = game.currentState.activeLineup[team];
  const runnerIds = Object.values(game.currentState.runners).filter(
    (playerId): playerId is string => playerId !== null
  );
  const outCandidates = roster.filter((player) => {
    if (role === "pinchRunner") return runnerIds.includes(player.id);
    return activeIds.includes(player.id);
  });
  const inCandidates = roster.filter(
    (player) => !activeIds.includes(player.id)
  );

  const handleSubmit = () => {
    if (!outPlayerId || !inPlayerId) return;
    onSubmit({
      id: generateId(),
      kind: "substitution",
      team,
      role,
      outPlayerId,
      inPlayerId,
    });
  };

  return (
    <div className="space-y-5 px-4 py-5 sm:px-5">
      <div className="space-y-2">
        <Label>交代種別</Label>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={role === option.value ? "default" : "outline"}
              className="h-11 touch-manipulation"
              onClick={() => setRole(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>チーム</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["away", "home"] as const).map((side) => (
            <Button
              key={side}
              type="button"
              variant={team === side ? "secondary" : "outline"}
              className="h-11"
              disabled={
                (role === "pinchHitter" || role === "pinchRunner") &&
                side !== offense
              }
              onClick={() => {
                setTeam(side);
                setOutPlayerId("");
                setInPlayerId("");
              }}
            >
              {side === "away" ? "先攻" : "後攻"}・
              {game.config.teams[side].name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="out-player">退く選手</Label>
        <Select value={outPlayerId} onValueChange={setOutPlayerId}>
          <SelectTrigger id="out-player" className="h-12 w-full text-base">
            <SelectValue placeholder="選手を選択" />
          </SelectTrigger>
          <SelectContent>
            {outCandidates.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="in-player">入る選手</Label>
        <Select value={inPlayerId} onValueChange={setInPlayerId}>
          <SelectTrigger id="in-player" className="h-12 w-full text-base">
            <SelectValue
              placeholder={
                inCandidates.length === 0
                  ? "控え選手が登録されていません"
                  : "選手を選択"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {inCandidates.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        className="h-12 w-full text-base font-semibold"
        disabled={!outPlayerId || !inPlayerId}
        onClick={handleSubmit}
      >
        交代を記録
      </Button>
    </div>
  );
}
