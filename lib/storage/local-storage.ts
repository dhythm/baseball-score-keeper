import type {
  AtBatResult as LegacyAtBatResult,
  Game as LegacyGame,
  GameEvent as LegacyGameEvent,
} from "../types";
import type {
  AtBatEvent,
  AtBatResult,
  BaseRunningEvent,
  BattedBall,
  FieldingPosition,
  GameConfig,
  GameEvent,
} from "../domain/types";

export const SCHEMA_VERSION = 2 as const;
export const DEFAULT_GAME_STORAGE_KEY = "baseball-scorer-game";

export interface PersistedGameV2 {
  id: string;
  date: string;
  status: "setup" | "live" | "finished";
  config: GameConfig;
  events: GameEvent[];
}

export interface StorageEnvelopeV2 {
  schemaVersion: typeof SCHEMA_VERSION;
  game: PersistedGameV2;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface GameStorage {
  load(): PersistedGameV2 | null;
  save(game: PersistedGameV2): void;
  clear(): void;
}

export class StoredGameFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoredGameFormatError";
  }
}

const LEGACY_RESULT_MAP: Record<LegacyAtBatResult, AtBatResult> = {
  single: "single",
  double: "double",
  triple: "triple",
  homerun: "homerun",
  groundOut: "groundOut",
  flyOut: "flyOut",
  strikeout: "strikeoutSwinging",
  strikeoutSwinging: "strikeoutSwinging",
  strikeoutLooking: "strikeoutLooking",
  doublePlay: "otherOut",
  otherOut: "otherOut",
  walk: "walk",
  hitByPitch: "hitByPitch",
  error: "error",
  sacrifice: "sacrifice",
  fieldersChoice: "fieldersChoice",
  interference: "interference",
};

const POSITION_FROM_NOTATION: Record<string, FieldingPosition> = {
  投: "pitcher",
  捕: "catcher",
  一: "first",
  二: "second",
  三: "third",
  遊: "short",
  左: "left",
  中: "center",
  右: "right",
};

function migrateTeam(team: LegacyGame["teams"]["away"]): GameConfig["teams"]["away"] {
  return {
    name: team.name,
    players: team.players.map((player) => ({
      id: player.id,
      name: player.name,
      order: player.order,
      ...(player.position == null ? {} : { position: player.position }),
    })),
    ...(team.startingPitcherId === undefined
      ? {}
      : { startingPitcherId: team.startingPitcherId }),
    ...(team.startingPitcherName === undefined
      ? {}
      : { startingPitcherName: team.startingPitcherName }),
  };
}

function parseBattedBall(
  detail: string | undefined,
  result: AtBatResult
): BattedBall | undefined {
  const normalized = detail?.trim();
  if (!normalized) return undefined;
  const match = normalized.match(/^([投捕一二三遊左中右])/);
  if (!match) return undefined;
  const position = POSITION_FROM_NOTATION[match[1]];
  if (!position) return undefined;

  if (
    result === "groundOut" ||
    result === "fieldersChoice" ||
    result === "error" ||
    result === "sacrifice" ||
    result === "otherOut"
  ) {
    return { position, type: normalized.includes("犠") ? "bunt" : "ground" };
  }
  if (result === "flyOut" || result === "sacrificeFly") {
    return { position, type: "fly" };
  }
  if (
    result === "single" ||
    result === "double" ||
    result === "triple" ||
    result === "homerun"
  ) {
    return {
      position,
      type:
        position === "pitcher" ||
        position === "catcher" ||
        position === "first" ||
        position === "second" ||
        position === "third" ||
        position === "short"
          ? "ground"
          : "liner",
    };
  }
  return undefined;
}

function migrateAtBatResult(event: LegacyGameEvent): AtBatResult {
  if (!event.result) {
    throw new StoredGameFormatError(
      `legacy at-bat event ${event.id} has no result`
    );
  }
  const detail = event.resultDetail?.trim() ?? "";
  if (
    event.result === "otherOut" &&
    (detail === "内野安" || /^[投捕一二三遊]安/.test(detail))
  ) {
    return "single";
  }
  if (event.result === "sacrifice" && detail.includes("犠飛")) {
    return "sacrificeFly";
  }
  return LEGACY_RESULT_MAP[event.result];
}

function migrateEvent(event: LegacyGameEvent): GameEvent {
  const movements = event.runnerMovements.map((movement) => ({ ...movement }));

  if (event.type === "baseRunning") {
    if (!event.baseRunningType) {
      throw new StoredGameFormatError(
        `legacy base-running event ${event.id} has no type`
      );
    }
    const migrated: BaseRunningEvent = {
      id: event.id,
      kind: "baseRunning",
      type: event.baseRunningType,
      movements,
      ...(event.rbiCreditBatterId
        ? { rbiCreditBatterId: event.rbiCreditBatterId }
        : {}),
    };
    return migrated;
  }

  if (!event.batterId) {
    throw new StoredGameFormatError(
      `legacy at-bat event ${event.id} has no batter`
    );
  }
  const result = migrateAtBatResult(event);
  const battedBall = parseBattedBall(event.resultDetail, result);
  const note = event.resultDetail?.trim();
  const migrated: AtBatEvent = {
    id: event.id,
    kind: "atBat",
    batterId: event.batterId,
    result,
    ...(battedBall ? { battedBall } : {}),
    ...(note ? { note } : {}),
    movements,
  };
  return migrated;
}

export function migrateV1Game(game: LegacyGame): PersistedGameV2 {
  return {
    id: game.id,
    date: game.date,
    status: game.status,
    config: {
      regulationInnings:
        Number.isInteger(game.totalInnings) && game.totalInnings > 0
          ? game.totalInnings
          : 9,
      teams: {
        away: migrateTeam(game.teams.away),
        home: migrateTeam(game.teams.home),
      },
    },
    events: game.events.map(migrateEvent),
  };
}

export function createStorageEnvelope(
  game: PersistedGameV2
): StorageEnvelopeV2 {
  return { schemaVersion: SCHEMA_VERSION, game };
}

export function serializeStoredGame(game: PersistedGameV2): string {
  return JSON.stringify(createStorageEnvelope(game));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isV2Envelope(value: unknown): value is StorageEnvelopeV2 {
  return (
    isRecord(value) &&
    value.schemaVersion === SCHEMA_VERSION &&
    isRecord(value.game) &&
    isRecord(value.game.config) &&
    Array.isArray(value.game.events)
  );
}

function isLegacyGame(value: unknown): value is LegacyGame {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.totalInnings === "number" &&
    isRecord(value.teams) &&
    Array.isArray(value.events)
  );
}

export function parseStoredGame(serialized: string): PersistedGameV2 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new StoredGameFormatError("stored game is not valid JSON");
  }

  if (isV2Envelope(parsed)) return parsed.game;
  if (isLegacyGame(parsed)) return migrateV1Game(parsed);

  if (isRecord(parsed) && "schemaVersion" in parsed) {
    throw new StoredGameFormatError(
      `unsupported schema version: ${String(parsed.schemaVersion)}`
    );
  }
  throw new StoredGameFormatError("stored value is not a supported game");
}

export function createGameStorage(
  storage: StorageLike,
  key = DEFAULT_GAME_STORAGE_KEY
): GameStorage {
  return {
    load() {
      const serialized = storage.getItem(key);
      if (serialized === null) return null;
      try {
        return parseStoredGame(serialized);
      } catch {
        storage.removeItem(key);
        return null;
      }
    },
    save(game) {
      storage.setItem(key, serializeStoredGame(game));
    },
    clear() {
      storage.removeItem(key);
    },
  };
}

export function createBrowserGameStorage(
  key = DEFAULT_GAME_STORAGE_KEY
): GameStorage {
  if (typeof window === "undefined") {
    throw new Error("localStorage is unavailable outside the browser");
  }
  return createGameStorage(window.localStorage, key);
}
