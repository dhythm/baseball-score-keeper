import type { FieldingPosition, Player, Team } from "./domain/types";

const STANDARD_LINEUP_POSITIONS: FieldingPosition[] = [
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

function createTeam(name: string, createId: () => string): Team {
  const players: Player[] = STANDARD_LINEUP_POSITIONS.map(
    (position, index) => ({
      id: createId(),
      name: `選手${index + 1}`,
      order: index + 1,
      position,
    })
  );

  return {
    name,
    players,
    benchPlayers: [],
    startingPitcherId: players[0].id,
    startingPitcherName: players[0].name,
  };
}

export function createStandardGamePreset(createId: () => string): {
  away: Team;
  home: Team;
} {
  return {
    away: createTeam("チーム1", createId),
    home: createTeam("チーム2", createId),
  };
}
