import { replay } from "../domain/replay";
import type { GameEvent, Violation } from "../domain/types";
import type { PersistedGameV2 } from "../storage/local-storage";
import type { AppGame, AppGameState, GameAction } from "./types";

function deriveGame(
  game: PersistedGameV2,
  manualEnded?: boolean,
  redoEvent: GameEvent | null = null
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
    redoEvent,
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

export interface EventCommandResult {
  accepted: boolean;
  nextState: AppGame;
  violations: Violation[];
  invalidatedEventIds: string[];
}

function getNewlyInvalidatedEventIds(
  state: AppGame,
  nextState: AppGame
): string[] {
  const wasAppliedByEvent = new Map(
    state.timeline.map((entry) => [entry.event, entry.applied])
  );
  return nextState.timeline.flatMap((entry) =>
    wasAppliedByEvent.get(entry.event) === true && !entry.applied
      ? [entry.event.id]
      : []
  );
}

export function evaluateEventAddition(
  state: AppGame,
  event: GameEvent
): EventCommandResult {
  const nextState = deriveGame(
    persistedInput(state, [...state.events, event]),
    state.manualEnded
  );
  const entry = nextState.timeline.at(-1);
  return {
    accepted: entry?.event.id === event.id && entry.applied,
    nextState,
    violations: nextState.violations.filter(
      (item) => item.eventId === event.id
    ),
    invalidatedEventIds: [],
  };
}

export function evaluateEventUpdate(
  state: AppGame,
  eventId: string,
  replacement: GameEvent
): EventCommandResult | null {
  const eventIndex = state.events.findIndex((event) => event.id === eventId);
  if (eventIndex === -1) return null;
  const events = [...state.events];
  const event = { ...replacement, id: eventId };
  events[eventIndex] = event;
  const nextState = deriveGame(
    persistedInput(state, events),
    state.manualEnded
  );
  const entry = nextState.timeline[eventIndex];
  return {
    accepted: entry?.event.id === eventId && entry.applied,
    nextState,
    violations: nextState.violations.filter((item) => item.eventId === eventId),
    invalidatedEventIds: getNewlyInvalidatedEventIds(state, nextState),
  };
}

export function evaluateEventDeletion(
  state: AppGame,
  eventId: string
): EventCommandResult | null {
  if (!state.events.some((event) => event.id === eventId)) return null;
  const events = state.events.filter((event) => event.id !== eventId);
  const nextState = deriveGame(
    persistedInput(state, events),
    state.manualEnded
  );
  return {
    accepted: true,
    nextState,
    violations: nextState.violations.filter(
      (item) => item.eventId !== undefined
    ),
    invalidatedEventIds: getNewlyInvalidatedEventIds(state, nextState),
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
      {
        const result = evaluateEventAddition(state, action.event);
        return result.accepted ? result.nextState : state;
      }

    case "UPDATE_EVENT": {
      if (!state) return null;
      const result = evaluateEventUpdate(state, action.eventId, action.event);
      return result?.accepted ? result.nextState : state;
    }

    case "DELETE_EVENT": {
      if (!state) return null;
      const result = evaluateEventDeletion(state, action.eventId);
      return result?.nextState ?? state;
    }

    case "UNDO_LAST_EVENT":
      if (!state || state.events.length === 0) return state;
      return deriveGame(
        persistedInput(state, state.events.slice(0, -1)),
        state.manualEnded,
        state.events.at(-1) ?? null
      );

    case "REDO_LAST_EVENT":
      if (!state?.redoEvent) return state;
      return deriveGame(
        persistedInput(state, [...state.events, state.redoEvent]),
        state.manualEnded
      );

    case "RESUME_GAME":
      if (!state) return null;
      return deriveGame(
        persistedInput(
          state,
          state.events.at(-1)?.kind === "gameControl"
            ? state.events.slice(0, -1)
            : state.events
        ),
        false
      );
  }
}
