import type { Violation } from "../domain/types";

const VIOLATION_MESSAGES: Partial<Record<Violation["code"], string>> = {
  GAME_ALREADY_FINISHED: "試合終了後のため記録できません。",
  WRONG_BATTER: "現在の打者と選択した打者が一致していません。",
  UNKNOWN_PLAYER: "登録されていない選手が含まれています。",
  PLAYER_NOT_ON_OFFENSE: "攻撃中ではない選手が含まれています。",
  DUPLICATE_MOVEMENT_SOURCE: "同じ塁から複数の走者が移動しています。",
  DUPLICATE_RUNNER_MOVEMENT: "同じ走者が重複して指定されています。",
  SOURCE_RUNNER_MISMATCH: "指定した塁にその走者はいません。",
  BATTER_SOURCE_NOT_ALLOWED: "打者の進塁指定が正しくありません。",
  DESTINATION_OCCUPIED: "進塁先の塁が空いていません。",
  DUPLICATE_DESTINATION: "複数の走者が同じ塁へ進もうとしています。",
  BACKWARD_MOVEMENT: "走者を後ろの塁へ戻すことはできません。",
  INVALID_RBI: "ホームイン以外には打点を設定できません。",
  OUTS_EXCEED_HALF_INNING:
    "このプレーでは3アウトを超えます。アウト数を確認してください。",
  EMPTY_GAME_NOTE: "メモを入力してください。",
  GAME_NOTE_TOO_LONG: "メモは120文字以内で入力してください。",
  SUBSTITUTION_PLAYER_NOT_ON_TEAM: "交代選手がチームに登録されていません。",
  SUBSTITUTION_OUT_PLAYER_NOT_ACTIVE: "退く選手は現在出場していません。",
  SUBSTITUTION_IN_PLAYER_ALREADY_ACTIVE: "入る選手はすでに出場しています。",
  SUBSTITUTION_RUNNER_NOT_FOUND: "代走対象の走者が塁上にいません。",
};

export function formatViolationMessage(violation: Violation): string {
  return VIOLATION_MESSAGES[violation.code] ?? "入力内容を確認してください。";
}
