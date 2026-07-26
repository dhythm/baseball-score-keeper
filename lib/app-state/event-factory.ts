import type {
  AtBatEvent,
  AtBatResult as DomainAtBatResult,
  BaseRunningEvent,
  BaseRunningType,
  BattedBall,
  FieldingPosition,
  GameControlEvent,
  RunnerMovement,
  Runners,
  SubstitutionEvent,
  SubstitutionRole,
  TeamSide,
} from "../domain/types";
import type { AtBatResult as LegacyAtBatResult } from "../types";
import { getDefaultMovements } from "../domain/rules";

const positionByLabel: Record<string, FieldingPosition> = {
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

export function mapAtBatSelectionResult(
  result: LegacyAtBatResult,
  detail: string
): DomainAtBatResult {
  if (result === "strikeout") return "strikeoutSwinging";
  if (result === "doublePlay") return "otherOut";
  if (result === "sacrifice" && detail.includes("犠飛")) {
    return "sacrificeFly";
  }
  if (
    result === "otherOut" &&
    (detail === "内野安" || /^[投捕一二三遊]安/.test(detail))
  ) {
    return "single";
  }
  return result;
}

export function getDefaultMovementsForSelection(
  result: LegacyAtBatResult,
  detail: string | undefined,
  runners: Runners,
  batterId: string,
  currentOuts: number
): RunnerMovement[] {
  if (result === "doublePlay") {
    const movements: RunnerMovement[] = [
      { playerId: batterId, from: "batter", to: "out", isRBI: false },
    ];
    if (currentOuts < 2 && runners.first) {
      movements.push({
        playerId: runners.first,
        from: "first",
        to: "out",
        isRBI: false,
        outType: "force",
      });
    }
    return movements;
  }
  return getDefaultMovements(
    mapAtBatSelectionResult(result, detail?.trim() ?? ""),
    runners,
    batterId,
    currentOuts
  );
}

function parseBattedBall(
  result: DomainAtBatResult,
  detail: string
): BattedBall | undefined {
  const position = positionByLabel[detail[0]];
  if (!position) return undefined;
  if (result === "flyOut" || result === "sacrificeFly") {
    return { position, type: "fly" };
  }
  if (result === "sacrifice") return { position, type: "bunt" };
  if (
    result === "groundOut" ||
    result === "fieldersChoice" ||
    result === "error" ||
    result === "otherOut" ||
    result === "single"
  ) {
    return { position, type: "ground" };
  }
  if (
    result === "double" ||
    result === "triple" ||
    result === "homerun"
  ) {
    return { position, type: "liner" };
  }
  return undefined;
}

export function createAtBatEvent({
  id,
  batterId,
  result: legacyResult,
  detail,
  movements,
}: {
  id: string;
  batterId: string;
  result: LegacyAtBatResult;
  detail?: string;
  movements: RunnerMovement[];
}): AtBatEvent {
  const note = detail?.trim() ?? "";
  const result = mapAtBatSelectionResult(legacyResult, note);
  const battedBall = parseBattedBall(result, note);
  return {
    id,
    kind: "atBat",
    batterId,
    result,
    ...(note ? { note } : {}),
    ...(battedBall ? { battedBall } : {}),
    movements,
  };
}

export function createBaseRunningEvent({
  id,
  type,
  movements,
  rbiCreditBatterId,
}: {
  id: string;
  type: BaseRunningType;
  movements: RunnerMovement[];
  rbiCreditBatterId?: string;
}): BaseRunningEvent {
  return {
    id,
    kind: "baseRunning",
    type,
    movements,
    ...(rbiCreditBatterId ? { rbiCreditBatterId } : {}),
  };
}

export function createSubstitutionEvent({
  id,
  team,
  inPlayerId,
  outPlayerId,
  role,
}: {
  id: string;
  team: TeamSide;
  inPlayerId: string;
  outPlayerId: string;
  role: SubstitutionRole;
}): SubstitutionEvent {
  return {
    id,
    kind: "substitution",
    team,
    inPlayerId,
    outPlayerId,
    role,
  };
}

export function createGameControlEvent({
  id,
  reason,
}: {
  id: string;
  reason?: string;
}): GameControlEvent {
  return {
    id,
    kind: "gameControl",
    action: "endGame",
    ...(reason ? { reason } : {}),
  };
}
