import { describe, expect, it, vi } from "vitest";

import {
  evaluateMovementOutcome,
  initializeRbiByPlayerId,
} from "./runner-advance";

const runnerState = {
  playerId: "runner",
  from: "third",
  to: "home",
} as const;

describe("initializeRbiByPlayerId", () => {
  it("preserves a manually cleared RBI when an at-bat is reopened", () => {
    const getDefault = vi.fn(() => true);

    expect(
      initializeRbiByPlayerId(
        "single",
        [runnerState],
        [
          {
            playerId: "runner",
            from: "third",
            to: "home",
            isRBI: false,
          },
        ],
        getDefault
      )
    ).toEqual({ runner: false });
    expect(getDefault).not.toHaveBeenCalled();
  });

  it("preserves a manually credited RBI when an at-bat is reopened", () => {
    const getDefault = vi.fn(() => false);

    expect(
      initializeRbiByPlayerId(
        "error",
        [runnerState],
        [
          {
            playerId: "runner",
            from: "third",
            to: "home",
            isRBI: true,
          },
        ],
        getDefault
      )
    ).toEqual({ runner: true });
    expect(getDefault).not.toHaveBeenCalled();
  });
});

describe("evaluateMovementOutcome", () => {
  it("counts a run only when it occurs before a tag third out", () => {
    const scoring = {
      playerId: "runner-third",
      from: "third" as const,
      to: "home" as const,
      isRBI: true,
    };
    const tagOut = {
      playerId: "runner-first",
      from: "first" as const,
      to: "out" as const,
      isRBI: false,
      outType: "tag" as const,
    };

    expect(
      evaluateMovementOutcome({
        currentOuts: 2,
        movements: [scoring, tagOut],
      }).scoringMovements
    ).toEqual([scoring]);
    expect(
      evaluateMovementOutcome({
        currentOuts: 2,
        movements: [tagOut, scoring],
      }).scoringMovements
    ).toEqual([]);
  });

  it("cancels every run when the batter or a force play makes the third out", () => {
    const scoring = {
      playerId: "runner-third",
      from: "third" as const,
      to: "home" as const,
      isRBI: true,
    };

    expect(
      evaluateMovementOutcome({
        currentOuts: 2,
        batterId: "batter",
        movements: [
          scoring,
          {
            playerId: "batter",
            from: "batter",
            to: "out",
            isRBI: false,
          },
        ],
      }).scoringMovements
    ).toEqual([]);
    expect(
      evaluateMovementOutcome({
        currentOuts: 2,
        movements: [
          scoring,
          {
            playerId: "runner-first",
            from: "first",
            to: "out",
            isRBI: false,
            outType: "force",
          },
        ],
      }).scoringMovements
    ).toEqual([]);
  });
});
