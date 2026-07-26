// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PrintScorebookButton } from "./print-scorebook-button";

afterEach(cleanup);

describe("PrintScorebookButton", () => {
  it("opens the browser print dialog", async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<PrintScorebookButton />);

    await user.click(screen.getByRole("button", { name: "印刷/PDF" }));

    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });
});
