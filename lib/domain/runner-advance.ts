import type { AtBatResult, RunnerMovement } from "./types";

type SupportedAtBatResult = AtBatResult | "strikeout" | "doublePlay";

interface RunnerRbiState {
  playerId: string;
  from: RunnerMovement["from"];
  to: RunnerMovement["to"];
}

export function initializeRbiByPlayerId(
  result: SupportedAtBatResult,
  runnerStates: readonly RunnerRbiState[],
  initialMovements: readonly RunnerMovement[],
  getDefault: (
    result: SupportedAtBatResult,
    from: RunnerMovement["from"],
    to: RunnerMovement["to"]
  ) => boolean
): Record<string, boolean> {
  const rbi: Record<string, boolean> = {};
  for (const runner of runnerStates) {
    if (runner.to !== "home") continue;
    const initialMovement = initialMovements.find(
      (movement) =>
        movement.playerId === runner.playerId &&
        movement.from === runner.from &&
        movement.to === runner.to
    );
    rbi[runner.playerId] =
      initialMovement?.isRBI ?? getDefault(result, runner.from, runner.to);
  }
  return rbi;
}

/**
 * Evaluates outs and runs in chronological movement order.
 *
 * The array order is part of the scoring contract: on a tag third out, only
 * runners who reached home before that out score. A batter-runner or force
 * third out cancels every run from the play regardless of order.
 */
export function evaluateMovementOutcome({
  currentOuts,
  movements,
  batterId,
}: {
  currentOuts: number;
  movements: readonly RunnerMovement[];
  batterId?: string;
}): {
  outsRecorded: number;
  scoringMovements: RunnerMovement[];
} {
  const outsNeededToEndHalf = 3 - currentOuts;
  const halfEndingOut = movements.filter((movement) => movement.to === "out")[
    outsNeededToEndHalf - 1
  ];
  const batterMakesHalfEndingOut =
    halfEndingOut?.from === "batter" &&
    batterId !== undefined &&
    halfEndingOut.playerId === batterId;
  const forcePlayMakesHalfEndingOut = halfEndingOut?.outType === "force";
  let outsRecorded = 0;
  const scoringMovements: RunnerMovement[] = [];

  for (const movement of movements) {
    if (movement.to === "out") {
      if (currentOuts + outsRecorded < 3) outsRecorded += 1;
    } else if (movement.to === "home" && currentOuts + outsRecorded < 3) {
      scoringMovements.push(movement);
    }
  }

  if (batterMakesHalfEndingOut || forcePlayMakesHalfEndingOut) {
    scoringMovements.length = 0;
  }

  return { outsRecorded, scoringMovements };
}
