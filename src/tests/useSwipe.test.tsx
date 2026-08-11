import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import { render, act } from "@testing-library/react";
import { useSwipe } from "../hooks/useSwipe";

/**
 * The `pointercancel` listener was registered with an inline arrow, so the
 * cleanup could not remove it. App.tsx passes freshly-created handlers on every
 * render, which re-runs the effect and left another listener behind each time —
 * on an element that re-renders on every keystroke.
 */
describe("useSwipe listener lifecycle", () => {
  const originalAdd = HTMLElement.prototype.addEventListener;
  const originalRemove = HTMLElement.prototype.removeEventListener;

  afterEach(() => {
    HTMLElement.prototype.addEventListener = originalAdd;
    HTMLElement.prototype.removeEventListener = originalRemove;
  });

  // Scoped to the <main> the hook attaches to: React delegates its own pointer
  // events on the container element, which would otherwise be counted too.
  function countPointerListeners() {
    const added: string[] = [];
    const removed: string[] = [];
    HTMLElement.prototype.addEventListener = function (type: string, ...rest: never[]) {
      if (this.tagName === "MAIN" && type.startsWith("pointer")) added.push(type);
      return originalAdd.call(this, type, ...(rest as never[]));
    } as typeof originalAdd;
    HTMLElement.prototype.removeEventListener = function (type: string, ...rest: never[]) {
      if (this.tagName === "MAIN" && type.startsWith("pointer")) removed.push(type);
      return originalRemove.call(this, type, ...(rest as never[]));
    } as typeof originalRemove;
    return { added, removed };
  }

  it("removes every listener it added when the handlers change identity", () => {
    const { added, removed } = countPointerListeners();

    // Inline arrows, exactly as a careless caller would write them.
    const Harness: React.FC<{ tick: number }> = ({ tick }) => {
      const ref = useSwipe<HTMLElement>({
        onSwipeLeft: () => {},
        onSwipeRight: () => {}
      });
      return <main ref={ref as React.RefObject<HTMLElement>}>{tick}</main>;
    };

    const { rerender, unmount } = render(<Harness tick={0} />);
    for (let i = 1; i <= 10; i++) act(() => rerender(<Harness tick={i} />));
    act(() => unmount());

    expect(added.length).toBeGreaterThan(0);
    expect(removed.sort()).toEqual(added.sort());
  });

  it("does not re-subscribe when the handlers are stable", () => {
    const noop = () => {};
    const { added } = countPointerListeners();

    const Harness: React.FC<{ tick: number }> = ({ tick }) => {
      const ref = useSwipe<HTMLElement>({ onSwipeLeft: noop, onSwipeRight: noop });
      return <main ref={ref as React.RefObject<HTMLElement>}>{tick}</main>;
    };

    const { rerender } = render(<Harness tick={0} />);
    const afterMount = added.length;
    for (let i = 1; i <= 10; i++) act(() => rerender(<Harness tick={i} />));

    expect(added.length).toBe(afterMount);
  });
});
