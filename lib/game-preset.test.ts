import { describe, expect, it } from "vitest";

import { createStandardGamePreset } from "./game-preset";

describe("standard game preset", () => {
  it("creates two nine-player teams with generic Japanese names", () => {
    let id = 0;
    const preset = createStandardGamePreset(() => `preset-${++id}`);

    expect(preset.away.name).toBe("チーム1");
    expect(preset.home.name).toBe("チーム2");

    for (const team of [preset.away, preset.home]) {
      expect(team.players.map((player) => player.name)).toEqual(
        Array.from({ length: 9 }, (_, index) => `選手${index + 1}`)
      );
      expect(team.players.map((player) => player.order)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]);
      expect(team.startingPitcherId).toBe(team.players[0].id);
      expect(team.startingPitcherName).toBe("選手1");
    }

    const playerIds = [...preset.away.players, ...preset.home.players].map(
      (player) => player.id
    );
    expect(new Set(playerIds).size).toBe(18);
  });
});
