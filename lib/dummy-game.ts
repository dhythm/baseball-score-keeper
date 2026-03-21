import type { AtBatResult, Game, GameEvent, Half, Team, TeamSide } from "./types";
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
 * 各イニングの表・裏で「3アウト＝3打席」になるよう結果を固定したシナリオ（計42打席）。
 * 7イニング終了直後（8回表・0アウト・ランナーなし）になることを終了時に検証する。
 */
const HALF_INNING_SCRIPTS: { result: AtBatResult; resultDetail?: string }[][] = [
  [
    { result: "strikeoutSwinging" },
    { result: "strikeoutLooking" },
    { result: "flyOut", resultDetail: "中飛" },
  ],
  [
    { result: "single", resultDetail: "左安" },
    { result: "strikeoutSwinging" },
    { result: "doublePlay", resultDetail: "遊併殺" },
  ],
  [
    { result: "walk" },
    { result: "strikeoutLooking" },
    { result: "doublePlay", resultDetail: "二併殺" },
  ],
  [
    { result: "error", resultDetail: "遊失" },
    { result: "strikeoutSwinging" },
    { result: "doublePlay", resultDetail: "遊併打" },
  ],
  [
    { result: "groundOut", resultDetail: "二ゴロ" },
    { result: "flyOut", resultDetail: "左飛" },
    { result: "strikeoutLooking" },
  ],
  [
    { result: "hitByPitch" },
    { result: "strikeoutLooking" },
    { result: "doublePlay", resultDetail: "一併殺" },
  ],
  [
    { result: "fieldersChoice", resultDetail: "遊野選" },
    { result: "strikeoutSwinging" },
    { result: "doublePlay", resultDetail: "二併殺" },
  ],
  [
    { result: "interference" },
    { result: "strikeoutSwinging" },
    { result: "doublePlay", resultDetail: "遊併" },
  ],
  [
    { result: "strikeout" },
    { result: "strikeoutSwinging" },
    { result: "strikeoutLooking" },
  ],
  [
    { result: "flyOut", resultDetail: "中飛" },
    { result: "flyOut", resultDetail: "投飛" },
    { result: "strikeoutSwinging" },
  ],
  [
    { result: "otherOut", resultDetail: "内野安" },
    { result: "groundOut", resultDetail: "遊ゴロ" },
    { result: "strikeoutLooking" },
  ],
  [
    { result: "single", resultDetail: "中安" },
    { result: "strikeoutSwinging" },
    { result: "doublePlay", resultDetail: "遊併" },
  ],
  [
    { result: "single", resultDetail: "右安·打点1" },
    { result: "strikeoutLooking" },
    { result: "doublePlay", resultDetail: "二併" },
  ],
  [
    { result: "walk", resultDetail: "故意四球" },
    { result: "strikeoutSwinging" },
    { result: "doublePlay", resultDetail: "三併殺" },
  ],
];

/**
 * 7イニング終了直後（8回表・0アウト・ランナーなし）の状態。
 */
export function createDummyGameAfterSevenInnings(): Game {
  const teams = {
    away: makeTeam("イーグルス", "dummy-away", "選手"),
    home: makeTeam("ライオンズ", "dummy-home", "打者"),
  };

  if (HALF_INNING_SCRIPTS.length !== 14) {
    throw new Error("HALF_INNING_SCRIPTS must have 14 half-innings (7回×表裏)");
  }

  const events: GameEvent[] = [];
  const totalHalfInningPlateAppearances = 7 * 2 * 3;

  for (let i = 0; i < totalHalfInningPlateAppearances; i++) {
    const state = recalculateFromEvents(events, teams);
    const teamSide: TeamSide = state.half === "top" ? "away" : "home";
    const roster = teams[teamSide].players;
    const batterIndex = state.currentBatterIndex[teamSide];
    const batterId = roster[batterIndex]!.id;

    const halfIndex = Math.floor(i / 3);
    const play = HALF_INNING_SCRIPTS[halfIndex][i % 3];
    const { result, resultDetail } = play;

    const movements = getDefaultMovements(
      result,
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
      result,
      resultDetail: resultDetail?.trim() || undefined,
      runnerMovements: movements,
      outsInPlay: outsAdded,
      runsScored,
      timestamp: `2025-03-21T12:${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.000Z`,
    });
  }

  const currentState = recalculateFromEvents(events, teams);

  if (
    currentState.inning !== 8 ||
    currentState.half !== "top" ||
    currentState.outs !== 0
  ) {
    throw new Error(
      `Dummy game invariant failed: expected 8回表0アウト, got inning=${currentState.inning} half=${currentState.half} outs=${currentState.outs}`
    );
  }

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
