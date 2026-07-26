import type {
  Base,
  GameConfig,
  GameEvent,
  ReplayResult,
  RunnerMovement,
  Snapshot,
  TeamSide,
  TimelineEntry,
  Violation,
} from "./types";

const EMPTY_RUNNERS = {
  first: null,
  second: null,
  third: null,
} as const;

const BASE_NUMBER: Record<Base, number> = {
  first: 1,
  second: 2,
  third: 3,
};

function initialSnapshot(): Snapshot {
  return {
    inning: 1,
    half: "top",
    outs: 0,
    runners: { ...EMPTY_RUNNERS },
    currentBatterIndex: { away: 0, home: 0 },
    score: { away: 0, home: 0 },
    gameStatus: "live",
  };
}

function copySnapshot(snapshot: Snapshot): Snapshot {
  return {
    ...snapshot,
    runners: { ...snapshot.runners },
    currentBatterIndex: { ...snapshot.currentBatterIndex },
    score: { ...snapshot.score },
  };
}

function offense(snapshot: Snapshot): TeamSide {
  return snapshot.half === "top" ? "away" : "home";
}

function violation(
  event: GameEvent,
  eventIndex: number,
  code: Violation["code"],
  severity: Violation["severity"],
  message: string
): Violation {
  return { code, severity, message, eventId: event.id, eventIndex };
}

function validateConfig(config: GameConfig): Violation[] {
  const violations: Violation[] = [];

  if (!Number.isInteger(config.regulationInnings) || config.regulationInnings < 1) {
    violations.push({
      code: "INVALID_REGULATION_INNINGS",
      severity: "error",
      message: "regulationInnings must be a positive integer",
    });
  }

  const seenPlayerIds = new Set<string>();
  for (const side of ["away", "home"] as const) {
    const lineup = config.teams[side].players;
    if (lineup.length === 0) {
      violations.push({
        code: "EMPTY_LINEUP",
        severity: "error",
        message: `${side} lineup must contain at least one player`,
      });
    }
    for (const player of lineup) {
      if (seenPlayerIds.has(player.id)) {
        violations.push({
          code: "DUPLICATE_PLAYER_ID",
          severity: "error",
          message: `player id ${player.id} is not unique`,
        });
      }
      seenPlayerIds.add(player.id);
    }
  }

  return violations;
}

function validateEvent(
  event: GameEvent,
  eventIndex: number,
  snapshot: Snapshot,
  config: GameConfig,
  allPlayerIds: ReadonlySet<string>
): Violation[] {
  const violations: Violation[] = [];
  const team = offense(snapshot);
  const lineup = config.teams[team].players;
  const offensivePlayerIds = new Set(lineup.map((player) => player.id));

  if (event.kind === "atBat") {
    if (!allPlayerIds.has(event.batterId)) {
      violations.push(
        violation(
          event,
          eventIndex,
          "UNKNOWN_PLAYER",
          "error",
          `unknown batter ${event.batterId}`
        )
      );
    } else if (!offensivePlayerIds.has(event.batterId)) {
      violations.push(
        violation(
          event,
          eventIndex,
          "PLAYER_NOT_ON_OFFENSE",
          "error",
          `batter ${event.batterId} is not on the offensive team`
        )
      );
    }

    const expectedBatter = lineup[snapshot.currentBatterIndex[team]];
    if (expectedBatter && event.batterId !== expectedBatter.id) {
      violations.push(
        violation(
          event,
          eventIndex,
          "WRONG_BATTER",
          "warning",
          `expected batter ${expectedBatter.id}, received ${event.batterId}`
        )
      );
    }
  } else if (event.rbiCreditBatterId) {
    if (!allPlayerIds.has(event.rbiCreditBatterId)) {
      violations.push(
        violation(
          event,
          eventIndex,
          "UNKNOWN_PLAYER",
          "error",
          `unknown RBI credit batter ${event.rbiCreditBatterId}`
        )
      );
    } else if (!offensivePlayerIds.has(event.rbiCreditBatterId)) {
      violations.push(
        violation(
          event,
          eventIndex,
          "PLAYER_NOT_ON_OFFENSE",
          "error",
          `RBI credit batter ${event.rbiCreditBatterId} is not on the offensive team`
        )
      );
    }
  }

  const seenSources = new Set<string>();
  const seenPlayers = new Set<string>();
  const seenDestinations = new Set<Base>();
  const vacatedBases = new Set<Base>();

  for (const movement of event.movements) {
    if (movement.from !== "batter") vacatedBases.add(movement.from);
  }

  for (const movement of event.movements) {
    if (seenSources.has(movement.from)) {
      violations.push(
        violation(
          event,
          eventIndex,
          "DUPLICATE_MOVEMENT_SOURCE",
          "error",
          `movement source ${movement.from} appears more than once`
        )
      );
    }
    seenSources.add(movement.from);

    if (seenPlayers.has(movement.playerId)) {
      violations.push(
        violation(
          event,
          eventIndex,
          "DUPLICATE_RUNNER_MOVEMENT",
          "error",
          `runner ${movement.playerId} appears more than once`
        )
      );
    }
    seenPlayers.add(movement.playerId);

    if (!allPlayerIds.has(movement.playerId)) {
      violations.push(
        violation(
          event,
          eventIndex,
          "UNKNOWN_PLAYER",
          "error",
          `unknown runner ${movement.playerId}`
        )
      );
    } else if (!offensivePlayerIds.has(movement.playerId)) {
      violations.push(
        violation(
          event,
          eventIndex,
          "PLAYER_NOT_ON_OFFENSE",
          "error",
          `runner ${movement.playerId} is not on the offensive team`
        )
      );
    }

    if (movement.from === "batter") {
      if (event.kind !== "atBat" || movement.playerId !== event.batterId) {
        violations.push(
          violation(
            event,
            eventIndex,
            "BATTER_SOURCE_NOT_ALLOWED",
            "error",
            "batter movement must belong to the at-bat batter"
          )
        );
      }
    } else if (snapshot.runners[movement.from] !== movement.playerId) {
      violations.push(
        violation(
          event,
          eventIndex,
          "SOURCE_RUNNER_MISMATCH",
          "error",
          `${movement.playerId} does not occupy ${movement.from}`
        )
      );
    }

    if (movement.to !== "home" && movement.to !== "out") {
      if (seenDestinations.has(movement.to)) {
        violations.push(
          violation(
            event,
            eventIndex,
            "DUPLICATE_DESTINATION",
            "error",
            `more than one runner would occupy ${movement.to}`
          )
        );
      }
      seenDestinations.add(movement.to);

      const occupant = snapshot.runners[movement.to];
      if (occupant !== null && !vacatedBases.has(movement.to)) {
        violations.push(
          violation(
            event,
            eventIndex,
            "DESTINATION_OCCUPIED",
            "error",
            `${movement.to} is occupied by ${occupant}`
          )
        );
      }

      if (
        movement.from !== "batter" &&
        BASE_NUMBER[movement.to] < BASE_NUMBER[movement.from]
      ) {
        violations.push(
          violation(
            event,
            eventIndex,
            "BACKWARD_MOVEMENT",
            "error",
            `runner cannot move backward from ${movement.from} to ${movement.to}`
          )
        );
      }
    }

    if (movement.isRBI && movement.to !== "home") {
      violations.push(
        violation(
          event,
          eventIndex,
          "INVALID_RBI",
          "error",
          "only a scoring movement can be credited with an RBI"
        )
      );
    }
  }

  return violations;
}

function rejectedEntry(
  event: GameEvent,
  index: number,
  before: Snapshot
): TimelineEntry {
  return {
    event,
    index,
    inning: before.inning,
    half: before.half,
    team: offense(before),
    outsBefore: before.outs,
    outsAfter: before.outs,
    outsRecorded: 0,
    runsScored: 0,
    scoringMovements: [],
    applied: false,
    before,
    after: copySnapshot(before),
  };
}

function finishIfNeeded(
  snapshot: Snapshot,
  config: GameConfig,
  completedHalf: "top" | "bottom" | null
): void {
  if (
    snapshot.inning >= config.regulationInnings &&
    snapshot.half === "bottom" &&
    completedHalf === null &&
    snapshot.score.home > snapshot.score.away
  ) {
    snapshot.gameStatus = "finished";
    snapshot.gameEndReason = "walkOff";
    return;
  }

  if (
    completedHalf === "top" &&
    snapshot.inning >= config.regulationInnings &&
    snapshot.score.home > snapshot.score.away
  ) {
    snapshot.gameStatus = "finished";
    snapshot.gameEndReason = "homeAheadAfterTop";
    return;
  }

  if (
    completedHalf === "bottom" &&
    snapshot.inning > config.regulationInnings &&
    snapshot.score.home !== snapshot.score.away
  ) {
    snapshot.gameStatus = "finished";
    snapshot.gameEndReason = "completedHalf";
  }
}

export function replay(
  events: readonly GameEvent[],
  config: GameConfig
): ReplayResult {
  let snapshot = initialSnapshot();
  const timeline: TimelineEntry[] = [];
  const violations = validateConfig(config);
  const seenEventIds = new Set<string>();
  const allPlayerIds = new Set(
    [...config.teams.away.players, ...config.teams.home.players].map(
      (player) => player.id
    )
  );

  for (const [index, event] of events.entries()) {
    const before = copySnapshot(snapshot);
    const eventViolations: Violation[] = [];

    if (seenEventIds.has(event.id)) {
      eventViolations.push(
        violation(
          event,
          index,
          "DUPLICATE_EVENT_ID",
          "error",
          `event id ${event.id} is not unique`
        )
      );
    }
    seenEventIds.add(event.id);

    if (snapshot.gameStatus === "finished") {
      eventViolations.push(
        violation(
          event,
          index,
          "GAME_ALREADY_FINISHED",
          "error",
          "events after game end are not applied"
        )
      );
    } else {
      eventViolations.push(
        ...validateEvent(event, index, snapshot, config, allPlayerIds)
      );
    }
    violations.push(...eventViolations);

    if (
      violations.some(
        (item) => item.eventId === undefined && item.severity === "error"
      ) ||
      eventViolations.some((item) => item.severity === "error")
    ) {
      timeline.push(rejectedEntry(event, index, before));
      continue;
    }

    const team = offense(snapshot);
    const nextRunners = { ...snapshot.runners };
    for (const movement of event.movements) {
      if (movement.from !== "batter") nextRunners[movement.from] = null;
    }

    let outsRecorded = 0;
    const scoringMovements: RunnerMovement[] = [];
    const outsNeededToEndHalf = 3 - snapshot.outs;
    const halfEndingOut = event.movements.filter(
      (movement) => movement.to === "out"
    )[outsNeededToEndHalf - 1];
    const batterMakesHalfEndingOut =
      event.kind === "atBat" &&
      halfEndingOut?.from === "batter" &&
      halfEndingOut.playerId === event.batterId;

    for (const movement of event.movements) {
      if (movement.to === "out") {
        if (snapshot.outs + outsRecorded < 3) outsRecorded += 1;
      } else if (movement.to === "home") {
        if (snapshot.outs + outsRecorded < 3) {
          scoringMovements.push(movement);
        }
      } else {
        nextRunners[movement.to] = movement.playerId;
      }
    }
    if (batterMakesHalfEndingOut) {
      scoringMovements.length = 0;
    }

    snapshot.runners = nextRunners;
    snapshot.outs = Math.min(3, snapshot.outs + outsRecorded);
    snapshot.score[team] += scoringMovements.length;

    if (event.kind === "atBat") {
      const lineupLength = config.teams[team].players.length;
      snapshot.currentBatterIndex[team] =
        (snapshot.currentBatterIndex[team] + 1) % lineupLength;
    }

    let completedHalf: "top" | "bottom" | null = null;
    const outsAfter = snapshot.outs;
    if (snapshot.outs === 3) {
      completedHalf = snapshot.half;
      snapshot.outs = 0;
      snapshot.runners = { ...EMPTY_RUNNERS };
      if (snapshot.half === "top") {
        snapshot.half = "bottom";
      } else {
        snapshot.half = "top";
        snapshot.inning += 1;
      }
    }

    finishIfNeeded(snapshot, config, completedHalf);
    const after = copySnapshot(snapshot);
    timeline.push({
      event,
      index,
      inning: before.inning,
      half: before.half,
      team,
      outsBefore: before.outs,
      outsAfter,
      outsRecorded,
      runsScored: scoringMovements.length,
      scoringMovements,
      applied: true,
      before,
      after,
    });
  }

  return { snapshot, timeline, violations };
}

export function isGameOver(snapshot: Snapshot): boolean {
  return snapshot.gameStatus === "finished";
}
