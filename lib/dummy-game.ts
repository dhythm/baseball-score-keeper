import type { Game, GameEvent, Half, Team, TeamSide } from "./types";
import {
  applyRunnerMovements,
  getDefaultMovements,
  recalculateFromEvents,
  syncStartingPitcher,
} from "./game-utils";
import type { FieldingPosition } from "./types";

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

function makeTeam(
  name: string,
  idPrefix: string,
  namePrefix: string
): Team {
  const players = SAMPLE_LINEUP_POSITIONS.map((position, i) => ({
    id: `${idPrefix}-p${i + 1}`,
    name: `${namePrefix}${i + 1}`,
    order: i + 1,
    position,
  }));
  return syncStartingPitcher({
    name,
    players,
    startingPitcherId: null,
    startingPitcherName: "",
  });
}

/**
 * 7イニング終了直後（8回表・0アウト・ランナーなし）の状態。
 * 各回の表・裏は三振のみで3アウト（計42打席）。
 */
export function createDummyGameAfterSevenInnings(): Game {
  const teams = {
    away: makeTeam("イーグルス", "dummy-away", "選手"),
    home: makeTeam("ライオンズ", "dummy-home", "打者"),
  };

  const events: GameEvent[] = [];
  const totalHalfInningPlateAppearances = 7 * 2 * 3;

  for (let i = 0; i < totalHalfInningPlateAppearances; i++) {
    const state = recalculateFromEvents(events, teams);
    const teamSide: TeamSide = state.half === "top" ? "away" : "home";
    const roster = teams[teamSide].players;
    const batterIndex = state.currentBatterIndex[teamSide];
    const batterId = roster[batterIndex]!.id;

    const movements = getDefaultMovements(
      "strikeoutSwinging",
      state.runners,
      batterId,
      state.outs
    );
    const { runsScored, outsAdded } = applyRunnerMovements(
      state.runners,
      movements,
      3,
      state.outs
    );

    const inning = state.inning;
    const half: Half = state.half;

    events.push({
      id: `dummy-ab-${i + 1}`,
      type: "atBat",
      inning,
      half,
      team: teamSide,
      batterId,
      result: "strikeoutSwinging",
      runnerMovements: movements,
      outsInPlay: outsAdded,
      runsScored,
      timestamp: `2025-03-21T12:${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.000Z`,
    });
  }

  const currentState = recalculateFromEvents(events, teams);

  const game: Game = {
    id: "dummy-game-7inn",
    date: new Date("2025-03-21T12:00:00.000Z").toISOString(),
    totalInnings: 9,
    status: "live",
    teams,
    events,
    currentState,
  };

  return game;
}
