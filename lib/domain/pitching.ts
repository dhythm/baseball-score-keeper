import type { TeamSide, TimelineEntry } from "./types";

export interface PitchingStats {
  outs: number;
  inningsPitched: string;
  hitsAllowed: number;
  runsAllowed: number;
  walksAllowed: number;
  strikeouts: number;
}

export interface PitcherStats extends PitchingStats {
  /**
   * `null` when the starter was entered by name only and has no roster id.
   * This keeps a DH/non-batting starter representable in the statistics API.
   */
  pitcherId: string | null;
  role: "starter" | "reliever";
}

const hitResults = new Set(["single", "double", "triple", "homerun"]);
const strikeoutResults = new Set([
  "strikeoutSwinging",
  "strikeoutLooking",
  "uncaughtThirdStrike",
]);

function formatInningsPitched(outs: number): string {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

export function getStartingPitcherStats(
  timeline: readonly TimelineEntry[],
  fieldingTeam: TeamSide
): PitchingStats {
  const starter = getPitcherStats(timeline, fieldingTeam, null)[0];
  return {
    outs: starter.outs,
    inningsPitched: starter.inningsPitched,
    hitsAllowed: starter.hitsAllowed,
    runsAllowed: starter.runsAllowed,
    walksAllowed: starter.walksAllowed,
    strikeouts: starter.strikeouts,
  };
}

function emptyPitcherStats(
  pitcherId: string | null,
  role: PitcherStats["role"]
): PitcherStats {
  return {
    pitcherId,
    role,
    outs: 0,
    inningsPitched: "0.0",
    hitsAllowed: 0,
    runsAllowed: 0,
    walksAllowed: 0,
    strikeouts: 0,
  };
}

/**
 * Derives one line per pitcher from applied timeline entries.
 *
 * A starter id is optional because the setup model also permits a pitcher
 * entered by name only (for example, a DH lineup). Relief pitcher ids come
 * from structured pitching-substitution events. The replay/UI currently
 * requires substitutions to replace an active lineup slot, but this pure
 * derivation remains valid once a DH-specific defensive substitution model is
 * introduced.
 */
export function getPitcherStats(
  timeline: readonly TimelineEntry[],
  fieldingTeam: TeamSide,
  startingPitcherId: string | null
): PitcherStats[] {
  const battingTeam: TeamSide = fieldingTeam === "away" ? "home" : "away";
  const lines = new Map<string | null, PitcherStats>();
  lines.set(startingPitcherId, emptyPitcherStats(startingPitcherId, "starter"));
  let currentPitcherId = startingPitcherId;

  for (const entry of timeline) {
    if (!entry.applied) continue;
    if (
      entry.event.kind === "substitution" &&
      entry.event.team === fieldingTeam &&
      entry.event.role === "pitcher"
    ) {
      currentPitcherId = entry.event.inPlayerId;
      if (!lines.has(currentPitcherId)) {
        lines.set(
          currentPitcherId,
          emptyPitcherStats(currentPitcherId, "reliever")
        );
      }
      continue;
    }
    if (entry.team !== battingTeam) continue;
    const stats = lines.get(currentPitcherId);
    if (!stats) continue;
    stats.outs += entry.outsRecorded;
    stats.inningsPitched = formatInningsPitched(stats.outs);
    stats.runsAllowed += entry.runsScored;
    if (entry.event.kind !== "atBat") continue;
    if (hitResults.has(entry.event.result)) stats.hitsAllowed++;
    if (entry.event.result === "walk") stats.walksAllowed++;
    if (strikeoutResults.has(entry.event.result)) stats.strikeouts++;
  }

  return [...lines.values()];
}
