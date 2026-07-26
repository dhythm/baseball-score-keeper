import { describe, expect, it } from "vitest";

import {
  HIT_KINDS,
  OTHER_OUT_DETAILS,
  buildSacrificeFlyDetail,
} from "./at-bat-notation";

describe("at-bat notation choices", () => {
  it("classifies an infield hit as a single instead of an out", () => {
    expect(HIT_KINDS).toContainEqual({
      result: "single",
      label: "内野安",
      detail: "内野安",
    });
    expect(OTHER_OUT_DETAILS).not.toContainEqual(
      expect.objectContaining({ detail: "内野安" })
    );
  });

  it("builds a sacrifice-fly detail with its fielding direction", () => {
    expect(buildSacrificeFlyDetail("center")).toBe("中犠飛");
  });
});
