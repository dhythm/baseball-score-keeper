import { describe, expect, it } from "vitest";

import { formatSituationSummary } from "./situation";

describe("formatSituationSummary", () => {
  it("formats inning, outs, occupied bases, and batter in one line", () => {
    expect(
      formatSituationSummary({
        inning: 3,
        half: "top",
        outs: 1,
        runners: { first: "r1", second: "r2", third: null },
        batterName: "山田",
      })
    ).toBe("3回表・1アウト・走者一二塁・打者 山田");
  });

  it("uses concise labels for no outs and empty bases", () => {
    expect(
      formatSituationSummary({
        inning: 1,
        half: "bottom",
        outs: 0,
        runners: { first: null, second: null, third: null },
        batterName: "佐藤",
      })
    ).toBe("1回裏・ノーアウト・走者なし・打者 佐藤");
  });
});
