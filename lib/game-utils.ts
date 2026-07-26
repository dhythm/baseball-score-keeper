import type { AtBatResult, FieldingPosition, Player, Team } from "./types";
import { FIELDING_POSITIONS } from "./types";

/** Results whose default movement is complete without runner confirmation. */
export function isAutoAdvanceAtBatResult(result: AtBatResult): boolean {
  return (
    result === "homerun" ||
    result === "strikeout" ||
    result === "strikeoutSwinging" ||
    result === "strikeoutLooking" ||
    result === "walk" ||
    result === "hitByPitch"
  );
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/** DH may repeat; each other position can be assigned only once. */
export function getSelectableFieldingPositions(
  players: Player[],
  excludePlayerId: string | null,
  currentPosition: FieldingPosition | null | undefined
): FieldingPosition[] {
  return FIELDING_POSITIONS.filter((position) => {
    if (currentPosition === position || position === "dh") return true;
    return !players.some(
      (player) => player.id !== excludePlayerId && player.position === position
    );
  });
}

/** Link the single pitcher in the batting order as the starting pitcher. */
export function syncStartingPitcher(team: Team): Team {
  const pitchers = team.players.filter(
    (player) => player.position === "pitcher"
  );
  if (pitchers.length === 0) {
    return { ...team, startingPitcherId: null };
  }
  if (pitchers.length === 1) {
    const pitcher = pitchers[0];
    return {
      ...team,
      startingPitcherId: pitcher.id,
      startingPitcherName: pitcher.name,
    };
  }
  return { ...team, startingPitcherId: null };
}

/**
 * Keep a pitcher who does not bat (for example with a DH) in the roster so
 * substitutions can reference a stable player id.
 */
export function syncNonLineupStartingPitcher(
  team: Team,
  name: string,
  newPlayerId: string
): Team {
  const benchPlayers = team.benchPlayers ?? [];
  const linkedPlayer = benchPlayers.find(
    (player) => player.id === team.startingPitcherId
  );

  if (name.trim() === "") {
    return {
      ...team,
      benchPlayers: linkedPlayer
        ? benchPlayers.filter((player) => player.id !== linkedPlayer.id)
        : benchPlayers,
      startingPitcherId: null,
      startingPitcherName: name,
    };
  }

  if (linkedPlayer) {
    return {
      ...team,
      benchPlayers: benchPlayers.map((player) =>
        player.id === linkedPlayer.id
          ? { ...player, name, position: "pitcher" }
          : player
      ),
      startingPitcherName: name,
    };
  }

  return {
    ...team,
    benchPlayers: [
      ...benchPlayers,
      {
        id: newPlayerId,
        name,
        order: team.players.length + benchPlayers.length + 1,
        position: "pitcher",
      },
    ],
    startingPitcherId: newPlayerId,
    startingPitcherName: name,
  };
}

export function isTeamRosterValid(team: Team): boolean {
  if (
    team.players.length === 0 ||
    team.players.some((player) => !player.name.trim() || !player.position)
  ) {
    return false;
  }

  const usedPositions = new Set<FieldingPosition>();
  for (const player of team.players) {
    if (player.position === "dh") continue;
    if (usedPositions.has(player.position!)) return false;
    usedPositions.add(player.position!);
  }

  const pitchers = team.players.filter(
    (player) => player.position === "pitcher"
  );
  if (pitchers.length > 1) return false;

  const startingPitcherName = team.startingPitcherName?.trim() ?? "";
  if (!startingPitcherName) return false;

  if (pitchers.length === 1) {
    const pitcher = pitchers[0];
    return (
      team.startingPitcherId === pitcher.id &&
      startingPitcherName === pitcher.name.trim()
    );
  }

  return Boolean(
    team.startingPitcherId &&
    (team.benchPlayers ?? []).some(
      (player) =>
        player.id === team.startingPitcherId &&
        player.position === "pitcher" &&
        player.name.trim() === startingPitcherName
    )
  );
}
