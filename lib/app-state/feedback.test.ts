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

  it("explains invalid game notes in Japanese", () => {
    expect(
      formatViolationMessage({
        code: "EMPTY_GAME_NOTE",
        severity: "error",
        message: "note must not be blank",
      })
    ).toBe("メモを入力してください。");
    expect(
      formatViolationMessage({
        code: "GAME_NOTE_TOO_LONG",
        severity: "error",
        message: "note must not exceed 120 characters",
      })
    ).toBe("メモは120文字以内で入力してください。");
  });
});
