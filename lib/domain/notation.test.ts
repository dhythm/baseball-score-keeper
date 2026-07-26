import { describe, expect, it } from "vitest";

import type { AtBatEvent, BaseRunningEvent } from "./types";
import {
  formatAtBatNotation,
  formatAtBatResult,
  formatBaseRunningNotation,
  formatEventNotation,
  formatFieldingPosition,
  formatGameControlNotation,
  formatSubstitutionNotation,
} from "./notation";

function atBat(
  result: AtBatEvent["result"],
  battedBall?: AtBatEvent["battedBall"]
): AtBatEvent {
  return {
    id: "at-bat",
    kind: "atBat",
    batterId: "batter",
    result,
    battedBall,
    movements: [],
  };
}

describe("at-bat notation", () => {
  it("formats a fielding position for a scorebook lineup", () => {
    expect(formatFieldingPosition("short")).toBe("遊");
    expect(formatFieldingPosition("dh")).toBe("指");
  });

  it("renders an unspecialized strikeout as 三振", () => {
    expect(formatAtBatResult("strikeout")).toBe("三振");
  });

  it("keeps dedicated double-play notation", () => {
    expect(
      formatAtBatNotation(
        atBat("doublePlay", { position: "short", type: "ground" })
      )
    ).toBe("遊併");
  });

  it("distinguishes swinging and looking strikeouts", () => {
    expect(formatAtBatNotation(atBat("strikeoutSwinging"))).toBe("空三振");
    expect(formatAtBatNotation(atBat("strikeoutLooking"))).toBe("見三振");
  });

  it("uses the result before the batted-ball shape, so an infield hit is not an out", () => {
    const battedBall = { position: "short", type: "ground" } as const;

    expect(formatAtBatNotation(atBat("single", battedBall))).toBe("遊安");
    expect(formatAtBatNotation(atBat("groundOut", battedBall))).toBe("遊ゴロ");
  });

  it("includes the structured fielding position for extra-base hits", () => {
    expect(
      formatAtBatNotation(atBat("double", { position: "right", type: "liner" }))
    ).toBe("右2");
    expect(
      formatAtBatNotation(
        atBat("triple", { position: "center", type: "liner" })
      )
    ).toBe("中3");
    expect(
      formatAtBatNotation(atBat("homerun", { position: "left", type: "fly" }))
    ).toBe("左本");
  });

  it("generates sacrifice-fly and error notation from structured fields", () => {
    expect(
      formatAtBatNotation(
        atBat("sacrificeFly", { position: "center", type: "fly" })
      )
    ).toBe("中犠飛");
    expect(
      formatAtBatNotation(atBat("error", { position: "short", type: "ground" }))
    ).toBe("遊失");
  });
});

describe("base-running notation", () => {
  it("generates notation from its structured movement", () => {
    const event: BaseRunningEvent = {
      id: "steal",
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
    };

    expect(formatBaseRunningNotation(event)).toBe("盗2");
    expect(formatEventNotation(event)).toBe("盗2");
  });

  it("renders every movement in a multiple-runner play", () => {
    const event: BaseRunningEvent = {
      id: "double-steal",
      kind: "baseRunning",
      type: "steal",
      movements: [
        {
          playerId: "lead-runner",
          from: "second",
          to: "third",
          isRBI: false,
        },
        {
          playerId: "trail-runner",
          from: "first",
          to: "second",
          isRBI: false,
        },
      ],
    };

    expect(formatBaseRunningNotation(event)).toBe("盗3・盗2");
  });
});

describe("game-management notation", () => {
  it("formats each substitution role without parsing free text", () => {
    const baseEvent = {
      id: "change",
      kind: "substitution",
      team: "away",
      inPlayerId: "incoming",
      outPlayerId: "outgoing",
    } as const;

    expect(
      formatSubstitutionNotation({ ...baseEvent, role: "pinchHitter" })
    ).toBe("代打");
    expect(
      formatSubstitutionNotation({ ...baseEvent, role: "pinchRunner" })
    ).toBe("代走");
    expect(formatSubstitutionNotation({ ...baseEvent, role: "pitcher" })).toBe(
      "投手交代"
    );
    expect(formatSubstitutionNotation({ ...baseEvent, role: "fielder" })).toBe(
      "守備交代"
    );
  });

  it("includes an optional manual game-end reason", () => {
    const event = {
      id: "end",
      kind: "gameControl",
      action: "endGame",
      reason: "降雨コールド",
    } as const;

    expect(formatGameControlNotation(event)).toBe("試合終了（降雨コールド）");
    expect(formatEventNotation(event)).toBe("試合終了（降雨コールド）");
  });
});
