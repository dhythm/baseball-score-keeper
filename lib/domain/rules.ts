import type {
  AtBatResult,
  Base,
  RunnerMovement,
  Runners,
  Violation,
} from "./types";

function move(
  playerId: string,
  from: RunnerMovement["from"],
  to: RunnerMovement["to"],
  isRBI = false
): RunnerMovement {
  return { playerId, from, to, isRBI };
}

/**
 * Proposes forced advancement after the batter is awarded first base.
 * Runners who are not forced keep their bases and are omitted.
 */
function getForcedAdvanceMovements(
  runners: Runners,
  batterId: string,
  isRBI: boolean
): RunnerMovement[] {
  const movements: RunnerMovement[] = [];

  if (runners.first && runners.second && runners.third) {
    movements.push(move(runners.third, "third", "home", isRBI));
  }
  if (runners.first && runners.second) {
    movements.push(move(runners.second, "second", "third"));
  }
  if (runners.first) {
    movements.push(move(runners.first, "first", "second"));
  }
  movements.push(move(batterId, "batter", "first"));

  return movements;
}

/**
 * Returns the conventional default runner movements for an at-bat result.
 * These are proposals for the scoring UI; replay remains responsible for
 * applying them and enforcing three-out rules.
 */
export function getDefaultMovements(
  result: AtBatResult,
  runners: Runners,
  batterId: string,
  currentOuts = 0
): RunnerMovement[] {
  switch (result) {
    case "homerun": {
      const movements: RunnerMovement[] = [];
      if (runners.third) {
        movements.push(move(runners.third, "third", "home", true));
      }
      if (runners.second) {
        movements.push(move(runners.second, "second", "home", true));
      }
      if (runners.first) {
        movements.push(move(runners.first, "first", "home", true));
      }
      movements.push(move(batterId, "batter", "home", true));
      return movements;
    }

    case "triple": {
      const movements: RunnerMovement[] = [];
      if (runners.third) {
        movements.push(move(runners.third, "third", "home", true));
      }
      if (runners.second) {
        movements.push(move(runners.second, "second", "home", true));
      }
      if (runners.first) {
        movements.push(move(runners.first, "first", "home", true));
      }
      movements.push(move(batterId, "batter", "third"));
      return movements;
    }

    case "double": {
      const movements: RunnerMovement[] = [];
      if (runners.third) {
        movements.push(move(runners.third, "third", "home", true));
      }
      if (runners.second) {
        movements.push(move(runners.second, "second", "home", true));
      }
      if (runners.first) {
        movements.push(move(runners.first, "first", "third"));
      }
      movements.push(move(batterId, "batter", "second"));
      return movements;
    }

    case "single":
    case "error": {
      const movements: RunnerMovement[] = [];
      if (runners.third) {
        movements.push(
          move(runners.third, "third", "home", result === "single")
        );
      }
      if (runners.second) {
        movements.push(move(runners.second, "second", "third"));
      }
      if (runners.first) {
        movements.push(move(runners.first, "first", "second"));
      }
      movements.push(move(batterId, "batter", "first"));
      return movements;
    }

    case "walk":
    case "hitByPitch":
      return getForcedAdvanceMovements(runners, batterId, true);

    case "interference":
      return getForcedAdvanceMovements(runners, batterId, true);

    case "uncaughtThirdStrike":
      if (!runners.first) {
        return [move(batterId, "batter", "first")];
      }
      if (currentOuts === 2) {
        return getForcedAdvanceMovements(runners, batterId, false);
      }
      return [move(batterId, "batter", "out")];

    case "sacrifice": {
      const movements: RunnerMovement[] = [];
      if (runners.third) {
        movements.push(move(runners.third, "third", "home", true));
      }
      if (runners.second) {
        movements.push(move(runners.second, "second", "third"));
      }
      if (runners.first) {
        movements.push(move(runners.first, "first", "second"));
      }
      movements.push(move(batterId, "batter", "out"));
      return movements;
    }

    case "sacrificeFly": {
      const movements: RunnerMovement[] = [];
      if (runners.third) {
        movements.push(move(runners.third, "third", "home", true));
      }
      movements.push(move(batterId, "batter", "out"));
      return movements;
    }

    case "fieldersChoice": {
      const movements: RunnerMovement[] = [];
      if (runners.first) {
        movements.push(move(runners.first, "first", "out"));
      }
      movements.push(move(batterId, "batter", "first"));
      return movements;
    }

    case "groundOut":
    case "flyOut":
    case "strikeoutSwinging":
    case "strikeoutLooking":
    case "otherOut":
      return [move(batterId, "batter", "out")];
  }
}

const baseOrder: Record<Base, number> = {
  first: 1,
  second: 2,
  third: 3,
};

/**
 * Validates structural invariants without applying movements.
 *
 * The function intentionally does not require every existing runner to have a
 * movement: omitted runners stay on their current bases.
 */
export function validateMovementShape(
  runners: Runners,
  batterId: string,
  movements: readonly RunnerMovement[]
): Violation[] {
  const violations: Violation[] = [];
  const sourceIndexes = new Map<RunnerMovement["from"], number>();
  const playerIndexes = new Map<string, number>();
  const destinationIndexes = new Map<Base, number>();
  const vacatedBases = new Set<Base>();

  for (const movement of movements) {
    if (movement.from !== "batter") {
      vacatedBases.add(movement.from);
    }
  }

  movements.forEach((movement, movementIndex) => {
    const expectedPlayer =
      movement.from === "batter" ? batterId : runners[movement.from];
    if (expectedPlayer !== movement.playerId) {
      violations.push({
        code: "SOURCE_RUNNER_MISMATCH",
        severity: "error",
        message: `${movement.playerId} is not the runner at ${movement.from}`,
      });
    }

    const previousSourceIndex = sourceIndexes.get(movement.from);
    if (previousSourceIndex !== undefined) {
      violations.push({
        code: "DUPLICATE_MOVEMENT_SOURCE",
        severity: "error",
        message: `${movement.from} is used by more than one movement`,
      });
    } else {
      sourceIndexes.set(movement.from, movementIndex);
    }

    const previousPlayerIndex = playerIndexes.get(movement.playerId);
    if (previousPlayerIndex !== undefined) {
      violations.push({
        code: "DUPLICATE_RUNNER_MOVEMENT",
        severity: "error",
        message: `${movement.playerId} has more than one movement`,
      });
    } else {
      playerIndexes.set(movement.playerId, movementIndex);
    }

    if (movement.to !== "home" && movement.to !== "out") {
      const previousDestinationIndex = destinationIndexes.get(movement.to);
      if (previousDestinationIndex !== undefined) {
        violations.push({
          code: "DUPLICATE_DESTINATION",
          severity: "error",
          message: `${movement.to} has more than one arriving runner`,
        });
      } else {
        destinationIndexes.set(movement.to, movementIndex);
      }

      const occupant = runners[movement.to];
      if (occupant && !vacatedBases.has(movement.to)) {
        violations.push({
          code: "DESTINATION_OCCUPIED",
          severity: "error",
          message: `${movement.to} is occupied by a runner who does not move`,
        });
      }

      const fromOrder =
        movement.from === "batter" ? 0 : baseOrder[movement.from];
      if (baseOrder[movement.to] < fromOrder) {
        violations.push({
          code: "BACKWARD_MOVEMENT",
          severity: "error",
          message: `${movement.playerId} moves backward`,
        });
      }
    }

    if (movement.isRBI && movement.to !== "home") {
      violations.push({
        code: "INVALID_RBI",
        severity: "error",
        message: "RBI credit requires a movement to home",
      });
    }
  });

  return violations;
}
