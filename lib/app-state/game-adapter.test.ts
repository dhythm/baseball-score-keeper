import { describe, expect, it } from "vitest";

import type { Game, GameEvent, Team } from "../types";
import { rebuildGameFromEvents, replayGame } from "./game-adapter";

const team = (side: string): Team => ({
  name: side,
  players: [
    { id: `${side}-1`, name: `${side} 1`, order: 1 },
    { id: `${side}-2`, name: `${side} 2`, order: 2 },
  ],
});

const out = (id: string, batterId: string): GameEvent => ({
  id,
  type: "atBat",
  inning: 99,
  half: "bottom",
  team: "home",
  batterId,
  result: "groundOut",
  runnerMovements: [
    { playerId: batterId, from: "batter", to: "out", isRBI: false },
  ],
  outsInPlay: 99,
  runsScored: 99,
  timestamp: "2026-01-01T00:00:00.000Z",
});

const game = (events: GameEvent[]): Game => ({
  id: "game",
  date: "2026-01-01T00:00:00.000Z",
  totalInnings: 7,
  status: "live",
  teams: { away: team("away"), home: team("home") },
  events,
  currentState: {
    inning: 99,
    half: "bottom",
    outs: 2,
    runners: { first: "stale", second: null, third: null },
    currentBatterIndex: { away: 0, home: 0 },
  },
});

describe("legacy UI adapter", () => {
  it("ignores every frozen derived field when replaying", () => {
    const result = replayGame(game([out("one", "away-1")]));

    expect(result.timeline[0]).toMatchObject({
      inning: 1,
      half: "top",
      team: "away",
      outsRecorded: 1,
      runsScored: 0,
    });
    expect(result.snapshot).toMatchObject({
      inning: 1,
      half: "top",
      outs: 1,
      runners: { first: null, second: null, third: null },
    });
  });

  it("rehydrates UI-only placement fields from the replay timeline", () => {
    const rebuilt = rebuildGameFromEvents(
      game([
        out("top-1", "away-1"),
        out("top-2", "away-2"),
        out("top-3", "away-1"),
        out("bottom-1", "home-1"),
      ])
    );

    expect(
      rebuilt.events.map(({ inning, half, team, outsInPlay, runsScored }) => ({
        inning,
        half,
        team,
        outsInPlay,
        runsScored,
      }))
    ).toEqual([
      { inning: 1, half: "top", team: "away", outsInPlay: 1, runsScored: 0 },
      { inning: 1, half: "top", team: "away", outsInPlay: 1, runsScored: 0 },
      { inning: 1, half: "top", team: "away", outsInPlay: 1, runsScored: 0 },
      {
        inning: 1,
        half: "bottom",
        team: "home",
        outsInPlay: 1,
        runsScored: 0,
      },
    ]);
    expect(rebuilt.currentState).toMatchObject({
      inning: 1,
      half: "bottom",
      outs: 1,
    });
  });
});
