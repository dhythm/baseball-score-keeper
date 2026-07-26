"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type Dispatch,
} from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppGame, GameAction } from "./app-state/types";
import { gameReducer } from "./app-state/reducer";
import {
  evaluateEventAddition,
  evaluateEventUpdate,
} from "./app-state/reducer";
import { toPersistedGame } from "./app-state/selectors";
import {
  DEFAULT_GAME_STORAGE_KEY,
  createBrowserGameRepository,
  parseStoredGame,
  serializeStoredGame,
  type PersistedGameV2,
} from "./storage/local-storage";
import type { GameEvent, Violation } from "./domain/types";

interface GameContextValue {
  game: AppGame | null;
  storageReady: boolean;
  storageConflict: boolean;
  dispatch: Dispatch<GameAction>;
  loadGame: (gameId: string) => boolean;
  resetGame: () => void;
  reloadConflictingGame: () => void;
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
  const [game, reducerDispatch] = useReducer(gameReducer, null);
  const [storageReady, setStorageReady] = useState(false);
  const [conflictingGame, setConflictingGame] =
    useState<PersistedGameV2 | null>(null);
  const storageConflictRef = useRef(false);
  const storageConflict = conflictingGame !== null;

  useEffect(() => {
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady || !game || storageConflict) return;
    createBrowserGameRepository().save(toPersistedGame(game));
  }, [game, storageConflict, storageReady]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key !== DEFAULT_GAME_STORAGE_KEY ||
        event.newValue === null ||
        !game
      ) {
        return;
      }

      let externalGame: PersistedGameV2;
      try {
        externalGame = parseStoredGame(event.newValue);
      } catch {
        return;
      }

      if (
        externalGame.id !== game.id ||
        serializeStoredGame(externalGame) ===
          serializeStoredGame(toPersistedGame(game))
      ) {
        return;
      }

      storageConflictRef.current = true;
      setConflictingGame(externalGame);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [game, storageConflictRef]);

  const dispatch = useCallback<Dispatch<GameAction>>(
    (action) => {
      if (
        storageConflictRef.current &&
        action.type !== "LOAD_GAME" &&
        action.type !== "RESET_GAME"
      ) {
        return;
      }
      reducerDispatch(action);
    },
    [storageConflictRef]
  );

  const loadGame = useCallback(
    (gameId: string) => {
      const storedGame = createBrowserGameRepository().find(gameId);
      if (!storedGame) return false;
      storageConflictRef.current = false;
      setConflictingGame(null);
      reducerDispatch({ type: "LOAD_GAME", game: storedGame });
      return true;
    },
    [storageConflictRef]
  );

  const resetGame = useCallback(() => {
    createBrowserGameRepository().clearActive();
    storageConflictRef.current = false;
    setConflictingGame(null);
    reducerDispatch({ type: "RESET_GAME" });
  }, [storageConflictRef]);

  const reloadConflictingGame = useCallback(() => {
    if (!conflictingGame) return;
    storageConflictRef.current = false;
    reducerDispatch({ type: "LOAD_GAME", game: conflictingGame });
    setConflictingGame(null);
  }, [conflictingGame, storageConflictRef]);

  const addEvent = useCallback(
    (event: GameEvent) => {
      if (!game || storageConflictRef.current)
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
    [dispatch, game, storageConflictRef]
  );

  const updateEvent = useCallback(
    (eventId: string, event: GameEvent) => {
      if (!game || storageConflictRef.current)
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
    [dispatch, game, storageConflictRef]
  );

  return (
    <GameContext.Provider
      value={{
        game,
        storageReady,
        storageConflict,
        dispatch,
        loadGame,
        resetGame,
        reloadConflictingGame,
        addEvent,
        updateEvent,
      }}
    >
      {children}
      {storageConflict && (
        <div
          role="alert"
          className="fixed inset-x-0 top-0 z-[70] flex flex-col items-center justify-center gap-2 border-b border-amber-700 bg-amber-400 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-center text-sm font-semibold text-amber-950 shadow-md sm:flex-row"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            別のタブでこの試合が更新されました
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 border-amber-900 bg-amber-50 text-amber-950 hover:bg-white"
            onClick={reloadConflictingGame}
          >
            他タブの内容を読み直す
          </Button>
        </div>
      )}
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
