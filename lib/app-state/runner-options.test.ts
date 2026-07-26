import { describe, expect, it } from "vitest";

import { getSafeRunnerDestinations } from "./runner-options";

describe("getSafeRunnerDestinations", () => {
  it("allows a batter to reach any base or home regardless of the result", () => {
    expect(getSafeRunnerDestinations("batter")).toEqual([
      "first",
      "second",
      "third",
      "home",
    ]);
  });

  it("offers only non-backward destinations to existing runners", () => {
    expect(getSafeRunnerDestinations("first")).toEqual([
      "first",
      "second",
      "third",
      "home",
    ]);
    expect(getSafeRunnerDestinations("second")).toEqual([
      "second",
      "third",
      "home",
    ]);
    expect(getSafeRunnerDestinations("third")).toEqual(["third", "home"]);
  });
});
