"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import { useGame } from "@/lib/game-context";
import type { Player, Team } from "@/lib/types";
import { generateId } from "@/lib/game-utils";

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

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer: Player = {
      id: generateId(),
      name: newPlayerName.trim(),
      order: team.players.length + 1,
    };
    onTeamChange({
      ...team,
      players: [...team.players, newPlayer],
    });
    setNewPlayerName("");
  };

  const removePlayer = (id: string) => {
    const newPlayers = team.players
      .filter((p) => p.id !== id)
      .map((p, index) => ({ ...p, order: index + 1 }));
    onTeamChange({ ...team, players: newPlayers });
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
    onTeamChange({ ...team, players: reorderedPlayers });
  };

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
            打順
          </label>
          <div className="flex gap-2">
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
              className="bg-background"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={addPlayer}
              disabled={!newPlayerName.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {team.players.length > 0 && (
          <div className="space-y-2">
            {team.players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2"
              >
                <span className="text-sm font-mono text-muted-foreground w-6">
                  {player.order}.
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {player.name}
                </span>
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function GameSetup() {
  const { dispatch } = useGame();
  const [totalInnings, setTotalInnings] = useState<number>(7);
  const [customInnings, setCustomInnings] = useState("");
  const [awayTeam, setAwayTeam] = useState<Team>({ name: "", players: [] });
  const [homeTeam, setHomeTeam] = useState<Team>({ name: "", players: [] });

  const handleInningsChange = (value: string) => {
    if (value === "custom") return;
    setTotalInnings(parseInt(value, 10));
    setCustomInnings("");
  };

  const handleCustomInningsChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0 && num <= 15) {
      setTotalInnings(num);
      setCustomInnings(value);
    } else if (value === "") {
      setCustomInnings("");
    }
  };

  const canStartGame =
    awayTeam.players.length >= 1 &&
    homeTeam.players.length >= 1 &&
    awayTeam.name.trim() !== "" &&
    homeTeam.name.trim() !== "";

  const startGame = () => {
    dispatch({
      type: "START_GAME",
      totalInnings,
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
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              イニング数
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleGroup
              type="single"
              value={customInnings ? "custom" : totalInnings.toString()}
              onValueChange={handleInningsChange}
              className="justify-start flex-wrap"
            >
              <ToggleGroupItem value="5" className="flex-1">
                5
              </ToggleGroupItem>
              <ToggleGroupItem value="7" className="flex-1">
                7
              </ToggleGroupItem>
              <ToggleGroupItem value="9" className="flex-1">
                9
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">カスタム:</span>
              <Input
                type="number"
                min={1}
                max={15}
                value={customInnings}
                onChange={(e) => handleCustomInningsChange(e.target.value)}
                placeholder="1-15"
                className="w-20 bg-background"
              />
            </div>
          </CardContent>
        </Card>

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
