import type {
  AtBatResult,
  Base,
  FieldingPosition,
  Game,
  GameEvent,
  GameState,
  Half,
  Player,
  Runners,
  RunnerMovement,
  Team,
  TeamSide,
} from "./types";
import {
  AT_BAT_SCOREBOOK_SHORT,
  BASE_RUNNING_SCOREBOOK_SHORT,
  FIELDING_POSITIONS,
} from "./types";

export function isStrikeoutResult(r: AtBatResult): boolean {
  return (
    r === "strikeout" || r === "strikeoutSwinging" || r === "strikeoutLooking"
  );
}

/** Results that skip runner-advance sheet (same as live scoring auto path). */
export function isAutoAdvanceAtBatResult(r: AtBatResult): boolean {
  return (
    r === "homerun" ||
    isStrikeoutResult(r) ||
    r === "walk" ||
    r === "hitByPitch"
  );
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function createInitialGameState(): GameState {
  return {
    inning: 1,
    half: "top",
    outs: 0,
    runners: { first: null, second: null, third: null },
    currentBatterIndex: { away: 0, home: 0 },
  };
}

export function createNewGame(awayTeam: Team, homeTeam: Team): Game {
  return {
    id: generateId(),
    date: new Date().toISOString(),
    totalInnings: 9,
    status: "live",
    teams: { away: awayTeam, home: homeTeam },
    events: [],
    currentState: createInitialGameState(),
  };
}

/** Regulation default is 9; extends for extra innings or legacy stored values. */
export function getEffectiveTotalInnings(game: Game): number {
  let maxFromEvents = 0;
  for (const e of game.events) {
    if (e.inning > maxFromEvents) maxFromEvents = e.inning;
  }
  return Math.max(
    9,
    game.totalInnings,
    game.currentState.inning,
    maxFromEvents
  );
}

/** DH may repeat; each other position at most once per team. */
export function getSelectableFieldingPositions(
  players: Player[],
  excludePlayerId: string | null,
  currentPosition: FieldingPosition | null | undefined
): FieldingPosition[] {
  return FIELDING_POSITIONS.filter((pos) => {
    if (currentPosition && pos === currentPosition) return true;
    if (pos === "dh") return true;
    return !players.some(
      (p) => p.id !== excludePlayerId && p.position === pos
    );
  });
}

/** When there is exactly one pitcher in the lineup, link them and mirror their name into `startingPitcherName`. */
export function syncStartingPitcher(team: Team): Team {
  const pitchers = team.players.filter((p) => p.position === "pitcher");
  if (pitchers.length === 0) {
    return { ...team, startingPitcherId: null };
  }
  if (pitchers.length === 1) {
    const p = pitchers[0];
    return {
      ...team,
      startingPitcherId: p.id,
      startingPitcherName: p.name,
    };
  }
  return { ...team, startingPitcherId: null };
}

export function isTeamRosterValid(team: Team): boolean {
  if (team.players.length < 1) return false;
  for (const p of team.players) {
    if (!p.name.trim()) return false;
    if (!p.position) return false;
  }
  const nonDh = team.players.filter((p) => p.position !== "dh");
  const used = new Set<FieldingPosition>();
  for (const p of nonDh) {
    const pos = p.position!;
    if (used.has(pos)) return false;
    used.add(pos);
  }
  const pitcherCount = team.players.filter((p) => p.position === "pitcher").length;
  if (pitcherCount > 1) return false;

  const spName = team.startingPitcherName?.trim() ?? "";
  if (!spName) return false;

  if (pitcherCount === 1) {
    const pitcher = team.players.find((p) => p.position === "pitcher")!;
    if (team.startingPitcherId !== pitcher.id) return false;
    if (spName !== pitcher.name.trim()) return false;
  }
  return true;
}

export function getDefaultOuts(result: AtBatResult): number {
  switch (result) {
    case "groundOut":
    case "flyOut":
    case "strikeout":
    case "strikeoutSwinging":
    case "strikeoutLooking":
    case "otherOut":
    case "sacrifice":
      return 1;
    case "doublePlay":
      return 2;
    case "fieldersChoice":
      return 1;
    default:
      return 0;
  }
}

export function isHit(result: AtBatResult): boolean {
  return ["single", "double", "triple", "homerun"].includes(result);
}

export function getDefaultMovements(
  result: AtBatResult,
  runners: Runners,
  batterId: string,
  currentOuts: number
): RunnerMovement[] {
  const movements: RunnerMovement[] = [];

  switch (result) {
    case "homerun":
      if (runners.third) {
        movements.push({
          playerId: runners.third,
          from: "third",
          to: "home",
          isRBI: true,
        });
      }
      if (runners.second) {
        movements.push({
          playerId: runners.second,
          from: "second",
          to: "home",
          isRBI: true,
        });
      }
      if (runners.first) {
        movements.push({
          playerId: runners.first,
          from: "first",
          to: "home",
          isRBI: true,
        });
      }
      movements.push({
        playerId: batterId,
        from: "batter",
        to: "home",
        isRBI: true,
      });
      break;

    case "triple":
      if (runners.third) {
        movements.push({
          playerId: runners.third,
          from: "third",
          to: "home",
          isRBI: true,
        });
      }
      if (runners.second) {
        movements.push({
          playerId: runners.second,
          from: "second",
          to: "home",
          isRBI: true,
        });
      }
      if (runners.first) {
        movements.push({
          playerId: runners.first,
          from: "first",
          to: "home",
          isRBI: true,
        });
      }
      movements.push({
        playerId: batterId,
        from: "batter",
        to: "third",
        isRBI: false,
      });
      break;

    case "double":
      if (runners.third) {
        movements.push({
          playerId: runners.third,
          from: "third",
          to: "home",
          isRBI: true,
        });
      }
      if (runners.second) {
        movements.push({
          playerId: runners.second,
          from: "second",
          to: "home",
          isRBI: true,
        });
      }
      if (runners.first) {
        movements.push({
          playerId: runners.first,
          from: "first",
          to: "third",
          isRBI: false,
        });
      }
      movements.push({
        playerId: batterId,
        from: "batter",
        to: "second",
        isRBI: false,
      });
      break;

    case "single":
    case "error":
      if (runners.third) {
        movements.push({
          playerId: runners.third,
          from: "third",
          to: "home",
          isRBI: result === "single",
        });
      }
      if (runners.second) {
        movements.push({
          playerId: runners.second,
          from: "second",
          to: "third",
          isRBI: false,
        });
      }
      if (runners.first) {
        movements.push({
          playerId: runners.first,
          from: "first",
          to: "second",
          isRBI: false,
        });
      }
      movements.push({
        playerId: batterId,
        from: "batter",
        to: "first",
        isRBI: false,
      });
      break;

    case "walk":
    case "hitByPitch":
      return processWalkOrHBP(runners, batterId);

    case "sacrifice":
      if (runners.third) {
        movements.push({
          playerId: runners.third,
          from: "third",
          to: "home",
          isRBI: true,
        });
      }
      if (runners.second) {
        movements.push({
          playerId: runners.second,
          from: "second",
          to: "third",
          isRBI: false,
        });
      }
      if (runners.first) {
        movements.push({
          playerId: runners.first,
          from: "first",
          to: "second",
          isRBI: false,
        });
      }
      movements.push({
        playerId: batterId,
        from: "batter",
        to: "out",
        isRBI: false,
      });
      break;

    case "fieldersChoice":
      movements.push({
        playerId: batterId,
        from: "batter",
        to: "first",
        isRBI: false,
      });
      break;

    case "groundOut":
    case "flyOut":
    case "strikeout":
    case "strikeoutSwinging":
    case "strikeoutLooking":
    case "otherOut":
      movements.push({
        playerId: batterId,
        from: "batter",
        to: "out",
        isRBI: false,
      });
      break;

    case "doublePlay":
      const effectiveOuts = currentOuts >= 2 ? 1 : 2;
      movements.push({
        playerId: batterId,
        from: "batter",
        to: "out",
        isRBI: false,
      });
      if (effectiveOuts === 2 && runners.first) {
        movements.push({
          playerId: runners.first,
          from: "first",
          to: "out",
          isRBI: false,
        });
      }
      break;

    case "interference":
      movements.push({
        playerId: batterId,
        from: "batter",
        to: "first",
        isRBI: false,
      });
      break;
  }

  return movements;
}

export function processWalkOrHBP(
  runners: Runners,
  batterId: string
): RunnerMovement[] {
  const movements: RunnerMovement[] = [];

  if (runners.first && runners.second && runners.third) {
    movements.push({
      playerId: runners.third,
      from: "third",
      to: "home",
      isRBI: true,
    });
  }
  if (runners.first && runners.second) {
    movements.push({
      playerId: runners.second,
      from: "second",
      to: "third",
      isRBI: false,
    });
  }
  if (runners.first) {
    movements.push({
      playerId: runners.first,
      from: "first",
      to: "second",
      isRBI: false,
    });
  }
  movements.push({
    playerId: batterId,
    from: "batter",
    to: "first",
    isRBI: false,
  });

  return movements;
}

export function applyRunnerMovements(
  runners: Runners,
  movements: RunnerMovement[],
  maxOuts: number,
  currentOuts: number
): { newRunners: Runners; runsScored: number; outsAdded: number } {
  let newRunners: Runners = { ...runners };
  let runsScored = 0;
  let outsAdded = 0;

  const sortedMovements = [...movements].sort((a, b) => {
    const order = { third: 0, second: 1, first: 2, batter: 3 };
    return order[a.from as keyof typeof order] - order[b.from as keyof typeof order];
  });

  for (const movement of sortedMovements) {
    if (movement.from === "first") newRunners.first = null;
    if (movement.from === "second") newRunners.second = null;
    if (movement.from === "third") newRunners.third = null;
  }

  for (const movement of sortedMovements) {
    if (movement.to === "out") {
      if (currentOuts + outsAdded < maxOuts) {
        outsAdded++;
      }
    } else if (movement.to === "home") {
      if (currentOuts + outsAdded < 3) {
        runsScored++;
      }
    } else if (movement.to === "first") {
      newRunners.first = movement.playerId;
    } else if (movement.to === "second") {
      newRunners.second = movement.playerId;
    } else if (movement.to === "third") {
      newRunners.third = movement.playerId;
    }
  }

  return { newRunners, runsScored, outsAdded };
}

export function recalculateFromEvents(
  events: GameEvent[],
  teams: { away: Team; home: Team }
): GameState {
  let state = createInitialGameState();

  for (const event of events) {
    const { newRunners, outsAdded } = applyRunnerMovements(
      state.runners,
      event.runnerMovements,
      3,
      state.outs
    );

    const newOuts = state.outs + outsAdded;

    if (newOuts >= 3) {
      const newHalf: Half = state.half === "top" ? "bottom" : "top";
      const newInning = state.half === "bottom" ? state.inning + 1 : state.inning;

      state = {
        ...state,
        outs: 0,
        runners: { first: null, second: null, third: null },
        inning: newInning,
        half: newHalf,
      };
    } else {
      state = {
        ...state,
        outs: newOuts,
        runners: newRunners,
      };
    }

    if (event.type === "atBat") {
      const teamSide = event.team;
      const team = teams[teamSide];
      const currentIndex = state.currentBatterIndex[teamSide];
      const nextIndex = (currentIndex + 1) % team.players.length;
      state = {
        ...state,
        currentBatterIndex: {
          ...state.currentBatterIndex,
          [teamSide]: nextIndex,
        },
      };
    }
  }

  return state;
}

export function getInningScores(
  events: GameEvent[],
  totalInnings: number
): { away: (number | null)[]; home: (number | null)[]; awayTotal: number; homeTotal: number } {
  const away: (number | null)[] = Array(totalInnings).fill(null);
  const home: (number | null)[] = Array(totalInnings).fill(null);

  for (const event of events) {
    const inningIndex = event.inning - 1;
    const scores = event.team === "away" ? away : home;
    if (scores[inningIndex] === null) {
      scores[inningIndex] = 0;
    }
    scores[inningIndex]! += event.runsScored;
  }

  const awayTotal = away.reduce<number>((sum, s) => sum + (s ?? 0), 0);
  const homeTotal = home.reduce<number>((sum, s) => sum + (s ?? 0), 0);

  return { away, home, awayTotal, homeTotal };
}

export function getTeamStats(
  events: GameEvent[],
  teamSide: TeamSide
): { hits: number; errors: number } {
  const teamEvents = events.filter((e) => e.team === teamSide);
  const hits = teamEvents.filter((e) => e.result && isHit(e.result)).length;
  const errors = events.filter(
    (e) => e.team !== teamSide && e.result === "error"
  ).length;

  return { hits, errors };
}

export interface PlayerBattingStats {
  atBats: number;
  hits: number;
  rbi: number;
  runs: number;
  walks: number;
  hitByPitch: number;
  strikeouts: number;
  sacrifice: number;
  plateAppearances: number;
}

/** Cumulative batting stats for one player from recorded at-bat events. */
export function getPlayerBattingStats(
  events: GameEvent[],
  playerId: string
): PlayerBattingStats {
  const playerAtBats = events.filter(
    (e) => e.type === "atBat" && e.batterId === playerId && e.result
  );

  const atBats = playerAtBats.filter(
    (e) =>
      e.result &&
      !["walk", "hitByPitch", "sacrifice", "interference"].includes(e.result)
  ).length;

  const hits = playerAtBats.filter(
    (e) => e.result && isHit(e.result)
  ).length;

  const rbi = events.reduce((sum, e) => {
    if (e.batterId !== playerId) return sum;
    return (
      sum +
      e.runnerMovements.filter((m) => m.to === "home" && m.isRBI).length
    );
  }, 0);

  const runs = events.reduce((sum, e) => {
    return (
      sum +
      e.runnerMovements.filter(
        (m) => m.playerId === playerId && m.to === "home"
      ).length
    );
  }, 0);

  return {
    atBats,
    hits,
    rbi,
    runs,
    walks: playerAtBats.filter((e) => e.result === "walk").length,
    hitByPitch: playerAtBats.filter((e) => e.result === "hitByPitch").length,
    strikeouts: playerAtBats.filter(
      (e) => e.result && isStrikeoutResult(e.result)
    ).length,
    sacrifice: playerAtBats.filter((e) => e.result === "sacrifice").length,
    plateAppearances: playerAtBats.length,
  };
}

export function getPlayerStats(
  events: GameEvent[],
  playerId: string
): { atBats: number; hits: number; rbi: number; runs: number } {
  const s = getPlayerBattingStats(events, playerId);
  return {
    atBats: s.atBats,
    hits: s.hits,
    rbi: s.rbi,
    runs: s.runs,
  };
}

export function formatBattingAverage(hits: number, atBats: number): string {
  if (atBats === 0) return "—";
  return (hits / atBats).toFixed(3);
}

/** At-bat event(s) for one player in one inning (先攻=表・後攻=裏). */
export function getAtBatEventsForPlayerInning(
  events: GameEvent[],
  playerId: string,
  teamSide: TeamSide,
  inning: number
): GameEvent[] {
  const half: Half = teamSide === "away" ? "top" : "bottom";
  return events.filter(
    (e) =>
      e.type === "atBat" &&
      e.batterId === playerId &&
      e.team === teamSide &&
      e.inning === inning &&
      e.half === half &&
      e.result
  );
}

/** RBI credited on this plate appearance (runner movements with `isRBI` scoring). */
export function countRbiFromAtBat(event: GameEvent): number {
  if (event.type !== "atBat") return 0;
  return event.runnerMovements.filter((m) => m.to === "home" && m.isRBI).length;
}

function detailAlreadyHasRbiNote(detail: string): boolean {
  return /打点/.test(detail);
}

/**
 * `resultDetail` に「右安・打点1」のように手入力で連結されている場合、
 * プレーと打点を分けて2行表示できるよう分解する（1行に詰めると狭いセルで不自然な改行になる）。
 */
function splitEmbeddedRbiFromDetail(detail: string): {
  playLine: string;
  rbiNum: number;
} | null {
  const m = detail.match(
    /^(.+?)[\u30FB\u00B7\uFF65、,]\s*打点(\d+)$/
  );
  if (!m) return null;
  const playLine = m[1]!.trim();
  const rbiNum = Number.parseInt(m[2]!, 10);
  if (!playLine || !Number.isFinite(rbiNum) || rbiNum < 1) return null;
  return { playLine, rbiNum };
}

/** プレー表記と打点を UI で分けて表示するための構造。 */
export type AtBatCellDisplayParts = {
  /** プレー本体（`resultDetail` または既定の短い表記） */
  playLine: string;
  /** データから付与する打点（例: 打点2）。`resultDetail` に「打点」が含まれる場合は null */
  rbiNote: string | null;
};

export function getAtBatCellDisplayParts(
  event: GameEvent
): AtBatCellDisplayParts | null {
  if (event.type !== "atBat" || !event.result) return null;
  const d = event.resultDetail?.trim() ?? "";
  const embedded = d ? splitEmbeddedRbiFromDetail(d) : null;
  if (embedded) {
    return {
      playLine: embedded.playLine,
      rbiNote: `打点${embedded.rbiNum}`,
    };
  }
  const playLine = d || AT_BAT_SCOREBOOK_SHORT[event.result];
  const rbi = countRbiFromAtBat(event);
  const rbiNote =
    rbi > 0 && !detailAlreadyHasRbiNote(d) ? `打点${rbi}` : null;
  return { playLine, rbiNote };
}

/**
 * At-bat + base-running events for one player in one inning, in game order.
 */
export function getPlayerInningScorebookEvents(
  events: GameEvent[],
  playerId: string,
  teamSide: TeamSide,
  inning: number
): GameEvent[] {
  const half: Half = teamSide === "away" ? "top" : "bottom";
  return events.filter((e) => {
    if (e.inning !== inning || e.half !== half || e.team !== teamSide) {
      return false;
    }
    if (e.type === "atBat" && e.batterId === playerId && e.result) {
      return true;
    }
    if (
      e.type === "baseRunning" &&
      e.baseRunningType &&
      e.runnerMovements.some((m) => m.playerId === playerId)
    ) {
      return true;
    }
    return false;
  });
}

function stealDestinationLabel(to: Base | "home" | "out"): string {
  if (to === "home") return "本";
  if (to === "out") return "";
  const map: Record<Base, string> = {
    first: "1",
    second: "2",
    third: "3",
  };
  return map[to];
}

function formatRunnerAdvance(m: RunnerMovement): string {
  const fromLabel =
    m.from === "batter"
      ? "打"
      : ({ first: "1", second: "2", third: "3" } as const)[m.from];
  if (m.to === "out") return `${fromLabel}→死`;
  if (m.to === "home") return `${fromLabel}→本`;
  const toLabel = ({ first: "1", second: "2", third: "3" } as const)[m.to];
  return `${fromLabel}→${toLabel}`;
}

/**
 * Text for a base-running row in scorebook cells: `resultDetail` if set, else compact notation.
 */
export function getBaseRunningCellDisplayText(event: GameEvent): string {
  if (event.type !== "baseRunning" || !event.baseRunningType) return "";
  const custom = event.resultDetail?.trim();
  if (custom) return custom;
  const m = event.runnerMovements[0];
  if (!m) return BASE_RUNNING_SCOREBOOK_SHORT[event.baseRunningType];
  const t = event.baseRunningType;
  const adv = formatRunnerAdvance(m);

  switch (t) {
    case "steal":
      return `盗${stealDestinationLabel(m.to)}`;
    case "caughtStealing":
      return `盗死·${adv}`;
    case "wildPitch":
      return `WP·${adv}`;
    case "passedBall":
      return `PB·${adv}`;
    case "pickOff":
      return `牽制死·${adv}`;
    case "balk":
      return m.to === "out" ? "ボーク死" : `ボーク·${adv}`;
    default:
      return BASE_RUNNING_SCOREBOOK_SHORT[event.baseRunningType];
  }
}

/**
 * 1行にまとめた表記（集計・aria 用）。打点は `·打点N` で連結。
 */
export function getAtBatCellDisplayText(event: GameEvent): string {
  const p = getAtBatCellDisplayParts(event);
  if (!p) return "";
  return p.rbiNote ? `${p.playLine}·${p.rbiNote}` : p.playLine;
}

/**
 * Combined label for inning column (打席と同一イニング内の走塁を「・」で連結)。
 */
export function getAtBatInningCellLabel(
  events: GameEvent[],
  playerId: string,
  teamSide: TeamSide,
  inning: number
): string {
  const merged = getPlayerInningScorebookEvents(
    events,
    playerId,
    teamSide,
    inning
  );
  if (merged.length === 0) return "";
  return merged
    .map((e) =>
      e.type === "atBat"
        ? getAtBatCellDisplayText(e)
        : getBaseRunningCellDisplayText(e)
    )
    .join("・");
}

/** At-bat events for one player in chronological order (game.events order). */
export function getAtBatEventsForPlayer(
  events: GameEvent[],
  playerId: string,
  teamSide: TeamSide
): GameEvent[] {
  return events.filter(
    (e) =>
      e.type === "atBat" &&
      e.batterId === playerId &&
      e.team === teamSide &&
      e.result
  );
}

/**
 * Rebuilds runner movements / runs / outs for a new result, as if the at-bat
 * happened after replaying all prior events. Use with UPDATE_EVENT.
 */
export function buildAtBatEventUpdateFromResult(
  game: Game,
  eventId: string,
  newResult: AtBatResult,
  resultDetail?: string | null
): Partial<GameEvent> | null {
  const eventIndex = game.events.findIndex((e) => e.id === eventId);
  if (eventIndex === -1) return null;
  const event = game.events[eventIndex];
  if (event.type !== "atBat" || !event.batterId) return null;

  const priorEvents = game.events.slice(0, eventIndex);
  const state = recalculateFromEvents(priorEvents, game.teams);
  const movements = getDefaultMovements(
    newResult,
    state.runners,
    event.batterId,
    state.outs
  );
  const { runsScored, outsAdded } = applyRunnerMovements(
    state.runners,
    movements,
    3,
    state.outs
  );

  const detail =
    resultDetail !== undefined
      ? resultDetail?.trim() || undefined
      : event.resultDetail;

  return {
    result: newResult,
    resultDetail: detail,
    runnerMovements: movements,
    outsInPlay: outsAdded,
    runsScored,
  };
}

/**
 * 指定イベントが適用される直前のアウト数（過去打席の修正 UI で併殺の可否など）。
 */
export function getOutsBeforeEvent(game: Game, eventId: string): number {
  const eventIndex = game.events.findIndex((e) => e.id === eventId);
  if (eventIndex <= 0) return 0;
  const state = recalculateFromEvents(
    game.events.slice(0, eventIndex),
    game.teams
  );
  return state.outs;
}

export function getCurrentBatter(
  game: Game
): Player | null {
  const teamSide = game.currentState.half === "top" ? "away" : "home";
  const team = game.teams[teamSide];
  const batterIndex = game.currentState.currentBatterIndex[teamSide];
  return team.players[batterIndex] ?? null;
}

export function getNextBatter(
  game: Game
): Player | null {
  const teamSide = game.currentState.half === "top" ? "away" : "home";
  const team = game.teams[teamSide];
  const batterIndex = game.currentState.currentBatterIndex[teamSide];
  const nextIndex = (batterIndex + 1) % team.players.length;
  return team.players[nextIndex] ?? null;
}

export function getPlayerById(
  game: Game,
  playerId: string
): Player | null {
  const awayPlayer = game.teams.away.players.find((p) => p.id === playerId);
  if (awayPlayer) return awayPlayer;
  return game.teams.home.players.find((p) => p.id === playerId) ?? null;
}

export function isGameOver(game: Game): boolean {
  const { inning, half, outs } = game.currentState;
  const totalInnings = getEffectiveTotalInnings(game);
  const scores = getInningScores(game.events, totalInnings);

  if (inning > totalInnings) {
    if (scores.awayTotal !== scores.homeTotal) {
      return true;
    }
  }

  if (inning === totalInnings && half === "bottom") {
    if (scores.homeTotal > scores.awayTotal) {
      return true;
    }
    if (outs >= 3 && scores.homeTotal !== scores.awayTotal) {
      return true;
    }
  }

  return false;
}
