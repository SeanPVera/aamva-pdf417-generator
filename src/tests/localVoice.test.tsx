import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useClerkVoice } from "../hooks/useClerkVoice";
afterEach(() => vi.unstubAllGlobals());
it("never sends a record to a remote default speech voice", () => {
  const speak = vi.fn();
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      constructor(public text: string) {}
    }
  );
  vi.stubGlobal("speechSynthesis", {
    getVoices: () => [{ localService: false, default: true, lang: "en-US" }],
    cancel: vi.fn(),
    speak,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  });
  const { result, unmount } = renderHook(useClerkVoice);
  expect(result.current.supported).toBe(false);
  act(() => result.current.speak("SYNTHETIC RECORD"));
  expect(speak).not.toHaveBeenCalled();
  unmount();
});
it("selects a local voice explicitly and cancels on unmount", () => {
  const local = { localService: true, lang: "en-US" },
    speak = vi.fn(),
    cancel = vi.fn();
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      constructor(public text: string) {}
    }
  );
  vi.stubGlobal("speechSynthesis", {
    getVoices: () => [{ localService: false, default: true }, local],
    cancel,
    speak,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  });
  const { result, unmount } = renderHook(useClerkVoice);
  act(() => result.current.speak("SYNTHETIC RECORD"));
  expect(speak.mock.calls[0]?.[0].voice).toBe(local);
  unmount();
  expect(cancel).toHaveBeenCalled();
});
