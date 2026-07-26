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
} from "react";
import {
  EditingConflictAlert,
  StorageFailureAlert,
} from "@/components/reliability-alerts";
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
  type PersistedGameV2,
} from "./storage/local-storage";
import type { GameEvent, Violation } from "./domain/types";

interface GameContextValue {
  game: AppGame | null;
  storageReady: boolean;
  storageConflict: boolean;
  storageError: boolean;
  dispatch: (action: GameAction) => boolean;
  retrySave: () => void;
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

function sameRecordedGame(
  left: PersistedGameV2,
  right: PersistedGameV2
): boolean {
  return (
    JSON.stringify({
      id: left.id,
      status: left.status,
      config: left.config,
      events: left.events,
    }) ===
    JSON.stringify({
      id: right.id,
      status: right.status,
      config: right.config,
      events: right.events,
    })
  );
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, reducerDispatch] = useReducer(gameReducer, null);
  const [storageReady, setStorageReady] = useState(false);
  const [conflictingGame, setConflictingGame] =
    useState<PersistedGameV2 | null>(null);
  const storageConflictRef = useRef(false);
  const storageConflict = conflictingGame !== null;
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady || !game || storageConflict) return;
    try {
      createBrowserGameRepository().save(toPersistedGame(game));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
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
        sameRecordedGame(externalGame, toPersistedGame(game))
      ) {
        return;
      }

      storageConflictRef.current = true;
      setConflictingGame(externalGame);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [game, storageConflictRef]);

  const dispatch = useCallback(
    (action: GameAction): boolean => {
      if (
        storageConflictRef.current &&
        action.type !== "LOAD_GAME" &&
        action.type !== "RESET_GAME"
      ) {
        return false;
      }
      reducerDispatch(action);
      return true;
    },
    [storageConflictRef]
  );

  const retrySave = useCallback(() => {
    if (!game || storageConflictRef.current) return;
    try {
      createBrowserGameRepository().save(toPersistedGame(game));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [game]);

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
        storageError,
        dispatch,
        retrySave,
        loadGame,
        resetGame,
        reloadConflictingGame,
        addEvent,
        updateEvent,
      }}
    >
      {children}
      {storageError && !storageConflict && (
        <StorageFailureAlert onRetry={retrySave} />
      )}
      {storageConflict && (
        <EditingConflictAlert onReload={reloadConflictingGame} />
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
