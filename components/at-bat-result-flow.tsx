"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import type {
  AtBatResult,
  BattedBall,
  FieldingPosition,
} from "@/lib/domain/types";
import {
  FIELDING_POSITIONS_FOR_PLAY,
  buildHitDetail,
  buildGroundOutDetail,
  buildFlyOutDetail,
  buildDoublePlayDetail,
  buildErrorDetail,
  buildFieldersChoiceDetail,
  buildSacrificeFlyDetail,
  HIT_KINDS as DIRECT_HIT_KINDS,
  OTHER_OUT_DETAILS,
  SACRIFICE_DETAILS,
  fieldingPosLabel,
} from "@/lib/at-bat-notation";

const CATEGORIES: {
  id: ResultCategory;
  label: string;
  variant: "default" | "secondary" | "outline";
}[] = [
  { id: "hit", label: "安打", variant: "default" },
  { id: "out", label: "アウト", variant: "secondary" },
  { id: "walk", label: "四死球", variant: "secondary" },
  { id: "error", label: "エラー", variant: "outline" },
  { id: "other", label: "その他", variant: "outline" },
];

type ResultCategory = "hit" | "out" | "walk" | "error" | "other";

const HIT_KINDS: {
  result: "single" | "double" | "triple" | "homerun";
  label: string;
}[] = [
  { result: "single", label: "シングル" },
  { result: "double", label: "ツーベース" },
  { result: "triple", label: "スリーベース" },
  { result: "homerun", label: "ホームラン" },
];

const OUT_KINDS: {
  result: AtBatResult;
  label: string;
  needsField: boolean;
}[] = [
  { result: "groundOut", label: "ゴロ", needsField: true },
  { result: "flyOut", label: "フライ", needsField: true },
  { result: "strikeoutSwinging", label: "空振り三振", needsField: false },
  { result: "strikeoutLooking", label: "見逃し三振", needsField: false },
  { result: "uncaughtThirdStrike", label: "振り逃げ", needsField: false },
  { result: "doublePlay", label: "併殺打", needsField: true },
  { result: "otherOut", label: "その他", needsField: false },
];

export type AtBatResultFlowProps = {
  /** ダイアログを開くたびに変えるとステップがリセットされる */
  resetToken: number;
  outs: number;
  hasTagUpCandidate?: boolean;
  canRecordDoublePlay?: boolean;
  onSubmit: (
    result: AtBatResult,
    detail?: string,
    battedBall?: BattedBall
  ) => void;
};

type Step =
  | { id: "category" }
  | { id: "hitKind" }
  | { id: "hitDir"; hit: "single" | "double" | "triple" | "homerun" }
  | { id: "outKind" }
  | { id: "outPos"; out: AtBatResult }
  | { id: "flyDepth"; position: FieldingPosition; detail: string }
  | { id: "walk" }
  | { id: "errorPos" }
  | { id: "otherKind" }
  | { id: "sacrificeKind" }
  | { id: "sacrificeFlyPos" }
  | { id: "fcPos" };

function PositionGrid({
  onPick,
  positions = FIELDING_POSITIONS_FOR_PLAY,
}: {
  onPick: (pos: FieldingPosition) => void;
  positions?: readonly FieldingPosition[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
      {positions.map((pos) => (
        <Button
          key={pos}
          type="button"
          variant="secondary"
          className="h-11 touch-manipulation text-sm font-semibold"
          onClick={() => onPick(pos)}
        >
          {fieldingPosLabel(pos)}
        </Button>
      ))}
    </div>
  );
}

export function AtBatResultFlow({
  resetToken,
  outs,
  hasTagUpCandidate = false,
  canRecordDoublePlay = true,
  onSubmit,
}: AtBatResultFlowProps) {
  const [step, setStep] = useState<Step>({ id: "category" });

  useEffect(() => {
    setStep({ id: "category" });
  }, [resetToken]);

  const goBack = useCallback(() => {
    setStep((s) => {
      if (s.id === "category") return s;
      if (
        s.id === "hitKind" ||
        s.id === "outKind" ||
        s.id === "walk" ||
        s.id === "errorPos" ||
        s.id === "otherKind"
      ) {
        return { id: "category" };
      }
      if (s.id === "hitDir") return { id: "hitKind" };
      if (s.id === "outPos") return { id: "outKind" };
      if (s.id === "flyDepth") return { id: "outPos", out: "flyOut" };
      if (s.id === "sacrificeKind" || s.id === "fcPos")
        return { id: "otherKind" };
      if (s.id === "sacrificeFlyPos") return { id: "sacrificeKind" };
      return { id: "category" };
    });
  }, []);

  const handleCategory = (cat: ResultCategory) => {
    if (cat === "hit") setStep({ id: "hitKind" });
    else if (cat === "out") setStep({ id: "outKind" });
    else if (cat === "walk") setStep({ id: "walk" });
    else if (cat === "error") setStep({ id: "errorPos" });
    else setStep({ id: "otherKind" });
  };

  const handleHitKind = (hit: "single" | "double" | "triple" | "homerun") => {
    setStep({ id: "hitDir", hit });
  };

  const handleHitDir = (pos: FieldingPosition) => {
    if (step.id !== "hitDir") return;
    const { hit } = step;
    const r: AtBatResult =
      hit === "single"
        ? "single"
        : hit === "double"
          ? "double"
          : hit === "triple"
            ? "triple"
            : "homerun";
    onSubmit(r, buildHitDetail(hit, pos));
  };

  const handleOutKindSelect = (row: (typeof OUT_KINDS)[number]) => {
    if (row.result === "doublePlay" && (outs >= 2 || !canRecordDoublePlay))
      return;
    if (!row.needsField) {
      if (row.result === "otherOut") {
        setStep({ id: "outPos", out: "otherOut" });
        return;
      }
      onSubmit(row.result, undefined);
      return;
    }
    setStep({ id: "outPos", out: row.result });
  };

  const handleOutPos = (pos: FieldingPosition) => {
    if (step.id !== "outPos") return;
    const { out } = step;
    if (out === "groundOut") onSubmit("groundOut", buildGroundOutDetail(pos));
    else if (out === "flyOut") {
      const detail = buildFlyOutDetail(pos);
      const isOutfield = pos === "left" || pos === "center" || pos === "right";
      if (isOutfield && hasTagUpCandidate) {
        setStep({ id: "flyDepth", position: pos, detail });
      } else {
        onSubmit("flyOut", detail, { position: pos, type: "fly" });
      }
    } else if (out === "doublePlay")
      onSubmit("doublePlay", buildDoublePlayDetail(pos));
  };

  const handleOtherOutPick = (detail: string) => {
    onSubmit("otherOut", detail);
  };

  const handleWalk = (result: "walk" | "hitByPitch") => {
    onSubmit(result, result === "walk" ? "四球" : "死球");
  };

  const handleErrorPos = (pos: FieldingPosition) => {
    onSubmit("error", buildErrorDetail(pos));
  };

  const handleOtherKind = (result: AtBatResult) => {
    if (result === "fieldersChoice") {
      setStep({ id: "fcPos" });
      return;
    }
    if (result === "sacrifice") {
      setStep({ id: "sacrificeKind" });
      return;
    }
    if (result === "interference") {
      onSubmit("interference", "打撃妨害");
    }
  };

  const handleSacrifice = (detail: string) => {
    if (detail.includes("犠飛")) {
      setStep({ id: "sacrificeFlyPos" });
      return;
    }
    onSubmit("sacrifice", detail);
  };

  const handleSacrificeFlyPos = (pos: FieldingPosition) => {
    onSubmit("sacrificeFly", buildSacrificeFlyDetail(pos));
  };

  const handleFcPos = (pos: FieldingPosition) => {
    onSubmit("fieldersChoice", buildFieldersChoiceDetail(pos));
  };

  const titleForStep = (): string => {
    switch (step.id) {
      case "category":
        return "結果の種類";
      case "hitKind":
        return "安打の種類";
      case "hitDir":
        return "打球の方向";
      case "outKind":
        return "アウトの種類";
      case "outPos":
        return step.out === "otherOut"
          ? "その他アウト"
          : "打球の方向・守備位置";
      case "flyDepth":
        return "フライの深さ";
      case "walk":
        return "四死球";
      case "errorPos":
        return "エラーの守備位置";
      case "otherKind":
        return "その他";
      case "sacrificeKind":
        return "犠打の種類";
      case "sacrificeFlyPos":
        return "犠飛の方向";
      case "fcPos":
        return "野選の守備位置";
      default:
        return "";
    }
  };

  if (step.id === "category") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">
          {titleForStep()}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full text-sm font-bold touch-manipulation"
          onClick={() => onSubmit("strikeout")}
        >
          三振
        </Button>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.slice(0, 3).map(({ id, label, variant }) => (
            <Button
              key={id}
              type="button"
              variant={variant}
              className="h-12 text-sm font-semibold touch-manipulation"
              onClick={() => handleCategory(id)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.slice(3).map(({ id, label, variant }) => (
            <Button
              key={id}
              type="button"
              variant={variant}
              className="h-12 text-sm font-semibold touch-manipulation"
              onClick={() => handleCategory(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (step.id === "hitKind") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 px-3"
            onClick={goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <span className="text-sm font-semibold">{titleForStep()}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {HIT_KINDS.map(({ result, label }) => (
            <Button
              key={result}
              type="button"
              variant="secondary"
              className="h-12 text-sm font-medium touch-manipulation"
              onClick={() => handleHitKind(result)}
            >
              {label}
            </Button>
          ))}
          {DIRECT_HIT_KINDS.map(({ result, label, detail }) => (
            <Button
              key={detail}
              type="button"
              variant="secondary"
              className="h-12 touch-manipulation text-sm font-medium"
              onClick={() => onSubmit(result, detail)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (step.id === "flyDepth") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={goBack}
            aria-label="打球方向へ戻る"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <p className="text-sm font-semibold">{titleForStep()}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["shallow", "deep"] as const).map((depth) => (
            <Button
              key={depth}
              type="button"
              variant={depth === "deep" ? "default" : "secondary"}
              className="h-12 text-sm font-semibold"
              onClick={() =>
                onSubmit("flyOut", step.detail, {
                  position: step.position,
                  type: "fly",
                  depth,
                })
              }
            >
              {depth === "deep" ? "深い" : "浅い"}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (step.id === "hitDir") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 px-3"
            onClick={goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <span className="text-sm font-semibold">{titleForStep()}</span>
        </div>
        <PositionGrid onPick={handleHitDir} />
      </div>
    );
  }

  if (step.id === "outKind") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 px-3"
            onClick={goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <span className="text-sm font-semibold">{titleForStep()}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {OUT_KINDS.map((row) => {
            const disabled =
              row.result === "doublePlay" &&
              (outs >= 2 || !canRecordDoublePlay);
            return (
              <Button
                key={row.result}
                type="button"
                variant="secondary"
                disabled={disabled}
                className="h-12 text-sm font-medium touch-manipulation"
                onClick={() => handleOutKindSelect(row)}
              >
                {row.label}
                {disabled && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    ({outs >= 2 ? "2アウト" : "一塁走者なし"})
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step.id === "outPos" && step.out === "otherOut") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 px-3"
            onClick={goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <span className="text-sm font-semibold">{titleForStep()}</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {OTHER_OUT_DETAILS.map(({ detail, label }) => (
            <Button
              key={detail}
              type="button"
              variant="secondary"
              className="h-12 touch-manipulation"
              onClick={() => handleOtherOutPick(detail)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (step.id === "outPos") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 px-3"
            onClick={goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <span className="text-sm font-semibold">{titleForStep()}</span>
        </div>
        <PositionGrid
          onPick={handleOutPos}
          positions={
            step.out === "doublePlay"
              ? ["pitcher", "catcher", "first", "second", "third", "short"]
              : undefined
          }
        />
      </div>
    );
  }

  if (step.id === "walk") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 px-3"
            onClick={goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <span className="text-sm font-semibold">{titleForStep()}</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-12 touch-manipulation"
            onClick={() => handleWalk("walk")}
          >
            フォアボール（四球）
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12 touch-manipulation"
            onClick={() => handleWalk("hitByPitch")}
          >
            デッドボール（死球）
          </Button>
        </div>
      </div>
    );
  }

  if (step.id === "errorPos") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 px-3"
            onClick={goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <span className="text-sm font-semibold">{titleForStep()}</span>
        </div>
        <PositionGrid onPick={handleErrorPos} />
      </div>
    );
  }

  if (step.id === "otherKind") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 px-3"
            onClick={goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <span className="text-sm font-semibold">{titleForStep()}</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-12 touch-manipulation"
            onClick={() => handleOtherKind("sacrifice")}
          >
            犠打・犠飛
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12 touch-manipulation"
            onClick={() => handleOtherKind("fieldersChoice")}
          >
            フィルダースチョイス（野選）
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12 touch-manipulation"
            onClick={() => handleOtherKind("interference")}
          >
            打撃妨害
          </Button>
        </div>
      </div>
    );
  }

  if (step.id === "sacrificeKind") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 px-3"
            onClick={goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <span className="text-sm font-semibold">{titleForStep()}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SACRIFICE_DETAILS.map(({ detail, label }) => (
            <Button
              key={detail}
              type="button"
              variant="secondary"
              className="h-12 touch-manipulation"
              onClick={() => handleSacrifice(detail)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (step.id === "fcPos") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 px-3"
            onClick={goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <span className="text-sm font-semibold">{titleForStep()}</span>
        </div>
        <PositionGrid onPick={handleFcPos} />
      </div>
    );
  }

  if (step.id === "sacrificeFlyPos") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 px-3"
            onClick={goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <span className="text-sm font-semibold">{titleForStep()}</span>
        </div>
        <PositionGrid onPick={handleSacrificeFlyPos} />
      </div>
    );
  }

  return null;
}
