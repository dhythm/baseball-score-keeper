"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
} from "react";
import type { AppGame, GameAction } from "./app-state/types";
import { gameReducer } from "./app-state/reducer";
import { toPersistedGame } from "./app-state/selectors";
import { createBrowserGameStorage } from "./storage/local-storage";

interface GameContextValue {
  game: AppGame | null;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, dispatch] = useReducer(gameReducer, null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = createBrowserGameStorage().load();
    if (stored) {
      dispatch({ type: "LOAD_GAME", game: stored });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const storage = createBrowserGameStorage();
    if (game) {
      storage.save(toPersistedGame(game));
    } else {
      storage.clear();
    }
  }, [game, hydrated]);

  return (
    <GameContext.Provider value={{ game, dispatch }}>
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
