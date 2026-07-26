import { describe, expect, it } from "vitest";

import type { PersistedGameV2 } from "./local-storage";
import {
  DEFAULT_HISTORY_BYTE_BUDGET,
  estimateSerializedBytes,
  getHistoryBackupCandidates,
} from "./history-retention";

function game({
  id,
  date,
  status = "finished",
  note = "",
}: {
  id: string;
  date: string;
  status?: PersistedGameV2["status"];
  note?: string;
}): PersistedGameV2 {
  return {
    id,
    date,
    status,
    config: {
      regulationInnings: 1,
      teams: {
        away: {
          name: "Away",
          players: [{ id: "away", name: "Away", order: 1 }],
        },
        home: {
          name: "Home",
          players: [{ id: "home", name: "Home", order: 1 }],
        },
      },
    },
    events: note ? [{ id: `${id}-note`, kind: "note", text: note }] : [],
  };
}

describe("history retention", () => {
  it("uses a conservative UTF-16 byte estimate", () => {
    expect(estimateSerializedBytes("abc")).toBe(6);
    expect(estimateSerializedBytes("野球")).toBe(4);
    expect(DEFAULT_HISTORY_BYTE_BUDGET).toBeGreaterThan(1_000_000);
  });

  it("selects the oldest finished games until history fits the budget", () => {
    const newest = game({
      id: "newest",
      date: "2026-07-03",
      note: "n".repeat(200),
    });
    const middle = game({
      id: "middle",
      date: "2026-07-02",
      note: "m".repeat(200),
    });
    const oldest = game({
      id: "oldest",
      date: "2026-07-01",
      note: "o".repeat(200),
    });

    const candidates = getHistoryBackupCandidates(
      [newest, oldest, middle],
      "newest",
      estimateSerializedBytes(JSON.stringify([newest])) + 100
    );

    expect(candidates.map((item) => item.id)).toEqual(["oldest", "middle"]);
  });

  it("never evicts the active game or another live game", () => {
    const active = game({
      id: "active",
      date: "2026-07-03",
      status: "live",
      note: "a".repeat(200),
    });
    const otherLive = game({
      id: "other-live",
      date: "2026-07-02",
      status: "live",
      note: "l".repeat(200),
    });
    const archived = game({
      id: "archived",
      date: "2026-07-01",
      note: "f".repeat(200),
    });

    expect(
      getHistoryBackupCandidates(
        [active, otherLive, archived],
        "active",
        1
      ).map((item) => item.id)
    ).toEqual(["archived"]);
  });
});
