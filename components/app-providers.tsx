"use client";

import type { ReactNode } from "react";

import { GameErrorBoundary } from "@/components/game-error-boundary";
import { UiPreferencesProvider } from "@/components/ui-preferences-provider";
import { HistoryBackupManager } from "@/components/history-backup-manager";
import { GameProvider } from "@/lib/game-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GameErrorBoundary>
      <UiPreferencesProvider>
        <GameProvider>
          {children}
          <HistoryBackupManager />
        </GameProvider>
      </UiPreferencesProvider>
    </GameErrorBoundary>
  );
}
