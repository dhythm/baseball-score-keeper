import { AlertTriangle } from "lucide-react";

import type { AppGame } from "../lib/app-state/types";
import { formatViolationMessage } from "../lib/app-state/feedback";
import { formatEventNotation } from "../lib/domain/notation";
import { getRejectedEventIssues } from "../lib/app-state/timeline-selectors";

export function EventIntegrityAlert({ game }: { game: AppGame }) {
  const issues = getRejectedEventIssues(game.timeline, game.violations);
  if (issues.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm"
      aria-labelledby="event-integrity-title"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className="mt-0.5 size-5 shrink-0 text-destructive"
          aria-hidden
        />
        <div className="min-w-0">
          <h2 id="event-integrity-title" className="font-bold text-destructive">
            無効になった記録が{issues.length}件あります
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            以前の記録を修正すると解消できます。
          </p>
        </div>
      </div>
      <ul className="mt-2 space-y-1 border-t border-destructive/20 pt-2">
        {issues.map(({ entry, violations }) => (
          <li key={`${entry.index}-${entry.event.id}`} className="text-xs">
            <span className="font-semibold">
              {entry.inning}回{entry.half === "top" ? "表" : "裏"}・
              {formatEventNotation(entry.event)}
            </span>
            <span className="text-muted-foreground">
              {" — "}
              {violations[0]
                ? formatViolationMessage(violations[0])
                : "前の記録との整合性を確認してください。"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
