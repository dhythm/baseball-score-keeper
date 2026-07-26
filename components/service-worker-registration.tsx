"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export function ServiceWorkerRegistration({
  enabled = process.env.NODE_ENV === "production",
}: {
  enabled?: boolean;
}) {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !("serviceWorker" in navigator)) return;

    let disposed = false;
    const detectWaitingWorker = (
      nextRegistration: ServiceWorkerRegistration
    ) => {
      if (nextRegistration.waiting && navigator.serviceWorker.controller) {
        setRegistration(nextRegistration);
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker
      .register(`/sw.js?v=${process.env.NEXT_PUBLIC_BUILD_ID ?? "development"}`)
      .then((nextRegistration) => {
        if (disposed) return;
        detectWaitingWorker(nextRegistration);
        nextRegistration.addEventListener("updatefound", () => {
          const installing = nextRegistration.installing;
          installing?.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              detectWaitingWorker(nextRegistration);
            }
          });
        });
        void nextRegistration.update();
      })
      .catch(() => {
        // The app remains usable online when registration is unavailable.
      });

    return () => {
      disposed = true;
    };
  }, [enabled]);

  const activateUpdate = () => {
    const waiting = registration?.waiting;
    if (!waiting) return;
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        if (reloadingRef.current) return;
        reloadingRef.current = true;
        window.location.reload();
      },
      { once: true }
    );
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center justify-center gap-2 border-t border-primary bg-card px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 text-center text-sm font-semibold shadow-lg sm:flex-row"
    >
      新しいバージョンがあります
      <Button type="button" size="sm" onClick={activateUpdate}>
        <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" />
        再読み込み
      </Button>
    </div>
  );
}
