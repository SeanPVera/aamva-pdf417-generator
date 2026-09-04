import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import React from "react";
import { FieldInput } from "../components/FieldInput";
import type { AAMVAField } from "../core/schema";

const SEX: AAMVAField = { code: "DBC", label: "Sex", type: "char", required: true };
const NAME: AAMVAField = {
  code: "DCS",
  label: "Customer Family Name",
  type: "string",
  required: true
};

function renderField(field: AAMVAField, value = "") {
  const onChange = vi.fn();
  const utils = render(
    <FieldInput
      field={field}
      value={value}
      state="CA"
      strictMode={false}
      copied={false}
      onChange={onChange}
      onCopy={vi.fn()}
      onReset={vi.fn()}
      onGenerate={vi.fn()}
    />
  );
  return { ...utils, onChange };
}

// The popover used to close only on the help button's own `blur`, which never
// fires in browsers that don't focus a button on click — so the boxes stacked
// up over the form and stayed there. Each of these is a dismissal path a user
// actually takes.
describe("FieldInput — field help popover", () => {
  test("opens on click and closes on the next click", () => {
    renderField(SEX);
    const button = screen.getByRole("button", { name: /show help for DBC/i });

    fireEvent.click(button);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("button", { name: /hide help for DBC/i }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("closes on a pointer press outside it", () => {
    renderField(SEX);
    fireEvent.click(screen.getByRole("button", { name: /show help for DBC/i }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("stays open for a pointer press inside it", () => {
    renderField(SEX);
    fireEvent.click(screen.getByRole("button", { name: /show help for DBC/i }));
    const tooltip = screen.getByRole("tooltip");

    // Selecting the help text must not dismiss the thing being read.
    fireEvent.pointerDown(tooltip);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  test("closes on Escape and returns focus to the help button", () => {
    renderField(SEX);
    const button = screen.getByRole("button", { name: /show help for DBC/i });
    fireEvent.click(button);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /show help for DBC/i }));
  });

  test("closes when the form scrolls out from under it", () => {
    renderField(SEX);
    fireEvent.click(screen.getByRole("button", { name: /show help for DBC/i }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.scroll(document);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("the popover's own close button dismisses it", () => {
    renderField(SEX);
    fireEvent.click(screen.getByRole("button", { name: /show help for DBC/i }));

    fireEvent.click(screen.getByRole("button", { name: /close help for DBC/i }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("explains the sex coding rather than repeating the label", () => {
    renderField(SEX);
    fireEvent.click(screen.getByRole("button", { name: /show help for DBC/i }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(/1 = male/i);
    expect(screen.getByRole("tooltip")).toHaveTextContent(/9 = not specified/i);
  });

  test("fields with no help entry get no help button", () => {
    renderField(NAME);
    expect(screen.queryByRole("button", { name: /help for DCS/i })).not.toBeInTheDocument();
  });
});

describe("FieldInput — enumerated fields", () => {
  test("Sex (DBC) is a 1 / 2 / 9 selector with definitions on the chips", () => {
    renderField(SEX);
    const male = screen.getByRole("radio", { name: /sex of record: male/i });
    const female = screen.getByRole("radio", { name: /sex of record: female/i });
    const unspecified = screen.getByRole("radio", { name: /not specified/i });
    expect(male).toHaveAttribute("title", expect.stringMatching(/barcode/i));
    expect(female).toHaveAttribute("aria-checked", "false");
    expect(unspecified).toHaveAttribute("title", expect.stringMatching(/not a third sex/i));
  });

  test("picking a Sex chip writes the AAMVA code", () => {
    const { onChange } = renderField(SEX);
    fireEvent.click(screen.getByRole("radio", { name: /sex of record: male/i }));
    expect(onChange).toHaveBeenCalledWith("DBC", "1");
  });

  test("REAL ID / Compliance Type is F / N with what those letters mean", () => {
    const { onChange } = renderField({
      code: "DDA",
      label: "REAL ID / Compliance Type",
      type: "string"
    });
    const realId = screen.getByRole("radio", { name: /meets the REAL ID Act/i });
    const limits = screen.getByRole("radio", { name: /FEDERAL LIMITS APPLY/i });
    expect(realId).toHaveAttribute("title", expect.stringMatching(/TSA/i));
    expect(limits).toHaveAttribute("title", expect.stringMatching(/not a REAL ID/i));
    expect(screen.getByRole("radio", { name: /omit this element/i })).toBeInTheDocument();
    fireEvent.click(realId);
    expect(onChange).toHaveBeenCalledWith("DDA", "F");
  });

  test("a long enumerated list stays a select, with omit when optional", () => {
    renderField({
      code: "DAY",
      label: "Eye Color",
      type: "string",
      required: true
    });
    const select = screen.getByRole("combobox");
    expect(select.className).not.toContain("text-transparent");
    expect(screen.getByRole("option", { name: /select/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /BRO/i })).toBeInTheDocument();
  });
});
