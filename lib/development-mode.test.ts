import { describe, expect, it } from "vitest";

import { shouldShowDevelopmentTools } from "./development-mode";

describe("development tools visibility", () => {
  it("is enabled only for the local development server", () => {
    expect(shouldShowDevelopmentTools("development")).toBe(true);
    expect(shouldShowDevelopmentTools("production")).toBe(false);
    expect(shouldShowDevelopmentTools("test")).toBe(false);
    expect(shouldShowDevelopmentTools(undefined)).toBe(false);
  });
});
