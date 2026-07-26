import { replay } from "../domain/replay";
import type {
  AtBatResult as DomainAtBatResult,
  GameEvent as DomainGameEvent,
  ReplayResult,
} from "../domain/types";
import type {
  AtBatResult,
  Game,
  GameEvent,
  GameState,
} from "../types";

function toDomainAtBatResult(result: AtBatResult): DomainAtBatResult {
  if (result === "strikeout") return "strikeoutSwinging";
  if (result === "doublePlay") return "otherOut";
  return result;
}

export function toDomainEvent(event: GameEvent): DomainGameEvent {
  if (event.type === "baseRunning") {
    return {
      id: event.id,
      kind: "baseRunning",
      type: event.baseRunningType!,
      movements: event.runnerMovements,
      rbiCreditBatterId: event.rbiCreditBatterId,
    };
  }

  return {
    id: event.id,
    kind: "atBat",
    batterId: event.batterId!,
    result: toDomainAtBatResult(event.result!),
    note: event.resultDetail,
    movements: event.runnerMovements,
  };
}

export function replayGame(game: Game): ReplayResult {
  return replay(game.events.map(toDomainEvent), {
    regulationInnings: game.totalInnings,
    teams: game.teams,
  });
}

function toLegacyState(result: ReplayResult): GameState {
  return {
    inning: result.snapshot.inning,
    half: result.snapshot.half,
    outs: result.snapshot.outs,
    runners: result.snapshot.runners,
    currentBatterIndex: result.snapshot.currentBatterIndex,
  };
}

/**
 * Rebuilds the legacy-shaped UI view from input-only events.
 *
 * The compatibility fields on each event are projections for existing
 * components. They are never trusted as replay input or persisted by v2
 * storage.
 */
export function rebuildGameFromEvents(game: Game): Game {
  const result = replayGame(game);
  const events = game.events.map((event, index) => {
    const entry = result.timeline[index];
    return {
      ...event,
      inning: entry.inning,
      half: entry.half,
      team: entry.team,
      outsInPlay: entry.outsRecorded,
      runsScored: entry.runsScored,
    };
  });

  return {
    ...game,
    events,
    currentState: toLegacyState(result),
    status: result.snapshot.gameStatus === "finished" ? "finished" : "live",
  };
}
