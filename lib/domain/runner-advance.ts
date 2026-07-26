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
