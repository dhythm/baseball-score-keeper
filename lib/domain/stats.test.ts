import { describe, expect, it } from "vitest";

import type {
  AtBatEvent,
  RunnerMovement,
  Snapshot,
  TeamSide,
  TimelineEntry,
} from "./types";
import {
  getInningScores,
  getPlayerBattingStats,
  getTeamStats,
} from "./stats";

const emptySnapshot: Snapshot = {
  inning: 1,
  half: "top",
  outs: 0,
  runners: { first: null, second: null, third: null },
  currentBatterIndex: { away: 0, home: 0 },
  score: { away: 0, home: 0 },
  gameStatus: "live",
};

function timelineEntry({
  id,
  inning = 1,
  team = "away",
  batterId = "batter",
  result = "single",
  movements = [],
  scoringMovements = movements.filter((movement) => movement.to === "home"),
  runsScored = scoringMovements.length,
  applied = true,
}: {
  id: string;
  inning?: number;
  team?: TeamSide;
  batterId?: string;
  result?: AtBatEvent["result"];
  movements?: RunnerMovement[];
  scoringMovements?: RunnerMovement[];
  runsScored?: number;
  applied?: boolean;
}): TimelineEntry {
  const event: AtBatEvent = {
    id,
    kind: "atBat",
    batterId,
    result,
    movements,
  };

  return {
    event,
    index: 0,
    inning,
    half: team === "away" ? "top" : "bottom",
    team,
    outsBefore: 0,
    outsAfter: 0,
    outsRecorded: 0,
    runsScored,
    scoringMovements,
    applied,
    before: emptySnapshot,
    after: emptySnapshot,
  };
}

describe("getInningScores", () => {
  it("keeps unplayed regulation innings null and totals replayed runs", () => {
    const timeline = [
      timelineEntry({ id: "away-1", runsScored: 0 }),
      timelineEntry({ id: "home-1", team: "home", runsScored: 2 }),
      timelineEntry({ id: "away-2", inning: 2, runsScored: 1 }),
    ];

    expect(getInningScores(timeline, 3)).toEqual({
      away: [0, 1, null],
      home: [2, null, null],
      awayTotal: 1,
      homeTotal: 2,
    });
  });

  it("safely extends the scoreboard for extra innings", () => {
    const timeline = [
      timelineEntry({ id: "extra", inning: 10, runsScored: 1 }),
    ];

    const scores = getInningScores(timeline, 9);

    expect(scores.away).toHaveLength(10);
    expect(scores.away[9]).toBe(1);
    expect(scores.awayTotal).toBe(1);
    expect(Number.isNaN(scores.awayTotal)).toBe(false);
  });

  it("does not count rejected timeline entries", () => {
    const timeline = [
      timelineEntry({
        id: "rejected",
        inning: 10,
        runsScored: 4,
        applied: false,
      }),
    ];

    expect(getInningScores(timeline, 9).away).toEqual(
      Array.from({ length: 9 }, () => null)
    );
  });
});

describe("timeline-derived statistics", () => {
  it("uses only scoringMovements for both individual runs and RBI", () => {
    const invalidRun: RunnerMovement = {
      playerId: "runner",
      from: "second",
      to: "home",
      isRBI: true,
    };
    const timeline = [
      timelineEntry({
        id: "third-out-play",
        batterId: "batter",
        movements: [
          {
            playerId: "other-runner",
            from: "third",
            to: "out",
            isRBI: false,
          },
          invalidRun,
        ],
        scoringMovements: [],
        runsScored: 0,
      }),
    ];

    expect(getPlayerBattingStats(timeline, "runner").runs).toBe(0);
    expect(getPlayerBattingStats(timeline, "batter").rbi).toBe(0);
    expect(getInningScores(timeline, 9).awayTotal).toBe(0);
  });

  it("credits valid runs and RBI from the same replay decision", () => {
    const run: RunnerMovement = {
      playerId: "runner",
      from: "third",
      to: "home",
      isRBI: true,
    };
    const timeline = [
      timelineEntry({
        id: "valid-run",
        batterId: "batter",
        movements: [run],
        scoringMovements: [run],
        runsScored: 1,
      }),
    ];

    expect(getPlayerBattingStats(timeline, "runner").runs).toBe(1);
    expect(getPlayerBattingStats(timeline, "batter").rbi).toBe(1);
  });

  it("derives batting and team totals from applied timeline entries", () => {
    const timeline = [
      timelineEntry({ id: "hit", batterId: "p1", result: "single" }),
      timelineEntry({ id: "walk", batterId: "p1", result: "walk" }),
      timelineEntry({
        id: "strikeout",
        batterId: "p1",
        result: "strikeoutLooking",
      }),
      timelineEntry({
        id: "error",
        team: "home",
        batterId: "home-p1",
        result: "error",
      }),
      timelineEntry({
        id: "ignored-hit",
        batterId: "p1",
        result: "homerun",
        applied: false,
      }),
    ];

    expect(getPlayerBattingStats(timeline, "p1")).toMatchObject({
      plateAppearances: 3,
      atBats: 2,
      hits: 1,
      walks: 1,
      strikeouts: 1,
    });
    expect(getTeamStats(timeline, "away")).toEqual({ hits: 1, errors: 1 });
    expect(getTeamStats(timeline, "home")).toEqual({ hits: 0, errors: 0 });
  });
});
