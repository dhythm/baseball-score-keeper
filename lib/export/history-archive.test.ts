import { describe, expect, it } from "vitest";

import type { PersistedGameV2 } from "../storage/local-storage";
import { exportHistoryArchive, parseHistoryArchive } from "./history-archive";

function game(id: string): PersistedGameV2 {
  return {
    id,
    date: "2026-07-27",
    status: "finished",
    config: {
      regulationInnings: 1,
      teams: {
        away: {
          name: "Away",
          players: [{ id: "away", name: "Away", order: 1 }],
        },
        home: {
          name: "Home",
          players: [{ id: "home", name: "Home", order: 1 }],
        },
      },
    },
    events: [],
  };
}

describe("history archive", () => {
  it("round-trips multiple games in a versioned archive", () => {
    const games = [game("one"), game("two")];

    const serialized = exportHistoryArchive(games, "2026-07-27T10:00:00.000Z");

    expect(JSON.parse(serialized)).toMatchObject({
      format: "baseball-score-keeper-history",
      version: 1,
      exportedAt: "2026-07-27T10:00:00.000Z",
    });
    expect(parseHistoryArchive(serialized)).toEqual(games);
  });

  it("rejects the whole archive when one game is malformed", () => {
    const parsed = JSON.parse(exportHistoryArchive([game("one"), game("two")]));
    parsed.games[1].config.regulationInnings = 0;

    expect(() => parseHistoryArchive(JSON.stringify(parsed))).toThrow(
      "invalid history archive"
    );
  });

  it("rejects unsupported archive metadata", () => {
    expect(() =>
      parseHistoryArchive(
        JSON.stringify({
          format: "baseball-score-keeper-history",
          version: 2,
          exportedAt: "2026-07-27",
          games: [],
        })
      )
    ).toThrow("invalid history archive");
  });
});
