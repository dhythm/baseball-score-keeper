"use client";

import { Beaker, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGame } from "@/lib/game-context";
import { DEVELOPMENT_GAME_SCENARIOS } from "@/lib/dev-fixtures/game-scenarios";
import { shouldShowDevelopmentTools } from "@/lib/development-mode";

export function DevelopmentScenarioPanel({
  onApplySamplePreset,
}: {
  onApplySamplePreset: () => void;
}) {
  const { dispatch } = useGame();
  const [scenarioId, setScenarioId] = useState(
    DEVELOPMENT_GAME_SCENARIOS[0]?.id ?? ""
  );

  if (!shouldShowDevelopmentTools()) return null;

  const scenario = DEVELOPMENT_GAME_SCENARIOS.find(
    (item) => item.id === scenarioId
  );

  const loadScenario = () => {
    if (!scenario) return;
    dispatch({ type: "LOAD_GAME", game: scenario.createGame() });
    toast.success(`検証シナリオ「${scenario.title}」を読み込みました`);
  };
  const applySamplePreset = () => {
    onApplySamplePreset();
    toast.success("両チーム9人の入力フォームを設定しました");
  };

  return (
    <Card className="gap-3 border-dashed border-amber-500/70 bg-amber-50/70 py-4 dark:bg-amber-950/20">
      <CardHeader className="space-y-2 px-4 py-0">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Beaker className="h-4 w-4 text-amber-700" aria-hidden="true" />
            ローカル検証ツール
          </CardTitle>
          <span className="shrink-0 rounded-full bg-amber-200 px-2 py-1 text-[11px] font-bold text-amber-950">
            開発時のみ
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          この領域はローカルの開発サーバーでだけ表示され、本番環境には表示されません。
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold">新規試合の入力確認</p>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full bg-background"
            onClick={applySamplePreset}
          >
            両チーム9人の入力フォームを設定
          </Button>
        </div>

        <div className="space-y-2 border-t border-amber-500/30 pt-4">
          <label htmlFor="development-scenario" className="text-sm font-semibold">
            進行済みの試合パターン
          </label>
          <Select value={scenarioId} onValueChange={setScenarioId}>
            <SelectTrigger
              id="development-scenario"
              className="min-h-11 w-full bg-background"
              aria-label="検証する試合パターン"
            >
              <SelectValue placeholder="シナリオを選択" />
            </SelectTrigger>
            <SelectContent>
              {DEVELOPMENT_GAME_SCENARIOS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {scenario && (
            <div
              className="rounded-lg border border-amber-500/30 bg-background p-3"
              aria-live="polite"
            >
              <p className="text-sm leading-relaxed">{scenario.description}</p>
              <p className="mt-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                確認ポイント: {scenario.expectation}
              </p>
            </div>
          )}

          <Button
            type="button"
            className="h-12 w-full font-bold"
            disabled={!scenario}
            onClick={loadScenario}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            このシナリオを読み込む
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
