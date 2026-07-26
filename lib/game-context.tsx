"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
  type Dispatch,
} from "react";
import type { AppGame, GameAction } from "./app-state/types";
import { gameReducer } from "./app-state/reducer";
import {
  evaluateEventAddition,
  evaluateEventUpdate,
} from "./app-state/reducer";
import { toPersistedGame } from "./app-state/selectors";
import { createBrowserGameRepository } from "./storage/local-storage";
import type { GameEvent, Violation } from "./domain/types";

interface GameContextValue {
  game: AppGame | null;
  storageReady: boolean;
  dispatch: Dispatch<GameAction>;
  loadGame: (gameId: string) => boolean;
  resetGame: () => void;
  addEvent: (event: GameEvent) => {
    accepted: boolean;
    violations: Violation[];
    invalidatedEventIds: string[];
  };
  updateEvent: (
    eventId: string,
    event: GameEvent
  ) => {
    accepted: boolean;
    violations: Violation[];
    invalidatedEventIds: string[];
  };
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, dispatch] = useReducer(gameReducer, null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady || !game) return;
    createBrowserGameRepository().save(toPersistedGame(game));
  }, [game, storageReady]);

  const loadGame = useCallback((gameId: string) => {
    const storedGame = createBrowserGameRepository().find(gameId);
    if (!storedGame) return false;
    dispatch({ type: "LOAD_GAME", game: storedGame });
    return true;
  }, []);

  const resetGame = useCallback(() => {
    createBrowserGameRepository().clearActive();
    dispatch({ type: "RESET_GAME" });
  }, []);

  const addEvent = useCallback(
    (event: GameEvent) => {
      if (!game)
        return {
          accepted: false,
          violations: [],
          invalidatedEventIds: [],
        };
      const result = evaluateEventAddition(game, event);
      if (result.accepted) {
        dispatch({ type: "ADD_EVENT", event });
      }
      return {
        accepted: result.accepted,
        violations: result.violations,
        invalidatedEventIds: result.invalidatedEventIds,
      };
    },
    [game]
  );

  const updateEvent = useCallback(
    (eventId: string, event: GameEvent) => {
      if (!game)
        return {
          accepted: false,
          violations: [],
          invalidatedEventIds: [],
        };
      const result = evaluateEventUpdate(game, eventId, event);
      if (!result)
        return {
          accepted: false,
          violations: [],
          invalidatedEventIds: [],
        };
      if (result.accepted) {
        dispatch({ type: "UPDATE_EVENT", eventId, event });
      }
      return {
        accepted: result.accepted,
        violations: result.violations,
        invalidatedEventIds: result.invalidatedEventIds,
      };
    },
    [game]
  );

  return (
    <GameContext.Provider
      value={{
        game,
        storageReady,
        dispatch,
        loadGame,
        resetGame,
        addEvent,
        updateEvent,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
