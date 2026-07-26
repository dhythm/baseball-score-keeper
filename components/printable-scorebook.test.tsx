import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { gameReducer } from "@/lib/app-state/reducer";
import type { GameConfig } from "@/lib/domain/types";
import { PrintableScorebook } from "./printable-scorebook";

const config: GameConfig = {
  regulationInnings: 1,
  teams: {
    away: {
      name: "ビジター",
      players: [{ id: "away-1", name: "山田", order: 1 }],
    },
    home: {
      name: "ホーム",
      players: [{ id: "home-1", name: "鈴木", order: 1 }],
    },
  },
};

describe("PrintableScorebook", () => {
  it("renders both teams and print-specific landscape layout", () => {
    const game = gameReducer(null, {
      type: "START_GAME",
      id: "print-game",
      date: "2026-07-27T00:00:00.000Z",
      config,
    });
    if (!game) throw new Error("Failed to create game");

    const html = renderToStaticMarkup(<PrintableScorebook game={game} />);

    expect(html).toContain("野球スコアブック");
    expect(html).toContain("ビジター");
    expect(html).toContain("ホーム");
    expect(html.match(/class="print-scorebook-team"/g)).toHaveLength(2);
    expect(html).toContain("@page { size: A4 landscape");
  });
});
