import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScanInput } from "@/components/ScanInput";

describe("<ScanInput>", () => {
  it("fires onScan with trimmed value when Enter is pressed", () => {
    const onScan = vi.fn();
    render(<ScanInput onScan={onScan} />);
    const input = screen.getByPlaceholderText(/scan or type/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  C0000101  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onScan).toHaveBeenCalledWith("C0000101");
  });

  it("does not fire on empty submission", () => {
    const onScan = vi.fn();
    render(<ScanInput onScan={onScan} />);
    const input = screen.getByPlaceholderText(/scan or type/i) as HTMLInputElement;
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onScan).not.toHaveBeenCalled();
  });

  it("clears input after firing", () => {
    const onScan = vi.fn();
    render(<ScanInput onScan={onScan} />);
    const input = screen.getByPlaceholderText(/scan or type/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "C0000101" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input.value).toBe("");
  });

  it("does not steal focus from other editable controls", () => {
    const onScan = vi.fn();
    render(
      <div>
        <select aria-label="Asset class">
          <option value="compute">compute</option>
        </select>
        <textarea aria-label="Manual note" />
        <ScanInput onScan={onScan} />
      </div>,
    );

    const select = screen.getByLabelText("Asset class");
    select.focus();
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(document.activeElement).toBe(select);

    const textarea = screen.getByLabelText("Manual note");
    textarea.focus();
    fireEvent.keyDown(window, { key: "A" });
    expect(document.activeElement).toBe(textarea);
    expect(onScan).not.toHaveBeenCalled();
  });
});
