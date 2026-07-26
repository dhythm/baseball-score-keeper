import { describe, expect, it, vi } from "vitest";

import { initializeRbiByPlayerId } from "./runner-advance";

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
