import { describe, expect, it } from "vitest";

import {
  FEEDBACK_ACCOUNT,
  FEEDBACK_PROFILE_URL,
} from "../lib/feedback-contact";

describe("feedback contact", () => {
  it("points users to the requested X account", () => {
    expect(FEEDBACK_ACCOUNT).toBe("@dhythm_dev");
    expect(FEEDBACK_PROFILE_URL).toBe("https://x.com/dhythm_dev");
  });
});
