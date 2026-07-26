// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { gameReducer } from "@/lib/app-state/reducer";
import type { AppGame } from "@/lib/app-state/types";
import type { GameConfig, GameEvent } from "@/lib/domain/types";
import { GameProvider, useGame } from "@/lib/game-context";
import { AtBatResultFlow } from "./at-bat-result-flow";
import { BaseRunningEventSheet } from "./base-running-event-sheet";
import { GameNoteDialog } from "./game-note-dialog";
import { LiveScoring } from "./live-scoring";
import { Scoreboard } from "./scoreboard";

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

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function LiveGameHarness() {
  const { game, dispatch } = useGame();

  useEffect(() => {
    dispatch({
      type: "START_GAME",
      id: "live-flow",
      date: "2026-07-26T00:00:00.000Z",
      config,
    });
  }, [dispatch]);

  return game ? <LiveScoring /> : null;
}

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

  it("trims and records a lightweight game note", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => true);
    const onOpenChange = vi.fn();
    render(
      <GameNoteDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />
    );

    const submitButton = screen.getByRole("button", { name: "メモを記録" });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    await user.type(
      screen.getByRole("textbox", { name: "試合メモ" }),
      "  雨天中断  "
    );
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith("雨天中断");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("expands the compact live scoreboard on demand", async () => {
    const user = userEvent.setup();
    render(<Scoreboard game={createGame([])} collapsibleOnMobile />);

    await user.click(
      screen.getByRole("button", { name: "スコアボードを展開" })
    );

    expect(
      screen.getByRole("button", { name: "スコアボードを折りたたむ" })
    ).toBeTruthy();
  });

  it("records a selected result through live scoring and shows it in the batting order", async () => {
    const user = userEvent.setup();
    render(
      <GameProvider>
        <LiveGameHarness />
      </GameProvider>
    );

    await user.click(await screen.findByRole("button", { name: "結果入力" }));
    await user.click(await screen.findByRole("button", { name: "三振" }));

    expect(
      await screen.findAllByRole("button", {
        name: "1回の記録 三振を修正",
      })
    ).not.toHaveLength(0);
  });
});
