import React from "react";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useRecordImport } from "../hooks/useRecordImport";
import { useFormStore } from "../hooks/useFormStore";
import { ToastProvider } from "../components/Toast";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);
function pendingFile() {
  let resolve!: (text: string) => void;
  const pending = new Promise<string>((done) => {
    resolve = done;
  });
  const file = { name: "synthetic.json", size: 60, text: () => pending } as File;
  return { file, resolve };
}
beforeEach(() =>
  useFormStore.setState({
    state: "CA",
    version: "10",
    subfileType: "DL",
    fields: { DCS: "BEFORE" },
    sourcePayload: null,
    _history: [],
    _future: []
  })
);

describe("asynchronous record import", () => {
  it("cannot replace edits made while a file is being read", async () => {
    const deferred = pendingFile();
    const { result } = renderHook(useRecordImport, { wrapper });
    let work!: Promise<void>;
    act(() => {
      work = result.current(deferred.file);
    });
    act(() => useFormStore.getState().setField("DCS", "NEWER EDIT"));
    await act(async () => {
      deferred.resolve('{"DCS":"LATE FILE"}');
      await work;
    });
    expect(useFormStore.getState().fields.DCS).toBe("NEWER EDIT");
  });
  it("cannot restore a record after the import surface unmounts", async () => {
    const deferred = pendingFile();
    const { result, unmount } = renderHook(useRecordImport, { wrapper });
    let work!: Promise<void>;
    act(() => {
      work = result.current(deferred.file);
    });
    unmount();
    await act(async () => {
      deferred.resolve('{"DCS":"LATE FILE"}');
      await work;
    });
    expect(useFormStore.getState().fields.DCS).toBe("BEFORE");
  });
  it("only applies the newest selected file, even if the first finishes last", async () => {
    const first = pendingFile(),
      second = pendingFile();
    const { result } = renderHook(useRecordImport, { wrapper });
    let older!: Promise<void>, newer!: Promise<void>;
    act(() => {
      older = result.current(first.file);
      newer = result.current(second.file);
    });
    await act(async () => {
      second.resolve('{"subfileType":"ID","DCS":"NEW FILE"}');
      await newer;
    });
    await act(async () => {
      first.resolve('{"DCS":"OLD FILE"}');
      await older;
    });
    expect(useFormStore.getState()).toMatchObject({
      subfileType: "ID",
      fields: { DCS: "NEW FILE" }
    });
    act(() => useFormStore.getState().undo());
    expect(useFormStore.getState()).toMatchObject({ subfileType: "DL", fields: { DCS: "BEFORE" } });
  });
});

it("rehydrates only valid preferences, never injected identity, history, or actions", async () => {
  localStorage.setItem(
    "aamva_form_prefs_v2",
    JSON.stringify({
      state: {
        state: "ZZ",
        version: "99",
        subfileType: "XX",
        fields: { DCS: "DISK DATA" },
        sourcePayload: "DISK BYTES",
        _history: [{ fields: { DCS: "OLD" } }],
        setField: "not a function",
        inspectorWidth: -500,
        theme: "dark"
      },
      version: 0
    })
  );
  await act(async () => {
    await useFormStore.persist.rehydrate();
  });
  const state = useFormStore.getState();
  expect(state).toMatchObject({
    state: "CA",
    version: "10",
    subfileType: "DL",
    fields: { DCS: "BEFORE" },
    sourcePayload: null,
    _history: [],
    inspectorWidth: 280,
    theme: "dark"
  });
  expect(typeof state.setField).toBe("function");
});
