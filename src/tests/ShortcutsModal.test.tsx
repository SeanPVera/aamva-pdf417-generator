import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ShortcutsModal } from "../components/ShortcutsModal";

describe("ShortcutsModal", () => {
  it("does not render when open is false", () => {
    render(<ShortcutsModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders correctly when open with proper title and aria-label on close button", () => {
    render(<ShortcutsModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Keyboard Shortcuts" })).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: "Close shortcuts" });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAttribute("title", "Close shortcuts");
    expect(closeButton).toHaveAttribute("aria-label", "Close shortcuts");
  });

  it("calls onClose when close button is clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<ShortcutsModal open={true} onClose={handleClose} />);

    const closeButton = screen.getByRole("button", { name: "Close shortcuts" });
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
