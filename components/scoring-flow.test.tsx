// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { gameReducer } from "@/lib/app-state/reducer";
import type { AppGame } from "@/lib/app-state/types";
import type { GameConfig, GameEvent } from "@/lib/domain/types";
import { AtBatResultFlow } from "./at-bat-result-flow";
import { BaseRunningEventSheet } from "./base-running-event-sheet";

const config: GameConfig = {
  regulationInnings: 7,
  teams: {
    away: {
      name: "先攻",
      players: [{ id: "away-1", name: "先頭打者", order: 1 }],
    },
    home: {
      name: "後攻",
      players: [{ id: "home-1", name: "相手打者", order: 1 }],
    },
  },
};

const runnerOnFirst: GameEvent = {
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
};

function createGame(events: GameEvent[]): AppGame {
  const game = gameReducer(null, {
    type: "LOAD_GAME",
    game: {
      id: "game",
      date: "2026-07-26T00:00:00.000Z",
      status: "live",
      config,
      events,
    },
  });
  if (!game) throw new Error("Failed to create test game");
  return game;
}

afterEach(cleanup);

describe("scoring UI flows", () => {
  it("records a generic strikeout directly from the first result screen", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AtBatResultFlow resetToken={0} outs={0} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "三振" }));

    expect(onSubmit).toHaveBeenCalledWith("strikeout");
  });

  it("preselects the only runner and the conventional next base", async () => {
    const user = userEvent.setup();
    const onEvent = vi.fn();
    render(
      <BaseRunningEventSheet
        game={createGame([runnerOnFirst])}
        onEvent={onEvent}
      />
    );

    const nextBase = await screen.findByRole("radio", { name: "2塁" });
    await waitFor(() => expect(nextBase.getAttribute("data-state")).toBe("on"));
    await user.click(screen.getByRole("button", { name: "走塁を記録" }));

    expect(onEvent).toHaveBeenCalledWith({
      type: "steal",
      movements: [
        {
          playerId: "away-1",
          from: "first",
          to: "second",
          isRBI: false,
        },
      ],
    });
  });
});
