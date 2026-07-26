import { describe, expect, it } from "vitest";

import {
  createAtBatEvent,
  getDefaultMovementsForSelection,
} from "./event-factory";

describe("createAtBatEvent", () => {
  it("stores structured input without derived placement or totals", () => {
    const event = createAtBatEvent({
      id: "event",
      batterId: "batter",
      result: "single",
      detail: "遊安",
      movements: [
        {
          playerId: "batter",
          from: "batter",
          to: "first",
          isRBI: false,
        },
      ],
    });

    expect(event).toEqual({
      id: "event",
      kind: "atBat",
      batterId: "batter",
      result: "single",
      note: "遊安",
      battedBall: { position: "short", type: "ground" },
      movements: [
        {
          playerId: "batter",
          from: "batter",
          to: "first",
          isRBI: false,
        },
      ],
    });
    expect(event).not.toHaveProperty("inning");
    expect(event).not.toHaveProperty("runsScored");
  });

  it("maps legacy UI selections to structured v2 results", () => {
    expect(
      createAtBatEvent({
        id: "double-play",
        batterId: "batter",
        result: "doublePlay",
        detail: "遊併",
        movements: [],
      })
    ).toMatchObject({ result: "otherOut" });

    expect(
      createAtBatEvent({
        id: "sacrifice-fly",
        batterId: "batter",
        result: "sacrifice",
        detail: "中犠飛",
        movements: [],
      })
    ).toMatchObject({
      result: "sacrificeFly",
      battedBall: { position: "center", type: "fly" },
    });
  });

  it("uses v2 sacrifice-fly and movement-based double-play defaults", () => {
    expect(
      getDefaultMovementsForSelection(
        "sacrifice",
        "中犠飛",
        { first: "r1", second: "r2", third: "r3" },
        "batter",
        0
      )
    ).toEqual([
      { playerId: "r3", from: "third", to: "home", isRBI: true },
      { playerId: "batter", from: "batter", to: "out", isRBI: false },
    ]);
    expect(
      getDefaultMovementsForSelection(
        "doublePlay",
        "遊併",
        { first: "r1", second: null, third: null },
        "batter",
        0
      )
    ).toHaveLength(2);
  });
});
