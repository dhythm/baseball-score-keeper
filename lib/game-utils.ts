import type {
  AtBatResult,
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
import { FIELDING_POSITIONS } from "./types";

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

export function getPlayerStats(
  events: GameEvent[],
  playerId: string
): { atBats: number; hits: number; rbi: number; runs: number } {
  const playerAtBats = events.filter(
    (e) => e.type === "atBat" && e.batterId === playerId
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

  return { atBats, hits, rbi, runs };
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
