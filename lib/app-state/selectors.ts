import type { Player, TeamSide, TimelineEntry } from "../domain/types";
import type { PersistedGameV2 } from "../storage/local-storage";
import type { AppGame } from "./types";

export function getCurrentTeamSide(game: AppGame): TeamSide {
  return game.currentState.half === "top" ? "away" : "home";
}

export function getPlayerById(
  game: AppGame,
  playerId: string
): Player | null {
  return (
    game.config.teams.away.players.find((player) => player.id === playerId) ??
    game.config.teams.home.players.find((player) => player.id === playerId) ??
    null
  );
}

export function getCurrentBatter(game: AppGame): Player | null {
  const teamSide = getCurrentTeamSide(game);
  const lineup = game.config.teams[teamSide].players;
  const batterIndex = game.currentState.currentBatterIndex[teamSide];
  return lineup[batterIndex] ?? null;
}

export function getNextBatter(game: AppGame): Player | null {
  const teamSide = getCurrentTeamSide(game);
  const lineup = game.config.teams[teamSide].players;
  if (lineup.length === 0) return null;
  const batterIndex = game.currentState.currentBatterIndex[teamSide];
  return lineup[(batterIndex + 1) % lineup.length] ?? null;
}

export function getTimelineEntry(
  game: AppGame,
  eventId: string
): TimelineEntry | null {
  return (
    game.timeline.find((entry) => entry.event.id === eventId) ?? null
  );
}

export function getEffectiveInningCount(game: AppGame): number {
  const latestTimelineInning = game.timeline.reduce(
    (maximum, entry) => Math.max(maximum, entry.inning),
    0
  );
  return Math.max(
    game.config.regulationInnings,
    game.currentState.inning,
    latestTimelineInning
  );
}

export function toPersistedGame(game: AppGame): PersistedGameV2 {
  return {
    id: game.id,
    date: game.date,
    status: game.status,
    config: game.config,
    events: game.events,
  };
}
