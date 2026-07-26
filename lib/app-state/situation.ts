import type { Half, Runners } from "../domain/types";

export interface SituationSummary {
  inning: number;
  half: Half;
  outs: number;
  runners: Runners;
  batterName: string;
}

export function formatSituationSummary({
  inning,
  half,
  outs,
  runners,
  batterName,
}: SituationSummary): string {
  const occupiedBases = [
    runners.first ? "一" : "",
    runners.second ? "二" : "",
    runners.third ? "三" : "",
  ].join("");
  const outsLabel = outs === 0 ? "ノーアウト" : `${outs}アウト`;
  const runnersLabel = occupiedBases ? `${occupiedBases}塁` : "なし";
  return `${inning}回${half === "top" ? "表" : "裏"}・${outsLabel}・走者${runnersLabel}・打者 ${batterName}`;
}
