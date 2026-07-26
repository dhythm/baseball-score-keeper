import { describe, expect, it } from "vitest";

import { createDummyGameAfterSevenInnings } from "../dummy-game";
import { replay } from "./replay";
import type {
  AtBatEvent,
  AtBatResult,
  GameConfig,
  RunnerMovement,
} from "./types";

const RESULT_MAP: Record<string, AtBatResult> = {
  single: "single",
  double: "double",
  triple: "triple",
  homerun: "homerun",
  groundOut: "groundOut",
  flyOut: "flyOut",
  strikeout: "strikeoutSwinging",
  strikeoutSwinging: "strikeoutSwinging",
  strikeoutLooking: "strikeoutLooking",
  doublePlay: "otherOut",
  otherOut: "otherOut",
  walk: "walk",
  hitByPitch: "hitByPitch",
  error: "error",
  sacrifice: "sacrifice",
  fieldersChoice: "fieldersChoice",
  interference: "interference",
};

describe("v2 replay characterization", () => {
  it("replays the existing 42-plate-appearance scenario without frozen placement fields", () => {
    const legacy = createDummyGameAfterSevenInnings();
    const config: GameConfig = {
      regulationInnings: 9,
      teams: legacy.teams,
    };
    const events: AtBatEvent[] = legacy.events.map((event) => ({
      id: event.id,
      kind: "atBat",
      batterId: event.batterId!,
      result: RESULT_MAP[event.result!],
      note: event.resultDetail,
      movements: event.runnerMovements as RunnerMovement[],
    }));

    const result = replay(events, config);

    expect(result.timeline).toHaveLength(42);
    expect(result.timeline.every((entry) => entry.applied)).toBe(true);
    expect(result.snapshot).toEqual({
      inning: 8,
      half: "top",
      outs: 0,
      runners: { first: null, second: null, third: null },
      currentBatterIndex: { away: 3, home: 3 },
      score: { away: 0, home: 0 },
      gameStatus: "live",
    });
  });
});
