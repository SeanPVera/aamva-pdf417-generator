import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import React from "react";
import { CompareView } from "../components/CompareView";
import { ToastProvider } from "../components/Toast";

function renderCompareView() {
  const onClose = vi.fn();
  const result = render(
    <ToastProvider>
      <CompareView open onClose={onClose} />
    </ToastProvider>
  );
  return { ...result, onClose };
}

/** Drives the hidden file input for one side, as the Load button would. */
async function loadPayload(side: "A" | "B", name: string, data: Record<string, string>) {
  const input = screen.getByLabelText(`Load JSON payload ${side}`) as HTMLInputElement;
  const file = new File([JSON.stringify(data)], name, { type: "application/json" });
  // jsdom's File.text() is not implemented in every version; pin it to the payload.
  Object.defineProperty(file, "text", { value: async () => JSON.stringify(data) });
  fireEvent.change(input, { target: { files: [file] } });
  await screen.findByText(name);
}

describe("CompareView clear payload", () => {
  test("no clear button is offered until a payload is loaded", () => {
    renderCompareView();
    expect(screen.queryByRole("button", { name: "Clear payload A" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear payload B" })).not.toBeInTheDocument();
    expect(screen.getAllByText("No file selected")).toHaveLength(2);
  });

  test("clearing side A leaves side B loaded", async () => {
    renderCompareView();
    await loadPayload("A", "a.json", { DCS: "SMITH" });
    await loadPayload("B", "b.json", { DCS: "JONES" });

    fireEvent.click(screen.getByRole("button", { name: "Clear payload A" }));

    await waitFor(() => expect(screen.queryByText("a.json")).not.toBeInTheDocument());
    expect(screen.getByText("b.json")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear payload A" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear payload B" })).toBeInTheDocument();
  });

  test("clearing both sides returns the empty prompt", async () => {
    renderCompareView();
    await loadPayload("A", "a.json", { DCS: "SMITH" });
    await loadPayload("B", "b.json", { DCS: "JONES" });

    fireEvent.click(screen.getByRole("button", { name: "Clear payload A" }));
    await waitFor(() => expect(screen.queryByText("a.json")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Clear payload B" }));

    await screen.findByText("Load two JSON payloads to compare them side by side.");
    expect(screen.getAllByText("No file selected")).toHaveLength(2);
  });

  test("a cleared side can be reloaded", async () => {
    renderCompareView();
    await loadPayload("A", "a.json", { DCS: "SMITH" });

    fireEvent.click(screen.getByRole("button", { name: "Clear payload A" }));
    await waitFor(() => expect(screen.queryByText("a.json")).not.toBeInTheDocument());

    await loadPayload("A", "second.json", { DCS: "TAYLOR" });
    expect(screen.getByRole("button", { name: "Clear payload A" })).toBeInTheDocument();
  });

  test("loads active form data into comparison side", async () => {
    renderCompareView();
    const btnA = screen.getByRole("button", { name: "Use active form for payload A" });
    expect(btnA).toBeInTheDocument();

    fireEvent.click(btnA);

    await screen.findByText("Active Form (CA v10)");
    expect(screen.getByRole("button", { name: "Clear payload A" })).toBeInTheDocument();
  });

  test("clearing does not close the dialog", async () => {
    const { onClose } = renderCompareView();
    await loadPayload("A", "a.json", { DCS: "SMITH" });

    fireEvent.click(screen.getByRole("button", { name: "Clear payload A" }));

    await waitFor(() => expect(screen.queryByText("a.json")).not.toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
  });

  test("clear button includes title tooltip matching aria-label", async () => {
    renderCompareView();
    await loadPayload("A", "a.json", { DCS: "SMITH" });

    const clearBtn = screen.getByRole("button", { name: "Clear payload A" });
    expect(clearBtn).toHaveAttribute("title", "Clear payload A");
  });

  test("filters to show differences only and provides empty state when all match", async () => {
    renderCompareView();
    await loadPayload("A", "a.json", { DCS: "SMITH", DAC: "JOHN" });
    await loadPayload("B", "b.json", { DCS: "SMITH", DAC: "JANE" });

    expect(screen.getAllByText("SMITH")).toHaveLength(2);
    expect(screen.getByText("JOHN")).toBeInTheDocument();
    expect(screen.getByText("JANE")).toBeInTheDocument();

    const diffCheckbox = screen.getByLabelText("Show differences only");
    expect(diffCheckbox).not.toBeChecked();

    fireEvent.click(diffCheckbox);
    expect(diffCheckbox).toBeChecked();

    // DCS matches, so it should be hidden
    expect(screen.queryByText("SMITH")).not.toBeInTheDocument();
    // DAC differs, so it should still be present
    expect(screen.getByText("JOHN")).toBeInTheDocument();
    expect(screen.getByText("JANE")).toBeInTheDocument();

    // Now clear B and load identical data
    fireEvent.click(screen.getByRole("button", { name: "Clear payload B" }));
    await loadPayload("B", "identical.json", { DCS: "SMITH", DAC: "JOHN" });

    // With diff only enabled and identical data, empty state is displayed
    const dialog = screen.getByRole("dialog");
    const emptyStatus = dialog.querySelector('p[role="status"]');
    expect(emptyStatus).toBeInTheDocument();
    expect(emptyStatus).toHaveTextContent("No differences found between Payload A and Payload B.");
  });
});
