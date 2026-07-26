import { describe, expect, it } from "vitest";

import { gamePath } from "./routes";

describe("game routes", () => {
  it("creates an encoded URL for each game id", () => {
    expect(gamePath("game-123")).toBe("/games/game-123");
    expect(gamePath("試合 1")).toBe(`/games/${encodeURIComponent("試合 1")}`);
  });
});
