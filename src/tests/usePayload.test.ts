import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePayload } from "../hooks/usePayload";
import { useFormStore } from "../hooks/useFormStore";
import { decodeAAMVA } from "../core/decoder";

/** A complete CA v10 form, minus the fields the app fills in for the user. */
const CA_FORM: Record<string, string> = {
  DCA: "C",
  DCB: "NONE",
  DCD: "NONE",
  DBA: "01012029",
  DCS: "DOE",
  DAC: "JANE",
  DAD: "Q",
  DBD: "01012024",
  DBB: "02151990",
  DBC: "2",
  DAY: "BRO",
  DAU: "067 IN",
  DAG: "123 SAMPLE ST",
  DAI: "SAN FRANCISCO",
  DAJ: "CA",
  DAK: "94110",
  DAQ: "D1234567",
  DCG: "USA",
  DDE: "N",
  DDF: "N",
  DDG: "N"
};

function setForm(fields: Record<string, string>) {
  act(() => {
    useFormStore.setState({ state: "CA", version: "10", strictMode: true, fields });
  });
}

describe("usePayload", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useFormStore.setState({
      state: "CA",
      version: "10",
      strictMode: true,
      subfileType: "DL",
      fields: {}
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Runs the debounce timer and returns the settled payload. */
  async function settle(result: { current: { payload: string; error: string | null } }) {
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    return result.current;
  }

  it("keeps the auto-generated discriminator stable across edits", async () => {
    // The generator minted a new DCF on every debounced re-encode, so the
    // document discriminator inside the barcode changed on every keystroke and
    // two exports of an unchanged form disagreed.
    setForm({ ...CA_FORM });
    const { result } = renderHook(() => usePayload());

    const first = await settle(result);
    const firstDcf = decodeAAMVA(first.payload).json?.DCF;
    expect(firstDcf).toBeTruthy();

    setForm({ ...CA_FORM, DAI: "OAKLAND" });
    const second = await settle(result);

    expect(decodeAAMVA(second.payload).json?.DCF).toBe(firstDcf);
    expect(second.payload).not.toBe(first.payload); // the city really did change
  });

  it("never invents the customer ID number", async () => {
    const withoutDaq = { ...CA_FORM };
    delete withoutDaq.DAQ;
    setForm(withoutDaq);

    const { result } = renderHook(() => usePayload());
    const settled = await settle(result);

    expect(settled.payload).toBe("");
    expect(settled.error).toMatch(/Customer ID Number \(DAQ\)/);
  });

  it("uses the user's own discriminator when they supply one", async () => {
    setForm({ ...CA_FORM, DCF: "MYOWNVALUE1" });
    const { result } = renderHook(() => usePayload());

    const settled = await settle(result);

    expect(decodeAAMVA(settled.payload).json?.DCF).toBe("MYOWNVALUE1");
  });

  it("reports staleness until the debounce settles", async () => {
    setForm({ ...CA_FORM });
    const { result } = renderHook(() => usePayload());
    expect(result.current.stale).toBe(true);

    await settle(result);
    expect(result.current.stale).toBe(false);
  });
});
