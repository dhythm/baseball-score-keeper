import { describe, expect, it } from "vitest";

import type { Game as LegacyGame, GameEvent as LegacyEvent } from "../types";
import type { PersistedGameV2 } from "./local-storage";
import {
  DEFAULT_GAME_STORAGE_KEY,
  SCHEMA_VERSION,
  createGameStorage,
  createStorageEnvelope,
  migrateV1Game,
  parseStoredGame,
  serializeStoredGame,
} from "./local-storage";

function legacyEvent(
  overrides: Partial<LegacyEvent> & Pick<LegacyEvent, "id">
): LegacyEvent {
  const { id, ...eventOverrides } = overrides;
  return {
    id,
    type: "atBat",
    inning: 9,
    half: "bottom",
    team: "home",
    batterId: "home-1",
    result: "single",
    runnerMovements: [],
    outsInPlay: 0,
    runsScored: 99,
    timestamp: "2025-03-21T12:00:00.000Z",
    ...eventOverrides,
  };
}

function legacyGame(events: LegacyEvent[]): LegacyGame {
  return {
    id: "legacy-game",
    date: "2025-03-21T12:00:00.000Z",
    totalInnings: 7,
    status: "live",
    teams: {
      away: {
        name: "Away",
        players: [{ id: "away-1", name: "Away 1", order: 1 }],
        startingPitcherId: "away-1",
        startingPitcherName: "Away 1",
      },
      home: {
        name: "Home",
        players: [{ id: "home-1", name: "Home 1", order: 1 }],
        startingPitcherId: "home-1",
        startingPitcherName: "Home 1",
      },
    },
    events,
    currentState: {
      inning: 12,
      half: "top",
      outs: 2,
      runners: { first: "home-1", second: null, third: null },
      currentBatterIndex: { away: 0, home: 0 },
    },
  };
}

describe("v2 storage envelope", () => {
  it("serializes schemaVersion 2 around input-only game data", () => {
    const game: PersistedGameV2 = {
      id: "game",
      date: "2025-03-21",
      status: "live",
      config: {
        regulationInnings: 7,
        teams: {
          away: { name: "Away", players: [] },
          home: { name: "Home", players: [] },
        },
      },
      events: [],
    };

    expect(createStorageEnvelope(game)).toEqual({
      schemaVersion: SCHEMA_VERSION,
      game,
    });
    expect(parseStoredGame(serializeStoredGame(game))).toEqual(game);
  });
});

describe("v1 migration", () => {
  it("drops frozen placement and totals, retaining only event input", () => {
    const migrated = migrateV1Game(
      legacyGame([
        legacyEvent({
          id: "single",
          inning: 9,
          half: "bottom",
          team: "home",
          outsInPlay: 2,
          runsScored: 99,
        }),
      ])
    );

    expect(migrated.config.regulationInnings).toBe(7);
    expect(migrated.config.teams.away).toEqual({
      name: "Away",
      players: [{ id: "away-1", name: "Away 1", order: 1 }],
      startingPitcherId: "away-1",
      startingPitcherName: "Away 1",
    });
    expect(migrated.events[0]).toEqual({
      id: "single",
      kind: "atBat",
      batterId: "home-1",
      result: "single",
      movements: [],
    });
    expect(migrated.events[0]).not.toHaveProperty("inning");
    expect(migrated.events[0]).not.toHaveProperty("half");
    expect(migrated.events[0]).not.toHaveProperty("team");
    expect(migrated.events[0]).not.toHaveProperty("runsScored");
    expect(migrated.events[0]).not.toHaveProperty("outsInPlay");
    expect(migrated).not.toHaveProperty("currentState");
  });

  it("maps legacy strikeout to the explicit swinging result", () => {
    const migrated = migrateV1Game(
      legacyGame([
        legacyEvent({
          id: "strikeout",
          result: "strikeout",
        }),
      ])
    );

    expect(migrated.events[0]).toMatchObject({
      kind: "atBat",
      result: "strikeoutSwinging",
    });
  });

  it("represents a double play as an ordinary out result and preserves every out movement", () => {
    const movements = [
      {
        playerId: "home-1",
        from: "batter" as const,
        to: "out" as const,
        isRBI: false,
      },
      {
        playerId: "home-2",
        from: "first" as const,
        to: "out" as const,
        isRBI: false,
      },
    ];
    const migrated = migrateV1Game(
      legacyGame([
        legacyEvent({
          id: "double-play",
          result: "doublePlay",
          resultDetail: "遊併",
          runnerMovements: movements,
          outsInPlay: 2,
        }),
      ])
    );

    expect(migrated.events[0]).toMatchObject({
      kind: "atBat",
      result: "otherOut",
      note: "遊併",
      movements,
    });
  });

  it("corrects the legacy 内野安 misclassification and structures its direction", () => {
    const migrated = migrateV1Game(
      legacyGame([
        legacyEvent({
          id: "infield-hit",
          result: "otherOut",
          resultDetail: "遊安",
          runnerMovements: [
            {
              playerId: "home-1",
              from: "batter",
              to: "first",
              isRBI: false,
            },
          ],
        }),
      ])
    );

    expect(migrated.events[0]).toMatchObject({
      kind: "atBat",
      result: "single",
      battedBall: { position: "short", type: "ground" },
    });

    const dummyNotation = migrateV1Game(
      legacyGame([
        legacyEvent({
          id: "dummy-infield-hit",
          result: "otherOut",
          resultDetail: "内野安",
        }),
      ])
    );
    expect(dummyNotation.events[0]).toMatchObject({
      kind: "atBat",
      result: "single",
      note: "内野安",
    });
  });

  it("migrates base-running events without derived fields", () => {
    const migrated = migrateV1Game(
      legacyGame([
        legacyEvent({
          id: "steal",
          type: "baseRunning",
          batterId: undefined,
          result: undefined,
          baseRunningType: "steal",
          rbiCreditBatterId: "home-1",
          runnerMovements: [
            {
              playerId: "home-1",
              from: "first",
              to: "second",
              isRBI: false,
            },
          ],
        }),
      ])
    );

    expect(migrated.events[0]).toEqual({
      id: "steal",
      kind: "baseRunning",
      type: "steal",
      movements: [
        {
          playerId: "home-1",
          from: "first",
          to: "second",
          isRBI: false,
        },
      ],
      rbiCreditBatterId: "home-1",
    });
  });
});

describe("localStorage adapter", () => {
  it("saves v2, loads v1 through migration, and clears corrupt data", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    const adapter = createGameStorage(storage);
    const migrated = migrateV1Game(legacyGame([]));

    adapter.save(migrated);
    expect(
      JSON.parse(values.get(DEFAULT_GAME_STORAGE_KEY) ?? "{}")
    ).toHaveProperty("schemaVersion", 2);
    expect(adapter.load()).toEqual(migrated);

    values.set(DEFAULT_GAME_STORAGE_KEY, JSON.stringify(legacyGame([])));
    expect(adapter.load()).toEqual(migrated);

    values.set(DEFAULT_GAME_STORAGE_KEY, "{broken");
    expect(adapter.load()).toBeNull();
    expect(values.has(DEFAULT_GAME_STORAGE_KEY)).toBe(false);
  });

  it("rejects unsupported schema versions", () => {
    expect(() =>
      parseStoredGame(JSON.stringify({ schemaVersion: 3, game: {} }))
    ).toThrow("unsupported schema version: 3");
  });

  it("rejects a malformed v2 payload before replay can consume it", () => {
    expect(() =>
      parseStoredGame(
        JSON.stringify({
          schemaVersion: 2,
          game: {
            id: "broken",
            date: "2026-01-01",
            status: "live",
            config: { regulationInnings: 7 },
            events: [],
          },
        })
      )
    ).toThrow("malformed schema version 2 game");
  });
});
