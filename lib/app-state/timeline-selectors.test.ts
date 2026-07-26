import { describe, expect, it } from "vitest";

import type { Snapshot, TimelineEntry } from "../domain/types";
import { getPlayerInningEntries } from "./timeline-selectors";

const snapshot: Snapshot = {
  inning: 1,
  half: "top",
  outs: 0,
  runners: { first: null, second: null, third: null },
  activeLineup: { away: ["player"], home: ["opponent"] },
  activePitcherId: { away: null, home: null },
  currentBatterIndex: { away: 0, home: 0 },
  score: { away: 0, home: 0 },
  gameStatus: "live",
};

function entry(
  id: string,
  event: TimelineEntry["event"],
  overrides: Partial<TimelineEntry> = {}
): TimelineEntry {
  return {
    event,
    index: 0,
    inning: 1,
    half: "top",
    team: "away",
    outsBefore: 0,
    outsAfter: 0,
    outsRecorded: 0,
    runsScored: 0,
    scoringMovements: [],
    applied: true,
    before: snapshot,
    after: snapshot,
    ...overrides,
  };
}

describe("getPlayerInningEntries", () => {
  it("collects plate appearances, running, and substitution entries", () => {
    const timeline = [
      entry("at-bat", {
        id: "at-bat",
        kind: "atBat",
        batterId: "player",
        result: "single",
        movements: [],
      }),
      entry("running", {
        id: "running",
        kind: "baseRunning",
        type: "steal",
        movements: [
          {
            playerId: "player",
            from: "first",
            to: "second",
            isRBI: false,
          },
        ],
      }),
      entry("substitution", {
        id: "substitution",
        kind: "substitution",
        team: "away",
        inPlayerId: "bench",
        outPlayerId: "player",
        role: "pinchHitter",
      }),
      entry(
        "other-inning",
        {
          id: "other-inning",
          kind: "atBat",
          batterId: "player",
          result: "walk",
          movements: [],
        },
        { inning: 2 }
      ),
    ];

    expect(
      getPlayerInningEntries(timeline, "player", "away", 1).map(
        ({ event }) => event.id
      )
    ).toEqual(["at-bat", "running", "substitution"]);
  });
});
