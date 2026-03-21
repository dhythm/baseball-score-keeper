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
  | "strikeout"
  | "doublePlay"
  | "otherOut"
  | "walk"
  | "hitByPitch"
  | "error"
  | "sacrifice"
  | "fieldersChoice"
  | "interference";

export type BaseRunningType =
  | "steal"
  | "caughtStealing"
  | "wildPitch"
  | "passedBall"
  | "pickOff"
  | "balk";

export interface Player {
  id: string;
  name: string;
  order: number;
}

export interface Team {
  name: string;
  players: Player[];
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
  doublePlay: "併殺打",
  otherOut: "その他アウト",
  walk: "フォアボール",
  hitByPitch: "デッドボール",
  error: "エラー",
  sacrifice: "犠打",
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
