// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { DisplaySettingsDialog } from "./display-settings-dialog";
import { UiPreferencesProvider } from "./ui-preferences-provider";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.outdoorMode;
});

describe("DisplaySettingsDialog", () => {
  it("keeps outdoor mode and vibration as independent opt-in settings", async () => {
    const user = userEvent.setup();
    render(
      <UiPreferencesProvider>
        <DisplaySettingsDialog />
      </UiPreferencesProvider>
    );

    await user.click(screen.getByRole("button", { name: "表示と操作の設定" }));
    const outdoorMode = screen.getByRole("checkbox", { name: /屋外モード/ });
    const vibration = screen.getByRole("checkbox", { name: /確定時に振動/ });

    expect(outdoorMode.getAttribute("aria-checked")).toBe("false");
    expect(vibration.getAttribute("aria-checked")).toBe("false");

    await user.click(outdoorMode);
    expect(outdoorMode.getAttribute("aria-checked")).toBe("true");
    expect(vibration.getAttribute("aria-checked")).toBe("false");
  });
});
