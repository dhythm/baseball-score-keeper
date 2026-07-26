import type { AtBatResult, FieldingPosition } from "./types";

export const RESULT_LABELS: Record<AtBatResult, string> = {
  single: "シングルヒット",
  double: "ツーベースヒット",
  triple: "スリーベースヒット",
  homerun: "ホームラン",
  groundOut: "ゴロアウト",
  flyOut: "フライアウト",
  strikeout: "三振",
  strikeoutSwinging: "空振り三振",
  strikeoutLooking: "見逃し三振",
  uncaughtThirdStrike: "振り逃げ",
  doublePlay: "併殺打",
  otherOut: "その他アウト",
  walk: "フォアボール",
  hitByPitch: "デッドボール",
  error: "エラー",
  sacrifice: "犠打",
  sacrificeFly: "犠牲フライ",
  fieldersChoice: "フィルダースチョイス",
  interference: "打撃妨害",
};

export const FIELDING_POSITION_LABELS: Record<FieldingPosition, string> = {
  pitcher: "投手 (P)",
  catcher: "捕手 (C)",
  first: "一塁 (1B)",
  second: "二塁 (2B)",
  third: "三塁 (3B)",
  short: "遊撃 (SS)",
  left: "左翼 (LF)",
  center: "中堅 (CF)",
  right: "右翼 (RF)",
  dh: "DH",
};

export const FIELDING_POSITIONS: FieldingPosition[] = [
  "pitcher",
  "catcher",
  "first",
  "second",
  "third",
  "short",
  "left",
  "center",
  "right",
  "dh",
];
