import { describe, expect, it } from "vitest";

import {
  isAutoAdvanceAtBatResult,
  syncNonLineupStartingPitcher,
} from "./game-utils";

describe("isAutoAdvanceAtBatResult", () => {
  it("sends an uncaught third strike to runner-advance confirmation", () => {
    expect(isAutoAdvanceAtBatResult("uncaughtThirdStrike")).toBe(false);
  });

  it("keeps ordinary strikeouts on the automatic path", () => {
    expect(isAutoAdvanceAtBatResult("strikeoutSwinging")).toBe(true);
    expect(isAutoAdvanceAtBatResult("strikeoutLooking")).toBe(true);
  });
});

describe("syncNonLineupStartingPitcher", () => {
  it("keeps a DH starter in the roster with a stable player id", () => {
    const team = {
      name: "Home",
      players: [
        { id: "dh", name: "DH", order: 1, position: "dh" as const },
      ],
      benchPlayers: [],
      startingPitcherId: null,
      startingPitcherName: "",
    };

    const created = syncNonLineupStartingPitcher(
      team,
      "Starter",
      "starter-id"
    );
    const renamed = syncNonLineupStartingPitcher(
      created,
      "Renamed starter",
      "unused-id"
    );

    expect(renamed.startingPitcherId).toBe("starter-id");
    expect(renamed.benchPlayers).toContainEqual({
      id: "starter-id",
      name: "Renamed starter",
      order: 2,
      position: "pitcher",
    });
  });

  it("removes the linked non-lineup starter when its name is cleared", () => {
    const team = {
      name: "Home",
      players: [
        { id: "dh", name: "DH", order: 1, position: "dh" as const },
      ],
      benchPlayers: [
        {
          id: "starter-id",
          name: "Starter",
          order: 2,
          position: "pitcher" as const,
        },
      ],
      startingPitcherId: "starter-id",
      startingPitcherName: "Starter",
    };

    expect(
      syncNonLineupStartingPitcher(team, "", "unused-id")
    ).toMatchObject({
      startingPitcherId: null,
      startingPitcherName: "",
      benchPlayers: [],
    });
  });
});
