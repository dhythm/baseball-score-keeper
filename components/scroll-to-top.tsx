"use client";

import { useLayoutEffect } from "react";

export function ScrollToTop({ resetKey }: { resetKey: string }) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [resetKey]);

  return null;
}
