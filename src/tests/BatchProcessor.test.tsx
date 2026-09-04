import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { BatchProcessor } from "../components/BatchProcessor";

// The ring goes on the label because that is the visible target; the checkbox
// inside it is 3.5 units square. It is driven by the child's :focus-visible so
// it stays off for pointer users — :focus-within would also fire on a click,
// since Chromium focuses a checkbox when you click it.
describe("BatchProcessor — strict validation checkbox", () => {
  test("its label rings on keyboard focus, and only once", () => {
    render(<BatchProcessor open onClose={vi.fn()} />);

    const checkbox = screen.getByRole("checkbox");
    const label = checkbox.closest("label");

    expect(label).toHaveClass("has-[:focus-visible]:ring-2");
    expect(label).toHaveClass("has-[:focus-visible]:ring-brand-500");
    expect(label).not.toHaveClass("focus-within:ring-2");

    // A ring on the label plus a ring on the input inside it draws twice.
    expect(checkbox).not.toHaveClass("focus-visible:ring-2");
  });
});
