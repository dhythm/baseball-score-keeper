import { describe, expect, it } from "vitest";

import { formatViolationMessage } from "./feedback";

describe("formatViolationMessage", () => {
  it("returns an actionable Japanese message for known violations", () => {
    expect(
      formatViolationMessage({
        code: "DESTINATION_OCCUPIED",
        severity: "error",
        message: "first is occupied",
      })
    ).toBe("進塁先の塁が空いていません。");
  });

  it("falls back without exposing an internal English message", () => {
    expect(
      formatViolationMessage({
        code: "DUPLICATE_EVENT_ID",
        severity: "error",
        message: "duplicate",
      })
    ).toBe("入力内容を確認してください。");
  });
});
