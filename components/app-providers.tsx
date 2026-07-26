"use client";

import type { ReactNode } from "react";

import { GameErrorBoundary } from "@/components/game-error-boundary";
import { GameProvider } from "@/lib/game-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GameErrorBoundary>
      <GameProvider>{children}</GameProvider>
    </GameErrorBoundary>
  );
}
