import { describe, expect, it } from "vitest";
import { code128Svg } from "@/lib/code128";
import { qrSvg } from "@/lib/qr";

describe("code128Svg", () => {
  it("escapes the aria-label while preserving encodable values", () => {
    const svg = code128Svg('A"&<>');

    expect(svg).toContain('aria-label="A&quot;&amp;&lt;&gt;"');
    expect(svg).not.toContain('aria-label="A"&<>');
    expect(svg).toContain('width="');
    expect(svg).toContain('height="');
    expect(svg).toContain("<rect");
  });

  it("rejects values outside Code128-B", () => {
    expect(() => code128Svg("C0009001\n")).toThrow("Code128-B cannot encode");
  });

  it("creates QR SVGs for long location payloads", async () => {
    const svg = await qrSvg("Lab-Building-A/Bay-12/Aisle-3/B-04/U21");

    expect(svg).toContain("<svg");
    expect(svg).toContain("<path");
  });
});
