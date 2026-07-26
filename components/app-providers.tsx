"use client";

import type { ReactNode } from "react";

import { GameProvider } from "@/lib/game-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}
