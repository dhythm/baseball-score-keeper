import { describe, expect, it } from "vitest";
import type { RunnerMovement } from "./types";
import { getDefaultMovements, validateMovementShape } from "./rules";

function movement(
  playerId: string,
  from: RunnerMovement["from"],
  to: RunnerMovement["to"],
  isRBI = false
): RunnerMovement {
  return { playerId, from, to, isRBI };
}

describe("getDefaultMovements", () => {
  it("proposes one-base advancement for a single", () => {
    expect(
      getDefaultMovements(
        "single",
        { first: "r1", second: "r2", third: "r3" },
        "batter",
        0
      )
    ).toEqual([
      movement("r3", "third", "home", true),
      movement("r2", "second", "third"),
      movement("r1", "first", "second"),
      movement("batter", "batter", "first"),
    ]);
  });

  it("sends a runner from second home on an outfield single", () => {
    expect(
      getDefaultMovements(
        "single",
        { first: null, second: "r2", third: null },
        "batter",
        0,
        { battedBall: { position: "left", type: "liner" } }
      )
    ).toEqual([
      movement("r2", "second", "home", true),
      movement("batter", "batter", "first"),
    ]);
  });

  it("keeps a runner at third on an infield hit", () => {
    expect(
      getDefaultMovements(
        "single",
        { first: null, second: null, third: "r3" },
        "batter",
        0,
        { battedBall: { position: "short", type: "ground" } }
      )
    ).toEqual([movement("batter", "batter", "first")]);
  });

  it("sends a runner from first home on an outfield double", () => {
    expect(
      getDefaultMovements(
        "double",
        { first: "r1", second: null, third: null },
        "batter",
        0,
        { battedBall: { position: "center", type: "liner" } }
      )
    ).toEqual([
      movement("r1", "first", "home", true),
      movement("batter", "batter", "second"),
    ]);
  });

  it("proposes forced and productive advances on a ground out", () => {
    expect(
      getDefaultMovements(
        "groundOut",
        { first: "r1", second: "r2", third: "r3" },
        "batter",
        0,
        { battedBall: { position: "short", type: "ground" } }
      )
    ).toEqual([
      movement("r3", "third", "home", true),
      movement("r2", "second", "third"),
      { ...movement("r1", "first", "out"), outType: "force" },
      movement("batter", "batter", "first"),
    ]);

    expect(
      getDefaultMovements(
        "groundOut",
        { first: null, second: "r2", third: null },
        "batter",
        0,
        { battedBall: { position: "second", type: "ground" } }
      )
    ).toEqual([
      movement("r2", "second", "third"),
      movement("batter", "batter", "out"),
    ]);
  });

  it("proposes touch-ups only for an outfield fly", () => {
    expect(
      getDefaultMovements(
        "flyOut",
        { first: "r1", second: "r2", third: "r3" },
        "batter",
        0,
        { battedBall: { position: "right", type: "fly" } }
      )
    ).toEqual([
      movement("r3", "third", "home", true),
      movement("r2", "second", "third"),
      movement("batter", "batter", "out"),
    ]);

    expect(
      getDefaultMovements(
        "flyOut",
        { first: null, second: "r2", third: "r3" },
        "batter",
        0,
        { battedBall: { position: "short", type: "fly" } }
      )
    ).toEqual([movement("batter", "batter", "out")]);
  });

  it("advances only forced runners on an infield error", () => {
    expect(
      getDefaultMovements(
        "error",
        { first: null, second: null, third: "r3" },
        "batter",
        0,
        { battedBall: { position: "third", type: "ground" } }
      )
    ).toEqual([movement("batter", "batter", "first")]);

    expect(
      getDefaultMovements(
        "error",
        { first: "r1", second: "r2", third: "r3" },
        "batter",
        0,
        { battedBall: { position: "short", type: "ground" } }
      )
    ).toEqual([
      movement("r3", "third", "home"),
      movement("r2", "second", "third"),
      movement("r1", "first", "second"),
      movement("batter", "batter", "first"),
    ]);
  });

  it("advances only forced runners on a walk", () => {
    expect(
      getDefaultMovements(
        "walk",
        { first: null, second: "r2", third: "r3" },
        "batter",
        0
      )
    ).toEqual([movement("batter", "batter", "first")]);

    expect(
      getDefaultMovements(
        "hitByPitch",
        { first: "r1", second: "r2", third: "r3" },
        "batter",
        0
      )
    ).toEqual([
      movement("r3", "third", "home", true),
      movement("r2", "second", "third"),
      movement("r1", "first", "second"),
      movement("batter", "batter", "first"),
    ]);
  });

  it("proposes a sacrifice bunt with every runner advancing one base", () => {
    expect(
      getDefaultMovements(
        "sacrifice",
        { first: "r1", second: "r2", third: "r3" },
        "batter",
        0
      )
    ).toEqual([
      movement("r3", "third", "home", true),
      movement("r2", "second", "third"),
      movement("r1", "first", "second"),
      movement("batter", "batter", "out"),
    ]);
  });

  it("scores the third-base runner and advances the second-base runner on a sacrifice fly", () => {
    expect(
      getDefaultMovements(
        "sacrificeFly",
        { first: "r1", second: "r2", third: "r3" },
        "batter",
        0
      )
    ).toEqual([
      movement("r3", "third", "home", true),
      movement("r2", "second", "third"),
      movement("batter", "batter", "out"),
    ]);
  });

  it("removes the forced runner instead of silently overwriting them on a fielder's choice", () => {
    expect(
      getDefaultMovements(
        "fieldersChoice",
        { first: "r1", second: null, third: null },
        "batter",
        0
      )
    ).toEqual([
      { ...movement("r1", "first", "out"), outType: "force" },
      movement("batter", "batter", "first"),
    ]);
  });

  it("uses forced advancement for interference", () => {
    expect(
      getDefaultMovements(
        "interference",
        { first: "r1", second: "r2", third: null },
        "batter",
        0
      )
    ).toEqual([
      movement("r2", "second", "third"),
      movement("r1", "first", "second"),
      movement("batter", "batter", "first"),
    ]);

    expect(
      getDefaultMovements(
        "interference",
        { first: "r1", second: "r2", third: "r3" },
        "batter",
        0
      )[0]
    ).toEqual(movement("r3", "third", "home", true));
  });

  it("uses forced advancement for an uncaught third strike", () => {
    expect(
      getDefaultMovements(
        "uncaughtThirdStrike",
        { first: "r1", second: "r2", third: "r3" },
        "batter",
        2
      )
    ).toEqual([
      movement("r3", "third", "home"),
      movement("r2", "second", "third"),
      movement("r1", "first", "second"),
      movement("batter", "batter", "first"),
    ]);
  });

  it("allows an uncaught-third-strike advance only with first base open or two outs", () => {
    expect(
      getDefaultMovements(
        "uncaughtThirdStrike",
        { first: null, second: "r2", third: null },
        "batter",
        0
      )
    ).toEqual([movement("batter", "batter", "first")]);

    expect(
      getDefaultMovements(
        "uncaughtThirdStrike",
        { first: "r1", second: null, third: null },
        "batter",
        1
      )
    ).toEqual([movement("batter", "batter", "out")]);
  });

  it("leaves existing runners unchanged on a strikeout", () => {
    expect(
      getDefaultMovements(
        "strikeoutLooking",
        { first: "r1", second: "r2", third: "r3" },
        "batter",
        1
      )
    ).toEqual([movement("batter", "batter", "out")]);
  });
});

describe("validateMovementShape", () => {
  it("accepts a valid forced advance", () => {
    const movements = [
      movement("r2", "second", "third"),
      movement("r1", "first", "second"),
      movement("batter", "batter", "first"),
    ];

    expect(
      validateMovementShape(
        { first: "r1", second: "r2", third: null },
        "batter",
        movements
      )
    ).toEqual([]);
  });

  it("reports a source whose player is not on that base", () => {
    const violations = validateMovementShape(
      { first: "r1", second: null, third: null },
      "batter",
      [movement("someone-else", "first", "second")]
    );

    expect(violations.map((violation) => violation.code)).toContain(
      "SOURCE_RUNNER_MISMATCH"
    );
  });

  it("reports duplicate sources and duplicate players", () => {
    const violations = validateMovementShape(
      { first: "r1", second: null, third: null },
      "batter",
      [movement("r1", "first", "second"), movement("r1", "first", "third")]
    );

    expect(violations.map((violation) => violation.code)).toEqual(
      expect.arrayContaining([
        "DUPLICATE_MOVEMENT_SOURCE",
        "DUPLICATE_RUNNER_MOVEMENT",
      ])
    );
  });

  it("reports two runners arriving at the same base", () => {
    const violations = validateMovementShape(
      { first: "r1", second: "r2", third: null },
      "batter",
      [movement("r2", "second", "third"), movement("r1", "first", "third")]
    );

    expect(violations.map((violation) => violation.code)).toContain(
      "DUPLICATE_DESTINATION"
    );
  });

  it("reports arrival at a base occupied by a runner who does not move", () => {
    const violations = validateMovementShape(
      { first: "r1", second: "r2", third: null },
      "batter",
      [movement("batter", "batter", "first")]
    );

    expect(violations.map((violation) => violation.code)).toContain(
      "DESTINATION_OCCUPIED"
    );
  });

  it("reports invalid RBI flags and backward movement", () => {
    const violations = validateMovementShape(
      { first: null, second: "r2", third: null },
      "batter",
      [
        movement("r2", "second", "first"),
        movement("batter", "batter", "first", true),
      ]
    );

    expect(violations.map((violation) => violation.code)).toEqual(
      expect.arrayContaining(["BACKWARD_MOVEMENT", "INVALID_RBI"])
    );
  });
});
