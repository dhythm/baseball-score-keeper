import { describe, expect, it } from "vitest";

import {
  createAtBatEvent,
  createBaseRunningEvent,
  createGameControlEvent,
  createSubstitutionEvent,
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

  it("preserves dedicated UI selections as structured results", () => {
    expect(
      createAtBatEvent({
        id: "double-play",
        batterId: "batter",
        result: "doublePlay",
        detail: "遊併",
        movements: [],
      })
    ).toMatchObject({ result: "doublePlay" });

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

    expect(
      createAtBatEvent({
        id: "strikeout",
        batterId: "batter",
        result: "strikeout",
        movements: [],
      })
    ).toMatchObject({ result: "strikeout" });
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
      { playerId: "r2", from: "second", to: "third", isRBI: false },
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

  it("passes selected batted-ball context to movement defaults", () => {
    expect(
      getDefaultMovementsForSelection(
        "single",
        "左安",
        { first: null, second: "r2", third: null },
        "batter",
        0
      )
    ).toEqual([
      {
        playerId: "r2",
        from: "second",
        to: "home",
        isRBI: true,
      },
      {
        playerId: "batter",
        from: "batter",
        to: "first",
        isRBI: false,
      },
    ]);

    expect(
      getDefaultMovementsForSelection(
        "otherOut",
        "遊安",
        { first: null, second: null, third: "r3" },
        "batter",
        0
      )
    ).toEqual([
      {
        playerId: "batter",
        from: "batter",
        to: "first",
        isRBI: false,
      },
    ]);
  });
});

describe("management event factories", () => {
  it("creates base-running input without derived placement", () => {
    expect(
      createBaseRunningEvent({
        id: "run",
        type: "steal",
        movements: [
          {
            playerId: "runner",
            from: "first",
            to: "second",
            isRBI: false,
          },
        ],
      })
    ).toEqual({
      id: "run",
      kind: "baseRunning",
      type: "steal",
      movements: [
        {
          playerId: "runner",
          from: "first",
          to: "second",
          isRBI: false,
        },
      ],
    });
  });

  it("creates substitution and game-control input events", () => {
    expect(
      createSubstitutionEvent({
        id: "sub",
        team: "home",
        inPlayerId: "reliever",
        outPlayerId: "starter",
        role: "pitcher",
      })
    ).toMatchObject({ id: "sub", kind: "substitution", role: "pitcher" });
    expect(createGameControlEvent({ id: "end", reason: "時間切れ" })).toEqual({
      id: "end",
      kind: "gameControl",
      action: "endGame",
      reason: "時間切れ",
    });
  });
});
