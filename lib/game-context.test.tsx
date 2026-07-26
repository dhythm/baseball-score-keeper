// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { GameEvent } from "./domain/types";
import { GameProvider, useGame } from "./game-context";
import {
  DEFAULT_GAME_STORAGE_KEY,
  serializeStoredGame,
  type PersistedGameV2,
} from "./storage/local-storage";

const game: PersistedGameV2 = {
  id: "same-game",
  date: "2026-07-27T00:00:00.000Z",
  status: "live",
  config: {
    regulationInnings: 7,
    teams: {
      away: {
        name: "Away",
        players: [{ id: "away-1", name: "Away 1", order: 1 }],
      },
      home: {
        name: "Home",
        players: [{ id: "home-1", name: "Home 1", order: 1 }],
      },
    },
  },
  events: [],
};

const recordedOut: GameEvent = {
  id: "out",
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
};

function Harness() {
  const {
    game: currentGame,
    dispatch,
    addEvent,
    storageConflict,
    reloadConflictingGame,
  } = useGame();

  return (
    <div>
      <span data-testid="event-count">{currentGame?.events.length ?? -1}</span>
      <span data-testid="conflict">{String(storageConflict)}</span>
      <button
        type="button"
        onClick={() => dispatch({ type: "ADD_EVENT", event: recordedOut })}
      >
        dispatch add
      </button>
      <button type="button" onClick={() => addEvent(recordedOut)}>
        command add
      </button>
      <button type="button" onClick={reloadConflictingGame}>
        test reload
      </button>
    </div>
  );
}

function dispatchStorageValue(value: string) {
  fireEvent(
    window,
    new StorageEvent("storage", {
      key: DEFAULT_GAME_STORAGE_KEY,
      newValue: value,
      storageArea: window.localStorage,
    })
  );
}

describe("GameProvider cross-tab editing guard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("becomes read-only for a different version of the active game and can load it", async () => {
    const user = userEvent.setup();
    const externalGame = { ...game, events: [recordedOut] };
    window.localStorage.setItem(
      DEFAULT_GAME_STORAGE_KEY,
      serializeStoredGame(game)
    );
    function LoadedHarness() {
      const context = useGame();
      return (
        <>
          <Harness />
          <button type="button" onClick={() => context.loadGame(game.id)}>
            load
          </button>
        </>
      );
    }
    render(
      <GameProvider>
        <LoadedHarness />
      </GameProvider>
    );
    await user.click(screen.getByText("load"));
    await waitFor(() =>
      expect(screen.getByTestId("event-count").textContent).toBe("0")
    );

    dispatchStorageValue(serializeStoredGame(externalGame));

    expect(screen.getByTestId("conflict").textContent).toBe("true");
    expect(screen.getByText("別のタブでこの試合が更新されました")).toBeTruthy();

    await user.click(screen.getByText("dispatch add"));
    await user.click(screen.getByText("command add"));
    expect(screen.getByTestId("event-count").textContent).toBe("0");

    await user.click(screen.getByText("他タブの内容を読み直す"));
    expect(screen.getByTestId("event-count").textContent).toBe("1");
    expect(screen.getByTestId("conflict").textContent).toBe("false");
  });

  it("ignores identical data, another game, malformed data, and unrelated keys", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      DEFAULT_GAME_STORAGE_KEY,
      serializeStoredGame(game)
    );

    function LoadedHarness() {
      const context = useGame();
      return (
        <>
          <Harness />
          <button type="button" onClick={() => context.loadGame(game.id)}>
            load
          </button>
        </>
      );
    }
    render(
      <GameProvider>
        <LoadedHarness />
      </GameProvider>
    );
    await user.click(screen.getByText("load"));

    dispatchStorageValue(serializeStoredGame(game));
    dispatchStorageValue(
      serializeStoredGame({
        ...game,
        id: "another-game",
        events: [recordedOut],
      })
    );
    dispatchStorageValue("{broken");
    fireEvent(
      window,
      new StorageEvent("storage", {
        key: "unrelated",
        newValue: serializeStoredGame({ ...game, events: [recordedOut] }),
      })
    );

    expect(screen.getByTestId("conflict").textContent).toBe("false");
  });
});
