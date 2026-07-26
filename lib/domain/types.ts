export type TeamSide = "away" | "home";
export type Half = "top" | "bottom";
export type Base = "first" | "second" | "third";
export type RunnerOrigin = "batter" | Base;
export type RunnerDestination = Base | "home" | "out";

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

export type AtBatResult =
  | "single"
  | "double"
  | "triple"
  | "homerun"
  | "groundOut"
  | "flyOut"
  | "strikeoutSwinging"
  | "strikeoutLooking"
  | "otherOut"
  | "walk"
  | "hitByPitch"
  | "error"
  | "sacrifice"
  | "sacrificeFly"
  | "fieldersChoice"
  | "interference"
  | "uncaughtThirdStrike";

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
  position?: FieldingPosition | null;
}

export interface Team {
  name: string;
  players: Player[];
  startingPitcherId?: string | null;
  startingPitcherName?: string;
}

export interface GameConfig {
  regulationInnings: number;
  teams: {
    away: Team;
    home: Team;
  };
}

export interface Runners {
  first: string | null;
  second: string | null;
  third: string | null;
}

export interface RunnerMovement {
  playerId: string;
  from: RunnerOrigin;
  to: RunnerDestination;
  isRBI: boolean;
}

export interface BattedBall {
  position: FieldingPosition;
  type: "ground" | "fly" | "liner" | "bunt";
}

export interface AtBatEvent {
  id: string;
  kind: "atBat";
  batterId: string;
  result: AtBatResult;
  battedBall?: BattedBall;
  note?: string;
  movements: RunnerMovement[];
}

export interface BaseRunningEvent {
  id: string;
  kind: "baseRunning";
  type: BaseRunningType;
  movements: RunnerMovement[];
  rbiCreditBatterId?: string;
}

export type GameEvent = AtBatEvent | BaseRunningEvent;

export type GameEndReason =
  | "homeAheadAfterTop"
  | "walkOff"
  | "completedHalf";

export interface Score {
  away: number;
  home: number;
}

export interface Snapshot {
  inning: number;
  half: Half;
  outs: number;
  runners: Runners;
  currentBatterIndex: Record<TeamSide, number>;
  score: Score;
  gameStatus: "live" | "finished";
  gameEndReason?: GameEndReason;
}

export type ViolationSeverity = "warning" | "error";

export type ViolationCode =
  | "INVALID_REGULATION_INNINGS"
  | "EMPTY_LINEUP"
  | "DUPLICATE_PLAYER_ID"
  | "DUPLICATE_EVENT_ID"
  | "GAME_ALREADY_FINISHED"
  | "WRONG_BATTER"
  | "UNKNOWN_PLAYER"
  | "PLAYER_NOT_ON_OFFENSE"
  | "DUPLICATE_MOVEMENT_SOURCE"
  | "DUPLICATE_RUNNER_MOVEMENT"
  | "SOURCE_RUNNER_MISMATCH"
  | "BATTER_SOURCE_NOT_ALLOWED"
  | "DESTINATION_OCCUPIED"
  | "DUPLICATE_DESTINATION"
  | "BACKWARD_MOVEMENT"
  | "INVALID_RBI";

export interface Violation {
  code: ViolationCode;
  severity: ViolationSeverity;
  message: string;
  eventId?: string;
  eventIndex?: number;
}

export interface TimelineEntry {
  event: GameEvent;
  index: number;
  inning: number;
  half: Half;
  team: TeamSide;
  outsBefore: number;
  outsAfter: number;
  outsRecorded: number;
  runsScored: number;
  scoringMovements: RunnerMovement[];
  applied: boolean;
  before: Snapshot;
  after: Snapshot;
}

export interface ReplayResult {
  snapshot: Snapshot;
  timeline: TimelineEntry[];
  violations: Violation[];
}
