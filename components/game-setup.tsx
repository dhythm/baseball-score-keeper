"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import { useGame } from "@/lib/game-context";
import type { FieldingPosition, Player, Team } from "@/lib/types";
import { FIELDING_POSITION_LABELS } from "@/lib/types";
import {
  generateId,
  getSelectableFieldingPositions,
  isTeamRosterValid,
  syncStartingPitcher,
} from "@/lib/game-utils";

const emptyTeam = (): Team => ({
  name: "",
  players: [],
  startingPitcherId: null,
});

function TeamSetupForm({
  label,
  team,
  onTeamChange,
}: {
  label: string;
  team: Team;
  onTeamChange: (team: Team) => void;
}) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPosition, setNewPlayerPosition] =
    useState<FieldingPosition | null>(null);

  const pitcherCandidates = team.players.filter(
    (p) => p.position === "pitcher"
  );

  const addPlayer = () => {
    if (!newPlayerName.trim() || !newPlayerPosition) return;
    const newPlayer: Player = {
      id: generateId(),
      name: newPlayerName.trim(),
      order: team.players.length + 1,
      position: newPlayerPosition,
    };
    const next: Team = {
      ...team,
      players: [...team.players, newPlayer],
    };
    onTeamChange(syncStartingPitcher(next));
    setNewPlayerName("");
    setNewPlayerPosition(null);
  };

  const removePlayer = (id: string) => {
    const newPlayers = team.players
      .filter((p) => p.id !== id)
      .map((p, index) => ({ ...p, order: index + 1 }));
    onTeamChange(syncStartingPitcher({ ...team, players: newPlayers }));
  };

  const movePlayer = (index: number, direction: "up" | "down") => {
    const newPlayers = [...team.players];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPlayers.length) return;

    [newPlayers[index], newPlayers[targetIndex]] = [
      newPlayers[targetIndex],
      newPlayers[index],
    ];

    const reorderedPlayers = newPlayers.map((p, i) => ({ ...p, order: i + 1 }));
    onTeamChange(syncStartingPitcher({ ...team, players: reorderedPlayers }));
  };

  const updatePlayerPosition = (playerId: string, position: FieldingPosition) => {
    const players = team.players.map((p) =>
      p.id === playerId ? { ...p, position } : p
    );
    onTeamChange(syncStartingPitcher({ ...team, players }));
  };

  const updateStartingPitcher = (playerId: string) => {
    onTeamChange({ ...team, startingPitcherId: playerId });
  };

  const newRowSelectable = getSelectableFieldingPositions(
    team.players,
    null,
    newPlayerPosition
  );

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            チーム名
          </label>
          <Input
            placeholder="チーム名を入力"
            value={team.name}
            onChange={(e) => onTeamChange({ ...team, name: e.target.value })}
            className="bg-background"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            先発投手
          </label>
          {pitcherCandidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              打順に投手 (P) がいる場合のみ、ここで先発投手を選べます。
            </p>
          ) : (
            <Select
              value={team.startingPitcherId ?? undefined}
              onValueChange={updateStartingPitcher}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="先発投手を選択" />
              </SelectTrigger>
              <SelectContent>
                {pitcherCandidates.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.order}. {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            打順
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="選手名を入力"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPlayer();
                }
              }}
              className="bg-background sm:flex-1"
            />
            <Select
              value={newPlayerPosition ?? undefined}
              onValueChange={(v) =>
                setNewPlayerPosition(v as FieldingPosition)
              }
            >
              <SelectTrigger className="w-full bg-background sm:w-[200px]">
                <SelectValue placeholder="守備位置" />
              </SelectTrigger>
              <SelectContent>
                {newRowSelectable.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {FIELDING_POSITION_LABELS[pos]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="shrink-0"
              onClick={addPlayer}
              disabled={!newPlayerName.trim() || !newPlayerPosition}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            DH 以外の守備位置はチーム内で重複できません。
          </p>
        </div>

        {team.players.length > 0 && (
          <div className="space-y-2">
            {team.players.map((player, index) => {
              const rowSelectable = getSelectableFieldingPositions(
                team.players,
                player.id,
                player.position
              );
              return (
                <div
                  key={player.id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center bg-secondary/50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-mono text-muted-foreground w-6 shrink-0">
                      {player.order}.
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={player.position ?? undefined}
                      onValueChange={(v) =>
                        updatePlayerPosition(player.id, v as FieldingPosition)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-full sm:w-[200px] bg-background"
                      >
                        <SelectValue placeholder="守備位置" />
                      </SelectTrigger>
                      <SelectContent>
                        {rowSelectable.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {FIELDING_POSITION_LABELS[pos]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => movePlayer(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => movePlayer(index, "down")}
                        disabled={index === team.players.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removePlayer(player.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function GameSetup() {
  const { dispatch } = useGame();
  const [awayTeam, setAwayTeam] = useState<Team>(emptyTeam);
  const [homeTeam, setHomeTeam] = useState<Team>(emptyTeam);

  const canStartGame =
    awayTeam.name.trim() !== "" &&
    homeTeam.name.trim() !== "" &&
    isTeamRosterValid(awayTeam) &&
    isTeamRosterValid(homeTeam);

  const startGame = () => {
    dispatch({
      type: "START_GAME",
      awayTeam,
      homeTeam,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span className="text-xl">&#9918;</span>
          スコアブック
        </h1>
      </header>

      <main className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
        <TeamSetupForm
          label="先攻チーム"
          team={awayTeam}
          onTeamChange={setAwayTeam}
        />

        <TeamSetupForm
          label="後攻チーム"
          team={homeTeam}
          onTeamChange={setHomeTeam}
        />
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full h-12 text-base font-semibold"
            disabled={!canStartGame}
            onClick={startGame}
          >
            試合開始
          </Button>
        </div>
      </div>
    </div>
  );
}
