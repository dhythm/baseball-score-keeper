"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
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
import { ArrowUp, ArrowDown, GripVertical, X, Plus } from "lucide-react";
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
  startingPitcherName: "",
});

/** Standard 9 positions (no DH) for sample rosters. */
const SAMPLE_LINEUP_POSITIONS: FieldingPosition[] = [
  "pitcher",
  "catcher",
  "first",
  "second",
  "third",
  "short",
  "left",
  "center",
  "right",
];

function buildSampleTeam(teamName: string, playerNamePrefix: string): Team {
  const players: Player[] = SAMPLE_LINEUP_POSITIONS.map((position, i) => ({
    id: generateId(),
    name: `${playerNamePrefix}${i + 1}`,
    order: i + 1,
    position,
  }));
  return syncStartingPitcher({
    name: teamName,
    players,
    startingPitcherId: null,
    startingPitcherName: "",
  });
}

const SAMPLE_PRESET = {
  away: () => buildSampleTeam("イーグルス", "選手"),
  home: () => buildSampleTeam("ライオンズ", "打者"),
} as const;

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
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const lineupPitcherCount = team.players.filter(
    (p) => p.position === "pitcher"
  ).length;

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

  const reorderPlayersByDrag = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= team.players.length ||
      toIndex >= team.players.length
    ) {
      return;
    }
    const next = [...team.players];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    const reorderedPlayers = next.map((p, i) => ({ ...p, order: i + 1 }));
    onTeamChange(syncStartingPitcher({ ...team, players: reorderedPlayers }));
  };

  const updatePlayerPosition = (playerId: string, position: FieldingPosition) => {
    const players = team.players.map((p) =>
      p.id === playerId ? { ...p, position } : p
    );
    onTeamChange(syncStartingPitcher({ ...team, players }));
  };

  const updatePlayerName = (playerId: string, name: string) => {
    const players = team.players.map((p) =>
      p.id === playerId ? { ...p, name } : p
    );
    let next: Team = { ...team, players };
    if (team.startingPitcherId === playerId) {
      next = { ...next, startingPitcherName: name };
    }
    onTeamChange(next);
  };

  /** Keeps lineup pitcher row in sync when the linked starting-pitcher name field is edited. */
  const updateStartingPitcherName = (value: string) => {
    if (
      team.startingPitcherId &&
      team.players.some(
        (p) =>
          p.id === team.startingPitcherId && p.position === "pitcher"
      )
    ) {
      onTeamChange({
        ...team,
        startingPitcherName: value,
        players: team.players.map((p) =>
          p.id === team.startingPitcherId ? { ...p, name: value } : p
        ),
      });
      return;
    }
    onTeamChange({ ...team, startingPitcherName: value });
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
          <Input
            placeholder="先発投手の氏名"
            value={team.startingPitcherName ?? ""}
            onChange={(e) => updateStartingPitcherName(e.target.value)}
            className="bg-background"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            {lineupPitcherCount === 1
              ? "打順に投手 (P) がいるため、氏名はその打順と連動します（どちらかを編集すると両方更新されます）。"
              : "打順に投手がいない場合（DH 制で投手が打たないなど）は、ここに先発投手の氏名を入力してください。"}
          </p>
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
              className="bg-background w-full sm:flex-1 sm:min-w-0"
            />
            <div className="flex items-center gap-2 sm:shrink-0">
              <Select
                value={newPlayerPosition ?? undefined}
                onValueChange={(v) =>
                  setNewPlayerPosition(v as FieldingPosition)
                }
              >
                <SelectTrigger className="w-[7.5rem] shrink-0 bg-background text-xs">
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
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            DH 以外の守備位置はチーム内で重複できません。行左の{" "}
            <GripVertical className="inline h-3.5 w-3.5 align-text-bottom text-muted-foreground" />{" "}
            をドラッグして並べ替えられます。
          </p>
        </div>

        {team.players.length > 0 && (
          <ul className="space-y-2 list-none p-0 m-0">
            {team.players.map((player, index) => {
              const rowSelectable = getSelectableFieldingPositions(
                team.players,
                player.id,
                player.position
              );
              return (
                <li
                  key={player.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const raw =
                      e.dataTransfer.getData("application/x-player-index") ||
                      e.dataTransfer.getData("text/plain");
                    const fromIndex = parseInt(raw, 10);
                    if (!Number.isNaN(fromIndex)) {
                      reorderPlayersByDrag(fromIndex, index);
                    }
                  }}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center bg-secondary/50 rounded-lg px-3 py-2 data-[dragging=true]:opacity-60"
                >
                  <div className="flex items-center gap-2 min-w-0 w-full sm:flex-1 sm:min-w-0">
                    <div
                      draggable
                      onDragStart={(e) => {
                        setDraggingIndex(index);
                        e.dataTransfer.effectAllowed = "move";
                        const payload = String(index);
                        e.dataTransfer.setData(
                          "application/x-player-index",
                          payload
                        );
                        e.dataTransfer.setData("text/plain", payload);
                        e.currentTarget
                          .closest("li")
                          ?.setAttribute("data-dragging", "true");
                      }}
                      onDragEnd={(e) => {
                        setDraggingIndex(null);
                        e.currentTarget.closest("li")?.removeAttribute("data-dragging");
                      }}
                      className="touch-none shrink-0 p-1 rounded-md text-muted-foreground hover:bg-background/80 hover:text-foreground cursor-grab active:cursor-grabbing select-none"
                      role="button"
                      tabIndex={0}
                      aria-label={`打順${player.order}をドラッグして移動`}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                          e.preventDefault();
                          movePlayer(index, "up");
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          movePlayer(index, "down");
                        }
                      }}
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-mono text-muted-foreground w-6 shrink-0 text-center">
                      {player.order}.
                    </span>
                    <Input
                      value={player.name}
                      onChange={(e) =>
                        updatePlayerName(player.id, e.target.value)
                      }
                      className="h-8 min-w-0 flex-1 bg-background text-sm"
                      aria-label={`打順${player.order}の選手名`}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    <Select
                      value={player.position ?? undefined}
                      onValueChange={(v) =>
                        updatePlayerPosition(player.id, v as FieldingPosition)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className={cn(
                          "w-[7.5rem] shrink-0 bg-background text-xs px-2",
                          draggingIndex !== null && "pointer-events-none"
                        )}
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
                    <div
                      className={cn(
                        "flex gap-1 shrink-0",
                        draggingIndex !== null && "pointer-events-none"
                      )}
                    >
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
                </li>
              );
            })}
          </ul>
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

  const applySamplePreset = () => {
    setAwayTeam(SAMPLE_PRESET.away());
    setHomeTeam(SAMPLE_PRESET.home());
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span className="text-xl">&#9918;</span>
          スコアブック
        </h1>
      </header>

      <main className="p-4 pb-24 space-y-4 max-w-lg mx-auto lg:max-w-6xl lg:px-6">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={applySamplePreset}
          >
            プリセット（両チーム9人・サンプル名）
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            先攻：イーグルス／選手1〜9、後攻：ライオンズ／打者1〜9（投手〜右翼）
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 lg:items-start">
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
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-lg mx-auto lg:max-w-6xl lg:px-6">
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
