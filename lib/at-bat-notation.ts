import type { AtBatResult, FieldingPosition } from "./types";
import { FIELDING_POSITION_SCOREBOOK } from "./types";

/** Positions that can appear in scorebook direction / 誰が（DH 除く）。 */
export const FIELDING_POSITIONS_FOR_PLAY: FieldingPosition[] = [
  "pitcher",
  "catcher",
  "first",
  "second",
  "third",
  "short",
  "left",
  "center",
  "right",
];

export function fieldingPosLabel(pos: FieldingPosition): string {
  return FIELDING_POSITION_SCOREBOOK[pos];
}

export function buildHitDetail(
  hit: "single" | "double" | "triple" | "homerun",
  pos: FieldingPosition
): string {
  const s = fieldingPosLabel(pos);
  if (hit === "single") return `${s}安`;
  if (hit === "double") return `${s}2`;
  if (hit === "triple") return `${s}3`;
  return `${s}本`;
}

export function buildGroundOutDetail(pos: FieldingPosition): string {
  return `${fieldingPosLabel(pos)}ゴロ`;
}

export function buildFlyOutDetail(pos: FieldingPosition): string {
  return `${fieldingPosLabel(pos)}飛`;
}

export function buildDoublePlayDetail(pos: FieldingPosition): string {
  return `${fieldingPosLabel(pos)}併`;
}

export function buildErrorDetail(pos: FieldingPosition): string {
  return `${fieldingPosLabel(pos)}失`;
}

export function buildFieldersChoiceDetail(pos: FieldingPosition): string {
  return `${fieldingPosLabel(pos)}野選`;
}

/** その他アウト（内野安など） */
export const OTHER_OUT_DETAILS: { result: AtBatResult; detail: string; label: string }[] = [
  { result: "otherOut", detail: "内野安", label: "内野安" },
  { result: "otherOut", detail: "その他", label: "その他" },
];

/** 犠打の表記 */
export const SACRIFICE_DETAILS: { detail: string; label: string }[] = [
  { detail: "犠打", label: "犠打" },
  { detail: "犠飛", label: "犠飛" },
];
