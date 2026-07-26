import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_UI_PREFERENCES,
  UI_PREFERENCES_STORAGE_KEY,
  loadUiPreferences,
  saveUiPreferences,
  vibrateOnConfirmation,
} from "./ui-preferences";

function memoryStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => {
      value = nextValue;
    }),
  };
}

describe("UI preferences", () => {
  it("uses disabled defaults when no preferences have been saved", () => {
    expect(loadUiPreferences(memoryStorage())).toEqual({
      outdoorMode: false,
      vibrationEnabled: false,
    });
  });

  it("round-trips versioned preferences", () => {
    const storage = memoryStorage();
    const preferences = { outdoorMode: true, vibrationEnabled: true };

    expect(saveUiPreferences(storage, preferences)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      UI_PREFERENCES_STORAGE_KEY,
      expect.stringContaining('"version":1')
    );
    expect(loadUiPreferences(storage)).toEqual(preferences);
  });

  it("falls back safely for malformed data and storage failures", () => {
    const malformedStorage = memoryStorage('{"version":1,"outdoorMode":"yes"}');
    const unavailableStorage = {
      getItem: vi.fn(() => {
        throw new Error("unavailable");
      }),
      setItem: vi.fn(() => {
        throw new Error("unavailable");
      }),
    };

    expect(loadUiPreferences(malformedStorage)).toEqual(DEFAULT_UI_PREFERENCES);
    expect(loadUiPreferences(unavailableStorage)).toEqual(
      DEFAULT_UI_PREFERENCES
    );
    expect(saveUiPreferences(unavailableStorage, DEFAULT_UI_PREFERENCES)).toBe(
      false
    );
  });
});

describe("vibrateOnConfirmation", () => {
  it("vibrates briefly only when feedback is enabled and supported", () => {
    const vibrate = vi.fn(() => true);

    expect(vibrateOnConfirmation(true, { vibrate })).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(40);

    vibrate.mockClear();
    expect(vibrateOnConfirmation(false, { vibrate })).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();
    expect(vibrateOnConfirmation(true, {})).toBe(false);
  });

  it("does not let a browser vibration error escape", () => {
    expect(
      vibrateOnConfirmation(true, {
        vibrate: () => {
          throw new Error("denied");
        },
      })
    ).toBe(false);
  });
});
