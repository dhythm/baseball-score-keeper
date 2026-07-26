import type { RunnerDestination, RunnerMovement } from "../domain/types";

export function getSafeRunnerDestinations(
  from: RunnerMovement["from"]
): Exclude<RunnerDestination, "out">[] {
  switch (from) {
    case "batter":
    case "first":
      return ["first", "second", "third", "home"];
    case "second":
      return ["second", "third", "home"];
    case "third":
      return ["third", "home"];
  }
}

export function getConventionalAdvanceDestination(
  from: Exclude<RunnerMovement["from"], "batter">
): Exclude<RunnerDestination, "out"> {
  if (from === "first") return "second";
  if (from === "second") return "third";
  return "home";
}
