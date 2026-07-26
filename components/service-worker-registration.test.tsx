// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceWorkerRegistration } from "./service-worker-registration";

type Listener = () => void;

function worker(state: ServiceWorkerState = "installed") {
  const listeners = new Map<string, Listener>();
  return {
    state,
    postMessage: vi.fn(),
    addEventListener: vi.fn((name: string, listener: Listener) => {
      listeners.set(name, listener);
    }),
    emit(name: string) {
      listeners.get(name)?.();
    },
  };
}

describe("ServiceWorkerRegistration", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("prompts for an already waiting update and activates it on request", async () => {
    const waiting = worker();
    const controllerListeners = new Map<string, Listener>();
    const registration = {
      waiting,
      installing: null,
      addEventListener: vi.fn(),
      update: vi.fn(),
    };
    const reload = vi.fn();
    vi.stubGlobal("navigator", {
      serviceWorker: {
        controller: {},
        register: vi.fn().mockResolvedValue(registration),
        addEventListener: vi.fn((name: string, listener: Listener) => {
          controllerListeners.set(name, listener);
        }),
      },
    });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload },
    });

    render(<ServiceWorkerRegistration enabled />);
    expect(await screen.findByText("新しいバージョンがあります")).toBeTruthy();
    await userEvent.setup().click(screen.getByText("再読み込み"));
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    act(() => controllerListeners.get("controllerchange")?.());
    expect(reload).toHaveBeenCalledOnce();
  });

  it("does not prompt for the first installation", async () => {
    const installing = worker("installing");
    const registration = {
      waiting: null,
      installing,
      addEventListener: vi.fn(),
      update: vi.fn(),
    };
    vi.stubGlobal("navigator", {
      serviceWorker: {
        controller: null,
        register: vi.fn().mockResolvedValue(registration),
        addEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration enabled />);
    act(() => {
      installing.state = "installed";
      installing.emit("statechange");
    });
    expect(screen.queryByText("新しいバージョンがあります")).toBeNull();
  });
});
