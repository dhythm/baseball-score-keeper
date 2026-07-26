import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readComponent = (fileName: string) =>
  readFileSync(resolve(process.cwd(), "components", fileName), "utf8");

describe("concise interface copy", () => {
  it("does not show tutorial copy around routine controls", () => {
    const sources = [
      readComponent("at-bat-result-dialog.tsx"),
      readComponent("batting-order.tsx"),
      readComponent("game-history.tsx"),
      readComponent("game-result.tsx"),
      readComponent("game-setup.tsx"),
    ].join("\n");

    expect(sources).not.toContain(
      "種類を選び、続いて打球の方向や守備位置を選んでください"
    );
    expect(sources).not.toContain("列は1回〜のイニング");
    expect(sources).not.toContain("保存済みの試合を選ぶと");
    expect(sources).not.toContain("記録された投手交代ごとに集計しています");
    expect(sources).not.toContain(
      "イニング数と両チームの選手を登録して試合を始めます"
    );
  });
});
