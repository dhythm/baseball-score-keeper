import { replay } from "../domain/replay";
import type { PersistedGameV2 } from "../storage/local-storage";
import type { AppGame, AppGameState, GameAction } from "./types";

export function deriveGame(
  game: PersistedGameV2,
  manualEnded?: boolean
): AppGame {
  const replayResult = replay(game.events, game.config);
  const inferredManualEnd =
    game.status === "finished" &&
    replayResult.snapshot.gameStatus !== "finished";
  const isManuallyEnded = manualEnded ?? inferredManualEnd;
  const status =
    isManuallyEnded || replayResult.snapshot.gameStatus === "finished"
      ? "finished"
      : "live";

  return {
    id: game.id,
    date: game.date,
    config: game.config,
    events: game.events,
    manualEnded: isManuallyEnded,
    status,
    currentState: replayResult.snapshot,
    timeline: replayResult.timeline,
    violations: replayResult.violations,
    teams: game.config.teams,
    totalInnings: game.config.regulationInnings,
  };
}

function persistedInput(
  state: AppGame,
  events = state.events
): PersistedGameV2 {
  return {
    id: state.id,
    date: state.date,
    status: state.status,
    config: state.config,
    events,
  };
}

export function gameReducer(
  state: AppGameState,
  action: GameAction
): AppGameState {
  switch (action.type) {
    case "START_GAME":
      return deriveGame({
        id: action.id,
        date: action.date,
        status: "live",
        config: action.config,
        events: [],
      });

    case "LOAD_GAME":
      return deriveGame(action.game);

    case "RESET_GAME":
      return null;

    case "ADD_EVENT":
      if (!state) return null;
      return deriveGame(
        persistedInput(state, [...state.events, action.event]),
        state.manualEnded
      );

    case "UPDATE_EVENT": {
      if (!state) return null;
      const eventIndex = state.events.findIndex(
        (event) => event.id === action.eventId
      );
      if (eventIndex === -1) return state;
      const events = [...state.events];
      events[eventIndex] = { ...action.event, id: action.eventId };
      return deriveGame(
        persistedInput(state, events),
        state.manualEnded
      );
    }

    case "DELETE_EVENT": {
      if (!state) return null;
      if (!state.events.some((event) => event.id === action.eventId)) {
        return state;
      }
      const events = state.events.filter(
        (event) => event.id !== action.eventId
      );
      return deriveGame(
        persistedInput(state, events),
        state.manualEnded
      );
    }

    case "UNDO_LAST_EVENT":
      if (!state || state.events.length === 0) return state;
      return deriveGame(
        persistedInput(state, state.events.slice(0, -1)),
        state.manualEnded
      );

    case "END_GAME":
      if (!state) return null;
      return { ...state, manualEnded: true, status: "finished" };

    case "RESUME_GAME":
      if (!state) return null;
      return deriveGame(persistedInput(state), false);
  }
}
