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
  dispatch: Dispatch<GameAction>;
  addEvent: (event: GameEvent) => {
    accepted: boolean;
    violations: Violation[];
  };
  updateEvent: (eventId: string, event: GameEvent) => {
    accepted: boolean;
    violations: Violation[];
  };
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, dispatch] = useReducer(gameReducer, null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = createBrowserGameRepository().loadActive();
    if (stored) {
      dispatch({ type: "LOAD_GAME", game: stored });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const repository = createBrowserGameRepository();
    if (game) {
      repository.save(toPersistedGame(game));
    } else {
      repository.clearActive();
    }
  }, [game, hydrated]);

  const addEvent = useCallback(
    (event: GameEvent) => {
      if (!game) return { accepted: false, violations: [] };
      const result = evaluateEventAddition(game, event);
      if (result.accepted) {
        dispatch({ type: "ADD_EVENT", event });
      }
      return {
        accepted: result.accepted,
        violations: result.violations,
      };
    },
    [game]
  );

  const updateEvent = useCallback(
    (eventId: string, event: GameEvent) => {
      if (!game) return { accepted: false, violations: [] };
      const result = evaluateEventUpdate(game, eventId, event);
      if (!result) return { accepted: false, violations: [] };
      if (result.accepted) {
        dispatch({ type: "UPDATE_EVENT", eventId, event });
      }
      return {
        accepted: result.accepted,
        violations: result.violations,
      };
    },
    [game]
  );

  return (
    <GameContext.Provider value={{ game, dispatch, addEvent, updateEvent }}>
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
