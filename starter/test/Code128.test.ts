import { describe, expect, it } from "vitest";
import { code128Svg } from "@/lib/code128";

describe("code128Svg", () => {
  it("escapes the aria-label while preserving encodable values", () => {
    const svg = code128Svg('A"&<>');

    expect(svg).toContain('aria-label="A&quot;&amp;&lt;&gt;"');
    expect(svg).not.toContain('aria-label="A"&<>');
    expect(svg).toContain("<rect");
  });

  it("rejects values outside Code128-B", () => {
    expect(() => code128Svg("C0009001\n")).toThrow("Code128-B cannot encode");
  });
});
