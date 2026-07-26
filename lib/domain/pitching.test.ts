import { describe, expect, it } from "vitest";

import type {
  AtBatEvent,
  Snapshot,
  SubstitutionEvent,
  TimelineEntry,
} from "./types";
import { getStartingPitcherStats } from "./pitching";

const snapshot: Snapshot = {
  inning: 1,
  half: "top",
  outs: 0,
  runners: { first: null, second: null, third: null },
  activeLineup: { away: ["away-batter"], home: ["home-batter"] },
  currentBatterIndex: { away: 0, home: 0 },
  score: { away: 0, home: 0 },
  gameStatus: "live",
};

function entry(
  id: string,
  team: "away" | "home",
  result: AtBatEvent["result"],
  outsRecorded = 0,
  runsScored = 0
): TimelineEntry {
  const event: AtBatEvent = {
    id,
    kind: "atBat",
    batterId: `${team}-batter`,
    result,
    movements: [],
  };
  return {
    event,
    index: 0,
    inning: 1,
    half: team === "away" ? "top" : "bottom",
    team,
    outsBefore: 0,
    outsAfter: outsRecorded,
    outsRecorded,
    runsScored,
    scoringMovements: [],
    applied: true,
    before: snapshot,
    after: snapshot,
  };
}

describe("getStartingPitcherStats", () => {
  it("derives the defensive starter line from opponent plate appearances", () => {
    const timeline = [
      entry("single", "away", "single"),
      entry("walk", "away", "walk"),
      entry("strikeout", "away", "strikeoutSwinging", 1),
      entry("groundout", "away", "groundOut", 1, 1),
      entry("home-offense", "home", "homerun", 0, 2),
    ];

    expect(getStartingPitcherStats(timeline, "home")).toEqual({
      outs: 2,
      inningsPitched: "0.2",
      hitsAllowed: 1,
      runsAllowed: 1,
      walksAllowed: 1,
      strikeouts: 1,
    });
  });

  it("stops charging the starter after a pitching substitution", () => {
    const pitchingChange: SubstitutionEvent = {
      id: "pitching-change",
      kind: "substitution",
      team: "home",
      inPlayerId: "home-reliever",
      outPlayerId: "home-batter",
      role: "pitcher",
    };
    const substitutionEntry: TimelineEntry = {
      ...entry("placeholder", "away", "otherOut"),
      event: pitchingChange,
      outsRecorded: 0,
    };

    expect(
      getStartingPitcherStats(
        [
          entry("single", "away", "single"),
          substitutionEntry,
          entry("reliever-walk", "away", "walk"),
        ],
        "home"
      )
    ).toMatchObject({
      hitsAllowed: 1,
      walksAllowed: 0,
    });
  });
});
