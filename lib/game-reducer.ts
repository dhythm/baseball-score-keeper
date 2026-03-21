import type { Game, GameEvent, Team, GameStatus } from "./types";
import {
  createNewGame,
  recalculateFromEvents,
  generateId,
  isGameOver,
} from "./game-utils";

export type GameAction =
  | { type: "START_GAME"; awayTeam: Team; homeTeam: Team }
  | { type: "ADD_EVENT"; event: Omit<GameEvent, "id" | "timestamp"> }
  | { type: "UNDO_LAST_EVENT" }
  | { type: "UPDATE_EVENT"; eventId: string; event: Partial<GameEvent> }
  | { type: "DELETE_EVENT"; eventId: string }
  | { type: "END_GAME" }
  | { type: "RESET_GAME" }
  | { type: "LOAD_GAME"; game: Game };

export function gameReducer(state: Game | null, action: GameAction): Game | null {
  switch (action.type) {
    case "START_GAME": {
      const game = createNewGame(action.awayTeam, action.homeTeam);
      return game;
    }

    case "ADD_EVENT": {
      if (!state) return null;

      const newEvent: GameEvent = {
        ...action.event,
        id: generateId(),
        timestamp: new Date().toISOString(),
      };

      const newEvents = [...state.events, newEvent];
      const newState = recalculateFromEvents(newEvents, state.teams);

      const updatedGame: Game = {
        ...state,
        events: newEvents,
        currentState: newState,
      };

      if (isGameOver(updatedGame)) {
        updatedGame.status = "finished";
      }

      return updatedGame;
    }

    case "UNDO_LAST_EVENT": {
      if (!state || state.events.length === 0) return state;

      const newEvents = state.events.slice(0, -1);
      const newState = recalculateFromEvents(newEvents, state.teams);

      return {
        ...state,
        events: newEvents,
        currentState: newState,
        status: "live" as GameStatus,
      };
    }

    case "UPDATE_EVENT": {
      if (!state) return null;

      const eventIndex = state.events.findIndex((e) => e.id === action.eventId);
      if (eventIndex === -1) return state;

      const newEvents = [...state.events];
      newEvents[eventIndex] = {
        ...newEvents[eventIndex],
        ...action.event,
      };

      const newState = recalculateFromEvents(newEvents, state.teams);

      const updatedGame: Game = {
        ...state,
        events: newEvents,
        currentState: newState,
      };

      if (isGameOver(updatedGame)) {
        updatedGame.status = "finished";
      }

      return updatedGame;
    }

    case "DELETE_EVENT": {
      if (!state) return null;

      const newEvents = state.events.filter((e) => e.id !== action.eventId);
      const newState = recalculateFromEvents(newEvents, state.teams);

      return {
        ...state,
        events: newEvents,
        currentState: newState,
      };
    }

    case "END_GAME": {
      if (!state) return null;
      return {
        ...state,
        status: "finished",
      };
    }

    case "RESET_GAME": {
      return null;
    }

    case "LOAD_GAME": {
      return action.game;
    }

    default:
      return state;
  }
}
