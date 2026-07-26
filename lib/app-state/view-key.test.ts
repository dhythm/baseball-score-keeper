import { describe, expect, it } from "vitest";

import { getGameViewKey } from "./view-key";

describe("game view key", () => {
  it("changes across setup, live scoring, results, and another game", () => {
    expect(getGameViewKey(null)).toBe("setup");
    expect(getGameViewKey({ id: "game-1", status: "live" })).toBe(
      "game-1:live"
    );
    expect(getGameViewKey({ id: "game-1", status: "finished" })).toBe(
      "game-1:finished"
    );
    expect(getGameViewKey({ id: "game-2", status: "finished" })).toBe(
      "game-2:finished"
    );
  });
});
