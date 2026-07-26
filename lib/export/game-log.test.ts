import { describe, expect, it } from "vitest";

import type { PersistedGameV2 } from "../storage/local-storage";
import { exportGameAsJson, exportGameAsText } from "./game-log";

function completedGame(): PersistedGameV2 {
  return {
    id: "game-1",
    date: "2026-07-26T10:00:00.000Z",
    status: "finished",
    config: {
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
    },
    events: [
      {
        id: "event-1",
        kind: "atBat",
        batterId: "away-1",
        result: "homerun",
        movements: [
          {
            playerId: "away-1",
            from: "batter",
            to: "home",
            isRBI: true,
          },
        ],
      },
      {
        id: "event-2",
        kind: "atBat",
        batterId: "away-1",
        result: "otherOut",
        note: "走者一掃後",
        movements: [
          {
            playerId: "away-1",
            from: "batter",
            to: "out",
            isRBI: false,
          },
        ],
      },
    ],
  };
}

describe("game log export", () => {
  it("exports import-compatible, pretty-printed JSON without derived state", () => {
    const serialized = exportGameAsJson(completedGame());
    const parsed = JSON.parse(serialized);

    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.game.id).toBe("game-1");
    expect(parsed.game.events[0].id).toBe("event-1");
    expect(parsed.game).not.toHaveProperty("currentState");
    expect(serialized).toContain("\n  ");
  });

  it("exports a readable text log with teams, score, inning, batter and note", () => {
    const text = exportGameAsText(completedGame());

    expect(text).toContain("ビジター 1 - 0 ホーム");
    expect(text).toContain("2026-07-26");
    expect(text).toContain("1回表 0アウト 山田: 本塁打");
    expect(text).toContain("1回表 0アウト 山田: アウト（走者一掃後）");
    expect(text).toContain("試合終了");
  });

  it("does not mutate the exported game", () => {
    const game = completedGame();
    const before = structuredClone(game);

    exportGameAsJson(game);
    exportGameAsText(game);

    expect(game).toEqual(before);
  });

  it("uses the incoming player's name for substitutions and formats manual end", () => {
    const game = completedGame();
    game.config.teams.away.benchPlayers = [
      { id: "pinch", name: "代打者", order: 10 },
    ];
    game.events = [
      {
        id: "change",
        kind: "substitution",
        team: "away",
        inPlayerId: "pinch",
        outPlayerId: "away-1",
        role: "pinchHitter",
      },
      {
        id: "end",
        kind: "gameControl",
        action: "endGame",
        reason: "降雨コールド",
      },
    ];

    const text = exportGameAsText(game);

    expect(text).toContain("代打者: 代打");
    expect(text).toContain("試合終了（降雨コールド）");
    expect(text).not.toContain("走者: 試合終了");
  });
});
