import type { FieldingPosition } from "../domain/types";

export type LegacyAtBatResult =
  | "single"
  | "double"
  | "triple"
  | "homerun"
  | "groundOut"
  | "flyOut"
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

interface LegacyPlayer {
  id: string;
  name: string;
  order: number;
  position?: FieldingPosition | null;
}

interface LegacyTeam {
  name: string;
  players: LegacyPlayer[];
  benchPlayers?: LegacyPlayer[];
  startingPitcherId?: string | null;
  startingPitcherName?: string;
}

export interface LegacyGameEvent {
  id: string;
  type: "atBat" | "baseRunning";
  inning: number;
  half: "top" | "bottom";
  team: "away" | "home";
  batterId?: string;
  result?: LegacyAtBatResult;
  resultDetail?: string;
  runnerMovements: {
    playerId: string;
    from: "batter" | "first" | "second" | "third";
    to: "first" | "second" | "third" | "home" | "out";
    isRBI: boolean;
  }[];
  baseRunningType?:
    | "steal"
    | "caughtStealing"
    | "wildPitch"
    | "passedBall"
    | "pickOff"
    | "balk";
  rbiCreditBatterId?: string;
  outsInPlay: number;
  runsScored: number;
  timestamp: string;
}

export interface LegacyGame {
  id: string;
  date: string;
  totalInnings: number;
  status: "setup" | "live" | "finished";
  teams: { away: LegacyTeam; home: LegacyTeam };
  events: LegacyGameEvent[];
  currentState: {
    inning: number;
    half: "top" | "bottom";
    outs: number;
    runners: {
      first: string | null;
      second: string | null;
      third: string | null;
    };
    currentBatterIndex: { away: number; home: number };
  };
}
