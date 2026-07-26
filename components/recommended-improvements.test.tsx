import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EventIntegrityAlert } from "./event-integrity-alert";
import { ScorebookAtBatLine } from "./scorebook-at-bat-line";
import { SituationMiniHeader } from "./situation-mini-header";
import { createAtBatEvent } from "../lib/app-state/event-factory";
import { gameReducer } from "../lib/app-state/reducer";
import type { GameEvent, Team } from "../lib/domain/types";

const team = (side: string): Team => ({
  name: side,
  players: [
    { id: `${side}-1`, name: `${side} 1`, order: 1 },
    { id: `${side}-2`, name: `${side} 2`, order: 2 },
  ],
});

function loadGame(events: GameEvent[]) {
  return gameReducer(null, {
    type: "LOAD_GAME",
    game: {
      id: "game",
      date: "2026-07-26T00:00:00.000Z",
      status: "live",
      config: {
        regulationInnings: 7,
        teams: { away: team("away"), home: team("home") },
      },
      events,
    },
  })!;
}

describe("recommended improvement UI", () => {
  it("renders the current situation as an accessible single-line summary", () => {
    const game = loadGame([]);
    const html = renderToStaticMarkup(
      <SituationMiniHeader game={game} snapshot={game.currentState} />
    );

    expect(html).toContain(
      "現在の状況: 1回表・ノーアウト・走者なし・打者 away 1"
    );
  });

  it("keeps rejected downstream records visible with their reason", () => {
    const game = loadGame([
      {
        id: "first",
        kind: "atBat",
        batterId: "away-1",
        result: "groundOut",
        movements: [
          {
            playerId: "away-1",
            from: "batter",
            to: "out",
            isRBI: false,
          },
        ],
      },
      {
        id: "rejected",
        kind: "atBat",
        batterId: "away-2",
        result: "otherOut",
        movements: [
          {
            playerId: "away-1",
            from: "first",
            to: "out",
            isRBI: false,
          },
          {
            playerId: "away-2",
            from: "batter",
            to: "out",
            isRBI: false,
          },
        ],
      },
    ]);
    const html = renderToStaticMarkup(<EventIntegrityAlert game={game} />);

    expect(html).toContain("無効になった記録が1件あります");
    expect(html).toContain("指定した塁にその走者はいません");
  });

  it("renders a two-out ground ball as a double play in the batting order", () => {
    const game = loadGame([
      {
        id: "single",
        kind: "atBat",
        batterId: "away-1",
        result: "single",
        movements: [
          {
            playerId: "away-1",
            from: "batter",
            to: "first",
            isRBI: false,
          },
        ],
      },
      createAtBatEvent({
        id: "double-play",
        batterId: "away-2",
        result: "groundOut",
        detail: "二ゴロ",
        movements: [
          {
            playerId: "away-1",
            from: "first",
            to: "out",
            isRBI: false,
            outType: "force",
          },
          {
            playerId: "away-2",
            from: "batter",
            to: "out",
            isRBI: false,
          },
        ],
      }),
    ]);

    const html = renderToStaticMarkup(
      <ScorebookAtBatLine entry={game.timeline[1]} />
    );

    expect(html).toContain("二併");
    expect(html).not.toContain("二ゴロ");
  });
});
