import type { Snapshot } from "../lib/domain/types";
import type { AppGame } from "../lib/app-state/types";
import { getBatterAtSnapshot, getPlayerById } from "../lib/app-state/selectors";
import { formatSituationSummary } from "../lib/app-state/situation";

export function SituationMiniHeader({
  game,
  snapshot,
  batterId,
}: {
  game: AppGame;
  snapshot: Snapshot;
  batterId?: string;
}) {
  const batter = batterId
    ? getPlayerById(game, batterId)
    : getBatterAtSnapshot(game, snapshot);
  const summary = formatSituationSummary({
    inning: snapshot.inning,
    half: snapshot.half,
    outs: snapshot.outs,
    runners: snapshot.runners,
    batterName: batter?.name ?? "不明",
  });

  return (
    <p
      className="mt-1 truncate text-xs font-medium text-muted-foreground"
      title={summary}
      aria-label={`現在の状況: ${summary}`}
    >
      {summary}
    </p>
  );
}
