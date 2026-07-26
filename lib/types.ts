export type GameStatus = "setup" | "live" | "finished";
export type Half = "top" | "bottom";
export type TeamSide = "away" | "home";
export type Base = "first" | "second" | "third";

export type AtBatResult =
  | "single"
  | "double"
  | "triple"
  | "homerun"
  | "groundOut"
  | "flyOut"
  /** Legacy saves; same play as strikeoutSwinging. */
  | "strikeout"
  | "strikeoutSwinging"
  | "strikeoutLooking"
  | "uncaughtThirdStrike"
  | "doublePlay"
  | "otherOut"
  | "walk"
  | "hitByPitch"
  | "error"
  | "sacrifice"
  | "sacrificeFly"
  | "fieldersChoice"
  | "interference";

export type BaseRunningType =
  | "steal"
  | "caughtStealing"
  | "wildPitch"
  | "passedBall"
  | "pickOff"
  | "balk";

/** Defensive position keys (English). */
export type FieldingPosition =
  | "pitcher"
  | "catcher"
  | "first"
  | "second"
  | "third"
  | "short"
  | "left"
  | "center"
  | "right"
  | "dh";

export interface Player {
  id: string;
  name: string;
  order: number;
  /** Null for legacy saved games before position was added. */
  position?: FieldingPosition | null;
}

export interface Team {
  name: string;
  players: Player[];
  /** Players available to enter after the game starts. */
  benchPlayers?: Player[];
  /** When a pitcher appears in the batting order, this matches that player’s id. */
  startingPitcherId?: string | null;
  /** Starting pitcher name. Required; if a pitcher is in the lineup, this stays in sync with that row. */
  startingPitcherName?: string;
}

export interface RunnerMovement {
  playerId: string;
  from: "batter" | Base;
  to: Base | "home" | "out";
  isRBI: boolean;
}

export interface GameEvent {
  id: string;
  type: "atBat" | "baseRunning";
  inning: number;
  half: Half;
  team: TeamSide;
  batterId?: string;
  result?: AtBatResult;
  resultDetail?: string;
  runnerMovements: RunnerMovement[];
  baseRunningType?: BaseRunningType;
  /** 走塁イベントで得点を打点として記録する打者（攻撃チームの選手 id） */
  rbiCreditBatterId?: string;
  outsInPlay: number;
  runsScored: number;
  timestamp: string;
}

export interface Runners {
  first: string | null;
  second: string | null;
  third: string | null;
}

export interface GameState {
  inning: number;
  half: Half;
  outs: number;
  runners: Runners;
  currentBatterIndex: { away: number; home: number };
}

export interface Game {
  id: string;
  date: string;
  totalInnings: number;
  status: GameStatus;
  teams: { away: Team; home: Team };
  events: GameEvent[];
  currentState: GameState;
}

export type ResultCategory = "hit" | "out" | "walk" | "error" | "other";

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

export const BASE_RUNNING_LABELS: Record<BaseRunningType, string> = {
  steal: "盗塁",
  caughtStealing: "盗塁死",
  wildPitch: "ワイルドピッチ",
  passedBall: "パスボール",
  pickOff: "牽制死",
  balk: "ボーク",
};

/** Default short text for inning cells (走塁・配球). Custom `resultDetail` overrides. */
export const BASE_RUNNING_SCOREBOOK_SHORT: Record<BaseRunningType, string> = {
  steal: "盗",
  caughtStealing: "盗死",
  wildPitch: "WP",
  passedBall: "PB",
  pickOff: "牽制死",
  balk: "ボーク",
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

/** One or two characters for scorebook lineup column (守備位置). */
export const FIELDING_POSITION_SCOREBOOK: Record<FieldingPosition, string> = {
  pitcher: "投",
  catcher: "捕",
  first: "一",
  second: "二",
  third: "三",
  short: "遊",
  left: "左",
  center: "中",
  right: "右",
  dh: "D",
};

/**
 * Short labels for inning cells (イニングごとの打席結果).
 * @see RESULT_LABELS for full names
 */
export const AT_BAT_SCOREBOOK_SHORT: Record<AtBatResult, string> = {
  single: "1",
  double: "2",
  triple: "3",
  homerun: "HR",
  groundOut: "ゴ",
  flyOut: "飛",
  strikeout: "空三振",
  strikeoutSwinging: "空三振",
  strikeoutLooking: "見三振",
  uncaughtThirdStrike: "振逃",
  doublePlay: "併",
  otherOut: "出",
  walk: "四球",
  hitByPitch: "死球",
  error: "E",
  sacrifice: "犠",
  sacrificeFly: "犠飛",
  fieldersChoice: "FC",
  interference: "妨",
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
