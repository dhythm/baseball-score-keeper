import type {
  AtBatResult,
  BaseRunningEvent,
  Half,
  SubstitutionRole,
  TeamSide,
  TimelineEntry,
} from "./types";

export interface InningScores {
  away: (number | null)[];
  home: (number | null)[];
  awayTotal: number;
  homeTotal: number;
}

export interface TeamStats {
  hits: number;
  errors: number;
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
  sacrificeFlies: number;
  plateAppearances: number;
}

export interface PlayerAppearance {
  eventId: string;
  playerId: string;
  replacedPlayerId: string;
  team: TeamSide;
  role: SubstitutionRole;
  inning: number;
  half: Half;
}

const HIT_RESULTS: ReadonlySet<AtBatResult> = new Set([
  "single",
  "double",
  "triple",
  "homerun",
]);

const NON_AT_BAT_RESULTS: ReadonlySet<AtBatResult> = new Set([
  "walk",
  "hitByPitch",
  "sacrifice",
  "sacrificeFly",
  "interference",
]);

function isHit(result: AtBatResult): boolean {
  return HIT_RESULTS.has(result);
}

function isStrikeout(result: AtBatResult): boolean {
  return (
    result === "strikeoutSwinging" ||
    result === "strikeoutLooking" ||
    result === "uncaughtThirdStrike"
  );
}

export function getInningScores(
  timeline: readonly TimelineEntry[],
  regulationInnings: number
): InningScores {
  const applied = timeline.filter(
    (entry) =>
      entry.applied &&
      (entry.event.kind === "atBat" || entry.event.kind === "baseRunning")
  );
  const latestInning = applied.reduce(
    (maximum, entry) => Math.max(maximum, entry.inning),
    0
  );
  const inningCount = Math.max(0, regulationInnings, latestInning);
  const away: (number | null)[] = Array.from(
    { length: inningCount },
    () => null
  );
  const home: (number | null)[] = Array.from(
    { length: inningCount },
    () => null
  );

  for (const entry of applied) {
    if (!Number.isInteger(entry.inning) || entry.inning < 1) continue;
    const scores = entry.team === "away" ? away : home;
    const index = entry.inning - 1;
    scores[index] = (scores[index] ?? 0) + entry.runsScored;
  }

  return {
    away,
    home,
    awayTotal: away.reduce<number>((sum, score) => sum + (score ?? 0), 0),
    homeTotal: home.reduce<number>((sum, score) => sum + (score ?? 0), 0),
  };
}

export function getTeamStats(
  timeline: readonly TimelineEntry[],
  teamSide: TeamSide
): TeamStats {
  let hits = 0;
  let errors = 0;

  for (const entry of timeline) {
    if (!entry.applied || entry.event.kind !== "atBat") continue;
    if (entry.team === teamSide && isHit(entry.event.result)) hits++;
    if (entry.team !== teamSide && entry.event.result === "error") errors++;
  }

  return { hits, errors };
}

export function getPlayerBattingStats(
  timeline: readonly TimelineEntry[],
  playerId: string
): PlayerBattingStats {
  const stats: PlayerBattingStats = {
    atBats: 0,
    hits: 0,
    rbi: 0,
    runs: 0,
    walks: 0,
    hitByPitch: 0,
    strikeouts: 0,
    sacrifice: 0,
    sacrificeFlies: 0,
    plateAppearances: 0,
  };

  for (const entry of timeline) {
    if (!entry.applied) continue;

    for (const movement of entry.scoringMovements) {
      if (movement.playerId === playerId) stats.runs++;
    }

    if (entry.event.kind === "baseRunning") {
      if (rbiCreditBatterId(entry.event) === playerId) {
        stats.rbi += entry.scoringMovements.filter(
          (movement) => movement.isRBI
        ).length;
      }
      continue;
    }
    if (entry.event.kind !== "atBat") continue;

    if (entry.event.batterId !== playerId) continue;

    const { result } = entry.event;
    stats.plateAppearances++;
    if (!NON_AT_BAT_RESULTS.has(result)) stats.atBats++;
    if (isHit(result)) stats.hits++;
    if (result === "walk") stats.walks++;
    if (result === "hitByPitch") stats.hitByPitch++;
    if (isStrikeout(result)) stats.strikeouts++;
    if (result === "sacrifice") stats.sacrifice++;
    if (result === "sacrificeFly") stats.sacrificeFlies++;
    stats.rbi += entry.scoringMovements.filter(
      (movement) => movement.isRBI
    ).length;
  }

  return stats;
}

export function getPlayerAppearances(
  timeline: readonly TimelineEntry[],
  playerId: string
): PlayerAppearance[] {
  return timeline.flatMap((entry) => {
    if (
      !entry.applied ||
      entry.event.kind !== "substitution" ||
      entry.event.inPlayerId !== playerId
    ) {
      return [];
    }

    return [
      {
        eventId: entry.event.id,
        playerId: entry.event.inPlayerId,
        replacedPlayerId: entry.event.outPlayerId,
        team: entry.event.team,
        role: entry.event.role,
        inning: entry.inning,
        half: entry.half,
      },
    ];
  });
}

function rbiCreditBatterId(event: BaseRunningEvent): string | undefined {
  return event.rbiCreditBatterId;
}

export function formatBattingAverage(hits: number, atBats: number): string {
  if (atBats === 0) return "—";
  return (hits / atBats).toFixed(3);
}
