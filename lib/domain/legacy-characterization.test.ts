import { describe, expect, it } from "vitest";

import { createDummyGameAfterSevenInnings } from "../dummy-game";
import { getInningScores, getTeamStats } from "../game-utils";

describe("legacy dummy game characterization", () => {
  it("records 42 plate appearances across seven complete innings", () => {
    const game = createDummyGameAfterSevenInnings();

    expect(game.events).toHaveLength(42);
    expect(game.events.every((event) => event.type === "atBat")).toBe(true);
    expect(game.currentState).toEqual({
      inning: 8,
      half: "top",
      outs: 0,
      runners: { first: null, second: null, third: null },
      currentBatterIndex: { away: 3, home: 3 },
    });
  });

  it("preserves the dummy game's score and hit/error totals", () => {
    const game = createDummyGameAfterSevenInnings();

    expect(getInningScores(game.events, 7)).toEqual({
      away: [0, 0, 0, 0, 0, 0, 0],
      home: [0, 0, 0, 0, 0, 0, 0],
      awayTotal: 0,
      homeTotal: 0,
    });
    expect(getTeamStats(game.events, "away")).toEqual({ hits: 1, errors: 1 });
    expect(getTeamStats(game.events, "home")).toEqual({ hits: 2, errors: 0 });
  });
});
