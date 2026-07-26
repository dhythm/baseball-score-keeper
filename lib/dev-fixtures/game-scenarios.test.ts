import { describe, expect, it } from "vitest";

import { replay } from "../domain/replay";
import {
  buildDevGameScenario,
  DEVELOPMENT_GAME_SCENARIOS,
} from "./game-scenarios";

describe("development game scenarios", () => {
  it("offers uniquely identified, documented scenarios", () => {
    expect(DEVELOPMENT_GAME_SCENARIOS).toHaveLength(8);
    expect(new Set(DEVELOPMENT_GAME_SCENARIOS.map(({ id }) => id)).size).toBe(
      8
    );
    for (const scenario of DEVELOPMENT_GAME_SCENARIOS) {
      expect(scenario.title.trim()).not.toBe("");
      expect(scenario.description.trim()).not.toBe("");
      expect(scenario.expectation.trim()).not.toBe("");
    }
  });

  for (const scenario of DEVELOPMENT_GAME_SCENARIOS) {
    it(`replays ${scenario.id} to its expected state`, () => {
      const game = scenario.createGame();
      const result = replay(game.events, game.config);

      expect(game.id).toBe(scenario.id);
      expect(result.timeline).toHaveLength(game.events.length);
      expect(result.timeline.every((entry) => entry.applied)).toBe(true);
      expect(result.violations).toEqual([]);
      expect(result.snapshot).toMatchObject(scenario.expectedState);
    });
  }

  it("builds fresh data and returns null for an unknown scenario", () => {
    const first = buildDevGameScenario("pitching-duel");
    const second = buildDevGameScenario("pitching-duel");

    expect(first).not.toBeNull();
    expect(second).not.toBe(first);
    expect(buildDevGameScenario("missing")).toBeNull();
  });
});
