import { describe, expect, it } from "vitest";

import {
  getInningColumnScrollLeft,
  shouldScrollCurrentBatterIntoView,
} from "./batting-order-scroll";

describe("getInningColumnScrollLeft", () => {
  it("keeps an early inning at the start of the table", () => {
    expect(
      getInningColumnScrollLeft({
        containerWidth: 343,
        stickyWidth: 112,
        targetOffsetLeft: 112,
        targetWidth: 56,
        maxScrollLeft: 273,
      })
    ).toBe(0);
  });

  it("centers a later inning in the area beside the sticky columns", () => {
    expect(
      getInningColumnScrollLeft({
        containerWidth: 343,
        stickyWidth: 112,
        targetOffsetLeft: 392,
        targetWidth: 56,
        maxScrollLeft: 600,
      })
    ).toBe(193);
  });

  it("does not scroll beyond the end of the table", () => {
    expect(
      getInningColumnScrollLeft({
        containerWidth: 343,
        stickyWidth: 112,
        targetOffsetLeft: 840,
        targetWidth: 56,
        maxScrollLeft: 420,
      })
    ).toBe(420);
  });
});

describe("shouldScrollCurrentBatterIntoView", () => {
  it("scrolls the active batting team's row when it is below the viewport", () => {
    expect(
      shouldScrollCurrentBatterIntoView({
        isBattingTeam: true,
        isRendered: true,
        rowTop: 900,
        rowBottom: 950,
        viewportTop: 0,
        viewportBottom: 800,
      })
    ).toBe(true);
  });

  it("does not move a row that is already fully visible", () => {
    expect(
      shouldScrollCurrentBatterIntoView({
        isBattingTeam: true,
        isRendered: true,
        rowTop: 300,
        rowBottom: 350,
        viewportTop: 0,
        viewportBottom: 800,
      })
    ).toBe(false);
  });

  it.each([
    ["a hidden tab", true, false],
    ["the fielding team", false, true],
  ])("does not move %s", (_label, isBattingTeam, isRendered) => {
    expect(
      shouldScrollCurrentBatterIntoView({
        isBattingTeam,
        isRendered,
        rowTop: 900,
        rowBottom: 950,
        viewportTop: 0,
        viewportBottom: 800,
      })
    ).toBe(false);
  });
});
