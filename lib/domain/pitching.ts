import type { TeamSide, TimelineEntry } from "./types";

export interface PitchingStats {
  outs: number;
  inningsPitched: string;
  hitsAllowed: number;
  runsAllowed: number;
  walksAllowed: number;
  strikeouts: number;
}

const hitResults = new Set(["single", "double", "triple", "homerun"]);
const strikeoutResults = new Set([
  "strikeoutSwinging",
  "strikeoutLooking",
  "uncaughtThirdStrike",
]);

export function formatInningsPitched(outs: number): string {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

export function getStartingPitcherStats(
  timeline: readonly TimelineEntry[],
  fieldingTeam: TeamSide
): PitchingStats {
  const battingTeam: TeamSide = fieldingTeam === "away" ? "home" : "away";
  let outs = 0;
  let hitsAllowed = 0;
  let runsAllowed = 0;
  let walksAllowed = 0;
  let strikeouts = 0;
  let starterActive = true;

  for (const entry of timeline) {
    if (!entry.applied) continue;
    if (
      entry.event.kind === "substitution" &&
      entry.event.team === fieldingTeam &&
      entry.event.role === "pitcher"
    ) {
      starterActive = false;
      continue;
    }
    if (!starterActive || entry.team !== battingTeam) continue;
    outs += entry.outsRecorded;
    runsAllowed += entry.runsScored;
    if (entry.event.kind !== "atBat") continue;
    if (hitResults.has(entry.event.result)) hitsAllowed++;
    if (entry.event.result === "walk") walksAllowed++;
    if (strikeoutResults.has(entry.event.result)) strikeouts++;
  }

  return {
    outs,
    inningsPitched: formatInningsPitched(outs),
    hitsAllowed,
    runsAllowed,
    walksAllowed,
    strikeouts,
  };
}
